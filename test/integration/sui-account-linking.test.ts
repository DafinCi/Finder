import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { nonceManager } from "@/lib/sui/nonce-manager";
import { buildSiwsMessage } from "@/lib/sui/siws-message";
import { resolveSuiWalletIdentity } from "@/lib/sui/identity-resolver";
import { POST as linkRoute } from "@/app/api/auth/sui/link/route";
import { POST as unlinkRoute } from "@/app/api/auth/sui/unlink/route";
import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey);

describe("Integration: Sui Account Linking & Unlinking (Phase 5)", { timeout: 30000 }, () => {
  const createdUserIds: string[] = [];

  beforeEach(() => {
    nonceManager.clear();
  });

  afterEach(async () => {
    while (createdUserIds.length > 0) {
      const uid = createdUserIds.pop();
      if (uid) {
        try {
          await admin.auth.admin.deleteUser(uid);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  function buildLinkReq(
    body: Record<string, unknown>,
    options: {
      accessToken?: string;
      ip?: string;
      host?: string;
    } = {},
  ) {
    const ip = options.ip || `test-ip-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "host": options.host || "localhost:3000",
      "x-forwarded-for": ip,
    };
    if (options.accessToken) {
      headers["Authorization"] = `Bearer ${options.accessToken}`;
    }
    return new NextRequest("http://localhost:3000/api/auth/sui/link", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  function buildUnlinkReq(
    options: {
      accessToken?: string;
      ip?: string;
    } = {},
  ) {
    const ip = options.ip || `test-ip-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const headers: Record<string, string> = {
      "x-forwarded-for": ip,
    };
    if (options.accessToken) {
      headers["Authorization"] = `Bearer ${options.accessToken}`;
    }
    return new NextRequest("http://localhost:3000/api/auth/sui/unlink", {
      method: "POST",
      headers,
    });
  }

  // Helper to create an authenticated email user and get their session access token
  async function createAuthenticatedEmailUser(prefix = "link_user") {
    const email = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
    const password = "SecurePassword123!";

    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Test User" },
    });

    if (createError || !createData.user) {
      throw new Error(`Failed to create test user: ${createError?.message}`);
    }

    createdUserIds.push(createData.user.id);

    // Sign in using anon client to get legitimate access_token
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      throw new Error(`Failed to sign in test user: ${signInError?.message}`);
    }

    return {
      userId: createData.user.id,
      email,
      accessToken: signInData.session.access_token,
      client: userClient,
    };
  }

  // Helper to generate a valid SIWS_LINK payload signed by a given keypair
  async function createSignedLinkPayload(
    keypair: Ed25519Keypair,
    options: {
      domain?: string;
      network?: "testnet" | "mainnet" | "devnet" | "localnet";
      purpose?: "SIWS_LINK" | "SIWS_LOGIN";
      customAddress?: string;
    } = {},
  ) {
    const purpose = options.purpose || "SIWS_LINK";
    const network = options.network || "testnet";
    const domain = options.domain || "localhost:3000";

    const { nonce } = nonceManager.generateNonce(purpose, network);
    const address = options.customAddress || keypair.toSuiAddress();

    const messageText = buildSiwsMessage({
      domain,
      address,
      uri: `http://${domain}/settings`,
      nonce,
      purpose,
      network,
    });

    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(messageText));

    return {
      message: messageText,
      signature,
      nonce,
      address,
    };
  }

  // 1. Unauthenticated Link Attempt
  it("should reject unauthenticated wallet link attempt with 401 UNAUTHENTICATED", async () => {
    const keypair = new Ed25519Keypair();
    const payload = await createSignedLinkPayload(keypair);

    const req = buildLinkReq({ message: payload.message, signature: payload.signature });

    const res = await linkRoute(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.code).toBe("UNAUTHENTICATED");
  });

  // 2. Invalid SIWS Signature
  it("should reject invalid SIWS signature with 400 INVALID_SIWS", async () => {
    const user = await createAuthenticatedEmailUser("sig_fail");
    const keypair = new Ed25519Keypair();
    const payload = await createSignedLinkPayload(keypair);

    const req = buildLinkReq(
      {
        message: payload.message,
        signature: "invalid_corrupted_signature_payload",
      },
      { accessToken: user.accessToken },
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("INVALID_SIWS");
  });

  // 3. Wrong Signer Address (Message claims address A, but signed by keypair B)
  it("should reject wrong signer address with 400 ADDRESS_MISMATCH", async () => {
    const user = await createAuthenticatedEmailUser("addr_mismatch");
    const keypairActual = new Ed25519Keypair();
    const keypairClaimed = new Ed25519Keypair();

    const payload = await createSignedLinkPayload(keypairActual, {
      customAddress: keypairClaimed.toSuiAddress(), // Message says B, signature will recover A
    });

    const req = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken },
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("ADDRESS_MISMATCH");
  });

  // 4. Wrong Purpose Nonce (nonce was generated for SIWS_LOGIN instead of SIWS_LINK)
  it("should reject nonce issued for SIWS_LOGIN with 400 PURPOSE_MISMATCH", async () => {
    const user = await createAuthenticatedEmailUser("purpose_fail");
    const keypair = new Ed25519Keypair();
    const payload = await createSignedLinkPayload(keypair, {
      purpose: "SIWS_LOGIN", // Issue login nonce
    });

    const req = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken },
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("PURPOSE_MISMATCH");
  });

  // 5. Expired Nonce
  it("should reject expired nonce with 400 INVALID_NONCE", async () => {
    const user = await createAuthenticatedEmailUser("expired_nonce");
    const keypair = new Ed25519Keypair();

    // Generate nonce and artificially backdate its creation and expiration
    const record = nonceManager.generateNonce("SIWS_LINK", "testnet");
    (record as any).expiresAt = Date.now() - 1000; // expired 1s ago

    const messageText = buildSiwsMessage({
      domain: "localhost:3000",
      address: keypair.toSuiAddress(),
      uri: "http://localhost:3000/settings",
      nonce: record.nonce,
      purpose: "SIWS_LINK",
      network: "testnet",
    });

    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(messageText));

    const req = buildLinkReq(
      { message: messageText, signature },
      { accessToken: user.accessToken },
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("INVALID_NONCE");
  });

  // 6. Replayed Nonce
  it("should reject replayed nonce on second link attempt with 400 INVALID_NONCE", async () => {
    const user1 = await createAuthenticatedEmailUser("replay_1");
    const user2 = await createAuthenticatedEmailUser("replay_2");
    const keypair = new Ed25519Keypair();

    const payload = await createSignedLinkPayload(keypair);

    // First attempt succeeds for User 1
    const req1 = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user1.accessToken },
    );

    const res1 = await linkRoute(req1);
    expect(res1.status).toBe(200);

    // Second attempt with exact same payload/nonce must fail
    const req2 = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user2.accessToken },
    );

    const res2 = await linkRoute(req2);
    expect(res2.status).toBe(400);
    const data2 = await res2.json();
    expect(data2.code).toBe("INVALID_NONCE");
  });

  // 7. Wrong Network
  it("should reject wrong network with 400 NETWORK_MISMATCH", async () => {
    const user = await createAuthenticatedEmailUser("net_mismatch");
    const keypair = new Ed25519Keypair();

    const payload = await createSignedLinkPayload(keypair, {
      network: "mainnet", // Server is configured for testnet
    });

    const req = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken },
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("NETWORK_MISMATCH");
  });

  // 8. Wrong Domain
  it("should reject wrong domain with 400 INVALID_SIWS", async () => {
    const user = await createAuthenticatedEmailUser("domain_mismatch");
    const keypair = new Ed25519Keypair();

    const payload = await createSignedLinkPayload(keypair, {
      domain: "malicious-phishing.com",
    });

    const req = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken, host: "localhost:3000" }, // Mismatch with malicious-phishing.com
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("INVALID_SIWS");
  });

  // 9. Wallet Already Linked to Another Account
  it("should reject linking a wallet that already belongs to another user with 409 WALLET_ALREADY_LINKED", async () => {
    const userX = await createAuthenticatedEmailUser("owner_x");
    const userY = await createAuthenticatedEmailUser("owner_y");
    const keypairA = new Ed25519Keypair();

    // 1. User X links Wallet A
    const payloadX = await createSignedLinkPayload(keypairA);
    const reqX = buildLinkReq(
      { message: payloadX.message, signature: payloadX.signature },
      { accessToken: userX.accessToken },
    );
    const resX = await linkRoute(reqX);
    expect(resX.status).toBe(200);

    // 2. User Y attempts to link Wallet A (with a fresh valid nonce and valid signature)
    const payloadY = await createSignedLinkPayload(keypairA);
    const reqY = buildLinkReq(
      { message: payloadY.message, signature: payloadY.signature },
      { accessToken: userY.accessToken },
    );

    const resY = await linkRoute(reqY);
    expect(resY.status).toBe(409);
    const dataY = await resY.json();
    expect(dataY.code).toBe("WALLET_ALREADY_LINKED");

    // Verify User X still owns Wallet A
    const { data: profileX } = await admin
      .from("profiles")
      .select("sui_address")
      .eq("id", userX.userId)
      .single();
    expect(profileX?.sui_address).toBe(normalizeSuiAddress(keypairA.toSuiAddress()));
  });

  // 10. Concurrent Wallet-Link Race Condition
  it("should handle concurrent link attempts on the same wallet: exactly one 200, exactly one 409", async () => {
    const user1 = await createAuthenticatedEmailUser("race_1");
    const user2 = await createAuthenticatedEmailUser("race_2");
    const keypair = new Ed25519Keypair();

    // Both users obtain fresh, valid SIWS_LINK nonces for the same keypair
    const payload1 = await createSignedLinkPayload(keypair);
    const payload2 = await createSignedLinkPayload(keypair);

    const req1 = buildLinkReq(
      { message: payload1.message, signature: payload1.signature },
      { accessToken: user1.accessToken },
    );

    const req2 = buildLinkReq(
      { message: payload2.message, signature: payload2.signature },
      { accessToken: user2.accessToken },
    );

    // Execute concurrently
    const [res1, res2] = await Promise.all([linkRoute(req1), linkRoute(req2)]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winnerRes = res1.status === 200 ? res1 : res2;
    const loserRes = res1.status === 409 ? res1 : res2;

    const winnerData = await winnerRes.json();
    const loserData = await loserRes.json();

    expect(winnerData.success).toBe(true);
    expect(loserData.code).toBe("WALLET_ALREADY_LINKED");

    // Assert that the database holds exactly one association and no profile was overwritten
    const { data: binding } = await admin
      .from("profiles")
      .select("id")
      .eq("sui_address", normalizeSuiAddress(keypair.toSuiAddress()))
      .single();

    expect([user1.userId, user2.userId]).toContain(binding?.id);
  });

  // 11. Sui-only user attempting to link Wallet B when Wallet A is already linked
  it("should reject linking Wallet B when user already has Wallet A linked (no silent replacement)", async () => {
    // 1. Provision Sui-only user via identity resolver
    const keypairA = new Ed25519Keypair();
    const suiAddressA = keypairA.toSuiAddress();
    const resolved = await resolveSuiWalletIdentity(suiAddressA);
    createdUserIds.push(resolved.userId);

    // Sign in the synthetic user via admin magic link to get access token
    const linkRes = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: resolved.email,
    });
    const { hashed_token, verification_type } = (linkRes.data?.properties ?? {}) as any;

    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data: otpData } = await ssrClient.auth.verifyOtp({
      token_hash: hashed_token,
      type: verification_type,
    });
    const accessToken = otpData.session!.access_token;

    // 2. User attempts to link Wallet B
    const keypairB = new Ed25519Keypair();
    const payloadB = await createSignedLinkPayload(keypairB);

    const req = buildLinkReq(
      { message: payloadB.message, signature: payloadB.signature },
      { accessToken },
    );

    const res = await linkRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("WALLET_ALREADY_LINKED");

    // 3. Confirm Wallet A remains linked and was not silently replaced
    const { data: profile } = await admin
      .from("profiles")
      .select("sui_address")
      .eq("id", resolved.userId)
      .single();
    expect(profile?.sui_address).toBe(normalizeSuiAddress(suiAddressA));
  });

  // 12. Sui-Only Unlink Rejection
  it("should reject unlink for Sui-only user with 400 NO_ALTERNATIVE_AUTH_METHOD", async () => {
    const keypair = new Ed25519Keypair();
    const resolved = await resolveSuiWalletIdentity(keypair.toSuiAddress());
    createdUserIds.push(resolved.userId);

    const linkRes = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: resolved.email,
    });
    const { hashed_token, verification_type } = (linkRes.data?.properties ?? {}) as any;

    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data: otpData } = await ssrClient.auth.verifyOtp({
      token_hash: hashed_token,
      type: verification_type,
    });
    const accessToken = otpData.session!.access_token;

    const unlinkReq = buildUnlinkReq({ accessToken });

    const res = await unlinkRoute(unlinkReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("NO_ALTERNATIVE_AUTH_METHOD");

    // Verify wallet is still linked
    const { data: profile } = await admin
      .from("profiles")
      .select("sui_address")
      .eq("id", resolved.userId)
      .single();
    expect(profile?.sui_address).toBe(normalizeSuiAddress(keypair.toSuiAddress()));
  });

  // 13. Email + Sui Unlink Success
  it("should allow unlink for Email + Sui user and set sui_address to NULL", async () => {
    const user = await createAuthenticatedEmailUser("email_unlink");
    const keypair = new Ed25519Keypair();

    // 1. Link wallet
    const payload = await createSignedLinkPayload(keypair);
    const linkReq = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken },
    );
    const linkRes = await linkRoute(linkReq);
    expect(linkRes.status).toBe(200);

    // 2. Unlink wallet
    const unlinkReq = buildUnlinkReq({ accessToken: user.accessToken });

    const unlinkRes = await unlinkRoute(unlinkReq);
    expect(unlinkRes.status).toBe(200);
    const unlinkData = await unlinkRes.json();
    expect(unlinkData.success).toBe(true);

    // 3. Verify database state: sui_address is NULL
    const { data: profile } = await admin
      .from("profiles")
      .select("sui_address")
      .eq("id", user.userId)
      .single();
    expect(profile?.sui_address).toBeNull();
  });

  // 14. Unlink does NOT delete auth.users
  it("should NOT delete the user record from auth.users upon unlinking", async () => {
    const user = await createAuthenticatedEmailUser("preserve_user");
    const keypair = new Ed25519Keypair();

    // Link & Unlink
    const payload = await createSignedLinkPayload(keypair);
    const linkReq = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken },
    );
    const linkRes = await linkRoute(linkReq);
    expect(linkRes.status).toBe(200);

    const unlinkReq = buildUnlinkReq({ accessToken: user.accessToken });
    const unlinkRes = await unlinkRoute(unlinkReq);
    expect(unlinkRes.status).toBe(200);

    // Assert user still exists in auth.users
    const { data: checkUser, error: checkError } = await admin.auth.admin.getUserById(user.userId);
    expect(checkError).toBeNull();
    expect(checkUser?.user?.id).toBe(user.userId);
    expect(checkUser?.user?.email).toBe(user.email);
  });

  // 15. Old Wallet Can be Linked After Successful Unlink
  it("should allow another user to link the old wallet after it was unlinked", async () => {
    const userA = await createAuthenticatedEmailUser("unlinker_a");
    const userB = await createAuthenticatedEmailUser("linker_b");
    const keypair = new Ed25519Keypair();

    // 1. User A links wallet
    const payloadA = await createSignedLinkPayload(keypair);
    const linkReqA = buildLinkReq(
      { message: payloadA.message, signature: payloadA.signature },
      { accessToken: userA.accessToken },
    );
    const linkResA = await linkRoute(linkReqA);
    expect(linkResA.status).toBe(200);

    // 2. User A unlinks wallet
    const unlinkReqA = buildUnlinkReq({ accessToken: userA.accessToken });
    const unlinkResA = await unlinkRoute(unlinkReqA);
    expect(unlinkResA.status).toBe(200);

    // 3. User B links the exact same wallet
    const payloadB = await createSignedLinkPayload(keypair);
    const linkReqB = buildLinkReq(
      { message: payloadB.message, signature: payloadB.signature },
      { accessToken: userB.accessToken },
    );
    const linkResB = await linkRoute(linkReqB);
    expect(linkResB.status).toBe(200);

    // 4. Verify in database: User B now holds the wallet
    const { data: profileB } = await admin
      .from("profiles")
      .select("sui_address")
      .eq("id", userB.userId)
      .single();
    expect(profileB?.sui_address).toBe(normalizeSuiAddress(keypair.toSuiAddress()));
  });

  // 16. Link Identity Continuity
  it("should maintain identity continuity: Email user X links Wallet A -> SIWS login resolves to X", async () => {
    const user = await createAuthenticatedEmailUser("identity_cont");
    const keypair = new Ed25519Keypair();

    // 1. Link Wallet A to Email User X
    const payload = await createSignedLinkPayload(keypair);
    const linkReq = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: user.accessToken },
    );
    const linkRes = await linkRoute(linkReq);
    expect(linkRes.status).toBe(200);

    // 2. SIWS login with Wallet A: must resolve to canonical User X
    const resolution = await resolveSuiWalletIdentity(keypair.toSuiAddress());
    expect(resolution.isNewUser).toBe(false);
    expect(resolution.userId).toBe(user.userId);
    expect(resolution.email).toBe(user.email);
  });

  // 17. RLS Remains Correct After Linking and Unlinking
  it("should preserve RLS boundary: user can only access own profile before, during, and after link", async () => {
    const userA = await createAuthenticatedEmailUser("rls_a");
    const userB = await createAuthenticatedEmailUser("rls_b");
    const keypair = new Ed25519Keypair();

    // Client for User A
    const clientA = createServerClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${userA.accessToken}` } },
      cookies: { getAll: () => [], setAll: () => {} },
    });

    // 1. Initial RLS check
    const { data: ownInit } = await clientA.from("profiles").select("*").eq("id", userA.userId).single();
    expect(ownInit?.id).toBe(userA.userId);

    const { data: otherInit } = await clientA.from("profiles").select("*").eq("id", userB.userId).maybeSingle();
    expect(otherInit).toBeNull(); // Denied by RLS

    // 2. User A links wallet
    const payload = await createSignedLinkPayload(keypair);
    const linkReq = buildLinkReq(
      { message: payload.message, signature: payload.signature },
      { accessToken: userA.accessToken },
    );
    const linkRes = await linkRoute(linkReq);
    expect(linkRes.status).toBe(200);

    // 3. Post-link RLS check: User A sees updated sui_address on own profile, still cannot see User B
    const { data: ownLinked } = await clientA.from("profiles").select("*").eq("id", userA.userId).single();
    expect(ownLinked?.sui_address).toBe(normalizeSuiAddress(keypair.toSuiAddress()));

    const { data: otherLinked } = await clientA.from("profiles").select("*").eq("id", userB.userId).maybeSingle();
    expect(otherLinked).toBeNull();

    // 4. User A unlinks wallet
    const unlinkReq = buildUnlinkReq({ accessToken: userA.accessToken });
    const unlinkRes = await unlinkRoute(unlinkReq);
    expect(unlinkRes.status).toBe(200);

    // 5. Post-unlink RLS check: User A sees null sui_address, still cannot see User B
    const { data: ownUnlinked } = await clientA.from("profiles").select("*").eq("id", userA.userId).single();
    expect(ownUnlinked?.sui_address).toBeNull();

    const { data: otherUnlinked } = await clientA.from("profiles").select("*").eq("id", userB.userId).maybeSingle();
    expect(otherUnlinked).toBeNull();
  });
});
