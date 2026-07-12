# Motion modernization sweep (owner ask 2026-07-10: blur+scale+opacity everywhere, single-property looks dated)

<!-- exists-check: net-new vs _design-system/MOTION.md (the locked VOCABULARY doc, which this sweep enforces, not replaces , its remaining-work list never had a full site inventory) and vs the older MOTION_CONSISTENCY_AUDIT (pre-recipe era). This file = the 2026-07-10 inventory + upgrade plan against the locked recipe; MOTION.md gets a one-line pointer during PASS A, not a rewrite. -->

Full inventory by agent sweep 2026-07-10. THE FINDING: the modern recipe ALREADY EXISTS AND IS LAW
(`app/[locale]/_components/primitives/motion.ts` , useEnterMotion / ENTER_RECIPE / enterStaggerContainer
/ useStepSwapMotion = opacity+scale+blur, 420ms glide; enforced on NEW code by motion-recipe-gate).
Only 7 of 135 animated sites use it , all in components-legacy/booking/. The other 94 legacy
single-property sites predate the recipe and feed off TWO systemic sources:

1. `lib/animations.ts` (fadeIn/slideUp/scaleIn/itemVariants/modalVariants/toastVariants , no blur
   anywhere) , ~18 importers: all 10 dashboard pages, onboarding, auth, GlassModal, Toast, StatCard,
   SearchResultGrid, PageTransition.
2. The `app/globals.css` keyframe cluster (.salon-card-stagger, .animate-in, .celebrate-rise,
   fade-in-up, inspo-panel-in, Tailwind animate-in slide-in-from-*) , homepage rows, search grid,
   BookingConfirmation, the whole discovery module.

Plus the highest-leverage single item: `layout/PageTransition.tsx` is DEAD CODE , wraps every route,
returns bare children (V3-D75-pt-fix regression), so route changes have zero transition.

## The upgrade plan (class: [code] , the recipe is locked law; sequencing respects mockup-first)
1. DEMO FIRST (one approval, then the sweep): port 3 visible surfaces , homepage section rows
   (.salon-card-stagger -> enterStaggerContainer/Item), BookingConfirmation .celebrate-rise (the
   peak-end moment, psychology law 1), and PageTransition route fade , capture Playwright VIDEO
   (preview tab throttles rAF), owner approves the feel.
2. SYSTEMIC PASS A: rewrite lib/animations.ts variants to include blur (all 18 importers inherit).
3. SYSTEMIC PASS B: port the globals.css keyframe cluster consumers to the primitives module.
4. TAIL: the per-file leftovers from the table below (sheets add opacity+blur to y-slide, modals
   gain blur, step-swaps -> useStepSwapMotion). Micro-interactions (31 sites: press/hover/layoutId)
   stay single-property BY DESIGN , do not "upgrade" those.
5. Delete-or-wire: ui/sidebar.tsx unused AnimatePresence import.

