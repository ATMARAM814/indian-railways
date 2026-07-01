const pool = require("../../config/database");

function normalizeRoleCode(roleCode) {
  if (!roleCode) return roleCode;
  const upper = roleCode.trim().toUpperCase();
  if (upper === "SHUNTING MASTER" || upper === "SHM") {
    return "PM";
  }
  return roleCode;
}

async function runAutoMigration() {
  const seedQuery = `
    -- Add reporting_officer_id to profiles if it doesn't exist
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reporting_officer_id UUID REFERENCES profiles(id);

    -- Add PME and Refresher columns to profiles table if they don't exist
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pme_due DATE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pme_done DATE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ref_due DATE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ref_done DATE;

    -- Add operational detail columns if they don't exist
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS pme_status VARCHAR(50);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ref_status VARCHAR(50);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS counselling_required BOOLEAN DEFAULT false;
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS training_required BOOLEAN DEFAULT false;
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS counselling_status VARCHAR(50);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS training_status VARCHAR(50);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS alcoholic_status VARCHAR(50);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS safety_concern_status VARCHAR(50);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS remarks_for_approver TEXT;

    -- Add periodic assessment cycle columns if they don't exist
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_cycle VARCHAR(100);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(100);
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP;
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS instructions_remarks TEXT;
    ALTER TABLE assessments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

    -- Seed yes_no_questions for TM and SS if not exist
    INSERT INTO yes_no_questions (role_code, question_text, is_active, section_code, marks_per_question)
    SELECT 'TM', question_text, is_active, section_code, marks_per_question
    FROM yes_no_questions
    WHERE role_code = 'SM'
      AND NOT EXISTS (SELECT 1 FROM yes_no_questions WHERE role_code = 'TM');

    INSERT INTO yes_no_questions (role_code, question_text, is_active, section_code, marks_per_question)
    SELECT 'SS', question_text, is_active, section_code, marks_per_question
    FROM yes_no_questions
    WHERE role_code = 'SM'
      AND NOT EXISTS (SELECT 1 FROM yes_no_questions WHERE role_code = 'SS');

    -- Seed question_bank for TM and SS if not exist is disabled


    -- Ensure max_marks has 100 default and backfill nulls
    ALTER TABLE assessments ALTER COLUMN max_marks SET DEFAULT 100;
    UPDATE assessments SET max_marks = 100 WHERE max_marks IS NULL;

    -- Self-heal any mismatched scores or percentages
    UPDATE assessments
    SET yes_no_score = COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0),
        evaluation_score = COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0),
        total_score = COALESCE(mcq_score, 0) + COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0),
        percentage = ((COALESCE(mcq_score, 0) + COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0))::numeric / COALESCE(NULLIF(max_marks, 0), 100)) * 100
    WHERE total_score != COALESCE(mcq_score, 0) + COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0)
       OR yes_no_score != COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0)
       OR evaluation_score != COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0)
       OR ABS(percentage - ((COALESCE(mcq_score, 0) + COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0))::numeric / COALESCE(NULLIF(max_marks, 0), 100)) * 100) > 0.01;
  `;

  try {
    await pool.query(seedQuery);
    console.log("[Assessments Repository] Schema extensions and question cloning completed successfully.");
    await selfHealUserCategories();
  } catch (err) {
    console.error("[Assessments Repository] Schema extensions and question cloning error:", err);
  }
}

async function selfHealUserCategories() {
  try {
    const catRes = await pool.query("SELECT id, category_code FROM staff_categories");
    const categoriesMap = {};
    catRes.rows.forEach(row => {
      categoriesMap[row.category_code] = row.id;
    });

    const assRes = await pool.query(`
      SELECT DISTINCT ON (assessed_user_id)
        id, assessed_user_id, percentage, approved_by, approved_at, alcoholic_status, mcq_score, alertness_score
      FROM assessments
      WHERE approval_status = 'approved'
      ORDER BY assessed_user_id, created_at DESC
    `);

    for (const row of assRes.rows) {
      const userId = row.assessed_user_id;
      const pct = Number(row.percentage || 0);
      const mcqScore = Number(row.mcq_score || 0);
      const alertnessScore = Number(row.alertness_score || 0);
      
      let expectedCode = 'D';
      if (row.alcoholic_status === 'Alcoholic' || pct <= 25) {
        expectedCode = 'D';
      } else if (mcqScore < 15 || alertnessScore < 15) {
        expectedCode = 'C';
      } else {
        if (pct >= 80) expectedCode = 'A';
        else if (pct >= 50) expectedCode = 'B';
        else if (pct >= 26) expectedCode = 'C';
        else expectedCode = 'D';
      }

      const currentRes = await pool.query(`
        SELECT sc.category_code, ec.category_id
        FROM employee_categories ec
        JOIN staff_categories sc ON sc.id = ec.category_id
        WHERE ec.profile_id = $1 AND ec.valid_to IS NULL
        ORDER BY ec.created_at DESC
        LIMIT 1
      `, [userId]);

      const current = currentRes.rows[0];
      if (!current || current.category_code !== expectedCode) {
        const expectedId = categoriesMap[expectedCode];
        if (expectedId) {
          await pool.query(`
            INSERT INTO employee_categories (profile_id, category_id, assigned_by, assigned_date, valid_from)
            VALUES ($1, $2, $3, $4, $4)
            ON CONFLICT (profile_id) WHERE valid_to IS NULL
            DO UPDATE SET 
              category_id = EXCLUDED.category_id,
              assigned_by = EXCLUDED.assigned_by,
              assigned_date = EXCLUDED.assigned_date,
              valid_from = EXCLUDED.valid_from,
              created_at = NOW();
          `, [
            userId,
            expectedId,
            row.approved_by || null,
            row.approved_at || new Date()
          ]);
        }
      }
    }
    console.log("[Assessments Repository] User category self-healing synchronization completed successfully.");
  } catch (err) {
    console.error("[Assessments Repository] User category self-healing synchronization error:", err);
  }
}

