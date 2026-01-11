-- PixVenture Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Adventures table (stores game sessions)
CREATE TABLE IF NOT EXISTS adventures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR NOT NULL,
    username VARCHAR NOT NULL,
    language VARCHAR(2) DEFAULT 'en' CHECK (language IN ('en', 'id', 'ja')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint: only one active adventure per member
-- Partial unique index (PostgreSQL syntax)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_adventure 
ON adventures (member_id) 
WHERE (is_active = true);


-- Adventure scenes table (stores game history)
CREATE TABLE IF NOT EXISTS adventure_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
    scene_number INT NOT NULL,
    story_text TEXT NOT NULL,
    image_url TEXT,
    command TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure scene numbers are unique within an adventure
    CONSTRAINT unique_scene_number UNIQUE (adventure_id, scene_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_adventures_member ON adventures(member_id);
CREATE INDEX IF NOT EXISTS idx_adventures_active ON adventures(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_adventures_last_played ON adventures(last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenes_adventure ON adventure_scenes(adventure_id);
CREATE INDEX IF NOT EXISTS idx_scenes_created ON adventure_scenes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adventures table
-- Users can only view their own adventures
CREATE POLICY "Users can view own adventures"
    ON adventures FOR SELECT
    USING (auth.uid()::text = member_id);

-- Users can insert their own adventures
CREATE POLICY "Users can insert own adventures"
    ON adventures FOR INSERT
    WITH CHECK (auth.uid()::text = member_id);

-- Users can update their own adventures
CREATE POLICY "Users can update own adventures"
    ON adventures FOR UPDATE
    USING (auth.uid()::text = member_id)
    WITH CHECK (auth.uid()::text = member_id);

-- RLS Policies for adventure_scenes table
-- Users can only view scenes from their own adventures
CREATE POLICY "Users can view own scenes"
    ON adventure_scenes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM adventures 
            WHERE id = adventure_id 
            AND member_id = auth.uid()::text
        )
    );

-- Users can insert scenes to their own adventures
CREATE POLICY "Users can insert own scenes"
    ON adventure_scenes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM adventures 
            WHERE id = adventure_id 
            AND member_id = auth.uid()::text
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_adventures_updated_at 
    BEFORE UPDATE ON adventures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON adventures TO authenticated;
-- GRANT ALL ON adventure_scenes TO authenticated;

-- Verify tables created
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('adventures', 'adventure_scenes');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'PixVenture database schema created successfully!';
    RAISE NOTICE 'Tables: adventures, adventure_scenes';
    RAISE NOTICE 'RLS policies enabled for user data protection';
END $$;
