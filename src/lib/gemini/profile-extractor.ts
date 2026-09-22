import {
  GoogleGenerativeAI,
  SchemaType,
  ResponseSchema,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not defined in environment variables.",
  );
}
const genAI = new GoogleGenerativeAI(apiKey || "");

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
  const schema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      json_profile: {
        type: SchemaType.OBJECT,
        properties: {
          candidate: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description:
                  "Nama lengkap kandidat. Isi 'Anonim' jika nama tidak tertulis.",
              },
              title: {
                type: SchemaType.STRING,
                description: "Satu title profesional utama.",
              },
              years_of_experience: {
                type: SchemaType.INTEGER,
                description: "Total akumulasi tahun pengalaman kerja.",
              },
              summary: {
                type: SchemaType.STRING,
                description:
                  "Executive summary profesional kandidat dalam Bahasa Indonesia.",
              },
              skills: {
                type: SchemaType.OBJECT,
                properties: {
                  core: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                  },
                  supporting: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                  },
                },
                required: ["core", "supporting"],
              },
              experience: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    company: { type: SchemaType.STRING },
                    role: { type: SchemaType.STRING },
                    duration: { type: SchemaType.STRING },
                    achievements: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                    },
                  },
                  required: ["company", "role", "duration", "achievements"],
                },
              },
              education: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    institution: { type: SchemaType.STRING },
                    degree: { type: SchemaType.STRING },
                    year: { type: SchemaType.STRING },
                  },
                  required: ["institution", "degree", "year"],
                },
              },
            },
            required: [
              "name",
              "title",
              "years_of_experience",
              "summary",
              "skills",
              "experience",
              "education",
            ],
          },
          career: {
            type: SchemaType.OBJECT,
            properties: {
              recommended_roles: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              career_level: { type: SchemaType.STRING },
              strengths: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              weaknesses: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: [
              "recommended_roles",
              "career_level",
              "strengths",
              "weaknesses",
            ],
          },
        },
        required: ["candidate", "career"],
      },
      extracted_skills: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
    },
    required: ["json_profile", "extracted_skills"],
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction: `Kamu adalah Senior Tech Recruiter dan AI Career Coach profesional. 
Tugasmu adalah menganalisis teks CV yang diekstrak dan mengubahnya menjadi profil JSON terstruktur dan terstandarisasi.
Kompilasi summary, pengalaman, dan kekuatan kandidat secara profesional dalam Bahasa Indonesia.`,
  });

  const prompt = `Berikut adalah teks hasil ekstraksi dari dokumen CV kandidat:\n\n${rawText}\n\nLakukan analisis sekarang.`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as ExtractedProfileResult;
}
