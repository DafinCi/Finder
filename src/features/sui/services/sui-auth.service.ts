import { mapSuiAuthError } from "../types/sui-auth.types";

export interface NonceResponse {
  success: boolean;
  nonce: string;
  purpose: "SIWS_LOGIN" | "SIWS_LINK";
  network: string;
  issuedAt: string;
  expiresAt: string;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    suiAddress: string;
    isNewUser: boolean;
  };
}

export interface LinkResponse {
  success: boolean;
  message: string;
  suiAddress: string;
  userId: string;
}

export interface UnlinkResponse {
  success: boolean;
  message: string;
  userId: string;
}

export class SuiAuthApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SuiAuthApiError";
  }
}

/**
 * Request a fresh single-use cryptographic SIWS challenge nonce from the backend.
 */
export async function fetchSiwsNonce(
  purpose: "SIWS_LOGIN" | "SIWS_LINK" = "SIWS_LOGIN",
): Promise<NonceResponse> {
  const res = await fetch(`/api/auth/sui/nonce?purpose=${purpose}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = data.code || "GENERIC_ERROR";
    const userMessage = mapSuiAuthError(code, data.error);
    throw new SuiAuthApiError(code, userMessage);
  }

  return data as NonceResponse;
}

/**
 * Submit signed SIWS personal message to verify wallet ownership and establish Supabase session.
 */
export async function verifySiwsLogin(
  message: string,
  signature: string,
): Promise<VerifyResponse> {
  const res = await fetch("/api/auth/sui/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message, signature }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = data.code || "GENERIC_ERROR";
    const userMessage = mapSuiAuthError(code, data.error);
    throw new SuiAuthApiError(code, userMessage);
  }

  return data as VerifyResponse;
}

/**
 * Link verified Sui wallet to the currently authenticated Supabase account.
 */
export async function linkSiwsWallet(
  message: string,
  signature: string,
): Promise<LinkResponse> {
  const res = await fetch("/api/auth/sui/link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message, signature }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = data.code || "GENERIC_ERROR";
    const userMessage = mapSuiAuthError(code, data.error);
    throw new SuiAuthApiError(code, userMessage);
  }

  return data as LinkResponse;
}

/**
 * Unlink Sui wallet from the currently authenticated Supabase account.
 */
export async function unlinkSiwsWallet(): Promise<UnlinkResponse> {
  const res = await fetch("/api/auth/sui/unlink", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = data.code || "GENERIC_ERROR";
    const userMessage = mapSuiAuthError(code, data.error);
    throw new SuiAuthApiError(code, userMessage);
  }

  return data as UnlinkResponse;
}
