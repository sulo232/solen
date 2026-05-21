# Solen V5 — Audit Remediation Roadmap

> **For Claude Code**: This is a step-by-step execution guide generated from a full codebase audit on 2026-03-28. Each phase has exact file paths, line-level instructions, and copy-paste replacement patterns. Execute phases sequentially. Read `_rules/UI_RULES.md` and `CLAUDE.md` §3.3 before starting.

---

## Design System Quick Reference

| Token | Value | Usage |
|---|---|---|
| **Easing** | `cubic-bezier(0.23, 1, 0.32, 1)` | ALL hover/reveal transitions |
| **Card hover** | `translateY(-4px)` at 400ms | `.card-v4` pattern |
| **Glass** | `.glass-frost` / `.glass-search` / `.glass-toolbar` | Floating UI ONLY |
| **Content cards** | `.card-v4` (solid white, 16px radius) | NEVER glass on cards |
| **Shadows** | `shadow-v5-card` (rest) / `shadow-v5-card-hover` (hover) | Layered warm |
| **Ambient BG** | `.ambient-v5` | Replaces `.ambient-v4` |

---

## Phase A — Quick Wins (5 min)

### A1. `ambient-v4` → `ambient-v5` (2 files)

**File**: `components/HomePage.tsx`
```diff
- // BlobBackground removed — V4 uses ambient-v4
+ // V5 uses ambient-v5 gradients
```
Find the className that includes `ambient-v4` and replace with `ambient-v5`.

**File**: `components/CategoryPage.tsx`
```diff
- // BlobBackground removed — V4 uses ambient-v4
+ // V5 uses ambient-v5 gradients
```
Find the className that includes `ambient-v4` and replace with `ambient-v5`.

### A2. Fix generic `shadow-lg` (1 file)

**File**: `components/layout/Header.tsx` ~L189
```diff
- shadow-lg
+ shadow-elevation-3
```

### A3. Fix slow duration (1 file)

**File**: `components/HomePage.tsx` ~L234
```diff
- duration-700
+ duration-[400ms]
```

---

## Phase B — `transition-all` Purge (~70+ occurrences)

> **Rule**: `transition-all` is BANNED by V5 §21-A. It transitions every CSS property (including layout-triggering ones), causing jank. Always name exact properties.

### Replacement Cheat Sheet

Copy-paste these exact replacements based on context:

| Context | Old | New |
|---|---|---|
| Card hover (lift + shadow) | `transition-all` | `transition-[transform,box-shadow]` |
| CTA button (brightness + press) | `transition-all` | `transition-[transform,filter]` |
| Form input (focus border + ring) | `transition-all` | `transition-[border-color,box-shadow]` |
| Tab/pill switch (bg + text color) | `transition-all` | `transition-colors` |
| Tooltip/overlay (fade) | `transition-all` | `transition-opacity` |
| Progress bar (width change) | `transition-all` | `transition-[width]` |
| Nav icon (size + color change) | `transition-all` | `transition-[transform,color]` |
| Modal/sheet (size animation) | `transition-all` | `transition-[transform,opacity]` |
| Input selection (border + bg) | `transition-all` | `transition-[background-color,border-color,box-shadow]` |

### B1. Customer-facing components (highest visibility)

**File**: `components/SalonCard.tsx`
- L203 (checkbox): `transition-all` → `transition-[background-color,border-color]`
- L220 (heart button): `transition-all` → `transition-[transform,background-color]`
- L224 (heart icon): `transition-all` → `transition-[transform,color]`
- L292 (AI tooltip): `transition-all` → `transition-[opacity,transform]`

**File**: `components/HomePage.tsx`
- L274 (category cards): `transition-all` → `transition-[transform,box-shadow]`
- L540 (CTA button): `transition-all` → `transition-[transform,box-shadow]`

**File**: `components/LastMinuteCard.tsx`
- L59 (card wrapper): `transition-all` → `transition-[transform,box-shadow]`

### B2. Salon profile page

**File**: `app/[locale]/salon/[slug]/page.tsx`
- L506, L515 (photo nav buttons): `transition-all` → `transition-[transform]`
- L532 (photo dots): `transition-all` → `transition-[background-color,width,height]`
- L830 (staff cards): `transition-all` → `transition-[transform,box-shadow]`
- L836 (staff avatar ring): `transition-all` → `transition-[ring-color,transform]`
- L900 (service rows): `transition-all` → `transition-[background-color,border-color]`
- L1002 (service tab pills): `transition-all` → `transition-colors`
- L1061 (book button): `transition-all` → `transition-[transform,filter]`

### B3. Booking & checkout

