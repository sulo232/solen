// Shared types + helpers for the customer/guest refund-appeal flow (REFUND_APPEAL_PLAN
// §11–12). The three screens (entry form, status timeline, escalate states) all speak the
// same case shape returned by GET /api/bookings/[id]/report, so the contract lives here
// once. Money is INTEGER Rappen end-to-end (matches the API); only fmtMoney converts to
// CHF for display.

import type { ReactNode } from "react";

/**
 * Loose translator alias. next-intl's generated `useTranslations` return type only accepts
 * string-LITERAL keys (MessageKeys), which rejects the dynamic keys this flow builds (e.g.
 * `t(REASON_KEYS[r].t)`, `t(meta.pillKey)`). The codebase's established escape hatch is
 * `useTranslations(ns) as any`; this alias is the typed equivalent so helper signatures stay
 * readable while still allowing dynamic keys + `t.rich`.
 */
export type Tr = ((key: string, values?: Record<string, string | number>) => string) & {
  rich: (key: string, values?: Record<string, unknown>) => ReactNode;
};

export type ReasonCode =
  | "salon_cancelled"
  | "no_show_salon"
  | "not_delivered"
  | "wrong_amount"
  | "double_charge"
  | "quality"
  | "other";

export type DisputeStatus =
  | "open"
  | "salon_reviewing"
  | "salon_approved"
  | "salon_rejected"
  | "escalated"
  | "admin_approved"
  | "admin_rejected"
  | "refunded"
  | "charged"
  | "void"
  | "closed";

/** The refund-direction fields shaped by the report route's `shapeCase`. */
export interface CaseShape {
  id: string;
  booking_id: string;
  direction: "refund" | "upcharge";
  status: DisputeStatus;
  reason_code: ReasonCode | null;
  issue_type: string | null;
  eligibility: "eligible" | "discretionary" | "not_eligible" | null;
  fast_track_recommended: boolean;
  requested_amount: number | null; // Rappen
  resolved_amount: number | null; // Rappen
  description: string | null;
  salon_response: string | null;
  salon_responded_at: string | null;
  customer_response: string | null;
  customer_responded_at: string | null;
  escalated_at: string | null;
  admin_response: string | null;
  admin_responded_at: string | null;
  stripe_refund_id: string | null;
  expires_at: string | null;
  /** Computed, not a column: dispute-engine.ts's salonRespondsByDeadline(). null once
   * the salon has already responded (or the case never entered this stage). */
  salon_responds_by: string | null;
  /** Computed, not a column: dispute-engine.ts's salonResponseOverdue(). True once
   * salon_responds_by has already passed and the case is still open/salon_reviewing. */
  salon_response_overdue: boolean;
  created_at: string;
  updated_at: string;
}

/** One timeline row from `case_events`. */
export interface CaseEvent {
  id: string;
  actor_role: "customer" | "guest" | "salon" | "admin" | "system";
  action: string;
  from_status: string | null;
  to_status: string | null;
  amount: number | null; // Rappen
  note: string | null;
  created_at: string;
}

/** Booking display facts the report-route GET hands back (guest-safe). */
export interface BookingFacts {
  id: string;
  reference_code: string | null;
  status: string | null;
  starts_at: string | null;
  paid_amount: number; // Rappen
  refunded_amount: number; // Rappen
  currency: string;
  salon_name: string | null;
  salon_address: string | null;
  salon_city: string | null;
  salon_photo: string | null; // V3-D424: real salon photo (cover_photo_url); FE falls back to initials when null
  service_name: { de: string | null; en: string | null; fr: string | null; it: string | null } | null;
  staff_name: string | null;
}

export interface CaseResponse {
  case: CaseShape | null;
  events: CaseEvent[];
  booking: BookingFacts | null;
}

/** Rappen (integer) → localized CHF string. The API is Rappen; UI shows CHF. */
export function fmtMoney(rappen: number | null | undefined, locale: string): string {
  const chf = (rappen ?? 0) / 100;
  return new Intl.NumberFormat(locale === "en" ? "en-CH" : `${locale}-CH`, {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(chf);
}

/** Remaining refundable on a booking (Rappen). Mirrors the route's gate. */
export function remainingRefundable(b: BookingFacts | null): number {
  if (!b) return 0;
  return Math.max(0, (b.paid_amount ?? 0) - (b.refunded_amount ?? 0));
}

/** Localized service name with EN/DE fallback so a missing locale field never renders blank. */
export function serviceName(
  s: BookingFacts["service_name"] | null,
  locale: string,
): string | null {
  if (!s) return null;
  const key = locale as keyof typeof s;
  return s[key] ?? s.en ?? s.de ?? s.fr ?? s.it ?? null;
}

/** Localized date+time, e.g. "14 May, 10:30". null-safe. */
export function fmtDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-CH" : locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Localized date only, e.g. "30 May". null-safe. */
export function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-CH" : locale, {
    day: "numeric",
    month: "short",
  }).format(d);
}

