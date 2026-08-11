/**
 * /dev/search-states , the three things he said about the search panel, each one as it is now next
 * to how it would be.
 *
 * Owner 2026-08-11: "ok i dont like how when hu tap the search sh is alredy open look at airbnb okay
 * and also i dont like the positioning of the dotts while searching yk the three dots i dont like it
 * andbalso when searchd n nth comes up n u close it still says nth yk n looks wierd research on
 * mobile view the searchbinsiede search in airbnb how they behave all the way."
 *
 * He asked for the research, so the research was run rather than recalled: ~44 iOS screens off
 * Mobbin this turn, across Airbnb (four separate search implementations), Fresha, Uber Eats,
 * Bluesky, Reddit, plus a 32-app no-results sweep and a 30-app loading-indicator survey. The three
 * findings that decided the three fixes:
 *
 *   1. Focus SUBTRACTS. Airbnb opens its sheet with the field unfocused and one list under it;
 *      Fresha drops its photo grid to a plain list the moment the field is tapped; Uber Eats drops
 *      its chips and rail to four recent rows. No captured shopping app opens search onto four
 *      stacked sections. A blank body exists only on address pickers.
 *   2. The clear X owns the field's right edge in 30 of 30 captures, and a progress indicator sitting
 *      past it appears zero times. Thirteen apps use placeholder rows and no indicator at all;
 *      Airbnb shows none across ten screens.
 *   3. Preserve while inside search, clear on exit, keep the query as a recent row. Bluesky and
 *      Reddit each show that full cycle end to end.
 *
 * Airbnb has NO captured typed-search no-results screen. That is named on the page rather than
 * filled in from memory.
 *
 * exists-check: `npm run exists "search states mockup"` = 0 (routes/APIs/components/graveyard);
 * `npm run exists "recent searches"` = 5, and the hook the recommendation needs already exists and
 * is already imported by the live overlay, so the net-new piece here is ordering, not a feature.
 *
 * Dev-only, notFound() in production. Nothing here is wired into the real panel.
 */
import { notFound } from "next/navigation";
import PanelStates from "./PanelStates";

export default function SearchStatesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1720px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        The search panel: what you flagged, and what the real apps do
      </h1>
      <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-s-ink-2">
        Three things, in the order you said them. Each one shows what ships today first, then the
        change, and every claim under it was counted off screens captured this turn rather than
        remembered. Where a screen could not be found, it says so.
      </p>
      <PanelStates />
    </main>
  );
}
