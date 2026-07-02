"use client";

/**
 * /dev/category-flow , A2 how the CATEGORY system should work (owner: "I don't understand how these
 * categories work again, visualize it + the ways"). English (mockup rule). Council:
 *   TODAY  = 5 entry points write ONE ambiguous param (?service= vs ?category=), the guess-matching
 *            breaks (e.g. "Spa & Wellness" text vs the "spa" enum) , that is the confusion.
 *   MODEL B (recommended) = category is the 4-value ENUM on a segmented row; free text is a SEPARATE
 *            field. category -> ?category=, text -> ?q=. No guess-matching.
 *   MODEL C (alt) = a "What are you looking for?" 4-card chooser first, then the composer.
 * reinvent-ok: this is a /dev decision mockup , the 4 English labels (Hair/Barber/Nails/Spa) are
 * REVIEW labels for the owner; the REAL wiring (when a model is picked) uses the canonical
 * CATEGORY_PILLS (coiffeur/barbershop/nails/spa) from SearchTemplate, NOT a new data source. No drift.
 * Exists-check: `npm run exists category-flow` = 0; real category flow = SearchTemplate CATEGORY_PILLS +
 * SearchOverlay composer + the ?service=/?category= ambiguity in app/api/salons/route.ts.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useState } from "react";
import { Search, Scissors, Gem, Leaf, ChevronRight, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

// reinvent-ok: 4 English REVIEW labels for a /dev decision mockup; icons grounded in the canonical
// CATEGORIES (searchCategories.ts) , Coiffeur/Barbershop=Scissors, Nails=Gem, Spa=Leaf. Real wiring uses CATEGORY_PILLS.
const CATS: [string, typeof Scissors][] = [["Hair", Scissors], ["Barber", Scissors], ["Nails", Gem], ["Spa", Leaf]];

function Frame({ label, tone, children }: { label: string; tone: "bad" | "good" | "alt"; children: React.ReactNode }) {
  const ring = tone === "good" ? "border-s-accent" : "border-s-border";
  return (
    <div className="mx-auto w-full max-w-[320px] shrink-0 sm:mx-0 sm:w-[300px]">
      <p className={`mb-2 text-[13px] font-bold ${tone === "good" ? "text-s-accent" : tone === "bad" ? "text-s-ink-2" : "text-s-ink"}`}>{label}</p>
      <div className={`h-[560px] overflow-hidden rounded-[24px] border-2 ${ring} bg-white p-4`}>{children}</div>
    </div>
  );
}

export default function CategoryFlowMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  const [cat, setCat] = useState("Hair");
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-s-bg-sunken py-6">
      <div className="mx-auto max-w-[1000px] px-4">
        <h1 className="font-heading text-[19px] font-bold text-s-ink">How categories should work</h1>
        <p className="mb-5 mt-1 text-[13px] text-s-ink-2">Category = the 4 fixed types (Hair / Barber / Nails / Spa). Free text = what you type ("balayage", "black hair"). Today they share one ambiguous field, which is the confusion. Recommend Model B.</p>
        <div className="flex flex-col gap-6 pb-4 sm:flex-row sm:justify-center sm:overflow-x-auto">

          {/* TODAY */}
          <Frame label="Today (the problem)" tone="bad">
            <div className="flex items-center gap-2 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
              <Search size={16} className="text-s-ink-2" /><span className="text-[13.5px] text-s-ink">Hair and styling</span>
            </div>
            <div className="mt-4 space-y-2 text-[12.5px] text-s-ink-2">
              <p>5 entry points all write ONE field:</p>
              <ul className="space-y-1 pl-1">
                <li>category pill tap</li><li>homepage tile</li><li>typed text</li><li>URL /coiffeur</li><li>the search composer</li>
              </ul>
            </div>
            <div className="mt-4 rounded-xl border border-s-border bg-s-bg-sunken p-3">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-s-ink"><AlertTriangle size={14} className="text-s-surcharge" /> The break</p>
              <p className="mt-1 text-[12.5px] text-s-ink-2">A tap sends <span className="rounded bg-white px-1 font-mono text-[12px]">?service=Spa%26Wellness</span> (text) but the DB wants <span className="rounded bg-white px-1 font-mono text-[12px]">?category=spa</span> (enum). The guess-match misses, results look wrong.</p>
            </div>
          </Frame>

          {/* MODEL B */}
          <Frame label="Model B (recommended)" tone="good">
            <p className="mb-2 text-[12px] font-semibold text-s-ink-2">1. Category , pick one of four</p>
            <div className="flex gap-1 rounded-[14px] bg-s-bg-sunken p-1">
              {CATS.map(([c, Icon]) => (
                <button key={c} onClick={() => setCat(c)} className={`flex flex-1 flex-col items-center gap-1 rounded-[10px] py-2 text-[12px] font-medium transition-colors ${cat === c ? "bg-white text-s-ink shadow-sm" : "text-s-ink-2"}`}>
                  <Icon size={16} /> {c}
                </button>
              ))}
            </div>
            <p className="mb-2 mt-4 text-[12px] font-semibold text-s-ink-2">2. Free text , separate field</p>
            <div className="flex items-center gap-2 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
              <Search size={16} className="text-s-ink-2" /><span className="text-[13.5px] text-s-ink-3">Service, e.g. balayage, black hair</span>
            </div>
            <div className="mt-4 rounded-xl bg-s-bg-sunken p-3 text-[12.5px] text-s-ink-2">
              <p>Writes <span className="rounded bg-white px-1 font-mono text-[12px]">?category={cat.toLowerCase()}</span> AND <span className="rounded bg-white px-1 font-mono text-[12px]">?q=...</span> , two clean params, no guessing. The category is always one of the four, the text is always just text.</p>
            </div>
            <button className="mt-4 w-full rounded-pill bg-s-ink py-2.5 text-[14px] font-bold text-white" /* selected-ok: commit */>Search</button>
          </Frame>

          {/* MODEL C */}
          <Frame label="Model C (alt)" tone="alt">
            <p className="mb-3 text-[15px] font-bold text-s-ink">What are you looking for?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATS.map(([c, Icon]) => (
                <button key={c} className="flex flex-col items-start gap-2 rounded-2xl border border-s-border bg-white p-3.5 active:bg-s-bg-sunken">
                  <Icon size={22} className="text-s-ink" />
                  <span className="text-[14px] font-semibold text-s-ink">{c}</span>
                  <span className="flex items-center gap-0.5 text-[12px] text-s-accent">Choose <ChevronRight size={13} /></span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] text-s-ink-2">A first-screen chooser: tap a category, THEN the composer opens pre-filled. Clearest for new users, one extra tap for everyone.</p>
          </Frame>

        </div>
        <p className="mt-2 text-[12.5px] text-s-ink-2">Recommend <span className="font-semibold text-s-ink">Model B</span>: category and free-text are separate fields writing separate params, which kills the guess-matching bug. Pick B or C and I wire it.</p>
      </div>
    </main>
  );
}
