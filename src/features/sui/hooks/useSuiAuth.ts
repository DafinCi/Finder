"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { buildSiwsMessage } from "@/lib/sui/siws-message";
import {
  fetchSiwsNonce,
  verifySiwsLogin,
  linkSiwsWallet,
  unlinkSiwsWallet,
  SuiAuthApiError,
} from "../services/sui-auth.service";
import {
  SuiAuthStatus,
  mapSuiAuthError,
  SUI_ERROR_MESSAGES,
} from "../types/sui-auth.types";

export interface UseSuiAuthReturn {
  status: SuiAuthStatus;
  error: string | null;
  errorCode: string | null;
  isBusy: boolean;
  account: ReturnType<typeof useCurrentAccount>;
  currentNetwork: string;
  signInWithSui: () => Promise<boolean>;
  linkWallet: () => Promise<boolean>;
  unlinkWallet: () => Promise<boolean>;
  resetError: () => void;
}

export function useSuiAuth(): UseSuiAuthReturn {
  const router = useRouter();
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const currentNetwork = useCurrentNetwork();

  const [status, setStatus] = useState<SuiAuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const isBusy =
    status === "connecting_wallet" ||
    status === "requesting_nonce" ||
    status === "waiting_signature" ||
    status === "verifying" ||
    status === "linking" ||
    status === "unlinking";

  const resetError = useCallback(() => {
    setError(null);
    setErrorCode(null);
    if (status === "error") {
      setStatus("idle");
    }
  }, [status]);

  /**
   * Complete Sign-In with Sui (SIWS) authentication workflow
   */
  const signInWithSui = useCallback(async (): Promise<boolean> => {
    if (isBusy) return false;

    // 1. Verify wallet connection
    if (!account) {
      setError(SUI_ERROR_MESSAGES.NO_WALLET_CONNECTED);
      setErrorCode("NO_WALLET_CONNECTED");
      setStatus("connecting_wallet");
      return false;
    }

    // 2. Validate explicit network policy (Finder runs on Sui Testnet)
    if (currentNetwork && currentNetwork !== "testnet") {
      setError(SUI_ERROR_MESSAGES.NETWORK_MISMATCH);
      setErrorCode("NETWORK_MISMATCH");
      setStatus("error");
      return false;
    }

    setError(null);
    setErrorCode(null);

    try {
      // 3. Request fresh SIWS login challenge nonce
      setStatus("requesting_nonce");
      const nonceData = await fetchSiwsNonce("SIWS_LOGIN");

      // 4. Construct exact standard SIWS message
      const domain =
        typeof window !== "undefined" ? window.location.host : "localhost:3000";
      const uri =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "http://localhost:3000/login";

      const messageText = buildSiwsMessage({
        domain,
        address: account.address,
        uri,
        nonce: nonceData.nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      // 5. Request cryptographic personal message signature from connected wallet
      setStatus("waiting_signature");
      const messageBytes = new TextEncoder().encode(messageText);

      let signatureResult: { signature: string; bytes?: string };
      try {
        signatureResult = await dAppKit.signPersonalMessage({
          message: messageBytes,
        });
      } catch (signErr: unknown) {
        const signMsg =
          signErr instanceof Error ? signErr.message : String(signErr);
        if (
          signMsg.toLowerCase().includes("reject") ||
          signMsg.toLowerCase().includes("cancel") ||
          signMsg.toLowerCase().includes("user denied")
        ) {
          setError(SUI_ERROR_MESSAGES.USER_REJECTED);
          setErrorCode("USER_REJECTED");
        } else {
          setError(signMsg || SUI_ERROR_MESSAGES.INVALID_SIWS);
          setErrorCode("INVALID_SIWS");
        }
        setStatus("error");
        return false;
      }

      // 6. Verify signature and establish Supabase SSR session
      setStatus("verifying");
      await verifySiwsLogin(messageText, signatureResult.signature);

      // 7. Authentication successful: update state and refresh application
      setStatus("success");
      router.push("/");
      router.refresh();
      return true;
    } catch (err: unknown) {
      if (err instanceof SuiAuthApiError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        const message =
          err instanceof Error ? err.message : SUI_ERROR_MESSAGES.GENERIC_ERROR;
        setError(mapSuiAuthError("GENERIC_ERROR", message));
        setErrorCode("GENERIC_ERROR");
      }
      setStatus("error");
      return false;
    }
  }, [account, currentNetwork, dAppKit, isBusy, router]);

  /**
   * Link connected wallet to the currently authenticated account
   */
  const linkWallet = useCallback(async (): Promise<boolean> => {
    if (isBusy) return false;

    if (!account) {
      setError(SUI_ERROR_MESSAGES.NO_WALLET_CONNECTED);
      setErrorCode("NO_WALLET_CONNECTED");
      setStatus("connecting_wallet");
      return false;
    }

    if (currentNetwork && currentNetwork !== "testnet") {
      setError(SUI_ERROR_MESSAGES.NETWORK_MISMATCH);
      setErrorCode("NETWORK_MISMATCH");
      setStatus("error");
      return false;
    }

    setError(null);
    setErrorCode(null);

    try {
      setStatus("requesting_nonce");
      const nonceData = await fetchSiwsNonce("SIWS_LINK");

      const domain =
        typeof window !== "undefined" ? window.location.host : "localhost:3000";
      const uri =
        typeof window !== "undefined"
          ? `${window.location.origin}/settings`
          : "http://localhost:3000/settings";

      const messageText = buildSiwsMessage({
        domain,
        address: account.address,
        uri,
        nonce: nonceData.nonce,
        purpose: "SIWS_LINK",
        network: "testnet",
      });

      setStatus("waiting_signature");
      const messageBytes = new TextEncoder().encode(messageText);

      let signatureResult: { signature: string; bytes?: string };
      try {
        signatureResult = await dAppKit.signPersonalMessage({
          message: messageBytes,
        });
      } catch (signErr: unknown) {
        const signMsg =
          signErr instanceof Error ? signErr.message : String(signErr);
        if (
          signMsg.toLowerCase().includes("reject") ||
          signMsg.toLowerCase().includes("cancel") ||
          signMsg.toLowerCase().includes("user denied")
        ) {
          setError(SUI_ERROR_MESSAGES.USER_REJECTED);
          setErrorCode("USER_REJECTED");
        } else {
          setError(signMsg || SUI_ERROR_MESSAGES.INVALID_SIWS);
          setErrorCode("INVALID_SIWS");
        }
        setStatus("error");
        return false;
      }

      setStatus("linking");
      await linkSiwsWallet(messageText, signatureResult.signature);

      setStatus("success");
      router.refresh();
      return true;
    } catch (err: unknown) {
      if (err instanceof SuiAuthApiError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        const message =
          err instanceof Error ? err.message : SUI_ERROR_MESSAGES.GENERIC_ERROR;
        setError(mapSuiAuthError("GENERIC_ERROR", message));
        setErrorCode("GENERIC_ERROR");
      }
      setStatus("error");
      return false;
    }
  }, [account, currentNetwork, dAppKit, isBusy, router]);

  /**
   * Unlink wallet from the currently authenticated account
   */
  const unlinkWallet = useCallback(async (): Promise<boolean> => {
    if (isBusy) return false;

    setError(null);
    setErrorCode(null);
    setStatus("unlinking");

    try {
      await unlinkSiwsWallet();
      setStatus("success");
      router.refresh();
      return true;
    } catch (err: unknown) {
      if (err instanceof SuiAuthApiError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        const message =
          err instanceof Error ? err.message : SUI_ERROR_MESSAGES.GENERIC_ERROR;
        setError(mapSuiAuthError("GENERIC_ERROR", message));
        setErrorCode("GENERIC_ERROR");
      }
      setStatus("error");
      return false;
    }
  }, [isBusy, router]);

  return {
    status,
    error,
    errorCode,
    isBusy,
    account,
    currentNetwork,
    signInWithSui,
    linkWallet,
    unlinkWallet,
    resetError,
  };
}
