/**
 * A copy-ready script for demonstrating Walrus Memory before and after.
 * Used in the memory inspector and in the hackathon article.
 */
export function buildMemoryDemoScript(): string {
  return `# Finder memory before/after demo

Goal: ask the same question without memory, then with Walrus Memory, and show
what changes. Clean sessions have no chat history, so any personalization you
see in the second run comes from Walrus Memory.

## Before (memory off)
1. Open the agent drawer and turn Amnesia mode on.
2. Start a clean Amnesia session.
3. Ask: "What do you know about my work preferences and salary floor?"
4. The answer should be generic. Under the answer you should see
   "Memory off (Amnesia mode)".
5. Use "Copy conversation evidence" to save this transcript.

## After (memory on)
6. Turn Amnesia mode off.
7. Start a clean session with Walrus Memory active.
8. Ask the exact same question.
9. The answer should reference your stored preferences. Under the answer you
   should see "Used N memories" with the source, for example "Walrus Mainnet".
10. Use "Copy conversation evidence" to save this transcript.

## What to include in the writeup
- Both transcripts, labeled before and after.
- The memory chip: it names the source and lists the memories that shaped the answer.
- One sentence on what changed for the person talking to the bot.

Note: the memory chip only appears when memories were actually recalled, so it
is evidence rather than decoration.`;
}
