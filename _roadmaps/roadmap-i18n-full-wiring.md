# Roadmap: Full i18n Wiring (145 Components)

> **Goal:** Wire `useTranslations()` into all ~145 components that still have hardcoded German strings. Add keys to all 4 locale files (de, en, fr, it) with ACTUAL translations.

## BEHAVIOR RULES
- Read `CLAUDE.md` (Section 15, Rules 33-37) before starting.
- EVERY user-facing string must use `useTranslations()` — zero hardcoded text.
- Add keys to ALL 4 locale files: `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`.
- Provide ACTUAL translations, not placeholders. English, French, Italian must be real.
- Components that already have `useTranslations()` may still have some hardcoded strings mixed in — check those too.
- `npm run build` after every batch. Do not proceed if build fails.
- One `git commit` per batch.

---

## R1: Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 (Tier 1) | 🟡 MEDIUM | Text disappears if key missing | Add keys to ALL 4 locale files before using |
| Phase 2 (Tier 2) | 🟡 MEDIUM | Dashboard labels | Same — add keys first |
| Phase 3 (Tier 3) | 🟢 SAFE | Low-traffic components | — |
| Phase 4 | 🟢 SAFE | Docs only | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1 — Tier 1: Critical User-Facing Components (15 files)

These are the most visible components — they appear on homepage, salon pages, category pages.

**Process per component:**
1. Add `import { useTranslations } from 'next-intl';`
2. Add `const t = useTranslations('[namespace]');` at the top of the component
3. Find EVERY hardcoded German string (search for quotes containing German chars: ä, ö, ü, ß, or common words like "Jetzt", "Alle", "Noch", "Buchen", "Laden", etc.)
4. Replace with `t('keyName')`
5. Add the key to ALL 4 locale JSONs

✅ DO:
```tsx
// BEFORE:
<h2>Beliebte in Basel</h2>
<button>Jetzt buchen</button>
<p>Noch keine Salons 🥲</p>

// AFTER:
<h2>{t('popularInBasel')}</h2>
<button>{t('bookNow')}</button>
<p>{t('noSalonsYet')}</p>
```

❌ DON'T:
```tsx
// Don't leave ANY hardcoded string — even aria-labels
<button aria-label="Buchen">  // ← STILL HARDCODED
<button aria-label={t('book')}>  // ← CORRECT
```

**Files (namespace in parentheses):**

| # | File | Namespace | Known hardcoded strings |
|---|---|---|---|
| 1 | **[MODIFY] `components/HomePage.tsx`** | `home` | Section titles, category names, CTAs, "Alle ansehen", "Was suchst du?" |
| 2 | **[MODIFY] `components/SalonCard.tsx`** | `salon` | "Jetzt buchen", badge text, "Solen Top Pick" |
| 3 | **[MODIFY] `components/CategoryPage.tsx`** | `category` | Category headers, empty states, sort labels |
| 4 | **[MODIFY] `components/BookingSuccess.tsx`** | `booking` | Confirmation messages |
| 5 | **[MODIFY] `components/ChatWindow.tsx`** | `chat` | Chat UI labels, placeholders |
| 6 | **[MODIFY] `components/ReviewCarousel.tsx`** | `reviews` | Section header, "Bewertungen" |
| 7 | **[MODIFY] `components/LastMinuteCard.tsx`** | `lastMinute` | Deal labels, time labels |
| 8 | **[MODIFY] `components/MapView.tsx`** | `map` | Map labels, error messages |
| 9 | **[MODIFY] `components/coiffeur/CoiffeurSections.tsx`** | `coiffeur` | Section titles |
| 10 | **[MODIFY] `components/barber/BarbershopSections.tsx`** | `barber` | Section titles |
| 11 | **[MODIFY] `components/nail/NailsSections.tsx`** | `nails` | Section titles, "Kommt bald" |
| 12 | **[MODIFY] `components/makeup/MakeupSections.tsx`** | `makeup` | Section titles |
| 13 | **[MODIFY] `components/ui/EmptyState.tsx`** | `common` | Default empty state text |
| 14 | **[MODIFY] `components/StickyMobileCTA.tsx`** | `booking` | CTA button text |
| 15 | **[MODIFY] `components/LanguageSwitcher.tsx`** | `common` | Language names, labels |

