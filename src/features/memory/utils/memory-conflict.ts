/**
 * Conservative, deterministic conflict detection between a stored memory and
 * the candidate's current canonical profile preferences.
 *
 * Scope: work mode (remote / onsite / hybrid), the highest-signal case. Other
 * dimensions deliberately stay out until they can be modeled reliably.
 */

export type WorkModeSignal = "remote" | "hybrid" | "onsite";

const MODE_PATTERNS: Record<WorkModeSignal, RegExp> = {
  remote: /\b(remote|work from home|wfh|fully remote|100% remote)\b/gi,
  onsite: /\b(on-?site|wfo|work from office|in-?office)\b/gi,
  hybrid: /\b(hybrid|partially remote)\b/gi,
};

const NEGATION_PATTERN =
  /\b(no|not|never|avoid|avoids|avoiding|refuse|refuses|refused|without|reject|rejects|rejected|exclude|excludes|excluded|don'?t|doesn'?t|won'?t|will not|do not|tidak|jangan|tanpa|menolak)\b/i;

const CLAUSE_BOUNDARY_PATTERN = /[.,;!?]|\b(but|and|or|yet)\b/gi;

/**
 * Returns the clause text immediately before a match so negation only applies
 * within the same clause ("no onsite, remote only" keeps remote preferred).
 */
function clauseBefore(text: string, index: number): string {
  const before = text.slice(0, index);
  const boundary = new RegExp(CLAUSE_BOUNDARY_PATTERN.source, "gi");
  let lastBoundary = 0;
  let match: RegExpExecArray | null;

  while ((match = boundary.exec(before)) !== null) {
    lastBoundary = match.index + match[0].length;
  }

  return before.slice(lastBoundary);
}

export function extractWorkModeSignals(text: string): {
  preferred: WorkModeSignal[];
  excluded: WorkModeSignal[];
} {
  const preferred = new Set<WorkModeSignal>();
  const excluded = new Set<WorkModeSignal>();
  const source = text || "";

  for (const mode of ["remote", "onsite", "hybrid"] as WorkModeSignal[]) {
    const pattern = new RegExp(MODE_PATTERNS[mode].source, "gi");
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(source)) !== null) {
      const context = clauseBefore(source, match.index);

      if (NEGATION_PATTERN.test(context)) {
        excluded.add(mode);
      } else {
        preferred.add(mode);
      }
    }
  }

  return {
    preferred: Array.from(preferred),
    excluded: Array.from(excluded),
  };
}

/**
 * Returns true when the memory contradicts the canonical work modes:
 * it prefers a mode the profile does not include, or it excludes a mode the
 * profile does include.
 */
export function detectMemoryWorkModeConflict(
  content: string,
  canonicalWorkModes: string[] | null | undefined,
): boolean {
  if (!canonicalWorkModes || canonicalWorkModes.length === 0) return false;

  const canonical = new Set(
    canonicalWorkModes.map((mode) => mode.toLowerCase()),
  );
  const { preferred, excluded } = extractWorkModeSignals(content);

  const prefersUnsupported = preferred.some((mode) => !canonical.has(mode));
  const excludesSupported = excluded.some((mode) => canonical.has(mode));

  return prefersUnsupported || excludesSupported;
}
