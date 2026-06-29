const pool = require("../../config/database");

async function getRoleByName(roleName) {
  const query = `
    SELECT *
    FROM roles
    WHERE name = $1
  `;

  const result = await pool.query(query, [
    roleName,
  ]);

  return result.rows[0];
}

async function findUserByHrmsId(hrmsId) {
  const query = `
    SELECT *
    FROM profiles
    WHERE hrms_id = $1
  `;

  const result = await pool.query(query, [
    hrmsId,
  ]);

  return result.rows[0];
}
async function createProfile(userData) {
  const query = `
    INSERT INTO profiles (
      role_id,
      full_name,
      email,
      phone,
      hrms_id,
      employee_id,
      status,
      designation
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    userData.roleId,
    userData.fullName,
    userData.email || null,
    userData.phone || null,
    userData.hrmsId,
    userData.employeeId || null,
    userData.designation || null,
  ]);

  return result.rows[0];
}

async function createUserCredential(
  profileId,
  hrmsId,
  passwordHash
) {
  const query = `
    INSERT INTO user_credentials (
      profile_id,
      hrms_id,
      password_hash,
      must_change_password,
      failed_login_attempts,
      is_locked
    )
    VALUES ($1, $2, $3, true, 0, false)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    profileId,
    hrmsId,
    passwordHash,
  ]);

  return result.rows[0];
}

async function getUsers(filters = {}) {
  const {
    creatorUserId,
    creatorRole,
    roleCode,
    status,
    search,
    stationId,
    category,
    tiArea,
    riskLevel,
    page = 1,
    limit = 10,
  } = filters;

  const offset = (Number(page) - 1) * Number(limit);
  const values = [];
  const conditions = [];

  let query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.phone,
      p.designation,
      p.status,
      p.pme_due,
      p.pme_done,
      p.ref_due,
      p.ref_done,
      r.name as role,
      s.id as station_id,
      s.station_name,
      s.station_code,
      sc.category_code,
      latest_assessment.percentage,
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B','C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END as risk_level
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp
      ON ssp.profile_id = p.id
      AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN employee_categories ec ON ec.profile_id = p.id
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT a.percentage
      FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND a.status = 'completed'
      ORDER BY a.created_at DESC
      LIMIT 1
    ) latest_assessment ON true
  `;

  if (roleCode) {
    values.push(roleCode);
    conditions.push(`r.name = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }

  if (stationId) {
    values.push(stationId);
    conditions.push(`s.id = $${values.length}`);
  }

  if (category) {
    values.push(category);
    conditions.push(`sc.category_code = $${values.length}`);
  }

  if (tiArea) {
    values.push(tiArea);
    conditions.push(`
      s.id IN (
        SELECT station_id
        FROM station_assignments
        WHERE profile_id = $${values.length}
          AND assignment_type = 'TI_AREA'
          AND assigned_to IS NULL
      )
    `);
  }

  if (riskLevel) {
    values.push(riskLevel);
    conditions.push(`
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B','C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END = $${values.length}
    `);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`
      (
        p.full_name ILIKE $${values.length}
        OR p.hrms_id ILIKE $${values.length}
        OR p.phone ILIKE $${values.length}
        OR p.designation ILIKE $${values.length}
      )
    `);
  }

  if (creatorRole === "SM" || creatorRole === "SS" || ["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS"].includes(creatorRole) || ["Cabin Master", "CABIN MASTER"].includes(creatorRole)) {
    values.push(creatorUserId);

    conditions.push(`
      s.id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $${values.length}
          AND is_current = true
        LIMIT 1
      )
    `);

    if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS"].includes(creatorRole)) {
      conditions.push(`
        (
          r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'Cabin Master', 'CABIN MASTER', 'TM', 'SM', 'SS')
        )
      `);
    } else {
      if (creatorUserId === '439a8db6-2546-4858-abbc-3752f4acb536') {
        conditions.push(`
          (
            (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'TM') AND p.reporting_officer_id IS NULL)
            OR
            (p.reporting_officer_id = $${values.length})
          )
        `);
      } else {
        conditions.push(`
          (
            (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM') AND p.reporting_officer_id IS NULL)
            OR
            (p.reporting_officer_id = $${values.length})
          )
        `);
      }
    }
  }

