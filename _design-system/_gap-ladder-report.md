# Gap-ladder drift report

Report-mode only unless run with --gate (scripts/detect-gap-ladder-drift.mjs, npm run gap-ladder-check). Flags an illegal margin/gap/space utility (over 16px, not exactly 32px) on a file governed by the binary 16-and-32 spacing law: the merchant round in _design-system/TASTE_LOG.md 2026-07-15 (Round D1), generalised in _design-system/TERMINAL_PRINCIPLES.md section 3.

Generated: 2026-08-28T05:59:21.542Z
Files scanned (app/ + components/ + components-legacy/, .tsx/.jsx): 706
Files governed by this law (claim, weak-claim, or path): 117

## Summary

- Total illegal gap-ladder utilities: **112**
  - claim-breaking (the file's own header claims this law): 0
  - weak-claim (the law named more loosely, own bucket, see below): 0
  - path-governed only (a real operator surface, never claimed the law): 112
- Review by hand (em/concatenation/broken-template, never a finding, never gates): 1
- Unreadable files or directories (never counted clean): 0

## Claim-breaking, loudest (0)

The file's own header text contains one of the four marker phrases (TERMINAL_PRINCIPLES.md, "binary 16 and 32", Round D1, "SCREEN CLASS: operator screen") while the code carries an illegal gap. A file that states this law and breaks it, worse than one never told.

_none_

## Weak-claim (0)

The file's own header text names the same law more loosely ("merchant" co-occurring with 2026-07-15, this repo's own prose for it, or a bare "operator screen" mention) rather than one of the four exact marker phrases. Reported separately since a bare "operator screen" substring could in principle be negated ("this is NOT an operator screen") with no way for a text scan to tell; still a real illegal utility if listed here, just a softer signal for WHY the file is governed.

_none_

## Path-governed only (112)

