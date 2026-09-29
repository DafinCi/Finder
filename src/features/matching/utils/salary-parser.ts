// ==============================================================================
// UTILITY: Safe Salary Range Parser
// Module: @/features/matching/utils/salary-parser
// ==============================================================================

export interface ParsedSalary {
  min: number | null;
  max: number | null;
  currency: string;
}

/**
 * Parses raw salary strings into structured numeric values.
 * Handles patterns such as:
 * - "$100k - $140k"
 * - "$80,000 - $120,000"
 * - "USD 90000"
 * - "£50k"
 * Returns null values if unparseable, ensuring unstated salary never triggers false negatives.
 */
export function parseSalaryRange(salaryText?: string | null): ParsedSalary {
  const result: ParsedSalary = {
    min: null,
    max: null,
    currency: "USD",
  };

  if (!salaryText || typeof salaryText !== "string") {
    return result;
  }

  const cleanText = salaryText.trim();
  if (!cleanText) return result;

  // Detect currency symbol
  if (cleanText.includes("£")) result.currency = "GBP";
  else if (cleanText.includes("€")) result.currency = "EUR";
  else if (cleanText.toUpperCase().includes("GBP")) result.currency = "GBP";
  else if (cleanText.toUpperCase().includes("EUR")) result.currency = "EUR";
  else if (cleanText.toUpperCase().includes("IDR")) result.currency = "IDR";
  else result.currency = "USD";

  // Match numbers (e.g. 100k, 120,000, 80000)
  const regex = /(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|rb)?/gi;
  const matches = Array.from(cleanText.matchAll(regex));

  const numbers: number[] = [];
  for (const match of matches) {
    const rawNum = match[1].replace(/,/g, "");
    let val = parseFloat(rawNum);
    if (!isNaN(val)) {
      if (match[2] && match[2].toLowerCase() === "k") {
        val *= 1000;
      } else if (match[2] && match[2].toLowerCase() === "rb") {
        val *= 1000;
      }
      numbers.push(val);
    }
  }

  if (numbers.length === 1) {
    result.min = numbers[0];
    result.max = numbers[0];
  } else if (numbers.length >= 2) {
    result.min = Math.min(...numbers);
    result.max = Math.max(...numbers);
  }

  return result;
}