if (creatorRole === "TI") {
  values.push(creatorUserId);

  conditions.push(`
    s.id IN (
      SELECT station_id
      FROM station_assignments
      WHERE profile_id = $${values.length}
        AND assignment_type = 'TI_AREA'
        AND assigned_to IS NULL
    )
  `);
}

if (creatorRole === "AOM") {
  values.push(creatorUserId);

  conditions.push(`
    s.division_id = (
      SELECT division_id
      FROM division_assignments
      WHERE profile_id = $${values.length}
        AND is_current = true
      LIMIT 1
    )
  `);
}

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")} `;
  }

  query += `
    ORDER BY p.full_name
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2};
  `;

  values.push(Number(limit), offset);

  const result = await pool.query(query, values);
  return result.rows;
}

async function updateUser(
  userId,
  userData
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const profileQuery = `
      UPDATE profiles
      SET
        full_name = $1,
        email = $2,
        phone = $3,
        designation = $4,
        status = $5,
        hrms_id = $6,
        pme_due = $7,
        pme_done = $8,
        ref_due = $9,
        ref_done = $10,
        updated_at = now()
      WHERE id = $11
      RETURNING *;
    `;

    const profileRes = await client.query(profileQuery, [
      userData.fullName,
      userData.email,
      userData.phone,
      userData.designation,
      userData.status,
      userData.hrmsId,
      userData.pmeDue || null,
      userData.pmeDone || null,
      userData.refDue || null,
      userData.refDone || null,
      userId,
    ]);

    const credentialsQuery = `
      UPDATE user_credentials
      SET
        hrms_id = $1
      WHERE profile_id = $2;
    `;

    await client.query(credentialsQuery, [
      userData.hrmsId,
      userId,
    ]);

    await client.query("COMMIT");
    return profileRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deactivateUser(userId) {
  const query = `
    UPDATE profiles
    SET
      status = 'inactive',
      updated_at = now()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [
    userId,
  ]);

  return result.rows[0];
}

async function updateUserPassword(
  userId,
  passwordHash
) {
  const query = `
    UPDATE user_credentials
    SET
      password_hash = $1,
      must_change_password = true,
      failed_login_attempts = 0,
      is_locked = false
    WHERE profile_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [
    passwordHash,
    userId,
  ]);

  return result.rows[0];
}

async function activateUser(userId) {
  const query = `
    UPDATE profiles
    SET
      status = 'active',
      updated_at = now()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(
    query,
    [userId]
  );

  return result.rows[0];
}

async function getCurrentPosting(profileId) {
  const query = `
    SELECT *
    FROM staff_station_postings
    WHERE profile_id = $1
      AND is_current = true
    LIMIT 1;
  `;

  const result = await pool.query(query, [
    profileId,
  ]);

  return result.rows[0];
}

async function getStationById(stationId) {
  const query = `
    SELECT *
    FROM stations
    WHERE id = $1;
  `;

  const result = await pool.query(query, [
    stationId,
  ]);

  return result.rows[0];
}

async function closeCurrentPosting(
  postingId
) {
  const query = `
    UPDATE staff_station_postings
    SET
      is_current = false,
      posted_to = CURRENT_DATE
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [
    postingId,
  ]);

  return result.rows[0];
}

async function createNewPosting({
  profileId,
  stationId,
  transferredBy,
  reason,
}) {
  const query = `
    INSERT INTO staff_station_postings (
      profile_id,
      station_id,
      posted_from,
      posted_to,
      is_current,
      posting_type,
      remarks,
      transferred_by,
      transfer_reason
    )
    VALUES (
      $1,
      $2,
      CURRENT_DATE,
      NULL,
      true,
      'TRANSFER',
      $3,
      $4,
      $5
    )
    RETURNING *;
  `;

  const result = await pool.query(query, [
    profileId,
    stationId,
    reason,
    transferredBy,
    reason,
  ]);

  return result.rows[0];
}

