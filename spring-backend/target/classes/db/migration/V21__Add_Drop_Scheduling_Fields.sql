-- Add drop scheduling fields to surprise_boxes table
ALTER TABLE surprise_boxes 
ADD COLUMN is_instant_drop BOOLEAN DEFAULT TRUE,
ADD COLUMN scheduled_drop_time TIMESTAMP;

-- Add comment for clarity
COMMENT ON COLUMN surprise_boxes.is_instant_drop IS 'Whether the box should be dropped instantly (true) or scheduled for later (false)';
COMMENT ON COLUMN surprise_boxes.scheduled_drop_time IS 'When to automatically drop the box (for Drop Later option)';