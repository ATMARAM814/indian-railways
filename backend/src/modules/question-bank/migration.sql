-- SQL Migration: Add status and updated_at columns to question_bank table

-- 1. Add status column if it does not exist
ALTER TABLE question_bank 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. Add updated_at column if it does not exist
ALTER TABLE question_bank 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 3. Sync existing data: set status based on is_active column
UPDATE question_bank
SET status = CASE 
    WHEN is_active = false THEN 'inactive'
    ELSE 'active'
END
WHERE status IS NULL;
