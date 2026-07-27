"use client";

// exists-check: net-new vs primitives/TabPill.tsx (REUSED for the filter row, its `active`
// treatment already IS the brief's locked selected grammar) and dashboard/DashboardUI.tsx's
// DashRow (a hairline-divided row pattern; not reused directly because DashRow is a single
// `<Link>`/`<div>` row and this row needs an in-place expand panel that is a SIBLING, not a
// child, of the clickable header, which DashRow's API does not support).

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { AgeLabel, StatusChip, TargetIconBadge, TargetTypeTag, reasonLabel } from "./Chips";
import { ReportActions } from "./ReportActions";
import { TargetPreview } from "./TargetPreview";
import {
  SAMPLE_REPORTS,
  STATUS_FILTER_KEYS,
  filterLabel,
  initialOverlay,
  mergeReport,
  type ReportStatus,
} from "./data";

function Row({
  report,
  defaultOpen,
  onDismiss,
  onMarkReviewing,
  onHide,
  onNotesChange,
}: {
  report: ReturnType<typeof mergeReport>;
  defaultOpen?: boolean;
  onDismiss: () => void;
  onMarkReviewing: () => void;
  onHide: () => void;
  onNotesChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div className="border-b border-s-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-s-bg-sunken"
      >
        <TargetIconBadge type={report.targetType} size={32} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{reasonLabel(report.reason)}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <TargetTypeTag type={report.targetType} />
            <span className="font-mono-code text-[12px] text-s-ink-2">{report.reporterRef}</span>
            <AgeLabel minutes={report.ageMinutes} status={report.status} />
          </span>
        </span>
        <StatusChip status={report.status} className="mt-0.5" />
        <Chevron size={16} strokeWidth={2} className="mt-1.5 shrink-0 text-s-ink-2" aria-hidden />
      </button>
      {open && (
        <div className="border-t border-s-border bg-s-bg-sunken/50 px-4 py-4">
          <p className="text-[14px] leading-relaxed text-s-ink-2">{report.details}</p>
          <div className="mt-3">
            <TargetPreview target={report.target} />
          </div>
          <ReportActions
            reportId={report.id}
            notes={report.adminNotes}
            onDismiss={onDismiss}
            onMarkReviewing={onMarkReviewing}
            onHide={onHide}
            onNotesChange={onNotesChange}
            className="mt-3"
          />
        </div>
      )}
    </div>
  );
}

export function R1Triage() {
  const [overlay, setOverlay] = React.useState(() => initialOverlay(SAMPLE_REPORTS));
  const [filter, setFilter] = React.useState<"all" | ReportStatus>("all");

  const merged = SAMPLE_REPORTS.map((r) => mergeReport(r, overlay[r.id]));
  const visible = filter === "all" ? merged : merged.filter((r) => r.status === filter);

  const setStatus = (id: string, status: ReportStatus) =>
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
  const setNotes = (id: string, adminNotes: string) =>
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], adminNotes } }));

  return (
    <div className="mx-auto max-w-[760px] px-5 md:px-8">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTER_KEYS.map((key) => {
          const count = key === "all" ? merged.length : merged.filter((r) => r.status === key).length;
          return (
            <TabPill key={key} active={filter === key} onClick={() => setFilter(key)} size="md">
              {filterLabel(key)} ({count})
            </TabPill>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-card-lg border border-s-border bg-white">
        {visible.map((report, i) => (
          <Row
            key={report.id}
            report={report}
            defaultOpen={i === 0}
            onDismiss={() => setStatus(report.id, "dismissed")}
            onMarkReviewing={() => setStatus(report.id, "reviewed")}
            onHide={() => setStatus(report.id, "action_taken")}
            onNotesChange={(v) => setNotes(report.id, v)}
          />
        ))}
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center text-[14px] text-s-ink-2">No reports in this filter.</p>
        )}
      </div>
    </div>
  );
}
