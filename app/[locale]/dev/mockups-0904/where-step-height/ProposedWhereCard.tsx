// Grounded-in: app/[locale]/_components/search/SearchOverlay.tsx (the Where/location step)
// exists-check: net-new vs app/[locale]/terms/components/TermsContent.tsx, _design-system/sections/booking-service/03-service-group-card.md, supabase/migrations/012_fix_services_store_id_and_blocked_dates_range.sql (name-substring hits only, unrelated surfaces, none of them render the search overlay's Where step).
// Depicts: Where-step card (input row + 2 suggestion rows) -> app/[locale]/_components/search/SearchOverlay.tsx (real, unmodified byte-copy of its location-slot JSX; the file's inner markup is not exported, see the byte-copy note below).
//
// Byte-copy note: SearchOverlay.tsx does not export its inner Where-step JSX (the location slot's
// card, its input row, or SuggestRow), and the file is off-limits to edit this turn. The markup and
// class strings below are copied verbatim from that file's location-slot block (~line 2316-2400) and
// its SuggestRow function (~line 2703-2745), reduced to the one thing this mockup is allowed to
// change: the card's own height. Every class name, spacing value and copy string is the real one
// read from the source; nothing here is invented.
//
// Real assets used: /icons/cities/basel.png (the actual CITY_ICONS["Basel"] entry, public/icons/cities/basel.png).
// Real copy used: messages/en.json ui.searchOverlay.{noPreference,noPreferenceSub,citySearchPlaceholder}.

import { ChevronLeft, Globe, X } from "lucide-react";

// CONTENT-DERIVED HEIGHT, all terms read from the real file, none invented:
//   card padding p-4            = 16 (top) + 16 (bottom)  = 32
//   input row  h-14 + mb-2      = 56 + 8                  = 64
//   heading (locHeadingH)       = 0   (folded to 0 while inputFocused, same as the real DOM)
//   2 suggestion rows, 68 each  = 68 * 2                  = 136   (LOC_ROW_H constant, line ~875)
//   ------------------------------------------------------------
//   content height                                        = 232
// The card's own bottom padding (16px, already counted above) IS the "+16px" breathing the brief
// asks for, so no separate term is added on top of it.
export const WHERE_CARD_CONTENT_HEIGHT = 232;

export function ProposedWhereCard() {
  return (
    <div
      style={{ height: WHERE_CARD_CONTENT_HEIGHT }}
      className="relative overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]"
    >
      <div className="absolute inset-0 flex flex-col p-4">
        {/* Heading folded to 0 height, exactly as the real DOM does once the city input is
            focused (locHeadingH -> 0 on the same axis the service heading has always used). */}
        <div style={{ height: 0 }} className="shrink-0 overflow-hidden" />

        {/* mockup-ok: same variant B recipe as the real field (TASTE_LOG db2a45ca8, white fill +
            1px hairline), byte-copied. */}
        <div className="mb-2 flex h-14 shrink-0 items-center gap-2.5 rounded-[15px] border border-s-border bg-white px-3.5">
          <button
            type="button"
            aria-label="Back"
            className="relative grid h-8 w-6 shrink-0 place-items-center text-s-ink before:absolute before:-inset-y-1.5 before:-inset-x-3 before:content-['']"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <span className="min-w-0 flex-1 text-[16px] text-s-ink">Bas</span>
          <button
            aria-label="Clear input"
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink"
          >
            <X size={13} strokeWidth={2.6} />
          </button>
        </div>

        {/* The two real rows the seeded query "Bas" returns: the always-present "No preference"
            row, then the one matching city (Basel). Not scrollable, content is shorter than the
            card, so there is nothing to scroll. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <SuggestRowCopy
            name="No preference"
            sub="Anywhere in Switzerland"
            icon={<Globe size={20} strokeWidth={2.2} />}
          />
          <SuggestRowCopy name="Basel" img="/icons/cities/basel.png" />
        </div>
      </div>
    </div>
  );
}

// Byte-copy of SearchOverlay.tsx's SuggestRow, reduced to the two prop shapes this mockup uses
// (icon tile, image tile). Same classes, same 68px row (py-2.5 + h-12 icon).
function SuggestRowCopy({
  name,
  sub,
  icon,
  img,
}: {
  name: string;
  sub?: string;
  icon?: React.ReactNode;
  img?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1">
      <div className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        {img ? (
          <img src={img} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-s-bg-sunken text-s-ink-2">
            {icon}
          </span>
        )}
        <span className="min-w-0">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate text-[15px] font-semibold text-s-ink">{name}</span>
          </span>
          {sub ? <span className="block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
        </span>
      </div>
    </div>
  );
}
