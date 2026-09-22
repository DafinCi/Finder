"use client";

import React from "react";
import { Menu } from "lucide-react";
import Breadcrumb from "./Breadcrumb";
import UserMenu from "./UserMenu";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-6 md:px-8 py-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-1.5 rounded-[6px] border border-border bg-card/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <span className="h-4 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
