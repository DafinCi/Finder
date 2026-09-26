import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Migration Contract: profiles.sui_address uniqueness", () => {
  const migrationPath = path.resolve(
    import.meta.dirname,
    "../../src/database/migrations/20260925_profiles_sui_address_unique.sql",
  );
  const schemaPath = path.resolve(
    import.meta.dirname,
    "../../src/database/schema_v2.sql",
  );

  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  it("should contain the uq_profiles_sui_address constraint in migration file", () => {
    expect(migrationSql).toContain("uq_profiles_sui_address");
    expect(migrationSql).toContain("UNIQUE (sui_address)");
    expect(migrationSql).toContain("ALTER TABLE public.profiles");
  });

  it("should enforce idempotent execution in migration file", () => {
    expect(migrationSql).toContain("IF NOT EXISTS");
    expect(migrationSql).toContain(
      "SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_sui_address'",
    );
  });

  it("should be synchronized into the consolidated schema_v2.sql", () => {
    expect(schemaSql).toContain("uq_profiles_sui_address");
    expect(schemaSql).toContain("UNIQUE (sui_address)");
  });

  it("should respect PostgreSQL standard NULL semantics (Guardrail 7)", () => {
    // In SQL standard & Postgres, standard UNIQUE constraints treat each NULL as distinct.
    // Thus (user A, NULL) and (user B, NULL) do not conflict, while (user A, 0xABC) and (user B, 0xABC) throw 23505.
    expect(migrationSql).toContain("NULL != NULL");
  });
});
