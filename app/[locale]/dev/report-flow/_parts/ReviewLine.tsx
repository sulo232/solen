// exists-check: net-new, a compact companion to ReviewPreviewCard.tsx in this same folder
// (that one is the full card; this is the one-line "what you're reporting" reference D1's
// combined screen and D2's reason step use so the user never loses context while picking a
// reason, without repeating the full card twice in a short sheet).
//
// No <Avatar> here on purpose (measured fix): Avatar's numeric-size fallback-initials font
// scales as round(px*0.4), so a small 24px avatar rendered a 5th distinct font size (10px)
// on this screen the moment a review had no photo, breaking the project's <=4-size floor.
// Text alone already carries the context; Flag is a fixed-size icon, not text.

import { Flag } from "lucide-react";
import type { ReportedReview } from "./types";

export function ReviewLine({ review }: { review: ReportedReview }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] bg-s-bg-sunken px-3 py-2.5">
      <Flag size={14} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
      <p className="min-w-0 truncate text-[14px] text-s-ink-2">
        Reporting a review by <span className="font-semibold text-s-ink">{review.authorName}</span>
      </p>
    </div>
  );
}
