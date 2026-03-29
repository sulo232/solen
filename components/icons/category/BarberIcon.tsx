"use client";
import React from "react";

export function BarberIcon({
  animate = false,
  ...props
}: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <style>{`
        @keyframes razor-shimmer {
          0%, 100% { stroke-dashoffset: 0; opacity: 1; }
          40% { stroke-dashoffset: -6; opacity: 0.6; }
          70% { stroke-dashoffset: 2; opacity: 0.9; }
        }
      `}</style>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path
        d="M7 6l10 3M7 11l10 3M7 16l10 3"
        strokeDasharray="20"
        style={animate ? { animation: "razor-shimmer 0.55s ease-in-out" } : undefined}
      />
      <path d="M5 3h14M5 21h14" />
      <path d="M12 2v1" />
      <path d="M12 21v1" />
    </svg>
  );
}