| file:line | what animates today | upgrade |
|---|---|---|
| _components/homepage/SectionHeader.tsx:403 | .salon-card-stagger opacity+y | enterStaggerContainer/Item (every homepage row) |
| _components/homepage/CategoryPromos.tsx:72 | same | same |
| _components/homepage/HeroDuo.tsx:88 | opacity+y spring | useStaggerVariants |
| _components/business/BentoCard.tsx:71 | opacity+y 0.5s | useEnterMotion |
| _components/homepage/SearchBar.tsx:293,377 | opacity+scale | add blur |
| _components/homepage/SearchBar.tsx:425 | opacity+y segment swap | useStepSwapMotion |
| _components/homepage/BentoBusiness.tsx:207,407,567 | opacity+scale / opacity-only / opacity+y | add blur each |
| _components/layout/Header.tsx:191 | dropdown opacity+y+scale | add blur |
| _components/layout/MobileMenu.tsx:165 | opacity+y | useEnterMotion |
| _components/search/SearchTemplate.tsx:1599 | .salon-card-stagger | swap class |
| _components/search/SearchTemplate.tsx:1917-1951 | map/list swap opacity+y | recipe crossfade |
| _components/search/SearchOverlay.tsx:708,717,746 | y-only sheet + opacity+y steps | full recipe + useStepSwapMotion |
| components-legacy/search/SearchResultGrid.tsx:98 | lib/animations variants | enterStaggerContainer/Item |
| ui/SortDropdown.tsx:110 | opacity+scale+y | add blur |
| ui/GuidedSearch.tsx:349,443,579,824,890 | pill/sheet/steps single-property | useStepSwapMotion across |
| ui/SearchAutocomplete.tsx:212,336 | opacity+y | add scale+blur |
| ui/QuickPreviewSheet.tsx:66,94 | y-only / x-only | full recipe both |
| components-legacy/ReviewBreakdown.tsx:79 | width-only bars | wrap rows useEnterMotion |
| components-legacy/ReviewForm.tsx:210 | y+opacity sheet | add blur+scale |
| ui/PhotoLightbox.tsx:79,122 | x+opacity slides | add scale+blur |
| components-legacy/RecentlyViewed.tsx:93 | opacity+y stagger | useStaggerVariants |
| booking/ServiceDetailSheet.tsx:125 | y-only spring | add opacity+blur |
| booking/StaffListSheet.tsx:44 | y-only spring | same |
| booking/ServicesStaffStep.tsx:572 | sub-sheet missed | align to primitives |
| booking/WaitlistModal.tsx:97 | y-only | align |
| _components/tips/TipSheet.tsx:40 | y-only draggable | add opacity+blur |
| booking/BookingConfirmation.tsx:168,177,254 + globals.css:461 | .celebrate-rise opacity+y , THE PEAK MOMENT | useEnterMotion+stagger (priority) |
| checkout/page.tsx:381 | opacity+y | useEnterMotion |
| booking-action/page.tsx:42 | opacity+y | useEnterMotion |
| ui/Toast.tsx:51 | toastVariants (live path; MOTION.md claim stale) | blur or ENTER_RECIPE |
| ui/EmptyState.tsx:50, EmptyStateFTU.tsx:53 | opacity+scale / opacity+y | useEnterMotion (app-wide) |
| ui/ErrorFallback.tsx:17, ErrorState.tsx:46 | opacity+y / opacity+scale | useEnterMotion |
| ui/GlassModal.tsx:128 | modalVariants no blur | ENTER_RECIPE modal |
| layout/PageTransition.tsx:12-19 | DEAD , returns bare children | route-level enter fade (highest leverage) |
| ui/sidebar.tsx | unused AnimatePresence | wire or drop |
| auth/register/page.tsx:268, onboarding/salon/page.tsx:665 | slideSwitch opacity+x | useStepSwapMotion |
| coming-soon / staff-invite:84 / walk-in-pay:348 | opacity+y x3 | useEnterMotion |
| rewards/RewardsView.tsx:98 | opacity+y | enterStaggerContainer/Item |
| loyalty/stamp/page.tsx:106 | fade-in-up CSS | useEnterMotion |
| inspo/page.tsx:408 | inspo-panel-in no blur | add blur |
| discovery: MasonryGrid:24, SaveToBoardSheet:86, DetailPage:211+, FilterDrawer:69 | tailwind animate-in | useEnterMotion/Stagger |
| ui/ExpandableTabs:58, PWAInstallPrompt:65, ReportContentButton:59, ui/FilterDrawer:68, FilterBottomSheet:60 | crossfade/translate-only | per-site recipe |
| discovery/PostFromDiscover:171, ProfileSetupModal:125, profile/BeautyProfileEditModal:163, auth/TosPrompt:78 | modalVariants x4 | ENTER_RECIPE modal |
| core/morphing-dialog.tsx:177 | opacity-only overlay | animate blur too |
| ui/animated-testimonials.tsx:143 | missing blur only | add blur |
| CityPage.tsx:176, layout/BottomTabBar.tsx:173 | opacity+y / y-only | Stagger / useEnterMotion |
| dashboard: 10 pages + page.tsx:144 + StatCard:74 + SalonAboutEditor:88 | itemVariants opacity+y | inherited by PASS A |
| NotificationCenter:108, SalonSwitcher:124, DashboardLayout:334, editor/EditPanel:213 | slide-only panels | add opacity+blur |
| chat/AISuggestion:73, QuickReplyChips:43, ChatWindow:300,382 | opacity+y/scale | useEnterMotion |
| nail/HandChart:165, profile/LiveActivityCard:79 | opacity+y | useEnterMotion (LiveActivityCard reduced-motion pattern = the reference) |
| onboarding/SetupWizard:123, steps/GoLiveStep:92 | opacity+y / opacity+scale | useEnterMotion |

Counts: 135 total / 7 compliant / 94 legacy-single / 31 micro-ok (deliberately untouched) / 3 no-motion-notable.
Also: MOTION.md's Toast claim is stale (says CSS tilt; live path is toastVariants) , correct the doc during PASS A.
