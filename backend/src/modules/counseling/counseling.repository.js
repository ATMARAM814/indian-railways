const pool = require("../../config/database");

// ==========================================
// AUTO-MIGRATION RUNNER
// ==========================================
async function runAutoMigration() {
  try {
    // 1. Create counseling_subjects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS counseling_subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_code VARCHAR(50) NOT NULL,
        subject_name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create staff_counseling_status table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_counseling_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES counseling_subjects(id) ON DELETE CASCADE,
        is_completed BOOLEAN,
        marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_candidate_subject UNIQUE (profile_id, subject_id)
      );
      
      -- Remove remarks column if exists
      ALTER TABLE staff_counseling_status DROP COLUMN IF EXISTS remarks;

      -- Remove default constraint from is_completed if exists
      ALTER TABLE staff_counseling_status ALTER COLUMN is_completed DROP DEFAULT;
    `);

    // 3. Create staff_counseling_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_counseling_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
        assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL
      );
    `);

    // 3. Seed subjects if empty
    const subjectsCheck = await pool.query('SELECT COUNT(*)::int FROM counseling_subjects');
    if (subjectsCheck.rows[0].count === 0) {
      console.log("[Counseling Migration] Seeding default counseling subjects...");
      const seedSubjects = [
        // POINTS MAN (PM)
        { role: 'PM', name: 'Stabling and clearing of load', desc: 'Stabling and clearing of load procedures' },
        { role: 'PM', name: 'Shunting rules', desc: 'Shunting rules and safety' },
        { role: 'PM', name: 'Isolator operation', desc: 'Operation of electrical isolators' },
        { role: 'PM', name: 'Exchanging hand signal', desc: 'Exchanging hand signal protocol' },
        { role: 'PM', name: 'Use of fire extinguisher', desc: 'Use of fire extinguisher during emergency' },
        { role: 'PM', name: 'Signal and point failure', desc: 'Handling of signal and point failures' },

        // SM
        { role: 'SM', name: 'Station working rule', desc: 'Station working rules and local instructions' },
        { role: 'SM', name: 'Caution order', desc: 'Preparation and delivery of caution orders' },
        { role: 'SM', name: 'Abnormal working', desc: 'Abnormal block working procedures' },
        { role: 'SM', name: 'VDU/Panel , Signal and point failure', desc: 'Panel operation during signal and point failures' },
        { role: 'SM', name: 'Power/ traffic, integrated Blocks', desc: 'Power, traffic, and integrated blocks management' },
        { role: 'SM', name: 'Exchanging hand signal', desc: 'Exchanging hand signals and coordination' },

        // TM
        { role: 'TM', name: 'Protection of train', desc: 'Train protection rules during emergency stops' },
        { role: 'TM', name: 'Exchanging hand signal', desc: 'Exchanging hand signals with SM and gatekeepers' },
        { role: 'TM', name: 'Abnormal working', desc: 'Abnormal running safety procedures' },
        { role: 'TM', name: 'Automatic signaling', desc: 'Rules for automatic signaling territory' },
        { role: 'TM', name: 'Shunting rules', desc: 'Shunting rules and safety checks' },
        { role: 'TM', name: 'Use of fire extinguisher', desc: 'Emergency fire fighting procedures' },
        { role: 'TM', name: 'Stabling and clearing of load', desc: 'Stabling train load and clearing precautions' },

        // TI
        { role: 'TI', name: 'Inspections station, gate & foot plate', desc: 'Inspecting station workings, level crossings, and foot plates' },
        { role: 'TI', name: 'Counselling of staff', desc: 'Counseling techniques and performance correction' },
        { role: 'TI', name: 'Joint note/joint survey', desc: 'Conducting joint notes and joint surveys after incidents' },
        { role: 'TI', name: 'Automatic signaling', desc: 'Automatic block working inspection' },
        { role: 'TI', name: 'Abnormal working', desc: 'Abnormal running rules verification' },

        // SMS (Station Master Supervisor)
        { role: 'SMS', name: 'Inspections station, gate & foot plate', desc: 'Inspecting station workings, level crossings, and foot plates' },
        { role: 'SMS', name: 'Counselling of staff', desc: 'Counseling techniques and performance correction' },
        { role: 'SMS', name: 'Joint note/joint survey', desc: 'Conducting joint notes and joint surveys after incidents' },
        { role: 'SMS', name: 'Automatic signaling', desc: 'Automatic block working inspection' },
        { role: 'SMS', name: 'Abnormal working', desc: 'Abnormal running rules verification' }
      ];

      for (const sub of seedSubjects) {
        await pool.query(
          `INSERT INTO counseling_subjects (role_code, subject_name, description) VALUES ($1, $2, $3)`,
          [sub.role, sub.name, sub.desc]
        );
      }
      console.log("[Counseling Migration] Default counseling subjects seeded successfully.");
    }
  } catch (error) {
    console.error("[Counseling Migration Error]:", error);
  }
}

