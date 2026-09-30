// Safe salary range parser and multi-currency converter
// Module: @/features/matching/utils/salary-parser

export interface ParsedSalary {
  min: number | null;
  max: number | null;
  currency: string;
}

/**
 * Standard baseline exchange rates against USD for cross-currency matching.
 * 1 USD = rate * TARGET_CURRENCY
 */
export const BASELINE_USD_RATES: Record<string, number> = {
  USD: 1.0,
  IDR: 16000.0,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.35,
  AUD: 1.5,
  SGD: 1.33,
};

/**
 * Converts salary amounts between supported currencies using reference rates.
 */
export function convertSalary(
  amount: number,
  fromCurrency: string = "USD",
  toCurrency: string = "USD",
): number {
  if (!amount || isNaN(amount)) return 0;
  const from = (fromCurrency || "USD").toUpperCase().trim();
  const to = (toCurrency || "USD").toUpperCase().trim();
  if (from === to) return Math.round(amount);

  const fromRate = BASELINE_USD_RATES[from] ?? 1.0;
  const toRate = BASELINE_USD_RATES[to] ?? 1.0;

  // Convert source amount to USD base, then to target currency
  const inUsd = amount / fromRate;
  return Math.round(inUsd * toRate);
}

/**
 * Parses raw salary strings into structured numeric values.
 * Handles patterns such as:
 * - "$100k - $140k"
 * - "$80,000 - $120,000"
 * - "Rp 15jt - 25jt"
 * - "15.000.000 - 20.000.000 IDR"
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

  const upper = cleanText.toUpperCase();

  // Detect currency symbol or code
  if (cleanText.includes("£") || upper.includes("GBP")) {
    result.currency = "GBP";
  } else if (cleanText.includes("€") || upper.includes("EUR")) {
    result.currency = "EUR";
  } else if (
    upper.includes("IDR") ||
    cleanText.includes("Rp") ||
    cleanText.includes("rp") ||
    upper.includes("RP")
  ) {
    result.currency = "IDR";
  } else if (upper.includes("CAD")) {
    result.currency = "CAD";
  } else if (upper.includes("AUD")) {
    result.currency = "AUD";
  } else if (upper.includes("SGD")) {
    result.currency = "SGD";
  } else {
    result.currency = "USD";
  }

  // Match numbers with optional suffix multipliers:
  // k, rb (thousand), m, mil, jt, juta (million)
  const regex = /(\d+(?:[.,]\d+)*)\s*(k|rb|m|mil|jt|juta)?/gi;
  const matches = Array.from(cleanText.matchAll(regex));

  const numbers: number[] = [];
  for (const match of matches) {
    let rawNum = match[1];

    // Handle dots as thousand separators (e.g. 15.000.000)
    if (/\.\d{3}(?:\.|\s|$|,)/.test(rawNum)) {
      rawNum = rawNum.replace(/\./g, "");
    }
    // Remove comma thousand separators (e.g. 15,000,000)
    rawNum = rawNum.replace(/,/g, "");

    let val = parseFloat(rawNum);
    if (!isNaN(val)) {
      const suffix = (match[2] || "").toLowerCase();
      if (suffix === "k" || suffix === "rb") {
        val *= 1000;
      } else if (
        suffix === "m" ||
        suffix === "mil" ||
        suffix === "jt" ||
        suffix === "juta"
      ) {
        val *= 1000000;
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
