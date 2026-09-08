"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("common");
  return (
    <div
      role="status"
      aria-label={t("loading")}
      className={cn(
        "animate-[spin_0.7s_linear_infinite] rounded-full border-2",
        sizeMap[size],
        invert
          ? "border-white/30 border-t-white"
          : coral
          ? "border-s-accent/20 border-t-s-accent"
          : "border-s-ink/[0.10] border-t-s-ink/60",
        className
      )}
    />
  );
}
