"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonHeader.tsx (real, unmodified).
// `npm run exists` (2026-07-24) confirms SalonHeader is the single PDP hero-strip. This copy
// changes ONE thing per the research spec (green-inconsistency fix): it renders
// StatusInlineOverhaul (repointed to the s-success token, see that file's header for the
// gate-forced deviation from the research's cited literal) instead of the real StatusInline, so
// the header's open-status word matches the other greens on this mockup. aria-labels are
// re-authored in English per mockup law (the real component hardcodes German). Everything else
// is structurally identical to the shipped component.

import * as React from "react";
import { MapPin, Share } from "lucide-react";
import { RatingStars } from "../../../_components/primitives";
import { HeartButton } from "../../../_components/homepage/HeartButton";
import { StatusInlineOverhaul } from "./StatusInlineOverhaul";
import type { SalonDetail, OpenStatus } from "../../../_components/salon/_shared";
import { shareOrCopy } from "@/lib/share";

export function SalonHeaderOverhaul({
  salon,
  openStatus,
}: {
  salon: SalonDetail;
  /** Precomputed server-side (2026-07-04 hydration fix); never call
   * computeOpenStatus()/new Date() again here. See lib/salon-detail.ts. */
  openStatus: OpenStatus;
}) {
  const status = openStatus;
  const fullAddress = salon.address;

  const scrollToReviews = React.useCallback(() => {
    const el = document.getElementById("section-reviews");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToHours = React.useCallback(() => {
    const el = document.getElementById("section-hours");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToLocation = React.useCallback(() => {
    const el = document.getElementById("section-location");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <header className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.05] tracking-[-0.02em] text-s-ink">
            {salon.name}
          </h1>

          <div className="font-body mt-3 space-y-1.5 text-[14px] text-s-ink-2 md:text-[15px]">
            <div className="flex items-center gap-1.5">
              {salon.average_rating != null ? (
                <strong className="font-semibold text-s-ink">
                  {/* psych-ok: structurally identical to the real shipped SalonHeader.tsx, the (N) reviews count renders as its own clickable button right after this, so the star average is never bare */}
                  <RatingStars value={salon.average_rating} size="md" />
                </strong>
              ) : (
                <strong className="font-semibold text-s-ink">-</strong>
              )}
              <button
                type="button"
                onClick={scrollToReviews}
                aria-label={`Show ${salon.review_count} reviews`}
                className="text-s-accent transition-opacity hover:opacity-80"
              >
                ({salon.review_count.toLocaleString("en-CH")})
              </button>
            </div>

            {/* Open status , tap to jump to the opening hours */}
            <button
              type="button"
              onClick={scrollToHours}
              aria-label="Show opening hours"
              className="block text-left transition-opacity hover:opacity-80"
            >
              <StatusInlineOverhaul isOpen={status.isOpen} label={status.label} size="md" />
            </button>

            <button
              type="button"
              onClick={scrollToLocation}
              aria-label="Show location"
              className="inline-flex items-center gap-1 text-left text-s-ink-2 transition-colors hover:text-s-ink"
            >
              <MapPin size={14} className="shrink-0 text-s-ink-2" strokeWidth={2} />
              {fullAddress}
            </button>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <button
            type="button"
            aria-label="Share salon"
            onClick={() => shareOrCopy(salon.name, window.location.href)}
            className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-transform hover:scale-105 active:scale-95"
          >
            <Share size={18} strokeWidth={2.1} className="text-s-ink" aria-hidden />
          </button>
          <HeartButton
            salonId={salon.id}
            salonName={salon.name}
            tone="dark"
            className="!relative !right-auto !top-auto"
          />
        </div>
      </div>
    </header>
  );
}
