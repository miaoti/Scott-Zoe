-- Create saved_opportunities table
CREATE TABLE saved_opportunities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    source VARCHAR(255) NOT NULL DEFAULT 'milestone_520',
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_saved_opportunities_user_id ON saved_opportunities(user_id);
CREATE INDEX idx_saved_opportunities_is_used ON saved_opportunities(is_used);
CREATE INDEX idx_saved_opportunities_created_at ON saved_opportunities(created_at);
CREATE INDEX idx_saved_opportunities_source ON saved_opportunities(source);
CREATE INDEX idx_saved_opportunities_user_unused ON saved_opportunities(user_id, is_used);