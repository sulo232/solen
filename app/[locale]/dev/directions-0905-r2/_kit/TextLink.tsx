"use client";

// exists-check: `npm run exists directions` shows no round-2 text-link kit wrapper; `npm run
// exists kit` returns no existing token/kit module. The blue-text-link recipe is a locked
// design-contract row (CLAUDE.md "link"), already live on real production copy (see Grounded-in
// below), never previously extracted into its own reusable component.

// Depicts: a small clickable text link -> app/[locale]/salon/[slug]/team/page.tsx (a real, live text-s-accent link; this recipe is the design-contract "link" row, blue s-accent #276EF1, hover underline, sparse: links/small buttons/review counts only)

// Grounded-in: app/[locale]/salon/[slug]/team/page.tsx (a real production usage of
// text-s-accent). tailwind.config.js's s-accent DEFAULT is #276EF1 (the value this component
// hardcodes as a style, since a bare `text-s-accent` class would need Tailwind's arbitrary
// theme() lookup at runtime rather than a static hex; the numeric value matches the token).
//
// system: none. The accent-text recipe carries no per-system delta; it is the one colour that
// stays identical in all three systems (Part A colour role table is base, not per-system).

import * as React from "react";
import { COLOR } from "./tokens";

export interface TextLinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/** Small clickable text only: "Mehr lesen", "Buchung verwalten", review counts. Never a big
 * CTA, never a see-all arrow (those stay ink), never body/labels/prices/headings. */
export function TextLink({ children, href, onClick, className }: TextLinkProps) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      {...(href ? { href } : { type: "button" as const })}
      onClick={onClick}
      className={["font-body font-normal hover:underline", className].filter(Boolean).join(" ")}
      style={{ color: COLOR.accentText, fontSize: 14 }}
    >
      {children}
    </Tag>
  );
}
