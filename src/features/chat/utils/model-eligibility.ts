/**
 * The "Beyond the Big Two" category requires a primary model that is not
 * provided by Anthropic or OpenAI.
 */
export function isBeyondBigTwo(model?: string | null): boolean {
  if (!model) return false;
  return !/^(openai|anthropic)\//i.test(model);
}
