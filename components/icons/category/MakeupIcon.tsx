"use client";
import React from "react";

export function MakeupIcon({ animate = false, ...props }: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" {...props}>
      <defs>
        <filter id="sh-ma" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#5A2A00" floodOpacity="0.3" />
        </filter>
        <filter id="sh-ma-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#5A2A00" floodOpacity="0.25" />
        </filter>
        <linearGradient id="tube-ma" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B87008" />
          <stop offset="50%" stopColor="#D4870A" />
          <stop offset="100%" stopColor="#C07A08" />
        </linearGradient>
        <linearGradient id="bullet-ma" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C44A34" />
          <stop offset="50%" stopColor="#E8624A" />
          <stop offset="100%" stopColor="#D45540" />
        </linearGradient>
      </defs>

      {/* Tube body — amber gold */}
      <rect x="15" y="22" width="12" height="17" rx="4" fill="url(#tube-ma)" filter="url(#sh-ma)" />
      {/* Tube shine */}
      <rect x="17" y="24" width="4" height="11" rx="2" fill="white" opacity="0.2" />

      {/* Band ring */}
      <rect x="13" y="28.5" width="16" height="5" rx="1.5" fill="#8A5005" filter="url(#sh-ma-sm)" />
      <rect x="14" y="29.5" width="12" height="2" rx="1" fill="#F2C144" opacity="0.4" />

      {/* Bullet — coral with gradient */}
      <rect x="15" y="8" width="12" height="16" rx="3.5" fill="url(#bullet-ma)" filter="url(#sh-ma-sm)" />
      {/* Bullet shine */}
      <rect x="17.5" y="10" width="4" height="10" rx="2" fill="white" opacity="0.25" />

      {/* Angled top tip */}
      <rect x="14" y="4.5" width="13" height="7" rx="2.5" fill="#C44A34" transform="rotate(-7 20.5 8)" filter="url(#sh-ma-sm)" />
      {/* Tip shine */}
      <rect x="16" y="5.5" width="5" height="3" rx="1.5" fill="white" opacity="0.2" transform="rotate(-7 20.5 8)" />
    </svg>
  );
}
