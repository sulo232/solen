# Site-renewal punch-list (rescope wf_20566c59, 57 items, 2026-07-23)

Live-code re-derivation of C6-C9 + C1-C5 regression gaps. Execute SEQUENTIALLY (no-parallel-frontend), coder+reviewer each, commit+verify per chunk. Tick as landed.

## CHUNK R: regression cleanup (C1-C5 gaps) DONE commit 53f7d8aec (tsc clean)
Selected-state INK-FILL -> gray-sunken (evaded no-black-selected gate):
- [x] OnboardingFlow.tsx:171 -> bg-s-bg-sunken text-s-ink font-semibold
- [x] profile/haarprofil/HaarprofilForm.tsx:30 -> border-s-border bg-s-bg-sunken text-s-ink font-semibold
- [x] profile/settings/BeautyProfileForm.tsx:188 -> bg-s-bg-sunken text-s-ink font-semibold (multi-select cards :136 left as-is, correct)
- [x] _components/tips/TipFlow.tsx:213+:224 -> border-s-ink bg-s-bg-sunken text-s-ink font-semibold
Blue on non-clickable:
- [x] SKIP checkout/page.tsx:491  /checkout is CONFIRMED-ORPHANED DEAD CODE (PAYMENTS_BACKEND_AUDIT.md:109; live pay = components-legacy/booking/BookingPaymentForm.tsx via booking-pay-intent). Not edited. SURFACE to owner: delete/graveyard the orphan route (deferred Phase-5 cleanup per SOLEN_BUILD_PHASE_0).
- [x] booking/resend-link/page.tsx:562 -> `<Spinner size="sm" invert />` (primitive)
- [x] _components/salon/SalonReviews.tsx:112 -> text-s-ink-2
Off-grid vertical rhythm -> 4pt:
- [x] _components/homepage/SolenStory.tsx:64  mb-7 -> mb-6
- [x] rewards/RewardsView.tsx:167,190,230  mt-[18px] -> mt-5
- [x] profile/settings/SettingsForm.tsx:283 + BeautyProfileForm.tsx:86  space-y-[18px] -> space-y-5

## CHUNK C6: icons DONE commit 7ab61d956 (tsc clean)
- [x] beautyFields.tsx:90 Zap deals -> Tag; partner:148 Zap waxing -> Flame; partner:232 Zap hiw_step3 -> CalendarCheck (Zap fully purged)
- [x] beautyFields.tsx:73 hand-drawn CAT_PATHS/CatIcon -> Lucide CAT_ICON map. NOTE: no locked Lucide category map existed (real tiles = PNGs); coder DERIVED coiffeur=Scissors(given), barbershop=Brush, nails=Hand, spa=Droplet. Low-stakes onboarding picker icons. OWNER MAY VETO barbershop/nails/spa picks.
- [x] referral/[code]:97 + nail-tech/[id]:141 decorative Sparkles removed; coming-soon:96 Sparkles -> Check (semantic)
- PARKED (minor): partner/page.tsx:~145 uses Sparkles as the cat_nails category glyph (B2B page, functional-not-decorative, inconsistent with onboarding nails=Hand). Low priority; surface to owner, not auto-changed.

