import React from "react";

export function NailsIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M8 8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
      <rect x="6" y="8" width="12" height="14" rx="3" />
      <path d="M10 14h4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