async function countUsers(filters = {}) {
  const {
    creatorUserId,
    creatorRole,
    roleCode,
    status,
    search,
    stationId,
    category,
    tiArea,
    riskLevel,
  } = filters;
  
  const values = [];
  const conditions = [];

  let query = `
    SELECT COUNT(*)::int as total
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp
      ON ssp.profile_id = p.id
      AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN employee_categories ec ON ec.profile_id = p.id
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT a.percentage
      FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND a.status = 'completed'
      ORDER BY a.created_at DESC
      LIMIT 1
    ) latest_assessment ON true
  `;

  if (roleCode) {
    values.push(roleCode);
    conditions.push(`r.name = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }

  if (stationId) {
    values.push(stationId);
    conditions.push(`s.id = $${values.length}`);
  }

  if (category) {
    values.push(category);
    conditions.push(`sc.category_code = $${values.length}`);
  }

  if (tiArea) {
    values.push(tiArea);
    conditions.push(`
      s.id IN (
        SELECT station_id
        FROM station_assignments
        WHERE profile_id = $${values.length}
          AND assignment_type = 'TI_AREA'
          AND assigned_to IS NULL
      )
    `);
  }

  if (riskLevel) {
    values.push(riskLevel);
    conditions.push(`
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B','C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END = $${values.length}
    `);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`
      (
        p.full_name ILIKE $${values.length}
        OR p.hrms_id ILIKE $${values.length}
        OR p.phone ILIKE $${values.length}
        OR p.designation ILIKE $${values.length}
      )
    `);
  }

  if (creatorRole === "SM" || creatorRole === "SS" || ["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS"].includes(creatorRole) || ["Cabin Master", "CABIN MASTER"].includes(creatorRole)) {
    values.push(creatorUserId);

    conditions.push(`
      s.id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $${values.length}
          AND is_current = true
        LIMIT 1
      )
    `);

    if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS"].includes(creatorRole)) {
      conditions.push(`
        (
          r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'Cabin Master', 'CABIN MASTER', 'TM', 'SM', 'SS')
        )
      `);
    } else {
      if (creatorUserId === '439a8db6-2546-4858-abbc-3752f4acb536') {
        conditions.push(`
          (
            (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'TM') AND p.reporting_officer_id IS NULL)
            OR
            (p.reporting_officer_id = $${values.length})
          )
        `);
      } else {
        conditions.push(`
          (
            (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM') AND p.reporting_officer_id IS NULL)
            OR
            (p.reporting_officer_id = $${values.length})
          )
        `);
      }
    }
  }

if (creatorRole === "TI") {
  values.push(creatorUserId);

  conditions.push(`
    s.id IN (
      SELECT station_id
      FROM station_assignments
      WHERE profile_id = $${values.length}
        AND assignment_type = 'TI_AREA'
        AND assigned_to IS NULL
    )
  `);
}

if (creatorRole === "AOM") {
  values.push(creatorUserId);

  conditions.push(`
    s.division_id = (
      SELECT division_id
      FROM division_assignments
      WHERE profile_id = $${values.length}
        AND is_current = true
      LIMIT 1
    )
  `);
}

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")} `;
  }

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