/**
 * Outcome-driven amount color (universal-color convention — "color IS the message", V3-D425).
 * A case's focal amount inherits its OUTCOME automatically, so a declined case never shows a
 * neutral/blue number:
 *   declined / void → red (s-error) · refunded / approved / charged → green (s-success)
 *   · pending: open / in-review / escalated → blue (s-accent) · closed / unknown → neutral.
 * Returns a Tailwind text-color class. Use on the requested/resolved amount of any
 * status-bearing surface.
 */
export function caseAmountColor(status: string | null | undefined): string {
  switch (status) {
    case "salon_rejected":
    case "admin_rejected":
    case "void":
      return "text-s-error";
    case "salon_approved":
    case "admin_approved":
    case "refunded":
    case "charged":
      return "text-s-success";
    case "open":
    case "salon_reviewing":
    case "escalated":
      return "text-s-accent";
    default:
      return "text-s-ink-2";
  }
}

/**
 * Outcome-driven amount-CHIP classes (wrap bg+border + amount text) — the chip variant of
 * caseAmountColor, for the dashboard's pale amount chips. Same V3-D425 convention:
 *   declined/void → red · refunded/approved/charged → green · pending → blue · else neutral.
 */
export function caseChipClasses(status: string | null | undefined): { wrap: string; amount: string } {
  switch (status) {
    case "salon_rejected":
    case "admin_rejected":
    case "void":
      return { wrap: "bg-s-error-bg border-s-error/20", amount: "text-s-error" };
    case "salon_approved":
    case "admin_approved":
    case "refunded":
    case "charged":
      return { wrap: "bg-s-success-bg border-s-success/20", amount: "text-s-success" };
    case "open":
    case "salon_reviewing":
    case "escalated":
      return { wrap: "bg-s-accent-pale border-s-accent/20", amount: "text-s-accent" };
    default:
      return { wrap: "bg-s-bg-sunken border-s-border", amount: "text-s-ink-2" };
  }
}

/** Map a reason_code to its i18n title/desc key suffixes. */
export const REASON_KEYS: Record<ReasonCode, { t: string; d: string }> = {
  salon_cancelled: { t: "reasonSalonCancelledT", d: "reasonSalonCancelledD" },
  no_show_salon: { t: "reasonSalonCancelledT", d: "reasonSalonCancelledD" },
  not_delivered: { t: "reasonNotDeliveredT", d: "reasonNotDeliveredD" },
  wrong_amount: { t: "reasonWrongAmountT", d: "reasonWrongAmountD" },
  double_charge: { t: "reasonDoubleChargeT", d: "reasonDoubleChargeD" },
  quality: { t: "reasonQualityT", d: "reasonQualityD" },
  other: { t: "reasonOtherT", d: "reasonOtherD" },
};

/** Eligibility hint key by reason (review-first expectation setting). */
export function eligibilityKey(reason: ReasonCode): "eligGood" | "eligReview" | "eligDiscretionary" {
  switch (reason) {
    case "salon_cancelled":
    case "no_show_salon":
    case "not_delivered":
      return "eligGood";
    case "wrong_amount":
    case "double_charge":
      return "eligReview";
    case "quality":
    case "other":
    default:
      return "eligDiscretionary";
  }
}

/** The 14-day reporting window also gates escalation (REFUND_APPEAL_PLAN §12). */
export const ESCALATE_WINDOW_DAYS = 14;

/** Days left to escalate, measured from when the salon rejected. Clamped at 0. */
export function escalateDaysLeft(rejectedAtIso: string | null): number {
  if (!rejectedAtIso) return ESCALATE_WINDOW_DAYS;
  const rejected = new Date(rejectedAtIso).getTime();
  if (Number.isNaN(rejected)) return ESCALATE_WINDOW_DAYS;
  const deadline = rejected + ESCALATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
}
