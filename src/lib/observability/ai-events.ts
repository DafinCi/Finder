/**
 * Structured, redacted observability for AI operations.
 *
 * Only emits machine-readable JSON events. Callers must never pass:
 * - API keys / secrets (these are redacted defensively)
 * - memory content / resume text / private user data
 */

export type AiEventType =
  | "chat.request"
  | "chat.tool.start"
  | "chat.tool.end"
  | "chat.complete"
  | "memory.sync";

const SENSITIVE_KEY_PATTERN =
  /(key|token|secret|authorization|password|cookie)/i;

export function obfuscateId(id: string): string {
  if (!id) return "";
  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}…`;
}

export function redactSensitiveValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) return "[REDACTED]";
  return value;
}

export function redactSensitiveFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = redactSensitiveValue(key, value);
  }
  return result;
}

export function emitAiEvent(
  event: AiEventType,
  fields: Record<string, unknown> = {},
): void {
  const record = {
    event,
    ts: new Date().toISOString(),
    ...redactSensitiveFields(fields),
  };
  console.log(`[AI:Event] ${JSON.stringify(record)}`);
}