runAutoMigration();

// ==========================================
// DB REPOSITORY FUNCTIONS
// ==========================================

async function getCandidateDetailsDb(profileId) {
  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      r.name as "role",
      COALESCE(sc.category_code, CASE WHEN lca.percentage <= 25 THEN 'D' WHEN lca.percentage >= 26 AND lca.percentage < 50 THEN 'C' ELSE NULL END) as "category",
      lca.percentage as "latestScore",
      s.station_name as "stationName",
      s.station_code as "stationCode",
      s.id as "stationId",
      s.division_id as "divisionId",
      (
        SELECT EXISTS (
          SELECT 1 FROM assessments a_active
          WHERE a_active.assessed_user_id = p.id
            AND a_active.status IN ('scheduled', 'mcq_access_sent', 'mcq_pending', 'mcq_submitted', 'evaluation_pending', 'evaluation_submitted', 'pending_approval', 'created')
        )
      ) as "hasActiveTest"
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
      SELECT percentage FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE p.id = $1 AND ssp.is_current = true;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0];
}

async function getCounselingSubjectsForRoleDb(roleCode) {
  // Map roles like 'STATION MASTER' to 'SM' or 'POINTSMAN' to 'PM' to match our seeded role_codes
  let mappedRole = roleCode;
  const upperRole = (roleCode || '').toUpperCase();
  if (upperRole.includes('POINTSMAN') || upperRole === 'PM') {
    mappedRole = 'PM';
  } else if (upperRole.includes('STATION MASTER SUPERVISOR') || upperRole === 'SMS') {
    mappedRole = 'SMS';
  } else if (upperRole.includes('STATION MASTER') || upperRole === 'SM') {
    mappedRole = 'SM';
  } else if (upperRole.includes('TRAIN MANAGER') || upperRole === 'TM') {
    mappedRole = 'TM';
  } else if (upperRole.includes('TRAFFIC INSPECTOR') || upperRole === 'TI') {
    mappedRole = 'TI';
  }

  const query = `
    SELECT id, role_code, subject_name as "subjectName", description
    FROM counseling_subjects
    WHERE role_code = $1
    ORDER BY subject_name ASC;
  `;
  const result = await pool.query(query, [mappedRole]);
  return result.rows;
}

async function getCandidateCounselingStatusesDb(profileId) {
  const query = `
    SELECT 
      scs.subject_id as "subjectId",
      scs.is_completed as "isCompleted",
      scs.marked_at as "markedAt",
      p.full_name as "markedByName"
    FROM staff_counseling_status scs
    LEFT JOIN profiles p ON p.id = scs.marked_by
    WHERE scs.profile_id = $1;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows;
}

async function upsertCounselingStatusDb({ profileId, subjectId, isCompleted, markedBy }) {
  const query = `
    INSERT INTO staff_counseling_status (profile_id, subject_id, is_completed, marked_by, marked_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (profile_id, subject_id) DO UPDATE
    SET 
      is_completed = EXCLUDED.is_completed,
      marked_by = EXCLUDED.marked_by,
      marked_at = NOW(),
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId, subjectId, isCompleted, markedBy]);
  return result.rows[0];
}

