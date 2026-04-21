# Solen.ch — Complete Feature & Component Inventory

> **Purpose**: Full map of everything that exists before the redesign. Reference only — not all of this survives.
> **Generated**: 2026-04-15

---

## TL;DR Numbers

| What | Count |
|------|-------|
| Customer-facing pages | 25 routes |
| User account pages | 11 routes |
| Dashboard pages | 28 routes |
| Admin pages | 14 routes |
| Static/legal pages | 13 routes |
| **Total pages** | **91 routes** |
| Components | 200+ files |
| API routes | 325+ endpoints |
| Cron jobs | 18 automated tasks |
| Edge Functions | 7 Supabase functions |
| Category verticals | 6 (coiffeur, barber, nails, spa, makeup, waxing) |

### External Services Wired In
- **Supabase** — DB, Auth (Google OAuth + email), Realtime, Storage
- **Stripe** — Payments, Connect (salon payouts), saved cards, refunds
- **Resend** — Transactional emails (reminders, review prompts, welcome series)
- **seven.io** — SMS (appointment reminders, walk-in payment links)
- **Gemini AI** — Recommendations, intake form AI, discovery descriptions, chat suggestions
- **fal.ai** — AI nail art image generation
- **PostHog** — Analytics events
- **Redis/Upstash** — Rate limiting, OTP caching, AI budget tracking
- **Mapbox** — Interactive maps

---

## HOMEPAGE — Current State

### Component Tree
```
Layout (Header, Footer, FloatingNavPill)
  └─ HomePage.tsx (192 lines — orchestrator)
     ├─ HomepageHero.tsx (64 lines)
     │  └─ AirbnbSearchBar.tsx (400+ lines)
     ├─ GuidedSearch.tsx (1021 lines — modal, triggered by event)
     ├─ LastMinuteStrip.tsx (120 lines)
     ├─ FeaturedSalonCarousel.tsx (240+ lines) × up to 5 categories
     ├─ RecentlyViewed.tsx (150 lines)
     ├─ DiscoverCarousel.tsx (200 lines)
     ├─ BrowseByCitySection.tsx (130 lines)
     ├─ TestimonialCarousel.tsx (150 lines)
     ├─ TrustStatsBanner.tsx (232 lines)
     └─ TutorialTour (driver.js tooltips)
```

### Homepage API Calls
| Endpoint | Called By | Purpose |
|----------|----------|---------|
| `/api/me` | HomePage, Header | User name, last booked salon |
| `/api/profile/favorites` | FeaturedSalonCarousel | Favorited salon IDs |
| `/api/reviews/homepage` | TestimonialCarousel | 4+ star reviews (max 6) |
| `/api/metrics/global` | TrustStatsBanner | Salon count, review count, bookings |
| `/api/discovery/feed` | DiscoverCarousel | 30 items, show first 5 |
| `/api/search/detect-category` | HomeSearchBar | Auto-detect category from query |

### Homepage Features/Systems
| Feature | How It Works |
|---------|-------------|
| **Recently Viewed** | localStorage `solen_recently_viewed`, max 5 items, timestamp-sorted |
| **Favorites** | Heart toggle → POST/DELETE `/api/profile/favorites`, optimistic UI |
| **City Detection** | `useCityDetection` hook, cookie/localStorage persistence |
| **Category Affinity** | Tracks user preference, reorders carousel categories |
| **Section Toggles** | Server-controlled via `platform_settings` key `homepage_sections` |
| **Demo Fallback** | If <3 salons with photos, shows DEMO_SALONS array |
| **Recent Searches** | localStorage `solen_recent_searches`, max 5, used in GuidedSearch |
| **Tutorial Tour** | driver.js tooltips on first visit |
| **PostHog** | Fires `homepage_viewed` event |

---

## HEADER — Current State

