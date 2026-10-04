import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as resumeSyncPost } from "@/app/api/profile/resume/walrus-sync/route";
import {
  GET as snapshotGet,
  POST as snapshotPost,
} from "@/app/api/profile/snapshot/walrus/route";

const { mockAuthUser } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

describe("Walrus safety boundaries", () => {
  const user = { id: "user-1", user_metadata: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.mockResolvedValue({ data: { user }, error: null });
  });

  it("should refuse to publish the resume to a public network", async () => {
    const res = await resumeSyncPost(
      new NextRequest("http://localhost:3000/api/profile/resume/walrus-sync", {
        method: "POST",
      }),
    );

    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.code).toBe("RESUME_ARCHIVAL_DISABLED");
    expect(json.error).toMatch(/private/i);
  });

  it("should require explicit confirmation before publishing the passport", async () => {
    const res = await snapshotPost(
      new NextRequest("http://localhost:3000/api/profile/snapshot/walrus", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("CONFIRMATION_REQUIRED");
  });

  it("should report that public archival is not configured when no publisher is set", async () => {
    const res = await snapshotPost(
      new NextRequest("http://localhost:3000/api/profile/snapshot/walrus", {
        method: "POST",
        body: JSON.stringify({ confirmPublic: true }),
      }),
    );

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe("WALRUS_NOT_CONFIGURED");
  });

  it("should expose network and write-configured status on GET", async () => {
    const res = await snapshotGet(
      new NextRequest("http://localhost:3000/api/profile/snapshot/walrus"),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(["mainnet", "testnet"]).toContain(json.network);
    expect(typeof json.writeConfigured).toBe("boolean");
  });
});
