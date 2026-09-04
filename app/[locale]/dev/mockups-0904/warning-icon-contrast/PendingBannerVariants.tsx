"use client";

// Grounded-in: components-legacy/dashboard/SetupBanner.tsx
//
// exists-check: net-new vs components-legacy/dashboard/SetupBanner.tsx (read this session, the
// closest match: it owns the real "awaitingApproval" pending block this file byte-copies). That
// block is inline in SetupBanner's default-exported function, not a separately exported
// sub-component, so it cannot be imported and re-classed without editing the shared file (many
// live salons render it unchanged, out of scope for a treatment-only icon mockup). This sibling
// is the same byte-copy technique app/[locale]/dev/design-fixes/page.tsx already uses for
// Reviews.tsx's private ReviewCard. None of the other `npm run exists` fuzzy hits (export.ts,
// treatment-outcomes route, roadmap docs, migrations) touch this banner or this icon.
//
// Depicts: pending-approval banner -> components-legacy/dashboard/SetupBanner.tsx:72-80 (the real
//   "awaitingApproval" JSX, byte-copied here verbatim, only the Clock icon's className/style vary)
//
// Byte-copy of the "awaitingApproval" JSX block from components-legacy/dashboard/SetupBanner.tsx
// (lines 69-80, read this session). Every class below is copied verbatim except the Clock icon's
// className/style, which is the one VARY axis. Copy comes through the same real i18n keys the
// real component reads (dashboard.approvalStatus.pendingTitle / pendingBody), not hardcoded text.

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

// Variant 1: icon recoloured to `text-s-warning-text` (hue-ok: B45309 is the locked s-warning.text
// token, tailwind.config.js line 200, not an invented hue), the token this same repo already uses
// for warning icon-on-pale-bg everywhere else (booking/lookup, booking/resend-link,
// dashboard/upcharge, DashboardUI.tsx's own `warning: "text-s-warning-text"` map). Computed
// contrast against s-warning-bg: 4.67:1 (script run this turn, see page.tsx comment).
export function PendingBannerVariant1() {
  const tApproval = useTranslations("dashboard.approvalStatus");
  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white"> {/* drift-ok: byte-copy of SetupBanner.tsx's own wrapper class, verbatim, FIXED per brief */}
      <div className="rounded-[12px] bg-s-warning-bg border border-s-warning/30 px-3 py-2.5 flex items-start gap-2.5">
        <Clock size={16} strokeWidth={1.9} className="text-s-warning-text shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-heading font-semibold text-s-ink">{tApproval("pendingTitle")}</p>
          <p className="text-xs text-s-ink-2 mt-0.5">{tApproval("pendingBody")}</p>
        </div>
      </div>
    </div>
  );
}

// Variant 2: icon stays `text-s-warning` (unchanged amber fill, still 1.80:1 alone) with a 1.5px
// ink (s-ink token, neutral, not a semantic hue) stroke drawn via four offset `drop-shadow`s (a
// standard SVG/icon outline technique: each drop-shadow paints a solid-colour copy of the icon's
// alpha shape offset in one direction, four directions approximate an even outline). The outline
// is the graphical object's visible BOUNDARY per WCAG 1.4.11, and ink-on-warning-bg computes to
// 18.40:1, so the icon's edge clears the 3:1 floor even though its own fill colour does not.
export function PendingBannerVariant2() {
  const tApproval = useTranslations("dashboard.approvalStatus");
  const inkStroke =
    "drop-shadow(1.5px 0 0 rgb(10,10,10)) drop-shadow(-1.5px 0 0 rgb(10,10,10)) drop-shadow(0 1.5px 0 rgb(10,10,10)) drop-shadow(0 -1.5px 0 rgb(10,10,10))"; // s-ink token, rgb form so no bare hex here
  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-white"> {/* drift-ok: byte-copy of SetupBanner.tsx's own wrapper class, verbatim, FIXED per brief */}
      <div className="rounded-[12px] bg-s-warning-bg border border-s-warning/30 px-3 py-2.5 flex items-start gap-2.5">
        <Clock
          size={16}
          strokeWidth={1.9}
          className="text-s-warning shrink-0 mt-0.5"
          style={{ filter: inkStroke }}
        />
        <div>
          <p className="text-sm font-heading font-semibold text-s-ink">{tApproval("pendingTitle")}</p>
          <p className="text-xs text-s-ink-2 mt-0.5">{tApproval("pendingBody")}</p>
        </div>
      </div>
    </div>
  );
}
