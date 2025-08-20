-- Fix memory type constraint to match actual enum names
-- The constraint was checking for uppercase values but enum stores as enum names
ALTER TABLE memories DROP CONSTRAINT IF EXISTS check_memory_type;

-- Add correct constraint that matches the actual enum names used by JPA
ALTER TABLE memories ADD CONSTRAINT memories_type_check 
    CHECK (type IN ('ANNIVERSARY', 'SPECIAL_MOMENT', 'MILESTONE', 'EVENT'));