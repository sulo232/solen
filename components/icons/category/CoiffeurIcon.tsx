"use client";
import React from "react";

export function CoiffeurIcon({ animate = false, ...props }: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      style={{ filter: "drop-shadow(0px 3px 3px rgba(80,12,4,0.28))" }}
      {...props}
    >
      {/* Lower ring (blade 1 handle) */}
      <circle cx="8" cy="29.5" r="5.5" fill="#C44A34" />
      <circle cx="8" cy="29.5" r="3.2" fill="white" opacity="0.9" />

      {/* Upper ring (blade 2 handle) */}
      <circle cx="8" cy="10.5" r="5.5" fill="#E8624A" />
      <circle cx="8" cy="10.5" r="3.2" fill="white" opacity="0.9" />

      {/* Blade 1 — darker, goes lower-left to upper-right */}
      <path
        d="M 13,27 L 35,10 L 35,13 L 13,31 Q 11,30 11,28.5 Q 11,27 13,27 Z"
        fill="#B83020"
      />
      {/* Blade 2 — coral, goes upper-left to lower-right */}
      <path
        d="M 13,13 L 35,30 L 35,27 L 13,9 Q 11,10 11,11.5 Q 11,13 13,13 Z"
        fill="#E8624A"
      />
      {/* Blade 2 highlight */}
      <path
        d="M 13,11 L 26,19.5 L 25,21 L 12,12.5 Z"
        fill="white"
        opacity="0.2"
      />

      {/* Pivot bolt */}
      <circle cx="20" cy="20" r="5" fill="#5A1005" />
      <circle cx="20" cy="20" r="3.2" fill="#FAEAE6" />
      <circle cx="20" cy="20" r="1.4" fill="#C44A34" />
    </svg>
  );
}
