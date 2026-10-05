-- ==============================================================================
-- FINDER - OPTIONAL DEMO SEED
--
-- Inserts clearly marked sample companies and jobs so a fresh install has data
-- to browse. Run this only for local demos. Never run it against a production
-- database, and keep it out of the base schema so production starts empty.
--
-- Run by pasting this file into the Supabase SQL editor.
-- ==============================================================================

DO $$
DECLARE
    v_comp1_id UUID;
    v_comp2_id UUID;
    v_comp3_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.companies WHERE name = '[Sample] Decentralized Infra Co'
    ) THEN
        INSERT INTO public.companies (name, logo_url, description, website)
        VALUES (
            '[Sample] Decentralized Infra Co',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
            'Sample company used for local demos. Not a real employer.',
            'https://example.com'
        )
        RETURNING id INTO v_comp1_id;

        INSERT INTO public.companies (name, logo_url, description, website)
        VALUES (
            '[Sample] Blob Storage Guild',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
            'Sample company used for local demos. Not a real employer.',
            'https://example.com'
        )
        RETURNING id INTO v_comp2_id;

        INSERT INTO public.companies (name, logo_url, description, website)
        VALUES (
            '[Sample] Web3 AI Labs',
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60',
            'Sample company used for local demos. Not a real employer.',
            'https://example.com'
        )
        RETURNING id INTO v_comp3_id;

        INSERT INTO public.jobs (
            company_id, title, description, requirements, location,
            job_type, salary_range, experience_level
        )
        VALUES
        (
            v_comp1_id,
            '[Sample] Senior Frontend Engineer (React/Next.js)',
            'Sample job posting. Build high-performance web3 dApp interfaces with Next.js App Router and Tailwind CSS.',
            ARRAY['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Web3 / Sui SDK'],
            'Remote',
            'full-time',
            '$4,000 - $7,000 / month',
            'Senior'
        ),
        (
            v_comp2_id,
            '[Sample] Fullstack Web3 & AI Developer',
            'Sample job posting. Integrate Walrus storage and Walrus Memory into a generative AI application.',
            ARRAY['TypeScript', 'Node.js', 'Next.js', 'Walrus SDK', 'Vector Databases', 'Groq / OpenAI API'],
            'Hybrid - Jakarta / Remote',
            'full-time',
            '$3,500 - $6,000 / month',
            'Mid-Level'
        ),
        (
            v_comp3_id,
            '[Sample] AI Agent Systems Architect',
            'Sample job posting. Design autonomous memory-agent architecture with Walrus Memory and LLM reasoning.',
            ARRAY['Python', 'TypeScript', 'LangChain', 'Sui Move', 'pgvector', 'Prompt Engineering'],
            'Remote',
            'full-time',
            '$5,000 - $9,000 / month',
            'Lead / Staff'
        );
    END IF;
END $$;
