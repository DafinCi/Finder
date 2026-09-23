import { groq, DEFAULT_GROQ_MODEL, parseJsonResponse } from "./client";

export interface ExtractedProfileResult {
  json_profile: {
    candidate: {
      name: string;
      title: string;
      years_of_experience: number;
      summary: string;
      skills: {
        core: string[];
        supporting: string[];
      };
      experience: Array<{
        company: string;
        role: string;
        duration: string;
        achievements: string[];
      }>;
      education: Array<{
        institution: string;
        degree: string;
        year: string;
      }>;
    };
    career: {
      recommended_roles: string[];
      career_level: string;
      strengths: string[];
      weaknesses: string[];
    };
  };
  extracted_skills: string[];
}

export async function extractCandidateProfile(
  rawText: string,
): Promise<ExtractedProfileResult> {
  const systemPrompt = `Kamu adalah Senior Tech Recruiter dan AI Career Coach profesional.
Tugasmu adalah menganalisis teks resume/CV yang diekstrak dan mengubahnya menjadi profil JSON terstruktur dan terstandarisasi.
Kompilasi summary, pengalaman, dan kekuatan kandidat secara profesional dalam Bahasa Indonesia.

Kembalikan jawaban HANYA dalam format JSON valid dengan struktur persis seperti berikut:
{
  "json_profile": {
    "candidate": {
      "name": "Nama lengkap kandidat (atau 'Anonim' jika tidak ada)",
      "title": "Satu title profesional utama",
      "years_of_experience": 3,
      "summary": "Executive summary profesional kandidat dalam Bahasa Indonesia",
      "skills": {
        "core": ["Skill Utama 1", "Skill Utama 2"],
        "supporting": ["Supporting Skill 1", "Supporting Skill 2"]
      },
      "experience": [
        {
          "company": "Nama Perusahaan",
          "role": "Posisi/Jabatan",
          "duration": "2021 - 2024",
          "achievements": ["Pencapaian atau tanggung jawab utama 1"]
        }
      ],
      "education": [
        {
          "institution": "Nama Universitas/Sekolah",
          "degree": "Gelar/Jurusan",
          "year": "2017 - 2021"
        }
      ]
    },
    "career": {
      "recommended_roles": ["Rekomendasi Karir 1", "Rekomendasi Karir 2"],
      "career_level": "Junior / Mid / Senior",
      "strengths": ["Kekuatan kandidat 1", "Kekuatan kandidat 2"],
      "weaknesses": ["Area pengembangan 1"]
    }
  },
  "extracted_skills": ["Daftar", "Semua", "Skill", "Dalam", "Array"]
}`;

  const userPrompt = `Berikut adalah teks hasil ekstraksi dari dokumen CV kandidat:\n\n${rawText}\n\nEkstrak seluruh informasi di atas ke dalam format JSON yang telah ditentukan.`;

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

    const parsed = parseJsonResponse<ExtractedProfileResult>(content);
    return parsed;
  } catch (error) {
    console.error("Groq Profile Extraction Error:", error);
    throw new Error(
      `Gagal mengekstrak profil kandidat dengan model Groq (${DEFAULT_GROQ_MODEL}): ${
        (error as Error).message
      }`,
    );
  }
}
