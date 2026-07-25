// exists-check: `npm run exists reports-view` = 0 hits (net-new dev route). `npm run exists
// content_reports` = 1 hit, the LIVE table (0 rows, RLS on) this mockup renders sample rows for.
// `npm run exists report` surfaces the UNRELATED customer "report a booking problem" flow
// (booking_disputes / /bookings/[id]/report) which is a different feature, not touched here.
//
// SCHEMA CORRECTION (measured against the live migration, not the task brief): the brief's
// domain facts said target types are "review, salon, a discovery post" and statuses are
// "open, reviewing, actioned, dismissed". The live migration
// (supabase/migrations/078_content_reports.sql, the only migration touching this table) has
// DIFFERENT literal values:
//   target_type CHECK IN ('salon', 'review', 'user')   <- 'user', NOT 'discovery post'
//   reason      CHECK IN ('inappropriate','spam','fake','ip_violation','other')
//   status      CHECK IN ('pending','reviewed','action_taken','dismissed') DEFAULT 'pending'
// Used the REAL three target types (review / salon / user, no discovery-post target exists yet)
// instead of inventing one outside the live CHECK constraint. Kept the brief's status WORDS
// (open/reviewing/actioned/dismissed) as the English DISPLAY labels mapped onto the real enum
// (STATUS_LABEL below) since that reads as the intended display vocabulary, not a literal
// schema claim.
//
// LANGUAGE NOTE (deviation from the task brief, forced by a hard gate): the brief said the
// mocked product copy inside the rows could be German ("the real admin panel is German"). The
// repo's global mockup-english-gate.py (owner rule 2026-07-24, "the mockup is in german ...
// always in english") blocks ANY non-English text in a /dev/ mockup file, no override flag, no
// escape hatch. That gate outranks the brief here, so every string below, including the
// reporter's free-text `details`, the reported review/bio copy, and `adminNotes`, is English.
// This mockup would render the real admin panel's German via i18n/t() the same way every other
// shipped Solen surface does; only this hardcoded preview stays English.

export type ReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed";
export type TargetType = "review" | "salon" | "user";
export type ReportReason = "inappropriate" | "spam" | "fake" | "ip_violation" | "other";

export interface TargetContent {
  type: TargetType;
  refCode: string;
  // review
  reviewAuthor?: string;
  reviewRating?: number;
  reviewText?: string;
  reviewHasPhoto?: boolean;
  // review + salon share a salon reference
  salonName?: string;
  salonCategory?: string;
  salonBio?: string;
  // user
  userDisplayName?: string;
  userBio?: string;
}

export interface SampleReport {
  id: string;
  targetType: TargetType;
  reason: ReportReason;
  /** Reporter's free-text explanation. */
  details: string;
  /** Neutral system-style reference, never a real-looking person name. */
  reporterRef: string;
  /** Minutes since the report was filed. A plain number, not a Date, so the mockup never
   *  depends on wall-clock time or risks an SSR/CSR hydration mismatch. */
  ageMinutes: number;
  status: ReportStatus;
  adminNotes: string;
  target: TargetContent;
}

// The display words for the real DB enum values.
export const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "Open",
  reviewed: "Reviewing",
  action_taken: "Actioned",
  dismissed: "Dismissed",
};

// The reason a reporter picks from a fixed list.
export const REASON_LABEL: Record<ReportReason, string> = {
  inappropriate: "Inappropriate content",
  spam: "Spam",
  fake: "Fake",
  ip_violation: "IP violation",
  other: "Other",
};

// The taxonomy word next to the target-type icon.
export const TARGET_LABEL: Record<TargetType, string> = {
  review: "Review",
  salon: "Salon",
  user: "User",
};

export const STATUS_FILTER_KEYS: Array<"all" | ReportStatus> = [
  "all",
  "pending",
  "reviewed",
  "action_taken",
  "dismissed",
];

export function filterLabel(key: "all" | ReportStatus): string {
  return key === "all" ? "All" : STATUS_LABEL[key];
}

/** "45m ago" / "6h ago" / "12d ago" / "4w ago". Coarse on purpose, this is a queue, not a log. */
export function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(minutes / (60 * 24));
  if (days < 30) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

/** The signal the brief calls out: a report sitting OPEN for 3+ days. Resolved reports never
 *  read as stale, no matter how old, the age there is just history. */
export function isStale(minutes: number, status: ReportStatus): boolean {
  return (status === "pending" || status === "reviewed") && minutes >= 3 * 24 * 60;
}

/** Overlay = the admin-editable slice of a report (status + notes), kept separate from the
 *  base sample so each direction can hold its own local interaction state independently. */
export interface ReportOverlay {
  status: ReportStatus;
  adminNotes: string;
}

export function initialOverlay(reports: SampleReport[]): Record<string, ReportOverlay> {
  return Object.fromEntries(
    reports.map((r) => [r.id, { status: r.status, adminNotes: r.adminNotes }]),
  );
}

export function mergeReport(base: SampleReport, overlay: ReportOverlay | undefined): SampleReport {
  if (!overlay) return base;
  return { ...base, status: overlay.status, adminNotes: overlay.adminNotes };
}

