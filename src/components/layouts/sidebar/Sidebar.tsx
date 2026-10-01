"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import SidebarFooter from "./SidebarFooter";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export const MIN_SIDEBAR_WIDTH = 240;
export const MAX_SIDEBAR_WIDTH = 420;
export const DEFAULT_SIDEBAR_WIDTH = 260;
const SIDEBAR_STORAGE_KEY = "finder_sidebar_width";

export default function Sidebar() {
  const { collapsed, closeSidebar } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const widthRef = useRef(sidebarWidth);
  widthRef.current = sidebarWidth;

  // Read saved width from localStorage upon mount
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(parsed);
        }
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const saveWidth = useCallback((width: number) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(width));
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  // Handle mouse dragging for smooth resizing
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clampedWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, e.clientX)
      );
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      saveWidth(widthRef.current);
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, saveWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDoubleClick = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    saveWidth(DEFAULT_SIDEBAR_WIDTH);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextWidth: number | null = null;
    if (e.key === "ArrowLeft") {
      nextWidth = Math.max(MIN_SIDEBAR_WIDTH, sidebarWidth - 10);
    } else if (e.key === "ArrowRight") {
      nextWidth = Math.min(MAX_SIDEBAR_WIDTH, sidebarWidth + 10);
    } else if (e.key === "Home") {
      nextWidth = MIN_SIDEBAR_WIDTH;
    } else if (e.key === "End") {
      nextWidth = MAX_SIDEBAR_WIDTH;
    }

    if (nextWidth !== null) {
      e.preventDefault();
      setSidebarWidth(nextWidth);
      saveWidth(nextWidth);
    }
  };

  const desktopStyle = isDesktop
    ? {
        width: `${sidebarWidth}px`,
      }
    : undefined;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        style={desktopStyle}
        className={`
          h-[100dvh] flex flex-col bg-sidebar border-r border-border/80 shrink-0 no-scrollbar
          fixed md:relative inset-y-0 left-0 z-50 md:z-40
          ${isDragging ? "transition-none" : "transition-[width,transform] duration-200 ease-in-out"}
          ${
            collapsed
              ? "-translate-x-full md:translate-x-0"
              : "translate-x-0 w-[280px] max-w-[85vw] md:w-auto shadow-2xl md:shadow-none"
          }
        `}
      >
        <div className="w-full h-full flex flex-col overflow-hidden no-scrollbar">
          <SidebarHeader collapsed={isDesktop ? false : collapsed} />
          <SidebarNavigation collapsed={isDesktop ? false : collapsed} />
          <SidebarFooter collapsed={isDesktop ? false : collapsed} />
        </div>

        {/* Resizer Splitter Handle (Desktop Only) */}
        {isDesktop && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-valuenow={sidebarWidth}
            aria-valuemin={MIN_SIDEBAR_WIDTH}
            aria-valuemax={MAX_SIDEBAR_WIDTH}
            aria-label="Resize sidebar"
            title="Drag to resize (double click to reset)"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="hidden md:flex absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-20 items-center justify-center group focus-visible:outline-hidden"
          >
            <div
              className={`
                w-[2px] h-full transition-colors duration-150
                ${
                  isDragging
                    ? "bg-primary"
                    : "bg-transparent group-hover:bg-primary/50 group-focus-visible:bg-primary"
                }
              `}
            />
          </div>
        )}
      </aside>
    </>
  );
}
