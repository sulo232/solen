// Shared types for the /dev/report-flow mockup. Net-new (exists-check on page.tsx).

/** Which of the 3 direction mockups is active. */
export type Direction = "1" | "2" | "3";

/** Which of the 3 real product beats is showing. Every direction accepts this as its
 * starting point so the confirmation is reachable without clicking through (mockup,
 * never writes to content_reports). */
export type Step = "reason" | "detail" | "done";

/** The review being reported, loaded server-side from the real `reviews` table
 * (lib/salon-detail.ts) via page.tsx, or a clearly-labelled representative fallback
 * when the fixture salon has no review text to load in this environment. */
export interface ReportedReview {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  rating: number;
  comment: string;
  /** Pre-formatted server-side in English (en-GB), never the shared de-CH formatter. */
  createdAtLabel: string;
  isRepresentative: boolean;
}
