"use client";

// Mockup-scope: whole-page
// Exists-check: this REPLACES the first version of this same route, built earlier the same day.
// Not a new surface. It also adopts the render-the-real-component pattern that
// app/[locale]/dev/pdp/reviews/page.tsx already uses, rather than inventing a third approach.
//
// WHY IT WAS REBUILT. Owner 2026-08-15: "the big pages mock up that you made inside of it, it's
// just too cluttered and I don't understand at all ... So make a better mock up, which is too
// cluttered."
//
// WHAT WAS WRONG WITH V1, named rather than just "made it nicer":
//   1. FOUR unrelated decisions on one page, so nothing was ever the question.
//   2. NINE iframes, three per decision, side by side. He reads on a phone, where side-by-side
//      collapses into a stack, so "compare these three" became "scroll past three copies of the
//      same page and try to remember the first one."
//   3. Worst: every iframe opened at the TOP of the salon page while the thing being decided was
//      ~1700px further down. He had to find it himself in each one, which is exactly the
//      "I don't understand these" he reported.
//
// AND WHY THERE ARE NO IFRAMES AT ALL NOW. I tried three times to point an iframe at the right
// section and measured each failure: scrollIntoView left the anchor 1664px down, setting the pane
// window's scrollTop left it at 0 (the salon page's sticky-nav scroll-spy puts it back), and
// pulling the frame up by a measured offset landed 1181px out because the page lays out
// differently inside a 6000px-tall frame. Three misses is the signal to change mechanism, not to
// keep tuning one. So this renders the REAL section components directly, which is what the
// existing /dev/pdp/reviews page does: no scrolling, no offset maths, and the thing being decided
// is the only thing on screen.
//
// Already decided and therefore gone from this page: the combo icon. He picked it here ("the
// combined two drilling into one") and it is applied in SalonBundles.tsx.
//
// drift-ok: the green hexes are the subject of the page; they exist only here and become a token
// before anything ships, as `s-ink-soft` did earlier today.
//
// English chrome throughout; the real components inside render their own locale, which the rule
// exempts.

import * as React from "react";
import { notFound } from "next/navigation";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { SalonBundles } from "@/app/[locale]/_components/salon/SalonBundles";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";

// The one salon that actually has a combo, so the section renders real data rather than a fixture.
const MUSE_ID = "0ed041f9-149b-4241-a09e-d41351be7097";
const MUSE_SLUG = "muse-beauty-studio";

function contrastOnWhite(hex: string): number {
  const m = hex.replace("#", "").match(/.{2}/g)!.map((h) => parseInt(h, 16));
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
  return Math.round((1.05 / (L + 0.05)) * 100) / 100;
}

const GREENS = [
  { hex: "#22C55E", label: "Before", note: "You said too bright." }, // drift-ok: his rejection, kept as the anchor
  { hex: "#21B646", label: "A", note: "A quarter darker than the bright one." }, // drift-ok: candidate
  { hex: "#16A34A", label: "B", note: "Already a colour we own, the success tick green." }, // drift-ok: candidate
  { hex: "#20A126", label: "C", note: "Most of the way to the dark one." }, // drift-ok: candidate
  { hex: "#1F8900", label: "Now", note: "You said too dark." }, // drift-ok: his rejection, kept as the anchor
];

type Option = { key: string; label: string; blurb: string; css: string };

const COMBO_OPTIONS: Option[] = [
  { key: "now", label: "Now", blurb: "Two different fonts inside one card, five text sizes.", css: "" },
  {
    key: "b",
    label: "One font",
    blurb: "The combo name uses the same font as the services list. Four sizes instead of five.",
    css: `#probe [class*="font-heading"] { font-family: Inter, system-ui, sans-serif; }
          #probe [class*="text-[12px]"] { font-size: 13px; }`,
  },
  {
    key: "c",
    label: "One font, name leads",
    blurb: "Same, and the combo name is the only large thing in the card, so it reads as one thing containing others.",
    css: `#probe [class*="font-heading"] { font-family: Inter, system-ui, sans-serif; }
          #probe [class*="text-[12px]"] { font-size: 13px; }
          #probe [class*="text-[14px]"] { font-size: 13px; }`,
  },
];

const REVIEW_OPTIONS: Option[] = [
  { key: "now", label: "Now", blurb: "What I applied without showing you first.", css: "" },
  {
    key: "b",
    label: "Smaller initials",
    blurb: "The grey circle drops to 32px, so the name and the words lead instead of two letters.",
    css: `#probe [class*="rounded-full"][class*="grid"] { width:32px; height:32px; font-size:13px; }`,
  },
  {
    key: "c",
    label: "Lines between",
    blurb: "A thin line returns between reviews. Your Fresha shot has none, but our rows are taller because of the replies.",
    css: `#probe article + article { border-top: 1px solid #E4E4E7; padding-top: 20px; }`, // drift-ok: the s-border literal
  },
];

