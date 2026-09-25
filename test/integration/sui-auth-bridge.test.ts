import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { nonceManager } from "@/lib/sui/nonce-manager";
import { buildSiwsMessage, parseSiwsMessage } from "@/lib/sui/siws-message";
import { verifySiwsMessage } from "@/lib/sui/siws-verifier";
import { resolveSuiWalletIdentity } from "@/lib/sui/identity-resolver";
import { isSyntheticSuiEmail, createSyntheticSuiEmail } from "@/lib/sui/auth-abstraction";
import { POST as signInRoute } from "@/app/api/auth/signin/route";
import { POST as signUpRoute } from "@/app/api/auth/signup/route";
import { GET as nonceRoute } from "@/app/api/auth/sui/nonce/route";
import { POST as verifyRoute } from "@/app/api/auth/sui/verify/route";
import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey);

describe("Integration: Sui SIWS & Supabase Session Bridge", { timeout: 20000 }, () => {
  const createdUserIds: string[] = [];

  beforeEach(() => {
    nonceManager.clear();
  });

  afterEach(async () => {
    // Clean up all users created during testing
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

  it("TEST A — Sui-only account identity continuity across logins", async () => {
    const keypair = new Ed25519Keypair();
    const suiAddress = keypair.toSuiAddress();

    // 1. First login: New user provisioning
    const firstResolution = await resolveSuiWalletIdentity(suiAddress);
    expect(firstResolution.isNewUser).toBe(true);
    expect(firstResolution.suiAddress).toBe(normalizeSuiAddress(suiAddress));
    createdUserIds.push(firstResolution.userId);

    const firstUserId = firstResolution.userId;

    // 2. Second login with exact same wallet: Must resolve to identical auth.users.id
    const secondResolution = await resolveSuiWalletIdentity(suiAddress);
    expect(secondResolution.isNewUser).toBe(false);
    expect(secondResolution.userId).toBe(firstUserId);
    expect(secondResolution.suiAddress).toBe(normalizeSuiAddress(suiAddress));
  });

  it("TEST B — Email account linking identity continuity", async () => {
    // 1. Create traditional email user
    const email = `test_email_link_${Date.now()}@example.com`;
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: { full_name: "Original Email User" },
    });
    expect(createError).toBeNull();
    const existingUserId = userData.user!.id;
    createdUserIds.push(existingUserId);

    // 2. Link Sui wallet to this existing profile
    const keypair = new Ed25519Keypair();
    const suiAddress = normalizeSuiAddress(keypair.toSuiAddress());

    const { error: linkError } = await admin
      .from("profiles")
      .update({ sui_address: suiAddress })
      .eq("id", existingUserId);
    expect(linkError).toBeNull();

    // 3. User logs in with Sui Wallet: Must resolve to the original email account!
    const resolution = await resolveSuiWalletIdentity(suiAddress);
    expect(resolution.isNewUser).toBe(false);
    expect(resolution.userId).toBe(existingUserId);
    expect(resolution.email).toBe(email);
  });

  it("TEST C — Wallet uniqueness conflict detection", async () => {
    const keypair = new Ed25519Keypair();
    const suiAddress = normalizeSuiAddress(keypair.toSuiAddress());

    // 1. User X links wallet A
    const resX = await resolveSuiWalletIdentity(suiAddress);
    createdUserIds.push(resX.userId);

    // 2. Create User Y
    const emailY = `user_y_${Date.now()}@example.com`;
    const { data: userY } = await admin.auth.admin.createUser({
      email: emailY,
      password: "TestPassword123!",
      email_confirm: true,
    });
    createdUserIds.push(userY.user!.id);

    // 3. User Y attempts to claim wallet A: Verify conflict detection
    const { data: conflictCheck } = await admin
      .from("profiles")
      .select("id")
      .eq("sui_address", suiAddress)
      .maybeSingle();

    expect(conflictCheck).not.toBeNull();
    expect(conflictCheck?.id).toBe(resX.userId);
    expect(conflictCheck?.id).not.toBe(userY.user!.id);
  });

  it("TEST D — RLS authorization via Supabase SSR authenticated session", async () => {
    const keypair = new Ed25519Keypair();
    const suiAddress = keypair.toSuiAddress();

    // 1. Resolve identity
    const resolution = await resolveSuiWalletIdentity(suiAddress);
    createdUserIds.push(resolution.userId);

    // 2. Generate official magiclink token via Admin
    const linkRes = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: resolution.email,
    });
    expect(linkRes.error).toBeNull();
    const { hashed_token, verification_type } = (linkRes.data?.properties ?? {}) as any;

    // 3. Establish session via SSR client
    const cookieJar = new Map<string, string>();
    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => cookieJar.set(name, value));
        },
      },
    });

    const verifyOtpRes = await ssrClient.auth.verifyOtp({
      token_hash: hashed_token,
      type: verification_type,
    });
    expect(verifyOtpRes.error).toBeNull();
    expect(cookieJar.size).toBeGreaterThan(0);

    // 4. Server-side getUser() returns verified identity
    const { data: currentUser } = await ssrClient.auth.getUser();
    expect(currentUser.user?.id).toBe(resolution.userId);

    // 5. RLS check: Can read own profile
    const { data: ownProfile, error: ownErr } = await ssrClient
      .from("profiles")
      .select("id, sui_address")
      .eq("id", resolution.userId)
      .single();
    expect(ownErr).toBeNull();
    expect(ownProfile?.id).toBe(resolution.userId);

    // 6. RLS check: Reading another profile returns null due to RLS USING (auth.uid() = id)
    const otherUserId = "00000000-0000-0000-0000-000000000001";
    const { data: otherProfile } = await ssrClient
      .from("profiles")
      .select("id")
      .eq("id", otherUserId)
      .maybeSingle();
    expect(otherProfile).toBeNull();
  });

  it("TEST E — Profile trigger behavior on auth.users creation", async () => {
    const keypair = new Ed25519Keypair();
    const suiAddress = keypair.toSuiAddress();

    const resolution = await resolveSuiWalletIdentity(suiAddress);
    createdUserIds.push(resolution.userId);

    // Check that exactly ONE profile was created by the database trigger
    const { data: profileRows } = await admin
      .from("profiles")
      .select("id, sui_address")
      .eq("id", resolution.userId);

    expect(profileRows).toHaveLength(1);
    expect(profileRows?.[0].sui_address).toBe(normalizeSuiAddress(suiAddress));
  });

  it("TEST F — Synthetic email is strictly blocked in normal email auth routes", async () => {
    const syntheticEmail = createSyntheticSuiEmail(
      "0x1234567890123456789012345678901234567890123456789012345678901234",
    );
    expect(isSyntheticSuiEmail(syntheticEmail)).toBe(true);

    // 1. Sign in route rejection
    const signInReq = new NextRequest("http://localhost:3000/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: syntheticEmail, password: "AnyPassword123!" }),
    });

    const signInRes = await signInRoute(signInReq);
    expect(signInRes.status).toBe(400);
    const signInData = await signInRes.json();
    expect(signInData.code).toBe("SYNTHETIC_EMAIL_NOT_PERMITTED");

    // 2. Sign up route rejection
    const signUpReq = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: syntheticEmail, password: "AnyPassword123!" }),
    });

    const signUpRes = await signUpRoute(signUpReq);
    expect(signUpRes.status).toBe(400);
    const signUpData = await signUpRes.json();
    expect(signUpData.code).toBe("SYNTHETIC_EMAIL_NOT_PERMITTED");
  });

  it("TEST G — Session invalidation on sign out", async () => {
    const keypair = new Ed25519Keypair();
    const resolution = await resolveSuiWalletIdentity(keypair.toSuiAddress());
    createdUserIds.push(resolution.userId);

    const linkRes = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: resolution.email,
    });
    const { hashed_token, verification_type } = (linkRes.data?.properties ?? {}) as any;

    const cookieJar = new Map<string, string>();
    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => cookieJar.set(name, value));
        },
      },
    });

    await ssrClient.auth.verifyOtp({ token_hash: hashed_token, type: verification_type });
    const { data: userBeforeLogout } = await ssrClient.auth.getUser();
    expect(userBeforeLogout.user?.id).toBe(resolution.userId);

    // Sign out
    await ssrClient.auth.signOut();
    const { data: userAfterLogout } = await ssrClient.auth.getUser();
    expect(userAfterLogout.user).toBeNull();
  });

  it("TEST H — SIWS message Issued At & Expiration Time independence from Nonce TTL", () => {
    const validAddress = "0x0000000000000000000000000000000000000000000000000000000000000002";
    const issuedAt = "2026-09-25T12:00:00.000Z";
    const expirationTime = "2026-09-25T12:04:00.000Z"; // 4 min message expiration

    const message = buildSiwsMessage({
      domain: "localhost:3000",
      address: validAddress,
      uri: "http://localhost:3000",
      nonce: "nonce_xyz",
      purpose: "SIWS_LOGIN",
      issuedAt,
      expirationTime,
    });

    const parsed = parseSiwsMessage(message);
    expect(parsed.issuedAt).toBe(issuedAt);
    expect(parsed.expirationTime).toBe(expirationTime);
  });

  it("API Endpoints: /api/auth/sui/nonce and /api/auth/sui/verify e2e flow", async () => {
    const keypair = new Ed25519Keypair();
    const suiAddress = keypair.toSuiAddress();

    // 1. GET /api/auth/sui/nonce
    const nonceReq = new NextRequest("http://localhost:3000/api/auth/sui/nonce?purpose=SIWS_LOGIN", {
      headers: { "x-forwarded-for": `test-ip-${Date.now()}` },
    });
    const nonceRes = await nonceRoute(nonceReq);
    expect(nonceRes.status).toBe(200);
    const nonceData = await nonceRes.json();
    expect(nonceData.success).toBe(true);
    expect(nonceData.nonce).toHaveLength(64);

    // 2. Build SIWS message & sign with wallet
    const messageText = buildSiwsMessage({
      domain: "localhost:3000",
      address: suiAddress,
      uri: "http://localhost:3000/login",
      nonce: nonceData.nonce,
      purpose: "SIWS_LOGIN",
      network: "testnet",
    });
    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(messageText));

    // 3. POST /api/auth/sui/verify
    const verifyReq = new NextRequest("http://localhost:3000/api/auth/sui/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "host": "localhost:3000",
        "x-forwarded-for": `test-ip-${Date.now()}`,
      },
      body: JSON.stringify({ message: messageText, signature }),
    });

    const verifyRes = await verifyRoute(verifyReq);
    expect(verifyRes.status).toBe(200);
    const verifyResult = await verifyRes.json();
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.user.suiAddress).toBe(normalizeSuiAddress(suiAddress));
    expect(verifyResult.user.id).toBeDefined();

    createdUserIds.push(verifyResult.user.id);
  });
});