| Feature | Detail |
|---------|--------|
| **File** | `components/layout/Header.tsx` (489 lines) |
| **Auth** | Fetches `/api/me` for session, Supabase `signOut()` |
| **Scroll behavior** | Hides on scroll down, shows on scroll up, morphs after 200px |
| **Search pill** | Compact AirbnbSearchBar appears when hero search scrolls out |
| **CategoryStickyRow** | Responds to `categoryGridVisibility` CustomEvent |
| **Language** | LanguageSwitcher (DE/EN/FR/IT) |
| **Profile dropdown** | Name, logout, dashboard link (if salon_owner) |

---

## SEARCH SYSTEM — Current State

### Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| **AirbnbSearchBar** | 400+ | 3-segment pill (category, city, date) + service quick-picks |
| **GuidedSearch** | 1021 | Full-screen 3-step wizard (category → city/date → time) |
| **HomeSearchBar** | 177 | Legacy inline search (not used on homepage) |
| **SearchAutocomplete** | 350 | Debounced autocomplete with salon/service/city grouping |
| **SplitView** | 254 | Search results with grid/map toggle |
| **FilterBar** | 222 | Category, location, price, rating filters |
| **FilterBottomSheet** | 144 | Mobile filter drawer |
| **MapView** | 329 | Mapbox with clustering, dark mode, category chips |

### Search API Calls
| Endpoint | Purpose |
|----------|---------|
| `/api/salons?...filters` | Main salon search |
| `/api/salons/search?q=` | Text search |
| `/api/search/smart` | AI-powered search |
| `/api/search/suggest` | Autocomplete suggestions |
| `/api/search/detect-category` | Category detection from text |

### Search State Management
- **URL params**: category, q, date, priceMin, priceMax, sort, minRating, lat, lng
- **localStorage**: city preference, mobile view preference (grid/map)

---

## SALON DETAIL — Current State

### Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| **SalonHero** | 180 | Photo gallery with carousel/grid + lightbox |
| **SalonServices** | 118 | Service listing with category filter |
| **SalonReviews** | 383 | Reviews + filtering + flagging + review form |
| **SalonSidebar** | 136 | Desktop sticky sidebar with quick-book |
| **SalonMobileCTA** | 92 | Mobile sticky bottom bar |
| **SalonSectionNav** | 124 | Sticky nav with IntersectionObserver |
| **SalonTabBar** | 67 | Tab nav with sliding underline |
| **SalonOpeningHours** | 140 | Collapsible hours display |
| **StaffSection** | 121 | Staff carousel |
| **SimilarSalons** | 71 | 3 similar salons |
| **BookingSidebar** | 106 | Alternative booking sidebar |

### Salon Detail API Calls
| Endpoint | Purpose |
|----------|---------|
| `/api/salons/[slug]` | Full salon profile |
| `/api/salons/similar` | Similar salons |
| `/api/reviews/salon/[id]` | Salon reviews |
| `/api/reviews/[id]/flag` | Flag review |
| `/api/salons/[slug]/off-peak-today` | Today's deals |

---

## BOOKING FLOW — Current State

### Components (4-step wizard)
| Step | Component | Lines | Purpose |
|------|-----------|-------|---------|
| Shell | **BookingWizard** | 172 | Master orchestrator with progress bar |
| 1 | **ServicesStaffStep** | 219 | Service + staff selection |
| 1-alt | **ServiceSelectionStep** | 184 | Multi-service with running total |
| 2 | **DateTimeStep** | 305 | Calendar + time slots |
| 3 | **ConfirmationStep** | 194 | Summary + cancellation policy |
| 4 | **PaymentStep** | 216 | Online vs in-person + booking creation |
| Add-on | **ServiceCart** | 194 | Cart with promo/gift/referral codes |
| Add-on | **GuestBookingForm** | 113 | Guest checkout (no account needed) |
| Add-on | **GroupBookingModal** | 205 | Multi-person booking |
| Add-on | **PackageRedeemBanner** | 105 | Package credit redemption |
| Post | **ReviewPrompt** | 168 | Floating review card |
| Post | **BookingSuccess** | — | Confirmation page |

