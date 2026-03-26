import React from "react";

export function SpaIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 22C7 22 4 18 4 13c0-4.5 4-8 8-11 4 3 8 6.5 8 11 0 5-3 9-8 9z" />
      <path d="M12 11c1.5 2 3 5 5 7" opacity="0.4" />
      <path d="M12 11c-1.5 2-3 5-5 7" opacity="0.4" />
      <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
