-- Create wheel_configurations table
CREATE TABLE IF NOT EXISTS wheel_configurations (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER NOT NULL,
    configured_by_user_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id),
    FOREIGN KEY (configured_by_user_id) REFERENCES users(id)
);

-- Create wheel_prize_templates table
CREATE TABLE IF NOT EXISTS wheel_prize_templates (
    id SERIAL PRIMARY KEY,
    wheel_configuration_id INTEGER NOT NULL,
    prize_name VARCHAR(100) NOT NULL,
    prize_description VARCHAR(255),
    prize_type VARCHAR(50) NOT NULL,
    prize_value INTEGER NOT NULL,
    probability DECIMAL(5,2) NOT NULL,
    color VARCHAR(7) NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wheel_configuration_id) REFERENCES wheel_configurations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wheel_configurations_owner_user_id ON wheel_configurations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_configurations_configured_by_user_id ON wheel_configurations(configured_by_user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_configurations_is_active ON wheel_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_wheel_configurations_updated_at ON wheel_configurations(updated_at);

CREATE INDEX IF NOT EXISTS idx_wheel_prize_templates_wheel_configuration_id ON wheel_prize_templates(wheel_configuration_id);
CREATE INDEX IF NOT EXISTS idx_wheel_prize_templates_display_order ON wheel_prize_templates(display_order);
CREATE INDEX IF NOT EXISTS idx_wheel_prize_templates_prize_type ON wheel_prize_templates(prize_type);

-- Create unique constraint to ensure only one active configuration per owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_wheel_configurations_owner_active 
    ON wheel_configurations(owner_user_id) 
    WHERE is_active = true;

-- Add constraint to ensure probabilities are between 0 and 100
ALTER TABLE wheel_prize_templates 
    ADD CONSTRAINT chk_probability_range 
    CHECK (probability >= 0 AND probability <= 100);

-- Add constraint to ensure prize_value is positive
ALTER TABLE wheel_prize_templates 
    ADD CONSTRAINT chk_prize_value_positive 
    CHECK (prize_value > 0);

-- Add constraint to ensure display_order is positive
ALTER TABLE wheel_prize_templates 
    ADD CONSTRAINT chk_display_order_positive 
    CHECK (display_order > 0);

-- Add constraint to ensure color is a valid hex color
ALTER TABLE wheel_prize_templates 
    ADD CONSTRAINT chk_color_format 
    CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Add constraint to ensure prize_type is valid
ALTER TABLE wheel_prize_templates 
    ADD CONSTRAINT chk_prize_type_valid 
    CHECK (prize_type IN ('MONEY', 'CUSTOM'));