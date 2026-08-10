// exists-check: net-new vs supabase/migrations/078_content_reports.sql (the real
// content_reports table this mockup targets, unmodified) and _design-system/_drift-report.md
// (a static drift report, unrelated). `npm run exists report` (run before this route was
// scaffolded) surfaced only the admin queue (dev/reports-view) and the customer booking-
// dispute flow (bookings/[id]/report) , no customer-facing review/salon report SCREEN
// exists yet, which is this task. This file is the single data source (real REPORT_REASONS
// taxonomy + shared copy/helpers) all 3 direction mockups read from, so they never drift.
//
// Shared data + tiny helpers for the /dev/report-flow mockup.

import { REPORT_REASONS, type ReportReason } from "@/lib/content-reports";
import { cn } from "@/lib/utils";

export interface ReasonOption {
  value: ReportReason;
  /** Exact copy from messages/en.json `report.reason*` , grounded, not invented. */
  label: string;
  /** One-line clarification authored for this mockup. Only D2 step 2 and D3 render it;
   * D1 stays label-only to match its "fewest taps, least ceremony" brief. */
  hint: string;
}

// messages/en.json `report.reason*` (verbatim), mapped through the real
// lib/content-reports.ts REPORT_REASONS order so this can never list a reason the
// content_reports CHECK constraint would reject.
const REASON_LABEL: Record<ReportReason, string> = {
  inappropriate: "Inappropriate",
  spam: "Spam",
  fake: "Fake",
  ip_violation: "IP violation",
  harassment: "Harassment",
  other: "Other",
};

const REASON_HINT: Record<ReportReason, string> = {
  inappropriate: "Offensive, hateful, or explicit content",
  spam: "Promotional, repetitive, or irrelevant content",
  fake: "Does not read like a genuine visit or experience",
  ip_violation: "Uses photos or text that are not the reviewer's own",
  harassment: "Threats, abuse, or unsafe behavior toward a person",
  other: "Something else not covered above",
};

export const REASON_OPTIONS: ReasonOption[] = REPORT_REASONS.map((value) => ({
  value,
  label: REASON_LABEL[value],
  hint: REASON_HINT[value],
}));

export function reasonLabel(reason: ReportReason): string {
  return REASON_LABEL[reason];
}

/** English date, deliberately NOT the shared salon/_shared.ts formatReviewDate (that one
 * is hardcoded "de-CH" and would render German month/weekday names into this English-only
 * mockup). Same underlying created_at value, English locale only. */
export function formatEnglishDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

/** A SAMPLE reference code shown only on the D3 full confirmation, always labelled
 * "sample" / "illustrative" at the call site , the brief bans an unlabelled invented
 * case number, not a labelled illustrative one. Deterministic from the real review id so
 * it does not shift on every re-render. */
export function sampleReference(reviewId: string): string {
  const hex = reviewId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `RPT-${hex || "1A2B3C"}`;
}

// One shared commit-CTA look across all 3 directions (the ONE ink commit button per
// design contract), so the 3 mockups differ in STRUCTURE, never in button treatment.
export const PRIMARY_CTA_CLASS = cn(
  "inline-flex flex-1 h-12 items-center justify-center rounded-full bg-s-ink px-6",
  "font-body text-[15px] font-semibold text-white transition-colors duration-150",
  "hover:bg-black disabled:cursor-not-allowed disabled:opacity-50",
);

export const SECONDARY_CTA_CLASS = cn(
  "inline-flex flex-1 h-12 items-center justify-center rounded-full border border-s-border bg-white px-6",
  "font-body text-[15px] font-semibold text-s-ink-2 transition-colors duration-150",
  "hover:bg-s-bg-sunken hover:text-s-ink",
);
