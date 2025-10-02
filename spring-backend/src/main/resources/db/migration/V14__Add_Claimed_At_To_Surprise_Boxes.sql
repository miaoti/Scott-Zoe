-- Add claimed_at column to surprise_boxes table
ALTER TABLE surprise_boxes ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;

-- Create index for the new column to improve query performance
CREATE INDEX idx_surprise_boxes_claimed_at ON surprise_boxes(claimed_at);