### Booking API Calls
| Endpoint | Purpose |
|----------|---------|
| `/api/availability/unavailable-dates` | Blackout dates |
| `/api/availability/time-slots` | Available times |
| `/api/bookings` | Create booking |
| `/api/bookings/group` | Group booking |
| `/api/services/[id]/addons` | Service add-ons |
| `/api/packages/redeem` | Package redemption |

### Booking State
- **BookingContext**: formData (services, staff, date, time, payment, promo), currentStep, navigation

---

## DISCOVERY — Current State (42 components)

### Core Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| **MasonryGrid** | 149 | Responsive masonry layout |
| **ItemCard** | 145 | Grid card with like/save |
| **VideoCard** | 194 | TikTok video embed |
| **DetailPage** | 227 | Full detail with booking CTA |
| **CategoryTabBar** | 64 | Category filter tabs |
| **LikeButton** | 99 | Like with optimistic update |
| **SaveButton** | 108 | Save to collection (auth) or localStorage (guest) |
| **ShareButton** | 116 | WhatsApp, TikTok, Instagram, link copy |
| **CommentSection** | 159 | Comments with pagination |
| **ForYouSection** | 109 | Personalized carousel |
| **BookCTA** | 96 | Booking call-to-action |
| **PickStylistFlow** | 119 | Staff selection for booking |
| **PostFromDiscover** | 316 | Create new discovery post |
| **AISuggestionPills** | 113 | Trending suggestion pills |
| **DescriptionCard** | 102 | AI-generated description |
| **SalonScript** | 76 | Script to tell stylist |
| **ProfileSetupModal** | 214 | Discovery preference onboarding |

### Discovery API Calls
| Endpoint | Purpose |
|----------|---------|
| `/api/discovery/feed` | Personalized feed |
| `/api/discovery/like` | Like toggle |
| `/api/discovery/save` | Save to collection |
| `/api/discovery/save/sync` | Sync guest saves on login |
| `/api/discovery/comments` | Get/post comments |
| `/api/discovery/similar` | Similar items |
| `/api/discovery/post` | Create post |
| `/api/discovery/generate-description` | AI description (Gemini) |

### Discovery Features
| Feature | How It Works |
|---------|-------------|
| **Guest saves** | localStorage `disc_saves_guest`, synced on login |
| **AI descriptions** | Gemini generates maintenance level, face shapes, hair type |
| **TikTok embed** | oEmbed API for thumbnails, iframe for playback |
| **Stylist booking bridge** | Pick stylist → generate booking URL with params |
| **Content moderation** | Admin panel, auto-flagging, report system |

---

## PROFILE — Current State

### Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| **ProfilePage** | 1159 | Main container (tabs, data fetching) |
| **ProfileHero** | 100 | Avatar, name, action buttons |
| **ProfileTabs** | 64 | 5 tabs (looks, termine, favoriten, stempel, settings) |
| **BeautyProfileCard** | 167 | Beauty preferences display |
| **BeautyProfileEditModal** | 292 | Preference editor (hair, nails, skin, style) |
| **LooksGrid** | 69 | User's saved looks |
| **SalonHighlights** | 87 | Favorite salons carousel |
| **PaymentMethodsSection** | 215 | Stripe saved cards |
| **DeleteAccountModal** | 131 | GDPR account deletion (30-day grace) |

### Profile API Calls
| Endpoint | Purpose |
|----------|---------|
| `/api/profile` | Get/update profile |
| `/api/profile/favorites` | Favorite salons |
| `/api/profile/delete` | Account deletion |
| `/api/stripe/payment-methods` | Saved cards |
| `/api/profile/accept-tos` | TOS acceptance |
| `/api/profile/export` | GDPR data export |

---

## CHAT — Current State

### Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| **ChatWindow** | 554 | Main chat UI with all features |
| **AISuggestion** | 112 | AI reply suggestions (Gemini) |
| **BookingBubble** | ~60 | Booking CTA after 3+ messages |
| **QuickReplyChips** | ~60 | Template reply chips |
| **PhotoGallery** | ~100 | Photo tab in chat |
| **ClientTags** | ~50 | CRM tags display |

