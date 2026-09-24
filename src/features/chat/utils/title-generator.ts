/**
 * Smart session title generator.
 * Converts user prompt or CV upload metadata into a clean, concise, 3-6 word title.
 */
export function generateSmartSessionTitle(prompt: string): string {
  if (!prompt || typeof prompt !== "string") {
    return "Konsultasi Karir";
  }

  // 1. Strip markdown code fences, urls, and special characters
  let cleaned = prompt
    .replace(/```[\s\S]*?```/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#*`_~[\](){}<>|\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 2. Strip common conversational filler prefixes (both Indonesian & English)
  const fillerPrefixes = [
    /^(halo|hai|hey|hi|hello)\s*(min|kak|bang|admin|copilot|ai)?[,.!]?\s*/i,
    /^(selamat\s+(pagi|siang|sore|malam))[,.!]?\s*/i,
    /^(tolong|bantu\s+saya|mohon|bisakah\s+anda|bisa\s+bantu|saya\s+mau|saya\s+ingin|mau\s+tanya|tanya\s+dong|tanya)\s*/i,
    /^(can\s+you|could\s+you|please|help\s+me|i\s+want\s+to|i\s+need|i'd\s+like\s+to)\s*/i,
    /^(bagaimana\s+cara|gimana\s+cara|cara\s+untuk|how\s+to)\s*/i,
  ];

  for (const prefix of fillerPrefixes) {
    cleaned = cleaned.replace(prefix, "").trim();
  }

  // If after stripping prefixes there's nothing left, or it was just a greeting
  if (!cleaned || cleaned.length < 3) {
    return "Konsultasi Karir";
  }

  // 3. Take up to the first sentence or question
  const sentenceMatch = cleaned.match(/^([^.?!]+)/);
  if (sentenceMatch) {
    cleaned = sentenceMatch[1].trim();
  }

  // 4. Tokenize and limit to 4-7 words for an elegant title
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 6) {
    cleaned = words.slice(0, 6).join(" ");
  }

  // 5. Hard limit to 45 characters cleanly
  if (cleaned.length > 45) {
    cleaned = cleaned.slice(0, 42).trim() + "...";
  }

  // 6. Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned || "Konsultasi Karir";
}
