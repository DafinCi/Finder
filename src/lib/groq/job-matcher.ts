import { z } from "zod";
import {
  groq,
  parseAndValidateJson,
  executeWithResilience,
  normalizeGroqError,
} from "./client";

export const JobMatchResultItemSchema = z.object({
  job_id: z.string().trim(),
  score: z.coerce.number().min(0).max(100).default(50),
  reason: z
    .string()
    .trim()
    .default(
      "Kecocokan profil dievaluasi berdasarkan keselarasan tech stack dan pengalaman.",
    ),
  missing_skills: z.array(z.string().trim()).default([]),
});

export type JobMatchResultItem = z.infer<typeof JobMatchResultItemSchema>;

export const JobMatchResponseSchema = z.preprocess(
  (val: unknown) => {
    if (Array.isArray(val)) {
      return { matches: val };
    }
    return val;
  },
  z.object({
    matches: z.array(JobMatchResultItemSchema).default([]),
  }),
);

export type JobMatchResponse = z.infer<typeof JobMatchResponseSchema>;

export async function analyzeJobMatches(
  candidateData: unknown,
  jobs: unknown[],
): Promise<JobMatchResultItem[]> {
  const systemPrompt = `Kamu adalah Expert Tech Recruiter dan Compensation & Matching Specialist.
Tugasmu adalah menganalisis kecocokan antara profil kandidat dengan beberapa lowongan pekerjaan yang disediakan.

RUBRIK PENILAIAN SKOR OBJEKTIF (0 - 100):
1. Keahlian Teknis Utama / Core Skills (Bobot 40%): Seberapa cocok bahasa pemrograman, framework, dan tech stack yang dikuasai kandidat dengan syarat mutlak lowongan.
2. Tingkat Pengalaman & Senioritas (Bobot 30%): Seberapa sesuai track record tahun pengalaman kandidat dengan level yang dicari (Junior, Mid, Senior, Lead).
3. Keahlian Pendukung & Relevansi Domain (Bobot 30%): Relevansi tools, database, cloud platform, dan industri kandidat terhadap kebutuhan spesifik tim.

PANDUAN SKOR:
- 85 - 100: Kecocokan luar biasa (kandidat menguasai >80% core stack dan memiliki pengalaman setara).
- 70 - 84: Kecocokan baik (kandidat menguasai sebagian besar core stack dengan potensi adaptasi cepat).
- 50 - 69: Kecocokan moderat (ada overlap dasar tetapi ada kesenjangan skill kunci).
- < 50: Kurang cocok (tech stack primer atau domain pekerjaan berbeda jauh).

KETENTUAN OUTPUT:
- 'job_id' pada output HARUS SAMA PERSIS dengan 'id' pada data lowongan input. Jangan mengubah atau memendekkan ID.
- 'score' berupa angka integer 0 - 100.
- 'reason' wajib dalam Bahasa Indonesia ringkas (maksimal 2 kalimat) yang menjelaskan alasan kecocokan atau kesenjangan utama.
- 'missing_skills' adalah array skill penting dari lowongan yang belum tercantum di profil kandidat.

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

Bandingkan kandidat dengan masing-masing lowongan pekerjaan di atas menggunakan rubrik penilaian objektif, lalu kembalikan array matches dalam format JSON.`;

  try {
    const result = await executeWithResilience("JobMatcher", async (model) => {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Tidak menerima respon teks dari model Groq.");
      }

      const validated = parseAndValidateJson(content, JobMatchResponseSchema);
      return validated.matches;
    });

    return result.data;
  } catch (error) {
    console.error("Groq Job Matching Error:", error);
    const friendlyMessage = normalizeGroqError(error);
    throw new Error(
      `Gagal melakukan kalkulasi kecocokan pekerjaan: ${friendlyMessage}`,
    );
  }
}
