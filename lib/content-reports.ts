// lib/content-reports.ts
// Single-source lifecycle + taxonomy module for the `content_reports` table (generic
// Trust & Safety report queue: a customer reports a salon/review/user, an admin triages
// it). Exists-check (rule 12, 2026-07-25): `content_reports` already exists
// (supabase/migrations/078_content_reports.sql, 0 rows live), already written by
// POST /api/reports (app/api/reports/route.ts). This module is the ONE place the
// report's status set, legal transitions, valid target types, and valid reasons live,
// matching the shape of lib/portfolio-categories.ts (the repo's other taxonomy
// single-source module) so the public report route, the admin API, the admin panel, and
// ReportButton.tsx never invent a status/reason/target string inline.
//
// Unlike lib/portfolio-categories.ts, this module does NOT embed per-locale display
// labels: every consumer here already renders through next-intl (dashboard admin pages,
// ReportButton), so display copy lives in messages/{de,en,fr,it}.json like every other
// UI string in the codebase, not as a second, competing source of truth. The "shape" this
// module borrows from portfolio-categories.ts is: one exported source of valid keys/types
// per axis, consumed everywhere, nothing else may re-declare it.
//
// STATUS NAMING (flagged per the project's "surface contradictions" rule, 2026-07-25):
// the live DB CHECK constraint on content_reports.status (078_content_reports.sql:10)
// already locks the four values below (pending / reviewed / action_taken / dismissed),
// NOT the "open / reviewing / actioned / dismissed" vocabulary named in this feature's
// build brief. Renaming the DB constraint was not requested and is not necessary: the
// four live DB values already cover exactly the four requested lifecycle stages 1:1
// (open==pending, reviewing==reviewed, actioned==action_taken, dismissed==dismissed), so
// this module uses the REAL, already-live DB strings rather than introduce a second,
// incompatible vocabulary that would fail the CHECK constraint on every write. Each
// status's `stage` field below documents that mapping explicitly.

// ─── Status ──────────────────────────────────────────────────────────────────
export const REPORT_STATUSES = ["pending", "reviewed", "action_taken", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Which of the brief's "open / reviewing / actioned / dismissed" lifecycle stages a live DB status value represents. */
export const REPORT_STATUS_STAGE: Record<ReportStatus, "open" | "reviewing" | "actioned" | "dismissed"> = {
  pending: "open",
  reviewed: "reviewing",
  action_taken: "actioned",
  dismissed: "dismissed",
};

/**
 * Legal status transitions. `pending` is the DB column default (every new report starts
 * here). `action_taken` and `dismissed` are normally terminal, but both can move back to
 * `reviewed` so an admin can reopen a call (e.g. a dismissed report gets new evidence);
 * nothing can jump straight from one terminal state to the other without passing back
 * through `reviewed` first, so the admin always re-confirms context before flipping a
 * closed report's outcome.
 */
export const REPORT_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  pending: ["reviewed", "action_taken", "dismissed"],
  reviewed: ["action_taken", "dismissed", "pending"],
  action_taken: ["reviewed"],
  dismissed: ["reviewed"],
};

/** `from === to` is always legal (a no-op status write, e.g. only admin_notes changed). */
export function isLegalReportStatusTransition(from: ReportStatus, to: ReportStatus): boolean {
  if (from === to) return true;
  return REPORT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Target types ────────────────────────────────────────────────────────────
// Mirrors the DB CHECK constraint on content_reports.target_type (078_content_reports.sql:4).
export const REPORT_TARGET_TYPES = ["salon", "review", "user"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

// ─── Reasons ─────────────────────────────────────────────────────────────────
// Mirrors the DB CHECK constraint on content_reports.reason (078_content_reports.sql:6-8).
export const REPORT_REASONS = ["inappropriate", "spam", "fake", "ip_violation", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
