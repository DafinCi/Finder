import { describe, it, expect, vi } from "vitest";
import type { VerifyResponse } from "@/features/sui/services/sui-auth.service";

describe("Post-Auth Redirection & Sui Sign-Up UX", () => {
  // =========================================================================
  // 1. Sui SIWS Redirection Resolution Invariant
  // =========================================================================
  describe("Sui SIWS Post-Auth Navigation Invariants", () => {
    function resolveSuiAuthRedirect(user: VerifyResponse["user"]): string {
      const shouldOnboard = user.isNewUser || !user.onboardingCompleted;
      return shouldOnboard ? "/onboarding" : "/c";
    }

    it("should route brand-new wallet users directly to /onboarding", () => {
      const newUserResponse: VerifyResponse["user"] = {
        id: "usr_new_123",
        suiAddress:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        isNewUser: true,
        onboardingCompleted: false,
      };

      expect(resolveSuiAuthRedirect(newUserResponse)).toBe("/onboarding");
    });

    it("should route existing wallet users with incomplete onboarding to /onboarding", () => {
      const incompleteUserResponse: VerifyResponse["user"] = {
        id: "usr_existing_456",
        suiAddress:
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        isNewUser: false,
        onboardingCompleted: false,
      };

      expect(resolveSuiAuthRedirect(incompleteUserResponse)).toBe(
        "/onboarding",
      );
    });

    it("should route existing wallet users with completed onboarding directly to /c (chat)", () => {
      const completedUserResponse: VerifyResponse["user"] = {
        id: "usr_existing_789",
        suiAddress:
          "0x3333333333333333333333333333333333333333333333333333333333333333",
        isNewUser: false,
        onboardingCompleted: true,
      };

      expect(resolveSuiAuthRedirect(completedUserResponse)).toBe("/c");
    });

    it("should handle undefined onboardingCompleted safely by routing to /onboarding", () => {
      const undefinedStatusUser: VerifyResponse["user"] = {
        id: "usr_unknown_000",
        suiAddress:
          "0x4444444444444444444444444444444444444444444444444444444444444444",
        isNewUser: false,
        onboardingCompleted: undefined,
      };

      expect(resolveSuiAuthRedirect(undefinedStatusUser)).toBe("/onboarding");
    });
  });

  // =========================================================================
  // 2. Email Sign-In Redirection Invariant
  // =========================================================================
  describe("Email/Password Sign-In Navigation Invariants", () => {
    function resolveEmailAuthRedirect(result: {
      onboardingCompleted?: boolean;
    }): string {
      const shouldOnboard = !result?.onboardingCompleted;
      return shouldOnboard ? "/onboarding" : "/c";
    }

    it("should route email user with onboardingCompleted=false to /onboarding", () => {
      expect(resolveEmailAuthRedirect({ onboardingCompleted: false })).toBe(
        "/onboarding",
      );
    });

    it("should route email user with onboardingCompleted=true to /c", () => {
      expect(resolveEmailAuthRedirect({ onboardingCompleted: true })).toBe(
        "/c",
      );
    });

    it("should route email user without onboardingCompleted property to /onboarding", () => {
      expect(resolveEmailAuthRedirect({})).toBe("/onboarding");
    });
  });

  // =========================================================================
  // 3. Sui Button Copy & Mode Determination
  // =========================================================================
  describe("SuiSignInButton Copy Invariants", () => {
    function getButtonLabel(
      mode: "signin" | "signup",
      status: "idle" | "requesting_nonce" | "waiting_signature" | "verifying",
      hasAccount: boolean,
    ): string {
      const isSignUp = mode === "signup";
      switch (status) {
        case "requesting_nonce":
          return "Requesting challenge...";
        case "waiting_signature":
          return "Approve in wallet...";
        case "verifying":
          return "Verifying signature...";
        default:
          if (hasAccount) {
            return isSignUp
              ? "Sign up with connected wallet"
              : "Sign in with connected wallet";
          }
          return isSignUp
            ? "Sign up with Sui wallet"
            : "Sign in with Sui wallet";
      }
    }

    it("should display sign-up copy when mode='signup'", () => {
      expect(getButtonLabel("signup", "idle", false)).toBe(
        "Sign up with Sui wallet",
      );
      expect(getButtonLabel("signup", "idle", true)).toBe(
        "Sign up with connected wallet",
      );
    });

    it("should display sign-in copy when mode='signin'", () => {
      expect(getButtonLabel("signin", "idle", false)).toBe(
        "Sign in with Sui wallet",
      );
      expect(getButtonLabel("signin", "idle", true)).toBe(
        "Sign in with connected wallet",
      );
    });

    it("should display progress states identically regardless of mode", () => {
      expect(getButtonLabel("signup", "requesting_nonce", false)).toBe(
        "Requesting challenge...",
      );
      expect(getButtonLabel("signin", "requesting_nonce", false)).toBe(
        "Requesting challenge...",
      );
      expect(getButtonLabel("signup", "waiting_signature", true)).toBe(
        "Approve in wallet...",
      );
      expect(getButtonLabel("signin", "waiting_signature", true)).toBe(
        "Approve in wallet...",
      );
      expect(getButtonLabel("signup", "verifying", true)).toBe(
        "Verifying signature...",
      );
      expect(getButtonLabel("signin", "verifying", true)).toBe(
        "Verifying signature...",
      );
    });
  });

  // =========================================================================
  // 4. Proxy Auth Page Navigation Guard
  // =========================================================================
  describe("Proxy Redirection Guard for Authenticated Users on Auth Pages", () => {
    function resolveProxyAuthPageRedirect(
      onboardingCompleted: boolean,
    ): string {
      return onboardingCompleted ? "/c" : "/onboarding";
    }

    it("should redirect logged-in user with incomplete profile to /onboarding", () => {
      expect(resolveProxyAuthPageRedirect(false)).toBe("/onboarding");
    });

    it("should redirect logged-in user with completed profile to /c", () => {
      expect(resolveProxyAuthPageRedirect(true)).toBe("/c");
    });
  });
});