### Chat Features
| Feature | How It Works |
|---------|-------------|
| **Realtime** | Supabase Realtime (postgres_changes + presence) |
| **Translation** | POST `/api/translate`, cached in localStorage |
| **Price offers** | In-chat price negotiation |
| **AI suggestions** | POST `/api/chat/suggest` (debounced 1s) |
| **File upload** | Image/video in messages |
| **Read receipts** | POST `/api/conversations/[id]/messages/read` |

---

## AUTH — Current State

### Components
| Component | Purpose |
|-----------|---------|
| **SignIn** (221 lines) | Google OAuth + email/password + password reset |
| **TosPrompt** (119 lines) | TOS version check on app load |

### Auth API Calls
| Endpoint | Purpose |
|----------|---------|
| `/api/auth/login` | Email/password login |
| `/api/auth/signup` | New registration |
| `/api/auth/callback` | OAuth callback |
| `/api/auth/logout` | Sign out |
| `/api/auth/verify-otp` | OTP verification |
| `/api/auth/verify-phone/send` | SMS OTP send |
| `/api/auth/verify-phone/check` | SMS OTP verify |

---

## DASHBOARD — Current State (31 core + 51 category-specific)

### Core Dashboard Components
| Component | Purpose | Key API |
|-----------|---------|---------|
| **DashboardLayout** (590 lines) | Shell with sidebar, command palette | `/api/profile` |
| **StatCard** | KPI with sparkline + count-up | — |
| **ActivityFeed** | Realtime activity log | Supabase Realtime |
| **CommandPalette** | Ctrl+K search | — |
| **NotificationCenter** | Bell + notification panel | `/api/notifications` |
| **ScheduleGrid** | Staff weekly schedule editor | `/api/staff/my-schedule` |
| **GalleryManager** | Drag-reorder gallery + upload | `/api/salons/[id]/gallery` |
| **SalonAboutEditor** | Multilingual description (DE/EN/FR/IT) | `/api/salons/mine` |
| **SetupBanner** | Onboarding progress tracker | `/api/salon/setup-progress` |
| **GoLiveGate** | Pre-launch checklist | `/api/salon/go-live` |
| **SolenScoreCard** | Quality score (0-100) | `/api/analytics/solen-score` |
| **HeatmapChart** | Day-hour booking heatmap | — |
| **ForecastWidget** | Revenue forecast (linear regression) | — |
| **StaffComparison** | Staff KPI table/chart | `/api/analytics/staff-comparison` |

### Marketing Dashboard
| Component | Purpose | Key API |
|-----------|---------|---------|
| **LastMinuteManager** (364 lines) | Deal discounts | `/api/salon/last-minute-settings` |
| **OffPeakManager** (244 lines) | Time-based discount rules | `/api/off-peak` |
| **PackageManager** (268 lines) | Service packages | `/api/packages` |
| **GiftCardManager** | Gift card analytics | `/api/gift-cards/balance` |
| **PromoManager** (263 lines) | Promo codes | `/api/promo` |
| **ReferralDashboard** | Referral stats | `/api/analytics/referrals` |

### Client CRM
| Component | Purpose | Key API |
|-----------|---------|---------|
| **FormulaTab** | Color formulas | `/api/clients/[id]/formulas` |
| **ClientPhotosTab** | Before/after photos | `/api/clients/[id]/photos` |
| **IntakeFormTab** | Intake questionnaires + AI | `/api/clients/[id]/intake` + `/api/ai/intake-recommendation` |

### Operations
| Component | Purpose | Key API |
|-----------|---------|---------|
| **WalkInModal** | Quick walk-in booking | `/api/bookings/walk-in` |
| **BreakManager** | Staff breaks | `/api/staff/breaks` |
| **ClosureManager** | Salon closures | `/api/salon/closures` |
| **PriceAdjustmentModal** | Price override | `/api/bookings/[id]/price-adjust` |
| **DisputeNotification** | Dispute alerts | `/api/bookings/[id]/report` |

