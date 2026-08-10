// exists-check: net-new. D2 "Two-step sheet" , reason on its own step, THEN a dedicated
// detail step that also recaps a plain-language summary of what gets sent, THEN confirmation.
// Slower than D1, but the user sees exactly what they are submitting before committing, which
// suits an accusation (owner brief). Same real Sheet/RadioGroup/Radio/Textarea primitives.

"use client";

import * as React from "react";
import {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetCTARow,
  RadioGroup,
  Radio,
  Textarea,
} from "@/app/[locale]/_components/primitives";
import type { ReportReason } from "@/lib/content-reports";
import { REASON_OPTIONS, PRIMARY_CTA_CLASS, SECONDARY_CTA_CLASS, reasonLabel } from "./data";
import type { ReportedReview, Step } from "./types";
import { ReviewPreviewCard } from "./ReviewPreviewCard";
import { ReviewLine } from "./ReviewLine";
import { Confirmation } from "./Confirmation";

export function D2TwoStepSheet({
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
  const [inner, setInner] = React.useState<Step>(initialStep);
  // Deep-linked straight to step 2 or done needs a reason value to summarise; "other" is a
  // harness-only stand-in for that jump, real interaction always sets it via step 1 first.
  const [reason, setReason] = React.useState<ReportReason | "">(initialStep === "reason" ? "" : "other");
  const [details, setDetails] = React.useState("");

  const openSheet = () => {
    setInner("reason");
    setReason("");
    setDetails("");
    setOpen(true);
  };

  return (
    <div>
      <ReviewPreviewCard review={review} onReport={openSheet} />

      <Sheet isOpen={open} onOpenChange={setOpen} height="auto" aria-label="Report this review">
        {inner === "done" && (
          <>
            <SheetHeader title="Report this review" onClose={() => setOpen(false)} closeAriaLabel="Close" />
            <SheetBody>
              <Confirmation
                review={review}
                reason={(reason || "other") as ReportReason}
                details={details}
                density="medium"
              />
            </SheetBody>
            <SheetCTARow>
              <button type="button" onClick={() => setOpen(false)} className={PRIMARY_CTA_CLASS}>
                Done
              </button>
            </SheetCTARow>
          </>
        )}

        {inner === "reason" && (
          <>
            <SheetHeader title="Report this review" onClose={() => setOpen(false)} closeAriaLabel="Close">
              <span className="text-[14px] text-s-ink-2">Step 1 of 2, reason</span>
            </SheetHeader>
            <SheetBody>
              <ReviewLine review={review} />

              <p className="mt-4 text-[14px] font-semibold text-s-ink">Why are you reporting this?</p>
              <RadioGroup className="mt-2">
                {REASON_OPTIONS.map((r) => (
                  <Radio
                    key={r.value}
                    name="d2-reason"
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
            </SheetBody>
            <SheetCTARow>
              <button
                type="button"
                onClick={() => setInner("detail")}
                disabled={!reason}
                className={PRIMARY_CTA_CLASS}
              >
                Continue
              </button>
            </SheetCTARow>
          </>
        )}

        {inner === "detail" && (
          <>
            <SheetHeader title="Report this review" onClose={() => setOpen(false)} closeAriaLabel="Close">
              <span className="text-[14px] text-s-ink-2">Step 2 of 2, detail</span>
            </SheetHeader>
            <SheetBody>
              <ReviewPreviewCard review={review} />

              <div className="mt-4">
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

              <div className="mt-4 rounded-[12px] border border-s-border bg-s-bg-sunken p-3.5">
                <p className="text-[14px] font-semibold text-s-ink">What we will send</p>
                <p className="mt-1.5 text-[14px] text-s-ink-2">
                  Reason <span className="font-semibold text-s-ink">{reasonLabel((reason || "other") as ReportReason)}</span>
                </p>
                <p className="mt-1 text-[14px] text-s-ink-2">
                  Detail{" "}
                  <span className="font-semibold text-s-ink">
                    {details.trim() ? "the note above" : "none added"}
                  </span>
                </p>
                <p className="mt-1 text-[14px] text-s-ink-2">
                  Target <span className="font-semibold text-s-ink">review by {review.authorName}</span>
                </p>
              </div>
            </SheetBody>
            <SheetCTARow layout="secondary-and-primary">
              <button type="button" onClick={() => setInner("reason")} className={SECONDARY_CTA_CLASS}>
                Back
              </button>
              <button type="button" onClick={() => setInner("done")} className={PRIMARY_CTA_CLASS}>
                Send report
              </button>
            </SheetCTARow>
          </>
        )}
      </Sheet>
    </div>
  );
}
