-- ============================================
-- AI Personalized Learning Roadmap - Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: user_ai_profiles
-- Stores user profile data for AI roadmap generation
-- ============================================

CREATE TABLE IF NOT EXISTS user_ai_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  current_job_role TEXT NOT NULL,
  target_role TEXT NOT NULL,
  
  -- Skills
  current_skills TEXT[] DEFAULT '{}',
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  
  -- Learning preferences
  learning_style TEXT[] DEFAULT '{}',
  preferred_language TEXT CHECK (preferred_language IN ('vi', 'en')) DEFAULT 'vi',
  focus_areas TEXT[] DEFAULT '{}',
  
  -- Time commitment
  hours_per_week INTEGER NOT NULL DEFAULT 10 CHECK (hours_per_week >= 1 AND hours_per_week <= 60),
  target_months INTEGER NOT NULL DEFAULT 6 CHECK (target_months >= 1 AND target_months <= 24),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_profiles_user_id ON user_ai_profiles(user_id);

-- ============================================
-- Table: ai_generated_roadmaps
-- Stores AI-generated roadmaps with full JSON data
-- ============================================

CREATE TABLE IF NOT EXISTS ai_generated_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES user_ai_profiles(id) ON DELETE SET NULL,
  
  -- Roadmap content
  title TEXT NOT NULL,
  description TEXT,
  total_estimated_hours INTEGER DEFAULT 0,
  
  -- JSON data for React Flow
  phases JSONB NOT NULL DEFAULT '[]',  -- Array of phase objects
  nodes JSONB NOT NULL DEFAULT '[]',   -- Array of node objects
  edges JSONB NOT NULL DEFAULT '[]',   -- Array of edge objects
  
  -- Generation metadata (for thesis metrics)
  generation_metadata JSONB DEFAULT NULL,
  /* Example structure:
  {
    "model": "gpt-4o-mini",
    "input_tokens": 650,
    "output_tokens": 2500,
    "latency_ms": 8500,
    "prompt_version": "1.0.0",
    "personalization_score": 0.85,
    "generated_at": "2024-01-15T10:30:00Z"
  }
  */
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ai_generated_roadmaps
CREATE INDEX IF NOT EXISTS idx_ai_roadmaps_user_id ON ai_generated_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_roadmaps_profile_id ON ai_generated_roadmaps(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_roadmaps_active ON ai_generated_roadmaps(user_id, is_active) WHERE is_active = true;

-- ============================================
-- Table: ai_roadmap_node_progress
-- Tracks user progress on individual roadmap nodes
-- ============================================

CREATE TABLE IF NOT EXISTS ai_roadmap_node_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES ai_generated_roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Node reference (matches node.id in roadmap JSON)
  node_id TEXT NOT NULL,
  
  -- Progress status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  
  -- Optional notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique progress per node per roadmap
  UNIQUE(roadmap_id, node_id)
);

