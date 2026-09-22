import {
  GoogleGenerativeAI,
  SchemaType,
  ResponseSchema,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface JobMatchResultItem {
  job_id: string;
  score: number;
  reason: string;
  missing_skills: string[];
}

export async function analyzeJobMatches(
  candidateData: unknown,
  jobs: unknown[],
): Promise<JobMatchResultItem[]> {
  const schema: ResponseSchema = {
    type: SchemaType.ARRAY,
    description:
      "Daftar hasil analisis kecocokan untuk setiap pekerjaan yang diberikan.",
    items: {
      type: SchemaType.OBJECT,
      properties: {
        job_id: {
          type: SchemaType.STRING,
          description:
            "ID dari pekerjaan yang dianalisis. Harus sama persis dengan input.",
        },
        score: {
          type: SchemaType.INTEGER,
          description:
            "Skor kecocokan dari 0 hingga 100 berdasarkan skill dan pengalaman.",
        },
        reason: {
          type: SchemaType.STRING,
          description:
            "Alasan detail dalam Bahasa Indonesia (maksimal 2 kalimat) mengapa kandidat cocok atau kurang cocok.",
        },
        missing_skills: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description:
            "Daftar skill spesifik dari requirement job yang TIDAK dimiliki kandidat. Kosongkan jika punya semua.",
        },
      },
      required: ["job_id", "score", "reason", "missing_skills"],
    },
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction: `Kamu adalah Expert Tech Recruiter. 
Tugasmu adalah menganalisis kecocokan antara profil kandidat dengan beberapa lowongan pekerjaan.
Berikan penilaian objektif (skor 0-100). Jangan ragu memberi skor rendah jika skill utamanya tidak cocok. 
Pastikan 'job_id' di output sama persis dengan 'job_id' yang diberikan pada input. Alasan (reason) HARUS dalam Bahasa Indonesia.`,
  });

  const prompt = `
Berikut adalah data Profil Kandidat:
${JSON.stringify(candidateData, null, 2)}

Berikut adalah daftar Lowongan Pekerjaan (Top Jobs) yang harus dievaluasi:
${JSON.stringify(jobs, null, 2)}

Bandingkan kandidat dengan masing-masing lowongan pekerjaan, lalu berikan hasil evaluasinya.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText) as JobMatchResultItem[];
  } catch (error) {
    console.error("Gemini Job Matching Error:", error);
    throw new Error(
      "Gagal melakukan kalkulasi kecocokan pekerjaan menggunakan AI.",
    );
  }
}
