const pool = require("../../config/database");

// ==========================================
// SCOPE / IDENTIFIER HELPERS
// ==========================================

async function getSmStation(profileId) {
  const query = `
    SELECT ssp.station_id, s.station_name, s.station_code
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    WHERE ssp.profile_id = $1 AND ssp.is_current = true
    LIMIT 1;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0];
}

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

// ==========================================
// PM DASHBOARD QUERIES
// ==========================================

async function getPmSummary(profileId) {
  const query = `
    SELECT 
      (
        SELECT percentage 
        FROM assessments 
        WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
        ORDER BY created_at DESC 
        LIMIT 1
      ) as latest_score,
      (
        SELECT sc.category_code
        FROM employee_categories ec
        JOIN staff_categories sc ON sc.id = ec.category_id
        WHERE ec.profile_id = $1
        ORDER BY ec.created_at DESC
        LIMIT 1
      ) as current_category,
      (
        SELECT COUNT(*)::int
        FROM assessments
        WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
      ) as total_assessments,
      (
        SELECT evaluated_at
        FROM assessments
        WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
        ORDER BY created_at DESC
        LIMIT 1
      ) as last_assessment_date;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0];
}

async function getPmPerformanceTrend(profileId) {
  const query = `
    SELECT 
      percentage,
      evaluated_at as "assessmentDate"
    FROM assessments
    WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
    ORDER BY evaluated_at ASC;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows;
}

async function getPmSectionWisePerformance(profileId) {
  const query = `
    SELECT
      AVG(alertness_score)::numeric(10,2) as alertness,
      AVG(safety_record_score)::numeric(10,2) as safety_record,
      AVG(leadership_score)::numeric(10,2) as leadership,
      AVG(discipline_score)::numeric(10,2) as discipline,
      AVG(appearance_score)::numeric(10,2) as appearance
    FROM assessments
    WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved';
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0];
}

async function getPmCategoryHistory(profileId) {
  const query = `
    SELECT
      ec.created_at as date,
      sc.category_code as category
    FROM employee_categories ec
    JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ec.profile_id = $1
    ORDER BY ec.created_at ASC;
  `;
    const result = await pool.query(query, [profileId]);
    return result.rows;
  }

  // ==========================================
  // TM DASHBOARD QUERIES
  // ==========================================

  async function getTmSummary(profileId) {
    const query = `
      SELECT 
        (
          SELECT percentage 
          FROM assessments 
          WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
          ORDER BY created_at DESC 
          LIMIT 1
        ) as latest_score,
        (
          SELECT sc.category_code
          FROM employee_categories ec
          JOIN staff_categories sc ON sc.id = ec.category_id
          WHERE ec.profile_id = $1
          ORDER BY ec.created_at DESC
          LIMIT 1
        ) as current_category,
        (
          SELECT COUNT(*)::int
          FROM assessments
          WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
        ) as total_assessments,
        (
          SELECT evaluated_at
          FROM assessments
          WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
          ORDER BY created_at DESC
          LIMIT 1
        ) as last_assessment_date;
    `;
    const result = await pool.query(query, [profileId]);
    return result.rows[0];
  }

  async function getTmPerformanceTrend(profileId) {
    const query = `
      SELECT 
        percentage,
        evaluated_at as "assessmentDate"
      FROM assessments
      WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
      ORDER BY evaluated_at ASC;
    `;
    const result = await pool.query(query, [profileId]);
    return result.rows;
  }

  async function getTmSectionWisePerformance(profileId) {
    const query = `
      SELECT
        AVG(alertness_score)::numeric(10,2) as alertness,
        AVG(safety_record_score)::numeric(10,2) as safety_record,
        AVG(leadership_score)::numeric(10,2) as leadership,
        AVG(discipline_score)::numeric(10,2) as discipline,
        AVG(appearance_score)::numeric(10,2) as appearance
      FROM assessments
      WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved';
    `;
    const result = await pool.query(query, [profileId]);
    return result.rows[0];
  }

  async function getTmCategoryHistory(profileId) {
    const query = `
      SELECT
        ec.created_at as date,
        sc.category_code as category
      FROM employee_categories ec
      JOIN staff_categories sc ON sc.id = ec.category_id
      WHERE ec.profile_id = $1
      ORDER BY ec.created_at ASC;
    `;
    const result = await pool.query(query, [profileId]);
    return result.rows;
  }

  // ==========================================
// SM DASHBOARD QUERIES
// ==========================================

