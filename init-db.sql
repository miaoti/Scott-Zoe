-- Database initialization script for PostgreSQL
-- This script will be executed when the PostgreSQL container starts for the first time

-- Create the database (this is handled by POSTGRES_DB environment variable)
-- But we can add any additional setup here

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship_start_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    caption TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create photo_categories junction table
CREATE TABLE IF NOT EXISTS photo_categories (
    photo_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (photo_id, category_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    photo_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Create love_counter table (matches Love entity)
CREATE TABLE IF NOT EXISTS love_counter (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    count_value BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create wheel_usage table
CREATE TABLE IF NOT EXISTS wheel_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    used_at TIMESTAMP NOT NULL,
    week_start TIMESTAMP NOT NULL,
    prize_amount INTEGER,
    source VARCHAR(255) NOT NULL DEFAULT 'weekly',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_photo_id ON notes(photo_id);
CREATE INDEX IF NOT EXISTS idx_notes_author_id ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_love_counter_user_id ON love_counter(user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_usage_user_id ON wheel_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_usage_week_start ON wheel_usage(week_start);
CREATE INDEX IF NOT EXISTS idx_wheel_usage_used_at ON wheel_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_wheel_usage_source ON wheel_usage(source);

-- Create unique constraint to prevent multiple uses per week per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_wheel_usage_user_week ON wheel_usage(user_id, week_start);

-- Create saved_opportunities table
CREATE TABLE saved_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    source VARCHAR(255) NOT NULL DEFAULT 'milestone_520',
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for saved_opportunities
CREATE INDEX idx_saved_opportunities_user_id ON saved_opportunities(user_id);
CREATE INDEX idx_saved_opportunities_is_used ON saved_opportunities(is_used);
CREATE INDEX idx_saved_opportunities_created_at ON saved_opportunities(created_at);
CREATE INDEX idx_saved_opportunities_source ON saved_opportunities(source);
CREATE INDEX idx_saved_opportunities_user_unused ON saved_opportunities(user_id, is_used);

-- Insert default data (this will be handled by Spring Boot's DatabaseConfig)
-- But we can add some basic settings here if needed