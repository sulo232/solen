/**
 * /dev/search-bar , four search bars, and the numbers behind them.
 *
 * Owner 2026-08-10: "the search bar should look like this, but whatever the fuck that you're doing
 * is completely wrong and just inventing, just guessing. I told you to stop doing that... go
 * actually research."
 *
 * He is right about the pattern, and the fix is not a promise. What I did wrong twice today:
 *   1. I changed his search bar to numbers I had eyeballed off a screenshot.
 *   2. When he pushed back I reverted the whole thing, which threw away the look he was asking for
 *      along with the invention.
 *
 * So this turn the reference was READ, on the live site, with getComputedStyle, and nothing here is
 * applied to real code until he picks one.
 *
 * MEASURED on airbnb.ch at a real 390-wide mobile viewport, 2026-08-10:
 *   box 340 x 54, top 13, radius 40px, border 1px rgb(0,0,0), shadow 0 6px 20px rgba(0,0,0,0.10),
 *   padding 19 a side, justify-content CENTER, label 14px weight 500, icon 12x12 with an 8px gap.
 * Ours, same method, same width: 358 x 46, top 4, our hairline token, 0 2px 8px 7%, padding 14,
 * LEFT aligned, label 16px/500, icon 18 with a 12px gap.
 *
 * The three differences that carry the look are the BLACK RING, the CENTRING, and the SMALL ICON.
 * Height is a distant fourth, which is why my earlier "make it 13px taller" fix did not move it.
 *
 * exists-check: `npm run exists "search bar variations"` = 0. Variant A is the live component's
 * exact class string rather than a redrawing of it.
 *
 * Dev-only, notFound() in production. Nothing here touches the shipped search bar.
 */
import { notFound } from "next/navigation";
import SearchBarVariants from "./SearchBarVariants";

const ROWS: Array<[string, string, string]> = [
  ["height", "54", "46"],
  ["radius", "40px", "fully round"],
  ["border", "1px solid BLACK", "1px hairline, our border token"],
  ["shadow", "0 6px 20px at 10%", "0 2px 8px at 7%"],
  ["padding", "19 a side", "14 a side"],
  ["content", "CENTRED", "left aligned"],
  ["label", "14px / 500", "16px / 500"],
  ["icon", "12px, 8px gap", "18px, 12px gap"],
  ["distance from the top", "13", "4"],
];

export default function SearchBarPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Four search bars
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
        This time the reference was read off the live site rather than judged by eye. Their bar and
        ours, same phone width, same method. Nothing below is applied to the real page until you
        pick one.
      </p>

      <table className="mt-6 w-full max-w-[620px] border-collapse text-left font-body text-[14px]">
        <thead>
          <tr className="border-b border-s-border text-s-ink-2">
            <th className="py-2 pr-4 font-normal">what</th>
            <th className="py-2 pr-4 font-normal">theirs</th>
            <th className="py-2 font-normal">ours</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([k, them, us]) => (
            <tr key={k} className="border-b border-s-border">
              <td className="py-2 pr-4 text-s-ink">{k}</td>
              <td className="py-2 pr-4 text-s-ink">{them}</td>
              <td className="py-2 font-semibold text-s-ink">{us}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 max-w-[560px] font-body text-[15px] text-s-ink">
        The three that carry the look are the black ring, the centred text and the small icon.
        Height is a distant fourth, which is why making ours taller earlier changed almost nothing.
      </p>

      <SearchBarVariants />

      <section className="rounded-card bg-s-bg-sunken p-5">
        <h2 className="font-display text-[18px] font-semibold text-s-ink">My pick</h2>
        <p className="mt-2 max-w-[560px] font-body text-[15px] text-s-ink">
          B, their measurement exactly. You pointed at their bar and said it should look like that,
          and B is the only one that does, ring included.
        </p>
        <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
          The argument against my own pick: a hard black ring is heavier than anything else on the
          home page, and this project has spent months taking weight out. If B feels loud on your
          phone, C is the same shape without the ring.
        </p>
      </section>
    </main>
  );
}
