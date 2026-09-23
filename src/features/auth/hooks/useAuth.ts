"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { logout } from "../services/auth.service";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout execution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user?.email) return "??";
    return user.email.slice(0, 2).toUpperCase();
  };

  return {
    user,
    loading,
    handleLogout,
    initials: getInitials(),
  };
}
