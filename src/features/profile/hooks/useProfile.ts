import { useState, useEffect, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useProfile = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/profile", { signal });

      if (!res.ok) {
        throw new Error("Gagal memuat profil karier Anda.");
      }

      const data = await res.json();
      setProfileData(data);
      setError(null);
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name !== "AbortError") {
        console.error("useProfile Error:", errorObj);
        setError(errorObj.message || "Gagal memuat profil.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

  return {
    data: profileData,
    isLoading,
    error,
    refetch: () => fetchProfile(),
  };
};
