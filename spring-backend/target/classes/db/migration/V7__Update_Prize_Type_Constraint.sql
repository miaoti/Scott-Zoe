-- Update the prize type constraint to include additional valid types
ALTER TABLE wheel_prize_templates 
    DROP CONSTRAINT IF EXISTS chk_prize_type_valid;

ALTER TABLE wheel_prize_templates 
    ADD CONSTRAINT chk_prize_type_valid 
    CHECK (prize_type IN ('MONEY', 'CUSTOM', 'GIFT', 'EXPERIENCE'));