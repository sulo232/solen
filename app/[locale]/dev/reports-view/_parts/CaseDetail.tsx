"use client";

// exists-check: net-new vs the sample-report data model in ./data.ts (consumed, not
// duplicated) and TargetPreview/ReportActions in this same _parts/ folder (composed below).
// Shared by R2 (wraps this in a case-stepper) and R3 (wraps this in the right-hand pane) so
// the actual judgeable content is identical across both, only the surrounding navigation model
// differs, which is the whole point of the 3-direction comparison.

import * as React from "react";
import { AgeLabel, StatusChip, TargetTypeTag, reasonLabel } from "./Chips";
import { ReportActions } from "./ReportActions";
import { TargetPreview } from "./TargetPreview";
import type { SampleReport } from "./data";

export function CaseDetail({
  report,
  onDismiss,
  onMarkReviewing,
  onHide,
  onNotesChange,
}: {
  report: SampleReport;
  onDismiss: () => void;
  onMarkReviewing: () => void;
  onHide: () => void;
  onNotesChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <TargetTypeTag type={report.targetType} />
          <h3 className="mt-1 text-[15px] font-semibold text-s-ink">{reasonLabel(report.reason)}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusChip status={report.status} />
          <AgeLabel minutes={report.ageMinutes} status={report.status} />
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-s-ink-2">{report.details}</p>
      <p className="mt-1 font-mono-code text-[12px] text-s-ink-3">{report.reporterRef}</p>

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-semibold text-s-ink-2">Reported content</p>
        <TargetPreview target={report.target} />
      </div>

      <div className="mt-5">
        <ReportActions
          reportId={report.id}
          notes={report.adminNotes}
          onDismiss={onDismiss}
          onMarkReviewing={onMarkReviewing}
          onHide={onHide}
          onNotesChange={onNotesChange}
        />
      </div>
    </div>
  );
}
