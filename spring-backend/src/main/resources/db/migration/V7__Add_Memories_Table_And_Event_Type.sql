-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create memory_photos junction table for associating photos with memories
CREATE TABLE IF NOT EXISTS memory_photos (
    memory_id INTEGER NOT NULL,
    photo_id INTEGER NOT NULL,
    PRIMARY KEY (memory_id, photo_id),
    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memories_created_by ON memories(created_by);
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_photos_memory_id ON memory_photos(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_photos_photo_id ON memory_photos(photo_id);

-- Add constraint to ensure valid memory types
ALTER TABLE memories ADD CONSTRAINT check_memory_type 
    CHECK (type IN ('ANNIVERSARY', 'SPECIAL_MOMENT', 'MILESTONE', 'EVENT'));