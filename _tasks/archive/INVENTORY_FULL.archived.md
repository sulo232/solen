# Solen — Full Component & Feature Inventory

Every pattern/component/page built, grouped by feature area. Use this to point at which ones to visualize / keep / change.

---

## 🏠 HOMEPAGE (15 components)

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `HomepageHero.tsx` | Search-is-the-hero — big heading + search box + stats |
| 2 | `AirbnbSearchBar.tsx` | 3-segment search pill (category / where / when) |
| 3 | `GuidedSearch.tsx` (1021 lines!) | Full-screen search wizard with step-through |
| 4 | `HomeSearchBar.tsx` | Alt search bar variant |
| 5 | `HeroVisualCard.tsx` | Floating hero card with salon photo + glass stat |
| 6 | `FeaturedSalonCarousel.tsx` | **Per-category horizontal carousel** (the pattern you remember) |
| 7 | `DiscoverCarousel.tsx` | "Lass dich inspirieren" — discovery preview carousel |
| 8 | `RecentlyViewed.tsx` | Recently visited salons row |
| 9 | `LastMinuteStrip.tsx` | Dedicated deals banner |
| 10 | `LastMinuteCard.tsx` | Last-minute card (plum bg variant) |
| 11 | `BrowseByCitySection.tsx` | Dark city section (current Basel / coming soon Zürich/Bern) |
| 12 | `CityCarouselSection.tsx` | City carousel alternative |
| 13 | `TestimonialCarousel.tsx` | Review carousel |
| 14 | `NearbySalons.tsx` | Salons near user's location |
| 15 | `FloatingNavPill.tsx` | Mobile bottom floating nav (Home/Discover/Search/Profile) |

---

## 🔍 DISCOVERY / ENTDECKEN (42 components in `discovery/`)

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `MasonryGrid.tsx` | Pinterest-style grid for discover page |
| 2 | `ItemCard.tsx` | Main discovery card (tall portrait) |
| 3 | `VideoCard.tsx` | TikTok/video-style card |
| 4 | `DetailPage.tsx` | Discovery item detail view |
| 5 | `CategoryTabBar.tsx` | Top tab bar (Alle · Coiffeur · Barber · Nails · Spa · Makeup · Waxing) |
| 6 | `CategoryPills.tsx` | Category chip selector |
| 7 | `FilterDrawer.tsx` | Side drawer filters |
| 8 | `SearchBar.tsx` | Discovery-specific search |
| 9 | `LikeButton.tsx` | Like with animation |
| 10 | `SaveButton.tsx` | Bookmark/save |
| 11 | `ShareButton.tsx` | Share menu |
| 12 | `CommentSection.tsx` | Comments on items |
| 13 | `ForYouSection.tsx` | Personalized recs row |
| 14 | `SimilarStyles.tsx` | Similar-looking items |
| 15 | `BookCTA.tsx` | "Direkt buchen" CTA from discovery |
| 16 | `PickStylistFlow.tsx` | Flow to pick stylist from discovery |
| 17 | `PostFromDiscover.tsx` | User-submits own post |
| 18 | `ProfileDiscoverySections.tsx` | Discovery in user profile |
| 19 | `InlinePrefsPanel.tsx` | Inline preference setup |
| 20 | `ProfileSetupModal.tsx` | First-time user prefs modal |
| 21 | `AISuggestionPills.tsx` | AI-generated style suggestions |
| 22 | `DescriptionCard.tsx` | AI-generated description of a look |
| 23 | `SalonScript.tsx` | Talking points to tell the salon |
| 24 | `CutGuide.tsx` | Cut instructions / reference |
| 25 | `ProductRecommendations.tsx` | Recommended products for look |
| 26 | `StyleNamePills.tsx` | Style name tags |
| 27 | `SourceBadge.tsx` | Content source attribution |
| 28 | `RelatedTikToks.tsx` | Related video content |
| 29 | `KISection.tsx` | AI/knowledge section |
| 30 | `DiscoveryAdmin.tsx` | Admin panel for discovery |
| 31 | `DiscoveryEmptyState.tsx` | Empty state UI |
| 32 | `DiscoveryErrorState.tsx` | Error state UI |
| 33 | `DiscoveryGridSkeleton.tsx` | Loading skeleton |
| 34 | `FeaturedBoards.tsx` | Featured curation boards |
| 35 | `StaffPortfolio.tsx` | Staff's work portfolio |
| 36 | `ReportButton.tsx` | Report inappropriate content |
| 37 | `ToSCheckbox.tsx` | ToS agreement |
| 38 | `AIProcessingIndicator.tsx` | "Analyzing..." loader |
| 39 | `PatternSelector.tsx` | Pattern/texture selector |
| 40 | `GenderToggle.tsx` | Male/female toggle |
| 41 | `ImportProgressBar.tsx` | Content import progress |
| 42 | `UserPostsSection.tsx` | User's own posts grid |

