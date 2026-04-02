"use client";
import React from "react";

export function WaxingIcon({
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
        @keyframes wax-peel {
          0%, 100% { transform: translateY(0px); }
          35% { transform: translateY(-3px); }
          65% { transform: translateY(1px); }
        }
      `}</style>
      <path
        d="M12 2C6.5 2 4 8.5 4 14c0 4.4 4 8 8 8s8-3.6 8-8c0-5.5-2.5-12-8-12z"
        style={animate ? { animation: "wax-peel 0.55s ease-in-out" } : undefined}
      />
      <path d="M12 2v6" opacity="0.3" />
      <path d="M9 8l6 4" opacity="0.3" />
      <path d="M15 8l-6 4" opacity="0.3" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