// Sample content_reports rows (content_reports has 0 live rows in dev). Reporter refs and
// author labels are neutral system-style tags, never invented "real" names. Salon names are
// generic and fictional, reused across a couple of reports on purpose (repeat targets/repeat
// reporters are realistic in a moderation queue).
export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: "r1",
    targetType: "review",
    reason: "inappropriate",
    details: "The review contains insulting language directed at the team.",
    reporterRef: "Reporter #A214",
    ageMinutes: 3 * 24 * 60,
    status: "pending",
    adminNotes: "",
    target: {
      type: "review",
      refCode: "rev_4f21ab",
      reviewAuthor: "User M.",
      reviewRating: 1,
      reviewText: "The team is incompetent and rude, absolutely disgraceful, never again!!!",
      salonName: "Salon Rossi",
      salonCategory: "Hair salon",
    },
  },
  {
    id: "r2",
    targetType: "salon",
    reason: "fake",
    details: "I think this salon profile isn't real, the photos look like stock images.",
    reporterRef: "Reporter #B097",
    ageMinutes: 20 * 60,
    status: "reviewed",
    adminNotes: "",
    target: {
      type: "salon",
      refCode: "sal_88c103",
      salonName: "Studio Nord",
      salonCategory: "Hair salon",
      salonBio: "Modern studio in the heart of the city, specializing in color treatments.",
    },
  },
  {
    id: "r3",
    targetType: "user",
    reason: "spam",
    details: "This profile leaves the same promotional message on multiple salons.",
    reporterRef: "Reporter #C558",
    ageMinutes: 2 * 24 * 60,
    status: "pending",
    adminNotes: "",
    target: {
      type: "user",
      refCode: "usr_2210fe",
      userDisplayName: "User K.",
      userBio: "Check out my offer, grab a discount: bit.ly/xyz123",
    },
  },
  {
    id: "r4",
    targetType: "review",
    reason: "ip_violation",
    details: "The photo in this review is from my own salon account, used without permission.",
    reporterRef: "Reporter #A881",
    ageMinutes: 6 * 24 * 60,
    status: "pending",
    adminNotes: "",
    target: {
      type: "review",
      refCode: "rev_9a02cc",
      reviewAuthor: "User T.",
      reviewRating: 5,
      reviewText: "Great result, highly recommend!",
      reviewHasPhoto: true,
      salonName: "BarberHaus",
      salonCategory: "Barbershop",
    },
  },
  {
    id: "r5",
    targetType: "salon",
    reason: "inappropriate",
    details: "The profile description has a phone number outside the platform, that shouldn't be allowed.",
    reporterRef: "Reporter #D310",
    ageMinutes: 45,
    status: "pending",
    adminNotes: "",
    target: {
      type: "salon",
      refCode: "sal_5d77e1",
      salonName: "Nails & Co",
      salonCategory: "Nail salon",
      salonBio: "Call us directly for special rates outside the app: 079 XXX XX XX.",
    },
  },
  {
    id: "r6",
    targetType: "review",
    reason: "other",
    details: "This review was clearly posted on the wrong salon.",
    reporterRef: "Reporter #B097",
    ageMinutes: 9 * 24 * 60,
    status: "action_taken",
    adminNotes: "Review was actually meant for a different studio, removed and the user was informed.",
    target: {
      type: "review",
      refCode: "rev_11c4be",
      reviewAuthor: "User P.",
      reviewRating: 2,
      reviewText: "Came in last week for a manicure, wasn't happy with it.",
      salonName: "Studio Nord",
      salonCategory: "Hair salon",
    },
  },
  {
    id: "r7",
    targetType: "user",
    reason: "fake",
    details: "Profile photo looks copied from the internet, reads like a fake account.",
    reporterRef: "Reporter #E772",
    ageMinutes: 4 * 60,
    status: "pending",
    adminNotes: "",
    target: {
      type: "user",
      refCode: "usr_c204af",
      userDisplayName: "User Z.",
      userBio: "Beauty enthusiast, follow me for tips.",
    },
  },
  {
    id: "r8",
    targetType: "salon",
    reason: "spam",
    details: "Too many offers running at once, reads like spam.",
    reporterRef: "Reporter #C558",
    ageMinutes: 12 * 24 * 60,
    status: "dismissed",
    adminNotes: "No policy violation, all campaigns are valid and active.",
    target: {
      type: "salon",
      refCode: "sal_71e9b4",
      salonName: "Beauty Lounge West",
      salonCategory: "Beauty salon",
      salonBio: "Currently running 5 discount campaigns at once.",
    },
  },
  {
    id: "r9",
    targetType: "review",
    reason: "inappropriate",
    details: "The review names the staff member by full name in a negative context.",
    reporterRef: "Reporter #A214",
    ageMinutes: 1 * 24 * 60,
    status: "reviewed",
    adminNotes: "",
    target: {
      type: "review",
      refCode: "rev_7d05a2",
      reviewAuthor: "User H.",
      reviewRating: 1,
      reviewText: "Staff member missed the appointment, completely unprofessional.",
      salonName: "BarberHaus",
      salonCategory: "Barbershop",
    },
  },
  {
    id: "r10",
    targetType: "user",
    reason: "ip_violation",
    details: "Profile photo is copyrighted material.",
    reporterRef: "Reporter #F004",
    ageMinutes: 30 * 24 * 60,
    status: "dismissed",
    adminNotes: "Photo was an unwatermarked stock photo, no violation found.",
    target: {
      type: "user",
      refCode: "usr_5b9a71",
      userDisplayName: "User W.",
      userBio: "",
    },
  },
];
