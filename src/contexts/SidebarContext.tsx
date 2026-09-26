"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  // Synchronize state on navigation or breakpoint shift during render (no effect cascade)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (isMobile) {
      setCollapsed(true);
    }
  }

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (isMobile) {
      setCollapsed(true);
    }
  }

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const closeSidebar = () => {
    setCollapsed(true);
  };

  const openSidebar = () => {
    setCollapsed(false);
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggleSidebar,
        closeSidebar,
        openSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
