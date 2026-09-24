import { vi } from "vitest";

export function createMockGroq() {
  const completionsCreate = vi.fn();

  const client = {
    chat: {
      completions: {
        create: completionsCreate,
      },
    },
  };

  return {
    client,
    completionsCreate,
  };
}
