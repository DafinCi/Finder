"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/features/auth/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-[6px] bg-slate-900 p-8 border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white tracking-tight">
          Welcome Back
        </h1>

        <p className="text-center text-slate-400 mt-2 mb-8 text-sm">
          Login to your developer account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-300">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-950/50 border border-red-900/80 p-3.5 text-red-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-3 text-white font-semibold hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 transition-all text-sm shadow-lg shadow-blue-900/20"
          >
            {loading ? "Signing In..." : "Login to Dashboard"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {"Don't have an account? "}
          <button
            onClick={() => router.push("/register")}
            className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-all"
          >
            Register
          </button>
        </p>
      </div>
    </main>
  );
}
