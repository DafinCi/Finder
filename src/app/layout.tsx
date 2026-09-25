import React, { ReactNode } from "react";
import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Finder | AI Career Intelligence",
  description: "Understand your career before applying.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-background font-body text-foreground">
        <AppProviders>{children}</AppProviders>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
