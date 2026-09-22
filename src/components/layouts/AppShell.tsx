"use client";

import React, { ReactNode } from "react";
import Sidebar from "./sidebar/Sidebar";
import Navbar from "./navbar/Navbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-6 focus:outline-none custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
