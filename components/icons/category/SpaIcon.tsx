"use client";
import React from "react";

export function SpaIcon({ animate = false, ...props }: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" {...props}>
      <defs>
        <filter id="sh-sp" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#5A1005" floodOpacity="0.28" />
        </filter>
        <filter id="sh-sp-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#5A1005" floodOpacity="0.22" />
        </filter>
        <radialGradient id="center-sp" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FAECD0" />
          <stop offset="100%" stopColor="#F2C144" />
        </radialGradient>
      </defs>

      {/* Back petals — 3 at 0°, 120°, 240° — darker coral */}
      <g filter="url(#sh-sp)">
        <ellipse cx="20" cy="8.5" rx="4.5" ry="10.5" fill="#B83020" />
        <ellipse cx="20" cy="8.5" rx="4.5" ry="10.5" fill="#B83020" transform="rotate(120 20 20)" />
        <ellipse cx="20" cy="8.5" rx="4.5" ry="10.5" fill="#B83020" transform="rotate(240 20 20)" />
      </g>

      {/* Front petals — 3 at 60°, 180°, 300° — main coral */}
      <ellipse cx="20" cy="8.5" rx="4.5" ry="10" fill="#E8735A" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="8.5" rx="4.5" ry="10" fill="#E8735A" transform="rotate(180 20 20)" />
      <ellipse cx="20" cy="8.5" rx="4.5" ry="10" fill="#E8735A" transform="rotate(300 20 20)" />

      {/* Petal vein highlights */}
      <ellipse cx="20" cy="9.5" rx="1.5" ry="7" fill="white" opacity="0.18" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="9.5" rx="1.5" ry="7" fill="white" opacity="0.18" transform="rotate(180 20 20)" />
      <ellipse cx="20" cy="9.5" rx="1.5" ry="7" fill="white" opacity="0.18" transform="rotate(300 20 20)" />

      {/* Center disc */}
      <circle cx="20" cy="20" r="7" fill="#FAD4CC" filter="url(#sh-sp-sm)" />
      <circle cx="20" cy="20" r="5" fill="url(#center-sp)" />
      {/* Center glow dot */}
      <circle cx="19" cy="19" r="2" fill="white" opacity="0.55" />
    </svg>
  );
}
