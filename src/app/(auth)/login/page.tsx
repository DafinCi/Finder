"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { login } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(
        errorObj.message ||
          "Failed to sign in. Please verify your credentials.",
      );
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
            Welcome to Finder
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Sign in to access your sovereign career workspace and AI matches.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-foreground"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "auth-error-msg" : undefined}
              className={`w-full bg-secondary/50 border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all font-sans ${
                error
                  ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                  : "border-border focus:border-primary focus:ring-primary/20"
              }`}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-foreground"
              >
                Password
              </label>
            </div>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "auth-error-msg" : undefined}
              className={`w-full bg-secondary/50 border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all font-sans ${
                error
                  ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                  : "border-border focus:border-primary focus:ring-primary/20"
              }`}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              id="auth-error-msg"
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
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </form>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-muted-foreground font-sans pt-2 border-t border-border/60">
          {"Don't have an account? "}
          <Link
            href="/register"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
