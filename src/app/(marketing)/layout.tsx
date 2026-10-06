import React, { ReactNode } from "react";
import MarqueeBanner from "@/features/marketing/components/MarqueeBanner";
import MarketingFooter from "@/features/marketing/components/MarketingFooter";
import MarketingScrollbarManager from "@/features/marketing/components/MarketingScrollbarManager";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="marketing-page no-scrollbar min-h-screen flex flex-col bg-carbon text-carbon selection:bg-lavender selection:text-carbon font-sans antialiased overflow-x-hidden">
      <MarketingScrollbarManager />
      <MarqueeBanner />
      <main
        id="main-content"
        className="flex-1 focus:outline-hidden w-full px-3 sm:px-4 pt-3 sm:pt-4 pb-0 space-y-3 sm:space-y-4 no-scrollbar"
      >
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
