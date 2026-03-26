import React from "react";

export function BarberIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M7 6l10 3M7 11l10 3M7 16l10 3" />
      <path d="M5 3h14M5 21h14" />
      <path d="M12 2v1" />
      <path d="M12 21v1" />
    </svg>
  );
}
