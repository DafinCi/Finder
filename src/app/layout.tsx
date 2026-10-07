import React, { ReactNode } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Finder | AI Career Intelligence",
  description: "Understand your career before applying.",
  icons: {
    icon: "/brand/finder-logo.png",
    apple: "/brand/finder-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