runAutoMigration();


async function countActiveQuestions(roleCode) {
  const normalized = normalizeRoleCode(roleCode);
  const query = `
    SELECT COUNT(*) AS total
    FROM question_bank
    WHERE role_code = $1
      AND status = 'active';
  `;

  const result = await pool.query(query, [normalized]);

  return Number(result.rows[0].total);
}

async function createAssessmentRecord({
  assessedUserId,
  assessorUserId,
  assessedRoleCode,
  assessorRoleCode,
  assessmentCycle,
  assessmentType,
  scheduledDate,
  dueDate,
  instructionsRemarks,
}) {
  const query = `
    INSERT INTO assessments (
      assessed_user_id,
      assessor_user_id,
      assessed_role_code,
      assessor_role_code,
      assessment_cycle,
      assessment_type,
      scheduled_date,
      due_date,
      instructions_remarks,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'mcq_access_sent')
    RETURNING *;
  `;

  const result = await pool.query(query, [
    assessedUserId,
    assessorUserId,
    assessedRoleCode,
    assessorRoleCode,
    assessmentCycle || null,
    assessmentType || null,
    scheduledDate || null,
    dueDate || null,
    instructionsRemarks || null,
  ]);

  return result.rows[0];
}

async function hasActiveAssessment(employeeId) {
  const query = `
    SELECT 1 FROM assessments
    WHERE assessed_user_id = $1
      AND status IN ('scheduled', 'mcq_access_sent', 'mcq_pending', 'mcq_submitted', 'evaluation_pending', 'evaluation_submitted', 'pending_approval', 'created')
    LIMIT 1;
  `;
  const res = await pool.query(query, [employeeId]);
  return res.rows.length > 0;
}

async function cancelAssessmentRecord(assessmentId, reason) {
  const query = `
    UPDATE assessments
    SET status = 'cancelled', cancellation_reason = $1
    WHERE id = $2
    RETURNING *;
  `;
  const res = await pool.query(query, [reason, assessmentId]);
  return res.rows[0];
}

async function getEmployeeAssessmentHistory(employeeId) {
  const query = `
    SELECT
      a.id,
      a.assessment_cycle,
      a.assessment_type,
      a.scheduled_date,
      a.due_date,
      a.status,
      a.approval_status,
      a.percentage,
      a.total_score,
      a.evaluated_at as completed_date,
      a.approved_at,
      assessor.full_name as assessor_name,
      a.assessed_role_code,
      a.alcoholic_status
    FROM assessments a
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    WHERE a.assessed_user_id = $1
    ORDER BY a.created_at DESC;
  `;
  const result = await pool.query(query, [employeeId]);
  return result.rows;
}

async function getRandomQuestions(roleCode, limit = 25) {
  const normalized = normalizeRoleCode(roleCode);
  const query = `
    SELECT id
    FROM question_bank
    WHERE role_code = $1
      AND status = 'active'
    ORDER BY random()
    LIMIT $2;
  `;

  const result = await pool.query(query, [
    normalized,
    limit,
  ]);

  return result.rows;
}

async function saveAssessmentQuestions(assessmentId, questions) {
  const query = `
    INSERT INTO assessment_mcq_questions (
      assessment_id,
      question_id
    )
    VALUES ($1, $2);
  `;

  for (const question of questions) {
    await pool.query(query, [
      assessmentId,
      question.id,
    ]);
  }
}

async function getAssessmentQuestions(assessmentId) {
  const query = `
    SELECT
      qb.id as question_id,
      qb.question_text,
      qb.option_a,
      qb.option_b,
      qb.option_c,
      qb.option_d
    FROM assessment_mcq_questions amq
    JOIN question_bank qb
      ON qb.id = amq.question_id
    WHERE amq.assessment_id = $1
    ORDER BY qb.question_text;
  `;

  const result = await pool.query(query, [assessmentId]);
  return result.rows;
}

async function getQuestionsWithCorrectAnswers(assessmentId) {
  const query = `
    SELECT
      qb.id as question_id,
      qb.correct_answer
    FROM assessment_mcq_questions amq
    JOIN question_bank qb
      ON qb.id = amq.question_id
    WHERE amq.assessment_id = $1;
  `;

  const result = await pool.query(query, [assessmentId]);
  return result.rows;
}

async function saveMcqAnswers(assessmentId, answers) {
  const query = `
    INSERT INTO assessment_mcq_answers (
      assessment_id,
      question_id,
      selected_answer,
      is_correct
    )
    VALUES ($1, $2, $3, $4);
  `;

  for (const answer of answers) {
    await pool.query(query, [
      assessmentId,
      answer.questionId,
      answer.selectedAnswer,
      answer.isCorrect,
    ]);
  }
}

