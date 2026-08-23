"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * FooterGate: hides the site marketing footer on focused/terminal flows, mirroring
 * Breadcrumb.tsx's own EXCLUDED-list pattern (client component, usePathname, exact-prefix match).
 *
 * Was previously a bare children-wrapper that only dropped `/booking` (never actually mounted
 * anywhere, HideInBooking already covers `/booking` unconditionally at layout.tsx). Repurposed
 * (not duplicated, see CLAUDE.md's exists-check protocol) to own the Footer render itself, so it
 * can gate on `locale` + pathname the same way Breadcrumb does, and to add `/confirmation`: that
 * screen is terminal (a receipt, not a browsing surface, see BookingConfirmation.tsx's own
 * docstring) and the marketing footer stacking below its sticky CTAs is off-pattern, same
 * rationale as the booking flow. `/booking` stays listed too (redundant with HideInBooking, but
 * Breadcrumb's own EXCLUDED array keeps that same redundant entry, so this matches precedent).
 *
 * Extended per `_design-system/FOOTER_VISIBILITY.md`: a "task step" (a picker, a filter view, a
 * tab-like sub-view of a destination, or any screen with a bottom-pinned control) also hides the
 * footer, same as "terminal". Exposed as `isTaskStep()` so a NEW route opts in by classification
 * (prefix or pattern) instead of someone remembering to grow a flat array.
 */
const TASK_STEP_PREFIXES = ["/booking", "/confirmation"];

// Dev-only mockup routes standing in for not-yet-shipped task-step screens (see-all/filter
// sub-views, the "Select professional" picker) , FOOTER_VISIBILITY.md clause 2.
const DEV_TASK_STEP_PREFIXES = ["/dev/pdp/reviews-full", "/dev/pdp/team-all", "/dev/pdp/reviews-filter"];

// Real "see all" sub-views of a destination PDP: the dedicated reviews page
// (`/salon/[slug]/reviews`) AND the "Select professional" team picker (`/salon/[slug]/team`,
// shipped 2026-07-24 alongside the reviews port, missed here originally) are both task-step
// sub-views of the salon PDP, not their own destination.
const TASK_STEP_PATTERNS = [/^\/salon\/[^/]+\/reviews(\/|$)/, /^\/salon\/[^/]+\/team(\/|$)/];

export function isTaskStep(pathnameWithoutLocale: string): boolean {
  return (
    TASK_STEP_PREFIXES.some((prefix) => pathnameWithoutLocale.startsWith(prefix)) ||
    DEV_TASK_STEP_PREFIXES.some((prefix) => pathnameWithoutLocale.startsWith(prefix)) ||
    TASK_STEP_PATTERNS.some((pattern) => pattern.test(pathnameWithoutLocale))
  );
}

// ownsItsOwnBack answers a DIFFERENT question than isTaskStep above, and the two are not the
// same list on purpose. isTaskStep is about FOOTER visibility only. This one is about whether
// the PAGE ITSELF renders a local back control, which the global Header needs to know so it
// does not stack a second one on top. The two questions coincided for a while (both team and
// reviews were "task step" AND both rendered a local back) and then drifted apart: reviews
// deliberately gave up its own local back on 2026-08-09 (see SalonReviews.tsx's dated comment)
// and now relies entirely on the header's back, while team's local back was restored (this
// route history, 2026-08-23) because its target is a stable anchor on the salon page, not
// router.back()'s history-dependent, home-falling-back behaviour. Reusing isTaskStep for the
// header-suppression question broke reviews (zero back controls, confirmed live); this export
// exists so that mistake cannot repeat. Today only the team picker owns its own back.
const OWNS_BACK_PATTERNS = [/^\/salon\/[^/]+\/team(\/|$)/];

export function ownsItsOwnBack(pathnameWithoutLocale: string): boolean {
  return OWNS_BACK_PATTERNS.some((pattern) => pattern.test(pathnameWithoutLocale));
}

export default function FooterGate({ locale }: { locale: string }) {
  const pathname = usePathname() ?? "/";
  const withoutLocale = pathname.replace(`/${locale}`, "") || "/";
  if (isTaskStep(withoutLocale)) return null;
  return <Footer locale={locale} />;
}