### Pages
- `/discover` — main Entdecken feed
- `/discover/[id]` — item detail
- `/discover/nails` — **category-specific Entdecken (Nails version)** ← you mentioned this

---

## 🏪 SALON DETAIL PAGE (14 components in `salon/`)

| Component | Purpose |
|-----------|---------|
| `SalonHero.tsx` | Photo gallery hero |
| `SalonServices.tsx` | Services grouped by category (450 lines) |
| `SalonReviews.tsx` | Review list + breakdown |
| `SalonSidebar.tsx` / `BookingSidebar.tsx` | Desktop sticky booking card |
| `SalonMobileCTA.tsx` | Sticky mobile booking bar |
| `SalonSectionNav.tsx` | Sticky section tabs |
| `SalonOpeningHours.tsx` | Hours table |
| `SalonTabBar.tsx` | Tab navigation |
| `SalonBadge.tsx` | Status badges |
| `StaffSection.tsx` | Staff grid |
| `ServiceCategoryFilter.tsx` | Filter services by category |
| `SimilarSalons.tsx` | Related salon recs |
| `SalonPageSkeleton.tsx` | Loading skeleton |

---

## 📅 BOOKING (19 components in `booking/`)

| Component | Purpose |
|-----------|---------|
| `BookingWizard.tsx` | Multi-step shell |
| `ServicesStaffStep.tsx` | Combined service+staff pick |
| `ServiceSelectionStep.tsx` | Service multi-select |
| `StaffSelectionStep.tsx` | Staff picker |
| `StaffPicker.tsx` | Horizontal staff scroll |
| `DateTimeStep.tsx` | Calendar + time slots |
| `DateSelectionStep.tsx` | Date picker |
| `TimeSelectionStep.tsx` | Time slot pills |
| `ConfirmationStep.tsx` | Order summary |
| `PaymentStep.tsx` | Payment method |
| `ServiceCart.tsx` | Selected-services cart |
| `BookingCard.tsx` | Booking in history |
| `BookingsList.tsx` | Full booking history |
| `BookingSuccess.tsx` | "Booked!" screen |
| `GuestBookingForm.tsx` | Guest checkout |
| `GroupBookingModal.tsx` | Group booking |
| `PackageRedeemBanner.tsx` | Redeem package |
| `ReviewPrompt.tsx` | Post-service review |
| `CustomerPreferencesForm.tsx` | Preferences form |

---

## 💇 CATEGORY-SPECIFIC (customer-facing, unique per vertical)

### Barber (`components/barber/`)
- `WalkinQueue.tsx` — **real-time queue display**
- `WaitTimeDisplay.tsx` — live wait time
- `RemoteQueueJoin.tsx` — join queue remotely
- `ExpressRebook.tsx` — one-tap rebook
- `CutHistoryTimeline.tsx` — visual cut history
- `LoyaltyCard.tsx` / `LoyaltyCardList.tsx` — stamp cards with QR
- `BarbershopSections.tsx` — category page layout

