const pool = require("../../config/database");

async function runAutoMigration() {
  const query = `
    -- Add is_marked_for_review to assessment_mcq_questions if not exists
    ALTER TABLE assessment_mcq_questions ADD COLUMN IF NOT EXISTS is_marked_for_review BOOLEAN DEFAULT false;

    -- Add explanation to question_bank if not exists
    ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS explanation TEXT;
  `;
  try {
    await pool.query(query);
    console.log("[Candidate Assessments Repository] Auto migration completed successfully.");
  } catch (err) {
    console.error("[Candidate Assessments Repository] Auto migration error:", err);
  }
}

runAutoMigration();

async function getMyAssessmentsHistory(userId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.approval_status,
      a.assessed_role_code,
      a.assessor_role_code,
      assessor.full_name as assessor_name,
      a.mcq_score,
      a.evaluation_score,
      a.total_score,
      a.percentage,
      a.created_at,
      a.submitted_at,
      a.evaluated_at,
      a.alcoholic_status,
      (SELECT COUNT(*)::int FROM assessment_mcq_questions WHERE assessment_id = a.id) as question_count
    FROM assessments a
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    WHERE a.assessed_user_id = $1
      AND a.status IN ('completed', 'mcq_submitted', 'evaluated', 'approved')
    ORDER BY a.created_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getActiveAssessment(userId) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.assessed_role_code,
      a.assessor_role_code,
      assessed.full_name as assessed_name,
      assessed.hrms_id as assessed_hrms_id,
      assessed.designation as assessed_designation,
      assessor.full_name as assessor_name,
      a.created_at,
      station.station_name as station_name,
      station.station_code as station_code,
      (SELECT COUNT(*)::int FROM assessment_mcq_questions WHERE assessment_id = a.id) as question_count
    FROM assessments a
    JOIN profiles assessed ON assessed.id = a.assessed_user_id
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations station ON station.id = ssp.station_id
    WHERE a.assessed_user_id = $1
      AND a.status IN ('created', 'mcq_access_sent', 'mcq_pending')
    ORDER BY a.created_at DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

async function getAssessmentDetailsForCandidate(assessmentId, userId) {
  const query = `
    SELECT
      a.*,
      assessed.full_name as assessed_name,
      assessed.hrms_id as assessed_hrms_id,
      assessed.designation as assessed_designation,
      assessor.full_name as assessor_name,
      assessor.hrms_id as assessor_hrms_id,
      station.station_name as station_name,
      station.station_code as station_code
    FROM assessments a
    JOIN profiles assessed ON assessed.id = a.assessed_user_id
    JOIN profiles assessor ON assessor.id = a.assessor_user_id
    LEFT JOIN staff_station_postings ssp ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations station ON station.id = ssp.station_id
    WHERE a.id = $1 AND a.assessed_user_id = $2;
  `;
  const result = await pool.query(query, [assessmentId, userId]);
  return result.rows[0] || null;
}

async function getMcqQuestionsForExam(assessmentId) {
  const query = `
    SELECT
      amq.question_id,
      amq.is_marked_for_review,
      qb.question_text,
      qb.option_a,
      qb.option_b,
      qb.option_c,
      qb.option_d,
      ama.selected_answer
    FROM assessment_mcq_questions amq
    JOIN question_bank qb ON qb.id = amq.question_id
    LEFT JOIN assessment_mcq_answers ama 
      ON ama.assessment_id = amq.assessment_id 
      AND ama.question_id = amq.question_id
    WHERE amq.assessment_id = $1
    ORDER BY qb.question_text;
  `;
  const result = await pool.query(query, [assessmentId]);
  return result.rows;
}

async function getCorrectAnswer(questionId) {
  const query = `SELECT correct_answer FROM question_bank WHERE id = $1;`;
  const result = await pool.query(query, [questionId]);
  return result.rows[0]?.correct_answer || null;
}

async function saveCandidateAnswer(assessmentId, questionId, selectedAnswer, isCorrect) {
  const query = `
    INSERT INTO assessment_mcq_answers (assessment_id, question_id, selected_answer, is_correct)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (assessment_id, question_id)
    DO UPDATE SET selected_answer = EXCLUDED.selected_answer, is_correct = EXCLUDED.is_correct
    RETURNING *;
  `;
  const result = await pool.query(query, [assessmentId, questionId, selectedAnswer, isCorrect]);
  return result.rows[0];
}

async function toggleMarkForReview(assessmentId, questionId, isMarkedForReview) {
  const query = `
    UPDATE assessment_mcq_questions
    SET is_marked_for_review = $1
    WHERE assessment_id = $2 AND question_id = $3
    RETURNING *;
  `;
  const result = await pool.query(query, [isMarkedForReview, assessmentId, questionId]);
  return result.rows[0];
}

async function submitMcqExam(assessmentId, mcqScore) {
  const query = `
    UPDATE assessments
    SET
      mcq_score = $1,
      total_score = $1 + COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0),
      percentage = (($1 + COALESCE(alertness_score, 0) + COALESCE(safety_record_score, 0) + COALESCE(leadership_score, 0) + COALESCE(discipline_score, 0) + COALESCE(appearance_score, 0))::numeric / COALESCE(NULLIF(max_marks, 0), 100)) * 100,
      submitted_at = now(),
      status = 'mcq_submitted'
    WHERE id = $2
    RETURNING *;
  `;
  const result = await pool.query(query, [mcqScore, assessmentId]);
  return result.rows[0];
}

async function getScorecardQuestionsReview(assessmentId) {
  const query = `
    SELECT
      amq.question_id,
      qb.question_text,
      qb.option_a,
      qb.option_b,
      qb.option_c,
      qb.option_d,
      qb.correct_answer,
      qb.explanation,
      ama.selected_answer,
      ama.is_correct
    FROM assessment_mcq_questions amq
    JOIN question_bank qb ON qb.id = amq.question_id
    LEFT JOIN assessment_mcq_answers ama 
      ON ama.assessment_id = amq.assessment_id 
      AND ama.question_id = amq.question_id
    WHERE amq.assessment_id = $1
    ORDER BY qb.question_text;
  `;
  const result = await pool.query(query, [assessmentId]);
  return result.rows;
}

module.exports = {
  getMyAssessmentsHistory,
  getActiveAssessment,
  getAssessmentDetailsForCandidate,
  getMcqQuestionsForExam,
  getCorrectAnswer,
  saveCandidateAnswer,
  toggleMarkForReview,
  submitMcqExam,
  getScorecardQuestionsReview,
};
