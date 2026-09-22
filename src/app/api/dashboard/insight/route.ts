import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: latestAnalysis, error: analysisError } = await supabase
      .from("resume_analysis")
      .select(
        `
        id,
        candidate_data,
        extracted_skills,
        ai_insight,
        job_matches (
          match_score,
          missing_skills
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) {
      console.error("Error fetching analysis for insight:", analysisError);
      throw analysisError;
    }

    if (!latestAnalysis) {
      return NextResponse.json(
        {
          insightText:
            "Selamat datang di Finder! Silakan unggah resume Anda terlebih dahulu agar AI kami dapat menganalisis kesiapan karier dan memberikan saran yang dipersonalisasi.",
          quickActions: [
            {
              id: "upload_resume",
              label: "Upload Resume Pertama Anda",
              type: "action",
              priority: "high",
              path: "/resume",
            },
          ],
        },
        { status: 200 },
      );
    }

    if (latestAnalysis.ai_insight && !forceRefresh) {
      return NextResponse.json(latestAnalysis.ai_insight, { status: 200 });
    }

    const missingSkillsMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    latestAnalysis.job_matches?.forEach((m: any) => {
      m.missing_skills?.forEach((skill: string) => {
        missingSkillsMap[skill] = (missingSkillsMap[skill] || 0) + 1;
      });
    });

    const sortedMissing = Object.entries(missingSkillsMap)
      .sort((a, b) => b[1] - a[1])
      .map(([skill]) => skill);

    const primaryMissingSkill = sortedMissing[0] || null;

    let insightText = `Berdasarkan analisis profil Anda sebagai ${latestAnalysis.candidate_data?.title || "Tech Professional"}, Anda memiliki fondasi yang kuat. Melengkapi beberapa keahlian tambahan akan membuat portofolio Anda semakin menonjol di pasar kerja saat ini.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });

        const prompt = `
# ROLE
You are a Senior Career Advisor and Technical Recruiter with extensive experience evaluating professional resumes and guiding career development.
You work for Finder, an AI Career Intelligence Platform.

# RESPONSIBILITIES
Generate a short executive insight that helps the candidate understand:
1. Their current career position.
2. Their strongest professional advantage.
3. The highest-impact opportunity for career improvement.
4. The next practical step to become more competitive.

# CANDIDATE DATA
Target Role: ${latestAnalysis.candidate_data?.title || "Professional"}
Current Skills: ${latestAnalysis.extracted_skills?.slice(0, 7).join(", ") || "Not specified"}
Most Important Missing Skills: ${sortedMissing.slice(0, 2).join(", ") || "None"}

# RULES
1. Respond ONLY in Bahasa Indonesia.
2. Return EXACTLY one paragraph.
3. Maximum 4 sentences.
4. Professional, supportive, and actionable.
5. No markdown, no bullet points, no greetings.
`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "openai/gpt-oss-20b",
          temperature: 0.3,
          max_tokens: 1000,
        });

        let generatedText =
          chatCompletion.choices[0]?.message?.content?.trim() || "";

        if (generatedText.includes("<think>")) {
          generatedText = generatedText
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .trim();
        }

        if (generatedText) {
          insightText = generatedText;
        }
      } catch (groqError) {
        console.error("Groq Advisor Fallback Triggered:", groqError);
        if (primaryMissingSkill) {
          insightText = `Anda memiliki kecocokan yang sangat baik untuk peran ${latestAnalysis.candidate_data?.title || "Tech Professional"}. Fokus mempelajari keahlian ${primaryMissingSkill} akan menjadi langkah paling strategis untuk mendongkrak skor kecocokan Anda di berbagai lowongan kerja aktif kami.`;
        }
      }
    }

    const quickActions = [];

    if (primaryMissingSkill) {
      quickActions.push({
        id: "learn_skill",
        label: `Cari Kursus ${primaryMissingSkill}`,
        type: "action",
        priority: "high",
        path: `/jobs?search=${encodeURIComponent(primaryMissingSkill)}`,
      });
    }

    quickActions.push({
      id: "browse_jobs",
      label: "Lihat Rekomendasi Pekerjaan",
      type: "navigation",
      priority: "medium",
      path: "/jobs",
    });

    quickActions.push({
      id: "reupload_resume",
      label: "Perbarui Resume",
      type: "action",
      priority: "low",
      path: "/resume",
    });

    const responsePayload = {
      insightText,
      quickActions,
    };

    await supabase
      .from("resume_analysis")
      .update({ ai_insight: responsePayload })
      .eq("id", latestAnalysis.id);

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("API GET Dashboard Insight Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat rekomendasi insight AI" },
      { status: 500 },
    );
  }
}
