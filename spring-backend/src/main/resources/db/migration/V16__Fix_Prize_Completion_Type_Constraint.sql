-- Fix prize completion type constraint to match actual CompletionType enum values
-- The constraint was only allowing TASK and PAYMENT but enum includes LOCATION, TIME, PHOTO
ALTER TABLE prize_history DROP CONSTRAINT IF EXISTS chk_prize_completion_type;

ALTER TABLE prize_history 
    ADD CONSTRAINT chk_prize_completion_type 
    CHECK (completion_type IN ('TASK', 'PAYMENT', 'LOCATION', 'TIME', 'PHOTO'));

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT chk_prize_completion_type ON prize_history IS 'Ensures completion_type matches SurpriseBox.CompletionType enum values';