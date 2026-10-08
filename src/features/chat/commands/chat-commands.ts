import type { MemoryCategory } from "@/features/memory/types/memory.types";

export interface ChatCommandDefinition {
  /** Command name without the leading slash. */
  name: string;
  /** One line used by the composer palette. */
  summary: string;
  /** Usage hint shown in the palette and in /help. */
  usage: string;
  /**
   * Only names listed here are treated as commands. Anything else that starts
   * with a slash is passed to the agent as a normal message.
   */
  available: boolean;
}

/**
 * Single source of truth for the command surface. The server allowlist and the
 * composer palette both read from this list, so they cannot drift apart.
 */
export const CHAT_COMMANDS: ChatCommandDefinition[] = [
  {
    name: "remember",
    summary: "Save a durable career fact to memory",
    usage: "/remember [category] <fact>",
    available: true,
  },
  {
    name: "help",
    summary: "List the available commands",
    usage: "/help",
    available: true,
  },
];

export const MEMORY_CATEGORY_VALUES: MemoryCategory[] = [
  "career_goal",
  "role_transition",
  "work_preference",
  "tech_focus",
  "constraint_avoid",
  "user_correction",
];

export function findChatCommand(
  name: string,
): ChatCommandDefinition | undefined {
  const normalized = name.trim().toLowerCase();
  return CHAT_COMMANDS.find(
    (command) => command.available && command.name === normalized,
  );
}

export function listAvailableCommands(): ChatCommandDefinition[] {
  return CHAT_COMMANDS.filter((command) => command.available);
}
