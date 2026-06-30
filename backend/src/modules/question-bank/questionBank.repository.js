const pool = require("../../config/database");

// ==========================================
// AUTO-MIGRATION RUNNER
// ==========================================
async function runAutoMigration() {
  const query = `
    -- Add status column if not exists
    ALTER TABLE question_bank 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

    -- Add updated_at column if not exists
    ALTER TABLE question_bank 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

    -- Add explanation column if not exists
    ALTER TABLE question_bank 
    ADD COLUMN IF NOT EXISTS explanation TEXT;

    -- Backfill status values from is_active if status is currently NULL
    UPDATE question_bank
    SET status = CASE 
        WHEN is_active = false THEN 'inactive'
        ELSE 'active'
    END
    WHERE status IS NULL;

    -- Create question_upload_logs table if not exists
    CREATE TABLE IF NOT EXISTS question_upload_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_code VARCHAR(20) NOT NULL,
      uploaded_by UUID NOT NULL,
      uploaded_by_name VARCHAR(255) NOT NULL,
      question_count INTEGER NOT NULL,
      uploaded_at TIMESTAMPTZ DEFAULT NOW(),
      action_type VARCHAR(50) DEFAULT 'UPLOAD',
      remarks TEXT
    );

    -- Create index on question_bank(role_code, status) if not exists
    CREATE INDEX IF NOT EXISTS idx_question_bank_role_code_status ON question_bank(role_code, status);

    -- Update constraints to CASCADE delete safely using a DO block to prevent deadlocks on restarts
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'assessment_mcq_questions_question_id_fkey' 
          AND pg_get_constraintdef(oid) LIKE '%ON DELETE CASCADE%'
      ) THEN
        ALTER TABLE assessment_mcq_questions DROP CONSTRAINT IF EXISTS assessment_mcq_questions_question_id_fkey;
        ALTER TABLE assessment_mcq_questions
          ADD CONSTRAINT assessment_mcq_questions_question_id_fkey
          FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'assessment_mcq_answers_question_id_fkey' 
          AND pg_get_constraintdef(oid) LIKE '%ON DELETE CASCADE%'
      ) THEN
        ALTER TABLE assessment_mcq_answers DROP CONSTRAINT IF EXISTS assessment_mcq_answers_question_id_fkey;
        ALTER TABLE assessment_mcq_answers
          ADD CONSTRAINT assessment_mcq_answers_question_id_fkey
          FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `;
  try {
    await pool.query(query);
    console.log("[Question Bank] Database auto-migration completed successfully.");
  } catch (err) {
    console.error("[Question Bank] Database auto-migration error:", err);
  }
}

runAutoMigration();

// ==========================================
// REPOSITORY OPERATIONS
// ==========================================

async function createQuestion({
  roleCode,
  questionText,
  optionA,
  optionB,
  optionC,
  optionD,
  correctAnswer,
}) {
  const query = `
    INSERT INTO question_bank (
      role_code,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      status,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
    RETURNING 
      id,
      role_code as "roleCode",
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      status,
      created_at as "createdAt";
  `;

  const result = await pool.query(query, [
    roleCode,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
  ]);

  return result.rows[0];
}

async function getQuestionByTextAndRole(questionText, roleCode) {
  const query = `
    SELECT id
    FROM question_bank
    WHERE question_text = $1 AND role_code = $2;
  `;
  const result = await pool.query(query, [questionText, roleCode]);
  return result.rows[0] || null;
}

