"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Briefcase, Sparkles } from "lucide-react";

export default function NotificationButton() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="
          relative
          rounded-sm
          p-3
          transition
          hover:bg-sidebar-accent
        "
      >
        <Bell size={22} />

        <span
          className="
            absolute
            right-2
            top-2
            h-2.5
            w-2.5
            rounded-full
            bg-red-500
          "
        />
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            mt-3
            w-80
            rounded-sm
            border
            border-border
            bg-card/50
            shadow-2xl
          "
        >
          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="space-y-2 p-3">
            <div className="flex gap-3 rounded-sm p-3 hover:bg-sidebar-accent">
              <Briefcase className="text-primary" />

              <div>
                <p className="font-medium">New Job Available</p>
                <p className="text-sm text-muted-foreground">
                  Frontend Developer
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-sm p-3 hover:bg-sidebar-accent">
              <Sparkles className="text-yellow-400" />

              <div>
                <p className="font-medium">AI Match Updated</p>
                <p className="text-sm text-muted-foreground">
                  92% compatibility found
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
