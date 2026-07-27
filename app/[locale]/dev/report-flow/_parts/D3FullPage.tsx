// exists-check: net-new. D3 "Full page" , report is its own route, not a sheet: the reported
// content stays pinned at the top for certainty, reasons render as a full list, detail below,
// then a full confirmation screen. Most serious in tone, most room for the "what happens next"
// copy (owner brief). Same real RadioGroup/Radio/Textarea primitives as D1/D2; no Sheet/Modal
// here on purpose, this direction is deliberately NOT an overlay.

"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { RadioGroup, Radio, Textarea } from "@/app/[locale]/_components/primitives";
import type { ReportReason } from "@/lib/content-reports";
import { REASON_OPTIONS, PRIMARY_CTA_CLASS } from "./data";
import type { ReportedReview, Step } from "./types";
import { ReviewPreviewCard } from "./ReviewPreviewCard";
import { Confirmation } from "./Confirmation";
import { cn } from "@/lib/utils";

export function D3FullPage({
  review,
  initialStep,
  initialOpen,
}: {
  review: ReportedReview;
  initialStep: Step;
  /** True only when the URL explicitly requested a beat (the "Jump to beat" pills, incl.
   * "1 Reason"); a bare page load shows the realistic closed trigger instead. */
  initialOpen: boolean;
}) {
  const [open, setOpen] = React.useState(initialOpen);
  const [done, setDone] = React.useState(initialStep === "done");
  const [reason, setReason] = React.useState<ReportReason | "">("");
  const [details, setDetails] = React.useState("");

  const openPage = () => {
    setDone(false);
    setReason("");
    setDetails("");
    setOpen(true);
  };

  if (!open) {
    return <ReviewPreviewCard review={review} onReport={openPage} />;
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-s-border bg-white">
      <div className="flex items-center gap-3 border-b border-s-border px-4 py-4">
        <button
          type="button"
          onClick={() => (done ? setDone(false) : setOpen(false))}
          aria-label="Back"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken"
        >
          <ArrowLeft size={20} strokeWidth={2.1} aria-hidden />
        </button>
        <h2 className="text-[18px] font-semibold text-s-ink">Report this review</h2>
      </div>

      <div className="px-4 py-5">
        {done ? (
          <>
            <Confirmation
              review={review}
              reason={(reason || "other") as ReportReason}
              details={details}
              density="full"
            />
            <button type="button" onClick={() => setOpen(false)} className={cn(PRIMARY_CTA_CLASS, "mt-6 w-full")}>
              Done
            </button>
          </>
        ) : (
          <>
            <p className="text-[14px] font-semibold text-s-ink-2">Reported content</p>
            <div className="mt-2">
              <ReviewPreviewCard review={review} />
            </div>

            <p className="mt-6 text-[14px] font-semibold text-s-ink">Why are you reporting this?</p>
            <RadioGroup className="mt-2">
              {REASON_OPTIONS.map((r) => (
                <Radio
                  key={r.value}
                  name="d3-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className={reason === r.value ? "bg-s-bg-sunken" : undefined}
                >
                  <span className="block">{r.label}</span>
                  <span className="block font-normal text-[14px] text-s-ink-2">{r.hint}</span>
                </Radio>
              ))}
            </RadioGroup>

            <div className="mt-6">
              <p className="text-[14px] font-semibold text-s-ink">Add detail</p>
              <Textarea
                className="mt-2"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="What went wrong?"
                aria-label="Detail, optional"
              />
            </div>

            <button
              type="button"
              onClick={() => setDone(true)}
              disabled={!reason}
              className={cn(PRIMARY_CTA_CLASS, "mt-6 w-full")}
            >
              Send report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
