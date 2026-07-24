"use client";

// exists-check: net-new dev route vs _plans/HOMEPAGE.md (a plan, not a component) and the
// existing app/[locale]/dev/* explorations (search-morph, category-flow, etc.). `npm run exists
// "home search card"` = 0 hits. Isolated /dev throwaway for owner variation picking, NOT a
// shipped surface; the real card lives in _components/homepage/SearchBar.tsx (edited later).

/**
 * DEV ROUTE : home search-card directions (owner 2026-07-24 "give me ideas now").
 *
 * NOT shipped. Three REAL-component treatments of the hero search card, side by
 * side, so the owner can pick one. Real tokens only (DS radius/shadow/color),
 * real Lucide icons. Copy is English per the mockup-english rule (the shipped
 * card renders German via i18n). The chosen direction is applied to the real
 * Hero/SearchBar afterward.
 *
 * What each fixes vs. the CURRENT card (SearchBar.tsx): radius was off-system
 * (container borderRadius:22, rows rounded-[6px]); card was ~370px at 402 (near
 * full-width = "too wide"); no clean internal separation.
 *   DS radius tokens: card 16, card-lg 20, input 16, search 99, pill/btn 99, sheet 28.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { HeroHead, FIELDS, VariantA, VariantB, VariantC, CurrentCard } from "./_variants";

// page ========================================================================

function Section({
  tag,
  title,
  note,
  recommended,
  children,
}: {
  tag: string;
  title: string;
  note: string;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-s-border px-5 py-9">
      <div className="mx-auto max-w-[344px]">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[12px] font-semibold",
              recommended ? "bg-s-ink text-white" : "bg-s-bg-sunken text-s-ink",
            )}
          >
            {tag}
          </span>
          {recommended && (
            <span className="font-body text-[12px] font-semibold text-s-success">recommended</span>
          )}
        </div>
        <h2 className="font-heading text-[17px] font-bold tracking-[-0.01em] text-s-ink">{title}</h2>
        <p className="mb-6 font-body text-[13px] leading-relaxed text-s-ink-3">{note}</p>
      </div>
      {/* in-context hero block */}
      <div className="mx-auto max-w-[402px] pt-2">
        <div className="px-1 pb-7">
          <HeroHead />
        </div>
        {children}
      </div>
    </section>
  );
}

export default function HomeSearchDevPage() {
  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="px-5 pb-2 pt-8">
        <div className="mx-auto max-w-[344px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-3">Dev route, not live</p>
          <h1 className="mt-1 font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">
            Home search card, 3 directions
          </h1>
          <p className="mt-1.5 font-body text-[13px] leading-relaxed text-s-ink-3">
            Fixes: radius to DS token, narrower + separation. View at 402px width.
            The motion lag is a separate code fix (see chat).
          </p>
        </div>
      </div>

      <Section
        tag="Now (current)"
        title="Current, what you have"
        note="Card 22px, rows 6px (both off-system), ~370px wide (near edge-to-edge)."
      >
        <CurrentCard />
      </Section>

      <Section
        tag="A, Refined stack"
        title="Same 3 fields, DS-clean"
        note="Card rounded-card-lg (20). The 3 rows in ONE card split by hairlines (instead of 3 loose 6px boxes) = clean separation. Narrower (344) with real gutter. Keeps the approved structure."
        recommended
      >
        <VariantA />
      </Section>

      <Section
        tag="B, Single pill"
        title="One search field (like /search)"
        note="Reduced to ONE field, rounded-search (99). Search entry inside the field (web pattern). Narrowest, consistent with the category page. One tap opens the full search."
      >
        <VariantB />
      </Section>

      <Section
        tag="C, Segmented row"
        title="3 fields in one row"
        note="Service, location and time in one bar, vertical hairlines as separation, round ink search button. Compact, single-line, clearly narrower. rounded-search (99)."
      >
        <VariantC />
      </Section>
    </main>
  );
}
