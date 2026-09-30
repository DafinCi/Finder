-- ==============================================================================
-- MIGRATION: Phase 6 - Sovereign Career Memories & Decentralized Walrus Sync
-- Date: 2026-10-01
-- Description: Creates career_memories table for long-term durable agent memory
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.career_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'career_goal',
        'role_transition',
        'work_preference',
        'tech_focus',
        'constraint_avoid',
        'user_correction'
    )),
    content TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('explicit_user', 'inferred_pattern', 'user_correction')),
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')) DEFAULT 'high',
    status TEXT NOT NULL CHECK (status IN ('active', 'forgotten', 'superseded')) DEFAULT 'active',
    walrus_status TEXT NOT NULL CHECK (walrus_status IN ('pending', 'stored', 'failed')) DEFAULT 'pending',
    walrus_blob_id TEXT,
    walrus_object_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_career_memories_profile_status 
    ON public.career_memories(profile_id, status);

CREATE INDEX IF NOT EXISTS idx_career_memories_category 
    ON public.career_memories(profile_id, category);

CREATE INDEX IF NOT EXISTS idx_career_memories_walrus 
    ON public.career_memories(walrus_status);

CREATE INDEX IF NOT EXISTS idx_career_memories_created 
    ON public.career_memories(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.career_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career memories"
    ON public.career_memories
    FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own career memories"
    ON public.career_memories
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own career memories"
    ON public.career_memories
    FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own career memories"
    ON public.career_memories
    FOR DELETE
    USING (auth.uid() = profile_id);
