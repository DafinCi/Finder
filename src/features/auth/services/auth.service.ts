import { supabase } from "@/lib/supabase/client";

function normalizeAuthError(
  rawError?: string,
  fallbackMessage: string = "Authentication failed. Please try again.",
): string {
  if (!rawError) return fallbackMessage;
  const lower = rawError.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Invalid email or password. Please verify your credentials.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists")
  ) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (lower.includes("email not confirmed")) {
    return "Your email address has not been confirmed yet. Please check your inbox.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  if (lower.includes("email and password") || lower.includes("required")) {
    return "Please provide both your email address and password.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network connection error. Please check your connection and try again.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a few moments before trying again.";
  }

  return rawError;
}

export async function login(email: string, password: string) {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      normalizeAuthError(result.error, "Failed to sign in. Please try again."),
    );
  }

  return result;
}

export async function register(email: string, password: string) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      normalizeAuthError(
        result.error,
        "Failed to create account. Please try again.",
      ),
    );
  }

  return result;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(
      normalizeAuthError(
        error.message,
        "Failed to sign out. Please try again.",
      ),
    );
  }
}
