"use client";

// exists-check: net-new vs CaseDetail.tsx (right pane, composed not duplicated) and
// primitives/TabPill.tsx (filter row, reused). No existing split-pane inbox primitive in the
// registry (Sheet/Modal are overlay primitives, not a persistent two-pane layout).

import * as React from "react";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { AgeLabel, StatusChip, TargetIconBadge, reasonLabel } from "./Chips";
import { CaseDetail } from "./CaseDetail";
import {
  SAMPLE_REPORTS,
  STATUS_FILTER_KEYS,
  filterLabel,
  initialOverlay,
  mergeReport,
  type ReportStatus,
} from "./data";

export function R3SplitInbox() {
  const [overlay, setOverlay] = React.useState(() => initialOverlay(SAMPLE_REPORTS));
  const [filter, setFilter] = React.useState<"all" | ReportStatus>("all");
  const [selectedId, setSelectedId] = React.useState(SAMPLE_REPORTS[0].id);
  const [mobileShowDetail, setMobileShowDetail] = React.useState(false);

  const merged = SAMPLE_REPORTS.map((r) => mergeReport(r, overlay[r.id]));
  const visible = filter === "all" ? merged : merged.filter((r) => r.status === filter);
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0];

  const setStatus = (id: string, status: ReportStatus) =>
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
  const setNotes = (id: string, adminNotes: string) =>
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], adminNotes } }));

  const selectRow = (id: string) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  };

  return (
    <div className="mx-auto max-w-[1160px] px-5 md:px-8">
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

      <div className="overflow-hidden rounded-card-lg border border-s-border bg-white md:grid md:h-[640px] md:grid-cols-[320px_1fr]">
        {/* Left: narrow scannable list */}
        <div
          className={cn(
            "md:overflow-y-auto md:border-r md:border-s-border",
            mobileShowDetail && "hidden md:block",
          )}
        >
          {visible.map((report) => {
            const isSelected = selected && report.id === selected.id;
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => selectRow(report.id)}
                aria-current={isSelected}
                className={cn(
                  "flex w-full items-start gap-2.5 border-b border-s-border px-4 py-3.5 text-left transition-colors last:border-b-0",
                  isSelected ? "bg-s-bg-sunken" : "hover:bg-s-bg-sunken/60",
                )}
              >
                <TargetIconBadge type={report.targetType} size={28} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-[14px]", isSelected ? "font-semibold text-s-ink" : "font-medium text-s-ink")}>
                    {reasonLabel(report.reason)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <AgeLabel minutes={report.ageMinutes} status={report.status} />
                    <StatusChip status={report.status} />
                  </span>
                </span>
                {isSelected && <Check size={16} strokeWidth={2.4} className="mt-1 shrink-0 text-s-ink" aria-hidden />}
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="px-4 py-8 text-center text-[14px] text-s-ink-2">No reports in this filter.</p>
          )}
        </div>

        {/* Right: full case detail */}
        <div className={cn("md:overflow-y-auto", !mobileShowDetail && "hidden md:block")}>
          {selected ? (
            <div className="p-4 md:p-5">
              <button
                type="button"
                onClick={() => setMobileShowDetail(false)}
                className="mb-4 inline-flex h-11 items-center gap-1.5 rounded-btn px-2 text-[15px] font-medium text-s-ink-2 hover:text-s-ink md:hidden"
              >
                <ArrowLeft size={16} strokeWidth={2} aria-hidden />
                Back to list
              </button>
              <CaseDetail
                report={selected}
                onDismiss={() => setStatus(selected.id, "dismissed")}
                onMarkReviewing={() => setStatus(selected.id, "reviewed")}
                onHide={() => setStatus(selected.id, "action_taken")}
                onNotesChange={(v) => setNotes(selected.id, v)}
              />
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-[14px] text-s-ink-2">Select a report from the list.</p>
          )}
        </div>
      </div>
    </div>
  );
}
