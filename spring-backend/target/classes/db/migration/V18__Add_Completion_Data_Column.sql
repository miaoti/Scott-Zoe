-- Add completion_data column to surprise_boxes table
ALTER TABLE surprise_boxes ADD COLUMN completion_data TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN surprise_boxes.completion_data IS 'Stores completion data such as photo URLs, text responses, location data, or timer data as JSON string';