async function getSmSummary(stationId) {
  const query = `
    SELECT
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'PM')::int as total_pm,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as category_a,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as category_b,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as category_c,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as category_d,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        WHERE a.status = 'completed'
          AND a.assessed_user_id IN (
            SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
          )
      ) as completed_assessments,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        WHERE a.status IN ('created', 'mcq_submitted')
          AND a.assessed_user_id IN (
            SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
          )
      ) as pending_assessments,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as high_risk_staff
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
    WHERE ssp.station_id = $1 AND ssp.is_current = true;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows[0];
}

async function getSmRoleWiseStaff(stationId) {
  const query = `
    SELECT r.name as role, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    WHERE ssp.station_id = $1 AND ssp.is_current = true
    GROUP BY r.name;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function getSmCategoryDistribution(stationId) {
  const query = `
    SELECT sc.category_code as category, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.station_id = $1 AND ssp.is_current = true AND sc.category_code IS NOT NULL
    GROUP BY sc.category_code;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function getSmStationCategoryDistribution(stationId) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as "categoryA",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as "categoryB",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as "categoryC",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryD"
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.station_id = $1 AND ssp.is_current = true
    GROUP BY s.id, s.station_name, s.station_code;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

async function getSmAssessments(stationId) {
  const query = `
    SELECT
      created_at,
      evaluated_at,
      approved_at,
      status,
      approval_status,
      percentage
    FROM assessments
    WHERE assessed_user_id IN (
      SELECT profile_id 
      FROM staff_station_postings 
      WHERE station_id = $1 AND is_current = true
    );
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

// ==========================================
// TI DASHBOARD QUERIES
// ==========================================

async function getTiSummary(stationIds, profileId) {
  // Return summary counters:
  // totalStations, totalPM, totalSM, totalTM, totalSS, pendingApprovals, completedApprovals, highRiskStaff
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM stations WHERE id = ANY($1::uuid[])) as total_stations,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true AND r.name = 'PM'
      ) as total_pm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true AND r.name = 'SM'
      ) as total_sm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true AND r.name = 'TM'
      ) as total_tm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true AND r.name = 'SS'
      ) as total_ss,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        JOIN staff_station_postings ssp ON ssp.profile_id = a.assessed_user_id AND ssp.is_current = true
        WHERE a.status = 'completed'
          AND a.approval_status = 'pending_approval'
          AND a.assessed_role_code IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM')
          AND ssp.station_id = ANY($1::uuid[])
          AND NOT EXISTS (
            SELECT 1 
            FROM staff_station_postings ssp_sms
            JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
            JOIN roles r_sms ON r_sms.id = p_sms.role_id
            WHERE ssp_sms.station_id = ssp.station_id 
              AND ssp_sms.is_current = true 
              AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
          )
      ) as pending_approvals,
      (
        SELECT COUNT(*)::int
        FROM assessments
        WHERE approved_by = $2 AND approval_status = 'approved'
      ) as completed_approvals,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN profiles p ON p.id = ssp.profile_id
        LEFT JOIN LATERAL (
          SELECT category_id FROM employee_categories ec_inner
          WHERE ec_inner.profile_id = p.id
          ORDER BY ec_inner.created_at DESC
          LIMIT 1
        ) ec ON true
        LEFT JOIN staff_categories sc ON sc.id = ec.category_id
        WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true AND sc.category_code = 'D'
      ) as high_risk_staff;
  `;
  const result = await pool.query(query, [stationIds, profileId]);
  return result.rows[0];
}

async function getTiStationProgress(stationIds) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int as completed,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('created', 'mcq_submitted'))::int as pending
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id
    WHERE s.id = ANY($1::uuid[])
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query, [stationIds]);
  return result.rows;
}

async function getTiStationAvgScore(stationIds) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      AVG(a.percentage)::numeric(10,2) as "averageScore"
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id AND a.status = 'completed'
    WHERE s.id = ANY($1::uuid[])
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query, [stationIds]);
  return result.rows;
}

async function getTiRoleDistribution(stationIds) {
  const query = `
    SELECT r.name as role, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true
    GROUP BY r.name;
  `;
  const result = await pool.query(query, [stationIds]);
  return result.rows;
}

async function getTiCategoryDistribution(stationIds) {
  const query = `
    SELECT sc.category_code as category, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.station_id = ANY($1::uuid[]) AND ssp.is_current = true AND sc.category_code IS NOT NULL
    GROUP BY sc.category_code;
  `;
  const result = await pool.query(query, [stationIds]);
  return result.rows;
}

async function getTiAssessments(stationIds) {
  const query = `
    SELECT
      assessed_user_id,
      created_at,
      evaluated_at,
      approved_at,
      rejected_at,
      modified_at,
      status,
      approval_status,
      percentage
    FROM assessments
    WHERE assessed_user_id IN (
      SELECT profile_id 
      FROM staff_station_postings 
      WHERE station_id = ANY($1::uuid[]) AND is_current = true
    );
  `;
  const result = await pool.query(query, [stationIds]);
  return result.rows;
}

async function getTiStationCategoryDistribution(stationIds) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as "categoryA",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as "categoryB",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as "categoryC",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryD"
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
    WHERE s.id = ANY($1::uuid[])
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query, [stationIds]);
  return result.rows;
}

// ==========================================
// AOM DASHBOARD QUERIES
// ==========================================

async function getAomSummary(divisionId) {
  // Returns summary counters:
  // totalStations, totalPM, totalSM, totalTM, totalSS, totalTI, pendingApprovals, averageDivisionScore, highRiskStaff
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM stations WHERE division_id = $1) as total_stations,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name = 'PM'
      ) as total_pm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name = 'SM'
      ) as total_sm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name = 'TM'
      ) as total_tm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name = 'SS'
      ) as total_ss,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
      ) as total_sm_supervisors,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name IN ('Cabin Master', 'CABIN MASTER')
      ) as total_tnc,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        JOIN roles r ON r.id = p.role_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND r.name IN ('Shunting Master', 'SHUNTING MASTER', 'SHM')
      ) as total_shunting_masters,
      (
        SELECT COUNT(DISTINCT sa.profile_id)::int
        FROM station_assignments sa
        JOIN stations s ON s.id = sa.station_id
        WHERE s.division_id = $1 AND sa.assignment_type = 'TI_AREA' AND sa.assigned_to IS NULL
      ) as total_ti,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        WHERE a.status = 'completed'
          AND a.approval_status = 'pending_approval'
          AND a.assessed_role_code IN ('SM', 'TM', 'TI', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER')
          AND a.assessed_user_id IN (
            SELECT ssp.profile_id
            FROM staff_station_postings ssp
            JOIN stations s ON s.id = ssp.station_id
            WHERE s.division_id = $1 AND ssp.is_current = true
          )
      ) as pending_approvals,
      (
        SELECT AVG(a.percentage)::numeric(10,2)
        FROM assessments a
        WHERE a.status = 'completed'
          AND a.assessed_user_id IN (
            SELECT ssp.profile_id
            FROM staff_station_postings ssp
            JOIN stations s ON s.id = ssp.station_id
            WHERE s.division_id = $1 AND ssp.is_current = true
          )
      ) as average_division_score,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN stations s ON s.id = ssp.station_id
        JOIN profiles p ON p.id = ssp.profile_id
        LEFT JOIN LATERAL (
          SELECT category_id FROM employee_categories ec_inner
          WHERE ec_inner.profile_id = p.id
          ORDER BY ec_inner.created_at DESC
          LIMIT 1
        ) ec ON true
        LEFT JOIN staff_categories sc ON sc.id = ec.category_id
        WHERE s.division_id = $1 AND ssp.is_current = true AND sc.category_code = 'D'
      ) as high_risk_staff;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows[0];
}

async function getAomStationProgress(divisionId) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int as completed,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('created', 'mcq_submitted'))::int as pending
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id
    WHERE s.division_id = $1
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

async function getAomStationAvgScore(divisionId) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      AVG(a.percentage)::numeric(10,2) as "averageScore"
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id AND a.status = 'completed'
    WHERE s.division_id = $1
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

async function getAomRoleDistribution(divisionId) {
  const query = `
    SELECT r.name as role, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    WHERE s.division_id = $1 AND ssp.is_current = true
    GROUP BY r.name;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

