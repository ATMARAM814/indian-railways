const pool = require("../../config/database");

// ==========================================
// SCOPE RESOLUTION HELPERS (USED BY SERVICE)
// ==========================================

async function getSmStation(profileId) {
  const query = `
    SELECT ssp.station_id
    FROM staff_station_postings ssp
    WHERE ssp.profile_id = $1 AND ssp.is_current = true
    LIMIT 1;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0] ? result.rows[0].station_id : null;
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
// 1. DETAILED ASSESSMENT REPORT
// ==========================================

function buildAssessmentsWhere(filters, scope, values) {
  const conditions = [];

  // --- Scope Restrictions ---
  if (scope.type === "PM") {
    values.push(scope.userId);
    conditions.push(`a.assessed_user_id = $${values.length}`);
  } else if (scope.type === "SM" || scope.type === "SS" || scope.type === "Cabin Master" || scope.type === "CABIN MASTER") {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    values.push(scope.userId);
    const allowedRolesStr = scope.userId === '439a8db6-2546-4858-abbc-3752f4acb536'
      ? "'PM', 'Shunting Master', 'TM'"
      : "'PM', 'Shunting Master'";
    conditions.push(`
      (
        (a.assessed_role_code IN (${allowedRolesStr}) AND assessed.reporting_officer_id IS NULL)
        OR
        (assessed.reporting_officer_id = $${values.length})
      )
    `);
  } else if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(scope.type)) {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    conditions.push(`a.assessed_role_code IN ('PM', 'SM', 'TM', 'SS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === "TI") {
    values.push(scope.stationIds);
    conditions.push(`ssp.station_id = ANY($${values.length}::uuid[])`);
    conditions.push(`a.assessed_role_code IN ('PM', 'SM', 'TM', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === "AOM") {
    values.push(scope.divisionId);
    conditions.push(`s.division_id = $${values.length}`);
    conditions.push(`a.assessed_role_code IN ('PM', 'SM', 'TM', 'SS', 'TI', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  }

  // --- Filters ---
  if (filters.role) {
    values.push(filters.role);
    conditions.push(`a.assessed_role_code = $${values.length}`);
  }
  if (filters.stationId) {
    values.push(filters.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
  }
  if (filters.category) {
    values.push(filters.category);
    conditions.push(`sc.category_code = $${values.length}`);
  }
  if (filters.riskLevel) {
    values.push(filters.riskLevel);
    conditions.push(`
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B', 'C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END = $${values.length}
    `);
  }
  if (filters.assessmentStatus) {
    values.push(filters.assessmentStatus);
    conditions.push(`a.status = $${values.length}`);
  }
  if (filters.approvalStatus) {
    values.push(filters.approvalStatus);
    conditions.push(`a.approval_status = $${values.length}`);
  }
  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`a.created_at >= $${values.length}::timestamp`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`a.created_at <= $${values.length}::timestamp`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`
      (assessed.full_name ILIKE $${values.length} 
       OR assessed.hrms_id ILIKE $${values.length})
    `);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

async function getAssessmentsReport(filters, scope) {
  const values = [];
  const whereClause = buildAssessmentsWhere(filters, scope, values);

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      a.id as "assessmentId",
      a.assessed_user_id as "assessedUserId",
      assessed.full_name as "assessedUserName",
      assessed.hrms_id as "hrmsId",
      a.assessed_role_code as "role",
      s.station_name as "stationName",
      sc.category_code as "category",
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B', 'C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END as "riskLevel",
      assessor.full_name as "assessorName",
      a.status as "assessmentStatus",
      a.approval_status as "approvalStatus",
      a.mcq_score as "mcqScore",
      a.evaluation_score as "evaluationScore",
      a.total_score as "totalScore",
      a.percentage as "percentage",
      a.created_at as "createdAt",
      a.evaluated_at as "completedAt",
      a.approved_at as "approvedAt",
      a.rejected_at as "rejectedAt"
    FROM assessments a
    JOIN profiles assessed ON assessed.id = a.assessed_user_id
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = assessed.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);
  return result.rows;
}

async function countAssessmentsReport(filters, scope) {
  const values = [];
  const whereClause = buildAssessmentsWhere(filters, scope, values);

  const query = `
    SELECT COUNT(DISTINCT a.id)::int as total
    FROM assessments a
    JOIN profiles assessed ON assessed.id = a.assessed_user_id
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = assessed.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    ${whereClause};
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

// ==========================================
// 2. STAFF PERFORMANCE REPORT
// ==========================================

function buildStaffPerformanceWhere(filters, scope, values) {
  const conditions = [];

  // --- Scope Restrictions ---
  if (scope.type === "PM") {
    values.push(scope.userId);
    conditions.push(`p.id = $${values.length}`);
  } else if (scope.type === "SM" || scope.type === "SS" || scope.type === "Cabin Master" || scope.type === "CABIN MASTER") {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    values.push(scope.userId);
    const allowedRolesStr = scope.userId === '439a8db6-2546-4858-abbc-3752f4acb536'
      ? "'PM', 'Shunting Master', 'TM'"
      : "'PM', 'Shunting Master'";
    conditions.push(`
      (
        (r.name IN (${allowedRolesStr}) AND p.reporting_officer_id IS NULL)
        OR
        (p.reporting_officer_id = $${values.length})
      )
    `);
  } else if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(scope.type)) {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    conditions.push(`r.name IN ('PM', 'SM', 'TM', 'SS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === "TI") {
    values.push(scope.stationIds);
    conditions.push(`ssp.station_id = ANY($${values.length}::uuid[])`);
    conditions.push(`r.name IN ('PM', 'SM', 'TM', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === "AOM") {
    values.push(scope.divisionId);
    conditions.push(`s.division_id = $${values.length}`);
    conditions.push(`r.name IN ('PM', 'SM', 'TM', 'SS', 'TI', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  }

  // --- Filters ---
  if (filters.role) {
    values.push(filters.role);
    conditions.push(`r.name = $${values.length}`);
  }
  if (filters.stationId) {
    values.push(filters.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
  }
  if (filters.category) {
    values.push(filters.category);
    conditions.push(`sc.category_code = $${values.length}`);
  }
  if (filters.riskLevel) {
    values.push(filters.riskLevel);
    conditions.push(`
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B', 'C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END = $${values.length}
    `);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`
      (p.full_name ILIKE $${values.length} 
       OR p.hrms_id ILIKE $${values.length})
    `);
  }
  if (filters.approvalStatus) {
    values.push(filters.approvalStatus);
    conditions.push(`latest_a.approval_status = $${values.length}`);
  }
  if (filters.assessmentStatus) {
    if (filters.assessmentStatus === 'completed') {
      conditions.push(`latest_a.percentage IS NOT NULL`);
    } else if (filters.assessmentStatus === 'pending_approval') {
      conditions.push(`latest_a.approval_status = 'pending_approval'`);
    } else if (filters.assessmentStatus === 'mcq_submitted') {
      conditions.push(`latest_a.approval_status = 'mcq_submitted'`);
    } else if (filters.assessmentStatus === 'evaluation_pending') {
      conditions.push(`latest_a.approval_status = 'evaluation_pending'`);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

async function getStaffPerformanceReport(filters, scope) {
  const values = [];
  const whereClause = buildStaffPerformanceWhere(filters, scope, values);

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  // Compile date checks for joins
  let assessmentDateJoinCond = "";
  let latestDateCond = "";
  
  if (filters.fromDate) {
    values.push(filters.fromDate);
    const param = `$${values.length}::timestamp`;
    assessmentDateJoinCond += ` AND a.evaluated_at >= ${param}`;
    latestDateCond += ` AND evaluated_at >= ${param}`;
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    const param = `$${values.length}::timestamp`;
    assessmentDateJoinCond += ` AND a.evaluated_at <= ${param}`;
    latestDateCond += ` AND evaluated_at <= ${param}`;
  }

  const query = `
    SELECT
      p.id as "userId",
      p.full_name as "fullName",
      p.hrms_id as "hrmsId",
      r.name as "role",
      s.station_name as "stationName",
      sc.category_code as "category",
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B', 'C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END as "riskLevel",
      COUNT(a.id)::int as "totalAssessments",
      COALESCE(AVG(a.percentage)::numeric(10,2), 0) as "averageScore",
      COALESCE(MAX(a.percentage)::numeric(10,2), 0) as "highestScore",
      COALESCE(MIN(a.percentage)::numeric(10,2), 0) as "lowestScore",
      latest_a.percentage as "latestScore",
      latest_a.evaluated_at as "lastAssessmentDate",
      latest_a.approval_status as "approvalStatus"
    FROM profiles p
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
    LEFT JOIN assessments a ON a.assessed_user_id = p.id AND a.status = 'completed' ${assessmentDateJoinCond}
    LEFT JOIN LATERAL (
      SELECT percentage, evaluated_at, approval_status
      FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' ${latestDateCond}
      ORDER BY created_at DESC
      LIMIT 1
    ) latest_a ON true
    ${whereClause}
    GROUP BY p.id, p.full_name, p.hrms_id, r.name, s.station_name, sc.category_code, latest_a.percentage, latest_a.evaluated_at, latest_a.approval_status
    ORDER BY p.full_name
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);
  return result.rows;
}

async function countStaffPerformanceReport(filters, scope) {
  const values = [];
  const whereClause = buildStaffPerformanceWhere(filters, scope, values);

  // Compile date checks for joins
  let latestDateCond = "";
  if (filters.fromDate) {
    values.push(filters.fromDate);
    const param = `$${values.length}::timestamp`;
    latestDateCond += ` AND evaluated_at >= ${param}`;
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    const param = `$${values.length}::timestamp`;
    latestDateCond += ` AND evaluated_at <= ${param}`;
  }

  const query = `
    SELECT COUNT(DISTINCT p.id)::int as total
    FROM profiles p
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
    LEFT JOIN LATERAL (
      SELECT percentage, evaluated_at, approval_status
      FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' ${latestDateCond}
      ORDER BY created_at DESC
      LIMIT 1
    ) latest_a ON true
    ${whereClause};
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

// ==========================================
// 3. STATION SUMMARY REPORT
// ==========================================

function buildStationSummaryWhere(filters, scope, values) {
  const conditions = [];

  if (scope.type === "PM" || scope.type === "SM" || scope.type === "SS" || ["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(scope.type) || ["Cabin Master", "CABIN MASTER"].includes(scope.type)) {
    values.push(scope.stationId);
    conditions.push(`s.id = $${values.length}`);
  } else if (scope.type === "TI") {
    values.push(scope.stationIds);
    conditions.push(`s.id = ANY($${values.length}::uuid[])`);
  } else if (scope.type === "AOM") {
    values.push(scope.divisionId);
    conditions.push(`s.division_id = $${values.length}`);
  }

  // --- Filters ---
  if (filters.stationId) {
    values.push(filters.stationId);
    conditions.push(`s.id = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(s.station_name ILIKE $${values.length} OR s.station_code ILIKE $${values.length})`);
  }

  if (filters.stationName) {
    values.push(`%${filters.stationName}%`);
    conditions.push(`s.station_name ILIKE $${values.length}`);
  }

  if (filters.stationCode) {
    values.push(`%${filters.stationCode}%`);
    conditions.push(`s.station_code ILIKE $${values.length}`);
  }

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`sc.category_code = $${values.length}`);
  }

  if (filters.riskLevel) {
    values.push(filters.riskLevel);
    conditions.push(`
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B', 'C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END = $${values.length}
    `);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

async function getStationSummaryReport(filters, scope) {
  const values = [];
  const whereClause = buildStationSummaryWhere(filters, scope, values);

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  let assessmentDateJoinCond = "";
  if (filters.fromDate) {
    values.push(filters.fromDate);
    assessmentDateJoinCond += ` AND a.created_at >= $${values.length}::timestamp`;
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    assessmentDateJoinCond += ` AND a.created_at <= $${values.length}::timestamp`;
  }

  const query = `
    SELECT
      s.id as "stationId",
      s.station_name as "stationName",
      s.station_code as "stationCode",
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'PM')::int as "totalPM",
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'SM')::int as "totalSM",
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'TM')::int as "totalTM",
      COUNT(DISTINCT p.id) FILTER (WHERE r.name = 'SS')::int as "totalSS",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as "categoryA",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as "categoryB",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as "categoryC",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryD",
      COUNT(DISTINCT a.id)::int as "totalAssessments",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::int as "completedAssessments",
      COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('created', 'mcq_submitted'))::int as "pendingAssessments",
      COALESCE(AVG(a.percentage) FILTER (WHERE a.status = 'completed')::numeric(10,2), 0) as "averageScore",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "highRiskStaff"
    FROM stations s
    LEFT JOIN staff_station_postings ssp ON ssp.station_id = s.id AND ssp.is_current = true
    LEFT JOIN profiles p ON p.id = ssp.profile_id
    LEFT JOIN roles r ON r.id = p.role_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN assessments a ON a.assessed_user_id = p.id ${assessmentDateJoinCond}
    ${whereClause}
    GROUP BY s.id, s.station_name, s.station_code
    ORDER BY s.station_name
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);
  return result.rows;
}

async function countStationSummaryReport(filters, scope) {
  const values = [];
  const whereClause = buildStationSummaryWhere(filters, scope, values);

  const query = `
    SELECT COUNT(DISTINCT s.id)::int as total
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
    ${whereClause};
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

// ==========================================
// 4. APPROVAL STATUS REPORT
// ==========================================

function buildApprovalWhere(filters, scope, values) {
  const conditions = [];

  // --- Scope Restrictions ---
  if (scope.type === "PM") {
    values.push(scope.userId);
    conditions.push(`a.assessed_user_id = $${values.length}`);
  } else if (scope.type === "SM" || scope.type === "SS" || scope.type === "Cabin Master" || scope.type === "CABIN MASTER") {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    values.push(scope.userId);
    const allowedRolesStr = scope.userId === '439a8db6-2546-4858-abbc-3752f4acb536'
      ? "'PM', 'Shunting Master', 'TM'"
      : "'PM', 'Shunting Master'";
    conditions.push(`
      (
        (a.assessed_role_code IN (${allowedRolesStr}) AND assessed.reporting_officer_id IS NULL)
        OR
        (assessed.reporting_officer_id = $${values.length})
      )
    `);
  } else if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(scope.type)) {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    conditions.push(`a.assessed_role_code IN ('PM', 'SM', 'TM', 'SS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === "TI") {
    values.push(scope.stationIds);
    conditions.push(`ssp.station_id = ANY($${values.length}::uuid[])`);
    conditions.push(`a.assessed_role_code IN ('PM', 'SM', 'TM', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === "AOM") {
    values.push(scope.divisionId);
    conditions.push(`s.division_id = $${values.length}`);
    conditions.push(`a.assessed_role_code IN ('PM', 'SM', 'TM', 'SS', 'TI', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  }

  // --- Filters ---
  if (filters.role) {
    values.push(filters.role);
    conditions.push(`a.assessed_role_code = $${values.length}`);
  }
  if (filters.stationId) {
    values.push(filters.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
  }
  if (filters.approvalStatus) {
    values.push(filters.approvalStatus);
    conditions.push(`a.approval_status = $${values.length}`);
  }
  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`a.created_at >= $${values.length}::timestamp`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`a.created_at <= $${values.length}::timestamp`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`
      (assessed.full_name ILIKE $${values.length} 
       OR assessed.hrms_id ILIKE $${values.length})
    `);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

async function getApprovalStatusReport(filters, scope) {
  const values = [];
  const whereClause = buildApprovalWhere(filters, scope, values);

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  const query = `
    SELECT
      a.id as "assessmentId",
      assessed.full_name as "assessedUserName",
      assessed.hrms_id as "hrmsId",
      a.assessed_role_code as "role",
      s.station_name as "stationName",
      a.approval_status as "approvalStatus",
      approver.full_name as "approvedBy",
      a.approved_at as "approvedAt",
      rejecter.full_name as "rejectedBy",
      a.rejected_at as "rejectedAt",
      a.rejection_reason as "rejectionReason",
      a.modification_remark as "modificationRemark",
      a.total_score as "totalScore",
      a.percentage as "percentage"
    FROM assessments a
    JOIN profiles assessed ON assessed.id = a.assessed_user_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN profiles approver ON approver.id = a.approved_by
    LEFT JOIN profiles rejecter ON rejecter.id = a.rejected_by
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);
  return result.rows;
}

async function countApprovalStatusReport(filters, scope) {
  const values = [];
  const whereClause = buildApprovalWhere(filters, scope, values);

  const query = `
    SELECT COUNT(DISTINCT a.id)::int as total
    FROM assessments a
    JOIN profiles assessed ON assessed.id = a.assessed_user_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    ${whereClause};
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

// ==========================================
// REPORTS MODULE NEW ANALYTICS QUERIES
// ==========================================

function buildProfileScopeConditions(scope, values, tableAlias = 'p') {
  const conditions = [];
  
  if (scope.type === 'PM' || scope.type === 'TM') {
    values.push(scope.userId);
    conditions.push(`${tableAlias}.id = $${values.length}`);
  } else if (scope.type === 'SM' || scope.type === 'SS' || scope.type === 'Cabin Master' || scope.type === 'CABIN MASTER') {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    values.push(scope.userId);
    const allowedRolesStr = scope.userId === '439a8db6-2546-4858-abbc-3752f4acb536'
      ? "'PM', 'Shunting Master', 'TM'"
      : "'PM', 'Shunting Master'";
    conditions.push(`
      (
        (r.name IN (${allowedRolesStr}) AND ${tableAlias}.reporting_officer_id IS NULL)
        OR
        (${tableAlias}.reporting_officer_id = $${values.length})
      )
    `);
  } else if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(scope.type)) {
    values.push(scope.stationId);
    conditions.push(`ssp.station_id = $${values.length}`);
    conditions.push(`r.name IN ('PM', 'SM', 'TM', 'SS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === 'TI') {
    values.push(scope.stationIds);
    conditions.push(`ssp.station_id = ANY($${values.length}::uuid[])`);
    conditions.push(`r.name IN ('PM', 'SM', 'TM', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  } else if (scope.type === 'AOM') {
    values.push(scope.divisionId);
    conditions.push(`s.division_id = $${values.length}`);
    conditions.push(`r.name IN ('PM', 'SM', 'TM', 'SS', 'TI', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER', 'Shunting Master', 'SHUNTING MASTER', 'SHM')`);
  }
  
  return conditions;
}

function buildStationScopeConditions(scope, values) {
  const conditions = [];
  if (scope.type === 'SM' || scope.type === 'SS' || ["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(scope.type) || ["Cabin Master", "CABIN MASTER"].includes(scope.type)) {
    values.push(scope.stationId);
    conditions.push(`s.id = $${values.length}`);
  } else if (scope.type === 'TI') {
    values.push(scope.stationIds);
    conditions.push(`s.id = ANY($${values.length}::uuid[])`);
  } else if (scope.type === 'AOM') {
    values.push(scope.divisionId);
    conditions.push(`s.division_id = $${values.length}`);
  }
  return conditions;
}

function buildQueryContext(filters, scope) {
  const values = [];
  const scopeConditions = buildProfileScopeConditions(scope, values, 'p');
  
  let whereProfileClause = scopeConditions.length > 0 ? `WHERE ${scopeConditions.join(" AND ")}` : "";
  
  const filterConditions = [];
  if (filters.role) {
    values.push(filters.role);
    filterConditions.push(`r.name = $${values.length}`);
  }
  if (filters.stationId) {
    values.push(filters.stationId);
    filterConditions.push(`ssp.station_id = $${values.length}`);
  }
  if (filters.category) {
    values.push(filters.category);
    filterConditions.push(`sc.category_code = $${values.length}`);
  }
  if (filters.search) {
    values.push(`%${filters.search}%`);
    filterConditions.push(`(
      p.full_name ILIKE $${values.length} OR 
      p.hrms_id ILIKE $${values.length} OR 
      s.station_code ILIKE $${values.length}
    )`);
  }
  
  if (filterConditions.length > 0) {
    if (whereProfileClause) {
      whereProfileClause += ` AND ${filterConditions.join(" AND ")}`;
    } else {
      whereProfileClause = `WHERE ${filterConditions.join(" AND ")}`;
    }
  }

  const profileValuesCount = values.length;

  const assessConditions = [];
  if (filters.assessmentStatus) {
    values.push(filters.assessmentStatus);
    assessConditions.push(`a.status = $${values.length}`);
  }
  if (filters.approvalStatus) {
    values.push(filters.approvalStatus);
    assessConditions.push(`a.approval_status = $${values.length}`);
  }
  if (filters.assessmentCycle) {
    values.push(filters.assessmentCycle);
    assessConditions.push(`a.assessment_cycle = $${values.length}`);
  }
  if (filters.fromDate) {
    values.push(filters.fromDate);
    assessConditions.push(`a.created_at >= $${values.length}::timestamp`);
  }
  if (filters.toDate) {
    values.push(filters.toDate);
    assessConditions.push(`a.created_at <= $${values.length}::timestamp`);
  }

  let whereAssessClause = assessConditions.length > 0 ? `WHERE ${assessConditions.join(" AND ")}` : "";

  return { values, whereProfileClause, whereAssessClause, profileValuesCount };
}

async function getReportsSummaryDb(filters, scope) {
  const { values, whereProfileClause, whereAssessClause } = buildQueryContext(filters, scope);

  const query = `
    WITH scoped_profiles AS (
      SELECT p.id, p.full_name, p.hrms_id, r.name as role_code, ssp.station_id, s.division_id, sc.category_code
      FROM profiles p
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
      ${whereProfileClause}
    ),
    scoped_assessments AS (
      SELECT a.id, a.assessed_user_id, a.status, a.approval_status, a.percentage, a.assessment_cycle
      FROM assessments a
      JOIN scoped_profiles sp ON sp.id = a.assessed_user_id
      ${whereAssessClause}
    )
    SELECT
      COUNT(sa.id)::int as "totalAssessments",
      COUNT(sa.id) FILTER (WHERE sa.status = 'completed')::int as "completedAssessments",
      COUNT(sa.id) FILTER (WHERE sa.approval_status = 'pending_approval')::int as "pendingApprovals",
      COALESCE(AVG(sa.percentage) FILTER (WHERE sa.status = 'completed')::numeric(10,2), 0) as "averageScore",
      (SELECT COUNT(DISTINCT id) FROM scoped_profiles WHERE category_code = 'A')::int as "categoryAEmployees",
      (SELECT COUNT(DISTINCT id) FROM scoped_profiles WHERE category_code = 'D')::int as "categoryDEmployees",
      CASE
        WHEN COUNT(sa.id) FILTER (WHERE sa.status = 'completed') > 0
        THEN (COUNT(sa.id) FILTER (WHERE sa.status = 'completed' AND sa.percentage >= 60)::float / COUNT(sa.id) FILTER (WHERE sa.status = 'completed')::float * 100)::numeric(10,2)
        ELSE 0
      END as "passRate",
      CASE
        WHEN COUNT(sa.id) > 0
        THEN (COUNT(sa.id) FILTER (WHERE sa.status = 'completed')::float / COUNT(sa.id)::float * 100)::numeric(10,2)
        ELSE 0
      END as "safetyComplianceRate",
      (SELECT COUNT(DISTINCT id) FROM scoped_profiles WHERE category_code = 'D' OR id IN (
         SELECT assessed_user_id FROM assessments WHERE status = 'completed' AND percentage < 60
      ))::int as "highRiskStaff",
      COUNT(DISTINCT sp.station_id)::int as "activeStations",
      COUNT(DISTINCT sa.assessment_cycle) FILTER (WHERE sa.assessment_cycle IS NOT NULL)::int as "assessmentCyclesCompleted"
    FROM scoped_assessments sa
    LEFT JOIN scoped_profiles sp ON sp.id = sa.assessed_user_id;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getReportsPerformanceDb(filters, scope) {
  const { values, whereProfileClause, whereAssessClause, profileValuesCount } = buildQueryContext(filters, scope);

  // 1. scoreTrend
  const scoreTrendQuery = `
    WITH scoped_profiles AS (
      SELECT p.id
      FROM profiles p
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
      ${whereProfileClause}
    )
    SELECT
      TO_CHAR(a.created_at, 'Mon YYYY') as month,
      DATE_TRUNC('month', a.created_at) as month_date,
      COALESCE(AVG(a.percentage), 0)::numeric(10,2) as "averageScore"
    FROM assessments a
    JOIN scoped_profiles sp ON sp.id = a.assessed_user_id
    ${whereAssessClause ? whereAssessClause + " AND a.status = 'completed'" : "WHERE a.status = 'completed'"}
    GROUP BY month, month_date
    ORDER BY month_date ASC;
  `;

  // 2. completionTrend
  const completionTrendQuery = `
    WITH scoped_profiles AS (
      SELECT p.id
      FROM profiles p
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
      ${whereProfileClause}
    )
    SELECT
      TO_CHAR(a.created_at, 'Mon YYYY') as month,
      DATE_TRUNC('month', a.created_at) as month_date,
      COUNT(a.id) FILTER (WHERE a.status = 'completed')::int as completed,
      COUNT(a.id) FILTER (WHERE a.status != 'completed')::int as pending
    FROM assessments a
    JOIN scoped_profiles sp ON sp.id = a.assessed_user_id
    ${whereAssessClause}
    GROUP BY month, month_date
    ORDER BY month_date ASC;
  `;

  // 3. categoryDistribution
  const categoryQuery = `
    WITH scoped_profiles AS (
      SELECT p.id, sc.category_code
      FROM profiles p
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
      ${whereProfileClause}
    )
    SELECT
      COALESCE(category_code, 'Unassigned') as category,
      COUNT(id)::int as count
    FROM scoped_profiles
    GROUP BY category_code
    ORDER BY category_code ASC;
  `;

  // 4. approvalDistribution
  const approvalQuery = `
    WITH scoped_profiles AS (
      SELECT p.id
      FROM profiles p
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
      ${whereProfileClause}
    )
    SELECT
      COALESCE(a.approval_status, 'pending_approval') as status,
      COUNT(a.id)::int as count
    FROM assessments a
    JOIN scoped_profiles sp ON sp.id = a.assessed_user_id
    ${whereAssessClause ? whereAssessClause + " AND a.status = 'completed'" : "WHERE a.status = 'completed'"}
    GROUP BY a.approval_status;
  `;

  const [scoreRes, completionRes, categoryRes, approvalRes] = await Promise.all([
    pool.query(scoreTrendQuery, values),
    pool.query(completionTrendQuery, values),
    pool.query(categoryQuery, values.slice(0, profileValuesCount)),
    pool.query(approvalQuery, values)
  ]);

  // Dynamically calculate the last 3 months
  const pastMonths = [];
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const tempDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = tempDate.toLocaleString('en-US', { month: 'short' });
    const yearStr = tempDate.getFullYear();
    pastMonths.push(`${monthStr} ${yearStr}`); // e.g. "Apr 2026", "May 2026", "Jun 2026"
  }

  const scoreTrend = pastMonths.map(m => {
    const found = scoreRes.rows.find(row => row.month === m);
    return {
      month: m,
      averageScore: found ? parseFloat(found.averageScore) : 0
    };
  });

  const completionTrend = pastMonths.map(m => {
    const found = completionRes.rows.find(row => row.month === m);
    return {
      month: m,
      completed: found ? parseInt(found.completed, 10) : 0,
      pending: found ? parseInt(found.pending, 10) : 0
    };
  });

  return {
    scoreTrend,
    completionTrend,
    categoryDistribution: categoryRes.rows,
    approvalDistribution: approvalRes.rows
  };
}

async function getReportsHighRiskDb(filters, scope) {
  const { values, whereProfileClause, profileValuesCount } = buildQueryContext(filters, scope);
  
  const query = `
    WITH scoped_profiles AS (
      SELECT p.id, p.full_name, p.hrms_id, r.name as role_code, ssp.station_id, s.station_name, s.station_code, sc.category_code, s.division_id
      FROM profiles p
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
      ${whereProfileClause}
    ),
    latest_completed_assessments AS (
      SELECT DISTINCT ON (assessed_user_id) 
        id, assessed_user_id, percentage, assessor_user_id, evaluated_at, approval_status
      FROM assessments
      WHERE status = 'completed'
      ORDER BY assessed_user_id, created_at DESC
    )
    SELECT
      sp.id as "userId",
      sp.full_name as "fullName",
      sp.hrms_id as "hrmsId",
      sp.role_code as "role",
      sp.station_name as "stationName",
      sp.station_code as "stationCode",
      sp.category_code as "category",
      lca.percentage as "latestScore",
      lca.evaluated_at as "lastAssessmentDate",
      assessor.full_name as "assessorName",
      CASE
        WHEN sp.role_code IN ('PM', 'Shunting Master') THEN COALESCE(sm.full_name, ti.full_name, aom.full_name, 'Reporting Authority')
        WHEN sp.role_code IN ('SM', 'SS', 'TM') THEN COALESCE(ti.full_name, aom.full_name, 'Reporting Authority')
        WHEN sp.role_code = 'TI' THEN COALESCE(aom.full_name, 'Reporting Authority')
        WHEN sp.role_code = 'AOM' THEN 'Sr. DOM'
        ELSE 'Reporting Authority'
      END as "reportingAuthority"
    FROM scoped_profiles sp
    LEFT JOIN latest_completed_assessments lca ON lca.assessed_user_id = sp.id
    LEFT JOIN profiles assessor ON assessor.id = lca.assessor_user_id
    
    -- SM
    LEFT JOIN staff_station_postings ssp_sm ON ssp_sm.station_id = sp.station_id AND ssp_sm.is_current = true
    LEFT JOIN profiles sm ON sm.id = ssp_sm.profile_id AND sm.role_id = (SELECT id FROM roles WHERE name = 'SM')
    
    -- TI
    LEFT JOIN station_assignments sa_ti ON sa_ti.station_id = sp.station_id AND sa_ti.assignment_type = 'TI_AREA' AND sa_ti.assigned_to IS NULL
    LEFT JOIN profiles ti ON ti.id = sa_ti.profile_id
    
    -- AOM
    LEFT JOIN division_assignments da_aom ON da_aom.division_id = sp.division_id AND da_aom.is_current = true
    LEFT JOIN profiles aom ON aom.id = da_aom.profile_id
    
    WHERE (sp.category_code = 'D' OR lca.percentage < 60)
    ORDER BY sp.full_name ASC;
  `;
  
  const result = await pool.query(query, values.slice(0, profileValuesCount));
  return result.rows;
}

async function getReportsStationsDb(filters, scope) {
  const values = [];
  const scopeConditions = buildStationScopeConditions(scope, values);
  let whereClause = scopeConditions.length > 0 ? `WHERE ${scopeConditions.join(" AND ")}` : "";

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const cond = `(s.station_name ILIKE $${values.length} OR s.station_code ILIKE $${values.length})`;
    whereClause = whereClause ? `${whereClause} AND ${cond}` : `WHERE ${cond}`;
  }

  const query = `
    SELECT
      s.id as "stationId",
      s.station_code as "stationCode",
      s.station_name as "stationName",
      COUNT(DISTINCT p.id)::int as "totalEmployees",
      COALESCE(AVG(a.percentage) FILTER (WHERE a.status = 'completed'), 0)::numeric(10,2) as "averageScore",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'A')::int as "categoryA",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'B')::int as "categoryB",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'C')::int as "categoryC",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D')::int as "categoryD",
      COUNT(DISTINCT p.id) FILTER (WHERE sc.category_code = 'D' OR p.id IN (
        SELECT assessed_user_id FROM assessments WHERE status = 'completed' AND percentage < 60
      ))::int as "highRiskCount",
      COUNT(DISTINCT a.id) FILTER (WHERE a.approval_status = 'pending_approval')::int as "pendingApprovals"
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
    LEFT JOIN assessments a ON a.assessed_user_id = p.id
    ${whereClause}
    GROUP BY s.id, s.station_code, s.station_name
    ORDER BY s.station_code ASC;
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function getReportsCyclesDb(filters, scope) {
  const { values, whereProfileClause, profileValuesCount } = buildQueryContext(filters, scope);
  
  const query = `
    WITH scoped_profiles AS (
      SELECT p.id
      FROM profiles p
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
      ${whereProfileClause}
    )
    SELECT
      COALESCE(a.assessment_cycle, 'General Assessment') as "cycleName",
      COUNT(a.id)::int as "totalAssessments",
      COUNT(a.id) FILTER (WHERE a.status = 'completed')::int as "completedCount",
      COUNT(a.id) FILTER (WHERE a.status != 'completed')::int as "pendingCount",
      COUNT(a.id) FILTER (WHERE a.approval_status = 'approved')::int as "approvedCount",
      COUNT(a.id) FILTER (WHERE a.approval_status = 'rejected')::int as "rejectedCount",
      COALESCE(AVG(a.percentage) FILTER (WHERE a.status = 'completed'), 0)::numeric(10,2) as "averageScore"
    FROM assessments a
    JOIN scoped_profiles sp ON sp.id = a.assessed_user_id
    GROUP BY a.assessment_cycle
    ORDER BY "cycleName" ASC;
  `;

  const result = await pool.query(query, values.slice(0, profileValuesCount));
  return result.rows;
}

async function getEmployeeReportDb(employeeId) {
  const summaryQuery = `
    SELECT
      p.id as "userId",
      p.full_name as "fullName",
      p.hrms_id as "hrmsId",
      r.name as "role",
      r.display_name as "roleDisplayName",
      s.id as "stationId",
      s.station_name as "stationName",
      s.station_code as "stationCode",
      d.id as "divisionId",
      d.name as "divisionName",
      d.code as "divisionCode",
      sc.category_code as "category",
      CASE
        WHEN r.name IN ('PM', 'Shunting Master') THEN COALESCE(sm.full_name, ti.full_name, aom.full_name, 'Reporting Authority')
        WHEN r.name IN ('SM', 'SS', 'TM') THEN COALESCE(ti.full_name, aom.full_name, 'Reporting Authority')
        WHEN r.name = 'TI' THEN COALESCE(aom.full_name, 'Reporting Authority')
        WHEN r.name = 'AOM' THEN 'Sr. DOM'
        ELSE 'Reporting Authority'
      END as "reportingAuthority"
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN divisions d ON d.id = s.division_id
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = p.id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    
    -- SM
    LEFT JOIN staff_station_postings ssp_sm ON ssp_sm.station_id = s.id AND ssp_sm.is_current = true
    LEFT JOIN profiles sm ON sm.id = ssp_sm.profile_id AND sm.role_id = (SELECT id FROM roles WHERE name = 'SM')
    
    -- TI
    LEFT JOIN station_assignments sa_ti ON sa_ti.station_id = s.id AND sa_ti.assignment_type = 'TI_AREA' AND sa_ti.assigned_to IS NULL
    LEFT JOIN profiles ti ON ti.id = sa_ti.profile_id
    
    -- AOM
    LEFT JOIN division_assignments da_aom ON da_aom.division_id = d.id AND da_aom.is_current = true
    LEFT JOIN profiles aom ON aom.id = da_aom.profile_id
    
    WHERE p.id = $1;
  `;
  const summaryRes = await pool.query(summaryQuery, [employeeId]);
  const summary = summaryRes.rows[0];
  if (!summary) return null;

  const historyQuery = `
    SELECT
      a.id as "assessmentId",
      a.assessment_cycle as "cycle",
      a.created_at as "date",
      a.total_score as "score",
      a.percentage as "percentage",
      a.status,
      a.approval_status as "approvalStatus",
      assessor.full_name as "assessorName"
    FROM assessments a
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    WHERE a.assessed_user_id = $1
    ORDER BY a.created_at DESC;
  `;
  const historyRes = await pool.query(historyQuery, [employeeId]);
  const history = historyRes.rows;

  const trendQuery = `
    SELECT
      a.id as "assessmentId",
      a.assessment_cycle as "cycle",
      a.created_at as "date",
      a.percentage as "score"
    FROM assessments a
    WHERE a.assessed_user_id = $1 AND a.status = 'completed'
    ORDER BY a.created_at ASC;
  `;
  const trendRes = await pool.query(trendQuery, [employeeId]);
  const scoreTrend = trendRes.rows;

  const categoryHistoryQuery = `
    SELECT
      sc.category_code as "category",
      ec.assigned_date as "date",
      ec.remarks,
      assigner.full_name as "assignedBy"
    FROM employee_categories ec
    JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN profiles assigner ON assigner.id = ec.assigned_by
    WHERE ec.profile_id = $1
    ORDER BY ec.created_at DESC;
  `;
  const categoryHistoryRes = await pool.query(categoryHistoryQuery, [employeeId]);
  const categoryHistory = categoryHistoryRes.rows;

  const recentQuery = `
    SELECT
      a.id as "assessmentId",
      a.mcq_score as "mcqScore",
      a.evaluation_score as "evaluationScore",
      a.total_score as "finalScore",
      a.max_marks as "maxMarks",
      a.percentage,
      a.approval_status as "approvalStatus",
      sc.category_code as "category"
    FROM assessments a
    LEFT JOIN LATERAL (
      SELECT category_id FROM employee_categories ec_inner
      WHERE ec_inner.profile_id = a.assessed_user_id
      ORDER BY ec_inner.created_at DESC
      LIMIT 1
    ) ec ON true
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE a.assessed_user_id = $1 AND a.status = 'completed'
    ORDER BY a.created_at DESC
    LIMIT 1;
  `;
  const recentRes = await pool.query(recentQuery, [employeeId]);
  const recentAssessment = recentRes.rows[0] || null;

  return {
    summary,
    history,
    scoreTrend,
    categoryHistory,
    recentAssessment
  };
}

module.exports = {
  getSmStation,
  getTiStations,
  getAomDivision,
  
  getAssessmentsReport,
  countAssessmentsReport,
  
  getStaffPerformanceReport,
  countStaffPerformanceReport,
  
  getStationSummaryReport,
  countStationSummaryReport,
  
  getApprovalStatusReport,
  countApprovalStatusReport,

  getReportsSummaryDb,
  getReportsPerformanceDb,
  getReportsHighRiskDb,
  getReportsStationsDb,
  getReportsCyclesDb,
  getEmployeeReportDb,
};

