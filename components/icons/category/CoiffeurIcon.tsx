"use client";
import React from "react";

/**
 * CoiffeurIcon — animated scissors that snip open/closed when `animate` is true
 */
export function CoiffeurIcon({
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
        @keyframes scissor-top {
          0%, 100% { transform-origin: 20px 4px; transform: rotate(0deg); }
          30% { transform-origin: 20px 4px; transform: rotate(14deg); }
          60% { transform-origin: 20px 4px; transform: rotate(-4deg); }
        }
        @keyframes scissor-bot {
          0%, 100% { transform-origin: 20px 20px; transform: rotate(0deg); }
          30% { transform-origin: 20px 20px; transform: rotate(-14deg); }
          60% { transform-origin: 20px 20px; transform: rotate(4deg); }
        }
      `}</style>

      {/* Pivot circles */}
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />

      {/* Top blade */}
      <line
        x1="20" y1="4" x2="8.12" y2="15.88"
        style={animate ? { animation: "scissor-top 0.55s ease-in-out infinite" } : undefined}
      />
      {/* Bot blade */}
      <line
        x1="20" y1="20" x2="14.47" y2="14.48"
        style={animate ? { animation: "scissor-bot 0.55s ease-in-out infinite" } : undefined}
      />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}
