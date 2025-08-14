-- Add total_earnings column to users table
ALTER TABLE users ADD COLUMN total_earnings INTEGER DEFAULT 0;

-- Create earnings table
CREATE TABLE earnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    total_after INTEGER NOT NULL,
    source VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for better performance
CREATE INDEX idx_earnings_user_id ON earnings(user_id);
CREATE INDEX idx_earnings_created_at ON earnings(created_at);
CREATE INDEX idx_earnings_source ON earnings(source);

-- Update existing users to have 0 total_earnings if NULL
UPDATE users SET total_earnings = 0 WHERE total_earnings IS NULL;
