"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { register } from "@/features/auth/services/auth.service";
import Logo from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { SuiSignInButton } from "@/features/sui/components/SuiSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      setLoading(false);
      return;
    }

    try {
      await register(email, password);
      setSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground relative">
      {/* Back to Home / Marketing Page */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground bg-card/60 hover:bg-secondary border border-border/60 hover:border-border transition-all duration-150 group shadow-2xs"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to home</span>
      </Link>

      <div className="w-full max-w-md rounded-sm bg-card p-8 border border-border shadow-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block hover:opacity-85 transition-opacity"
            title="Finder Home"
          >
            <Logo size={40} alt="Finder" className="mx-auto mb-1" />
          </Link>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Create an account to get started.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-2">
            <div
              role="alert"
              aria-live="polite"
              className="rounded-sm bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-xs font-medium space-y-1"
            >
              <div className="flex items-center justify-center gap-1.5 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account created</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Please check your inbox to confirm your account before signing
                in.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full min-h-[44px] h-11 text-xs font-semibold"
            >
              Go to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-foreground"
              >
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "register-error-msg" : undefined}
                className={`w-full bg-secondary/50 border rounded-sm px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all font-sans ${
                  error
                    ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                    : "border-border focus:border-primary focus:ring-primary/20"
                }`}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-foreground"
              >
                Password
              </label>
              <input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "register-error-msg" : undefined}
                className={`w-full bg-secondary/50 border rounded-sm px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all font-sans ${
                  error
                    ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                    : "border-border focus:border-primary focus:ring-primary/20"
                }`}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-foreground"
              >
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "register-error-msg" : undefined}
                className={`w-full bg-secondary/50 border rounded-sm px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all font-sans ${
                  error
                    ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                    : "border-border focus:border-primary focus:ring-primary/20"
                }`}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div
                id="register-error-msg"
                role="alert"
                aria-live="polite"
                className="rounded-sm bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] h-11 text-xs font-semibold"
            >
              <span>{loading ? "Creating account..." : "Create account"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>
        )}

        {!success && (
          <>
            {/* Auth Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-border/80" />
              <span className="bg-card px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground absolute font-sans">
                Or continue with
              </span>
            </div>

            {/* Sui Wallet SIWS Sign Up */}
            <SuiSignInButton mode="signup" />
          </>
        )}

        {/* Footer Navigation */}
        <p className="text-center text-xs text-muted-foreground font-sans pt-2 border-t border-border/60">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
