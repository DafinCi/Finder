-- ==============================================================================
-- MIGRATION: Phase 8 - Resume Processing Pipeline State & Document Decisions
-- Date: 2026-10-04
-- Description:
--   Stores the persisted pipeline stage for a resume upload plus the document
--   classification decision metadata. It intentionally stores NO document content:
--   only decision metadata is retained here.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.resume_processing (
    resume_id UUID PRIMARY KEY REFERENCES public.resumes(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'received' CHECK (stage IN (
        'received',
        'text_extracted',
        'heuristic_checked',
        'stored',
        'classifying',
        'classified',
        'extracting',
        'extracted',
        'matching',
        'persisting',
        'awaiting_confirmation',
        'needs_review',
        'completed',
        'rejected',
        'failed'
    )),
    document_type TEXT,
    is_resume BOOLEAN,
    classification_confidence NUMERIC(4, 3) CHECK (
        classification_confidence IS NULL
        OR (classification_confidence >= 0 AND classification_confidence <= 1)
    ),
    classification_reason TEXT,
    heuristic_score NUMERIC(4, 3) CHECK (
        heuristic_score IS NULL
        OR (heuristic_score >= 0 AND heuristic_score <= 1)
    ),
    decision TEXT CHECK (decision IN ('accepted', 'rejected', 'overridden')),
    overridden_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    error_code TEXT,
    error_message TEXT,
    raw_content_deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_resume_processing_profile
    ON public.resume_processing(profile_id);

CREATE INDEX IF NOT EXISTS idx_resume_processing_stage
    ON public.resume_processing(stage);

-- Row Level Security
ALTER TABLE public.resume_processing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume processing state"
    ON public.resume_processing
    FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own resume processing state"
    ON public.resume_processing
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own resume processing state"
    ON public.resume_processing
    FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own resume processing state"
    ON public.resume_processing
    FOR DELETE
    USING (auth.uid() = profile_id);
