"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  invert?: boolean;
  coral?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

export default function Spinner({ size = "md", invert = false, coral = false, className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Laden…"
      className={cn(
        "animate-[spin_0.7s_linear_infinite] rounded-full border-2",
        sizeMap[size],
        invert
          ? "border-white/30 border-t-white"
          : coral
          ? "border-s-coral/20 border-t-s-coral"
          : "border-s-ink/[0.10] border-t-s-ink/60",
        className
      )}
    />
  );
}
