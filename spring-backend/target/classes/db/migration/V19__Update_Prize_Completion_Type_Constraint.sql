-- Update prize_history completion_type constraint to include all valid completion types
-- This fixes the constraint violation when claiming boxes with LOCATION completion type

-- Drop the existing constraint
ALTER TABLE prize_history DROP CONSTRAINT IF EXISTS chk_prize_completion_type;

-- Add the updated constraint with all valid completion types
ALTER TABLE prize_history ADD CONSTRAINT chk_prize_completion_type 
    CHECK (completion_type IN ('TASK', 'PAYMENT', 'LOCATION', 'TIME', 'PHOTO'));

-- Also update the surprise_boxes table constraint to be consistent
ALTER TABLE surprise_boxes DROP CONSTRAINT IF EXISTS chk_completion_type;
ALTER TABLE surprise_boxes ADD CONSTRAINT chk_completion_type 
    CHECK (completion_type IN ('TASK', 'PAYMENT', 'LOCATION', 'TIME', 'PHOTO') OR completion_type IS NULL);