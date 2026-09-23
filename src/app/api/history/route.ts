import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseAuth = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized! Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { data: resumes, error: dbError } = await supabaseAuth
      .from("resumes")
      .select(
        `
        id,
        file_name,
        status,
        uploaded_at,
        resume_analysis (
          id,
          job_matches (
            match_score,
            jobs (
              title,
              companies (
                name,
                logo_url
              )
            )
          )
        )
      `,
      )
      .eq("profile_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (dbError) {
      console.error("Database Fetch Error:", dbError);
      return NextResponse.json(
        { error: "Gagal mengambil data riwayat resume." },
        { status: 500 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedHistory = (resumes || []).map((resume: any) => {
      let bestMatch = null;

      if (resume.status === "completed" && resume.resume_analysis?.length > 0) {
        const latestAnalysis = resume.resume_analysis[0];

        if (latestAnalysis?.job_matches?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const topMatch = latestAnalysis.job_matches.reduce(
            (prev: any, current: any) =>
              current.match_score > prev.match_score ? current : prev,
          );

          if (topMatch) {
            bestMatch = {
              score: topMatch.match_score,
              jobTitle: topMatch.jobs?.title,
              companyName: topMatch.jobs?.companies?.name,
              companyLogo: topMatch.jobs?.companies?.logo_url,
            };
          }
        }
      }

      return {
        id: resume.id,
        fileName: resume.file_name,
        status: resume.status,
        uploadedAt: resume.uploaded_at,
        bestMatch: bestMatch,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: formattedHistory,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API GET History Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 },
    );
  }
}
