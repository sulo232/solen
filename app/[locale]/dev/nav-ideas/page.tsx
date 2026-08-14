/**
 * /dev/nav-ideas , four shells for the bottom nav, plus the measured size and spacing gap.
 *
 * Owner 2026-08-10, two messages:
 *   "the size is, like, weird. And, yeah, like, the search bar size is really weird."
 *   "everything is, like, unbalanced. It doesn't look organized. In Airbnb, how everything has,
 *    like, spacing and everything, I believe we don't have that really correctly."
 *   "on the bottom navigation bar, I think we can improve on the design itself too, because right
 *    now it just looks really, really basic and the spacing isn't great... give me mockup ideas.
 *    Like, maybe a floating thing."
 *   "there shouldn't be a hamburger menu. There should be a profile. And then saved, maybe a heart
 *    icon."
 *
 * MEASURED FIRST, both sides, same 390x844 viewport, same day. Airbnb read live off airbnb.ch;
 * ours read with Playwright on a visible focused tab, because the preview pane hides its own tab
 * between calls and a size read there is not a measurement.
 *
 * The two numbers that answer his two complaints:
 *   search pill height        Airbnb 56   ours 43     a quarter shorter
 *   gap, pills to 1st section Airbnb  0   ours 79     seventy-nine pixels of nothing
 *
 * exists-check: `npm run exists "bottom nav mockup"` and `npm run exists nav-ideas` both return 0.
 * The variants extend the live BottomNav.tsx shipped earlier today; variant A is that component's
 * exact measured geometry, so this compares against the real thing rather than a redrawing of it.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import NavVariants from "./NavVariants";

const ROWS: Array<[string, string, string, string]> = [
  ["search pill height", "56", "43", "ours is a quarter shorter. This is the weird one."],
  ["search pill radius", "40px", "fully round", "ours is a stadium, theirs is a soft rectangle"],
  ["search pill shadow", "0 6px 20px 10%", "0 2px 8px 9%", "theirs lifts, ours barely reads"],
  ["search pill top", "12", "4", "ours nearly touches the edge"],
  ["category pill height", "40", "36", ""],
  ["category pill padding", "14 a side", "10 a side", ""],
  ["category icon", "28", "24 to 26", "the size he pointed at"],
  ["pill row height", "80", "62", ""],
  ["gap, pills to 1st section", "0", "79", "this hole IS the unbalanced"],
  ["first heading gap", "317", "553", ""],
  ["later heading gaps", "313 / 338 / 388", "349 / 348 / 349", "ours is steadier here, keep it"],
  ["description under a heading", "12px/400 grey", "none anywhere", "his last ask"],
];

export default function NavIdeasPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        The sizes, and four bottom bars
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
        You said the sizes are weird and nothing looks organized. Both turned out to be measurable,
        so here are the numbers before any opinion. Airbnb on the left, us on the right, same phone
        width.
      </p>

      <table className="mt-6 w-full border-collapse text-left font-body text-[14px]">
        <thead>
          <tr className="border-b border-s-border text-s-ink-2">
            <th className="py-2 pr-4 font-normal">what</th>
            <th className="py-2 pr-4 font-normal">Airbnb</th>
            <th className="py-2 pr-4 font-normal">us</th>
            <th className="py-2 font-normal">note</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([what, them, us, note]) => (
            <tr key={what} className="border-b border-s-border align-top">
              <td className="py-2 pr-4 text-s-ink">{what}</td>
              <td className="py-2 pr-4 tabular-nums text-s-ink">{them}</td>
              <td className="py-2 pr-4 tabular-nums font-semibold text-s-ink">{us}</td>
              <td className="py-2 text-s-ink-2">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-12 font-display text-[22px] font-semibold tracking-[-0.01em] text-s-ink">
        Four bottom bars
      </h2>
      <p className="mt-2 max-w-[560px] font-body text-[15px] text-s-ink-2">
        Every one carries your item changes already: no hamburger, a profile, a heart for saved. Only
        the shell differs. My pick is B.
      </p>

      <NavVariants />

      <section className="rounded-card bg-s-bg-sunken p-5">
        <h2 className="font-display text-[18px] font-semibold text-s-ink">One word I could not make out</h2>
        <p className="mt-2 max-w-[560px] font-body text-[15px] text-s-ink">
          On the first item you said not Home, then a word that did not come through. Airbnb calls
          this slot Explore, which is what the variants show. If you meant something else it is a
          one-line change, so tell me the word rather than me picking for you.
        </p>
      </section>
    </main>
  );
}