## CHUNK C6b: type-recipe (CTA<=13px; sentence-case, no tracked-uppercase) [coder D3]
CTA text -> text-[14px] md:text-[15px] font-medium, drop uppercase+tracking:
- [x] SKIP checkout/page.tsx:99/:674/:374/:327/:531/:540/:603/:612  /checkout is CONFIRMED-ORPHANED DEAD CODE (PAYMENTS_BACKEND_AUDIT.md:109). Not edited. Also :494 eyebrows below = same dead route, SKIP.
- [x] auth/reset-password/page.tsx:220 + :156 -> text-[14px] md:text-[15px] font-medium (commit 21a0c7ff2)
- [ ] PARKED, owner call (mockup delivered, decision #4): SalonServices.tsx:215 Buchen CTA 13px mobile -> 14px? Below the locked CTA floor but may be intentional secondary sizing on a rebuilt surface. Owner reacts to mockup-decisions-rt.html then apply or leave.
- [ ] PARKED, owner call (mockup delivered, decision #4): SalonBuy.tsx:48 Kaufen CTA 13px -> 14px? SalonBuy = killed gift-card feature; verify it renders before touching.
Tracked-uppercase eyebrows -> sentence-case, drop uppercase+tracking: DONE commit 21a0c7ff2
- [x] SKIP checkout/page.tsx:494  /checkout dead route (see above), not edited.
- [x] auth/reset-password/page.tsx:98,121,136 (dropped uppercase+tracking, kept solen.ch casing)
- [x] _components/layout/MobileMenu.tsx:271 (dropped uppercase+tracking, kept text-[12px] font-semibold)

## CHUNK C7: elevation DONE commits f30a97bb4 + 3d9140d78 (tsc clean)
- [x] RewardsView:119 (drop shadow, keep border); profile/page.tsx:159 (drop resting shadow, keep border+hover) commit 3d9140d78; auth/reset-password:131 (drop shadow); profile/referral x3 (drop shadow); WalkInBand:97 (drop arbitrary shadow)
- [x] warum-solen:65 (drop border, keep shadow-elevation-2); partner:300 (drop border, keep shadow)
- [x] SalonHero:~247 'Alle Fotos' pill -> FROST_GLASS
- [x] SKIP queue/[token]/page.tsx:253 elevation: owner-tuned walkin-rich-v2 surface, not touched.

## CHUNK C8: a11y touch targets -> h-11 w-11 DONE commit db70c6408 (12 controls, tsc clean)
- [x] BackButton.tsx:35 + NotificationBell.tsx:42 (h-10 -> h-11)
- [x] SearchOverlay.tsx:1089/766/857/861 (remove/close/cal-arrows -> h-11)
- [x] TipSheet.tsx:60 (h-8 -> h-11, offset re-centered)
- [x] FeaturedStylists.tsx:176 frost-heart: 44px transparent hit area wrapping unchanged 32px frost circle (HeartButton pattern); dead focus-ring classes dropped
- [x] SalonImageGallery:100, SalonLightbox:71, SalonServicesSheet:191+204, SalonHeader:144, SalonVenuesNearby:151+160 (all -> h-11)

## CHUNK C9: copy [coder D6] DONE (rescope wf_20566c59, pending commit SHA)
- [x] _components/salon/SalonAbout.tsx:37  un-clamped description -> line-clamp-3 (length>200 threshold, mirrors SalonReviews) + inline text-s-accent font-semibold 'Mehr lesen' expand-in-place. Reused dormant salonDetail.readMore i18n key (no new string).
- [x] _components/salon/SalonReviews.tsx:205  read-more `text-s-ink font-medium` -> `text-s-accent font-semibold` (locked blue inline read-more)
- [x] reviews/_components/MarketplaceReviewsList.tsx:67  grey+underline read-more (banned) -> `text-s-accent font-semibold`, removed hover:underline (kept hover:text-s-ink, literal instruction)
- [x] components-legacy/auth/SignIn.tsx:203 (email+password placeholder-only -> visible labels, new auth.password_label key) + :88 (submit-only validation -> inline field error, loginError state, cleared on next keystroke)
- [x] auth/register/page.tsx:167 (email+password placeholder-only -> visible labels, reused existing authRegister.emailPlaceholder/passwordPlaceholder keys)
- [x] auth/reset-password/page.tsx:168 (new+confirm password placeholder-only -> visible labels; new-password reused profileHub.newPassword, confirm-password added new common.confirmPasswordLabel key)

## OWNER DECISIONS (2026-07-23, after mockup-decisions-rt.html)
- [x] #1 price = APPROVED -> "CHF {n}" prefix applied to PriceFrom (commit 6a05d8f96). Owner override of LOCKFILE card/row split.
- [x] #3 PDP rhythm APPROVED + APPLIED commit b38980692: real PDP now 3-tier (section 32/40, heading-to-first 12px) across SalonServices/Team/About/Products/Bundles + section stack. SalonReviews (mt-4 structure) + SalonPortfolio (mt-4/md:mt-5) skipped by the coder as non-flat-mt-5; fold in if the owner wants full consistency.
- [x] #2 icons RESOLVED: applied 3D PNGs to onboarding (967cf73bb) then REVERTED to text-only (2bb0cfcda) per owner clarification. Owner: 3D icons are HOMEPAGE-ONLY; mixing them with Lucide reads inconsistent. Onboarding category pills = text-only now (verified: beautyFields.tsx CatIcon returns null, next/image import removed, tsc clean). 3D-outside-homepage graveyarded.
- [x] SVG-icons ask RESOLVED + PARKED: owner clarified they meant Lucide (SVG) icons, 3D homepage-only, and asked for a whole UI-consistency SYSTEM. Parked to _plans/UI_CONSISTENCY_SYSTEM.md + ACTIVE.md C1 (commit 8aaf744e1). Not a to-do this turn; a dedicated future session.

## RESOLVED (was parked)
- [x] BUG2 price order -> DONE: unified to "CHF {n}" prefix (PriceFrom, commit 6a05d8f96, owner approved #1).
- [x] PDP heading-rhythm -> DONE: 3-tier applied + verified live on the real PDP (b38980692).

## TAIL DONE (commit 09e8ee529, tsc clean)
- [x] SalonServices "Buchen" CTA 13px -> 14px/15px (locked CTA floor). SalonBuy "Kaufen" LEFT: component is commented-out/dead (gift-card hidden), no live render.
- [x] /checkout DELETED (736-line dead route removed + graveyarded; live pay is BookingPaymentForm -> /confirmation).
- [x] partner cat_nails Sparkles -> Gem; SalonReviews + SalonPortfolio head-to-first mt-4 -> mt-3 (folded into 3-tier); MarketplaceReviewsList read-more hover -> opacity-80.

## NOTHING OPEN except the PARKED UI-consistency system (ACTIVE.md C1). All renewal + decisions + tail complete + verified.
