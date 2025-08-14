-- Add missing fields to photos table for recycle bin functionality

-- Add path column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'photos' AND column_name = 'path') THEN
        ALTER TABLE photos ADD COLUMN path VARCHAR(500);
    END IF;
END $$;

-- Add size column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'photos' AND column_name = 'size') THEN
        ALTER TABLE photos ADD COLUMN size BIGINT;
    END IF;
END $$;

-- Add mime_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'photos' AND column_name = 'mime_type') THEN
        ALTER TABLE photos ADD COLUMN mime_type VARCHAR(255);
    END IF;
END $$;

-- Add is_favorite column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'photos' AND column_name = 'is_favorite') THEN
        ALTER TABLE photos ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_deleted column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'photos' AND column_name = 'is_deleted') THEN
        ALTER TABLE photos ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'photos' AND column_name = 'deleted_at') THEN
        ALTER TABLE photos ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END $$;

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