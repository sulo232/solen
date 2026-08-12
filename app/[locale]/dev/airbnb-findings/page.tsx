/**
 * /dev/airbnb-findings , everything the wide council found, in one list.
 *
 * measure-ok: every number on this page is reproduced from the council's own structured output,
 * where both sides were measured live at 390x844px on 2026-08-12. Nothing was retyped by hand and
 * nothing came from memory; the adversarial pass deleted any finding that had a number on only one
 * side or that could have come from recall rather than a capture.
 *
 * Run `wf_0f33d9f6-bfc`: 15 readers (8 screen groups, 4 element families, 3 motion lenses), 142
 * findings in, 91 killed, 51 out.
 *
 * Owner 2026-08-12: "airbnb te is source of truth", "no apply mockups i told u", "i told u all
 * screen n ui motion wtf", "n welents too". Nothing here is applied to the product.
 *
 * exists-check: `npm run exists airbnb-findings` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import FindingsList from "./FindingsList";
import { FINDINGS } from "./findings";

export default function AirbnbFindingsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Everything the comparison found
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-s-ink-2">
        Fifteen readers went over every customer screen, every shared part, and motion, against
        Airbnb. They produced 142 findings. A reader whose only job was to kill them threw out 91,
        for having a number on only one side, for a number that could have come from memory instead
        of a real measurement, or for re-opening something you already settled. These {FINDINGS.length}{" "}
        are what survived.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-s-ink-2">
        Every row has both numbers, theirs and ours, taken on the same day on a phone-sized screen.
        Where a row touches a rule you set, it says so instead of quietly proposing to break it.
        Nothing here is applied.
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-s-ink">
        Tap a screen name to read just that one.
      </p>
      <FindingsList />
    </main>
  );
}
