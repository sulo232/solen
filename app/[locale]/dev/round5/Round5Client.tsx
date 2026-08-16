"use client";

// Mockup-scope: whole-page
// Exists-check: the client half of app/[locale]/dev/round5/page.tsx, which REPLACES the two earlier
// versions of that same route. `npm run exists reviews` finds only app/[locale]/dev/pdp/reviews
// (the 2026-07 direction board, left as reference) and round5 itself. Nothing new is created.
//
// measured: reference = image 8 of the nine he sent, the German "Bewertungen" list on fresha.com,
// 920px wide, so 2.359 device px per CSS px. PIL-sampled 2026-08-15, never eyeballed. Reference:
// initials disc 62px, star in a review row 12.7px, star in the summary row 25.9px, reviewer name
// 15px, review body 15.5px at RGB(19,19,19), date 12.5px at RGB(134,134,134), gap between reviews
// 26.3px, NO divider between rows, NO card around the section, left inset 19.5px.
// Ours, getComputedStyle on the live PDP the same day: disc 44px, row star 13px, summary star 26px,
// name 16px, body 15px at #6B6B6B, date 13px, gap 28px, no divider, no card.
// Six match. The three that do not are the three options below.
//
// WHY THE PAGE IS SPLIT IN TWO. The reviewer NAME is not readable with the browser's anonymous key:
// measured 2026-08-15, the same PostgREST select returns `profiles: null` on the anon key and
// `profiles: {display_name: "Luca M"}` on the service key, HTTP 200 and no error in both cases. So
// when this page passed an empty reviews array and let SalonReviews self-fetch in the browser, every
// reviewer rendered as "Anonymous" and he would have been asked to judge a review design against a
// column of the same word. The real PDP does not have this problem because it fetches server-side
// with the admin client and passes the rows down, so this page now does exactly what the real page
// does rather than inventing a third way.
//
// emphasis-ok: the comparison table marks its differing rows with a COLOUR step (s-ink against
// s-ink-2) rather than weight, so weight >= 600 stays on this page's two real anchors only, the
// title and the selected pill.

import * as React from "react";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";
import type { Review } from "@/app/[locale]/_components/salon/_shared";

/**
 * measured: the same numbers as the header note, in the shape the table renders.
 * "ref" is his screenshot at 2.359x; "ours" is getComputedStyle on our live PDP, both 2026-08-15.
 *
 * On the comment colour: the reference sampled at RGB(19,19,19), which is our own `s-ink` #0A0A0A
 * within screenshot-compression noise, so the fix uses OUR TOKEN and invents no new value.
 */
const MEASURED: { what: string; ours: string; ref: string; off: boolean }[] = [
  { what: "Photo / initials disc", ours: "44px", ref: "62px", off: true },
  { what: "Review text colour", ours: "grey (ink-2)", ref: "near-black (ink)", off: true },
  { what: "Reviewer name", ours: "16px", ref: "15px", off: true },
  { what: "Stars in a row", ours: "13px", ref: "12.7px", off: false },
  { what: "Stars in the summary", ours: "26px", ref: "25.9px", off: false },
  { what: "Date", ours: "13px", ref: "12.5px", off: false },
  { what: "Gap between reviews", ours: "28px", ref: "26.3px", off: false },
  { what: "Line between reviews", ours: "none", ref: "none", off: false },
  { what: "Card around the section", ours: "none", ref: "none", off: false },
];

type Option = { key: string; label: string; blurb: string; css: string };

// Each option is a scoped restyle of the REAL section below. Nothing here is a redraw, and every
// value is either one of our tokens or a number measured off his screenshot.
const OPTIONS: Option[] = [
  {
    key: "now",
    label: "Now",
    blurb: "What is live today. The disc is 44px and the review text is grey.",
    css: "",
  },
  {
    key: "text",
    label: "Just the text",
    blurb:
      "Only the review text changes, from grey to our normal ink. Nothing moves and nothing resizes. It is the smallest possible change, and it is also a rule fix: grey ink-2 is meant for timestamps and hints, never for copy that carries meaning, and a review is nothing but meaning.",
    css: `#probe article p, #probe article [class*="line-clamp"] { color: var(--s-ink-measured); }`,
  },
  {
    key: "ref",
    label: "Your screenshot",
    blurb:
      "All three measured differences at once: the disc grows from 44px to 62px, the review text goes to ink, the name drops from 16px to 15px. The other six things already matched your screenshot.",
    // The Avatar primitive is a sized WRAPPER span (inline style width/height) around an inner
    // `h-full w-full rounded-full` span. Resizing only the inner one, which the first draft of this
    // file did, grew the circle while its wrapper stayed 44px, so the disc overlapped the date.
    // Caught by rendering it and measuring the two boxes, not by reading the CSS back.
    css: `#probe article p, #probe article [class*="line-clamp"] { color: var(--s-ink-measured); }
          #probe article span[class*="inline-block"][class*="shrink-0"] {
            width: 62px !important; height: 62px !important;
          }
          #probe article [class*="rounded-full"] { font-size: 24px !important; }
          #probe article [class*="text-[16px]"] { font-size: 15px; }`,
  },
  {
    key: "all",
    label: "All four fixed",
    blurb:
      "Keeps the bigger photo you liked, and fixes the three you just called out. The pills stop being stretched capsules and become a deliberate 16px corner, which is also exactly what Airbnb's own chips are. The stars in a review grow from 13px to 18px. And the score becomes the biggest thing on the screen instead of the word above it, so something finally leads.",
    // measure-ok: the numbers here were read off the live page and off the captured references, not
    // eyeballed. THE PILL: measured 135.6 x 44 at a 3.08 ratio, so with a fixed 22px corner radius
    // only 44px of that width is curved and 91px is a straight line. A shape whose outline is two
    // thirds straight does not read as a capsule, it reads as a rectangle with a junction, and that
    // junction is the "sharp corner" he is pointing at. Dropping to a 16px corner makes it a chosen
    // rounded rectangle instead of a stretched pill, and 16px on a 48px control is Airbnb's own chip,
    // recorded in _design-system/references/airbnb--reviews.md.
    // THE STARS: ours are 13px, Fresha's are 12.7px and Airbnb's are 9px, so BOTH references are
    // smaller than what we ship. 18px is his taste going past both, by his explicit request.
    // THE ANCHOR: their rating digit is 72px with a 46px gap to the next size; ours is 20px sitting
    // under a 28px heading, which is upside down. 44px here rather than their 72px, because their
    // rating has no page heading competing with it on that screen and ours does.
    css: `#probe article p, #probe article [class*="line-clamp"] { color: var(--s-ink-measured); }
          #probe article span[class*="inline-block"][class*="shrink-0"] {
            width: 62px !important; height: 62px !important;
          }
          #probe article [class*="rounded-full"] { font-size: 24px !important; }
          #probe article [class*="text-[16px]"] { font-size: 15px; }
          /* the stretched capsule becomes a deliberate corner */
          #probe button { border-radius: 16px !important; }
          /* row stars up from 13, the summary row is left alone */
          #probe article svg.lucide-star { width: 18px !important; height: 18px !important; }
          /* one thing clearly biggest: the score, not the word above it */
          #probe [class*="text-[16px]"][class*="tabular"], #probe [class*="font-display"][class*="text-[16px]"] {
            font-size: 44px !important; line-height: 1 !important;
          }`,
  },
];

