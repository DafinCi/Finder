-- Migration: Link existing active resumes to canonical career profiles
-- Date: 2026-09-30
-- Description: Backfills career_profiles.resume_id for users who uploaded a CV during onboarding
--              before explicit resume_id persistence was added to draft steps.
--              Idempotent: Only updates career_profiles rows where resume_id IS NULL.

UPDATE public.career_profiles cp
SET resume_id = r.id,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (profile_id) id, profile_id
  FROM public.resumes
  WHERE status != 'failed'
  ORDER BY profile_id, uploaded_at DESC
) r
WHERE cp.profile_id = r.profile_id
  AND cp.resume_id IS NULL;
