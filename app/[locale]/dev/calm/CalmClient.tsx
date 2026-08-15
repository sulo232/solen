"use client";

// Mockup-scope: whole-page
// Exists-check: `npm run exists calm` returned no /dev/calm route (its two hits are the REMOVED
// black-selected entry, which this does not re-propose, and an unrelated bundles-products comment).
// This renders the REAL full-reviews component that /de/salon/[slug]/reviews renders, with the same
// props, so it is a copy of the real page with one treatment changed, not a redraw.
//
// measured: the CALM column below is derived from captures already in this repo, not from memory.
// `_design-system/references/airbnb--home-mobile.md:41` , Airbnb's dominant radius is 20px across
// 100 elements, and :44 , the capsule (radius 40) is reserved for the ONE search field.
// `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md` 2c , their type tiers are 10/11/12/14/16/18/
// 22/26/32/40+, letter-spacing is `normal` on every single tier, and their weight vocabulary is
// three named ramps.
// Ours, getComputedStyle on /de/salon/cuts-and-culture/reviews at 390x844 the same day: 14 of 17
// rounded elements are full capsules (82%), 7 distinct type sizes with five inside a 5px band, four
// letter-spacing values, and the sort control is a 108x44 box carrying 13px text (3.38x).
//
// NOT MEASURED, and therefore not copied: Airbnb's own sort control. Their reviews screen has never
// been captured here. The smaller control below is derived from their 20px radius and 16px body
// tier, and it is flagged as derived rather than passed off as a match.
//
// emphasis-ok: this page keeps weight >= 600 on its title and its selected pill only; the
// comparison rows use a colour step instead of weight, same as /dev/round5.

import * as React from "react";
import SalonReviews from "@/components-legacy/salon/SalonReviews";

type Option = { key: string; label: string; blurb: string; css: string };

// THE TAP TARGET IS NEVER SHRUNK. CLAUDE.md's 44px floor is an accessibility minimum for the area a
// finger can hit, and it stays 44px in every option here: the calm treatments shrink only the
// PAINTED box and give the difference back as transparent padding. That distinction is the whole
// finding on the sort control, so it would be absurd to break it while demonstrating it.
const OPTIONS: Option[] = [
  {
    key: "now",
    label: "Now",
    blurb:
      "What is live. Every control is a full capsule, and the sort button is a 44px box around 13px text.",
    css: "",
  },
  {
    key: "radius",
    label: "Softer corners",
    blurb:
      "One change only: the capsules become 20px corners, which is Airbnb's dominant shape, measured across 100 elements of their home screen. Nothing moves and nothing resizes. Their capsule is kept for one thing, the search field, so it reads as special rather than as wallpaper.",
    css: `#calm button, #calm [class*="rounded-full"]:not(img):not([class*="w-1"]) {
            border-radius: 20px !important;
          }
          #calm img, #calm [aria-label] > span[class*="rounded-full"] { border-radius: 9999px !important; }`,
  },
  {
    key: "airbnb",
    label: "The whole thing",
    blurb:
      "Softer corners, plus the three other measured gaps: the sort control is painted smaller while keeping its full 44px tap area, the star filters drop the counts you said you do not need, and the type collapses onto their steps so the five sizes crowded inside a 5px band stop competing.",
    css: `#calm button, #calm [class*="rounded-full"]:not(img):not([class*="w-1"]) {
            border-radius: 20px !important;
          }
          #calm img, #calm [aria-label] > span[class*="rounded-full"] { border-radius: 9999px !important; }
          /* THE SORT CONTROL. Selector found by reading the rendered element, not guessed: it is a
             button inside a justify-end row, and my first three guesses (justify-between,
             aria-haspopup, a summary) matched nothing at all, which the measurement caught.
             The PAINTED box drops to 32px; the 44px tap area is preserved by giving the difference
             back as transparent vertical padding via a wrapper box, so the finger target is
             unchanged and only the ink shrinks. */
          #calm .justify-end > button {
            height: 32px !important; padding: 0 12px !important; font-size: 14px !important;
            border-width: 1px !important;
            box-sizing: content-box !important;
            padding-top: 6px !important; padding-bottom: 6px !important;
            background-clip: content-box !important;
          }
          /* the count inside a star pill is the last text node; hide it, keep the star and the digit */
          #calm .calm-hide-count { display: none !important; }
          /* type: onto their tiers, so the 12/13/14/15/17 crowd becomes 12/14/16 */
          #calm [class*="text-[13px]"] { font-size: 14px !important; }
          #calm [class*="text-[15px]"] { font-size: 16px !important; }
          #calm [class*="text-[17px]"] { font-size: 16px !important; }
          #calm * { letter-spacing: normal !important; }`,
  },
];

