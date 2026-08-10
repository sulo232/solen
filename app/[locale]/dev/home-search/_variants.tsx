"use client";

// exists-check: extracted shared preview cards from ./page.tsx so both the isolated dev route and
// the full-page preview (../home-full) reuse them. NOT shipped.

import * as React from "react";
import { Search, MapPin, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// shared bits ==================================================================

/** The real hero heading block, so each card is judged IN CONTEXT. */
export function HeroHead() {
  return (
    <div className="w-full">
      <h1 className="mb-3 font-display text-[clamp(30px,8vw,44px)] font-bold leading-[1.08] tracking-[-0.02em] text-s-ink">
        Appointments, instantly confirmed.
      </h1>
      <p className="font-body text-[clamp(16px,4.5vw,22px)] font-normal leading-[1.35] tracking-[-0.005em] text-s-ink-2">
        Beauty &amp; Wellness across Switzerland.
      </p>
    </div>
  );
}

export const FIELDS = [
  { icon: Search, value: "Service" },
  { icon: MapPin, value: "Location" },
  { icon: Calendar, value: "Time" },
] as const;

// A : Refined stack (recommended) =============================================
// Keeps the approved 3-field structure. Card to rounded-card-lg (20). The 3 rows
// live in ONE grouped card divided by hairlines (no more 3 floating 6px boxes)
// = clean DS radius + "separation" via dividers. Narrower (~344) with real gutter.
export function VariantA() {
  return (
    <div className="mx-auto w-full max-w-[344px]">
      <div className="overflow-hidden rounded-card-lg bg-white shadow-float">
        {FIELDS.map((f, i) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              type="button"
              className={cn(
                "flex h-[52px] w-full items-center gap-3 px-4 text-left transition-colors hover:bg-s-bg-sunken",
                i > 0 && "border-t border-s-border",
              )}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
              <span className="font-body text-[15px] font-normal text-s-ink-2">{f.value}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-2.5 h-12 w-full rounded-btn bg-s-ink font-heading text-[15px] font-bold tracking-[-0.01em] text-white transition-transform active:scale-[0.98]"
      >
        Find appointments
      </button>
    </div>
  );
}

// B : Single pill (cleanest, narrowest) =======================================
// Collapse to ONE search field (Fresha / the category-page SearchTemplate bar).
// rounded-search (99, the DS "search" token). Map/entry lives INSIDE the bar (web
// pattern). One tap opens the full search. Narrowest, most consistent w/ /search.
export function VariantB() {
  return (
    <div className="mx-auto w-full max-w-[344px]">
      <button
        type="button"
        className="flex h-[60px] w-full items-center gap-3 rounded-search border border-s-border bg-white pl-4 pr-2 text-left shadow-float transition-colors hover:bg-s-bg-sunken/60"
      >
        <Search size={20} strokeWidth={2} className="shrink-0 text-s-ink" />
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[15px] font-semibold leading-tight text-s-ink">Search</span>
          <span className="block font-body text-[12px] leading-tight text-s-ink-2">Service, location, time</span>
        </span>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-s-ink text-white">
          <ArrowRight size={18} strokeWidth={2.2} />
        </span>
      </button>
    </div>
  );
}

// C : Segmented one-line (compact) ============================================
// The 3 fields survive but in ONE bar, divided by vertical hairlines
// ("separation" = the dividers), + a circular ink search button. rounded-search
// (99). Compact single line, clearly narrower.
export function VariantC() {
  return (
    <div className="mx-auto w-full max-w-[344px]">
      <div className="flex h-[58px] w-full items-center rounded-search border border-s-border bg-white pl-1.5 pr-1.5 shadow-float">
        {FIELDS.map((f, i) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              type="button"
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center gap-1.5 self-stretch rounded-full text-left transition-colors hover:bg-s-bg-sunken",
                i > 0 && "border-l border-s-border",
              )}
            >
              <Icon size={16} strokeWidth={2} className="shrink-0 text-s-ink-2" />
              <span className="truncate font-body text-[13px] font-medium text-s-ink-2">{f.value}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="ml-1.5 grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-s-ink text-white transition-transform active:scale-[0.97]"
          aria-label="Search"
        >
          <Search size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

// the "before" (current live card), for reference =============================
export function CurrentCard() {
  return (
    <div className="mx-auto w-full max-w-[540px]">
      <div className="overflow-hidden rounded-[22px] bg-white p-4 shadow-elevation-2">
        <div className="flex flex-col gap-[10px]">
          {FIELDS.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.value}
                className="flex h-[46px] items-center rounded-[6px] border border-s-border bg-white px-[14px]"
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
            className="mt-0 h-12 rounded-[6px] bg-s-ink px-6 font-heading text-[15px] font-bold text-white"
          >
            Find appointments
          </button>
        </div>
      </div>
    </div>
  );
}
