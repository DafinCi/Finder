import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil Profil Dasar User
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Ambil Resume Terbaru yang Statusnya 'completed' beserta AI Analysis
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select(
        `
        id, file_name, storage_path, uploaded_at, status,
        resume_analysis (
          id, candidate_data, extracted_skills
        )
      `,
      )
      .eq("profile_id", user.id)
      .eq("status", "completed")
      .order("uploaded_at", { ascending: false })
      .limit(1);

    // Jika user belum pernah mengunggah resume atau analisis belum rampung
    if (resumeError || !resumeData || resumeData.length === 0) {
      return NextResponse.json(
        {
          user_data: {
            name: profile.full_name,
            avatar: profile.avatar_url,
            location: "Belum melengkapi lokasi",
          },
          resume_data: null,
          analysis: null,
        },
        { status: 200 },
      );
    }

    const latestResume = resumeData[0];
    const latestAnalysis = latestResume.resume_analysis?.[0];
    const aiPayload = latestAnalysis?.candidate_data?.json_profile || {};

    // 4. Buat Signed URL Aman untuk file PDF CV (Valid Selama 1 Jam)
    let secureDownloadUrl = "#";
    if (latestResume.storage_path) {
      const { data: signData, error: signError } = await supabase.storage
        .from("resumes")
        .createSignedUrl(latestResume.storage_path, 3600);

      if (!signError && signData) {
        secureDownloadUrl = signData.signedUrl;
      }
    }

    // 5. Normalisasi Struktur Payload untuk Dikonsumsi Frontend secara Mulus
    return NextResponse.json(
      {
        user_data: {
          name: profile.full_name,
          avatar: profile.avatar_url,
          location: aiPayload.candidate?.location || "Indonesia",
        },
        resume_data: {
          id: latestResume.id,
          file_name: latestResume.file_name,
          uploaded_at: latestResume.uploaded_at,
          url: secureDownloadUrl,
        },
        analysis: {
          title: aiPayload.candidate?.title || "Tech Professional",
          years_of_experience: aiPayload.candidate?.years_of_experience || 0,
          summary: aiPayload.candidate?.summary || "",
          skills: {
            core: aiPayload.candidate?.skills?.core || [],
            supporting: aiPayload.candidate?.skills?.supporting || [],
          },
          experience: aiPayload.candidate?.experience || [],
          education: aiPayload.candidate?.education || [],
          // Data metrik & kecocokan tambahan dari AI
          career_level: aiPayload.career?.career_level || "Entry Level",
          strengths: aiPayload.career?.strengths || [],
          weaknesses: aiPayload.career?.weaknesses || [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("System Error on /api/profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
