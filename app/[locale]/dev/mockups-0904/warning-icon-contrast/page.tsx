"use client";

// Grounded-in: components-legacy/dashboard/SetupBanner.tsx
//
// Exists-check: `npm run exists warning-icon-contrast` ran this turn, before this file, and its
// only hit is this task's own sibling (PendingBannerVariants.tsx, written earlier this turn).
// `npm run exists setup-banner` ran before that and its one hit is the real target,
// components-legacy/dashboard/SetupBanner.tsx (COMPONENTS section). No REMOVED.md line matches
// "warning icon", "amber icon", or "clock icon contrast". The target surface already renders,
// unchanged, on every real salon dashboard whose approval is pending; the one new thing on this
// page is the side-by-side comparison itself (no new route/component/query logic exists anywhere
// in the app for either proposed icon treatment).
//
// Depicts: pending-approval banner (Current) -> components-legacy/dashboard/SetupBanner.tsx
//   (real, unmodified import; its Clock icon is measured tonight at 1.80:1 against its own
//   bg-s-warning-bg, under the 3:1 WCAG graphical-object floor)
// Depicts: dashboard chrome -> components-legacy/dashboard/DashboardLayout.tsx (real, unmodified
//   import, the same way app/[locale]/dashboard/bookings/page.tsx wraps its content)
// Depicts: pending-approval banner (Proposed 1 + 2) -> PendingBannerVariants.tsx, a byte-copy
//   sibling of SetupBanner.tsx's inline "awaitingApproval" JSX (that block is not a separately
//   exported component, see that file's own header comment for why it cannot be imported)
// Mockup-scope: section
//
// This is an OPERATOR screen (a salon owner's own dashboard notice), governed by the 2026-07-15
// merchant round in _design-system/TASTE_LOG.md, not the customer FLOORS LAW: one carded hero
// (the white SetupBanner card already is that), everything else bare text, no new containers
// added here beyond what SetupBanner.tsx itself already draws.

import { useEffect, useState } from "react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import SetupBanner from "@/components-legacy/dashboard/SetupBanner";
import { PendingBannerVariant1, PendingBannerVariant2 } from "./PendingBannerVariants";

// Real seeded salon "test" (id 97c04291-fe61-4018-8f75-3ac03c9e27e3), queried live this session:
// approved_at and rejection_reason both null -> GET /api/salon/setup-progress computes
// approval_state "pending" for it. It is one of 25 salons owned by the dev-login fixture
// (hiroseseiju@proton.me); the others are all approved, so without pointing at this one the real
// SetupBanner would render its "approved" (empty) state instead of the surface under review.
const PENDING_TEST_SALON_ID = "97c04291-fe61-4018-8f75-3ac03c9e27e3";

// Uses the app's own real salon-switch cookie contract (lib/active-salon.ts,
// ACTIVE_SALON_COOKIE = "solen_active_salon", normally set by SalonSwitcher.tsx) to point the
// authenticated dev-login fixture at its one real pending salon before SetupBanner's own effect
// fires its fetch, so the unmodified real component renders its real pending state rather than
// whichever salon happens to be oldest. Nothing about the banner or its data is invented.
function LiveCurrentBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    document.cookie = `solen_active_salon=${PENDING_TEST_SALON_ID}; path=/`;
    setReady(true);
  }, []);
  if (!ready) return null;
  return <SetupBanner />;
}

function BlockLabel({ variant, rule }: { variant: string; rule: string }) {
  return (
    <div className="mb-2 mt-6">
      <p className="text-[13px] font-semibold text-s-ink">{variant}</p>
      <p className="text-[12px] text-s-ink-2">{rule}</p>
    </div>
  );
}

export default function WarningIconContrastPage() {
  return (
    <DashboardLayout>
      <div className="max-w-[402px]">
        <h1 className="text-[20px] font-semibold text-s-ink">Warning icon contrast</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          The pending-approval Clock icon against its pale warning background, current versus two
          fixes. Contrast computed with the WCAG relative-luminance formula (script run this
          session), not recalled.
        </p>

        <BlockLabel
          variant="Current"
          rule="Real SetupBanner, unmodified. Clock icon on the pale warning tray: 1.80 to 1, under the 3 to 1 WCAG graphical-object floor."
        />
        <LiveCurrentBanner />

        <BlockLabel
          variant="Proposed 1"
          rule="Icon recoloured to the s-warning-text token (already used for this exact job elsewhere in this app): 4.67 to 1."
        />
        <PendingBannerVariant1 />

        <BlockLabel
          variant="Proposed 2"
          rule="Icon stays warning-amber, plus a 1.5px ink stroke on its edge. Fill alone is still 1.80 to 1; the ink boundary against the tray is 18.40 to 1, which is what a viewer actually reads as the icon's outline."
        />
        <PendingBannerVariant2 />

        <p className="mt-6 text-[12px] text-s-ink-2">
          FIXED: banner text, layout, and every value besides the icon stay exactly as
          SetupBanner.tsx already ships them.
        </p>
      </div>
    </DashboardLayout>
  );
}