### Nail (`components/nail/`)
- `NailBookingSteps.tsx` — nail-specific booking flow
- `MaterialSelector.tsx` — gel / acryl / natural
- `ShapeLengthPicker.tsx` — nail shape + length picker
- `InspoUploader.tsx` — upload inspiration photo
- `InspoBoard.tsx` — saved inspo board
- `HandChart.tsx` — interactive hand diagram
- `DesignHistoryTimeline.tsx` — past designs
- `TechPortfolio.tsx` — nail tech portfolio view
- `NailDesignCard.tsx` — nail design showcase card
- `NailDiscoveryFilters.tsx` — filter nail discover page
- `NailDiscoveryGrid.tsx` — nail-specific masonry
- `NailsSections.tsx` — nail page layout
- `AllergyWarning.tsx` — allergy info
- `RetailCheckout.tsx` — product retail checkout

### Coiffeur (`components/coiffeur/`)
- CRM tools only (customer facing is the category page + standard booking)

### Makeup (`components/makeup/`)
- (CRM-focused)

### Spa (`components/spa/`)
- (CRM-focused)

### Waxing
- (CRM-focused)

### Shared diagrams (`components/icons/` + specific)
- `BodyDiagram.tsx` — for spa + waxing
- `FaceDiagram.tsx` — for makeup
- `HandDiagram.tsx` — for nails
- `InteractiveZoneDiagram.tsx` — multi-purpose
- Custom category icons: `CoiffeurIcon`, `BarberIcon`, `NailsIcon`, `SpaIcon`, `MakeupIcon`, `WaxingIcon`

---

## 🛒 CHECKOUT / PAYMENTS
- `/checkout/page.tsx` — Stripe checkout
- `/tip/[bookingId]/page.tsx` — Post-service tipping
- `/walk-in-pay/page.tsx` — Walk-in payment
- `/compare/page.tsx` — Salon comparison tool
- `/vouchers/buy/page.tsx` — Buy gift cards
- `/profile/vouchers/page.tsx` — User's gift cards

---

## 🧑 PROFILE (8 components)
- `ProfileHero.tsx` — Avatar + name + stats
- `ProfileTabs.tsx` — 5-tab nav (Bookings / Favorites / Vouchers / Settings / Discovery)
- `BeautyProfileCard.tsx` — Beauty preferences display
- `BeautyProfileEditModal.tsx` — Edit preferences
- `LooksGrid.tsx` — Saved looks grid
- `SalonHighlights.tsx` — Favorite salons
- `PaymentMethodsSection.tsx` — Stripe saved cards
- `DeleteAccountModal.tsx` — Account deletion

---

## 🎁 LOYALTY / REFERRAL / ANGEBOTE
- `/loyalty/page.tsx` + `/loyalty/stamp/page.tsx`
- `/referral/[code]/page.tsx`
- `/angebote/page.tsx` (deals/last-minute landing)
- `/last-minute/page.tsx`
- `LoyaltyCard.tsx` (barber stamps)
- `ReferralDashboard.tsx` (for salon owners)

---

## 💬 CHAT (5+ components in `chat/`)
- `ChatWindow.tsx` (553 lines!)
- `QuickReplyChips`
- `AISuggestion` (AI reply suggestions)
- `PhotoGallery` (chat photo grid)
- `BookingBubble` (in-chat booking CTA)
- `ClientTags` (salon-side CRM tags)
- `TypingIndicator.tsx`

---

## 📊 DASHBOARD — SALON OWNER SIDE (31+ components)

### Core
- `DashboardLayout.tsx` (800 lines), `Sidebar.tsx`, `BottomTabBar.tsx`
- `StatCard.tsx` — KPI cards
- `ActivityFeed.tsx` — realtime activity
- `CommandPalette.tsx` — Ctrl+K search
- `NotificationCenter.tsx`
- `ScheduleGrid.tsx` — calendar weekly grid
- `GalleryManager.tsx`
- `SalonAboutEditor.tsx`
- `LastMinuteManager.tsx` — salon sets discounts
- `OffPeakManager.tsx`
- `PackageManager.tsx`
- `GiftCardManager.tsx`
- `PromoManager.tsx`
- `ReferralDashboard.tsx`
- `HeatmapChart.tsx` — booking heatmap
- `ForecastWidget.tsx` — revenue forecast
- `MiniSparkline.tsx`
- `StaffComparison.tsx`
- `SolenScoreCard.tsx` — salon quality score
- `PriceAdjustmentModal.tsx`
- `DisputeNotification.tsx`
- `WalkInModal.tsx`
- `BreakManager.tsx` / `ClosureManager.tsx`
- `SetupBanner.tsx` / `GoLiveGate.tsx`