-- Indexes for node progress
CREATE INDEX IF NOT EXISTS idx_ai_progress_roadmap_id ON ai_roadmap_node_progress(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_ai_progress_user_id ON ai_roadmap_node_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_progress_status ON ai_roadmap_node_progress(roadmap_id, status);

-- ============================================
-- Functions for automatic timestamp updates
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_ai_profiles_updated_at ON user_ai_profiles;
CREATE TRIGGER update_user_ai_profiles_updated_at
  BEFORE UPDATE ON user_ai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_generated_roadmaps_updated_at ON ai_generated_roadmaps;
CREATE TRIGGER update_ai_generated_roadmaps_updated_at
  BEFORE UPDATE ON ai_generated_roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_roadmap_node_progress_updated_at ON ai_roadmap_node_progress;
CREATE TRIGGER update_ai_roadmap_node_progress_updated_at
  BEFORE UPDATE ON ai_roadmap_node_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RPC Functions for common operations
-- ============================================

-- Get roadmap with progress
CREATE OR REPLACE FUNCTION get_roadmap_with_progress(p_roadmap_id UUID, p_user_id UUID)
RETURNS TABLE (
  roadmap_id UUID,
  title TEXT,
  description TEXT,
  total_estimated_hours INTEGER,
  phases JSONB,
  nodes JSONB,
  edges JSONB,
  generation_metadata JSONB,
  progress JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as roadmap_id,
    r.title,
    r.description,
    r.total_estimated_hours,
    r.phases,
    r.nodes,
    r.edges,
    r.generation_metadata,
    COALESCE(
      jsonb_object_agg(p.node_id, p.status) FILTER (WHERE p.node_id IS NOT NULL),
      '{}'::jsonb
    ) as progress,
    r.created_at
  FROM ai_generated_roadmaps r
  LEFT JOIN ai_roadmap_node_progress p 
    ON p.roadmap_id = r.id AND p.user_id = p_user_id
  WHERE r.id = p_roadmap_id AND r.user_id = p_user_id
  GROUP BY r.id;
END;
$$ LANGUAGE plpgsql;

-- Get user's roadmaps summary
CREATE OR REPLACE FUNCTION get_user_roadmaps_summary(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  total_nodes INTEGER,
  completed_nodes INTEGER,
  progress_percentage INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    jsonb_array_length(r.nodes) as total_nodes,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM ai_roadmap_node_progress p 
       WHERE p.roadmap_id = r.id AND p.status = 'completed'),
      0
    ) as completed_nodes,
    CASE 
      WHEN jsonb_array_length(r.nodes) > 0 THEN
        COALESCE(
          (SELECT (COUNT(*)::FLOAT / jsonb_array_length(r.nodes) * 100)::INTEGER 
           FROM ai_roadmap_node_progress p 
           WHERE p.roadmap_id = r.id AND p.status = 'completed'),
          0
        )
      ELSE 0
    END as progress_percentage,
    r.created_at,
    r.updated_at
  FROM ai_generated_roadmaps r
  WHERE r.user_id = p_user_id AND r.is_active = true
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update node progress
CREATE OR REPLACE FUNCTION update_node_progress(
  p_roadmap_id UUID,
  p_user_id UUID,
  p_node_id TEXT,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS ai_roadmap_node_progress AS $$
DECLARE
  result ai_roadmap_node_progress;
BEGIN
  INSERT INTO ai_roadmap_node_progress (roadmap_id, user_id, node_id, status, notes, completed_at)
  VALUES (
    p_roadmap_id,
    p_user_id,
    p_node_id,
    p_status,
    p_notes,
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (roadmap_id, node_id)
  DO UPDATE SET
    status = p_status,
    notes = COALESCE(p_notes, ai_roadmap_node_progress.notes),
    completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_roadmap_node_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_ai_profiles
CREATE POLICY "Users can view own profiles" ON user_ai_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own profiles" ON user_ai_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profiles" ON user_ai_profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policies for ai_generated_roadmaps
CREATE POLICY "Users can view own roadmaps" ON ai_generated_roadmaps
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own roadmaps" ON ai_generated_roadmaps
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own roadmaps" ON ai_generated_roadmaps
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own roadmaps" ON ai_generated_roadmaps
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Policies for ai_roadmap_node_progress
CREATE POLICY "Users can view own progress" ON ai_roadmap_node_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own progress" ON ai_roadmap_node_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own progress" ON ai_roadmap_node_progress
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ============================================
-- Grant permissions for service role
-- (Use this for server-side operations)
-- ============================================

-- Note: Run these with service role or superuser
-- GRANT ALL ON user_ai_profiles TO service_role;
-- GRANT ALL ON ai_generated_roadmaps TO service_role;
-- GRANT ALL ON ai_roadmap_node_progress TO service_role;

-- ============================================
-- Sample data (for testing - optional)
-- ============================================

-- INSERT INTO user_ai_profiles (user_id, current_job_role, target_role, current_skills, skill_level, learning_style, hours_per_week, target_months)
-- VALUES (
--   'your-user-id-here',
--   'Sinh viên năm 3',
--   'Frontend Developer',
--   ARRAY['HTML/CSS', 'JavaScript cơ bản'],
--   'beginner',
--   ARRAY['video', 'project'],
--   15,
--   6
-- );
