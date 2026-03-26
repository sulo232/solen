import React from "react";

export function MakeupIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9 7h6v5H9V7z" />
      <path d="M10 7V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
      <path d="M8 12h8v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8z" />
      <path d="M16 12L8 15" opacity="0.4" />
      <path d="M16 15L8 18" opacity="0.4" />
      <path d="M20 7l-2-2 1-1 1 1 1-1 1 1-2 2z" strokeWidth="1" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}
