"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl font-sans",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-muted-foreground font-medium",
          error:
            "group-[.toaster]:border-destructive/40 group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive",
          success:
            "group-[.toaster]:border-emerald-500/40 group-[.toaster]:bg-emerald-500/10 group-[.toaster]:text-emerald-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
