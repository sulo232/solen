"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export default function InteractiveHoverButton({
  text = "Button",
  className,
  ...props
}: InteractiveHoverButtonProps) {
  return (
    <button
      className={cn(
        // mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
        "flex items-center justify-center gap-2 text-white text-sm font-heading font-semibold active:scale-[0.97] transition-[transform,filter] disabled:opacity-60",
        className
      )}
      // V3-D328 (Section A): "s-coral" string literal was always invalid CSS (Tailwind tokens
      // can't resolve at runtime). Renders as transparent → button was probably ALWAYS broken
      // visually. Fixed to bg-s-ink (LOCKFILE §0.2 primary CTA token) via inline hex + dropped
      // the rgba(27,77,27,*) old-green shadows for a clean ink elevation.
      style={{ background: "#0A0A0A", boxShadow: "0 2px 4px rgba(10,10,10,0.16), 0 6px 20px rgba(10,10,10,0.12)" }}
      {...props}
    >
      {text}
    </button>
  );
}
