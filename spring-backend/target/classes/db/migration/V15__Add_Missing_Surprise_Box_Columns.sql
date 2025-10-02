-- Add missing columns to surprise_boxes table that exist in SurpriseBox entity
-- Using IF NOT EXISTS to prevent errors if columns already exist
ALTER TABLE surprise_boxes 
ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
ADD COLUMN IF NOT EXISTS prize_description TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS dropped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS drop_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP;

-- Add comments for the new fields
COMMENT ON COLUMN surprise_boxes.completion_criteria IS 'Criteria that must be met to complete the surprise box task';
COMMENT ON COLUMN surprise_boxes.prize_description IS 'Detailed description of the prize';
COMMENT ON COLUMN surprise_boxes.rejection_reason IS 'Reason provided when a box completion is rejected';
COMMENT ON COLUMN surprise_boxes.dropped_at IS 'Timestamp when the box was dropped to the recipient';
COMMENT ON COLUMN surprise_boxes.drop_at IS 'Scheduled timestamp when the box should be dropped';
COMMENT ON COLUMN surprise_boxes.claimed_at IS 'Timestamp when the prize was claimed by the recipient';

-- Update completion_type constraint to include all enum values from SurpriseBox entity
ALTER TABLE surprise_boxes DROP CONSTRAINT IF EXISTS chk_completion_type;
ALTER TABLE surprise_boxes ADD CONSTRAINT chk_completion_type 
    CHECK (completion_type IN ('TASK', 'PAYMENT', 'LOCATION', 'TIME', 'PHOTO') OR completion_type IS NULL);