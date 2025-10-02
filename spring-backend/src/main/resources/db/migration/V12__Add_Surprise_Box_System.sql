-- Create surprise_boxes table
CREATE TABLE surprise_boxes (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    prize_name VARCHAR(255) NOT NULL,
    price_amount DECIMAL(10,2) NOT NULL,
    task_description TEXT NOT NULL,
    expiration_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    completion_type VARCHAR(20), -- 'TASK' or 'PAYMENT'
    CONSTRAINT chk_status CHECK (status IN ('CREATED', 'DROPPED', 'OPENED', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CLAIMED')),
    CONSTRAINT chk_completion_type CHECK (completion_type IN ('TASK', 'PAYMENT') OR completion_type IS NULL)
);

-- Create indexes for surprise_boxes
CREATE INDEX idx_surprise_boxes_owner_id ON surprise_boxes(owner_id);
CREATE INDEX idx_surprise_boxes_recipient_id ON surprise_boxes(recipient_id);
CREATE INDEX idx_surprise_boxes_status ON surprise_boxes(status);
CREATE INDEX idx_surprise_boxes_expires_at ON surprise_boxes(expires_at);

-- Create prize_history table
CREATE TABLE prize_history (
    id BIGSERIAL PRIMARY KEY,
    box_id BIGINT NOT NULL REFERENCES surprise_boxes(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    prize_name VARCHAR(255) NOT NULL,
    task_description TEXT NOT NULL,
    completion_type VARCHAR(20) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_prize_completion_type CHECK (completion_type IN ('TASK', 'PAYMENT'))
);

-- Create indexes for prize_history
CREATE INDEX idx_prize_history_recipient_id ON prize_history(recipient_id);
CREATE INDEX idx_prize_history_claimed_at ON prize_history(claimed_at DESC);
CREATE INDEX idx_prize_history_box_id ON prize_history(box_id);

-- Note: Permission grants removed as they are specific to Supabase and not needed for standard PostgreSQL