async function getAomCategoryDistribution(divisionId) {
  const query = `
    SELECT sc.category_code as category, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE s.division_id = $1 AND ssp.is_current = true AND sc.category_code IS NOT NULL
    GROUP BY sc.category_code;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

async function getAomTiPerformance(divisionId) {
  const query = `
    SELECT
      p.full_name as "tiName",
      COALESCE(AVG(a.percentage)::numeric(10,2), 0) as "averageScore"
    FROM station_assignments sa
    JOIN profiles p ON p.id = sa.profile_id
    JOIN stations s ON s.id = sa.station_id
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id AND a.status = 'completed'
    WHERE s.division_id = $1
      AND sa.assignment_type = 'TI_AREA'
      AND sa.assigned_to IS NULL
    GROUP BY sa.profile_id, p.full_name;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

async function getAomStationCategoryDistribution(divisionId) {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as "categoryA",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as "categoryB",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as "categoryC",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryD"
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
    WHERE s.division_id = $1
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

async function getAomAssessments(divisionId) {
  const query = `
    SELECT
      a.created_at,
      a.evaluated_at,
      a.approved_at,
      a.rejected_at,
      a.modified_at,
      a.status,
      a.approval_status,
      a.percentage
    FROM assessments a
    WHERE a.assessed_user_id IN (
      SELECT ssp.profile_id
      FROM staff_station_postings ssp
      JOIN stations s ON s.id = ssp.station_id
      WHERE s.division_id = $1 AND ssp.is_current = true
    );
  `;
  const result = await pool.query(query, [divisionId]);
  return result.rows;
}

// ==========================================
// SUPER ADMIN DASHBOARD QUERIES
// ==========================================

async function getSuperAdminSummary() {
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM divisions) as total_divisions,
      (SELECT COUNT(*)::int FROM stations) as total_stations,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name = 'AOM' AND p.status = 'active'
      ) as total_aom,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name = 'TI' AND p.status = 'active'
      ) as total_ti,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name = 'SM' AND p.status = 'active'
      ) as total_sm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name = 'TM' AND p.status = 'active'
      ) as total_tm,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name = 'SS' AND p.status = 'active'
      ) as total_ss,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio') AND p.status = 'active'
      ) as total_sm_supervisors,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name IN ('Cabin Master', 'CABIN MASTER') AND p.status = 'active'
      ) as total_tnc,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name IN ('Shunting Master', 'SHUNTING MASTER', 'SHM') AND p.status = 'active'
      ) as total_shunting_masters,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM profiles p
        JOIN roles r ON r.id = p.role_id
        WHERE r.name = 'PM' AND p.status = 'active'
      ) as total_pm,
      (
        SELECT COUNT(*)::int
        FROM assessments
        WHERE status = 'completed'
      ) as total_assessments,
      (
        SELECT COUNT(*)::int
        FROM assessments
        WHERE status = 'completed' AND approval_status = 'pending_approval'
      ) as pending_approvals,
      (
        SELECT COUNT(DISTINCT p.id)::int
        FROM staff_station_postings ssp
        JOIN profiles p ON p.id = ssp.profile_id
        LEFT JOIN LATERAL (
          SELECT category_id FROM employee_categories ec_inner
          WHERE ec_inner.profile_id = p.id
          ORDER BY ec_inner.created_at DESC
          LIMIT 1
        ) ec ON true
        LEFT JOIN staff_categories sc ON sc.id = ec.category_id
        WHERE ssp.is_current = true AND sc.category_code = 'D'
      ) as high_risk_staff;
  `;
  const result = await pool.query(query);
  return result.rows[0];
}

async function getSuperAdminStationProgress() {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int as completed,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('created', 'mcq_submitted'))::int as pending
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getSuperAdminStationAvgScore() {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      AVG(a.percentage)::numeric(10,2) as "averageScore"
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id AND a.status = 'completed'
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getSuperAdminRoleDistribution() {
  const query = `
    SELECT r.name as role, COUNT(p.id)::int as count
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE p.status = 'active' AND r.name IN ('PM', 'SM', 'TM', 'SS', 'TI', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'AOM', 'SUPER_ADMIN')
    GROUP BY r.name;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getSuperAdminCategoryDistribution() {
  const query = `
    SELECT sc.category_code as category, COUNT(DISTINCT p.id)::int as count
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.is_current = true AND sc.category_code IS NOT NULL
    GROUP BY sc.category_code;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getSuperAdminTiPerformance() {
  const query = `
    SELECT
      p.full_name as "tiName",
      COALESCE(AVG(a.percentage)::numeric(10,2), 0) as "averageScore"
    FROM station_assignments sa
    JOIN profiles p ON p.id = sa.profile_id
    JOIN stations s ON s.id = sa.station_id
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN assessments a ON a.assessed_user_id = ssp.profile_id AND a.status = 'completed'
    WHERE sa.assignment_type = 'TI_AREA'
      AND sa.assigned_to IS NULL
    GROUP BY sa.profile_id, p.full_name;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getSuperAdminStationCategoryDistribution() {
  const query = `
    SELECT
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as "categoryA",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as "categoryB",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as "categoryC",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryD"
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
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_code;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getSuperAdminAssessments() {
  const query = `
    SELECT
      created_at,
      evaluated_at,
      approved_at,
      rejected_at,
      modified_at,
      status,
      approval_status,
      percentage
    FROM assessments;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getStationStaff(stationId) {
  const query = `
    SELECT 
      p.id, 
      p.full_name as "fullName", 
      p.hrms_id as "hrmsId", 
      p.phone, 
      p.email,
      p.employee_id as "employeeId",
      p.designation,
      r.name as "role",
      s.station_name as "stationName",
      d.name as "divisionName",
      d.zone as "zoneName",
      (
        SELECT p_ti.full_name || ' (TI)'
        FROM station_assignments sa
        JOIN profiles p_ti ON p_ti.id = sa.profile_id
        WHERE sa.station_id = s.id 
          AND sa.assignment_type = 'TI_AREA'
          AND sa.assigned_to IS NULL
        LIMIT 1
      ) as "reportingOfficer",
      (
        SELECT sc.category_code
        FROM employee_categories ec
        JOIN staff_categories sc ON sc.id = ec.category_id
        WHERE ec.profile_id = p.id
        ORDER BY ec.created_at DESC
        LIMIT 1
      ) as "category"
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN divisions d ON d.id = s.division_id
    WHERE ssp.station_id = $1 
      AND ssp.is_current = true
    ORDER BY p.full_name;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}


  
async function getSuperAdminWorkforceActivity(filters) {
  const { fromDate, toDate, roleCode, actionType, stationId, stationName, category, search, page = 1, limit = 10 } = filters;
  
  let query = `
    FROM audit_logs al
    JOIN profiles p ON p.id = al.entity_id
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN profiles perf ON perf.id = al.performed_by
    WHERE al.action_type IN ('USER_CREATED', 'EMPLOYEE_TRANSFERRED', 'USER_DEACTIVATED', 'USER_ACTIVATED')
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (fromDate) {
    paramCount++;
    query += ` AND al.created_at >= $${paramCount}`;
    params.push(fromDate);
  }
  if (toDate) {
    paramCount++;
    query += ` AND al.created_at <= $${paramCount}`;
    params.push(toDate);
  }
  if (roleCode) {
    paramCount++;
    query += ` AND r.name = $${paramCount}`;
    params.push(roleCode);
  }
  if (actionType) {
    paramCount++;
    let matchedAction = actionType;
    if (actionType === 'Created') matchedAction = 'USER_CREATED';
    else if (actionType === 'Transferred') matchedAction = 'EMPLOYEE_TRANSFERRED';
    else if (actionType === 'Deactivated') matchedAction = 'USER_DEACTIVATED';
    else if (actionType === 'Reactivated') matchedAction = 'USER_ACTIVATED';
    query += ` AND al.action_type = $${paramCount}`;
    params.push(matchedAction);
  }
  if (stationId) {
    paramCount++;
    query += ` AND (ssp.station_id = $${paramCount} OR (al.old_data->>'stationId') = $${paramCount} OR (al.new_data->>'stationId') = $${paramCount})`;
    params.push(stationId);
  }
  if (stationName) {
    paramCount++;
    query += ` AND (s.station_name ILIKE $${paramCount} OR s.station_code ILIKE $${paramCount})`;
    params.push(`%${stationName}%`);
  }
  if (category) {
    paramCount++;
    query += ` AND sc.category_code = $${paramCount}`;
    params.push(category);
  }
  if (search) {
    paramCount++;
    query += ` AND (p.full_name ILIKE $${paramCount} OR p.hrms_id ILIKE $${paramCount} OR perf.full_name ILIKE $${paramCount} OR perf.hrms_id ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }
  
  const countQuery = `SELECT COUNT(*)::int as total ` + query;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;
  
  let selectQuery = `
    SELECT 
      al.id,
      al.created_at as "date",
      al.action_type as "actionType",
      p.full_name as "employeeName",
      p.hrms_id as "hrmsId",
      r.name as "role",
      perf.hrms_id as "performedBy",
      (al.old_data->>'stationId') as "fromStationId",
      (al.new_data->>'stationId') as "toStationId",
      s.station_name as "currentStationName"
  ` + query;
  
  selectQuery += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  const offset = (page - 1) * limit;
  const recordsRes = await pool.query(selectQuery, [...params, limit, offset]);
  
  const records = [];
  for (const row of recordsRes.rows) {
    let fromStation = '--';
    let toStation = '--';
    if (row.actionType === 'EMPLOYEE_TRANSFERRED') {
      if (row.fromStationId) {
        const sRes = await pool.query('SELECT station_name FROM stations WHERE id = $1', [row.fromStationId]);
        fromStation = sRes.rows[0]?.station_name || '--';
      }
      if (row.toStationId) {
        const sRes = await pool.query('SELECT station_name FROM stations WHERE id = $1', [row.toStationId]);
        toStation = sRes.rows[0]?.station_name || '--';
      }
    }
    
    let readableAction = row.actionType;
    if (row.actionType === 'USER_CREATED') readableAction = 'Created';
    else if (row.actionType === 'EMPLOYEE_TRANSFERRED') readableAction = 'Transferred';
    else if (row.actionType === 'USER_DEACTIVATED') readableAction = 'Deactivated';
    else if (row.actionType === 'USER_ACTIVATED') readableAction = 'Reactivated';
    
    records.push({
      id: row.id,
      date: row.date,
      employeeName: row.employeeName,
      hrmsId: row.hrmsId,
      role: row.role,
      actionType: readableAction,
      fromStation,
      toStation,
      performedBy: row.performedBy || 'System'
    });
  }
  
  const monthlyQuery = `
    SELECT 
      TO_CHAR(al.created_at, 'YYYY-MM') as month_key,
      COUNT(*) FILTER (WHERE al.action_type = 'USER_CREATED')::int as created_count,
      COUNT(*) FILTER (WHERE al.action_type = 'EMPLOYEE_TRANSFERRED')::int as transferred_count,
      COUNT(*) FILTER (WHERE al.action_type = 'USER_DEACTIVATED')::int as deactivated_count,
      COUNT(*) FILTER (WHERE al.action_type = 'USER_ACTIVATED')::int as reactivated_count
    ` + query + `
    GROUP BY month_key
    ORDER BY month_key ASC
  `;
  const monthlyRes = await pool.query(monthlyQuery, params);
  const monthlyCounts = monthlyRes.rows.map(row => {
    const parts = row.month_key.split('-');
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = `${months[monthIndex]} ${year}`;
    
    return {
      month: monthName,
      created: row.created_count,
      transferred: row.transferred_count,
      deactivated: row.deactivated_count,
      reactivated: row.reactivated_count
    };
  });
  
  const kpiQuery = `
    SELECT
      COUNT(*) FILTER (WHERE al.action_type = 'USER_CREATED')::int as created_total,
      COUNT(*) FILTER (WHERE al.action_type = 'EMPLOYEE_TRANSFERRED')::int as transferred_total,
      COUNT(*) FILTER (WHERE al.action_type = 'USER_DEACTIVATED')::int as deactivated_total,
      COUNT(*) FILTER (WHERE al.action_type = 'USER_ACTIVATED')::int as reactivated_total
  ` + query;
  const kpiRes = await pool.query(kpiQuery, params);
  const kpis = {
    createdUsers: kpiRes.rows[0]?.created_total || 0,
    transfers: kpiRes.rows[0]?.transferred_total || 0,
    deactivations: kpiRes.rows[0]?.deactivated_total || 0,
    reactivations: kpiRes.rows[0]?.reactivated_total || 0
  };

  return { records, total, monthlyCounts, kpis };
}

function formatDateDdMmmYyyy(dateVal) {
  if (!dateVal) return "--";
  let d = new Date(dateVal);
  if (isNaN(d.getTime())) return "--";
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const parts = dateVal.split('T')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    d = new Date(year, month, day);
  }
  const dayStr = String(d.getDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthStr = months[d.getMonth()];
  const yearStr = d.getFullYear();
  return `${dayStr}-${monthStr}-${yearStr}`;
}

async function getSuperAdminHighRiskStaff(filters) {
  const { fromDate, toDate, stationId, stationName, roleCode, category, riskLevel, search, page = 1, limit = 10 } = filters;
  
  let query = `
    FROM staff_station_postings ssp
    JOIN profiles p ON p.id = ssp.profile_id
    JOIN roles r ON r.id = p.role_id
    JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN LATERAL (
      SELECT category_id, created_at FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ssp.is_current = true AND sc.category_code = 'D'
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (fromDate) {
    paramCount++;
    query += ` AND ec.created_at >= $${paramCount}`;
    params.push(fromDate);
  }
  if (toDate) {
    paramCount++;
    query += ` AND ec.created_at <= $${paramCount}`;
    params.push(toDate);
  }
  if (stationId) {
    paramCount++;
    query += ` AND ssp.station_id = $${paramCount}`;
    params.push(stationId);
  }
  if (stationName) {
    paramCount++;
    query += ` AND (s.station_name ILIKE $${paramCount} OR s.station_code ILIKE $${paramCount})`;
    params.push(`%${stationName}%`);
  }
  if (roleCode) {
    paramCount++;
    query += ` AND r.name = $${paramCount}`;
    params.push(roleCode);
  }
  
  const countQuery = `SELECT COUNT(*)::int as total ` + query;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;
  
  let selectQuery = `
    SELECT 
      p.id,
      p.full_name as "employeeName",
      p.hrms_id as "hrmsId",
      r.name as "role",
      sc.category_code as "category",
      s.station_name as "stationName",
      s.station_code as "stationCode",
      (
        SELECT p_sm.full_name
        FROM staff_station_postings ssp_sm
        JOIN profiles p_sm ON p_sm.id = ssp_sm.profile_id
        JOIN roles r_sm ON r_sm.id = p_sm.role_id
        WHERE ssp_sm.station_id = s.id 
          AND ssp_sm.is_current = true
          AND r_sm.name = 'SM'
        LIMIT 1
      ) as "assignedSm",
      (
        SELECT p_ti.full_name
        FROM station_assignments sa
        JOIN profiles p_ti ON p_ti.id = sa.profile_id
        WHERE sa.station_id = s.id 
          AND sa.assignment_type = 'TI_AREA'
          AND sa.assigned_to IS NULL
        LIMIT 1
      ) as "assignedTi",
      (
        SELECT p_aom.full_name
        FROM division_assignments da
        JOIN profiles p_aom ON p_aom.id = da.profile_id
        WHERE da.division_id = s.division_id AND da.is_current = true
        LIMIT 1
      ) as "assignedAom",
      (
        SELECT percentage FROM assessments a 
        WHERE a.assessed_user_id = p.id AND a.status = 'completed'
        ORDER BY a.evaluated_at DESC LIMIT 1
      ) as "latestScore",
      (
        SELECT evaluated_at FROM assessments a 
        WHERE a.assessed_user_id = p.id AND a.status = 'completed'
        ORDER BY a.evaluated_at DESC LIMIT 1
      ) as "lastAssessmentDate"
  ` + query;
  
  selectQuery += ` ORDER BY s.station_name, p.full_name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  const offset = (page - 1) * limit;
  const recordsRes = await pool.query(selectQuery, [...params, limit, offset]);
  
  const records = recordsRes.rows.map(row => ({
    id: row.id,
    stationName: row.stationName,
    stationCode: row.stationCode || '--',
    employeeName: row.employeeName,
    hrmsId: row.hrmsId,
    role: row.role,
    category: row.category || 'N/A',
    assignedSm: row.assignedSm || '--',
    assignedTi: row.assignedTi || '--',
    assignedAom: row.assignedAom || '--',
    latestScore: row.latestScore !== null ? `${row.latestScore}%` : '--',
    riskLevel: 'HIGH',
    lastAssessmentDate: formatDateDdMmmYyyy(row.lastAssessmentDate)
  }));
  
  let chartQuery = `
    SELECT 
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT p.id) FILTER (
        WHERE sc.category_code = 'D'
  `;
  
  const chartParams = [];
  let chartParamCount = 0;
  
  if (fromDate) {
    chartParamCount++;
    chartQuery += ` AND ec.created_at >= $${chartParamCount}`;
    chartParams.push(fromDate);
  }
  if (toDate) {
    chartParamCount++;
    chartQuery += ` AND ec.created_at <= $${chartParamCount}`;
    chartParams.push(toDate);
  }
  if (roleCode) {
    chartParamCount++;
    chartQuery += ` AND r.name = $${chartParamCount}`;
    chartParams.push(roleCode);
  }
  
  chartQuery += `
      )::int as count
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN profiles p ON p.id = ssp.profile_id AND p.role_id IS NOT NULL
    LEFT JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id, created_at FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE 1=1
  `;
  
  if (stationId) {
    chartParamCount++;
    chartQuery += ` AND s.id = $${chartParamCount}`;
    chartParams.push(stationId);
  }
  if (stationName) {
    chartParamCount++;
    chartQuery += ` AND (s.station_name ILIKE $${chartParamCount} OR s.station_code ILIKE $${chartParamCount})`;
    chartParams.push(`%${stationName}%`);
  }
  
  chartQuery += `
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY count DESC, s.station_name ASC
  `;
  const chartRes = await pool.query(chartQuery, chartParams);
  const stationCounts = chartRes.rows.map(row => ({
    stationName: row.stationName,
    stationCode: row.stationCode,
    count: row.count
  }));
  
  const kpisQuery = `
    SELECT 
      COUNT(DISTINCT p.id)::int as total_high_risk_staff,
      COUNT(DISTINCT s.id)::int as high_risk_stations
    ` + query;
  const kpisRes = await pool.query(kpisQuery, params);
  
  const highestRiskStation = stationCounts.find(sc => sc.count > 0)?.stationCode || '--';
  const totalHighRiskStaff = kpisRes.rows[0]?.total_high_risk_staff || 0;
  const highRiskStations = kpisRes.rows[0]?.high_risk_stations || 0;
  
  let avgRisk = 'LOW';
  if (totalHighRiskStaff > 10) avgRisk = 'HIGH';
  else if (totalHighRiskStaff > 2) avgRisk = 'MEDIUM';
  
  const kpis = {
    totalHighRiskStaff,
    highRiskStations,
    highestRiskStation,
    averageDivisionRisk: avgRisk
  };
  
  return { records, total, stationCounts, kpis };
}

async function getSmSupervisorSummary(stationId, profileId) {
  const query = `
    SELECT
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'PM')::int as total_pm,
      COUNT(DISTINCT p.id) FILTER (WHERE r.name IN ('SM', 'STATION MASTER'))::int as total_sm,
      COUNT(DISTINCT p.id) FILTER (WHERE r.name IN ('TM', 'TRAIN MANAGER'))::int as total_tm,
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'SS')::int as total_ss,
      COUNT(DISTINCT p.id) FILTER (WHERE r.name IN ('Cabin Master', 'CABIN MASTER'))::int as total_cm,
      COUNT(DISTINCT p.id) FILTER (WHERE r.name IN ('Shunting Master', 'SHUNTING MASTER', 'SHM'))::int as total_shm,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as category_a,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as category_b,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as category_c,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as category_d,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        WHERE a.status = 'completed'
          AND a.assessed_user_id IN (
            SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
          )
      ) as completed_assessments,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        WHERE a.status IN ('created', 'mcq_submitted')
          AND a.assessed_user_id IN (
            SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
          )
      ) as pending_assessments,
      (
        SELECT COUNT(*)::int
        FROM assessments a
        WHERE a.status = 'completed'
          AND a.approval_status = 'pending_approval'
          AND a.assessed_role_code IN ('PM', 'Shunting Master')
          AND a.assessed_user_id IN (
            SELECT profile_id FROM staff_station_postings WHERE station_id = $1 AND is_current = true
          )
      ) as pending_approvals,
      (
        SELECT COUNT(*)::int
        FROM assessments
        WHERE approved_by = $2 AND approval_status = 'approved'
      ) as completed_approvals,
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as high_risk_staff
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
    WHERE ssp.station_id = $1 AND ssp.is_current = true;
  `;
  const result = await pool.query(query, [stationId, profileId]);
  return result.rows[0];
}

module.exports = {
  getSmStation,
  getTiStations,
  getAomDivision,
  getStationStaff,
  
  getPmSummary,
  getPmPerformanceTrend,
  getPmSectionWisePerformance,
  getPmCategoryHistory,

  getTmSummary,
  getTmPerformanceTrend,
  getTmSectionWisePerformance,
  getTmCategoryHistory,

  getSmSummary,
  getSmRoleWiseStaff,
  getSmCategoryDistribution,
  getSmStationCategoryDistribution,
  getSmAssessments,
  getSmSupervisorSummary,
  
  getTiSummary,
  getTiStationProgress,
  getTiStationAvgScore,
  getTiRoleDistribution,
  getTiCategoryDistribution,
  getTiAssessments,
  getTiStationCategoryDistribution,
  
  getAomSummary,
  getAomStationProgress,
  getAomStationAvgScore,
  getAomRoleDistribution,
  getAomCategoryDistribution,
  getAomTiPerformance,
  getAomStationCategoryDistribution,
  getAomAssessments,
  
  getSuperAdminSummary,
  getSuperAdminStationProgress,
  getSuperAdminStationAvgScore,
  getSuperAdminRoleDistribution,
  getSuperAdminCategoryDistribution,
  getSuperAdminTiPerformance,
  getSuperAdminStationCategoryDistribution,
  getSuperAdminAssessments,
  getSuperAdminWorkforceActivity,
  getSuperAdminHighRiskStaff,
};
