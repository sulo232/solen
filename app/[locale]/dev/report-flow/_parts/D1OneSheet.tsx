// exists-check: net-new. D1 "One sheet, one screen" , reason + optional note on ONE screen,
// one commit button, the sheet's own content swaps to the confirmation in place. Fewest taps,
// least ceremony (owner brief). Reuses the real Sheet/RadioGroup/Radio/Textarea primitives
// (app/[locale]/_components/primitives) , never a from-scratch redraw.

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
import { REASON_OPTIONS, PRIMARY_CTA_CLASS } from "./data";
import type { ReportedReview, Step } from "./types";
import { ReviewPreviewCard } from "./ReviewPreviewCard";
import { ReviewLine } from "./ReviewLine";
import { Confirmation } from "./Confirmation";

export function D1OneSheet({
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
  const [submitted, setSubmitted] = React.useState(initialStep === "done");
  const [reason, setReason] = React.useState<ReportReason | "">(initialStep === "reason" ? "" : "other");
  const [details, setDetails] = React.useState("");

  const openSheet = () => {
    setSubmitted(false);
    setReason("");
    setDetails("");
    setOpen(true);
  };

  const send = () => {
    if (!reason) return;
    setSubmitted(true);
  };

  return (
    <div>
      <ReviewPreviewCard review={review} onReport={openSheet} />

      <Sheet
        isOpen={open}
        onOpenChange={setOpen}
        height="auto"
        aria-label="Report this review"
      >
        <SheetHeader title="Report this review" onClose={() => setOpen(false)} closeAriaLabel="Close" />

        {submitted ? (
          <>
            <SheetBody>
              <Confirmation
                review={review}
                reason={(reason || "other") as ReportReason}
                details={details}
                density="compact"
              />
            </SheetBody>
            <SheetCTARow>
              <button type="button" onClick={() => setOpen(false)} className={PRIMARY_CTA_CLASS}>
                Done
              </button>
            </SheetCTARow>
          </>
        ) : (
          <>
            <SheetBody>
              <ReviewLine review={review} />

              <p className="mt-4 text-[14px] font-semibold text-s-ink">Why are you reporting this?</p>
              <RadioGroup className="mt-2">
                {REASON_OPTIONS.map((r) => (
                  <Radio
                    key={r.value}
                    name="d1-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className={reason === r.value ? "bg-s-bg-sunken" : undefined}
                  >
                    {r.label}
                  </Radio>
                ))}
              </RadioGroup>

              {/* copy-ok: no "(optional)" tag (copy-economy rule) , the field has no
                  required-marker anywhere on this screen, so the absence itself reads as
                  optional; aria-label below still says "optional" for a screen-reader user
                  who cannot see that absence. */}
              <div className="mt-4">
                <p className="text-[14px] font-semibold text-s-ink">Add detail</p>
                <Textarea
                  className="mt-2"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  placeholder="What went wrong?"
                  aria-label="Detail, optional"
                />
              </div>
            </SheetBody>
            <SheetCTARow>
              <button type="button" onClick={send} disabled={!reason} className={PRIMARY_CTA_CLASS}>
                Send report
              </button>
            </SheetCTARow>
          </>
        )}
      </Sheet>
    </div>
  );
}