**Verification per batch of 5:**
```bash
npm run build
# Verify English: switch to /en and check text changed
# Verify French: switch to /fr and check text changed
# Verify Italian: switch to /it and check text changed
```

**Commit:** `git commit -m "i18n(tier1): batch N — [file1, file2, file3, file4, file5]"`

> ⚠️ **BE CAREFUL**:
> - `HomePage.tsx` is massive (600+ lines) — has 30+ hardcoded strings. Take your time.
> - Some components may be Server Components — they need `getTranslations()` from `next-intl/server` instead of `useTranslations()`.
> - If a component is "use client" → `useTranslations()`. If NOT "use client" → `getTranslations()`.
> - Check that the component has a `NextIntlClientProvider` ancestor — if not, `useTranslations()` will throw at runtime.
> - Quartier names (Grossbasel, Kleinbasel, etc.) are proper nouns — do NOT translate them.

---

### Phase 2 — Tier 2: Dashboard Components (10 files)

These appear in the salon owner dashboard. Less user-facing but still need translation for multi-language salon owners.

| # | File | Namespace |
|---|---|---|
| 1 | **[MODIFY] `components/dashboard/ScheduleGrid.tsx`** | `dashboard.schedule` |
| 2 | **[MODIFY] `components/dashboard/PromoManager.tsx`** | `dashboard.promo` |
| 3 | **[MODIFY] `components/dashboard/PackageManager.tsx`** | `dashboard.packages` |
| 4 | **[MODIFY] `components/dashboard/PriceAdjustmentModal.tsx`** | `dashboard.pricing` |
| 5 | **[MODIFY] `components/dashboard/GoLiveGate.tsx`** | `dashboard.goLive` |
| 6 | **[MODIFY] `components/dashboard/DisputeNotification.tsx`** | `dashboard.disputes` |
| 7 | **[MODIFY] `components/dashboard/GiftCardManager.tsx`** | `dashboard.giftCards` |
| 8 | **[MODIFY] `components/dashboard/OffPeakManager.tsx`** | `dashboard.offPeak` |
| 9 | **[MODIFY] `components/discovery/DiscoveryAdmin.tsx`** | `discovery.admin` |
| 10 | **[MODIFY] `components/ServiceCart.tsx`** | `booking.cart` |

**Commit after each batch of 5:** `git commit -m "i18n(tier2): dashboard batch N"`

> ⚠️ **BE CAREFUL**: Dashboard components tend to have MANY labels (form fields, button text, table headers, tooltips). Count all strings before starting so you don't miss any.

---

### Phase 3 — Tier 3: Remaining Components (batches of 10)

Batch by directory. Process is identical to Tier 1.

**Batch 3A — `components/ui/`:**
ErrorFallback.tsx, QuickPreviewSheet.tsx, PriceOfferModal.tsx, SearchAutocomplete.tsx, PriceSlider.tsx, AnimatedButton.tsx, DeviceFrame.tsx, MobileViewToggle.tsx, ProgressDots.tsx, GlassModal.tsx

**Batch 3B — `components/onboarding/`:**
SetupWizard.tsx, SalonProfileStep.tsx, ServicesStep.tsx, ScheduleStep.tsx, TeamStep.tsx, OpeningHoursStep.tsx, PaymentsStep.tsx, GoLiveStep.tsx

**Batch 3C — `components/booking/ + chat/`:**
BookingBubble.tsx, GuestBookingForm.tsx, ServiceTile.tsx, StaffPicker.tsx, PickStylistFlow.tsx, QuickReplyChips.tsx, TypingIndicator.tsx

