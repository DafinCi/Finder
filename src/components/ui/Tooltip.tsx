"use client";

import React, { useState, ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div
          className="
            absolute
            left-full
            top-1/2
            ml-4
            -translate-y-1/2
            whitespace-nowrap
            rounded-sm
            bg-card/50
            border
            border-border
            px-3
            py-2
            text-sm
            shadow-xl
            z-50
          "
        >
          {text}
        </div>
      )}
    </div>
  );
}
