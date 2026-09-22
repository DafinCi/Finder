import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { error: "Parameter analysisId wajib disertakan di URL" },
        { status: 400 },
      );
    }

    const { data: matches, error } = await supabaseAdmin
      .from("job_matches")
      .select(
        `
        match_score,
        reason,
        missing_skills,
        jobs (
          id,
          title,
          location,
          experience_level,
          requirements,
          companies (
            id,
            name,
            logo_url
          )
        )
      `,
      )
      .eq("analysis_id", analysisId)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("Supabase Query Error:", error);
      throw new Error("Gagal mengambil data dari database");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedData = (matches || []).map((match: any) => ({
      score: match.match_score,
      reason: match.reason,
      missingSkills: match.missing_skills,
      job: {
        id: match.jobs?.id,
        title: match.jobs?.title,
        location: match.jobs?.location,
        level: match.jobs?.experience_level,
        requirements: match.jobs?.requirements,
      },
      company: {
        id: match.jobs?.companies?.id,
        name: match.jobs?.companies?.name,
        logoUrl: match.jobs?.companies?.logo_url,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API GET Matches Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 },
    );
  }
}
