"use client";
import React from "react";

export function WaxingIcon({ animate = false, ...props }: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" {...props}>
      <defs>
        <filter id="sh-wx" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#3A1A00" floodOpacity="0.3" />
        </filter>
        <filter id="sh-wx-sm" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#3A1A00" floodOpacity="0.24" />
        </filter>
        <linearGradient id="skin-wx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2C144" />
          <stop offset="100%" stopColor="#D4A030" />
        </linearGradient>
        <linearGradient id="strip-wx" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C44A34" />
          <stop offset="50%" stopColor="#E8624A" />
          <stop offset="100%" stopColor="#D45540" />
        </linearGradient>
        <linearGradient id="spatula-wx" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B87008" />
          <stop offset="100%" stopColor="#D4870A" />
        </linearGradient>
      </defs>

      {/* Skin base oval */}
      <rect x="5" y="26" width="30" height="12" rx="6" fill="url(#skin-wx)" filter="url(#sh-wx)" />
      {/* Skin shine */}
      <rect x="7" y="28" width="13" height="4" rx="2" fill="white" opacity="0.35" />

      {/* Wax strip — coral */}
      <rect x="7" y="18" width="27" height="11" rx="4.5" fill="url(#strip-wx)" filter="url(#sh-wx-sm)" />
      {/* Strip texture lines */}
      <rect x="9" y="20.5" width="15" height="2" rx="1" fill="white" opacity="0.22" />
      <rect x="9" y="24" width="10" height="1.5" rx="0.75" fill="white" opacity="0.15" />

      {/* Spatula handle */}
      <rect x="17" y="4" width="7" height="16" rx="3.5" fill="url(#spatula-wx)" filter="url(#sh-wx-sm)" />
      {/* Spatula shine */}
      <rect x="18.5" y="6" width="2.5" height="10" rx="1.25" fill="white" opacity="0.28" />

      {/* End cap */}
      <rect x="14" y="17" width="13" height="5" rx="2" fill="#8A5005" filter="url(#sh-wx-sm)" />
    </svg>
  );
}
