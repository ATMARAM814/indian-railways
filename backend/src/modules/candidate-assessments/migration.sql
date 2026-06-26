-- Add is_marked_for_review to assessment_mcq_questions if not exists
ALTER TABLE assessment_mcq_questions ADD COLUMN IF NOT EXISTS is_marked_for_review BOOLEAN DEFAULT false;

-- Add explanation to question_bank if not exists
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS explanation TEXT;
