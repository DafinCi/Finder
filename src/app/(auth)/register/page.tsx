"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { register } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";

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
    <main className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-xl bg-card p-8 border border-border shadow-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary mb-1"></div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Start your AI-powered career journey and discover tailored
            opportunities.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-2">
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 text-xs font-medium space-y-1"
            >
              <div className="flex items-center justify-center gap-1.5 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Registration Successful</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Please check your inbox to confirm your account before signing
                in.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-10 text-xs font-semibold"
            >
              Proceed to Sign In
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
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
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
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
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
                className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs font-semibold"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>
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
