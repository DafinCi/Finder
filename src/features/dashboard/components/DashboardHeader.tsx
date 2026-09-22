import React from "react";

export default function DashboardHeader({ role }: { role?: string }) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
      <div>
        <h1 className="text-[28px] font-heading font-bold text-foreground">
          {role ? `Career Intelligence: ${role}` : "Overview"}
        </h1>
      </div>
      <div className="text-left md:text-right">
        <span className="inline-block text-[14px] font-sans text-muted-foreground bg-secondary/40 border border-border/80 px-3 py-1 rounded-[6px]">
          {today}
        </span>
      </div>
    </div>
  );
}