function buildQuestionsWhere(filters, values) {
  const conditions = [];

  if (filters.roleCode) {
    values.push(filters.roleCode);
    conditions.push(`role_code = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`question_text ILIKE $${values.length}`);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

async function getQuestions(filters) {
  const values = [];
  const whereClause = buildQuestionsWhere(filters, values);

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  const query = `
    SELECT
      id,
      role_code as "roleCode",
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM question_bank
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);
  return result.rows;
}

async function countQuestions(filters) {
  const values = [];
  const whereClause = buildQuestionsWhere(filters, values);

  const query = `
    SELECT COUNT(*)::int as total
    FROM question_bank
    ${whereClause};
  `;

  const result = await pool.query(query, values);
  return result.rows[0].total;
}

async function getQuestionById(id) {
  const query = `
    SELECT
      id,
      role_code as "roleCode",
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM question_bank
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function updateQuestion(
  id,
  { roleCode, questionText, optionA, optionB, optionC, optionD, correctAnswer }
) {
  const query = `
    UPDATE question_bank
    SET
      role_code = $1,
      question_text = $2,
      option_a = $3,
      option_b = $4,
      option_c = $5,
      option_d = $6,
      correct_answer = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING
      id,
      role_code as "roleCode",
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt";
  `;

  const result = await pool.query(query, [
    roleCode,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    id,
  ]);

  return result.rows[0] || null;
}

async function updateQuestionStatus(id, status) {
  const query = `
    UPDATE question_bank
    SET
      status = $1,
      is_active = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING
      id,
      role_code as "roleCode",
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      status,
      created_at as "createdAt",
      updated_at as "updatedAt";
  `;

  const isActive = status === "active";
  const result = await pool.query(query, [status, isActive, id]);
  return result.rows[0] || null;
}

async function replaceQuestionBank({ roleCode, questions, log }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Delete existing questions for this role
    await client.query("DELETE FROM question_bank WHERE role_code = $1", [roleCode]);

    // 2. Insert new questions in bulk
    if (questions.length > 0) {
      const values = [];
      const placeholders = [];
      let index = 1;

      for (const q of questions) {
        placeholders.push(`($${index}, $${index + 1}, $${index + 2}, $${index + 3}, $${index + 4}, $${index + 5}, $${index + 6}, $${index + 7}, true, 'active', NOW())`);
        values.push(
          roleCode,
          q.questionText,
          q.optionA,
          q.optionB,
          q.optionC,
          q.optionD,
          q.correctAnswer,
          q.explanation || null
        );
        index += 8;
      }

      const bulkInsertQuery = `
        INSERT INTO question_bank (
          role_code,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          is_active,
          status,
          created_at
        )
        VALUES ${placeholders.join(", ")}
      `;

      await client.query(bulkInsertQuery, values);
    }

    // 3. Insert upload log
    const insertLogQuery = `
      INSERT INTO question_upload_logs (
        role_code,
        uploaded_by,
        uploaded_by_name,
        question_count,
        uploaded_at,
        action_type,
        remarks
      )
      VALUES ($1, $2, $3, $4, NOW(), 'UPLOAD', $5)
    `;
    await client.query(insertLogQuery, [
      roleCode,
      log.uploadedBy,
      log.uploadedByName,
      questions.length,
      log.remarks || null
    ]);

    await client.query("COMMIT");
    return { success: true, count: questions.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUploadHistory({ page = 1, limit = 10 } = {}) {
  const pageNum = Number(page || 1);
  const limitNum = Number(limit || 10);
  const offset = (pageNum - 1) * limitNum;

  const countQuery = `SELECT COUNT(*)::int as total FROM question_upload_logs`;
  const countResult = await pool.query(countQuery);
  const total = countResult.rows[0].total;

  const query = `
    SELECT
      id,
      role_code as "roleCode",
      uploaded_by as "uploadedBy",
      uploaded_by_name as "uploadedByName",
      question_count as "questionCount",
      uploaded_at as "uploadedAt",
      action_type as "actionType",
      remarks
    FROM question_upload_logs
    ORDER BY uploaded_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const result = await pool.query(query, [limitNum, offset]);
  return {
    records: result.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
}

async function getQuestionBankStats() {
  const query = `
    SELECT 
      role_code as "roleCode",
      COUNT(*)::int as "totalQuestions"
    FROM question_bank
    GROUP BY role_code
    ORDER BY role_code;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function deleteQuestion(id) {
  const query = `
    DELETE FROM question_bank
    WHERE id = $1
    RETURNING id;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function getAllActiveQuestionsByRole(roleCode) {
  const query = `
    SELECT
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      explanation
    FROM question_bank
    WHERE role_code = $1 AND status = 'active'
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [roleCode]);
  return result.rows;
}

async function getAllActiveQuestions() {
  const query = `
    SELECT
      question_text as "questionText",
      option_a as "optionA",
      option_b as "optionB",
      option_c as "optionC",
      option_d as "optionD",
      correct_answer as "correctAnswer",
      explanation
    FROM question_bank
    WHERE status = 'active'
    ORDER BY role_code, created_at ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getExistingQuestionsForRoles(roles) {
  if (!roles || roles.length === 0) return [];
  const query = `
    SELECT question_text as "questionText", role_code as "roleCode"
    FROM question_bank
    WHERE role_code = ANY($1);
  `;
  const result = await pool.query(query, [roles]);
  return result.rows;
}

async function createQuestionsBulk(questions) {
  if (!questions || questions.length === 0) return [];
  
  const values = [];
  const placeholders = [];
  let index = 1;
  
  for (const q of questions) {
    placeholders.push(`($${index}, $${index + 1}, $${index + 2}, $${index + 3}, $${index + 4}, $${index + 5}, $${index + 6}, 'active', NOW())`);
    values.push(
      q.roleCode,
      q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.correctAnswer
    );
    index += 7;
  }
  
  const query = `
    INSERT INTO question_bank (
      role_code,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      status,
      created_at
    )
    VALUES ${placeholders.join(", ")}
    RETURNING id;
  `;
  
  const result = await pool.query(query, values);
  return result.rows;
}

module.exports = {
  createQuestion,
  getQuestionByTextAndRole,
  getQuestions,
  countQuestions,
  getQuestionById,
  updateQuestion,
  updateQuestionStatus,
  replaceQuestionBank,
  getUploadHistory,
  getQuestionBankStats,
  deleteQuestion,
  getAllActiveQuestionsByRole,
  getAllActiveQuestions,
  getExistingQuestionsForRoles,
  createQuestionsBulk,
};

