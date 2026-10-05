/**
 * Deterministic, dependency-free pre-filter that estimates whether extracted
 * document text looks like a resume. It is intentionally conservative: it only
 * hard-rejects documents with clear non-resume signals and no resume signals.
 * Anything uncertain is passed to the LLM classifier in /api/analyze.
 */

export type ResumeHeuristicVerdict =
  | "likely_resume"
  | "uncertain"
  | "likely_not_resume";

export interface ResumeHeuristicResult {
  score: number; // 0..1, higher = more resume-like
  verdict: ResumeHeuristicVerdict;
  resumeSignals: string[];
  nonResumeSignals: string[];
  textLength: number;
}

interface Signal {
  id: string;
  pattern: RegExp;
  weight: number;
}

const RESUME_SIGNALS: Signal[] = [
  { id: "email", pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/, weight: 1.0 },
  {
    id: "phone",
    pattern:
      /(\+\d[\d\s().-]{7,}\d)|(\b(phone|mobile|tel|telepon|whatsapp)\b[:\s]+[\d+][\d\s().-]{6,}\d)/i,
    weight: 0.8,
  },
  {
    id: "experience",
    pattern:
      /\b(work experience|professional experience|employment history|pengalaman kerja|riwayat pekerjaan)\b/i,
    weight: 1.5,
  },
  {
    id: "education",
    pattern:
      /\b(education|academic background|pendidikan|riwayat pendidikan)\b/i,
    weight: 1.2,
  },
  {
    id: "skills",
    pattern: /\b(skills|technical skills|keahlian|kompetensi)\b/i,
    weight: 1.2,
  },
  {
    id: "summary",
    pattern:
      /\b(professional summary|profile summary|about me|ringkasan profil)\b/i,
    weight: 0.8,
  },
  {
    id: "dateRange",
    pattern:
      /\b(19|20)\d{2}\s*[-\u2013\u2014]\s*((19|20)\d{2}|present|sekarang)\b/i,
    weight: 0.7,
  },
  {
    id: "resumeTitle",
    pattern: /\b(curriculum vitae|resume|\bcv\b)/i,
    weight: 1.0,
  },
  { id: "linkedin", pattern: /linkedin\.com/i, weight: 1.0 },
  { id: "github", pattern: /github\.com/i, weight: 0.8 },
];

const NON_RESUME_SIGNALS: Signal[] = [
  {
    id: "invoice",
    pattern: /\b(invoice|faktur|tagihan|receipt|kwitansi)\b/i,
    weight: 1.5,
  },
  {
    id: "purchaseOrder",
    pattern: /\b(purchase order|surat pesanan|delivery order)\b/i,
    weight: 1.2,
  },
  {
    id: "contract",
    pattern:
      /\b(terms and conditions|syarat dan ketentuan|perjanjian kerja|contract agreement)\b/i,
    weight: 0.8,
  },
  {
    id: "bank",
    pattern:
      /\b(bank statement|rekening koran|account number|nomor rekening|iban|swift code)\b/i,
    weight: 1.5,
  },
  {
    id: "tax",
    pattern: /\b(npwp|tax invoice|ppn|pph|pajak)\b/i,
    weight: 1.0,
  },
  {
    id: "identity",
    pattern:
      /\b(ktp|kartu tanda penduduk|passport number|nomor paspor)\b/i,
    weight: 1.2,
  },
  {
    id: "travel",
    pattern: /\b(boarding pass|booking confirmation)\b/i,
    weight: 1.0,
  },
];

export function scoreResumeHeuristic(rawText: string): ResumeHeuristicResult {
  const text = (rawText || "").trim();
  const textLength = text.length;

  const resumeSignals: string[] = [];
  const nonResumeSignals: string[] = [];
  let resumeScore = 0;
  let nonResumeScore = 0;

  for (const signal of RESUME_SIGNALS) {
    if (signal.pattern.test(text)) {
      resumeSignals.push(signal.id);
      resumeScore += signal.weight;
    }
  }

  for (const signal of NON_RESUME_SIGNALS) {
    if (signal.pattern.test(text)) {
      nonResumeSignals.push(signal.id);
      nonResumeScore += signal.weight;
    }
  }

  // Mostly numeric/symbolic text is very unlikely to be a resume.
  const letters = (text.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
  const letterRatio = textLength > 0 ? letters / textLength : 0;
  if (textLength >= 200 && letterRatio < 0.35) {
    nonResumeSignals.push("lowLetterRatio");
    nonResumeScore += 1.5;
  }

  const total = resumeScore + nonResumeScore;
  const score = total === 0 ? 0 : resumeScore / total;

  let verdict: ResumeHeuristicVerdict;
  if (score >= 0.55) {
    verdict = "likely_resume";
  } else if (nonResumeScore >= 1.5 && resumeScore < 1.0) {
    verdict = "likely_not_resume";
  } else {
    verdict = "uncertain";
  }

  return {
    score: Math.round(score * 1000) / 1000,
    verdict,
    resumeSignals,
    nonResumeSignals,
    textLength,
  };
}
