"use client";

import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm">
      {paths.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-muted-foreground">/</span>}
          <span className="capitalize font-medium text-xl">{item}</span>
        </div>
      ))}
    </div>
  );
}
