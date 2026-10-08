import type { MemoryCategory } from "@/features/memory/types/memory.types";
import { MEMORY_CATEGORY_VALUES, findChatCommand } from "./chat-commands";

export const MEMORY_COMMAND_PREFIX = "/";
export const MEMORY_CONTENT_MIN_LENGTH = 3;
export const MEMORY_CONTENT_MAX_LENGTH = 500;

export type ParsedChatCommand =
  | {
      kind: "remember";
      content: string;
      category: MemoryCategory;
      categorySource: "explicit" | "inferred";
    }
  | { kind: "help" }
  | {
      kind: "error";
      code: "MISSING_CONTENT" | "CONTENT_TOO_SHORT" | "CONTENT_TOO_LONG";
      message: string;
    };

/**
 * Keyword map used only when the user does not pass a category. Order matters:
 * the first matching group wins, so explicit exclusions beat softer signals.
 */
const CATEGORY_KEYWORDS: Array<{
  category: MemoryCategory;
  keywords: string[];
}> = [
  {
    category: "user_correction",
    keywords: [
      "correction",
      "correct my",
      "i said",
      "previously i",
      "actually i",
      "update my memory",
    ],
  },
  {
    category: "constraint_avoid",
    keywords: [
      "avoid",
      "never",
      "don't want",
      "do not want",
      "not interested",
      "exclude",
      "no longer",
      "will not",
      "salary",
      "compensation",
      "floor",
      "minimum pay",
    ],
  },
  {
    category: "work_preference",
    keywords: [
      "remote",
      "hybrid",
      "on-site",
      "onsite",
      "relocate",
      "relocation",
      "location",
      "commute",
      "timezone",
      "time zone",
      "based in",
      "city",
    ],
  },
  {
    category: "tech_focus",
    keywords: [
      "react",
      "next.js",
      "nextjs",
      "typescript",
      "javascript",
      "python",
      "rust",
      "golang",
      "node",
      "tailwind",
      "vue",
      "angular",
      "sql",
      "docker",
      "kubernetes",
      "graphql",
      "vitest",
      "playwright",
      "testing",
      "design system",
    ],
  },
  {
    category: "role_transition",
    keywords: [
      "transition",
      "switching",
      "switch to",
      "moving into",
      "move into",
      "pivot",
      "changed from",
    ],
  },
  {
    category: "career_goal",
    keywords: [
      "goal",
      "aim",
      "target",
      "want to become",
      "career path",
      "promotion",
    ],
  },
];

export function inferMemoryCategory(content: string): MemoryCategory {
  const normalized = content.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.category;
    }
  }
  return "career_goal";
}

/**
 * Parses a chat message into a command when, and only when, the first token
 * matches a known command. Anything else returns null so the message is handled
 * by the agent as normal text.
 */
export function parseChatCommand(raw: string): ParsedChatCommand | null {
  const text = (raw ?? "").trim();
  if (!text.startsWith(MEMORY_COMMAND_PREFIX)) return null;

  const withoutPrefix = text.slice(MEMORY_COMMAND_PREFIX.length);
  const separatorIndex = withoutPrefix.search(/\s/);
  const name = (
    separatorIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, separatorIndex)
  ).toLowerCase();

  const definition = findChatCommand(name);
  if (!definition) return null;

  const rest =
    separatorIndex === -1 ? "" : withoutPrefix.slice(separatorIndex).trim();

  if (definition.name === "help") {
    return { kind: "help" };
  }

  if (definition.name === "remember") {
    if (!rest) {
      return {
        kind: "error",
        code: "MISSING_CONTENT",
        message: "Add the fact you want me to remember.",
      };
    }

    const [firstWord, ...remainingWords] = rest.split(/\s+/);
    const explicitCategory = MEMORY_CATEGORY_VALUES.includes(
      firstWord.toLowerCase() as MemoryCategory,
    );
    const content = explicitCategory ? remainingWords.join(" ").trim() : rest;

    if (!content) {
      return {
        kind: "error",
        code: "MISSING_CONTENT",
        message: "Add the fact you want me to remember.",
      };
    }
    if (content.length < MEMORY_CONTENT_MIN_LENGTH) {
      return {
        kind: "error",
        code: "CONTENT_TOO_SHORT",
        message: "That is too short to remember. Add a little more detail.",
      };
    }
    if (content.length > MEMORY_CONTENT_MAX_LENGTH) {
      return {
        kind: "error",
        code: "CONTENT_TOO_LONG",
        message: `Keep the fact under ${MEMORY_CONTENT_MAX_LENGTH} characters.`,
      };
    }

    return {
      kind: "remember",
      content,
      category: explicitCategory
        ? (firstWord.toLowerCase() as MemoryCategory)
        : inferMemoryCategory(content),
      categorySource: explicitCategory ? "explicit" : "inferred",
    };
  }

  return null;
}
