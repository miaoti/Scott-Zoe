-- Remove expires_at column from surprise_boxes table
-- Expiration is now calculated dynamically from opened_at + expiration_minutes

ALTER TABLE surprise_boxes DROP COLUMN IF EXISTS expires_at;