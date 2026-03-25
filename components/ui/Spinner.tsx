"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  invert?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

export default function Spinner({ size = "md", invert = false, className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Laden…"
      className={cn(
        "animate-spin rounded-full border-2",
        sizeMap[size],
        invert
          ? "border-white/30 border-t-white"
          : "border-s-ink/[0.10] border-t-s-ink/60",
        className
      )}
    />
  );
}
