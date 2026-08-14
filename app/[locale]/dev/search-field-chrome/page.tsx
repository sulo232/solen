/**
 * /dev/search-field-chrome , the one control still undecided on the search panel.
 *
 * Owner 2026-08-11, morning, off /dev/search-field: he picked variant A, a filled grey capsule with
 * the way back OUTSIDE it. He answered with one letter.
 *
 * Owner 2026-08-11, night: "want full type ciew bro like in airbnb refference i gave u", with a
 * screenshot whose field is a WHITE BOX with a thin dark outline and the arrow INSIDE it.
 *
 * Both are his, eleven hours apart, and they disagree about this control and nothing else. The rest
 * of that reference (one sheet, the list filling the screen, no stacked cards) is already built and
 * shipped; this is the last piece, and it is not mine to settle, because settling it means undoing
 * something he chose the same day.
 *
 * THE REFERENCE IS MEASURED, not eyeballed: PIL over his own capture (IMG_7114) at 402x874pt gives
 * the field box at left 24.0, width 354, height 55.7, a 1px near-black border, and a corner radius
 * of about 15 taken off the arc. Column B is built to those numbers.
 *
 * exists-check: `npm run exists "search field chrome"` = 0. /dev/search-field is the earlier round
 * on the same control and stays; this is the next question, not a replacement.
 *
 * Dev-only, notFound() in production. Nothing here is wired into the live field.
 */
import { notFound } from "next/navigation";
import FieldChrome from "./FieldChrome";

export default function SearchFieldChromePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        The search field: your pick this morning, or your reference tonight
      </h1>
      <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-s-ink-2">
        Everything else from the screenshots is done. This is the one control the two of them
        disagree about. Each row shows the same field with nothing typed and mid-typing, so the
        difference is the field itself and not the list under it.
      </p>
      <FieldChrome />
    </main>
  );
}
