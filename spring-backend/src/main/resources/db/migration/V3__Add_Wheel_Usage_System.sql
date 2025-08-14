-- Create wheel_usage table
CREATE TABLE wheel_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    used_at TIMESTAMP NOT NULL,
    week_start TIMESTAMP NOT NULL,
    prize_amount INTEGER,
    source VARCHAR(255) NOT NULL DEFAULT 'weekly',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_wheel_usage_user_id ON wheel_usage(user_id);
CREATE INDEX idx_wheel_usage_week_start ON wheel_usage(week_start);
CREATE INDEX idx_wheel_usage_used_at ON wheel_usage(used_at);
CREATE INDEX idx_wheel_usage_source ON wheel_usage(source);

-- Create unique constraint to prevent multiple uses per week per user
CREATE UNIQUE INDEX idx_wheel_usage_user_week ON wheel_usage(user_id, week_start);
