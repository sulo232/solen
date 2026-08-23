"use client";

// Mockup-scope: whole-page
// Exists-check: the client half of app/[locale]/dev/unify/page.tsx. Renders the REAL
// SalonResultCard (feed variant) with real salons; no card is redrawn here.
//
// measure-ok: measured with getComputedStyle on the built site at 390x844, 2026-08-23.
//   store page he likes : 6 sizes, biggest 30px, 2.31x its smallest, 13% bold, 5 tracking values
//   home page he likes  : 5 sizes, biggest 18px, 1.50x, 11% bold
//   SEARCH RESULTS      : 5 sizes, biggest 18px, 1.50x, 3% bold, 90 texts in one screen
//   inspo               : 4 sizes, biggest 15px, 1.25x, 14% bold
//   help                : 6 sizes, biggest 30px, 2.50x, 18% bold
//   login               : 5 sizes, biggest 28px, 2.33x, 27% bold
// Corner sizes in play across those screens: 12, 14, 16, 20, 22, 24, 40, 99 and full capsule.
// Four are written down as locked (12 input, 16 card and button, 24 grouped list, 28 sheet); the
// rest arrived through individual approvals that were never folded back into the scale.
//
// emphasis-ok: the page chrome keeps weight >= 600 on its title and the selected option only; the
// directions below deliberately RAISE emphasis inside the preview, which is the subject.

import * as React from "react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";

type Direction = { key: string; label: string; blurb: string; css: string };

const DIRECTIONS: Direction[] = [
  {
    key: "now",
    label: "Now",
    blurb:
      "The results screen as it ships. Nothing on it is bigger than 18px, and 3 in 100 words are bold, against 13 on the store page you like. That is why it reads flat next to the other two.",
    css: "",
  },
  {
    key: "anchor",
    label: "Give it an anchor",
    blurb:
      "One change, made large. The salon name goes to 24px and the price to 20px tabular, so each card has something that leads, and the four sizes crowded between 12 and 15 collapse to two. Same photo, same layout, same information.",
    css: `#stage [class*="text-[15px]"], #stage [class*="text-[16px]"] {
            font-size: 24px !important; line-height: 1.15 !important; letter-spacing: -0.02em !important;
          }
          #stage [class*="tabular"] { font-size: 20px !important; font-weight: 600 !important; }
          #stage [class*="text-[12px]"] { font-size: 13px !important; }`,
  },
  {
    key: "photo",
    label: "Let the photo lead",
    blurb:
      "The store page you like is mostly photograph. Here the picture goes from a wide 5:4 to a tall 4:5 and loses its inner chrome, so a result is a picture with a name under it rather than a box of fields. Fewer cards fit on screen, which is the trade.",
    css: `#stage [class*="aspect-[5/4]"], #stage [class*="aspect-[4/3]"] {
            aspect-ratio: 4 / 5 !important;
          }
          #stage [class*="rounded-[22px]"], #stage [class*="rounded-[16px]"] { border-radius: 20px !important; }
          #stage article, #stage [class*="shadow"] { box-shadow: none !important; }
          #stage [class*="text-[12px]"] { font-size: 13px !important; }`,
  },
  {
    key: "both",
    label: "Both, plus one corner",
    blurb:
      "The two above together, and every corner on the screen pulled onto a single value. Right now nine different corner sizes are in use across your screens; four are written down and the other five arrived one approval at a time. This is the biggest change of the three and the one closest to how the store page carries itself.",
    css: `#stage [class*="text-[15px]"], #stage [class*="text-[16px]"] {
            font-size: 24px !important; line-height: 1.15 !important; letter-spacing: -0.02em !important;
          }
          #stage [class*="tabular"] { font-size: 20px !important; font-weight: 600 !important; }
          #stage [class*="text-[12px]"] { font-size: 13px !important; }
          #stage [class*="aspect-[5/4]"], #stage [class*="aspect-[4/3]"] { aspect-ratio: 4 / 5 !important; }
          #stage article, #stage [class*="shadow"] { box-shadow: none !important; }
          #stage *:not(img):not(svg) { border-radius: 20px !important; }
          #stage [class*="rounded-full"]:not(article), #stage img[class*="rounded-full"] { border-radius: 9999px !important; }`,
  },
];

const ON = "h-11 rounded-[16px] bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const OFF = "h-11 rounded-[16px] border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

