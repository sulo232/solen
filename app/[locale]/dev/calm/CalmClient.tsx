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
      "One change only: the capsules become 20px corners. Nothing moves and nothing resizes. This is the change their reviews screen does back up: about half of their rounded things are capsules, and 82% of ours are. Their topic chips are 16px corners on a 48px control, so the chip row in particular is not a capsule row.",
    css: `#calm button, #calm [class*="rounded-full"]:not(img):not([class*="w-1"]) {
            border-radius: 20px !important;
          }
          #calm img, #calm [aria-label] > span[class*="rounded-full"] { border-radius: 9999px !important; }`,
  },
  {
    key: "airbnb",
    label: "The whole thing",
    // measure-ok: the 48px and 12px below are read off their captured reviews screen, recorded in
    // _design-system/references/airbnb--reviews.md, not eyeballed here.
    blurb:
      "Softer corners, plus the sort control painted smaller, the star filters without their counts, and the crowded sizes pulled apart. Two of those four are your taste and not Airbnb's, and you should know which: their sort control is 48px tall on 12px text, so it is roomier than ours rather than tighter, and every one of their filter chips carries a count. The other two the reference backs strongly.",
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
  {
    key: "anchor",
    label: "One thing biggest",
    blurb:
      "Everything above, and then the one change the reference actually shouts about. On their screen the RATING is the biggest thing by a mile: their 4.94 is set at 72px, with a 46px gap down to the next size, while their section heading is small. Ours is upside down. Our heading is 30px and the rating sits at 20px, below it. This flips them, so the number a person came to see is what they see.",
    // measure-ok: 72px, the 46px gap, and their small heading are read off the captured screen in
    // _design-system/references/airbnb--reviews.md, which records the 72px as the rating digit
    // "4.94", alone, by far the largest thing on the screen. Ours (30px heading, 20px rating) came
    // from getComputedStyle on this very page. 56px rather than their 72px, because their rating
    // sits on a screen with no page heading competing and ours does; it is a deliberate step toward
    // their proportion, not a copy of their number, and that distinction is the point.
    css: `#calm button, #calm [class*="rounded-full"]:not(img):not([class*="w-1"]) {
            border-radius: 20px !important;
          }
          #calm img, #calm [aria-label] > span[class*="rounded-full"] { border-radius: 9999px !important; }
          #calm .justify-end > button {
            height: 32px !important; padding: 0 12px !important; font-size: 14px !important;
            border-width: 1px !important; box-sizing: content-box !important;
            padding-top: 6px !important; padding-bottom: 6px !important;
            background-clip: content-box !important;
          }
          #calm .calm-hide-count { display: none !important; }
          #calm [class*="text-[13px]"] { font-size: 14px !important; }
          #calm [class*="text-[15px]"] { font-size: 16px !important; }
          #calm [class*="text-[17px]"] { font-size: 16px !important; }
          #calm * { letter-spacing: normal !important; }
          /* the flip: the rating becomes the anchor, the heading steps back to a label */
          #calm [class*="text-[20px]"] { font-size: 56px !important; line-height: 1 !important; }
          #calm [class*="text-[30px]"] { font-size: 22px !important; }`,
  },
];

const ON = "h-11 rounded-full bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const OFF = "h-11 rounded-full border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

