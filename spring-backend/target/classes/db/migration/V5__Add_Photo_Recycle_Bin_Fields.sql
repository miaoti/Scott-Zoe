-- Add missing fields to photos table for recycle bin functionality

-- Add path column
ALTER TABLE photos ADD COLUMN path VARCHAR(500);

-- Add size column
ALTER TABLE photos ADD COLUMN size BIGINT;

-- Add mime_type column
ALTER TABLE photos ADD COLUMN mime_type VARCHAR(255);

-- Add is_favorite column
ALTER TABLE photos ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;

-- Add is_deleted column for soft delete (recycle bin)
ALTER TABLE photos ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add deleted_at column to track when photo was deleted
ALTER TABLE photos ADD COLUMN deleted_at TIMESTAMP;

-- Create index for better performance on deleted photos queries
CREATE INDEX IF NOT EXISTS idx_photos_is_deleted ON photos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at);

-- Update existing photos to have default values for new required fields
-- Note: This assumes existing photos have valid file paths that can be reconstructed
UPDATE photos SET 
    path = COALESCE(path, '/uploads/' || filename),
    size = COALESCE(size, 0),
    mime_type = COALESCE(mime_type, 'image/jpeg'),
    is_favorite = COALESCE(is_favorite, FALSE),
    is_deleted = COALESCE(is_deleted, FALSE)
WHERE path IS NULL OR size IS NULL OR mime_type IS NULL;