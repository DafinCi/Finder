import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Integration: Database Schema & Query Contract Verification", () => {
  const schemaPath = path.resolve(
    import.meta.dirname,
    "../../src/database/schema_v2.sql",
  );
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  it("should contain all canonical table definitions used in application code", () => {
    const requiredTables = [
      "public.profiles",
      "public.resumes",
      "public.resume_analysis",
      "public.companies",
      "public.jobs",
      "public.job_matches",
      "public.chat_sessions",
      "public.chat_messages",
    ];

    for (const table of requiredTables) {
      expect(schemaSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it("should contain all critical columns accessed by API endpoints", () => {
    const expectedColumns = [
      // resumes table
      "raw_text TEXT",
      "profile_id UUID",
      "storage_path TEXT",
      // jobs table
      "is_active BOOLEAN",
      "salary_range TEXT",
      "source TEXT",
      "source_job_id TEXT",
      "source_url TEXT",
      "apply_url TEXT",
      "company_name TEXT",
      "company_logo TEXT",
      "posted_at TIMESTAMP WITH TIME ZONE",
      "last_synced_at TIMESTAMP WITH TIME ZONE",
      // job_matches table
      "match_score INTEGER",
      "missing_skills JSONB",
      // chat_sessions table
      "user_id UUID",
      "title TEXT",
      "resume_id UUID",
      // chat_messages table
      "session_id UUID",
      "role TEXT",
      "metadata JSONB",
    ];

    for (const col of expectedColumns) {
      expect(schemaSql).toContain(col);
    }
  });

  it("should enforce check constraints on resume status aligned with app workflow", () => {
    expect(schemaSql).toContain(
      "CHECK (status IN ('uploaded', 'processing', 'completed', 'failed'))",
    );
  });

  it("should enforce check constraints on chat message roles aligned with TypeScript types", () => {
    expect(schemaSql).toContain(
      "CHECK (role IN ('user', 'assistant', 'system'))",
    );
  });

  it("should enforce check constraints on job sources aligned with supported providers", () => {
    expect(schemaSql).toContain(
      "CHECK (source IN ('manual', 'remotive', 'remoteok', 'jobicy', 'arbeitnow'))",
    );
  });

  it("should define a table-level unique constraint for external job deduplication and PostgREST upsert", () => {
    expect(schemaSql).toContain("uq_jobs_source_job_id");
    expect(schemaSql).toContain("UNIQUE (source, source_job_id)");
  });

  it("should define a table-level unique constraint on profiles.sui_address to prevent wallet duplication", () => {
    expect(schemaSql).toContain("uq_profiles_sui_address");
    expect(schemaSql).toContain("UNIQUE (sui_address)");
  });
});
