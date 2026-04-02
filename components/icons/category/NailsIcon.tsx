"use client";
import React from "react";

export function NailsIcon({
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
        @keyframes nail-drip {
          0%, 100% { transform: scale(1); transform-origin: 12px 22px; }
          30% { transform: scale(1.18) translateY(1px); transform-origin: 12px 22px; }
          60% { transform: scale(0.96); transform-origin: 12px 22px; }
        }
      `}</style>
      <path d="M8 8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
      <rect
        x="6" y="8" width="12" height="14" rx="3"
        style={animate ? { animation: "nail-drip 0.55s ease-in-out" } : undefined}
      />
      <path d="M10 14h4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
