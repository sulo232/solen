# Press-tier animation checker

Generated: 2026-08-20T11:47:06.688Z
Files scanned: 687  Roots: app, components, components-legacy

Static source scan (no browser) for the class of press control whose active:scale- cannot
actually animate because its own transition-property list doesn't include transform. See
the file header of scripts/check-press.mjs for the full reasoning and the SAFE DIRECTION policy
(unresolved dynamic content -> UNCERTAIN, never DEAD).

Totals (excl. /dev/ unless --include-dev): DEAD=0  NO-TRANSITION=1  OFF-LADDER=44  UNCERTAIN=16  OK=280  DEV-SKIPPED=40

---
### DEAD (blocking) (0)

none found

### NO-TRANSITION (report-only) (1)

- `components-legacy/chat/ClientTags.tsx:175` - scale: active:scale-[0.97] - transition: (none)

### OFF-LADDER (report-only) (44)

- `app/[locale]/_components/homepage/ContinueCard.tsx:226` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/layout/Footer.tsx:260` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/primitives/Checkbox.tsx:72` - scale: group-active:scale-[0.92] - transition: transition-colors [&]:transition-transform
- `app/[locale]/_components/primitives/CookieConsent.tsx:329` - scale: active:scale-95 - transition: transition-[colors,transform]
- `app/[locale]/_components/primitives/Switch.tsx:93` - scale: active:scale-[0.92] - transition: transition-[left,transform] active:transition-transform
- `app/[locale]/_components/profile/AccountHub.tsx:265` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/salon/SalonHeader.tsx:157` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/salon/SalonHero.tsx:214` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/salon/SalonHero.tsx:229` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/salon/SalonHero.tsx:244` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/salon/SalonHero.tsx:251` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/salon/SalonHero.tsx:258` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/salon/SalonImageGallery.tsx:188` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/salon/SalonLoyalty.tsx:72` - scale: active:scale-[0.99] - transition: transition-[box-shadow,transform]
- `app/[locale]/_components/salon/SalonStickyTabNav.tsx:186` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/salon/SalonStickyTabNav.tsx:203` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/search/MapSalonDetail.tsx:129` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/search/SalonResultCard.tsx:288` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/search/SearchOverlay.tsx:2633` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/_components/search/SearchTemplate.tsx:1995` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/_components/tips/TipSheet.tsx:60` - scale: active:scale-90 - transition: transition
- `app/[locale]/inspo/board/[id]/page.tsx:69` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/inspo/saved/[id]/page.tsx:58` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/inspo/saved/page.tsx:69` - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/onboarding/OnboardingFlow.tsx:148` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/onboarding/OnboardingFlow.tsx:234` - scale: active:scale-[0.99] - transition: transition-transform
- `app/[locale]/queue/[token]/page.tsx:249` - scale: active:scale-90 - transition: transition-transform
- `app/[locale]/rewards/RewardsView.tsx:239` - scale: active:scale-[0.985] - transition: transition-transform
- `app/[locale]/walk-in-pay/page.tsx:505` - scale: active:scale-90 - transition: transition
- `components/ui/animated-testimonials.tsx:250` - scale: active:scale-[0.95] - transition: transition-[colors,transform]
- `components/ui/animated-testimonials.tsx:258` - scale: active:scale-[0.95] - transition: transition-[colors,transform]
- `components-legacy/SalonCard.tsx:225` - scale: active:scale-[0.92] - transition: transition-[transform,background-color]
- `components-legacy/SalonCard.tsx:283` - scale: active:scale-[0.92] - transition: transition-[opacity,transform,background-color]
- `components-legacy/SalonCard.tsx:295` - scale: active:scale-[0.92] - transition: transition-[opacity,transform,background-color]
- `components-legacy/booking/CancelBookingSheet.tsx:93` - scale: active:scale-90 - transition: transition
- `components-legacy/discovery/DetailPage.tsx:239` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/DetailPage.tsx:255` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/DetailPage.tsx:265` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/DetailPage.tsx:285` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/DetailPage.tsx:298` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/TikTokPlayer.tsx:146` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/TikTokPlayer.tsx:158` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/discovery/TikTokPlayer.tsx:170` - scale: active:scale-95 - transition: transition-transform
- `components-legacy/loyalty/HeroStampCard.tsx:49` - scale: active:scale-[0.99] - transition: transition-[transform]

### UNCERTAIN (report-only, never blocks --gate) (16)

- `app/[locale]/_components/homepage/MobileCategoriesRow.tsx:109` - scale: group-active:scale-[0.97] - transition: transition-[transform,box-shadow]
- `app/[locale]/_components/homepage/SalonCard.tsx:387` - scale: active:scale-[0.97] - transition: transition-transform
- `app/[locale]/_components/homepage/WalkInBand.tsx:124` - scale: active:scale-[0.98] - transition: transition-transform
- `app/[locale]/_components/primitives/BackButton.tsx:34` - scale: active:scale-[0.94] - transition: transition-[transform,background-color]
- `app/[locale]/_components/primitives/PillToggle.tsx:63` - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `app/[locale]/_components/salon/SalonProducts.tsx:308` - scale: active:scale-[0.94] - transition: transition-[colors,transform]
- `app/[locale]/dashboard/analytics/page.tsx:154` - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `app/[locale]/dashboard/analytics/page.tsx:167` - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `app/[locale]/dashboard/clients/page.tsx:127` - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `app/[locale]/dashboard/clients/page.tsx:357` - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `components-legacy/dashboard/CommandPalette.tsx:157` - scale: active:scale-[0.98] - transition: transition-[colors,transform]
- `components-legacy/dashboard/SalonSwitcher.tsx:171` - scale: active:scale-[0.98] - transition: transition-[colors,transform]
- `components-legacy/refund/UpchargeApproveView.tsx:529` - scale: active:scale-[0.985] - transition: (none)
- `components-legacy/salon/SalonModeToggle.tsx:41` - scale: active:scale-[0.98] - transition: transition-[colors,transform]
- `components-legacy/ui/ExportButton.tsx:21` - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `components-legacy/ui/interactive-hover-button.tsx:18` - scale: active:scale-[0.97] - transition: transition-[transform,filter]

### DEV-SKIPPED (report-only, run --include-dev to check) (40)

- `app/[locale]/dev/checkout-confirm/page.tsx:44` - dev-path - scale: active:scale-[0.98] - transition: (none)
- `app/[locale]/dev/flows/page.tsx:141` - dev-path - scale: active:scale-[0.99] - transition: (none)
- `app/[locale]/dev/home-search/_variants.tsx:59` - dev-path - scale: active:scale-[0.98] - transition: transition-transform
- `app/[locale]/dev/home-search/_variants.tsx:117` - dev-path - scale: active:scale-[0.97] - transition: transition-transform
- `app/[locale]/dev/map-bar/page.tsx:52` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-bar/page.tsx:61` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-bar/page.tsx:70` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-behavior/page.tsx:123` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-browse/page.tsx:68` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-browse/page.tsx:74` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-full/page.tsx:82` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-full/page.tsx:88` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-interact/page.tsx:71` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-interact/page.tsx:142` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-interact/page.tsx:148` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-motion/page.tsx:144` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-motion/page.tsx:151` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-motion/page.tsx:184` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-single/page.tsx:56` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-v2/page.tsx:58` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-v2/page.tsx:63` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/map-zoom/page.tsx:136` - dev-path - scale: active:scale-95 - transition: (none)
- `app/[locale]/dev/mockups/page.tsx:60` - dev-path - scale: active:scale-[0.99] - transition: (none)
- `app/[locale]/dev/motion/_parts/BlurSpeedDemo.tsx:77` - dev-path - scale: active:scale-[0.94] - transition: transition-transform
- `app/[locale]/dev/motion/_parts/BlurSpeedDemo.tsx:153` - dev-path - scale: active:scale-[0.94] - transition: transition-transform
- `app/[locale]/dev/motion/_parts/DemoCard.tsx:52` - dev-path - scale: active:scale-[0.94] - transition: transition-transform
- `app/[locale]/dev/motion/_parts/MotionGallery.tsx:39` - dev-path - scale: active:scale-[0.97] - transition: transition-transform
- `app/[locale]/dev/motion/_parts/SpeedLadder.tsx:66` - dev-path - scale: active:scale-[0.97] - transition: transition-transform
- `app/[locale]/dev/motion-recipe/page.tsx:197` - dev-path - scale: active:scale-[0.97] - transition: transition-all
- `app/[locale]/dev/motion-recipe/page.tsx:224` - dev-path - scale: active:scale-[0.97] - transition: transition-all
- `app/[locale]/dev/pdp/_overhaul/SalonCardOverhaul.tsx:157` - dev-path - scale: active:scale-[0.97] - transition: (none)
- `app/[locale]/dev/pdp/_overhaul/SalonHeaderOverhaul.tsx:102` - dev-path - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/dev/pdp/_overhaul/SalonHeroOverhaul.tsx:109` - dev-path - scale: group-active:scale-[0.97] - transition: transition-transform
- `app/[locale]/dev/pdp/_overhaul/SalonImageGalleryOverhaul.tsx:136` - dev-path - scale: active:scale-95 - transition: transition-transform
- `app/[locale]/dev/pdp/_overhaul/SalonImageGalleryOverhaul.tsx:201` - dev-path - scale: active:scale-[0.98] - transition: transition-transform
- `app/[locale]/dev/pdp/_overhaul/SalonImageGalleryOverhaul.tsx:217` - dev-path - scale: active:scale-[0.98] - transition: transition-transform
- `app/[locale]/dev/pdp/_overhaul/SalonPortfolioOverhaul.tsx:96` - dev-path - scale: active:scale-[0.98] - transition: transition-transform
- `app/[locale]/dev/pdp/_overhaul/TeamAllOverhaul.tsx:66` - dev-path - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `app/[locale]/dev/pdp/_overhaul/TeamAllOverhaul.tsx:138` - dev-path - scale: active:scale-[0.97] - transition: transition-[colors,transform]
- `app/[locale]/dev/search-morph/page.tsx:198` - dev-path - scale: active:scale-[0.97] - transition: (none)
