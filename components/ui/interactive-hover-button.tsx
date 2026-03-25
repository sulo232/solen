"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export default function InteractiveHoverButton({
  text = "Button",
  className,
  ...props
}: InteractiveHoverButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center gap-2 text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all disabled:opacity-60",
        className
      )}
      style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}
      {...props}
    >
      {text}
    </button>
  );
}