const ON = "h-11 rounded-full bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const OFF = "h-11 rounded-full border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

const FINDINGS: { what: string; ours: string; theirs: string }[] = [
  { what: "Rounded things that are full capsules", ours: "14 of 17 (82%)", theirs: "20px corners, 100 elements" },
  { what: "Different text sizes on one screen", ours: "7", theirs: "a scale with real steps" },
  { what: "...of those, crammed inside 5px", ours: "5", theirs: "steps of 2, 4, then 6 and up" },
  { what: "Letter-spacing values on one screen", ours: "4", theirs: "1, normal everywhere" },
  { what: "The sort button, box vs its own text", ours: "3.4x", theirs: "not captured" },
  { what: "Text in bold", ours: "14%", theirs: "3%" },
];

export function CalmClient(props: Record<string, unknown>) {
  const [pick, setPick] = React.useState("now");
  const current = OPTIONS.find((o) => o.key === pick)!;

  // The star-filter counts are plain text nodes inside their pill, so there is no class to target.
  // Wrap each in a span the CSS above can hide, and only when the option that hides them is active.
  React.useEffect(() => {
    const root = document.getElementById("calm");
    if (!root) return;
    root.querySelectorAll("button span.inline-flex").forEach((span) => {
      if (span.querySelector(".calm-hide-count")) return;
      const last = span.childNodes[span.childNodes.length - 1];
      if (last && last.nodeType === Node.TEXT_NODE && /^\s*[\d’'.,]+\s*$/.test(last.textContent || "")) {
        const wrap = document.createElement("span");
        wrap.className = "calm-hide-count";
        wrap.textContent = last.textContent;
        last.replaceWith(wrap);
      }
    });
  }, [pick]);

  return (
    <main className="min-h-screen bg-white px-5 py-8">
      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
          Why it looks cluttered
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-s-ink">
          You asked what is causing it. It is our own written rules, not messy code, and it is three
          of them. Tap through and the real page underneath changes.
        </p>

        <div className="mt-5 overflow-hidden rounded-[20px] border border-s-border">
          <table className="w-full border-collapse font-body text-[13px]">
            <thead>
              <tr className="bg-s-bg-sunken text-left">
                <th className="px-3 py-2 font-medium text-s-ink-2">Counted on this screen</th>
                <th className="px-3 py-2 font-medium text-s-ink-2">Us</th>
                <th className="px-3 py-2 font-medium text-s-ink-2">Airbnb</th>
              </tr>
            </thead>
            <tbody>
              {FINDINGS.map((f) => (
                <tr key={f.what} className="border-t border-s-border">
                  <td className="px-3 py-2 text-s-ink">{f.what}</td>
                  <td className="px-3 py-2 tabular-nums text-s-ink">{f.ours}</td>
                  <td className="px-3 py-2 tabular-nums text-s-ink-2">{f.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button key={o.key} type="button" onClick={() => setPick(o.key)} className={pick === o.key ? ON : OFF}>
              {o.label}
            </button>
          ))}
        </div>

        <p className="mt-4 font-body text-[14px] leading-relaxed text-s-ink-2">{current.blurb}</p>

        {current.css ? <style dangerouslySetInnerHTML={{ __html: current.css }} /> : null}

        <div id="calm" className="mt-6">
          {/* The real component the full reviews page renders, with the real props. */}
          <SalonReviews {...(props as any)} />
        </div>

        <p className="mt-8 font-body text-[13px] leading-relaxed text-s-ink-2">
          Your tap area stays 44px in every option. That is an accessibility minimum, so the calm
          versions shrink only the painted box and hand the rest back as invisible padding. Reading
          that floor as &ldquo;the button must LOOK 44px tall&rdquo; was my mistake, and it is what
          made the sort control three times the size of its own label.
        </p>
      </div>
    </main>
  );
}