### Barber dashboard
- `LiveQueuePanel.tsx`, `ExpressMenu.tsx`, `FadeBlueprint.tsx`, `HeadDiagram.tsx`
- `BarberLeaderboard.tsx`, `WalkinHourlyChart.tsx`, `WalkinAnalytics.tsx`
- `PLComparison.tsx`, `SmartReminderConfig.tsx`

### Nail dashboard
- `AiArtGenerator.tsx` — AI generates nail art designs (fal.ai)
- `AiArtGallery.tsx` — generated art gallery
- `DynamicPricingConfig.tsx`
- `StationManager.tsx`, `RetailManager.tsx`, `RetailSalesDashboard.tsx`
- `InfillReminderConfig.tsx`

### Coiffeur dashboard
- `FormulaBook.tsx` — color formulas per client
- `ConsultationNotes.tsx`, `ColourCycleConfig.tsx`

### Makeup dashboard
- `BridalPlanner.tsx`, `FaceChartBuilder.tsx`, `KitInventory.tsx`, `SkinToneMatcher.tsx`

### Spa dashboard
- `RoomManager.tsx`, `SpaIntake.tsx`, `WellnessJournal.tsx`
- `ContraindicationAlert.tsx`, `TreatmentOutcome.tsx`

### Waxing dashboard
- `BodyZoneSelector.tsx`, `SensitivityLog.tsx`, `RegrowthConfig.tsx`
- `ZonePackages.tsx`, `RebookAlerts.tsx`, `ZoneRevenueChart.tsx`

---

## 🛡️ ADMIN (13+ components)
- `/dashboard/all-users`, `/dashboard/all-salons`, `/dashboard/approvals`
- `/dashboard/platform-analytics`, `/dashboard/badge-manager`
- `/dashboard/review-moderation`, `/dashboard/disputes`
- `/dashboard/discovery-admin`, `/dashboard/content-editor`
- `/dashboard/help-editor`, `/dashboard/homepage-admin`
- `/dashboard/editor`, `/dashboard/admin-sandbox`, `/dashboard/queue-display`

---

## 🎨 UI PRIMITIVES (73 components in `ui/`)

### Buttons + interactions
- `button.tsx`, `AnimatedButton.tsx`, `interactive-hover-button.tsx`
- `expandable-tabs.tsx` / `ExpandableTabs.tsx`

### Cards + content
- `card.tsx`, `GlassCard.tsx`, `GlassModal.tsx`
- `PhotoLightbox.tsx`, `ImageFallback.tsx`

### Search + filters
- `SearchAutocomplete.tsx` (smart dropdown)
- `ServiceAutosuggest.tsx`
- `SearchBar.tsx`, `FilterBar.tsx`
- `FilterBottomSheet.tsx` / `FilterDrawer.tsx`
- `SubCategoryChips.tsx`, `ScrollableFilterRow.tsx`
- `SortDropdown.tsx`, `PriceSlider.tsx`
- `AddressAutocomplete.tsx`

### Navigation
- `Breadcrumb.tsx`, `tabs.tsx`, `sidebar.tsx`
- `SalonSectionNav.tsx`

### Feedback / states
- `Spinner.tsx`, `Skeleton.tsx`, `Toast.tsx`
- `EmptyState.tsx`, `ErrorFallback.tsx`
- `PageState.tsx` (new canonical primitive from main)

### Overlays
- `BottomSheet.tsx`, `PhotoLightbox.tsx`
- `ProgressDots.tsx` (step indicators)

