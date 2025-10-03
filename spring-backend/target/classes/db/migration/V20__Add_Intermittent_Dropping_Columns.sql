-- Add intermittent dropping columns to surprise_boxes table
-- Using IF NOT EXISTS to prevent errors if columns already exist
ALTER TABLE surprise_boxes 
ADD COLUMN IF NOT EXISTS drop_duration_minutes INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS pause_duration_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS next_drop_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_dropping BOOLEAN DEFAULT FALSE;

-- Add comments for the new fields
COMMENT ON COLUMN surprise_boxes.drop_duration_minutes IS 'Duration in minutes for how long the box should be available for dropping';
COMMENT ON COLUMN surprise_boxes.pause_duration_minutes IS 'Duration in minutes for how long to pause between dropping cycles';
COMMENT ON COLUMN surprise_boxes.next_drop_time IS 'Next time when the box should transition to dropping state';
COMMENT ON COLUMN surprise_boxes.is_dropping IS 'Whether the box is currently in dropping state';