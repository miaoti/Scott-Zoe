-- Add fields for intermittent dropping behavior to surprise_boxes table
ALTER TABLE surprise_boxes 
ADD COLUMN drop_duration_minutes INTEGER DEFAULT 3,
ADD COLUMN pause_duration_minutes INTEGER DEFAULT 5,
ADD COLUMN next_drop_time TIMESTAMP,
ADD COLUMN is_dropping BOOLEAN DEFAULT FALSE;

-- Add comments for the new fields
COMMENT ON COLUMN surprise_boxes.drop_duration_minutes IS 'Duration in minutes for how long the box should be available for dropping';
COMMENT ON COLUMN surprise_boxes.pause_duration_minutes IS 'Duration in minutes for how long to pause between dropping cycles';
COMMENT ON COLUMN surprise_boxes.next_drop_time IS 'Next time when the box should transition to dropping state';
COMMENT ON COLUMN surprise_boxes.is_dropping IS 'Whether the box is currently in dropping state';