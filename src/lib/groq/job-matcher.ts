import { groq, DEFAULT_GROQ_MODEL, parseJsonResponse } from "./client";

export interface JobMatchResultItem {
  job_id: string;
  score: number;
  reason: string;
  missing_skills: string[];
}

interface JobMatchResponse {
  matches: JobMatchResultItem[];
}

export async function analyzeJobMatches(
  candidateData: unknown,
  jobs: unknown[],
): Promise<JobMatchResultItem[]> {
  const systemPrompt = `Kamu adalah Expert Tech Recruiter.
Tugasmu adalah menganalisis kecocokan antara profil kandidat dengan beberapa lowongan pekerjaan yang disediakan.
Berikan penilaian objektif (skor 0-100). Jangan ragu memberi skor rendah jika skill utamanya tidak cocok.
Pastikan 'job_id' di output sama persis dengan 'job_id' yang diberikan pada input.
Alasan ('reason') HARUS dalam Bahasa Indonesia yang ringkas (maksimal 2 kalimat).

Kembalikan jawaban HANYA dalam format JSON valid dengan struktur:
{
  "matches": [
    {
      "job_id": "string ID lowongan yang sama persis",
      "score": 85,
      "reason": "Alasan detail mengapa kandidat cocok atau kurang cocok.",
      "missing_skills": ["Skill requirement yang tidak dimiliki kandidat"]
    }
  ]
}`;

  const userPrompt = `Berikut adalah data Profil Kandidat:
${JSON.stringify(candidateData, null, 2)}

Berikut adalah daftar Lowongan Pekerjaan yang harus dievaluasi:
${JSON.stringify(jobs, null, 2)}

Bandingkan kandidat dengan masing-masing lowongan pekerjaan di atas, lalu kembalikan array matches dalam format JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Tidak menerima respon teks dari model Groq.");
    }

    const parsed = parseJsonResponse<JobMatchResponse | JobMatchResultItem[]>(
      content,
    );
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray((parsed as JobMatchResponse).matches)) {
      return (parsed as JobMatchResponse).matches;
    }

    return [];
  } catch (error) {
    console.error("Groq Job Matching Error:", error);
    throw new Error(
      `Gagal melakukan kalkulasi kecocokan pekerjaan menggunakan model Groq: ${
        (error as Error).message
      }`,
    );
  }
}
