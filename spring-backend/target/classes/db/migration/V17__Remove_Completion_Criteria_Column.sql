-- Remove completion_criteria column from surprise_boxes table
ALTER TABLE surprise_boxes DROP COLUMN IF EXISTS completion_criteria;