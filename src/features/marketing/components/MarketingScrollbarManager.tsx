"use client";

import { useEffect } from "react";

/**
 * Ensures browser window scrollbars are completely hidden on marketing routes
 * across Chrome, Edge, Firefox, and Safari without impairing scrollability.
 */
export default function MarketingScrollbarManager() {
  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");

    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, []);

  return null;
}