**Batch 3D — `components/barber/`:**
BarberLeaderboard.tsx, CutGuide.tsx, CutHistoryTimeline.tsx, ExpressRebook.tsx, SmartReminderConfig.tsx, WalkinQueue.tsx, WaitTimeDisplay.tsx, WalkinAnalytics.tsx, RemoteQueueJoin.tsx, WalkInModal.tsx

**Batch 3E — `components/nail/`:**
NailDiscoveryFilters.tsx, NailDesignCard.tsx, SimilarStyles.tsx, StyleNamePills.tsx, PatternSelector.tsx, ShapeLengthPicker.tsx, DesignHistoryTimeline.tsx, AiArtGenerator.tsx

**Batch 3F — `components/dashboard/nail/`:**
StationManager.tsx, RetailManager.tsx, NailPreferencesForm.tsx, NailClientTab.tsx, InfillReminderConfig.tsx, DynamicPricingConfig.tsx

**Batch 3G — Root components:**
DetailPage.tsx, ProfilePage.tsx, TerminePage.tsx, ReviewBreakdown.tsx, RecentlyViewed.tsx, NearbySalons.tsx, StaffSection.tsx, StaffProfilePage.tsx, StaffPortfolio.tsx, SolenScoreCard.tsx

**Batch 3H — Remaining root:**
SolenExclusiveBadge.tsx, FrozenSalonBanner.tsx, SetupBanner.tsx, TOSUpdateBanner.tsx, NotificationBell.tsx, NotificationItem.tsx, ShareButton.tsx, SaveButton.tsx, ReportButton.tsx, ReportContentButton.tsx

**Batch 3I — Final:**
SplitView.tsx, HeatmapChart.tsx, MiniSparkline.tsx, ImportProgressBar.tsx, ItemCard.tsx, CommentSection.tsx, UserPostsSection.tsx, ForYouSection.tsx, VideoCard.tsx, PostFromDiscover.tsx, ProfileDiscoverySections.tsx, LoyaltyCard.tsx, LoyaltyCardList.tsx, StampCard.tsx, ReferralDashboard.tsx, BookingDisputePanel.tsx, GenderToggle.tsx, Breadcrumb.tsx

**Commit per batch:** `git commit -m "i18n(tier3): batch 3X — [directory]"`

> ⚠️ **BE CAREFUL**:
> - `DetailPage.tsx` and `ProfilePage.tsx` are LARGE files (800+ lines each) — they have many hardcoded strings.
> - Some onboarding components render rich form UIs with validation messages — translate those too.
> - `TerminePage.tsx` has calendar/booking strings — these are critical for the booking flow.
> - For components in `_archive/` — SKIP them. Don't translate archived code.

---

### Phase 4: Verification + Docs

1. Run `npm run build`
2. Run `npx tsc --noEmit`
3. Switch to `/en`, `/fr`, `/it` — spot check 10 pages for stale German text
4. Verify these specific pages in English:
   - Homepage (`/en`)
   - Coiffeur category (`/en/coiffeur`)
   - Salon detail (any)
   - Booking flow (any)
   - Dashboard (`/en/dashboard`)
   - Profile (`/en/profile`)

**[MODIFY] `CLAUDE.md`** Section 15 — Add:
```
- **i18n Coverage:** As of [date], all ~200 components use `useTranslations()`. Zero hardcoded user-facing strings remain.
```

**Commit:** `git commit -m "i18n: full wiring complete — all components translated (de/en/fr/it)"`

---

## R6: Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Tier 1 — 15 critical | Nothing |
| Phase 2 | 🤖 | Tier 2 — 10 dashboard | Nothing (parallel with Phase 1 if separate session) |
| Phase 3 | 🤖 | Tier 3 — remaining batches | Phase 1 (locale JSON structure must be established first) |
| Phase 4 | 🤖 | Verify + docs | Phase 1+2+3 |
