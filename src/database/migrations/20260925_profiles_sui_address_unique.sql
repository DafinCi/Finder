-- ==============================================================================
-- MIGRATION: Enforce Database-Level Unique Constraint on profiles.sui_address
-- Date: 2026-09-25
-- Description: Adds table-level UNIQUE constraint (uq_profiles_sui_address) on
--              public.profiles (sui_address).
-- Note: In standard PostgreSQL, NULL != NULL, so multiple users with
--       sui_address = NULL coexist safely, while ensuring no two users can link
--       the exact same Sui wallet address.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_sui_address'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT uq_profiles_sui_address
    UNIQUE (sui_address);
  END IF;
END $$;
