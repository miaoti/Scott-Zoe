-- Add missing columns to surprise_boxes table that exist in SurpriseBox entity
ALTER TABLE surprise_boxes 
ADD COLUMN completion_criteria TEXT,
ADD COLUMN prize_description TEXT,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN dropped_at TIMESTAMP,
ADD COLUMN drop_at TIMESTAMP,
ADD COLUMN claimed_at TIMESTAMP;

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