**File**: `components/TerminePage.tsx`
- L103 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/checkout/page.tsx`
- L308 (CTA): `transition-all` → `transition-[transform,filter]`

### B4. Onboarding steps (14 total across 8 files)

For ALL onboarding CTA buttons (the coral full-width buttons), replace:
```diff
- transition-all
+ transition-[transform,filter]
```

Files and approximate counts:
- `components/onboarding/steps/ServicesStep.tsx` — L164, L193, L220
- `components/onboarding/steps/PaymentsStep.tsx` — L89 (card selection: use `transition-[background-color,border-color,box-shadow]`), L151
- `components/onboarding/steps/OpeningHoursStep.tsx` — L106 (day toggle: use `transition-colors`), L170
- `components/onboarding/steps/ScheduleStep.tsx` — L92, L102
- `components/onboarding/steps/TeamStep.tsx` — L95, L129
- `components/onboarding/steps/SalonProfileStep.tsx` — L125 (pill toggle: use `transition-colors`), L171
- `components/onboarding/steps/GoLiveStep.tsx` — L122
- `components/onboarding/SetupWizard.tsx` — L83 (step dots: use `transition-colors`), L159

### B5. Dashboard admin tabs (6 files, identical pattern)

All admin pages have the same tab pill pattern. Replace in each:
```diff
- transition-all duration-150
+ transition-colors duration-150
```

Files:
- `app/[locale]/dashboard/nail-admin/page.tsx` ~L63
- `app/[locale]/dashboard/spa-admin/page.tsx` ~L62
- `app/[locale]/dashboard/barber-ops/page.tsx` ~L64
- `app/[locale]/dashboard/coiffeur-crm/page.tsx` ~L92, L160
- `app/[locale]/dashboard/waxing-admin/page.tsx` ~L65
- `app/[locale]/dashboard/makeup-admin/page.tsx` ~L61

### B6. Other pages

**File**: `app/[locale]/warum-solen/page.tsx`
- L50 (section): `transition-all` → `transition-opacity`
- L199, L423 (CTAs): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/vouchers/buy/page.tsx`
- L76, L305 (CTAs): `transition-all` → `transition-[transform,filter]`
- L198, L216 (selection cards): `transition-all` → `transition-[background-color,border-color,box-shadow]`

**File**: `app/[locale]/partner/page.tsx`
- L156 (feature cards): `transition-all` → `transition-[border-color,box-shadow]`
- L444 (FAQ accordion): `transition-all` → `transition-[border-color,box-shadow]`
- L462 (FAQ content): `transition-all` → `transition-[height,opacity]`

**File**: `app/[locale]/tip/[bookingId]/page.tsx`
- L130 (tip buttons): `transition-all` → `transition-colors`
- L174 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/not-found.tsx`
- L25 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/walk-in-pay/page.tsx`
- L233 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/loyalty/stamp/page.tsx`
- L94 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/onboarding/salon/page.tsx`
- Multiple inputs (~L85, L97, L132, L235, L262, L278): `transition-all` → `transition-[border-color,box-shadow]`
- Multiple pills/buttons (~L112, L561, L654, L663): `transition-all` → `transition-[transform,filter]` or `transition-colors`
- Progress bar (~L600): `transition-all` → `transition-[width]`

**File**: `app/[locale]/profile/packages/page.tsx`
- L132 (progress bar): `transition-all` → `transition-[width]`

**File**: `app/[locale]/dashboard/discovery-posts/page.tsx`
- L177 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `app/[locale]/dashboard/discovery-admin/page.tsx`
- L201, L447 (image selection): `transition-all` → `transition-[border-color,box-shadow]`

**File**: `app/[locale]/dashboard/services/page.tsx`
- L288 (service rows): `transition-all` → `transition-[background-color,border-color]`

**File**: `app/[locale]/dashboard/settings/page.tsx`
- L132 (language pills): `transition-all` → `transition-colors`

**File**: `app/[locale]/terms/components/TermsSidebar.tsx`
- L116 (sidebar links): `transition-all` → `transition-colors`

**File**: `app/[locale]/privacy/components/PrivacySidebar.tsx`
- L104 (sidebar links): `transition-all` → `transition-colors`

### B7. UI primitives

**File**: `components/ui/interactive-hover-button.tsx`
- L19: `transition-all` → `transition-[transform,filter]`

**File**: `components/ui/date-picker.tsx`
- L55: `transition-all` → `transition-[border-color,box-shadow]`

**File**: `components/ui/CitySelector.tsx`
- L76: `transition-all` → `transition-colors`

**File**: `components/ui/ExpandableTabs.tsx`
- L31: `transition-all` → `transition-[background-color,color,border-color]`

**File**: `components/ui/ProgressDots.tsx`
- L23: `transition-all` → `transition-[background-color,transform]`

**File**: `components/ui/ImageUploader.tsx`
- L152 (progress bar): `transition-all` → `transition-[width]`

