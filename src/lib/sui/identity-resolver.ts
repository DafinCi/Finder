import { normalizeSuiAddress } from "@mysten/sui/utils";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSyntheticSuiEmail } from "./auth-abstraction";

export interface ResolvedSuiIdentity {
  userId: string;
  email: string;
  isNewUser: boolean;
  suiAddress: string;
}

/**
 * Resolves a cryptographically verified Sui wallet address to a canonical
 * Supabase auth.users.id.
 * 
 * Invariants (Guardrails 1, 3, 4, 6):
 * 1. The verified address is used to look up `public.profiles.sui_address`.
 * 2. If an existing profile is found, the user's primary `auth.users.id` is returned.
 * 3. If no profile is found, a new Supabase Auth user is created with an internal
 *    synthetic email (`sui_...@{SYNTHETIC_SUI_DOMAIN}`) without password.
 * 4. Relies on the database trigger `on_auth_user_created` to prevent duplicate
 *    profile creation and updates the profile's `sui_address` atomically.
 */
export async function resolveSuiWalletIdentity(
  suiAddress: string,
): Promise<ResolvedSuiIdentity> {
  const normalized = normalizeSuiAddress(suiAddress);

  // 1. Look up existing profile by linked sui_address
  const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
    .from("profiles")
    .select("id, sui_address, full_name")
    .eq("sui_address", normalized)
    .maybeSingle();

  if (profileFetchError) {
    console.error("Error looking up profile by sui_address:", profileFetchError);
    throw new Error("Database error while checking wallet identity.");
  }

  // 2. Existing linked wallet found
  if (existingProfile) {
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(existingProfile.id);

    if (userError || !userData?.user?.email) {
      console.error("Failed to load auth user for linked profile:", userError);
      throw new Error("Unable to resolve authentication identity for linked wallet.");
    }

    return {
      userId: existingProfile.id,
      email: userData.user.email,
      isNewUser: false,
      suiAddress: normalized,
    };
  }

  // 3. New Sui wallet: Provision new Supabase user
  const syntheticEmail = createSyntheticSuiEmail(normalized);
  const shortAddr = `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;

  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: {
        full_name: `Sui User (${shortAddr})`,
        sui_address: normalized,
        auth_provider: "sui",
      },
    });

  if (createError) {
    // If the user already existed in auth.users (e.g. profile desync), retrieve existing
    if (createError.message.toLowerCase().includes("already registered") ||
        createError.message.toLowerCase().includes("already exists")) {
      // Find user by listing or querying
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const matched = userList.users.find((u) => u.email === syntheticEmail);
      if (matched) {
        // Link profile
        await supabaseAdmin
          .from("profiles")
          .update({ sui_address: normalized })
          .eq("id", matched.id);

        return {
          userId: matched.id,
          email: syntheticEmail,
          isNewUser: false,
          suiAddress: normalized,
        };
      }
    }

    console.error("Failed to provision new Sui auth user:", createError);
    throw new Error(`Failed to create account for wallet: ${createError.message}`);
  }

  const userId = newUser.user.id;

  // 4. Update the profile record created by the database trigger
  const { error: profileUpdateError } = await supabaseAdmin
    .from("profiles")
    .update({ sui_address: normalized })
    .eq("id", userId);

  if (profileUpdateError) {
    console.warn(
      "Profile update by trigger failed, attempting upsert fallback:",
      profileUpdateError,
    );
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: `Sui User (${shortAddr})`,
      sui_address: normalized,
    });
  }

  return {
    userId,
    email: syntheticEmail,
    isNewUser: true,
    suiAddress: normalized,
  };
}
