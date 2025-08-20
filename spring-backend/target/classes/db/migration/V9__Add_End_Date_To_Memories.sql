-- Add end_date column to memories table for EVENT type date ranges
ALTER TABLE memories ADD COLUMN end_date DATE;

-- Add check constraint to ensure end_date is only used for EVENT type
-- and that end_date is after or equal to start date when present
ALTER TABLE memories ADD CONSTRAINT check_event_end_date 
    CHECK (
        (type != 'EVENT' AND end_date IS NULL) OR
        (type = 'EVENT' AND (end_date IS NULL OR end_date >= date))
    );

-- Add index for date range queries
CREATE INDEX idx_memories_date_range ON memories(date, end_date) WHERE type = 'EVENT';