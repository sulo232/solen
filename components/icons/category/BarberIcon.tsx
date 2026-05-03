"use client";
import React from "react";

export function BarberIcon({ animate = false, ...props }: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" {...props}>
      <defs>
        <filter id="sh-ba" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#1A0806" floodOpacity="0.35" />
        </filter>
        <filter id="sh-ba-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1A0806" floodOpacity="0.28" />
        </filter>
        <linearGradient id="handle-ba" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3C1A0C" />
          <stop offset="100%" stopColor="#1A0806" />
        </linearGradient>
        <linearGradient id="blade-ba" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5EDE8" />
          <stop offset="100%" stopColor="#D8C4B8" />
        </linearGradient>
      </defs>

      {/* Handle — dark wood with gradient */}
      <rect x="4" y="17" width="21" height="9" rx="4.5" fill="url(#handle-ba)" filter="url(#sh-ba)" />
      {/* Handle grain lines */}
      <rect x="7" y="19.5" width="11" height="2" rx="1" fill="white" opacity="0.12" />
      <rect x="7" y="22.5" width="8" height="1.5" rx="0.75" fill="white" opacity="0.08" />

      {/* Spine */}
      <rect x="23" y="13" width="5" height="17" rx="2.5" fill="#8A2010" filter="url(#sh-ba-sm)" />

      {/* Blade — metallic cream */}
      <rect x="26" y="8" width="11" height="10" rx="2.5" fill="url(#blade-ba)" filter="url(#sh-ba-sm)" />
      {/* Blade shine */}
      <rect x="27.5" y="9.5" width="5" height="3" rx="1.5" fill="white" opacity="0.65" />
      {/* Blade edge line */}
      <rect x="36" y="8" width="1.5" height="10" rx="0.75" fill="#B8A098" />

      {/* Pivot — coral with glow */}
      <circle cx="23.5" cy="21.5" r="4.5" fill="#E8624A" filter="url(#sh-ba-sm)" />
      <circle cx="23.5" cy="21.5" r="2.5" fill="#FAD4CC" />
      <circle cx="23.5" cy="21.5" r="1" fill="#E8624A" />
    </svg>
  );
}