**File**: `components/ui/HeroVisualCard.tsx`
- L60: `transition-all` → `transition-[transform,filter]`

### B8. Layout

**File**: `components/layout/Header.tsx`
- L127 (pill container): `transition-all` → `transition-[max-width,padding,min-height,background-color,border-color,box-shadow,backdrop-filter]` — OR simplify to just `transition-[transform,opacity]` if the size change is removed
- L167 (nav container): `transition-all` → `transition-opacity`

**File**: `components/editor/DeviceFrame.tsx`
- L108: `transition-all` → `transition-[width,height]`

### B9. Search / Map / Other components

**File**: `components/search/SearchResultGrid.tsx`
- L75 (cards): `transition-all` → `transition-[background-color,border-color]`
- L91 (CTA): `transition-all` → `transition-[transform,filter]`

**File**: `components/search/MobileViewToggle.tsx`
- L16: `transition-all` → `transition-[transform,box-shadow]`

**File**: `components/shared/ClientSelectorDropdown.tsx`
- L65: `transition-all` → `transition-[border-color,box-shadow]`

**File**: `components/MapView.tsx`
- L310: `transition-all` → `transition-[transform,filter]`

**File**: `components/loyalty/StampCard.tsx`
- L98: `transition-all` → `transition-colors`

**File**: `components/ReviewForm.tsx`
- L254: `transition-all` → `transition-[transform,filter]`

**File**: `components/ReviewBreakdown.tsx`
- L72 (progress bar): `transition-all` → `transition-[width]`

**File**: `components/StaffPortfolio.tsx`
- L87: `transition-all` → `transition-[transform,filter]`

**File**: `components/staff/StaffProfilePage.tsx`
- L256: `transition-all` → `transition-[transform,filter]`

**File**: `components/staff/StaffAvailability.tsx`
- L62: `transition-all` → `transition-[background-color,border-color,box-shadow]`

---

## Phase C — Glass Standardization (39 files)

> **Rule**: V5 uses `.glass-frost`, `.glass-search`, `.glass-toolbar` CSS classes in `globals.css`. No more inline `backdrop-filter` or `background: rgba(...)` glass.

### C1. Floating UI → `.glass-frost` class

For each file below, find the inline `backdrop-filter: blur(...)` + `background: rgba(255,255,255,...)` combo and replace with the `.glass-frost` className:

```diff
- style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.72)', ... }}
+ className="glass-frost"
```

| File | Component | Notes |
|---|---|---|
| `components/ui/GlassModal.tsx` | Modal container | Replace inline glass with `.glass-frost` |
| `components/ui/SearchAutocomplete.tsx` | Dropdown panel | Add `glass-frost` to dropdown wrapper |
| `components/ui/FilterBottomSheet.tsx` | Sheet panel | `glass-frost` (Zone 1-2 only) |
| `components/ui/BottomSheet.tsx` | Sheet panel | `glass-frost` |
| `components/ui/QuickPreviewSheet.tsx` | Preview card | `glass-frost` |
| `components/ui/CookieBanner.tsx` | Banner | `glass-frost` |
| `components/notifications/NotificationBell.tsx` | Dropdown | `glass-frost` |
| `components/compare/CompareDrawer.tsx` | Drawer | `glass-frost` |
| `components/coiffeur/AiMatcherModal.tsx` | Modal | `glass-frost` |
| `components/discovery/DetailPage.tsx` | Overlay | `glass-frost` if floating |
| `components/discovery/FilterDrawer.tsx` | Drawer | `glass-frost` |
| `components/discovery/SourceBadge.tsx` | Floating badge | `glass-frost` if floating |
| `components/discovery/VideoCard.tsx` | Overlay | `glass-frost` if floating |
| `components/discovery/ItemCard.tsx` | Overlay | Evaluate if needed |
| `components/auth/TosPrompt.tsx` | Modal | `glass-frost` |
| `components/barber/BarbershopSections.tsx` | Floating elements | `glass-frost` if floating |
| `components/coiffeur/CoiffeurSections.tsx` | Floating elements | `glass-frost` if floating |
| `components/nail/NailDesignCard.tsx` | Card overlay | `glass-frost` if floating |

### C2. Search bar → `.glass-search` class

**File**: `components/ui/HomeSearchBar.tsx`
```diff
- style={{ backdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.82)', ... }}
+ className="glass-search rounded-input"
```

### C3. Sticky bar → `.glass-toolbar` class

**File**: `components/compare/CompareBar.tsx`
```diff
- style={{ backdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.88)', ... }}
+ className="glass-toolbar"
```

### C4. Remove glass from Zone 3 / Zone 4 (CRITICAL)

These components MUST NOT use glass — replace with solid surfaces:

**File**: `components/dashboard/WalkInModal.tsx`
```diff
- backdrop-blur-[20px] bg-white/70
+ bg-white dark:bg-s-dm-surface
```

