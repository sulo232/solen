"use client";
import React from "react";

export function MakeupIcon({
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
        @keyframes lipstick-draw {
          0% { stroke-dashoffset: 30; opacity: 0.3; }
          60% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>
      <path d="M9 7h6v5H9V7z" />
      <path d="M10 7V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
      <path d="M8 12h8v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8z" />
      <path
        d="M16 12L8 15"
        strokeDasharray="30"
        opacity="0.4"
        style={animate ? { animation: "lipstick-draw 0.55s ease-in-out" } : undefined}
      />
      <path
        d="M16 15L8 18"
        strokeDasharray="30"
        opacity="0.4"
        style={animate ? { animation: "lipstick-draw 0.55s ease-in-out 0.1s" } : undefined}
      />
      <path d="M20 7l-2-2 1-1 1 1 1-1 1 1-2 2z" strokeWidth="1" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}
