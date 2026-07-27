// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.
// Server-renderable, no client state , pure data-to-markup for the captured evidence.

import { EVIDENCE_ROWS } from "./speeds";

/**
 * EvidenceTable , page section 3. Renders the measured evidence (`speeds.ts` EVIDENCE_ROWS,
 * copied verbatim from `_plans/MOTION_LAW.md`'s "CAPTURED, LIVE" table) so the owner sees the
 * ladder + tier recommendation come from measurement, not taste.
 */
export function EvidenceTable() {
  return (
    <section className="rounded-2xl border border-s-border bg-white p-4">
      <p className="font-body text-[12px] font-semibold text-s-ink-2">Section 3</p>
      <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
        The evidence
      </h2>
      <p className="mt-1 font-body text-[13px] leading-[1.4] text-s-ink-2">
        Computed transition styles, read off the real products in a 390x844 mobile web viewport
        (Playwright), plus the owner&apos;s own screen recording.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-s-border">
              <th className="py-2 pr-3 font-body text-[12px] font-semibold text-s-ink-2">Source</th>
              <th className="py-2 pr-3 font-body text-[12px] font-semibold text-s-ink-2">Speeds observed</th>
              <th className="py-2 font-body text-[12px] font-semibold text-s-ink-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {EVIDENCE_ROWS.map((row) => (
              <tr key={row.source} className="border-b border-s-border last:border-0">
                <td className="py-2.5 pr-3 align-top font-body text-[13px] font-semibold text-s-ink">
                  {row.source}
                </td>
                <td className="py-2.5 pr-3 align-top font-body text-[13px] tabular-nums text-s-ink-2">
                  {row.speeds}
                </td>
                <td className="py-2.5 align-top font-body text-[13px] text-s-ink-2">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 font-body text-[13px] leading-[1.5] text-s-ink-2">
        X is fast and uniform because it is a feed you scan, motion must never stand between you
        and the next post. Airbnb is slower and tiered because it is a product you browse, the
        reveal is part of the pleasure. So &quot;fast = polished&quot; is false, the rule is
        matching speed to the job. Our docs are missing the fast tier entirely (nothing under
        180ms) while being roughly right at the slow end. Our code already has a fast tier
        (150ms x335, 80ms x35), which is why the code feels better today than the docs alone would
        produce.
      </p>
    </section>
  );
}