---

## CATEGORY VERTICALS — Features Per Category

### Barber (11 dashboard + 8 customer components)
| Feature | Dashboard Component | Customer Component | API |
|---------|-------------------|-------------------|-----|
| **Walk-in queue** | LiveQueuePanel | WalkinQueue, WaitTimeDisplay, RemoteQueueJoin | Supabase Realtime, `/api/walkin/queue` |
| **Express rebook** | ExpressMenu | ExpressRebook | `/api/bookings/express-rebook` |
| **Cut history** | — | CutHistoryTimeline | `/api/clients/[id]/cut-history` |
| **Fade blueprints** | FadeBlueprint + HeadDiagram | — | `/api/dashboard/fade-blueprints` |
| **Loyalty cards** | LoyaltyConfig | LoyaltyCard, LoyaltyCardList | `/api/loyalty/*` (HMAC-signed QR) |
| **Chair management** | ChairManager | — | `/api/barber/chairs` |
| **Leaderboard** | BarberLeaderboard | — | `/api/dashboard/barber-leaderboard` |
| **Smart reminders** | SmartReminderConfig | — | `/api/cron/barber-smart-reminders` |
| **Walk-in analytics** | WalkinAnalytics, WalkinHourlyChart | — | `/api/dashboard/walkin-analytics` |
| **P&L comparison** | PLComparison | — | `/api/dashboard/barber/pl-comparison` |
| **Barber profiles** | — | Public at `/salon/[slug]/barber/[barberSlug]` | `/api/barber/[slug]` |

### Nails (9 dashboard + 14 customer components)
| Feature | Dashboard Component | Customer Component | API |
|---------|-------------------|-------------------|-----|
| **AI art generator** | AiArtGenerator, AiArtGallery | — | `/api/admin/nail/generate` (fal.ai) |
| **Station management** | StationManager | — | `/api/nail/stations` |
| **Dynamic pricing** | DynamicPricingConfig | — | `/api/salon/dynamic-pricing` |
| **Infill reminders** | InfillReminderConfig | — | `/api/cron/nail-infill-reminders` |
| **Retail POS** | RetailManager, RetailSalesDashboard | RetailCheckout | `/api/nail/retail`, Stripe |
| **Design history** | NailClientTab | DesignHistoryTimeline | `/api/clients/[id]/nail-history` |
| **Material selector** | — | MaterialSelector, ShapeLengthPicker | `/api/nail-materials` |
| **Inspo boards** | — | InspoBoard, InspoUploader | `/api/nail-inspo/*` |
| **Hand chart** | — | HandChart + HandDiagram | `/api/nail/hand-chart` |
| **Tech portfolio** | — | TechPortfolio | `/api/nail-tech/[id]/portfolio` |
| **Allergy tracking** | NailPreferencesForm | AllergyWarning | `/api/clients/[id]/nail-allergies` |
| **Discovery feed** | — | NailDiscoveryGrid, NailDiscoveryFilters | `/api/discover/nails` |

### Coiffeur (5 dashboard components)
| Feature | Component | API |
|---------|-----------|-----|
| **Formula book** | FormulaBook, FormulaPhotoUpload | `/api/coiffeur/formulas` |
| **Consultation notes** | ConsultationNotes | `/api/dashboard/coiffeur/consultations` |
| **Colour cycle** | ColourCycleConfig | `/api/dashboard/coiffeur/cycle-metrics` |
| **Allergy tracking** | AllergyAlert | `/api/clients/[id]/allergies` |

