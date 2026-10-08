"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";

/**
 * True only when a demo account is configured for this deployment. Callers use it
 * to fall back to their own default call to action.
 */
export const isDemoAccountConfigured = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

interface DemoLoginButtonProps {
  className?: string;
  label?: string;
  /** Rendered instead of the button when no demo account is configured. */
  fallback?: React.ReactNode;
}

export function DemoLoginButton({
  className,
  label = "Try the live demo",
  fallback = null,
}: DemoLoginButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!isDemoAccountConfigured) {
    return <>{fallback}</>;
  }

  const handleDemoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Uses the normal sign-in path: no server-side session minting.
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
      router.replace("/c");
      router.refresh();
    } catch {
      toast.error("The demo account is unavailable right now.", {
        description: "Please try again later, or create your own account.",
      });
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDemoLogin}
      disabled={isLoading}
      aria-busy={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <PlayCircle className="w-4 h-4" />
      )}
      <span>{isLoading ? "Opening demo..." : label}</span>
    </button>
  );
}
