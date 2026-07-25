"use client";

// exists-check: net-new vs CaseDetail.tsx (composed below, not duplicated) and data.ts's
// sample set. No existing "one item at a time with next/previous" primitive in the registry to
// extend (closest is the booking wizard's step model, which steps through FORM steps for one
// booking, not through a LIST of independent items, a different shape).

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CaseDetail } from "./CaseDetail";
import { SAMPLE_REPORTS, initialOverlay, mergeReport, type ReportStatus } from "./data";

const NAV_BTN =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-s-border bg-white text-s-ink transition-colors hover:bg-s-bg-sunken disabled:pointer-events-none disabled:opacity-40";

export function R2CaseCard() {
  const [overlay, setOverlay] = React.useState(() => initialOverlay(SAMPLE_REPORTS));
  const [index, setIndex] = React.useState(0);

  const total = SAMPLE_REPORTS.length;
  const base = SAMPLE_REPORTS[index];
  const current = mergeReport(base, overlay[base.id]);

  const setStatus = (id: string, status: ReportStatus) =>
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
  const setNotes = (id: string, adminNotes: string) =>
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], adminNotes } }));

  const goNext = () => setIndex((i) => Math.min(i + 1, total - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  // Resolving a case (dismiss / hide) moves the queue forward automatically, keeping the
  // sequential flow this direction is built around. "Mark reviewing" keeps you on the case,
  // it is a claim, not a resolution.
  const resolveAndAdvance = (status: ReportStatus) => {
    setStatus(current.id, status);
    if (index < total - 1) goNext();
  };

  return (
    <div className="mx-auto max-w-[680px] px-5 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={goPrev} disabled={index === 0} className={NAV_BTN} aria-label="Previous case">
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <p className="text-[15px] font-semibold text-s-ink">
          Case {index + 1} of {total}
        </p>
        <button
          type="button"
          onClick={goNext}
          disabled={index === total - 1}
          className={NAV_BTN}
          aria-label="Next case"
        >
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="rounded-card-lg border border-s-border bg-white p-4 md:p-5">
        <CaseDetail
          report={current}
          onDismiss={() => resolveAndAdvance("dismissed")}
          onMarkReviewing={() => setStatus(current.id, "reviewed")}
          onHide={() => resolveAndAdvance("action_taken")}
          onNotesChange={(v) => setNotes(current.id, v)}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={goNext}
          disabled={index === total - 1}
          className={cn(
            "inline-flex h-11 items-center gap-1.5 rounded-btn px-4 text-[15px] font-medium text-s-ink-2 transition-colors hover:bg-s-bg-sunken hover:text-s-ink disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          Skip to next case
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