### Makeup (4 dashboard components)
| Feature | Component | API |
|---------|-----------|-----|
| **Bridal planner** | BridalPlanner | `/api/dashboard/makeup/bridal` |
| **Face chart** | FaceChartBuilder + FaceDiagram | `/api/dashboard/makeup/face-charts` |
| **Kit inventory** | KitInventory | `/api/dashboard/makeup/kit` |
| **Skin tone matcher** | SkinToneMatcher | `/api/dashboard/makeup/skin-tone-analytics` |

### Spa (5 dashboard components)
| Feature | Component | API |
|---------|-----------|-----|
| **Room management** | RoomManager | `/api/dashboard/spa/rooms` |
| **Spa intake** | SpaIntake | `/api/spa/intake` |
| **Wellness journal** | WellnessJournal + BodyDiagram | `/api/dashboard/spa/wellness-journal` |
| **Contraindications** | ContraindicationAlert | `/api/spa/contraindications` |
| **Treatment outcomes** | TreatmentOutcome | `/api/dashboard/spa/treatment-outcomes` |

### Waxing (7 dashboard components)
| Feature | Component | API |
|---------|-----------|-----|
| **Body zone selector** | BodyZoneSelector + InteractiveZoneDiagram | — |
| **Sensitivity log** | SensitivityLog | `/api/dashboard/waxing/sensitivity` |
| **Regrowth tracking** | RegrowthConfig, RegrowthTimeline | `/api/waxing/regrowth-config` |
| **Zone packages** | ZonePackages | `/api/salon/waxing-zone-packages` |
| **Rebook alerts** | RebookAlerts | `/api/dashboard/waxing/rebook-alerts` |
| **Zone revenue** | ZoneRevenueChart | `/api/dashboard/waxing/zone-revenue` |

---

## CRON JOBS & AUTOMATION (18 tasks)

| Cron | Purpose | Services |
|------|---------|----------|
| `reminders` | Appointment email reminders | Supabase, Resend |
| `sms-reminders` | SMS reminders (24h/1h) | Supabase, seven.io |
| `review-prompt` | Review request 24h after booking | Supabase, Resend |
| `welcome-series` | Welcome email sequence | Supabase, Resend |
| `birthday-messages` | Birthday wishes | Supabase, Resend |
| `barber-smart-reminders` | Visit-cycle detection | Supabase |
| `nail-infill-reminders` | Infill due emails | Supabase |
| `rebooking-nudge` | Rebook campaigns | Supabase |
| `auto-complete` | Auto-complete past bookings | Supabase |
| `generate-slots` | Generate availability slots | Supabase |
| `pending-timeout` | Cancel stale pending bookings | Supabase, Stripe |
| `late-cancel` | Process late cancellation fees | Supabase, Stripe |
| `no-show` | Process no-show fees | Supabase, Stripe |
| `pre-charge` | Pre-charge pending bookings | Supabase, Stripe |
| `release-deposits` | Release held deposits | Supabase, Stripe |
| `release-payments` | Release salon payouts | Supabase, Stripe |
| `salon-onboarding` | Onboarding email sequence | Supabase |
| `process-deletions` | GDPR account deletion (30-day) | Supabase |

---

## ALGORITHMS & INTELLIGENT FEATURES

| Algorithm | Where | How It Works |
|-----------|-------|-------------|
| **Discovery recommendation** | `/api/discovery/feed` | Based on user's last 3 saved items + category affinity |
| **AI search (pgvector)** | `/api/search/smart` | Vector similarity search on service embeddings |
| **Category detection** | `/api/search/detect-category` | AI classifies free-text into category |
| **Smart reminders** | `barber-smart-reminders` cron | Visit-cycle detection from `barber_cut_history` |
| **Infill calculator** | `lib/nail/infill-calculator.ts` | Per-service reminder cycle (days) |
| **Dynamic pricing** | `lib/nail/station-availability.ts` | Rule-based price modifiers (peak/off-peak/weekend/loyalty) |
| **Solen Score** | `/api/analytics/solen-score` | 0-100 quality score (completeness, reviews, response time, etc.) |
| **Badge auto-assign** | `/api/admin/badges/auto-assign` | Criteria-based badge assignment (top rated, popular, new) |
| **Revenue forecast** | ForecastWidget | Linear regression with confidence bands |
| **AI intake recommendations** | `/api/ai/intake-recommendation` | Gemini analyzes intake form → personalized service recs |
| **AI chat suggestions** | `/api/chat/suggest` | Gemini generates reply suggestions for salon owners |
| **AI descriptions** | `/api/discovery/generate-description` | Gemini writes maintenance level, face shapes, hair type match |
| **AI nail art** | `/api/admin/nail/generate` | fal.ai generates nail designs from style/shape/color/skin tone |
| **Loyalty QR** | `lib/barber/loyalty-qr.ts` | HMAC-signed QR tokens for stamp cards |
| **Walk-in queue** | Supabase Realtime | Real-time status transitions (waiting→in_chair→completed) |

