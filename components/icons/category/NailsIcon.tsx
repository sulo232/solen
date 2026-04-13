"use client";
import React from "react";

export function NailsIcon({ animate = false, ...props }: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      style={{ filter: "drop-shadow(0px 3px 3px rgba(80,12,4,0.28))" }}
      {...props}
    >
      <defs>
        <linearGradient id="body-na-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C44A34" />
          <stop offset="40%" stopColor="#E8735A" />
          <stop offset="100%" stopColor="#D45540" />
        </linearGradient>
      </defs>

      {/* Body shadow depth */}
      <rect x="12" y="17" width="8" height="19" rx="4" fill="#9A2010" />
      {/* Body main */}
      <rect x="12" y="17" width="16" height="19" rx="5" fill="url(#body-na-g)" />
      {/* Body shine */}
      <rect x="15" y="20" width="4.5" height="11" rx="2.25" fill="white" opacity="0.22" />

      {/* Neck */}
      <rect x="16" y="13" width="8" height="6" rx="2" fill="#C44A34" />

      {/* Cap */}
      <rect x="13" y="3" width="14" height="12" rx="4" fill="#1A0806" />
      <rect x="15" y="5.5" width="5" height="4.5" rx="1.5" fill="#3A1A0C" opacity="0.7" />
      {/* Cap shine */}
      <rect x="24" y="5" width="2" height="8" rx="1" fill="white" opacity="0.1" />

      {/* Drip */}
      <ellipse cx="20" cy="36.5" rx="3.5" ry="2.2" fill="#B83020" />
    </svg>
  );
}