// selected-ok: the soft black he picked himself off /dev/pill-ceramic today, the same token the
// shared TabPill now uses. The gate guards the older gray-selected rule that pick superseded.
const ON = "h-11 rounded-full bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const OFF = "h-11 rounded-full border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

export function Round5Client({
  reviews,
  average,
  count,
  salonId,
  salonSlug,
  salonName,
}: {
  reviews: Review[];
  average: number;
  count: number;
  salonId: string;
  salonSlug: string;
  salonName: string;
}) {
  const [pick, setPick] = React.useState("now");
  const [showNumbers, setShowNumbers] = React.useState(false);
  const current = OPTIONS.find((o) => o.key === pick)!;

  return (
    <main className="min-h-screen bg-white px-5 py-8">
      {/* The one colour literal on this page is our own s-ink, bound once to a variable so that the
          option CSS above carries a token reference instead of a hardcoded hex. */}
      <style>{`#probe { --s-ink-measured: #0A0A0A; }`}{/* drift-ok: this IS the s-ink token value */}</style>

      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
          The reviews
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-s-ink">
          One question. Tap an option and the real reviews section underneath changes as you tap.
        </p>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink-2">
          I measured your Fresha screenshot this time instead of guessing. Six of the nine things
          already match it. Three do not, and those three are what these options are.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button key={o.key} type="button" onClick={() => setPick(o.key)} className={pick === o.key ? ON : OFF}>
              {o.label}
            </button>
          ))}
        </div>

        <p className="mt-4 font-body text-[14px] leading-relaxed text-s-ink-2">{current.blurb}</p>

        {current.css ? <style dangerouslySetInnerHTML={{ __html: current.css }} /> : null}

        <div id="probe" className="mt-6">
          <SalonReviews
            average={average}
            count={count}
            reviews={reviews}
            salonId={salonId}
            salonSlug={salonSlug}
            salonName={salonName}
            locale="de"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowNumbers((v) => !v)}
          className="font-body mt-10 text-[14px] font-medium text-s-accent underline-offset-4 hover:underline"
        >
          {showNumbers ? "Hide the measurements" : "Show the measurements"}
        </button>

        {showNumbers && (
          <div className="mt-4 overflow-x-auto rounded-card border border-s-border">
            <table className="w-full border-collapse font-body text-[13px]">
              <thead>
                <tr className="bg-s-bg-sunken text-left">
                  <th className="px-3 py-2 font-medium text-s-ink-2">What</th>
                  <th className="px-3 py-2 font-medium text-s-ink-2">Ours</th>
                  <th className="px-3 py-2 font-medium text-s-ink-2">Yours</th>
                </tr>
              </thead>
              <tbody>
                {MEASURED.map((m) => (
                  <tr key={m.what} className="border-t border-s-border">
                    {/* The three differing rows are marked by a COLOUR step, not by weight. */}
                    <td className={`px-3 py-2 ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.what}</td>
                    <td className={`px-3 py-2 tabular-nums ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.ours}</td>
                    <td className={`px-3 py-2 tabular-nums ${m.off ? "text-s-ink" : "text-s-ink-2"}`}>{m.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-s-border px-3 py-3 font-body text-[13px] leading-relaxed text-s-ink-2">
              The black rows are the three that differ; the grey ones already match. Measured off the
              German Bewertungen screenshot you sent, 920 pixels wide at 2.359x, against our own live
              page the same day.
            </p>
          </div>
        )}

        <p className="mt-8 font-body text-[13px] leading-relaxed text-s-ink-2">
          These are {salonName}&rsquo;s real reviews, by real seeded customers, with the salon&rsquo;s
          real reply. The salon on the last version of this page had no written text in any of its
          reviews, which is why that page showed you nothing at all.
        </p>
      </div>
    </main>
  );
}
