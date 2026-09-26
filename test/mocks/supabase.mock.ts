import { vi } from "vitest";

export interface MockUser {
  id: string;
  email: string;
}

export function createMockSupabase(
  initialUser: MockUser | null = {
    id: "user_test_123",
    email: "test@example.com",
  },
) {
  let currentUser = initialUser;

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const client = {
    auth: {
      getUser: vi.fn().mockImplementation(async () => {
        if (!currentUser) {
          return { data: { user: null }, error: new Error("Unauthorized") };
        }
        return { data: { user: currentUser }, error: null };
      }),
    },
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  return {
    client,
    mockQueryBuilder,
    setUser: (u: MockUser | null) => {
      currentUser = u;
    },
  };
}