**File**: `components/dashboard/PriceAdjustmentModal.tsx`
```diff
- backdrop-blur-[20px] bg-white/70
+ bg-white dark:bg-s-dm-surface
```

**File**: `components/dashboard/CommandPalette.tsx`
```diff
- backdrop-blur bg-white/80
+ bg-white dark:bg-s-dm-surface shadow-v5-float
```

**File**: `components/booking/GroupBookingModal.tsx`
```diff
- backdrop-blur bg-white/80
+ bg-white dark:bg-s-dm-surface
```

### C5. Evaluate `GlassCard.tsx` for retirement

Check if `GlassCard.tsx` is imported anywhere. If only used for content cards:
```bash
# Run this to check usage:
rg "GlassCard" components/ app/ --include="*.tsx" -l
```
If only decorative / floating UI usage → keep but refactor to use `.glass-frost`.
If content card usage → retire and replace with `.card-v4`.

---

## Phase D — Hover & Radius Cleanup

### D1. Old hover lift → V5 pattern (9 files)

Find `hover:-translate-y-[5px]` and replace with V5 pattern:

```diff
- hover:-translate-y-[5px] hover:shadow-warm-lg transition-all duration-250
+ hover:-translate-y-1 hover:shadow-v5-card-hover transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]
```

| File | Notes |
|---|---|
| `components/ServiceTile.tsx` L30 | Card hover |
| `components/nail/NailsSections.tsx` | Style cards |
| `components/discovery/ForYouSection.tsx` | Discovery cards |
| `components/discovery/SimilarStyles.tsx` | Related cards |
| `components/coiffeur/CoiffeurSections.tsx` | Section cards |
| `components/booking/StaffPicker.tsx` | Staff selection |
| `components/barber/BarbershopSections.tsx` | Section cards |
| `components/salon/StaffSection.tsx` | Staff cards |
| `app/[locale]/salon/[slug]/page.tsx` L830 | Staff section cards |

### D2. Interactive `rounded-full` → `rounded-pill`

Only fix on **interactive elements** (buttons, pills, badges). Leave `rounded-full` on avatars, dots, spinners.

| File | Line(s) | Element | Fix |
|---|---|---|---|
| `components/ui/ScrollableFilterRow.tsx` | L102 | Filter icon buttons | `rounded-pill` |
| `components/ui/ScrollableFilterRow.tsx` | L125 | Filter text pills | `rounded-pill` |
| `components/ui/TrustBadges.tsx` | L20 | Trust badge | `rounded-pill` |
| `components/ui/SolenExclusiveBadge.tsx` | L24 | Exclusive badge | `rounded-pill` |
| `components/ui/DiscoverCarousel.tsx` | L96, L103 | Prev/Next nav buttons | `rounded-pill` |

---

## Execution Order

```
A1 → A2 → A3                    (5 min — ambient, shadow, duration fixes)
B1 → B2 → B3                    (30 min — customer-facing transition-all)
B4 → B5                         (15 min — onboarding + dashboard tabs)
B6 → B7 → B8 → B9               (20 min — pages, primitives, layout)
C4                               (10 min — CRITICAL zone violations)
C1 → C2 → C3                    (20 min — glass class migration)
D1 → D2                         (10 min — hover + radius)
C5                               (5 min — GlassCard evaluation)
```

**Estimated total**: ~2 hours of focused code changes

---

## Verification After Each Phase

```bash
# Phase A — verify no ambient-v4 remains:
rg "ambient-v4" components/ app/ --include="*.tsx"

# Phase B — verify transition-all eliminated:
rg "transition-all" components/ app/ --include="*.tsx" | wc -l
# Target: 0 (or only in _archive/ files)

# Phase C — verify no inline glass outside .glass-* classes:
rg "backdrop-filter|backdrop-blur" components/ app/ --include="*.tsx" -l
# Target: only files that intentionally use backdrop (e.g., modal backdrops with bg-black/50)

# Phase D — verify no old hover:
rg "translate-y-\[5px\]" components/ app/ --include="*.tsx"
# Target: 0

# Build check:
npm run build
```

---

## Files Not To Touch

| File/Directory | Reason |
|---|---|
| `components/_archive/*` | Archived/deprecated components |
| `components/ui/PriceSlider.tsx` | `rounded-full` is correct for range slider thumbs |
| `components/ui/Spinner.tsx` | `rounded-full` is correct for spinner |
| `components/ui/TypingIndicator.tsx` | `rounded-full` is correct for dots |
| `components/ui/SalonCardSkeleton.tsx` | `rounded-full` is correct for skeleton shapes |
| Any `dark:` pair on glass fallback | Keep dark mode fallbacks where `.glass-frost` already handles them |