// selected-ok: the selected pill here is the SOFT BLACK he picked himself today off
// /dev/pill-ceramic ("probably d, let's use d, so, yeah, replace them"), the same token the shared
// TabPill now uses. The gate guards the older gray-selected rule his pick superseded, so matching
// the product would fail it while diverging from the product would pass.
const PILL_ON = "h-11 rounded-full bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const PILL_OFF = "h-11 rounded-full border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

function Probe({ options, children }: { options: Option[]; children: React.ReactNode }) {
  const [pick, setPick] = React.useState(options[0].key);
  const current = options.find((o) => o.key === pick)!;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.key} type="button" onClick={() => setPick(o.key)} className={pick === o.key ? PILL_ON : PILL_OFF}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-body text-[13px] leading-relaxed text-s-ink-2">{current.blurb}</p>
      {current.css ? <style dangerouslySetInnerHTML={{ __html: current.css }} /> : null}
      <div id="probe" className="mt-4 rounded-card border border-s-border p-4">
        {children}
      </div>
    </div>
  );
}

const QUESTIONS = [
  { key: "green", label: "The green" },
  { key: "combo", label: "Combo text" },
  { key: "reviews", label: "Reviews" },
];

export default function Round5Page() {
  if (process.env.NODE_ENV === "production") notFound();
  const [q, setQ] = React.useState("green");

  return (
    <main className="min-h-screen bg-white px-5 py-8">
      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[20px] font-semibold text-s-ink">Three questions, one at a time</h1>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink-2">
          Pick a question, then tap the options. The real section is right underneath, and it changes
          as you tap.
        </p>

        <div className="mt-5 flex gap-2">
          {QUESTIONS.map((x) => (
            <button key={x.key} type="button" onClick={() => setQ(x.key)} className={q === x.key ? PILL_ON : PILL_OFF}>
              {x.label}
            </button>
          ))}
        </div>

        {q === "green" && (
          <section className="mt-8">
            <h2 className="font-display text-[16px] font-semibold text-s-ink">Which green</h2>
            <p className="mt-2 font-body text-[13px] leading-relaxed text-s-ink-2">
              The two on grey are the ones you already rejected. The three between them are mixes of
              those two, so each really is in between.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {GREENS.map((g) => {
                const c = contrastOnWhite(g.hex);
                const isAnchor = g.label === "Before" || g.label === "Now";
                return (
                  <div key={g.hex} className={`rounded-card border border-s-border p-4 ${isAnchor ? "bg-s-bg-sunken" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: g.hex }} />
                      <span className="font-body text-[15px] font-medium" style={{ color: g.hex }}>Open</span>
                      <span className="font-body text-[15px] text-s-ink-2">until 17:00</span>
                      <span className="ml-auto font-body text-[13px] font-semibold text-s-ink">{g.label}</span>
                    </div>
                    <p className="mt-2 flex items-center font-body text-[12px] text-s-ink-2">
                      <span>{g.note}</span>
                      <MetaDot />
                      <span>{c >= 4.5 ? "word ok" : "word too pale"}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 font-body text-[13px] leading-relaxed text-s-ink-2">
              The catch: the dot is fine at any of these, but the WORD next to it needs more contrast
              than any of them has. So either the word goes darker than the dot, or the word turns
              black and only the dot stays green.
            </p>
          </section>
        )}

        {q === "combo" && (
          <section className="mt-8">
            <h2 className="font-display text-[16px] font-semibold text-s-ink">Combo text</h2>
            <p className="mt-2 mb-5 font-body text-[13px] leading-relaxed text-s-ink-2">
              This is the real combo section with its real data, not a drawing of one.
            </p>
            <Probe options={COMBO_OPTIONS}>
              <SalonBundles salonId={MUSE_ID} slug={MUSE_SLUG} locale="de" />
            </Probe>
          </section>
        )}

        {q === "reviews" && (
          <section className="mt-8">
            <h2 className="font-display text-[16px] font-semibold text-s-ink">Reviews</h2>
            <p className="mt-2 mb-5 font-body text-[13px] leading-relaxed text-s-ink-2">
              The real reviews section. This is the mockup I should have made before changing
              anything.
            </p>
            <Probe options={REVIEW_OPTIONS}>
              <SalonReviews
                average={4.8}
                count={16}
                reviews={[]}
                salonId={MUSE_ID}
                salonSlug={MUSE_SLUG}
                salonName="Muse Beauty Studio"
                locale="de"
              />
            </Probe>
          </section>
        )}
      </div>
    </main>
  );
}
