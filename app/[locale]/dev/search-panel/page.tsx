/**
 * /dev/search-panel , four ways the search sheet could look.
 *
 * Owner 2026-08-11: "i think we can improve design on the suche in the search, make mockup, i want
 * more like airbnb."
 *
 * REFERENCE READ THIS TURN, on Mobbin, iOS, Airbnb's real search sheet rather than from memory:
 *   - the page behind is blurred and the sheet floats over it
 *   - a type switcher across the top (Homes / Experiences / Services), icons with an underline on
 *     the active one, and a circular X on the right
 *   - every closed step is its OWN white card with a radius and a shadow, real gaps between them,
 *     a grey label on the left and the chosen value on the right
 *   - the open step is a taller card with a large bold question as its heading
 *   - the action bar sits on the BACKDROP under the sheet, not inside it: "Clear all" as an
 *     underlined link on the left, a wide pill with a magnifier and "Search" on the right
 *
 * What ours already shares: the three-card stack, the big bold question, the pill primary button.
 * What differs, and what the variants explore: where the action bar lives, whether the closed rows
 * carry an icon, whether the three are separate cards or one, and whether there is a close control.
 *
 * exists-check: `npm run exists "search panel"` = 0. Variant 0 reproduces the live component's own
 * recipe rather than redrawing it.
 *
 * Dev-only, notFound() in production. Nothing here is wired into the real sheet.
 */
import { notFound } from "next/navigation";
import PanelVariants from "./PanelVariants";

export default function SearchPanelPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Four search panels
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
        Airbnb&rsquo;s own search sheet was read on Mobbin first, not remembered. The first frame is
        what you have today. Nothing here touches the real one until you pick.
      </p>

      <PanelVariants />

      <section className="rounded-card bg-s-bg-sunken p-5">
        <h2 className="font-display text-[18px] font-semibold text-s-ink">My pick</h2>
        <p className="mt-2 max-w-[560px] font-body text-[15px] text-s-ink">
          A. It changes the three things Airbnb actually does differently and leaves the rest alone:
          a way to close it, the buttons on the backdrop rather than floating inside the sheet, and
          an icon on each closed row so the three questions stop looking like three identical grey
          bars.
        </p>
        <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
          Against my own pick: B and C are both calmer, and this project has spent months removing
          weight. A adds a control and a bar. If it feels busy on your phone, B is the quiet one.
        </p>
      </section>
    </main>
  );
}
