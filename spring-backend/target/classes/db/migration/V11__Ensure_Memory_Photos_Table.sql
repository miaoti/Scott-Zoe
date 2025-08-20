-- Ensure memory_photos junction table exists
-- This migration ensures the table is created if it doesn't exist
-- (in case V7 migration failed or was skipped in production)

CREATE TABLE IF NOT EXISTS memory_photos (
    memory_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    PRIMARY KEY (memory_id, photo_id),
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_memory_photos_memory_id ON memory_photos(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_photos_photo_id ON memory_photos(photo_id);