// CORRECTED 2026-08-15 after their reviews screen was captured for the first time.
//
// measure-ok: every number below was measured, and measured ELSEWHERE than this file, which is the
// case this gate's own escape names. Theirs live in
// `_design-system/references/airbnb--reviews.md`, written this turn from their reviews screen at
// 390x844 on a real listing via getComputedStyle: sort control 48px tall, 12px/500 text, radius
// 9999px; topic chips 48px tall, radius 16px, 14px/400, every one carrying a count; review row =
// 48px avatar, 16px/500 name, 9x9px black stars, 12px grey date, 14px body, 1px hairline
// rgb(235,235,235), 60px between rows; type sizes 10/12/14/16/22/26/72px; 5 to 6% at weight >= 600.
// Ours came from getComputedStyle on /de/salon/cuts-and-culture/reviews the same day: sort control
// 108x44px at 13px on a capsule radius; type sizes 12/13/14/15/17/20/30px; 14% at weight >= 600;
// 14 of 17 rounded elements are full capsules.
//
// TWO ROWS OF THE FIRST VERSION WERE WRONG, and they mattered. It used their HOME screen, because
// their reviews screen had never been captured, so it claimed they reserve the capsule for one
// search field and implied their sort control is tighter than ours. Neither holds here. Both are
// corrected and marked, so he can see which of his instincts the reference backs and which it does
// not. He said "mainly i want airbnb", so a row quietly pointing the wrong way would send the whole
// product the wrong way. psych-ok: these are measured properties of a captured screen, never a
// count rendered to a user.
const FINDINGS: { what: string; ours: string; theirs: string; verdict: "ours" | "theirs" | "same" }[] = [
  { what: "Rounded things that are full capsules", ours: "82%", theirs: "about half", verdict: "ours" },
  { what: "Biggest text vs smallest, one screen", ours: "30 / 12, so 2.5x", theirs: "72 / 10, so 7.2x", verdict: "ours" },
  { what: "Sizes crammed inside a 5px band", ours: "5 of 7", theirs: "2 of 7", verdict: "ours" },
  { what: "Different text sizes on one screen", ours: "7", theirs: "7", verdict: "same" },
  { what: "Sort button, box vs its own text", ours: "3.4x", theirs: "4.0x", verdict: "theirs" },
  { what: "Sort button shape", ours: "capsule", theirs: "capsule too", verdict: "same" },
  { what: "Counts on the filter chips", ours: "yes", theirs: "yes, on all of them", verdict: "same" },
  { what: "A star-rating filter at all", ours: "yes", theirs: "none, just a chart", verdict: "ours" },
  { what: "Text in bold", ours: "14%", theirs: "5-6%", verdict: "ours" },
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

        {/* THE TABLE MOVED BELOW THE PREVIEW, 2026-08-16, and it is the same defect I had just
            finished fixing on the sibling page. Measured here after that fix: the rating, which is
            the thing the last option changes, still reported `onScreen: false`, because nine rows of
            comparison sat between the buttons and the section they act on. He taps, the screen does
            not move, and the button reads dead. Identical symptom, different cause, one page apart.
            The numbers are the ANSWER to his question and worth having; they are not worth standing
            between him and the thing he is deciding, so they wait at the bottom. */}
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

        <h2 className="font-display mt-10 text-[20px] font-semibold text-s-ink">The numbers</h2>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink-2">
          Counted on this screen and on theirs, the same day. Black rows are where we are the odd one
          out. Grey rows are where we already match them, or where they are the looser one.
        </p>
        <div className="mt-4 overflow-hidden rounded-[20px] border border-s-border">
          <table className="w-full border-collapse font-body text-[13px]">
            <thead>
              <tr className="bg-s-bg-sunken text-left">
                <th className="px-3 py-2 font-medium text-s-ink-2">Counted</th>
                <th className="px-3 py-2 font-medium text-s-ink-2">Us</th>
                <th className="px-3 py-2 font-medium text-s-ink-2">Airbnb</th>
              </tr>
            </thead>
            <tbody>
              {FINDINGS.map((f) => (
                <tr key={f.what} className="border-t border-s-border">
                  {/* A row where we are the outlier is ink; one where we already match them, or
                      where THEY are the looser one, drops to grey. Colour, not weight, so this page
                      keeps its own emphasis budget. */}
                  <td className={`px-3 py-2 ${f.verdict === "ours" ? "text-s-ink" : "text-s-ink-2"}`}>{f.what}</td>
                  <td className={`px-3 py-2 tabular-nums ${f.verdict === "ours" ? "text-s-ink" : "text-s-ink-2"}`}>{f.ours}</td>
                  <td className="px-3 py-2 tabular-nums text-s-ink-2">{f.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
