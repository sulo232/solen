/**
 * /dev/search-field , the field INSIDE the search panel, in each of its states.
 *
 * Owner 2026-08-11: "none, i mean when search is selected and diff states like while typing etc,
 * what i mostly hate is the searchbar in search." Then, when I fixed a bug instead of drawing it:
 * "u repeated urself, stop skipping abt what im saying, and also mockup i told you."
 *
 * Fair. He asked twice for a mockup of THIS control and got a panel-layout mockup the first time
 * and a bug fix the second. This is the thing he actually asked for: one column per direction, and
 * every state of the field stacked down each column, so the change is visible rather than described.
 *
 * REFERENCE READ ON MOBBIN THIS TURN, iOS, six apps, and they agree:
 *   Character AI, Twitch, KakaoTalk   filled grey capsule, back chevron OUTSIDE the field on the
 *                                     left, clear X inside on the right, suggestions each with a
 *                                     small magnifier, the typed part shown lighter than the rest
 *   Bloom                             same capsule, but the way out is the word Cancel beside it
 *   Corner                            dark filled capsule, magnifier inside, X outside
 *   Opera                             filled capsule, suggestions in a card underneath
 * The through-line: a focused search field becomes a FILLED capsule, the way out sits OUTSIDE it,
 * and the clear sits inside it.
 *
 * Ours today is the opposite on two of those three: a white box with a hairline, and the way out is
 * an arrow INSIDE the field sharing the row with the text.
 *
 * exists-check: `npm run exists "search field states"` = 0. Column 0 reproduces the live recipe out
 * of SearchOverlay.tsx rather than redrawing it.
 *
 * Dev-only, notFound() in production. Nothing here is wired into the real field.
 */
import { notFound } from "next/navigation";
import FieldStates from "./FieldStates";

export default function SearchFieldPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        The search field, state by state
      </h1>
      <p className="mt-3 max-w-[620px] font-body text-[15px] text-s-ink-2">
        The field inside the search panel, not the panel around it. Each column is one direction and
        every state runs down it: closed, focused and empty, and mid-typing with results. The first
        column is exactly what you have now.
      </p>
      <p className="mt-3 max-w-[620px] font-body text-[15px] text-s-ink-2">
        Six apps were read on Mobbin first. They agree on three things: a focused search field turns
        into a filled capsule, the way out sits outside the field, and the clear sits inside it.
        Ours does the opposite on two of the three.
      </p>

      <FieldStates />

      <section className="mt-10 rounded-card bg-s-bg-sunken p-5">
        <h2 className="font-display text-[18px] font-semibold text-s-ink">My pick</h2>
        <p className="mt-2 max-w-[600px] font-body text-[15px] text-s-ink">
          A. The filled capsule is the single biggest change: an empty field stops looking like a
          filled one, which is most of why the current states read as nothing happening. Moving the
          back chevron out of the field gives the text its own line back.
        </p>
        <p className="mt-3 max-w-[600px] font-body text-[15px] text-s-ink-2">
          Against my own pick: B is the more familiar one on iOS, because it is what the system
          keyboard search does, and a word is easier to understand than a chevron. It costs width,
          and German is the longest of our four languages.
        </p>
      </section>
    </main>
  );
}
