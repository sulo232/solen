import React from "react";

export function CoiffeurIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
      
      {/* Decorative stars */}
      <path d="M18 10l1-2 2-1-2-1-1-2-1 2-2 1 2 1 1 2z" strokeWidth="1" fill="currentColor" stroke="none" opacity="0.6"/>
    </svg>
  );
}
