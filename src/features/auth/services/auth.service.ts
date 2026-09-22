import { supabase } from "@/lib/supabase/client";

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
      result.error || "Gagal login. Silakan cek kembali akun Anda.",
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
    throw new Error(result.error || "Gagal registrasi.");
  }

  return result;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  // Force clean cookies darurat jika diperlukan
  document.cookie =
    "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie =
    "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}