async function updateMcqScore(assessmentId, mcqScore) {
  const query = `
    UPDATE assessments
    SET
      mcq_score = $1,
      total_score =
        $1
        + alertness_score
        + safety_record_score
        + leadership_score
        + discipline_score
        + appearance_score,

      percentage = (
        (
          $1
          + alertness_score
          + safety_record_score
          + leadership_score
          + discipline_score
          + appearance_score
        )::numeric / COALESCE(NULLIF(max_marks, 0), 100)
      ) * 100,

      submitted_at = now(),
      status = 'mcq_submitted'
    WHERE id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [
    mcqScore,
    assessmentId,
  ]);

  return result.rows[0];
}

async function getYesNoQuestionsWithSections(roleCode) {
  const normalized = normalizeRoleCode(roleCode);
  const query = `
    SELECT
      ynq.id as question_id,
      ynq.section_code,
      ynq.question_text,
      es.marks_per_question
    FROM yes_no_questions ynq
    JOIN evaluation_sections es
      ON es.section_code = ynq.section_code
    WHERE ynq.role_code = $1
      AND ynq.is_active = true;
  `;

  const result = await pool.query(query, [normalized]);
  return result.rows;
}

async function saveYesNoAnswers(assessmentId, answers) {
  // Clear any existing answers (draft or final) for this assessment
  await pool.query("DELETE FROM assessment_yes_no_answers WHERE assessment_id = $1", [assessmentId]);

  const query = `
    INSERT INTO assessment_yes_no_answers (
      assessment_id,
      question_id,
      section_code,
      answer,
      marks_awarded
    )
    VALUES ($1, $2, $3, $4, $5);
  `;

  for (const answer of answers) {
    await pool.query(query, [
      assessmentId,
      answer.questionId,
      answer.sectionCode,
      answer.answer,
      answer.marksAwarded,
    ]);
  }
}

async function updateEvaluationScore(assessmentId, sectionScores) {
  const alertness = Number(sectionScores.ALERTNESS || 0);
  const safety = Number(sectionScores.SAFETY_RECORD || 0);
  const leadership = Number(sectionScores.LEADERSHIP || 0);
  const discipline = Number(sectionScores.DISCIPLINE || 0);
  const appearance = Number(sectionScores.APPEARANCE || 0);

  const query = `
    UPDATE assessments
    SET
      alertness_score = $1::int,
      safety_record_score = $2::int,
      leadership_score = $3::int,
      discipline_score = $4::int,
      appearance_score = $5::int,

      evaluation_score =
        $1::int + $2::int + $3::int + $4::int + $5::int,

      yes_no_score =
        $1::int + $2::int + $3::int + $4::int + $5::int,

      total_score =
        mcq_score + $1::int + $2::int + $3::int + $4::int + $5::int,

      percentage =
        ((mcq_score + $1::int + $2::int + $3::int + $4::int + $5::int)::numeric / COALESCE(NULLIF(max_marks, 0), 100)) * 100,

      evaluated_at = now(),
      status = 'completed',
      approval_status = 'pending_approval'
    WHERE id = $6
    RETURNING *;
  `;

  const result = await pool.query(query, [
    alertness,
    safety,
    leadership,
    discipline,
    appearance,
    assessmentId,
  ]);

  return result.rows[0];
}

async function getAssessmentById(assessmentId) {
  const query = `
    SELECT *
    FROM assessments
    WHERE id = $1;
  `;

  const result = await pool.query(query, [assessmentId]);
  return result.rows[0];
}

async function getAssessmentResult(assessmentId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.assessed_user_id,

      assessed.full_name as assessed_name,
      assessed.hrms_id as assessed_hrms_id,
      a.assessed_role_code,

      assessor.full_name as assessor_name,
      assessor.hrms_id as assessor_hrms_id,
      a.assessor_role_code,

      a.mcq_score,
      a.alertness_score,
      a.safety_record_score,
      a.leadership_score,
      a.discipline_score,
      a.appearance_score,
      a.evaluation_score,
      a.total_score,
      a.percentage,

      a.created_at,
      a.submitted_at,
      a.evaluated_at,

      a.pme_status,
      a.ref_status,
      a.counselling_required,
      a.training_required,
      a.counselling_status,
      a.training_status,
      a.alcoholic_status,
      a.safety_concern_status,
      a.remarks_for_approver,
      a.approval_status,
      a.approved_by,
      a.approved_at,
      a.rejected_by,
      a.rejected_at,
      a.rejection_reason,
      a.evaluation_draft_saved_at,
      a.approval_remark,
      a.modified_by,
      a.modified_at,
      a.modification_remark

    FROM assessments a
    JOIN profiles assessed
      ON assessed.id = a.assessed_user_id
    JOIN profiles assessor
      ON assessor.id = a.assessor_user_id
    WHERE a.id = $1;
  `;

  const result = await pool.query(query, [assessmentId]);
  return result.rows[0];
}

