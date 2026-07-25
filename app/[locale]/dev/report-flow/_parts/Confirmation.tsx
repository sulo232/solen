// exists-check: net-new. This is the beat the owner flagged as "empty today" (ReportButton.tsx
// today just does setOpen(false) + setReported(true), no confirmation content at all). Built to
// the LOCKED confirmation/EmptyState anatomy (project CLAUDE.md "states" row): SuccessMark
// (normal green #16A34A disc + white check, never a grey Lucide disc) + a promise headline
// (18/600) + a gesture subline, plus the 3 things the brief requires every direction to say:
// received, what happens next, anonymous to the salon. No invented timeline (no "24 hours"/
// "3 business days" anywhere , the product has no SLA to promise). No unlabelled case number.

import { Eye, ShieldCheck, Flag } from "lucide-react";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import type { ReportReason } from "@/lib/content-reports";
import { reasonLabel, sampleReference } from "./data";
import type { ReportedReview } from "./types";
import { cn } from "@/lib/utils";

// The 3 reassurance points (D3 "full" density only). Grounded, not fabricated: (1) is true
// because hiding a review is a separate admin action (hide_content in
// app/api/admin/reports/[id]/route.ts), never automatic on submit; (2) is true because
// content_reports has no salon-owner-facing surface anywhere in the app, only the admin
// queue (profiles.role === "admin") reads it; (3) is true because hide_content is a real,
// already-shipped admin action.
const POINTS = [
  { Icon: Eye, text: "The review stays visible while we look into it." },
  { Icon: ShieldCheck, text: "The salon is never told who reported it." },
  { Icon: Flag, text: "If it breaks our guidelines, we can remove it." },
];

export function Confirmation({
  review,
  reason,
  details,
  density,
}: {
  review: ReportedReview;
  reason: ReportReason;
  details: string;
  /** compact = D1 (fewest-ceremony sheet swap). medium = D2 (dedicated step already showed
   * the summary, so this recaps briefly). full = D3 (own page, most room for the promise). */
  density: "compact" | "medium" | "full";
}) {
  const hasNote = details.trim().length > 0;

  return (
    <div className={cn("flex flex-col items-center text-center", density === "full" ? "py-4" : "py-1")}>
      <SuccessMark size={density === "compact" ? 48 : 58} />

      <h3
        className="celebrate-rise mt-5 text-[18px] font-semibold text-s-ink"
        style={{ animationDelay: "0.10s" }}
      >
        Report received
      </h3>
      <p
        className="celebrate-rise mt-1.5 max-w-[320px] text-[14px] leading-relaxed text-s-ink-2"
        style={{ animationDelay: "0.18s" }}
      >
        Our support team will review it against Solen&apos;s content guidelines.
      </p>

      {density !== "compact" && (
        <div className="mt-5 w-full rounded-[12px] border border-s-border bg-s-bg-sunken p-3.5 text-left">
          <p className="text-[14px] text-s-ink-2">
            Reported as <span className="font-semibold text-s-ink">{reasonLabel(reason)}</span>
          </p>
          <p className="mt-1 truncate text-[14px] text-s-ink-2">
            Review by <span className="font-semibold text-s-ink">{review.authorName}</span>
          </p>
          <p className="mt-1 text-[14px] text-s-ink-2">
            Note: <span className="font-semibold text-s-ink">{hasNote ? "added" : "none added"}</span>
          </p>
        </div>
      )}

      {density === "full" ? (
        <div className="mt-5 flex w-full flex-col gap-3 text-left">
          {POINTS.map(({ Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <Icon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-s-ink-2" aria-hidden />
              <p className="text-[14px] leading-relaxed text-s-ink-2">{text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 max-w-[320px] text-[14px] leading-relaxed text-s-ink-2">
          It is anonymous, the salon is never told who reported it.
        </p>
      )}

      {density === "full" && (
        <p className="font-mono-code mt-5 text-[14px] text-s-ink-3">
          Sample reference {sampleReference(review.id)} (illustrative only)
        </p>
      )}
    </div>
  );
}
