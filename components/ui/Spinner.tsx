"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  invert?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-4",
};

export default function Spinner({ size = "md", invert = false, className = "" }: SpinnerProps) {
  const color = invert ? "border-white/30 border-t-white" : "border-s-coral/30 border-t-s-coral";
  return (
    <div
      role="status"
      aria-label="Laden..."
      className={`inline-block rounded-full animate-spin ${sizeMap[size]} ${color} ${className}`}
    />
  );
}