---

## ORPHANED COMPONENTS (exported but unused)

These exist in the codebase but no page imports them:

| Component | Lines | Notes |
|-----------|-------|-------|
| TerminePage | 644 | Complex booking page, superseded |
| AnimatedButton | 112 | Superseded by button.tsx |
| ProgressDots | 36 | Step indicator, unused |
| StickyMobileCTA | 40 | Mobile CTA, unused |
| TrustBadges | 30 | Trust badges, unused |
| border-beam | 49 | Decorative effect |
| tracing-beam | 127 | Scroll effect |
| CategorySkeleton | 32 | Loading placeholder |
| SalonCardSkeleton | 19 | Loading placeholder |
| ImageUploader | 203 | Superseded by ImageUpload |
| StaffPortfolio | 170 | Staff gallery, unused |
| ReviewForm | 285 | Exists but not imported by any page |
| HowItWorks | 88 | Removed from homepage |
| card.tsx | 78 | Primitive, may be used inline |
| input.tsx | 24 | Primitive, may be used inline |
| category-icons.tsx | 79 | Icon reference |
| TypingIndicator | 14 | Chat typing dots |

---

## PAYMENT FLOWS

| Flow | Route | Stripe Feature |
|------|-------|---------------|
| **Booking payment** | `/api/stripe/create-payment-intent` | PaymentIntents |
| **Salon payouts** | `/api/stripe/connect/*` | Connect accounts |
| **Saved cards** | `/api/stripe/save-card`, `/api/stripe/payment-methods` | SetupIntents |
| **Gift card purchase** | `/api/gift-cards/purchase` | PaymentIntents |
| **Package purchase** | `/api/packages/purchase` | PaymentIntents |
| **Nail retail** | `/api/nail/retail/checkout` | PaymentIntents |
| **Tip processing** | `/api/tips` | PaymentIntents |
| **Walk-in SMS pay** | `/api/bookings/walk-in-verify` | Tokenized payment links |
| **Refunds** | `/api/bookings/[id]/refund` | Refunds |
| **Deposit hold/release** | `release-deposits` cron | PaymentIntents (capture later) |
| **Late cancel fee** | `late-cancel` cron | Charge saved card |
| **No-show fee** | `no-show` cron | Charge saved card |
| **Webhook** | `/api/stripe/webhook` | payment_intent.succeeded, etc. |

---

## WHAT THIS MEANS FOR THE REDESIGN

**The backend stays.** All 325 API routes, cron jobs, Stripe integration, Supabase schema — none of that changes. The redesign is purely visual.

**What changes:**
- Every component's JSX/CSS (the look)
- Component composition (what goes where on each page)
- Design tokens (colors, fonts, spacing, shadows, radii)
- Interaction patterns (hover, press, transitions)
- Layout grids and responsive breakpoints

**What doesn't change:**
- API contracts (endpoints, request/response shapes)
- Business logic (booking flow, payment processing, auth)
- Database schema
- External service integrations
- Feature functionality

**Next step:** You drop references for specific pieces (card, header, search, grid — whatever). I break it down, you approve, I rebuild the visual layer on top of the existing backend.
