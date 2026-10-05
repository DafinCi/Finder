-- ==============================================================================
-- MIGRATION: Phase 7 - Career Memory Lineage (supersedes_id)
-- Date: 2026-10-03
-- Description: Adds audit lineage so superseded memories can reference the
--              memory that replaced them.
-- ==============================================================================

ALTER TABLE public.career_memories
ADD COLUMN IF NOT EXISTS supersedes_id UUID
    REFERENCES public.career_memories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_career_memories_supersedes
    ON public.career_memories(supersedes_id);