async function getUserDivisionId(profileId) {
  const query = `
    SELECT division_id
    FROM division_assignments
    WHERE profile_id = $1 AND is_current = true
    LIMIT 1;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows[0]?.division_id || null;
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

async function getCounselingDirectoryCandidatesDb({ assessorId, assessorRole }) {
  const roleUpper = (assessorRole || "").toUpperCase();
  let scopeCondition = "";
  let queryParams = [];

  if (roleUpper === "TI" || roleUpper.includes("TI")) {
    const tiStations = await getTiStations(assessorId);
    if (tiStations.length === 0) return [];
    scopeCondition = "AND ssp.station_id = ANY($1)";
    queryParams = [tiStations];
  } else {
    const divisionId = await getUserDivisionId(assessorId);
    if (!divisionId) return [];
    scopeCondition = "AND s.division_id = $1";
    queryParams = [divisionId];
  }

  const query = `
    SELECT 
      p.id as "userId",
      p.full_name as "fullName",
      p.hrms_id as "hrmsId",
      r.name as "role",
      COALESCE(sc.category_code, CASE WHEN lca.percentage <= 25 THEN 'D' WHEN lca.percentage >= 26 AND lca.percentage < 50 THEN 'C' ELSE NULL END) as "category",
      lca.percentage as "latestScore",
      s.station_name as "stationName",
      s.station_code as "stationCode",
      (
        SELECT MAX(completed_at) 
        FROM staff_counseling_history 
        WHERE profile_id = p.id
      ) as "prevCounselingDate",
      (
        SELECT COUNT(*)::int 
        FROM staff_counseling_history 
        WHERE profile_id = p.id
      ) as "historyCount"
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
      SELECT percentage FROM assessments
      WHERE assessed_user_id = p.id AND status = 'completed' AND approval_status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1
    ) lca ON true
    WHERE ssp.is_current = true
      AND COALESCE(sc.category_code, CASE WHEN lca.percentage <= 25 THEN 'D' WHEN lca.percentage >= 26 AND lca.percentage < 50 THEN 'C' ELSE NULL END) IN ('C', 'D')
      AND NOT EXISTS (
        SELECT 1 FROM assessments a_active
        WHERE a_active.assessed_user_id = p.id
          AND a_active.status IN ('scheduled', 'mcq_access_sent', 'mcq_pending', 'mcq_submitted', 'evaluation_pending', 'evaluation_submitted', 'pending_approval', 'created')
      )
      ${scopeCondition}
    ORDER BY p.full_name ASC;
  `;

  const result = await pool.query(query, queryParams);
  return result.rows;
}

async function getCandidateCounselingHistoryDb(profileId) {
  const query = `
    SELECT 
      sch.id,
      sch.completed_at as "completedAt",
      p.full_name as "completedByName",
      a.percentage as "retestScore",
      a.id as "assessmentId"
    FROM staff_counseling_history sch
    LEFT JOIN profiles p ON p.id = sch.completed_by
    LEFT JOIN assessments a ON a.id = sch.assessment_id
    WHERE sch.profile_id = $1
    ORDER BY sch.completed_at DESC;
  `;
  const result = await pool.query(query, [profileId]);
  return result.rows;
}

async function insertCounselingHistoryDb({ profileId, completedBy, assessmentId }) {
  const query = `
    INSERT INTO staff_counseling_history (profile_id, completed_by, assessment_id, completed_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *;
  `;
  const result = await pool.query(query, [profileId, completedBy, assessmentId]);
  return result.rows[0];
}

async function clearCandidateCounselingStatusesDb(profileId) {
  await pool.query(
    "DELETE FROM staff_counseling_status WHERE profile_id = $1",
    [profileId]
  );
}

module.exports = {
  getCandidateDetailsDb,
  getCounselingSubjectsForRoleDb,
  getCandidateCounselingStatusesDb,
  upsertCounselingStatusDb,
  getUserDivisionId,
  getTiStations,
  getCounselingDirectoryCandidatesDb,
  getCandidateCounselingHistoryDb,
  insertCounselingHistoryDb,
  clearCandidateCounselingStatusesDb
};
