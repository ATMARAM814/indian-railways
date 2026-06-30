const pool = require("../../config/database");

async function getAllStations() {
  const query = `
    SELECT
      id,
      station_code,
      station_name
    FROM stations
    ORDER BY station_code;
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getStationStaff(stationId) {
  const query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.phone,
      p.designation,
      p.status,
      sc.category_code,
      r.name as role
    FROM staff_station_postings ssp
    JOIN profiles p
      ON p.id = ssp.profile_id
    LEFT JOIN employee_categories ec
      ON ec.profile_id = p.id
    LEFT JOIN staff_categories sc
      ON sc.id = ec.category_id
    JOIN roles r
      ON r.id = p.role_id
    WHERE ssp.station_id = $1
      AND ssp.is_current = true
    ORDER BY p.designation, p.full_name;
  `;

  const result = await pool.query(query, [stationId]);

  return result.rows;
}

async function getStationStaffSummary(stationId) {
  const query = `
    SELECT
      COUNT(*) as total_staff,
      COUNT(*) FILTER (WHERE r.name = 'SM') as total_sm,
      COUNT(*) FILTER (WHERE r.name = 'PM') as total_pm,
      COUNT(*) FILTER (WHERE sc.category_code = 'A') as category_a,
      COUNT(*) FILTER (WHERE sc.category_code = 'B') as category_b,
      COUNT(*) FILTER (WHERE sc.category_code = 'C') as category_c,
      COUNT(*) FILTER (WHERE sc.category_code = 'D') as category_d
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN employee_categories ec ON ec.profile_id = p.id
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.station_id = $1
      AND ssp.is_current = true;
  `;

  const result = await pool.query(query, [stationId]);
  return result.rows[0];
}

async function getStationStaffGrouped(stationId) {
  const staff = await getStationStaff(stationId);

  const stationMasters = staff.filter(
    (person) => person.role === "SM"
  );

  const pointsmen = staff.filter(
    (person) => person.role === "PM"
  );

  return {
    stationMasters,
    pointsmen,
  };
}

async function getAllDivisions() {
  const query = `
    SELECT id, name, code, zone
    FROM divisions
    ORDER BY name;
  `;
  const result = await pool.query(query);
  return result.rows;
}

// ==========================================
// STATION INTELLIGENCE NEW QUERIES
// ==========================================

async function getTiStations(profileId) {
  const query = `
    SELECT station_id
    FROM station_assignments
    WHERE profile_id = $1
      AND assignment_type = 'TI_AREA'
      AND assigned_to IS NULL;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows.map((row) => row.station_id);
}

async function getAomDivision(profileId) {
  const query = `
    SELECT division_id
    FROM division_assignments
    WHERE profile_id = $1 AND is_current = true
    LIMIT 1;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0] ? result.rows[0].division_id : null;
}

