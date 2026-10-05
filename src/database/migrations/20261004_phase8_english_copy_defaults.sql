-- ==============================================================================
-- MIGRATION: Phase 8 - English copy defaults
-- Date: 2026-10-04
-- Description: Switches the default chat session title to English and backfills
--              existing sessions that still use the old Indonesian default.
-- ==============================================================================

ALTER TABLE public.chat_sessions
    ALTER COLUMN title SET DEFAULT 'New Career Chat';

UPDATE public.chat_sessions
SET title = 'New Career Chat'
WHERE title = 'Obrolan Karir Baru';