### Decorative
- `border-beam.tsx`, `tracing-beam.tsx` (scroll animation)
- `beauty-icons.tsx`, `category-icons.tsx`
- `SolenExclusiveBadge.tsx`, `TrustBadges.tsx`, `SocialProofStrip.tsx`

### System
- `ThemeScript.tsx`, `ThemeToggle.tsx` (retired but still in code)
- `LanguageSwitcher.tsx` (DE/EN/FR/IT)
- `CookieBanner.tsx`
- `PWAInstallPrompt.tsx`

---

## 🔌 EXISTING FEATURE SYSTEMS (fully wired)

| System | What it does | Backend |
|--------|-------------|---------|
| Deals / Angebote badges | -{N}% overlay on cards + /angebote page | `last_minute_settings` table |
| Favorites | Heart → API → profile | `/api/profile/favorites` |
| Recently viewed | localStorage `solen_recently_viewed` | client-only |
| Badges | "Top bewertet", "Beliebt", "Neu" auto-assigned | rule-based on rating/reviews |
| Category affinity | Tracks user's category prefs → reorders home | `useRecentVisits.bubbleRank` |
| City detection | Passive geolocation → personalized city | `useCityDetection` hook |
| Loyalty stamps | QR-signed stamps, 9-10 visit cards | HMAC-signed codes |
| Walk-in queue | Realtime position in barber queue | Supabase Realtime |
| Inspo boards | Save discovery items to named boards | `inspo_boards` table |
| Tutorial tour | First-visit driver.js onboarding | client, one-time |
| AI nail art | fal.ai generates custom nail designs | `@fal-ai/client` |
| AI description | Gemini generates look description | `@google/generative-ai` |
| Vector search | pgvector for AI-suggested services | Supabase pgvector |
| Realtime chat | Customer ↔ salon chat | Supabase Realtime |
| Booking flow | Stripe Payment Intent + webhooks | Stripe Connect |
| Tips | Post-service tipping flow | Stripe |
| Gift cards | Buy + redeem | Stripe |
| Group booking | Multi-person booking | Zod-validated |
| Walk-in pay | Pay at salon without booking | Stripe |
| Referrals | Code-based referral tracking | `referrals` table |
| Packages | Multi-visit packages | `packages` table |
| Off-peak pricing | Dynamic pricing in low hours | rule-based |
| Solen Score | Platform quality score | computed |
| Dispute resolution | Booking disputes flow | admin-reviewed |

---

## 📱 18 CRON JOBS (operational)
- Booking reminders (24h, 2h before)
- Review prompt (24h after service)
- Last-minute slot generation
- Discovery feed rebuild
- Vector embedding regeneration
- Stripe payout reconciliation
- Badge recomputation
- Walk-in queue cleanup
- ... and more

---

## 🔑 KEY TAKEAWAYS

### You already have:
- **Per-category carousel pattern** (what you remembered) — `FeaturedSalonCarousel` inside `HomePage.tsx` loop
- **Full Entdecken page** with masonry, category filter, like/save/share, AI-enhanced pages (nails has its own)
- **Category-specific power features** — barber live queue, nail AI art, coiffeur formula book, makeup face chart, spa body diagram
- **Complete booking flow** (4-step wizard)
- **Loyalty stamp cards** with QR-signing
- **Chat system** w/ AI reply suggestions
- **Dashboard** for salon owners (31+ components + 6 category-specific dashboards)
- **Admin tools** (13+ pages)
- **Payments** (Stripe Connect, tips, gift cards, packages, walk-in pay)

### What's "missing" is only **presentation** — the actual features + backend all exist. The only job left is making them look right in the new coral + Bebas + Fraunces + DM Sans system.

### What would ACTUALLY take new build:
- Porting the coral design into existing Next.js components (replacing the `bg-white shadow-elevation-1` card wrappers with no-box variant B)
- Updating `app/globals.css` with new palette
- Cleaning old V5 tokens out of CSS variables

**Every other piece already works.**