async function getStationsListDb(userId, role, filters) {
  const conditions = [];
  const values = [];

  if (role === 'TI') {
    values.push(userId);
    conditions.push(`s.id = ANY(
      SELECT station_id FROM station_assignments 
      WHERE profile_id = $${values.length} AND assignment_type = 'TI_AREA' AND assigned_to IS NULL
    )`);
  } else if (role === 'AOM') {
    values.push(userId);
    conditions.push(`s.division_id = (
      SELECT division_id FROM division_assignments 
      WHERE profile_id = $${values.length} AND is_current = true LIMIT 1
    )`);
  }

  if (filters.stationName) {
    values.push(`%${filters.stationName}%`);
    conditions.push(`s.station_name ILIKE $${values.length}`);
  }
  if (filters.stationCode) {
    values.push(`%${filters.stationCode}%`);
    conditions.push(`s.station_code ILIKE $${values.length}`);
  }
  if (filters.assignedTI) {
    values.push(`%${filters.assignedTI}%`);
    conditions.push(`ti.full_name ILIKE $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      s.id as "id",
      s.id as "stationId",
      s.station_name as "station_name",
      s.station_name as "stationName",
      s.station_code as "station_code",
      s.station_code as "stationCode",
      ti.full_name as "assignedTI",
      ti.id as "assignedTiId",
      COUNT(DISTINCT p.id)::int as "totalStaff",
      CASE 
        WHEN COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code IN ('A', 'B', 'C', 'D')) > 0
        THEN ROUND((COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code IN ('A', 'B'))::float / COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code IN ('A', 'B', 'C', 'D'))::float * 100)::numeric, 0)
        ELSE 100
      END::int as "safetyCompliance",
      COALESCE(pending_counts.count, 0)::int as "pendingAssessments",
      EXISTS (
        SELECT 1 FROM staff_station_postings ssp_sms
        JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
        JOIN roles r_sms ON r_sms.id = p_sms.role_id
        WHERE ssp_sms.station_id = s.id 
          AND ssp_sms.is_current = true 
          AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
      ) as "hasSupervisor"
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN station_assignments sa ON sa.station_id = s.id AND sa.assignment_type = 'TI_AREA' AND sa.assigned_to IS NULL
    LEFT JOIN profiles ti ON ti.id = sa.profile_id
    LEFT JOIN (
      SELECT ssp_inner.station_id, COUNT(DISTINCT a.id) as count
      FROM assessments a
      JOIN staff_station_postings ssp_inner ON ssp_inner.profile_id = a.assessed_user_id AND ssp_inner.is_current = true
      WHERE a.status IN ('scheduled', 'mcq_access_sent', 'mcq_pending', 'mcq_submitted', 'evaluation_pending', 'evaluation_submitted', 'created') 
         OR (a.status = 'completed' AND a.approval_status = 'pending_approval')
      GROUP BY ssp_inner.station_id
    ) pending_counts ON pending_counts.station_id = s.id
    ${whereClause}
    GROUP BY s.id, s.station_name, s.station_code, ti.full_name, ti.id, pending_counts.count
    ORDER BY s.station_code;
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function getStationSummaryDb(stationId) {
  const query = `
    SELECT 
      s.id as "stationId", 
      s.station_name as "stationName", 
      s.station_code as "stationCode", 
      d.name as "divisionName", 
      d.code as "divisionCode"
    FROM stations s
    JOIN divisions d ON d.id = s.division_id
    WHERE s.id = $1;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows[0] || null;
}

async function getStationAssignedTIDb(stationId) {
  const query = `
    SELECT p.id, p.full_name as "fullName", p.hrms_id as "hrmsId", p.phone, p.email
    FROM station_assignments sa
    JOIN profiles p ON p.id = sa.profile_id
    WHERE sa.station_id = $1 
      AND sa.assignment_type = 'TI_AREA' 
      AND sa.assigned_to IS NULL
    LIMIT 1;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows[0] || null;
}

async function getStationOverviewStatsDb(stationId) {
  const query = `
    SELECT
      COUNT(DISTINCT p.id)::int as "totalWorkforce",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryDStaff",
      -- pending assessments
      (
        SELECT COUNT(DISTINCT a.id)::int 
        FROM assessments a
        JOIN staff_station_postings ssp_inner ON ssp_inner.profile_id = a.assessed_user_id AND ssp_inner.is_current = true
        WHERE ssp_inner.station_id = $1
          AND (
            a.status IN ('scheduled', 'mcq_access_sent', 'mcq_pending', 'mcq_submitted', 'evaluation_pending', 'evaluation_submitted', 'created') 
            OR (a.status = 'completed' AND a.approval_status = 'pending_approval')
          )
      ) as "pendingAssessments",
      -- completed assessments
      (
        SELECT COUNT(DISTINCT a.id)::int 
        FROM assessments a
        JOIN staff_station_postings ssp_inner ON ssp_inner.profile_id = a.assessed_user_id AND ssp_inner.is_current = true
        WHERE ssp_inner.station_id = $1
          AND a.status = 'completed' AND a.approval_status = 'approved'
      ) as "completedAssessments",
      -- compliance count
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code IN ('A', 'B'))::int as safe_count,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code IN ('A', 'B', 'C', 'D'))::int as categorized_count,
      -- high risk count
      COUNT(DISTINCT p.id) FILTER (
        WHERE sc.category_code = 'D' OR p.id IN (
          SELECT assessed_user_id FROM assessments WHERE status = 'completed' AND percentage <= 25
        )
      )::int as "highRiskStaff"
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.station_id = $1 AND ssp.is_current = true;
  `;
  const result = await pool.query(query, [stationId]);
  const row = result.rows[0];
  if (!row) return null;

  const safe = Number(row.safe_count || 0);
  const totalCat = Number(row.categorized_count || 0);
  const safetyCompliance = totalCat > 0 ? Math.round((safe / totalCat) * 100) : 100;

  return {
    totalWorkforce: row.totalWorkforce,
    pendingAssessments: row.pendingAssessments,
    completedAssessments: row.completedAssessments,
    safetyCompliance,
    highRiskStaff: row.highRiskStaff,
    categoryDStaff: row.categoryDStaff
  };
}

async function getStationCategoryDistributionDb(stationId) {
  const query = `
    SELECT 
      COALESCE(sc.category_code, 'Unassigned') as name,
      COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.station_id = $1 AND ssp.is_current = true
    GROUP BY sc.category_code;
  `;
  const result = await pool.query(query, [stationId]);
  const categories = { A: 0, B: 0, C: 0, D: 0 };
  result.rows.forEach(r => {
    if (categories[r.name] !== undefined) {
      categories[r.name] = Number(r.count);
    }
  });
  return Object.keys(categories).map(key => ({
    name: `Category ${key}`,
    count: categories[key]
  }));
}

async function getStationRiskDistributionDb(stationId) {
  const query = `
    SELECT 
      p.id,
      sc.category_code,
      lca.percentage as latest_score
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT percentage FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE ssp.station_id = $1 AND ssp.is_current = true;
  `;
  const result = await pool.query(query, [stationId]);
  const segments = { "Low Risk": 0, "Medium Risk": 0, "High Risk": 0, "Critical Risk": 0 };

  result.rows.forEach(row => {
    if (row.category_code === 'D') {
      segments["Critical Risk"]++;
    } else if (row.latest_score !== null && Number(row.latest_score) < 60) {
      segments["High Risk"]++;
    } else if (row.category_code === 'B' || row.category_code === 'C') {
      segments["Medium Risk"]++;
    } else {
      segments["Low Risk"]++;
    }
  });

  return Object.keys(segments).map(key => ({
    name: key,
    value: segments[key]
  }));
}

async function getStationPerformanceTrendDb(stationId) {
  const query = `
    SELECT 
      TO_CHAR(a.created_at, 'Mon YYYY') as month,
      DATE_TRUNC('month', a.created_at) as month_date,
      COALESCE(AVG(a.percentage) FILTER (WHERE a.status = 'completed' AND a.approval_status = 'approved'), 0)::numeric(10,2) as avg_score,
      COUNT(a.id) FILTER (WHERE a.status = 'completed' AND a.approval_status = 'approved') as completed_count,
      COUNT(a.id) as total_count
    FROM assessments a
    JOIN staff_station_postings ssp ON ssp.profile_id = a.assessed_user_id AND ssp.is_current = true
    WHERE ssp.station_id = $1 
      AND a.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '5 months')
    GROUP BY month, month_date
    ORDER BY month_date ASC;
  `;
  const result = await pool.query(query, [stationId]);
  
  // Calculate dynamic 6 months range
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const tempDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = tempDate.toLocaleString('en-US', { month: 'short' });
    const yStr = tempDate.getFullYear();
    months.push(`${mStr} ${yStr}`);
  }

  return months.map(m => {
    const found = result.rows.find(row => row.month === m);
    let compliance = 100;
    if (found) {
      const tc = Number(found.total_count || 0);
      const cc = Number(found.completed_count || 0);
      compliance = tc > 0 ? Math.round((cc / tc) * 100) : 100;
    }
    return {
      month: m,
      averageScore: found ? parseFloat(found.avg_score) : 0,
      safetyCompliance: compliance
    };
  });
}

async function getStationOperationalReadinessDb(stationId) {
  const pmeQuery = `
    SELECT COUNT(DISTINCT p.id)::int
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN assessments a ON a.assessed_user_id = p.id
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
      AND a.pme_status IS NOT NULL
      AND a.pme_status != ''
      AND (a.due_date < NOW() OR a.pme_status = 'DUE');
  `;
  const refQuery = `
    SELECT COUNT(DISTINCT p.id)::int
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN assessments a ON a.assessed_user_id = p.id
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
      AND a.ref_status IS NOT NULL
      AND a.ref_status != ''
      AND (a.due_date < NOW() OR a.ref_status = 'DUE');
  `;
  const counsellingQuery = `
    SELECT COUNT(DISTINCT p.id)::int
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN assessments a ON a.assessed_user_id = p.id
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
      AND a.counselling_required = true
      AND (a.counselling_status IS NULL OR a.counselling_status != 'completed');
  `;
  const trainingQuery = `
    SELECT COUNT(DISTINCT p.id)::int
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN assessments a ON a.assessed_user_id = p.id
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
      AND a.training_required = true
      AND (a.training_status IS NULL OR a.training_status != 'completed');
  `;

  const [pmeRes, refRes, counsRes, trainRes] = await Promise.all([
    pool.query(pmeQuery, [stationId]),
    pool.query(refQuery, [stationId]),
    pool.query(counsellingQuery, [stationId]),
    pool.query(trainingQuery, [stationId])
  ]);

  return {
    pmeDue: pmeRes.rows[0].count || 0,
    refDue: refRes.rows[0].count || 0,
    counsellingRequired: counsRes.rows[0].count || 0,
    trainingRequired: trainRes.rows[0].count || 0
  };
}

async function getStationWorkforceDb(stationId) {
  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      r.name as "role",
      p.hrms_id as "hrmsId",
      sc.category_code as "category",
      lca.status as "latestStatus",
      lca.approval_status as "latestApprovalStatus",
      lca.percentage as "latestScore",
      lca.evaluated_at as "lastAssessmentDate"
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT status, approval_status, percentage, evaluated_at 
      FROM assessments
      WHERE assessed_user_id = p.id
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
    ORDER BY p.full_name ASC;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function getStationHighRiskWatchlistDb(stationId) {
  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      r.name as "role",
      sc.category_code as "category",
      lca.percentage as "latestScore",
      lca.evaluated_at as "lastAssessmentDate",
      CASE
        WHEN sc.category_code = 'D' THEN 'Category D / Critical Risk'
        WHEN lca.alcoholic_status = 'Alcoholic' THEN 'Alcoholic Status'
        WHEN lca.percentage <= 25 THEN 'Low Assessment Score (<= 25%)'
        ELSE 'Risk Watchlist'
      END as "reason"
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT percentage, evaluated_at, alcoholic_status FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
      AND (sc.category_code = 'D' OR lca.percentage <= 25 OR lca.alcoholic_status = 'Alcoholic')
    ORDER BY lca.percentage ASC NULLS LAST;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function getStationRecentActivitiesDb(stationId) {
  const query = `
    SELECT 
      a.id,
      a.created_at as "timestamp",
      a.action_type as "action",
      a.remarks as "details",
      p.full_name as "performedBy",
      target.full_name as "targetEmployee"
    FROM audit_logs a
    LEFT JOIN profiles p ON p.id = a.performed_by
    LEFT JOIN profiles target ON target.hrms_id = a.target_hrms_id
    WHERE 
      a.performed_by IN (
        SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
      )
      OR a.target_hrms_id IN (
        SELECT p_inner.hrms_id 
        FROM staff_station_postings ssp_inner 
        JOIN profiles p_inner ON p_inner.id = ssp_inner.profile_id 
        WHERE ssp_inner.station_id = $1 AND ssp_inner.is_current = true
      )
      OR a.entity_id IN (
        SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
      )
    ORDER BY a.created_at DESC
    LIMIT 20;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function createStationDb(divisionId, stationName, stationCode) {
  const query = `
    INSERT INTO stations (division_id, station_name, station_code)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await pool.query(query, [divisionId, stationName, stationCode]);
  return result.rows[0];
}

async function assignTiToStationDb(profileId, stationId) {
  const query = `
    INSERT INTO station_assignments (
      profile_id,
      station_id,
      assignment_type,
      is_primary,
      assigned_from,
      assigned_to
    )
    VALUES ($1, $2, 'TI_AREA', true, CURRENT_DATE, NULL)
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId, stationId]);
  return result.rows[0];
}