const MEASURED: { screen: string; biggest: string; range: string; bold: string; off: boolean }[] = [
  { screen: "Store page (you like it)", biggest: "30px", range: "2.31x", bold: "13%", off: false },
  { screen: "Home (you like it)", biggest: "18px", range: "1.50x", bold: "11%", off: false },
  { screen: "Search results", biggest: "18px", range: "1.50x", bold: "3%", off: true },
  { screen: "Inspo", biggest: "15px", range: "1.25x", bold: "14%", off: true },
  { screen: "Help", biggest: "30px", range: "2.50x", bold: "18%", off: true },
  { screen: "Login", biggest: "28px", range: "2.33x", bold: "27%", off: true },
];

export function UnifyClient({ salons }: { salons: Record<string, unknown>[] }) {
  const [pick, setPick] = React.useState("now");
  const [showNumbers, setShowNumbers] = React.useState(false);
  const current = DIRECTIONS.find((d) => d.key === pick)!;

  return (
    <main className="min-h-screen bg-white px-5 py-8">
      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
          Making the other screens look like the two you like
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-s-ink">
          This is the real search results screen, with real stores. Tap a direction and it changes
          underneath. These are big changes on purpose.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <button key={d.key} type="button" onClick={() => setPick(d.key)} className={pick === d.key ? ON : OFF}>
              {d.label}
            </button>
          ))}
        </div>

        <p className="mt-4 font-body text-[14px] leading-relaxed text-s-ink-2">{current.blurb}</p>

        {current.css ? <style dangerouslySetInnerHTML={{ __html: current.css }} /> : null}

        <div id="stage" className="mt-6 flex flex-col gap-6">
          {salons.length === 0 ? (
            <p className="font-body text-[14px] text-s-ink-2">
              No stores came back from the database, so there is nothing real to judge here. Say the
              word and I will look at why.
            </p>
          ) : (
            salons.map((s) => (
              <SalonResultCard
                key={String(s.id)}
                salonId={String(s.id)}
                slug={String(s.slug)}
                name={String(s.name)}
                locale="de"
                photoUrl={(s.cover_photo_url as string | null) ?? null}
                rating={(s.average_rating as number | null) ?? null}
                reviewCount={(s.review_count as number | null) ?? null}
                address={(s.address as string | null) ?? null}
                city={(s.quartier as string | null) ?? null}
                category={Array.isArray(s.categories) ? String((s.categories as unknown[])[0]) : null}
                variant="feed"
                galleryCount={Array.isArray(s.gallery_urls) ? (s.gallery_urls as unknown[]).length : null}
              />
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowNumbers((v) => !v)}
          className="font-body mt-10 text-[14px] font-medium text-s-accent underline-offset-4 hover:underline"
        >
          {showNumbers ? "Hide the measurements" : "Show the measurements"}
        </button>

        {showNumbers && (
          <div className="mt-4 overflow-x-auto rounded-[16px] border border-s-border">
            <table className="w-full border-collapse font-body text-[13px]">
              <thead>
                <tr className="bg-s-bg-sunken text-left">
                  <th className="px-3 py-2 font-medium text-s-ink-2">Screen</th>
                  <th className="px-3 py-2 font-medium text-s-ink-2">Biggest</th>
                  <th className="px-3 py-2 font-medium text-s-ink-2">Range</th>
                  <th className="px-3 py-2 font-medium text-s-ink-2">Bold</th>
                </tr>
              </thead>
              <tbody>
                {MEASURED.map((m) => (
                  <tr key={m.screen} className="border-t border-s-border">
                    {/* colour, not weight, marks the ones that differ, so this page keeps its own budget */}
                    <td className={`px-3 py-2 ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.screen}</td>
                    <td className={`px-3 py-2 tabular-nums ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.biggest}</td>
                    <td className={`px-3 py-2 tabular-nums ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.range}</td>
                    <td className={`px-3 py-2 tabular-nums ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.bold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-s-border px-3 py-3 font-body text-[13px] leading-relaxed text-s-ink-2">
              Measured on the built site at phone size on 23 August. &ldquo;Range&rdquo; is the
              biggest text divided by the smallest: the higher it is, the more the screen leads your
              eye. The two you like sit at the top of this table for a reason, and the grey rows are
              the ones already in step with them.
            </p>
          </div>
        )}

        <p className="mt-8 font-body text-[13px] leading-relaxed text-s-ink-2">
          Nothing here is applied to the real screens. Pick one and I will take it to the search
          results first, then the rest of the screens that are out of step.
        </p>
      </div>
    </main>
  );
}
