import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/saved
 * Retrieves all saved jobs for the authenticated user, independent of recommendation ranking.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("saved_jobs")
      .select(
        `
        id,
        notes,
        created_at,
        jobs!inner (
          id,
          title,
          description,
          requirements,
          location,
          experience_level,
          is_active,
          apply_url,
          source_url,
          source,
          company_name,
          company_logo,
          salary_range,
          posted_at,
          companies (
            id,
            name,
            logo_url,
            description,
            website
          )
        )
      `,
      )
      .eq("profile_id", user.id)
      .eq("jobs.is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API:Jobs:Saved:GET] Database error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve saved jobs." },
        { status: 500 },
      );
    }

    const savedJobs = (data || []).map((row: any) => {
      const job = row.jobs;
      const rawCompany = Array.isArray(job.companies)
        ? job.companies[0]
        : job.companies;

      return {
        matchId: job.id,
        jobId: job.id,
        matchScore: 0,
        reason: row.notes || "Saved job opportunity",
        missingSkills: [],
        title: job.title,
        description: job.description || "",
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        location: job.location || "Location not specified",
        workMode: job.location?.toLowerCase().includes("remote")
          ? "remote"
          : "unknown",
        experienceLevel: job.experience_level || "Not specified",
        salaryRange: job.salary_range,
        companyName: rawCompany?.name || job.company_name || "Company",
        companyLogo: rawCompany?.logo_url || job.company_logo || null,
        companyWebsite: rawCompany?.website || null,
        applyUrl: job.apply_url || null,
        sourceUrl: job.source_url || null,
        source: job.source || "manual",
        isSaved: true,
        postedAt: job.posted_at || null,
        savedAt: row.created_at,
      };
    });

    return NextResponse.json({ savedJobs }, { status: 200 });
  } catch (error) {
    console.error("[API:Jobs:Saved:GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve saved jobs." },
      { status: 500 },
    );
  }
}
