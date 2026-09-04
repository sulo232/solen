"use client";

// Mockup-scope: whole-page
// Exists-check: the client half of app/[locale]/dev/unify/page.tsx. It renders the REAL search
// results page component, SearchTemplate, with the same props the real route passes. Nothing is
// hand-assembled here.
//
// REBUILT 2026-08-23 after he said the photos were missing and to try again. He was right, and the
// mistake was one this project already has written down: a mockup is a preview of the WHOLE real
// page with only the treatment applied, never a panel of components lifted out of it. The first
// version lifted the result CARD out on its own, and the card outside its page could not work out
// what size photo to ask for, so it asked for the largest one there is and none of the six ever
// arrived. On this machine they looked fine, because they were already sitting in the browser from
// visiting the real site. Reproduced by taking a picture of the page through the link he uses: six
// grey boxes, while the real search page loaded its photos over the same link in the same second.
//
// measure-ok: numbers in the table below were read with getComputedStyle off the built site at
// 390x844 on 2026-08-23 and are recorded in _plans/DESIGN_UNIFY_2026-08-23.md.
//
// emphasis-ok: page chrome keeps weight >= 600 on its title and the selected option only.

import * as React from "react";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";

type Direction = { key: string; label: string; blurb: string; css: string };

const DIRECTIONS: Direction[] = [
  {
    key: "now",
    label: "Now",
    blurb:
      "The results screen as it ships. Nothing on it is bigger than 18px, and 3 words in 100 are bold, against 13 on the store page you like.",
    css: "",
  },
  {
    key: "anchor",
    label: "Give it an anchor",
    blurb:
      "One change, made large. Store names go to 24px and the price to 20px, so every result has something that leads. Same photos, same layout, same information.",
    css: `#stage [class*="text-[15px]"], #stage [class*="text-[16px]"], #stage h3 {
            font-size: 24px !important; line-height: 1.15 !important; letter-spacing: -0.02em !important;
          }
          #stage [class*="tabular"] { font-size: 20px !important; font-weight: 600 !important; }
          #stage [class*="text-[12px]"] { font-size: 13px !important; }`,
  },
  {
    key: "photo",
    label: "Let the photo lead",
    blurb:
      "The store page you like is mostly photograph. Here every picture goes from wide to tall and loses its inner chrome, so a result is a picture with a name under it. Fewer results fit on screen, which is the trade.",
    css: `#stage [class*="aspect-[5/4]"], #stage [class*="aspect-[4/3]"], #stage [class*="aspect-video"] {
            aspect-ratio: 4 / 5 !important;
          }
          #stage [class*="shadow"] { box-shadow: none !important; }
          #stage [class*="text-[12px]"] { font-size: 13px !important; }`,
  },
  {
    key: "both",
    label: "Both",
    blurb:
      "The two above at once, and every corner on the screen pulled onto one value. This is the biggest of the three and the closest to how the store page carries itself.",
    css: `#stage [class*="text-[15px]"], #stage [class*="text-[16px]"], #stage h3 {
            font-size: 24px !important; line-height: 1.15 !important; letter-spacing: -0.02em !important;
          }
          #stage [class*="tabular"] { font-size: 20px !important; font-weight: 600 !important; }
          #stage [class*="text-[12px]"] { font-size: 13px !important; }
          #stage [class*="aspect-[5/4]"], #stage [class*="aspect-[4/3]"], #stage [class*="aspect-video"] {
            aspect-ratio: 4 / 5 !important;
          }
          #stage [class*="shadow"] { box-shadow: none !important; }
          #stage div[class*="rounded-"]:not([class*="rounded-full"]) { border-radius: 20px !important; }`,
  },
];

const ON = "h-11 rounded-[16px] bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const OFF = "h-11 rounded-[16px] border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

export function UnifyClient({ locale }: { locale: string }) {
  const [pick, setPick] = React.useState("now");
  const current = DIRECTIONS.find((d) => d.key === pick)!;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[430px] px-5 pt-8">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
          Making the other screens look like the two you like
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-s-ink">
          The real search screen is below. Tap a direction and it changes. These are big changes on
          purpose.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <button key={d.key} type="button" onClick={() => setPick(d.key)} className={pick === d.key ? ON : OFF}>
              {d.label}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-2 font-body text-[14px] leading-relaxed text-s-ink-2">{current.blurb}</p>
      </div>

      {current.css ? <style dangerouslySetInnerHTML={{ __html: current.css }} /> : null}

      {/* The real page, full width, so every photo sizes itself exactly as it does in the product. */}
      <div id="stage" className="mt-2 border-t border-s-border">
        <SearchTemplate
          locale={locale}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          serviceFilter={"coiffeur" as any}
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          cityFilter={"basel" as any}
        />
      </div>
    </main>
  );
}
