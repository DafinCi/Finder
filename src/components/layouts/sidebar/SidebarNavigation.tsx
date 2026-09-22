"use client";

import React, { useState, useEffect } from "react";
import { MenuItems } from "@/constants/menu";
import SidebarItem, { SidebarItemData } from "./SidebarItem";

export default function SidebarNavigation({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const [dynamicMenu, setDynamicMenu] = useState<SidebarItemData[]>(MenuItems);

  useEffect(() => {
    async function fetchBadgeData() {
      try {
        const response = await fetch("/api/dashboard/metrics");
        if (!response.ok) return;

        const data = await response.json();

        if (
          data.hasResume &&
          data.resumeStatus === "completed" &&
          data.metrics
        ) {
          const { totalMatches } = data.metrics;

          setDynamicMenu((prevMenu) =>
            prevMenu.map((item) =>
              item.href === "/jobs" ? { ...item, badge: totalMatches } : item,
            ),
          );
        }
      } catch (error) {
        console.error("Gagal memuat badge menu:", error);
      }
    }

    fetchBadgeData();
  }, []);

  return (
    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none focus:outline-none">
      {dynamicMenu.map((item) => (
        <SidebarItem key={item.href} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}
