-- Add updated_at column to surprise_boxes table
ALTER TABLE surprise_boxes ADD COLUMN updated_at TIMESTAMP;

-- Set initial value for existing records to created_at
UPDATE surprise_boxes SET updated_at = created_at WHERE updated_at IS NULL;