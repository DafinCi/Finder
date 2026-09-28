-- ==============================================================================
-- MIGRATION: Phase 1A - Intent-Preserving V1 Profile Backfill
-- Date: 2026-09-29
-- Description: Idempotently migrates existing resume_analysis records to career_profiles
--              as unconfirmed draft capability/background evidence.
--              STRICT INVARIANT: NEVER manufactures career intent, seniority, or preferences.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    v_education JSONB;
    v_experience JSONB;
    v_projects JSONB;
    v_core_skills JSONB;
    v_supporting_skills JSONB;
BEGIN
    FOR r IN 
        SELECT DISTINCT ON (res.profile_id) 
            res.profile_id, 
            res.id AS resume_id, 
            ra.candidate_data, 
            ra.extracted_skills,
            ra.created_at
        FROM public.resumes res
        JOIN public.resume_analysis ra ON ra.resume_id = res.id
        ORDER BY res.profile_id, ra.created_at DESC
    LOOP
        -- Extract background fields safely from either candidate wrapper or root
        v_education := COALESCE(
            r.candidate_data->'candidate'->'education',
            r.candidate_data->'education',
            '[]'::jsonb
        );
        v_experience := COALESCE(
            r.candidate_data->'candidate'->'experience',
            r.candidate_data->'experience',
            '[]'::jsonb
        );
        v_projects := COALESCE(
            r.candidate_data->'candidate'->'projects',
            r.candidate_data->'projects',
            '[]'::jsonb
        );

        -- Extract categorized skills safely
        v_core_skills := COALESCE(
            r.candidate_data->'candidate'->'skills'->'core',
            r.candidate_data->'skills'->'core',
            '[]'::jsonb
        );
        v_supporting_skills := COALESCE(
            r.candidate_data->'candidate'->'skills'->'supporting',
            r.candidate_data->'skills'->'supporting',
            '[]'::jsonb
        );

        INSERT INTO public.career_profiles (
            profile_id,
            resume_id,
            status,
            onboarding_completed,
            current_onboarding_step,
            profile_version,
            profile_origin,
            background,
            capabilities,
            career_intent,
            preferences,
            constraints,
            confirmed_at,
            created_at,
            updated_at
        ) VALUES (
            r.profile_id,
            r.resume_id,
            'draft',                    -- Strictly draft: requires explicit user intent confirmation
            FALSE,                      -- Onboarding incomplete until intent confirmed
            2,                          -- Resume is already parsed; user resumes at Step 2 (Intent)
            1,
            'v1_migrated',
            jsonb_build_object(
                'education', v_education,
                'experience', v_experience,
                'projects', v_projects
            ),
            jsonb_build_object(
                'extraction_status', 'success',
                'skills', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'skill', skill_elem,
                            'category', CASE 
                                WHEN v_core_skills @> to_jsonb(skill_elem) THEN 'core'
                                WHEN v_supporting_skills @> to_jsonb(skill_elem) THEN 'supporting'
                                ELSE 'tool' -- Legacy unclassified skills conservatively default to tool
                            END,
                            'provenance', jsonb_build_object(
                                'source', 'resume_extracted',
                                'confidence', 0.85,
                                'updated_at', timezone('utc', now())
                            ),
                            'confirmation_state', 'draft'
                        )
                    )
                    FROM unnest(r.extracted_skills) AS skill_elem
                ), '[]'::jsonb),
                'suppressed_skills', '[]'::jsonb
            ),
            -- INTENT INVARIANT: Zero fabrication of target role, level, or employment types
            jsonb_build_object(
                'target_roles', '[]'::jsonb,
                'target_level', null,
                'employment_types', '[]'::jsonb
            ),
            -- PREFERENCE INVARIANT: Zero fabrication of location, work mode, or priorities
            jsonb_build_object(
                'locations', '[]'::jsonb,
                'work_modes', '[]'::jsonb,
                'priorities', '[]'::jsonb,
                'salary', null,
                'negative_preferences', '[]'::jsonb
            ),
            jsonb_build_object(
                'relocation_prohibited', false,
                'work_mode_strict', false
            ),
            null,
            r.created_at,
            timezone('utc', now())
        )
        ON CONFLICT (profile_id) DO NOTHING;
    END LOOP;
END $$;