async function getAssessmentsCreatedByUser(userId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.assessed_role_code,
      assessed.full_name as assessed_name,
      assessed.hrms_id as assessed_hrms_id,
      a.mcq_score,
      a.evaluation_score,
      a.total_score,
      a.percentage,
      a.created_at,
      a.submitted_at,
      a.evaluated_at
    FROM assessments a
    JOIN profiles assessed
      ON assessed.id = a.assessed_user_id
    WHERE a.assessor_user_id = $1
    ORDER BY a.created_at DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getPendingAssessmentsForUser(userId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.assessed_role_code,
      assessor.full_name as assessor_name,
      assessor.hrms_id as assessor_hrms_id,
      a.created_at
    FROM assessments a
    JOIN profiles assessor
      ON assessor.id = a.assessor_user_id
    WHERE a.assessed_user_id = $1
      AND a.status = 'created'
    ORDER BY a.created_at DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getPendingEvaluationsForAssessor(userId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.assessed_role_code,
      assessed.full_name as assessed_name,
      assessed.hrms_id as assessed_hrms_id,
      a.mcq_score,
      a.submitted_at,
      a.created_at
    FROM assessments a
    JOIN profiles assessed
      ON assessed.id = a.assessed_user_id
    WHERE a.assessor_user_id = $1
      AND a.status = 'mcq_submitted'
    ORDER BY a.submitted_at DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getAssessmentResultsForUser(userId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.approval_status,
      a.assessed_role_code,
      a.mcq_score,
      a.evaluation_score,
      a.total_score,
      a.percentage,
      a.created_at,
      a.submitted_at,
      a.evaluated_at,
      a.alcoholic_status
    FROM assessments a
    WHERE a.assessed_user_id = $1
      AND a.status IN ('mcq_submitted', 'completed')
    ORDER BY COALESCE(a.evaluated_at, a.submitted_at, a.created_at) DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function saveEvaluationDraftAnswers(
  assessmentId,
  answers
) {
  const questionIds = answers.map((answer) => answer.questionId);
  const deleteQuery = `
  DELETE FROM assessment_yes_no_answers
  WHERE assessment_id = $1
    AND question_id = ANY($2::uuid[]);
  `;

  await pool.query(deleteQuery, [
  assessmentId,
  questionIds,
]);

  const insertQuery = `
    INSERT INTO assessment_yes_no_answers (
      assessment_id,
      question_id,
      section_code,
      answer,
      marks_awarded,
      is_draft
    )
    VALUES ($1, $2, $3, $4, $5, true);
  `;

  for (const answer of answers) {
    await pool.query(insertQuery, [
      assessmentId,
      answer.questionId,
      answer.sectionCode,
      answer.answer,
      answer.marksAwarded,
    ]);
  }

  const updateQuery = `
    UPDATE assessments
    SET evaluation_draft_saved_at = now()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(updateQuery, [
    assessmentId,
  ]);

  return result.rows[0];
}

async function getEvaluationDraftAnswers(assessmentId) {
  const query = `
    SELECT
      aya.question_id,
      aya.section_code,
      aya.answer,
      aya.marks_awarded,
      ynq.question_text
    FROM assessment_yes_no_answers aya
    JOIN yes_no_questions ynq
      ON ynq.id = aya.question_id
    WHERE aya.assessment_id = $1
      AND aya.is_draft = true
    ORDER BY aya.section_code, ynq.question_text;
  `;

  const result = await pool.query(query, [assessmentId]);
  return result.rows;
}

async function getRoleStatsForAssessor(assessorId, assessorRole, roleCode) {
  let scopeJoin = '';
  let scopeCondition = '';
  const values = [roleCode, assessorId];

  if (['Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS'].includes(assessorRole)) {
    scopeJoin = `LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true`;
    scopeCondition = `
      AND ssp.station_id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $2
          AND is_current = true
        LIMIT 1
      )
    `;
  } else if (assessorRole === 'SM' || assessorRole === 'SS' || ['Cabin Master', 'CABIN MASTER'].includes(assessorRole)) {
    scopeJoin = `LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true`;
    scopeCondition = `
      AND ssp.station_id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $2
          AND is_current = true
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM staff_station_postings ssp_sms
        JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
        JOIN roles r_sms ON r_sms.id = p_sms.role_id
        WHERE ssp_sms.station_id = ssp.station_id 
          AND ssp_sms.is_current = true 
          AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
      )
    `;
  } else if (assessorRole === 'TI') {
    scopeJoin = `LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true`;
    scopeCondition = `
      AND ssp.station_id IN (
        SELECT station_id
        FROM station_assignments
        WHERE profile_id = $2
          AND assignment_type = 'TI_AREA'
          AND assigned_to IS NULL
      )
      ${roleCode !== 'TM' ? `AND NOT EXISTS (
        SELECT 1 
        FROM staff_station_postings ssp_sms
        JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
        JOIN roles r_sms ON r_sms.id = p_sms.role_id
        WHERE ssp_sms.station_id = ssp.station_id 
          AND ssp_sms.is_current = true 
          AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
      )` : ''}
    `;
  } else if (assessorRole === 'AOM') {
    scopeJoin = `
      LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
      LEFT JOIN stations s ON s.id = ssp.station_id
    `;
    scopeCondition = `
      AND (
        s.division_id = (
          SELECT division_id
          FROM division_assignments
          WHERE profile_id = $2
            AND is_current = true
          LIMIT 1
        )
        OR
        p.id IN (
          SELECT sa.profile_id
          FROM station_assignments sa
          JOIN stations st ON st.id = sa.station_id
          WHERE sa.assignment_type = 'TI_AREA' AND sa.assigned_to IS NULL
            AND st.division_id = (
              SELECT division_id
              FROM division_assignments
              WHERE profile_id = $2
                AND is_current = true
              LIMIT 1
            )
        )
        OR
        p.id IN (
          SELECT da.profile_id
          FROM division_assignments da
          WHERE da.is_current = true
            AND da.division_id = (
              SELECT division_id
              FROM division_assignments
              WHERE profile_id = $2
                AND is_current = true
              LIMIT 1
            )
        )
      )
    `;
  } else if (assessorRole === 'SUPER_ADMIN') {
    scopeJoin = `LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true`;
    scopeCondition = '';
  }

  // 1. Total staff
  const staffQuery = `
    SELECT COUNT(DISTINCT p.id)::int as total
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    ${scopeJoin}
    WHERE r.name = $1 AND p.status = 'active' ${scopeCondition}
  `;
  const staffRes = await pool.query(staffQuery, values);
  const totalStaff = staffRes.rows[0].total;

  // 2. Assessment stats (aggregating the latest active/non-expired assessment per profile)
  const assessmentStatsQuery = `
    SELECT
      COUNT(DISTINCT latest_assessment.id) FILTER (WHERE latest_assessment.status = 'created')::int as active_exams,
      COUNT(DISTINCT latest_assessment.id) FILTER (WHERE latest_assessment.status = 'mcq_submitted')::int as pending_evaluations,
      COUNT(DISTINCT latest_assessment.id) FILTER (WHERE latest_assessment.status = 'completed')::int as completed_assessments,
      COALESCE(AVG(latest_assessment.percentage) FILTER (WHERE latest_assessment.status = 'completed'), 0)::numeric as avg_score
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    ${scopeJoin}
    LEFT JOIN LATERAL (
      SELECT a.id, a.status, a.percentage, a.approval_status, a.created_at
      FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND (
          a.status != 'completed' OR a.approval_status != 'approved' OR
          COALESCE(a.approved_at, a.created_at) >= NOW() - CASE 
            WHEN a.assessment_cycle ILIKE '%monthly%' THEN INTERVAL '30 days'
            WHEN a.assessment_cycle ILIKE '%quarterly%' THEN INTERVAL '90 days'
            WHEN a.assessment_cycle ILIKE '%annual%' THEN INTERVAL '365 days'
            ELSE INTERVAL '30 days'
          END
        )
      ORDER BY a.created_at DESC
      LIMIT 1
    ) latest_assessment ON true
    WHERE r.name = $1 AND p.status = 'active' ${scopeCondition}
  `;
  const assessRes = await pool.query(assessmentStatsQuery, values);
  const stats = assessRes.rows[0] || { active_exams: 0, pending_evaluations: 0, completed_assessments: 0, avg_score: 0 };

  // 3. Status breakdown stats (dynamic based on latest active/non-expired assessment)
  const statusBreakdownQuery = `
    SELECT
      COUNT(p.id) FILTER (WHERE latest_assessment.id IS NULL OR latest_assessment.status = 'cancelled')::int as not_started,
      COUNT(p.id) FILTER (WHERE latest_assessment.status = 'created')::int as in_progress,
      COUNT(p.id) FILTER (WHERE latest_assessment.status = 'mcq_submitted')::int as pending,
      COUNT(p.id) FILTER (WHERE latest_assessment.status = 'completed')::int as completed
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    ${scopeJoin}
    LEFT JOIN LATERAL (
      SELECT a.id, a.status
      FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND (
          a.status != 'completed' OR a.approval_status != 'approved' OR
          COALESCE(a.approved_at, a.created_at) >= NOW() - CASE 
            WHEN a.assessment_cycle ILIKE '%monthly%' THEN INTERVAL '30 days'
            WHEN a.assessment_cycle ILIKE '%quarterly%' THEN INTERVAL '90 days'
            WHEN a.assessment_cycle ILIKE '%annual%' THEN INTERVAL '365 days'
            ELSE INTERVAL '30 days'
          END
        )
      ORDER BY a.created_at DESC
      LIMIT 1
    ) latest_assessment ON true
    WHERE r.name = $1 AND p.status = 'active' ${scopeCondition}
  `;
  const breakdownRes = await pool.query(statusBreakdownQuery, values);
  const breakdown = breakdownRes.rows[0] || { completed: 0, pending: 0, in_progress: 0, not_started: 0 };

  return {
    roleCode,
    totalStaff,
    activeExams: stats.active_exams,
    pendingEvaluations: stats.pending_evaluations,
    completedAssessments: stats.completed_assessments,
    averageScore: Number(Number(stats.avg_score).toFixed(2)),
    statusBreakdown: {
      completed: breakdown.completed || 0,
      pending: breakdown.pending || 0,
      inProgress: breakdown.in_progress || 0,
      notStarted: breakdown.not_started || 0
    }
  };
}

async function getAssessorRoleStats(assessorId, assessorRole) {
  let targetRoles = [];
  if (assessorRole === 'SM' || assessorRole === 'SS' || ['Cabin Master', 'CABIN MASTER'].includes(assessorRole)) {
    targetRoles = ['PM', 'Shunting Master'];
    if (assessorId === '439a8db6-2546-4858-abbc-3752f4acb536') {
      targetRoles.push('TM');
    }
  } else if (['Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS'].includes(assessorRole)) {
    targetRoles = ['PM', 'Shunting Master', 'SM', 'SS', 'Cabin Master'];
  } else if (assessorRole === 'TI') {
    targetRoles = ['SM', 'SS', 'TM', 'Cabin Master'];
  } else if (assessorRole === 'AOM') {
    targetRoles = ['TI', 'SMS'];
  } else if (assessorRole === 'SUPER_ADMIN') {
    targetRoles = ['PM', 'SM', 'TM', 'SS', 'TI', 'Cabin Master', 'Shunting Master', 'SMS'];
  }

  const results = [];
  for (const roleCode of targetRoles) {
    const stats = await getRoleStatsForAssessor(assessorId, assessorRole, roleCode);
    if (stats.totalStaff > 0) {
      results.push(stats);
    }
  }
  return results;
}

async function getEligibleStaff(assessorId, assessorRole, roleCode, filters = {}) {
  const { search, stationId, status, category, dateFrom, dateTo, page = 1, limit = 10 } = filters;
  const offset = (Number(page) - 1) * Number(limit);
  const values = [roleCode];
  const conditions = ['r.name = $1', "p.status = 'active'"];

  // Scope filter based on assessorRole
  if (['Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS'].includes(assessorRole)) {
    values.push(assessorId);
    conditions.push(`
      ssp.station_id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $${values.length}
          AND is_current = true
        LIMIT 1
      )
    `);
    conditions.push(`
      (
        r.name IN ('SM', 'SS', 'Cabin Master', 'CABIN MASTER', 'PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM')
      )
    `);
  } else if (assessorRole === 'SM' || assessorRole === 'SS' || ['Cabin Master', 'CABIN MASTER'].includes(assessorRole)) {
    values.push(assessorId);
    conditions.push(`
      ssp.station_id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $${values.length}
          AND is_current = true
        LIMIT 1
      )
    `);
    conditions.push(`
      NOT EXISTS (
        SELECT 1 
        FROM staff_station_postings ssp_sms
        JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
        JOIN roles r_sms ON r_sms.id = p_sms.role_id
        WHERE ssp_sms.station_id = ssp.station_id 
          AND ssp_sms.is_current = true 
          AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
      )
    `);
    if (assessorId === '439a8db6-2546-4858-abbc-3752f4acb536') {
      conditions.push(`
        (
          (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'TM', 'Train Manager') AND p.reporting_officer_id IS NULL)
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
  } else if (assessorRole === 'TI') {
    values.push(assessorId);
    conditions.push(`
      ssp.station_id IN (
        SELECT station_id
        FROM station_assignments
        WHERE profile_id = $${values.length}
          AND assignment_type = 'TI_AREA'
          AND assigned_to IS NULL
      )
    `);
    if (roleCode !== 'TM') {
      conditions.push(`
        NOT EXISTS (
          SELECT 1 
          FROM staff_station_postings ssp_sms
          JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
          JOIN roles r_sms ON r_sms.id = p_sms.role_id
          WHERE ssp_sms.station_id = ssp.station_id 
            AND ssp_sms.is_current = true 
            AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
        )
      `);
    }
    conditions.push(`
      p.reporting_officer_id IS NULL
    `);
  } else if (assessorRole === 'AOM') {
    values.push(assessorId);
    conditions.push(`
      (
        s.division_id = (
          SELECT division_id
          FROM division_assignments
          WHERE profile_id = $${values.length}
            AND is_current = true
          LIMIT 1
        )
        OR
        p.id IN (
          SELECT sa.profile_id
          FROM station_assignments sa
          JOIN stations st ON st.id = sa.station_id
          WHERE sa.assignment_type = 'TI_AREA' AND sa.assigned_to IS NULL
            AND st.division_id = (
              SELECT division_id
              FROM division_assignments
              WHERE profile_id = $${values.length}
                AND is_current = true
              LIMIT 1
            )
        )
        OR
        p.id IN (
          SELECT da.profile_id
          FROM division_assignments da
          WHERE da.is_current = true
            AND da.division_id = (
              SELECT division_id
              FROM division_assignments
              WHERE profile_id = $${values.length}
                AND is_current = true
              LIMIT 1
            )
        )
      )
    `);
    conditions.push(`
      p.reporting_officer_id IS NULL
    `);
  } else {
    conditions.push(`
      p.reporting_officer_id IS NULL
    `);
  }

  // Filter: search
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(p.full_name ILIKE $${values.length} OR p.hrms_id ILIKE $${values.length})`);
  }

  // Filter: stationId
  if (stationId) {
    values.push(stationId);
    conditions.push(`s.id = $${values.length}`);
  }

  // Filter: category
  if (category) {
    values.push(category);
    conditions.push(`sc.category_code = $${values.length}`);
  }

  // Filter: status (assessment status or approval status)
  if (status) {
    if (status === 'not_assessed') {
      conditions.push(`latest_assessment.id IS NULL`);
    } else if (['pending_approval', 'approved', 'rejected'].includes(status)) {
      values.push(status);
      conditions.push(`latest_assessment.approval_status = $${values.length}`);
    } else {
      values.push(status);
      conditions.push(`latest_assessment.status = $${values.length}`);
    }
  }

  // Filter: date range
  if (dateFrom) {
    values.push(dateFrom);
    conditions.push(`latest_assessment.created_at >= $${values.length}::timestamp`);
  }
  if (dateTo) {
    values.push(dateTo);
    conditions.push(`latest_assessment.created_at <= $${values.length}::timestamp`);
  }

  // Build query
  let query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.employee_id,
      p.phone,
      p.email,
      p.designation,
      p.status as profile_status,
      r.name as role_name,
      s.id as station_id,
      s.station_name,
      s.station_code,
      sc.category_code,
      sc.category_name,
      latest_assessment.id as assessment_id,
      latest_assessment.status as assessment_status,
      latest_assessment.approval_status,
      latest_assessment.total_score,
      latest_assessment.percentage,
      latest_assessment.created_at as assessment_created_at,
      latest_assessment.evaluated_at as assessment_evaluated_at,
      latest_assessment.assessment_cycle,
      latest_assessment.assessment_type,
      latest_assessment.scheduled_date,
      latest_assessment.due_date,
      latest_assessment.instructions_remarks,
      latest_assessment.cancellation_reason
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN employee_categories ec ON ec.profile_id = p.id
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT a.id, a.status, a.approval_status, a.total_score, a.percentage, a.created_at, a.evaluated_at,
             a.assessment_cycle, a.assessment_type, a.scheduled_date, a.due_date, a.instructions_remarks, a.cancellation_reason
      FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND (
          a.status != 'completed' OR a.approval_status != 'approved' OR
          COALESCE(a.approved_at, a.created_at) >= NOW() - CASE 
            WHEN a.assessment_cycle ILIKE '%monthly%' THEN INTERVAL '30 days'
            WHEN a.assessment_cycle ILIKE '%quarterly%' THEN INTERVAL '90 days'
            WHEN a.assessment_cycle ILIKE '%annual%' THEN INTERVAL '365 days'
            ELSE INTERVAL '30 days'
          END
        )
      ORDER BY a.created_at DESC
      LIMIT 1
    ) latest_assessment ON true
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.full_name
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  // Count query
  let countQuery = `
    SELECT COUNT(DISTINCT p.id)::int as total
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    LEFT JOIN employee_categories ec ON ec.profile_id = p.id
    LEFT JOIN staff_categories sc ON sc.id = ec.category_id
    LEFT JOIN LATERAL (
      SELECT a.id, a.status, a.approval_status, a.total_score, a.percentage, a.created_at, a.evaluated_at,
             a.assessment_cycle, a.assessment_type, a.scheduled_date, a.due_date, a.instructions_remarks, a.cancellation_reason
      FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND (
          a.status != 'completed' OR a.approval_status != 'approved' OR
          COALESCE(a.approved_at, a.created_at) >= NOW() - CASE 
            WHEN a.assessment_cycle ILIKE '%monthly%' THEN INTERVAL '30 days'
            WHEN a.assessment_cycle ILIKE '%quarterly%' THEN INTERVAL '90 days'
            WHEN a.assessment_cycle ILIKE '%annual%' THEN INTERVAL '365 days'
            ELSE INTERVAL '30 days'
          END
        )
      ORDER BY a.created_at DESC
      LIMIT 1
    ) latest_assessment ON true
    WHERE ${conditions.join(' AND ')}
  `;

  const countResult = await pool.query(countQuery, values);
  const total = countResult.rows[0].total;

  values.push(Number(limit), offset);
  const result = await pool.query(query, values);

  return {
    rows: result.rows,
    total
  };
}

async function updateAssessmentOperationalDetails(assessmentId, details) {
  const mcqScoreVal = details.mcqScore !== undefined && details.mcqScore !== null ? Number(details.mcqScore) : null;
  const query = `
    UPDATE assessments
    SET
      pme_status = $1,
      ref_status = $2,
      counselling_required = $3::boolean,
      training_required = $4::boolean,
      safety_concern_status = $5,
      remarks_for_approver = $6,
      counselling_status = $7,
      training_status = $8,
      alcoholic_status = $9,
      mcq_score = COALESCE($10, mcq_score),
      yes_no_score = alertness_score + safety_record_score + leadership_score + discipline_score + appearance_score,
      evaluation_score = alertness_score + safety_record_score + leadership_score + discipline_score + appearance_score,
      total_score = COALESCE($10, mcq_score) + alertness_score + safety_record_score + leadership_score + discipline_score + appearance_score,
      percentage = ((COALESCE($10, mcq_score) + alertness_score + safety_record_score + leadership_score + discipline_score + appearance_score)::numeric / COALESCE(NULLIF(max_marks, 0), 100)) * 100
    WHERE id = $11
    RETURNING *;
  `;
  const result = await pool.query(query, [
    details.pmeStatus || null,
    details.refStatus || null,
    details.counsellingRequired === true || details.counsellingRequired === 'true',
    details.trainingRequired === true || details.trainingRequired === 'true',
    details.safetyConcernStatus || null,
    details.remarksForApprover || null,
    details.counsellingStatus || null,
    details.trainingStatus || null,
    details.alcoholicStatus || null,
    mcqScoreVal,
    assessmentId
  ]);
  return result.rows[0];
}

async function getYesNoAnswersForAssessment(assessmentId) {
  const query = `
    SELECT
      aya.question_id,
      aya.section_code,
      aya.answer,
      aya.marks_awarded,
      ynq.question_text
    FROM assessment_yes_no_answers aya
    JOIN yes_no_questions ynq
      ON ynq.id = aya.question_id
    WHERE aya.assessment_id = $1
    ORDER BY aya.section_code, ynq.question_text;
  `;

  const result = await pool.query(query, [assessmentId]);
  return result.rows;
}

async function deleteAssessmentRecord(assessmentId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM assessment_mcq_answers WHERE assessment_id = $1", [assessmentId]);
    await client.query("DELETE FROM assessment_mcq_questions WHERE assessment_id = $1", [assessmentId]);
    await client.query("DELETE FROM assessment_yes_no_answers WHERE assessment_id = $1", [assessmentId]);
    await client.query("DELETE FROM assessments WHERE id = $1", [assessmentId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getBulkEligibleStaff(assessorId, assessorRole, roleCode) {
  const values = [roleCode];
  const conditions = ['r.name = $1', "p.status = 'active'"];

  // Scope filter based on assessorRole
  if (['Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS'].includes(assessorRole)) {
    values.push(assessorId);
    conditions.push(`
      ssp.station_id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $${values.length}
          AND is_current = true
        LIMIT 1
      )
    `);
    conditions.push(`
      (
        r.name IN ('SM', 'SS', 'Cabin Master', 'CABIN MASTER', 'PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM')
      )
    `);
  } else if (assessorRole === 'SM' || assessorRole === 'SS' || ['Cabin Master', 'CABIN MASTER'].includes(assessorRole)) {
    values.push(assessorId);
    conditions.push(`
      ssp.station_id = (
        SELECT station_id
        FROM staff_station_postings
        WHERE profile_id = $${values.length}
          AND is_current = true
        LIMIT 1
      )
    `);
    conditions.push(`
      NOT EXISTS (
        SELECT 1 
        FROM staff_station_postings ssp_sms
        JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
        JOIN roles r_sms ON r_sms.id = p_sms.role_id
        WHERE ssp_sms.station_id = ssp.station_id 
          AND ssp_sms.is_current = true 
          AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
      )
    `);
    if (assessorId === '439a8db6-2546-4858-abbc-3752f4acb536') {
      conditions.push(`
        (
          (r.name IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM', 'TM', 'Train Manager') AND p.reporting_officer_id IS NULL)
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
  } else if (assessorRole === 'TI') {
    values.push(assessorId);
    conditions.push(`
      ssp.station_id IN (
        SELECT station_id
        FROM station_assignments
        WHERE profile_id = $${values.length}
          AND assignment_type = 'TI_AREA'
          AND assigned_to IS NULL
      )
    `);
    if (roleCode !== 'TM') {
      conditions.push(`
        NOT EXISTS (
          SELECT 1 
          FROM staff_station_postings ssp_sms
          JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
          JOIN roles r_sms ON r_sms.id = p_sms.role_id
          WHERE ssp_sms.station_id = ssp.station_id 
            AND ssp_sms.is_current = true 
            AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
        )
      `);
    }
    conditions.push(`
      p.reporting_officer_id IS NULL
    `);
  } else if (assessorRole === 'AOM') {
    values.push(assessorId);
    conditions.push(`
      (
        s.division_id = (
          SELECT division_id
          FROM division_assignments
          WHERE profile_id = $${values.length}
            AND is_current = true
          LIMIT 1
        )
        OR
        p.id IN (
          SELECT sa.profile_id
          FROM station_assignments sa
          JOIN stations st ON st.id = sa.station_id
          WHERE sa.assignment_type = 'TI_AREA' AND sa.assigned_to IS NULL
            AND st.division_id = (
              SELECT division_id
              FROM division_assignments
              WHERE profile_id = $${values.length}
                AND is_current = true
              LIMIT 1
            )
        )
        OR
        p.id IN (
          SELECT da.profile_id
          FROM division_assignments da
          WHERE da.is_current = true
            AND da.division_id = (
              SELECT division_id
              FROM division_assignments
              WHERE profile_id = $${values.length}
                AND is_current = true
              LIMIT 1
            )
        )
      )
    `);
    conditions.push(`
      p.reporting_officer_id IS NULL
    `);
  } else {
    conditions.push(`
      p.reporting_officer_id IS NULL
    `);
  }

  // Enforce no active assessment cycle
  conditions.push(`
    NOT EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.assessed_user_id = p.id
        AND a.status NOT IN ('completed', 'approved', 'cancelled')
    )
  `);

  const query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.designation,
      s.station_code,
      s.station_name
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = p.id AND ssp.is_current = true
    LEFT JOIN stations s ON s.id = ssp.station_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.full_name;
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function getPmeRefStatusRepository(userId) {
  const recordsQuery = `
    SELECT 
      a.id,
      a.status,
      a.approval_status,
      a.pme_status,
      a.ref_status,
      a.created_at,
      a.evaluated_at,
      a.approved_at,
      a.due_date,
      a.scheduled_date,
      assessor.full_name as assessor_name,
      COALESCE(a.remarks_for_approver, a.instructions_remarks, '') as remarks
    FROM assessments a
    LEFT JOIN profiles assessor ON assessor.id = a.assessor_user_id
    WHERE a.assessed_user_id = $1
    ORDER BY a.created_at DESC;
  `;
  const profileQuery = `
    SELECT pme_due, pme_done, ref_due, ref_done
    FROM profiles
    WHERE id = $1;
  `;
  const [recordsRes, profileRes] = await Promise.all([
    pool.query(recordsQuery, [userId]),
    pool.query(profileQuery, [userId])
  ]);

  return {
    records: recordsRes.rows,
    profile: profileRes.rows[0] || {}
  };
}

async function hasStationSupervisor(profileId) {
  const query = `
    SELECT 1 FROM staff_station_postings ssp
    JOIN staff_station_postings ssp_sms ON ssp_sms.station_id = ssp.station_id AND ssp_sms.is_current = true
    JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
    JOIN roles r_sms ON r_sms.id = p_sms.role_id
    WHERE ssp.profile_id = $1 AND ssp.is_current = true
      AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
    LIMIT 1;
  `;
  const res = await pool.query(query, [profileId]);
  return res.rows.length > 0;
}

module.exports = {
  countActiveQuestions,
  createAssessmentRecord,
  getRandomQuestions,
  saveAssessmentQuestions,
  getAssessmentQuestions,
  getQuestionsWithCorrectAnswers,
  saveMcqAnswers,
  updateMcqScore,
  getYesNoQuestionsWithSections,
  saveYesNoAnswers,
  updateEvaluationScore,
  getAssessmentById,
  getAssessmentResult,
  getAssessmentsCreatedByUser,
  getPendingAssessmentsForUser,
  getPendingEvaluationsForAssessor,
  getAssessmentResultsForUser,
  saveEvaluationDraftAnswers,
  getEvaluationDraftAnswers,
  getEligibleStaff,
  getAssessorRoleStats,
  updateAssessmentOperationalDetails,
  getYesNoAnswersForAssessment,
  deleteAssessmentRecord,
  hasActiveAssessment,
  cancelAssessmentRecord,
  getEmployeeAssessmentHistory,
  getBulkEligibleStaff,
  getPmeRefStatusRepository,
  hasStationSupervisor,
};