async function closeCurrentSmPostingDb(profileId) {
  const query = `
    UPDATE staff_station_postings
    SET is_current = false, posted_to = CURRENT_DATE
    WHERE profile_id = $1 AND is_current = true
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows;
}

async function assignSmToStationDb(profileId, stationId) {
  const query = `
    INSERT INTO staff_station_postings (
      profile_id,
      station_id,
      posted_from,
      posted_to,
      is_current,
      posting_type,
      remarks
    )
    VALUES ($1, $2, CURRENT_DATE, NULL, true, 'REGULAR', 'Assigned during station creation')
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId, stationId]);
  return result.rows[0];
}

async function getStationCategoryCWatchlistDb(stationId) {
  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      r.name as "role",
      sc.category_code as "category",
      lca.percentage as "latestScore",
      lca.evaluated_at as "lastAssessmentDate",
      CASE
        WHEN sc.category_code = 'C' THEN 'Category C / Medium Risk'
        WHEN lca.mcq_score < 15 OR lca.alertness_score < 15 THEN 'Score < 60% in Critical Parameter(s)'
        WHEN lca.percentage >= 26 AND lca.percentage < 50 THEN 'Medium Assessment Score (26-49%)'
        ELSE 'Medium Risk Watchlist'
      END as "reason"
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT percentage, evaluated_at, alcoholic_status, mcq_score, alertness_score FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
      AND (
        sc.category_code = 'C' 
        OR 
        (
          COALESCE(lca.alcoholic_status, '') != 'Alcoholic' 
          AND COALESCE(lca.percentage, 0) > 25 
          AND (COALESCE(lca.mcq_score, 0) < 15 OR COALESCE(lca.alertness_score, 0) < 15 OR (lca.percentage >= 26 AND lca.percentage < 50))
        )
      )
    ORDER BY lca.percentage ASC NULLS LAST;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function getDivisionCategoryCandidatesDb(divisionId, categoryCode) {
  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      r.name as "role",
      sc.category_code as "category",
      lca.percentage as "latestScore",
      lca.evaluated_at as "lastAssessmentDate",
      s.station_name as "stationName"
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT percentage, evaluated_at, alcoholic_status, mcq_score, alertness_score FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE s.division_id = $1 
      AND ssp.is_current = true
      AND (
        ($2 = 'C' AND (
          sc.category_code = 'C' 
          OR 
          (
            COALESCE(lca.alcoholic_status, '') != 'Alcoholic' 
            AND COALESCE(lca.percentage, 0) > 25 
            AND (COALESCE(lca.mcq_score, 0) < 15 OR COALESCE(lca.alertness_score, 0) < 15 OR (lca.percentage >= 26 AND lca.percentage < 50))
          )
        ))
        OR
        ($2 = 'D' AND (
          sc.category_code = 'D' 
          OR COALESCE(lca.percentage, 0) <= 25 
          OR COALESCE(lca.alcoholic_status, '') = 'Alcoholic'
        ))
      )
    ORDER BY lca.percentage ASC NULLS LAST, p.full_name ASC;
  `;
  const result = await pool.query(query, [divisionId, categoryCode]);
  return result.rows;
}

async function getTiCategoryCandidatesDb(stationIds, categoryCode) {
  if (!stationIds || stationIds.length === 0) return [];
  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      r.name as "role",
      sc.category_code as "category",
      lca.percentage as "latestScore",
      lca.evaluated_at as "lastAssessmentDate",
      s.station_name as "stationName"
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT percentage, evaluated_at, alcoholic_status, mcq_score, alertness_score FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE ssp.station_id = ANY($1) 
      AND ssp.is_current = true
      AND (
        ($2 = 'C' AND (
          sc.category_code = 'C' 
          OR 
          (
            COALESCE(lca.alcoholic_status, '') != 'Alcoholic' 
            AND COALESCE(lca.percentage, 0) > 25 
            AND (COALESCE(lca.mcq_score, 0) < 15 OR COALESCE(lca.alertness_score, 0) < 15 OR (lca.percentage >= 26 AND lca.percentage < 50))
          )
        ))
        OR
        ($2 = 'D' AND (
          sc.category_code = 'D' 
          OR COALESCE(lca.percentage, 0) <= 25 
          OR COALESCE(lca.alcoholic_status, '') = 'Alcoholic'
        ))
      )
    ORDER BY lca.percentage ASC NULLS LAST, p.full_name ASC;
  `;
  const result = await pool.query(query, [stationIds, categoryCode]);
  return result.rows;
}

module.exports = {
  getStationStaff,
  getStationStaffSummary,
  getStationStaffGrouped,
  getAllDivisions,
  getTiStations,
  getAomDivision,
  getStationsListDb,
  getStationSummaryDb,
  getStationAssignedTIDb,
  getStationOverviewStatsDb,
  getStationCategoryDistributionDb,
  getStationRiskDistributionDb,
  getStationPerformanceTrendDb,
  getStationOperationalReadinessDb,
  getStationWorkforceDb,
  getStationHighRiskWatchlistDb,
  getStationCategoryCWatchlistDb,
  getDivisionCategoryCandidatesDb,
  getTiCategoryCandidatesDb,
  getStationRecentActivitiesDb,
  createStationDb,
  assignTiToStationDb,
  closeCurrentSmPostingDb,
  assignSmToStationDb
};