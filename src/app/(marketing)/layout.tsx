import React, { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import MarketingNavbar from "@/features/marketing/components/MarketingNavbar";
import MarketingFooter from "@/features/marketing/components/MarketingFooter";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    isAuthenticated = false;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <MarketingNavbar isAuthenticated={isAuthenticated} />
      <main id="main-content" className="flex-1 focus:outline-hidden">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