A real operator surface (app/[locale]/dashboard/**, app/terminal/**, app/[locale]/dev/terminal*/**, app/[locale]/dev/host-flows/**) carrying an illegal gap, with no explicit claim of the law in the file's own header.

- **app/[locale]/dashboard/admin-sandbox/page.tsx:190** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/admin-sandbox/page.tsx:258** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/admin-sandbox/page.tsx:283** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/admin-sandbox/page.tsx:492** `mt-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/ai-limits-admin/page.tsx:86** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/ai-limits-admin/page.tsx:159** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-salons/page.tsx:77** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-salons/page.tsx:174** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-salons/page.tsx:180** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-salons/page.tsx:198** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-users/page.tsx:62** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-users/page.tsx:173** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/all-users/page.tsx:179** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/analytics/page.tsx:164** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/analytics/page.tsx:178** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/approvals/page.tsx:76** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/badge-manager/page.tsx:174** `mt-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/badge-manager/page.tsx:214** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/badge-manager/page.tsx:361** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/barber-clients/page.tsx:42** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/barber-clients/page.tsx:47** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/barber-ops/page.tsx:48** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/barber-ops/page.tsx:58** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/bookings/page.tsx:91** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/bookings/page.tsx:248** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/bundles/page.tsx:178** `gap-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/bundles/page.tsx:538** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/calendar/page.tsx:130** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/calendar/page.tsx:217** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/calendar/page.tsx:341** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/calendar/page.tsx:364** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/calendar/page.tsx:870** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/cities-admin/page.tsx:85** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/clients/page.tsx:115** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/clients/page.tsx:326** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/clients/page.tsx:354** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/coiffeur-crm/page.tsx:65** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/coiffeur-crm/page.tsx:73** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/coiffeur-crm/page.tsx:86** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/commission-admin/page.tsx:93** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/commission-admin/page.tsx:184** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/content-editor/page.tsx:161** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/content-editor/page.tsx:167** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/discovery-admin/page.tsx:39** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/discovery-posts/page.tsx:120** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/earnings/page.tsx:83** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/earnings/page.tsx:95** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/feature-flags-admin/page.tsx:125** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/gallery/page.tsx:43** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/help-editor/page.tsx:114** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/homepage-admin/page.tsx:77** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/loading.tsx:17** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/loyalty/page.tsx:83** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/marketing/page.tsx:45** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/marketing/page.tsx:51** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/nail-admin/page.tsx:49** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/nail-admin/page.tsx:57** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/nail-clients/page.tsx:39** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/nail-clients/page.tsx:44** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/page.tsx:154** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/page.tsx:166** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/platform-analytics/page.tsx:100** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/platform-analytics/page.tsx:109** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/products/page.tsx:37** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/queue-display/page.tsx:33** `mb-12` (48px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/reports/page.tsx:174** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/reports/page.tsx:195** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/revenue/page.tsx:61** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/revenue/page.tsx:92** `space-y-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/review-moderation/page.tsx:57** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/review-moderation/page.tsx:143** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/review-moderation/page.tsx:149** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/reviews/page.tsx:173** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/salon-of-month-admin/page.tsx:123** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/salon-of-month-admin/page.tsx:128** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/salon-of-month-admin/page.tsx:185** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/segments/page.tsx:74** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/services/page.tsx:91** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/services/page.tsx:295** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/services/page.tsx:465** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:253** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:375** `space-y-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:450** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:571** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:730** `space-y-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:847** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:1140** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:1505** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:1512** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/settings/page.tsx:1572** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/setup/page.tsx:69** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/spa-admin/page.tsx:48** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/spa-admin/page.tsx:56** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/staff/page.tsx:164** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/staff/page.tsx:436** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/staff/page.tsx:524** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/upcharge/page.tsx:187** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dashboard/upcharge/page.tsx:201** `mb-7` (28px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dev/terminal/Terminal.tsx:536** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dev/terminal/Terminal.tsx:603** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **app/[locale]/dev/terminal/Terminal.tsx:578** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/DashboardLayout.tsx:268** `space-y-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/DashboardLayout.tsx:381** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/DashboardLayout.tsx:400** `mt-5` (20px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/GalleryManager.tsx:215** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/GalleryManager.tsx:230** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/GalleryManager.tsx:242** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/GalleryManager.tsx:251** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/SalonAboutEditor.tsx:68** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/SetupBanner.tsx:70** `mb-6` (24px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/WalkInModal.tsx:77** `mb-5` (20px, illegal: over 16px and not exactly 32px)
- **components-legacy/dashboard/WalkInModal.tsx:85** `mb-5` (20px, illegal: over 16px and not exactly 32px)

## Review by hand (1)

Never a finding, never counted toward the total above, never trips --gate. No static text scanner can safely resolve an em arbitrary value (font-size-relative, not fixed), a class value built by runtime string concatenation, or a template literal whose token is split by a raw newline or a numeric interpolation. Saying nothing here would be indistinguishable from clean, which is worse than naming the file and line and asking for a human look.

- **app/[locale]/dev/terminal-week/WeekScreen.tsx:385** `gap-" +`: class value split by string concatenation (+) right after a spacing prefix, cannot statically resolve the combined utility

## Unreadable files or directories (0)

Never counted clean. A path this detector could not open (a file OR a directory it could not list) was never actually checked, so it is reported here instead of silently passing.

_none_

## Tunables

- `hasStrongClaim` / `WEAK_CLAIM_MARKER_RE` (top of this file): the claim phrases, strong and weak.
- `OPERATOR_PATH_RE`: the real operator-surface path patterns, verified present on disk before writing.
- `UTILITY_RE` / `utilityToPx`: the ten scanned prefixes and the px conversion (px/rem/pt fixed, em routed to review).
- `CONCAT_SUSPECT_RE` / `TEMPLATE_NEWLINE_SUSPECT_RE` / `TEMPLATE_INTERP_SUSPECT_RE`: the three review-by-hand shapes.
- `isIllegal`: over 16px and not exactly 32px.
- `findClassValueSpans`: the real class-name positions the illegal-utility scan is constrained to.
- Scan roots: `app/`, `components/`, `components-legacy/`, `.tsx`/`.jsx` only, same as the sibling detectors.
