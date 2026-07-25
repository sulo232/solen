// exists-check: net-new /dev support file for /dev/home-imagery (`npm run exists "home imagery"` = 0
// hits). Reuses the real Logo primitive and mirrors SearchBar.tsx's real COLLAPSED-state markup/classes
// verbatim (rounded-[22px] card, shadow-elevation-2, h-[46px] rows, rounded-[6px], h-12 ink button) so
// what's shown here is a faithful static snapshot of what ships today, not an invented redraw. NOT
// shipped, no real component or route is touched by this file.
//
// LANGUAGE NOTE: the task brief asked for the real shipped copy verbatim in its source language. The
// live mockup-english-gate.py (PreToolUse, owner rule, no escape hatch) hard-blocks any non-English text
// in a /dev/ file, explicitly including "the mocked UI strings" per its own message, not just chrome.
// So the strings below are the ENGLISH translation of the real copy, reusing the exact same translation
// ../home-search/_variants.tsx already established for this exact content (Service / Location / Time,
// "Find appointments"), not a fresh invention.

import * as React from "react";
import { Calendar, MapPin, Menu, Search } from "lucide-react";
import { Logo } from "@/app/[locale]/_components/primitives";
import type { SalonCardCategory } from "@/app/[locale]/_components/salon/_shared";
import { cn } from "@/lib/utils";

/** The narrow slice of real SalonCardData (salonCardData.ts) this dev route needs. */
export interface DevSalon {
  slug: string;
  salonId: string;
  name: string;
  category: SalonCardCategory;
  photoUrl: string;
  rating: number | null;
  reviewCount: number | null;
  postalCode: string | null;
  city: string | null;
  priceFromCHF: number | null;
}

/** Static stand-in for the real sticky site Header (Header.tsx is a heavy client component with
 *  auth/session/search-collapse state; re-mounting it inside a clipped 390x844 preview frame would
 *  double session fetches for no benefit and risks sticky/overflow-hidden fighting). Height (84px) and
 *  the Logo size are both sourced from real values, not invented: Hero.tsx's own V3-D151 code comment
 *  documents the homepage header at 84px, and Logo.tsx documents size="sm" (18px) as exactly the
 *  "header collapsed / mobile small" case. */
export function DevHeaderPlaceholder() {
  return (
    <div className="flex h-[84px] shrink-0 items-center justify-between border-b border-s-border bg-white px-4 py-5">
      <Logo size="sm" />
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-input border border-s-border text-s-ink-2">
        <Menu size={20} strokeWidth={2} />
      </span>
    </div>
  );
}

/** The real Hero.tsx headline block, at its real RESOLVED size (see the language note above for why
 *  the copy is English here). Hero.tsx's h1 is clamp(30px,8vw,44px) and its sub is
 *  clamp(16px,4.5vw,22px); both resolve at a 390px viewport to ~31px / ~18px (matching the task brief's
 *  own "a 31px headline, an 18px subline" baseline). Hardcoded here rather than kept as a live `vw`
 *  formula because this frame is a FIXED 390px box regardless of the host browser's actual viewport
 *  width, where a live vw unit would resolve against the wrong number. */
export function HeroHeading({ tone = "ink" }: { tone?: "ink" | "white" }) {
  return (
    <div>
      <h1
        className={cn(
          "mb-2 font-display text-[31px] font-bold leading-[1.08] tracking-[-0.02em]",
          tone === "white" ? "text-white" : "text-s-ink",
        )}
      >
        Appointments, instantly confirmed.
      </h1>
      <p
        className={cn(
          "font-body text-[18px] font-normal leading-[1.35] tracking-[-0.005em]",
          tone === "white" ? "text-white/85" : "text-s-ink-2",
        )}
      >
        Beauty &amp; Wellness across Switzerland.
      </p>
    </div>
  );
}

const FIELDS = [
  { icon: Search, value: "Service" },
  { icon: MapPin, value: "Location" },
  { icon: Calendar, value: "Time" },
] as const;

/** Non-interactive replica of SearchBar.tsx's real COLLAPSED state, not the real component itself: the
 *  real one is a stateful Dynamic-Island morph + full-page overlay (framer-motion, city/date pickers),
 *  unsafe and pointless to mount 3x inside static comparison frames. Every class below is copied
 *  verbatim from the shipping component so the card shown here matches production exactly. */
export function SearchCardStatic() {
  return (
    <div className="w-full overflow-hidden rounded-[22px] bg-white p-4 shadow-elevation-2">
      <div className="flex flex-col gap-[10px]">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.value}
              className="flex h-[46px] items-center rounded-[6px] border border-s-border px-[14px]"
            >
              <span className="flex shrink-0 items-center border-r border-s-border pr-3 text-s-ink-2">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="pl-4 font-body text-[14px] text-s-ink-2">{f.value}</span>
            </div>
          );
        })}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="mt-0 h-12 rounded-[6px] bg-s-ink px-6 font-heading text-[15px] font-bold text-white"
        >
          Find appointments
        </button>
      </div>
    </div>
  );
}

/** H3's "search collapsed to a single compact pill", mirroring the single-pill collapse pattern already
 *  explored in ../home-search/_variants.tsx VariantB (same icon, same trailing round action button). */
export function CompactSearchPill() {
  return (
    <div className="flex h-14 w-full shrink-0 items-center gap-3 rounded-search border border-s-border bg-white pl-4 pr-2 shadow-elevation-1">
      <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink" />
      <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink-2">
        Service, location, time
      </span>
      <span
        aria-label="Find appointments"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-s-ink text-white"
      >
        <Search size={16} strokeWidth={2.25} />
      </span>
    </div>
  );
}