async function getUserById(userId) {
  const query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.employee_id,
      p.email,
      p.phone,
      p.designation,
      p.status,
      p.created_at,
      p.updated_at,
      p.pme_due,
      p.pme_done,
      p.ref_due,
      p.ref_done,
      r.name as role
    FROM profiles p
    JOIN roles r
      ON r.id = p.role_id
    WHERE p.id = $1;
  `;

  const result = await pool.query(query, [
    userId,
  ]);

  return result.rows[0];
}

async function getUserProfileDetails(userId) {
  // 1. Get base user details
  const userBase = await getUserById(userId);
  if (!userBase) return null;

  // 2. Get posting details
  const postingQuery = `
    SELECT s.id as station_id, s.station_name, s.station_code, d.name as division_name, d.code as division_code, d.zone,
           ssp.posted_from, ssp.posted_to, ssp.posting_type, ssp.remarks as posting_remarks
    FROM staff_station_postings ssp
    JOIN stations s ON s.id = ssp.station_id
    JOIN divisions d ON d.id = s.division_id
    WHERE ssp.profile_id = $1 AND ssp.is_current = true
    LIMIT 1;
  `;
  const postingRes = await pool.query(postingQuery, [userId]);
  const posting = postingRes.rows[0] || {};

  // 3. Get category & risk details
  const categoryQuery = `
    SELECT sc.category_code, sc.category_name, ec.assigned_date, ec.remarks, ec.category_id
    FROM employee_categories ec
    JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE ec.profile_id = $1
    ORDER BY ec.created_at DESC
    LIMIT 1;
  `;
  const categoryRes = await pool.query(categoryQuery, [userId]);
  const category = categoryRes.rows[0] || {};

  // Calculate risk level
  let riskLevel = 'NOT_CATEGORIZED';
  if (category.category_code === 'A') riskLevel = 'LOW';
  else if (category.category_code === 'B' || category.category_code === 'C') riskLevel = 'MEDIUM';
  else if (category.category_code === 'D') riskLevel = 'HIGH';

  // 4. Reporting Hierarchy
  const hierarchy = {};
  
  // Station ID is either the user's direct posting station or, for assignments:
  let stationId = posting.station_id;
  let divisionId = null;

  // If no direct station posting, see if they have a station assignment (for TI) or division assignment (for AOM)
  if (!stationId) {
    const tiAssignQuery = `SELECT station_id FROM station_assignments WHERE profile_id = $1 AND assignment_type = 'TI_AREA' AND assigned_to IS NULL LIMIT 1`;
    const tiAssignRes = await pool.query(tiAssignQuery, [userId]);
    if (tiAssignRes.rows[0]) stationId = tiAssignRes.rows[0].station_id;
  }

  // Get division ID
  if (stationId) {
    const stationDivRes = await pool.query(`SELECT division_id FROM stations WHERE id = $1`, [stationId]);
    if (stationDivRes.rows[0]) divisionId = stationDivRes.rows[0].division_id;
  } else {
    const divAssignQuery = `SELECT division_id FROM division_assignments WHERE profile_id = $1 AND is_current = true LIMIT 1`;
    const divAssignRes = await pool.query(divAssignQuery, [userId]);
    if (divAssignRes.rows[0]) divisionId = divAssignRes.rows[0].division_id;
  }

  // Fetch SM, TI, AOM based on stationId and divisionId
  if (stationId) {
    // SM
    const smQuery = `
      SELECT p.id, p.full_name, p.phone, p.email, p.hrms_id
      FROM staff_station_postings ssp
      JOIN profiles p ON p.id = ssp.profile_id
      JOIN roles r ON r.id = p.role_id
      WHERE ssp.station_id = $1 AND ssp.is_current = true AND r.name = 'SM'
      LIMIT 1;
    `;
    const smRes = await pool.query(smQuery, [stationId]);
    hierarchy.assignedSm = smRes.rows[0] || null;

    // TI
    const tiQuery = `
      SELECT p.id, p.full_name, p.phone, p.email, p.hrms_id
      FROM station_assignments sa
      JOIN profiles p ON p.id = sa.profile_id
      WHERE sa.station_id = $1 AND sa.assignment_type = 'TI_AREA' AND sa.assigned_to IS NULL
      LIMIT 1;
    `;
    const tiRes = await pool.query(tiQuery, [stationId]);
    hierarchy.assignedTi = tiRes.rows[0] || null;

    // Station Master Supervisor (SMS)
    const smsQuery = `
      SELECT p.id, p.full_name, p.phone, p.email, p.hrms_id
      FROM staff_station_postings ssp
      JOIN profiles p ON p.id = ssp.profile_id
      JOIN roles r ON r.id = p.role_id
      WHERE ssp.station_id = $1 AND ssp.is_current = true AND r.name = 'Station Master Supervisor'
      LIMIT 1;
    `;
    const smsRes = await pool.query(smsQuery, [stationId]);
    hierarchy.assignedSms = smsRes.rows[0] || null;
  }

  if (divisionId) {
    // AOM
    const aomQuery = `
      SELECT p.id, p.full_name, p.phone, p.email, p.hrms_id, d.name as division_name, d.code as division_code, d.zone
      FROM division_assignments da
      JOIN profiles p ON p.id = da.profile_id
      JOIN divisions d ON d.id = da.division_id
      WHERE da.division_id = $1 AND da.is_current = true
      LIMIT 1;
    `;
    const aomRes = await pool.query(aomQuery, [divisionId]);
    hierarchy.assignedAom = aomRes.rows[0] || null;
    
    // Division Info
    const divRes = await pool.query(`SELECT name, code, zone FROM divisions WHERE id = $1`, [divisionId]);
    hierarchy.divisionInfo = divRes.rows[0] || null;
  }

  // 5. Assessment Summary
  const summaryQuery = `
    SELECT 
      COUNT(*)::int as total_assessments,
      COALESCE(MAX(percentage), 0)::numeric as highest_score,
      COALESCE(MIN(percentage), 0)::numeric as lowest_score,
      COALESCE(AVG(percentage), 0)::numeric as average_score
    FROM assessments
    WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved';
  `;
  const summaryRes = await pool.query(summaryQuery, [userId]);
  const summary = summaryRes.rows[0] || { total_assessments: 0, highest_score: 0, lowest_score: 0, average_score: 0 };

  // Get last assessment date
  const lastAssessmentDateQuery = `
    SELECT evaluated_at
    FROM assessments
    WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
    ORDER BY evaluated_at DESC
    LIMIT 1;
  `;
  const lastAssessmentDateRes = await pool.query(lastAssessmentDateQuery, [userId]);
  const lastAssessmentDate = lastAssessmentDateRes.rows[0] ? lastAssessmentDateRes.rows[0].evaluated_at : null;

  // 6. Score Trend Graph (last 10 completed assessments)
  const trendQuery = `
    SELECT percentage, evaluated_at, created_at
    FROM assessments
    WHERE assessed_user_id = $1 AND status = 'completed' AND approval_status = 'approved'
    ORDER BY evaluated_at ASC, created_at ASC
    LIMIT 10;
  `;
  const trendRes = await pool.query(trendQuery, [userId]);
  const trend = trendRes.rows;

  // 7. Assessment History
  const historyQuery = `
    SELECT 
      a.id,
      a.created_at,
      a.submitted_at,
      a.evaluated_at,
      a.percentage as final_score,
      a.status,
      a.approval_status,
      assessor.full_name as assessor_name,
      a.assessed_role_code as assessment_type,
      sc.category_code,
      CASE
        WHEN sc.category_code = 'A' THEN 'LOW'
        WHEN sc.category_code IN ('B','C') THEN 'MEDIUM'
        WHEN sc.category_code = 'D' THEN 'HIGH'
        ELSE 'NOT_CATEGORIZED'
      END as risk_level
    FROM assessments a
    LEFT JOIN profiles assessor ON assessor.id = a.assessor_user_id
    LEFT JOIN employee_categories ec ON ec.profile_id = a.assessed_user_id
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    WHERE a.assessed_user_id = $1
    ORDER BY a.created_at DESC;
  `;
  const historyRes = await pool.query(historyQuery, [userId]);
  const history = historyRes.rows;

  return {
    ...userBase,
    stationName: posting.station_name || null,
    stationCode: posting.station_code || null,
    divisionName: posting.division_name || (hierarchy.divisionInfo ? hierarchy.divisionInfo.name : null),
    divisionCode: posting.division_code || (hierarchy.divisionInfo ? hierarchy.divisionInfo.code : null),
    zone: posting.zone || (hierarchy.divisionInfo ? hierarchy.divisionInfo.zone : null),
    postedFrom: posting.posted_from || null,
    postedTo: posting.posted_to || null,
    postingType: posting.posting_type || null,
    postingRemarks: posting.posting_remarks || null,
    categoryCode: category.category_code || null,
    categoryName: category.category_name || null,
    categoryId: category.category_id || null,
    riskLevel,
    lastAssessmentDate,
    hierarchy,
    summary: {
      totalAssessments: summary.total_assessments,
      highestScore: Number(summary.highest_score),
      lowestScore: Number(summary.lowest_score),
      averageScore: Number(summary.average_score)
    },
    trend: trend.map(t => ({
      score: Number(t.percentage),
      date: t.evaluated_at || t.created_at
    })),
    history: history.map(h => ({
      id: h.id,
      createdAt: h.createdAt || h.created_at,
      submittedAt: h.submittedAt || h.submitted_at,
      evaluatedAt: h.evaluatedAt || h.evaluated_at,
      finalScore: h.final_score !== null ? Number(h.final_score) : null,
      status: h.status,
      approvalStatus: h.approval_status,
      assessorName: h.assessor_name || '--',
      assessmentType: h.assessment_type || '--',
      category: h.category_code || 'N/A',
      riskLevel: h.risk_level || 'NOT_CATEGORIZED'
    }))
  };
}

async function createDivisionAssignment({ profileId, divisionId }) {
  const query = `
    INSERT INTO division_assignments (profile_id, division_id, assigned_from, is_current)
    VALUES ($1, $2, CURRENT_DATE, true)
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId, divisionId]);
  return result.rows[0];
}

async function assignUserCategory({ profileId, categoryId, assignedBy }) {
  const query = `
    INSERT INTO employee_categories (profile_id, category_id, assigned_by, assigned_date, valid_from)
    VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE)
    ON CONFLICT (profile_id) WHERE valid_to IS NULL
    DO UPDATE SET 
      category_id = EXCLUDED.category_id,
      assigned_by = EXCLUDED.assigned_by,
      assigned_date = EXCLUDED.assigned_date,
      valid_from = EXCLUDED.valid_from,
      created_at = NOW()
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId, categoryId, assignedBy]);
  return result.rows[0];
}

async function getCategoryByCode(code) {
  const query = `SELECT * FROM staff_categories WHERE category_code = $1`;
  const result = await pool.query(query, [code]);
  return result.rows[0];
}

async function getActiveRolesInScope(userId, role) {
  let query = "";
  const values = [];

  if (role === "SUPER_ADMIN") {
    query = `
      SELECT DISTINCT r.name
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE p.status = 'active';
    `;
  } else if (role === "AOM") {
    values.push(userId);
    query = `
      SELECT DISTINCT r.name
      FROM staff_station_postings ssp
      JOIN stations s ON s.id = ssp.station_id
      JOIN profiles p ON p.id = ssp.profile_id
      JOIN roles r ON r.id = p.role_id
      WHERE p.status = 'active'
        AND ssp.is_current = true
        AND s.division_id = (
          SELECT division_id FROM division_assignments
          WHERE profile_id = $1 AND is_current = true
          LIMIT 1
        );
    `;
  } else if (role === "TI") {
    values.push(userId);
    query = `
      SELECT DISTINCT r.name
      FROM staff_station_postings ssp
      JOIN profiles p ON p.id = ssp.profile_id
      JOIN roles r ON r.id = p.role_id
      WHERE p.status = 'active'
        AND ssp.is_current = true
        AND ssp.station_id IN (
          SELECT station_id FROM station_assignments
          WHERE profile_id = $1 AND assignment_type = 'TI_AREA' AND assigned_to IS NULL
        );
    `;
  } else if (role === "SM" || role === "SS" || ["Cabin Master", "CABIN MASTER"].includes(role) || ["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(role)) {
    values.push(userId);
    let roleCondition = '';
    if (["Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Station Master Supervisior", "Station Master Supervisio"].includes(role)) {
      roleCondition = `
        (
          r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'Cabin Master', 'CABIN MASTER', 'TM', 'SM', 'SS')
        )
      `;
    } else {
      if (userId === '439a8db6-2546-4858-abbc-3752f4acb536') {
        roleCondition = `
          (
            (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'TM') AND p.reporting_officer_id IS NULL)
            OR
            (p.reporting_officer_id = $1)
          )
        `;
      } else {
        roleCondition = `
          (
            (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM') AND p.reporting_officer_id IS NULL)
            OR
            (p.reporting_officer_id = $1)
          )
        `;
      }
    }
    query = `
      SELECT DISTINCT r.name
      FROM staff_station_postings ssp
      JOIN profiles p ON p.id = ssp.profile_id
      JOIN roles r ON r.id = p.role_id
      WHERE p.status = 'active'
        AND ssp.is_current = true
        AND ssp.station_id = (
          SELECT station_id FROM staff_station_postings
          WHERE profile_id = $1 AND is_current = true
          LIMIT 1
        )
        AND ${roleCondition};
    `;
  } else {
    return [role];
  }

  const result = await pool.query(query, values);
  return result.rows.map((row) => row.name);
}

module.exports = {
  getRoleByName,
  findUserByHrmsId,
  createProfile,
  createUserCredential,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  updateUserPassword,
  activateUser,
  getCurrentPosting,
  getStationById,
  closeCurrentPosting,
  createNewPosting,
  countUsers,
  getUserProfileDetails,
  createDivisionAssignment,
  assignUserCategory,
  getCategoryByCode,
  getActiveRolesInScope,
};