# 🎨 Solen.ch — Full Design Rebrand Roadmap (Final v3)

> **Every AI agent MUST read `CLAUDE.md` and `UI_RULES.md` before making ANY changes.**
> **Branch:** `main` (after tagging current state as `v1-design-teal`)
> **Build check:** `npm run build` must pass before every commit. No exceptions.
> **True scope:** ~98 files across `components/` AND `app/`, plus 4 API routes, manifest.json, and sw.js.

---

## ⚠️ WCAG CONTRAST RULE (Mandatory)

`text-s-coral` (`#E8624A`) on `bg-s-bg-base` (`#FAF6EF`) = **~3.2:1 contrast ratio → FAILS WCAG AA for body text.**

**Rule:** `text-s-coral` is ONLY for:
- Large text (≥18px bold / ≥24px regular) — headings, hero text
- Icons, badges, buttons (where bg is coral with white text)
- Decorative accents (dots, borders, underlines)

**For body-size text on cream backgrounds**, use `text-s-coral-text` (`#7A2415`, ratio ~9.5:1).

The token already exists in tailwind.config. Claude Code must use `text-s-coral-text` whenever coral-colored text appears at <18px on cream.

## Design Decisions (All Confirmed)

| Decision | Value |
|---|---|
| Primary color | Terracotta Coral `#E8624A` |
| Accent | Amber `#D4870A` + Basel Blue `#6BA3C8` |
| Backgrounds | Cream `#FAF6EF` (base), White `#FFFFFF` (cards), `#EDE5D8` (sunken inputs) |
| Blobs | CTA buttons + salon card hover ONLY |
| Background blobs | Hero + salon profile headers ONLY |
| Nav | Floating pill (sticky, centered) |
| Dark mode | Full warm (`#151009` base, `#1E1710` surface, `#F5EEE4` text) |
| Fonts | Bebas Neue (display ≥40px) + Syne (headings) + DM Sans (body + data) |
| Data numbers | DM Sans `tabular-nums` (drop Space Grotesk) |
| Zones | 2 zones — Expressive (homepage, categories) + Functional (booking, dashboard) |
| Logo | `so.len` Bebas Neue with coral dot |
| Bottom nav | Keep ExpandableTabs, recolor (including internal bg) |

---

## 🔴 KNOWN BUGS THAT MUST BE FIXED (from code audit)

| # | Bug | Where | Fix |
|---|---|---|---|
| 1 | `expandable-tabs.tsx` L99: hardcoded `bg-teal/10` background | Internal to component | Change L99 from `bg-teal/10` → `bg-s-coral/10` |
| 2 | `ChatWindow.tsx` (480L): 10 teal refs — message bubbles, tabs, send button, compose bar, inputs | Not in any prior version of roadmap | Full color migration (see Phase 3 table) |
| 3 | `solenTier` TypeScript type uses `"teal"` string literal | `SalonCard.tsx` L32 | Change type to `"gold" \| "coral" \| "grey" \| "dark"` |
| 4 | Header: Phase 3 color changes get OVERWRITTEN by Phase 5 rebuild | Header.tsx | **SKIP Header.tsx in Phase 3 entirely. Do ALL header work in Phase 5.** |
| 5 | `text-dark` → `text-s-ink`: scope unclear | Global across 70+ files | **Decision: leave `text-dark` as-is for now.** The `dark` token value changes from `#1A1A2E` → `#1A1209` in `tailwind.config.js`. All `text-dark` automatically inherits. No per-file changes needed unless you want semantic naming (defer to cleanup phase). |
| 12 | `dark` color token is an OBJECT with 7 shades (50–500), not a simple string | `tailwind.config.js` L29-37 | Change `dark.DEFAULT` AND `dark.500` to `#1A1209`. Also warm-shift shades: `dark.50: "#FAF6EF"`, `dark.100: "#EDE5D8"`, `dark.200: "#C8B8A6"`, `dark.300: "#8A7A66"`, `dark.400: "#4A3D2E"`. |
| 6 | `bg-coral` (old `#FF6B6B`) vs `bg-s-coral` (new `#E8624A`): Phase 9 deletes old `coral` token | 10+ files use `bg-coral`, `text-coral`, `fill-coral` | **Every `bg-coral` → `bg-s-coral`, every `text-coral` → `text-s-coral`, every `fill-coral` → `fill-s-coral` in Phase 3. Must be 100% complete BEFORE Phase 9 deletes old token.** |
| 7 | `shadow-coral-glow` referenced inconsistently | SalonCard L155, salon page L728, L751 | Replace ALL `shadow-coral-glow` with `shadow-warm-md`. Update tailwind.config `coral-glow` shadow to new hex AND add `warm-md` shadow. |
| 8 | `--radius: 12px` → `16px` silently rounds ALL `rounded-lg/md/sm` elements | Global | **Decision: keep `--radius: 12px` for now. The 16px change makes checkboxes, radio buttons, and inputs look too bubbly. Only change if explicitly requested.** |
| 9 | Footer has **13** inline `style={{}}` — roadmap said 10 | Footer.tsx L21,31,41,54,69,82,91,100,109,121,132,150,156 | Remove ALL 13 inline styles. Use only Tailwind classes. |
| 10 | `fixed` → `sticky` header breaks `pt-20/pt-24` top padding on 12+ pages | See list below | **After Phase 5 header change:** update ALL pages that have `pt-16/pt-20/pt-24` for old fixed header. **Keep pt values but adjust:** `sticky top-4` with glass pill doesn't need as much offset — reduce `pt-24` → `pt-8`, `pt-20` → `pt-6`, etc. |
| 11 | Dark mode: no `.dark {}` CSS variable block for 21st.dev components | `globals.css` | **Phase 7 MUST add `.dark { --primary: ...; --background: ...; }` to globals.css** alongside Tailwind dark: classes. |

### Pages with top padding to fix after Phase 5:

| File | Current padding |
|---|---|
| `app/[locale]/page.tsx` L5 | `pt-16` |
| `app/[locale]/salon/[slug]/page.tsx` L264 | `pt-20` |
| `app/[locale]/account/page.tsx` L546 | `pt-20` |
| `app/[locale]/account/messages/page.tsx` L73 | `pt-20` |
| `app/[locale]/warum-solen/page.tsx` L179 | `pt-16` |
| `app/[locale]/agb/page.tsx` L5 | `pt-24` |
| `app/[locale]/impressum/page.tsx` L5 | `pt-24` |
| `app/[locale]/datenschutz/page.tsx` L5 | `pt-24` |
| `app/[locale]/help/page.tsx` L56 | `pt-24` |
| `app/[locale]/help/[slug]/page.tsx` L54,76 | `pt-24` |
| `app/[locale]/last-minute/page.tsx` L113 | `pt-24` |
| `components/CategoryPage.tsx` L201 | `pt-24 pb-6` (hero gradient) |

---

## EXECUTION SPLIT: 3 CLAUDE CODE PROMPTS

Split to prevent agent fatigue. Each prompt is self-contained.

---

## 📋 PROMPT 1: Foundation + Color Migration (~5 hours)

### Phase 0 — Safety + Docs First (30 min) 🟢

```bash
git tag v1-design-teal -m "Pre-rebrand snapshot"
git push origin v1-design-teal
```

**IMMEDIATELY update docs** (prevents contradiction window):

#### [MODIFY] `CLAUDE.md` Section 3.3 — Update palette NOW
```markdown
> ⚠️ DESIGN REBRAND IN PROGRESS — migrate all `teal` → `s-coral`, all `font-data` → `data-text`
> Primary: Terracotta Coral #E8624A (class: s-coral)
> Accents: Amber #D4870A (s-amber), Blue #6BA3C8 (s-blue)
> Background: Cream #FAF6EF (s-bg-base)
> Dark: #151009 (s-dm-bg)
```

#### [MODIFY] `UI_RULES.md` — Update primary colors NOW

#### Audit react-router-dom (document only, don't fix):
```bash
grep -rn "from ['\"]react-router" components/ app/ --include="*.tsx" --include="*.ts"
```
If results found, note in `_tasks/INCOMPLETE_FEATURES.md`. Don't fix during rebrand.

```bash
git add CLAUDE.md UI_RULES.md && git commit -m "phase 0: tag v1-design-teal, update docs to new palette" && git push
git tag rebrand-ph0 && git push origin rebrand-ph0
```

---

### Phase 1 — Token Foundation (45 min) 🟢

> **Additive ONLY. Changes ZERO visual output.**

#### [MODIFY] `app/globals.css` — Google Fonts import (L2)

**From:** `...family=Space+Grotesk:wght@300;400;500;600&display=swap`
**To:** `...family=Bebas+Neue&...` (ADD Bebas Neue, REMOVE Space Grotesk)

Add utilities in `@layer utilities` AFTER `.font-data`:
```css
.font-display { font-family: "Bebas Neue", sans-serif; }
.data-text { font-family: "DM Sans", sans-serif; font-variant-numeric: tabular-nums; font-weight: 500; }
```

#### [MODIFY] `tailwind.config.js` — Add all new tokens (colors, shadows, blobs, fonts)

Add inside `theme.extend.colors` — **DON'T remove existing `teal`, `coral`, `dark`**:
```js
"s-coral": { DEFAULT: "#E8624A", hover: "#CC4E35", subtle: "#FAECE7", text: "#7A2415" },
"s-amber": { DEFAULT: "#D4870A", hover: "#B3700A", subtle: "#FEF4E0", text: "#6B4005" },
"s-blue": { DEFAULT: "#6BA3C8", hover: "#4E8AB5", subtle: "#EAF3FB", text: "#1A4D72" },
"s-plum": { DEFAULT: "#4A1E3C", subtle: "#F0E8F0", text: "#4A1E3C" },
"s-sage": { DEFAULT: "#7BA688", subtle: "#EBF5EE", text: "#2E5E3A" },
"s-sand": { DEFAULT: "#C9A96E", subtle: "#F7F0E3", text: "#6B5430" },
"s-ink": { DEFAULT: "#1A1209", secondary: "#4A3D2E", tertiary: "#8A7A66", disabled: "#C4B8A6" },
"s-bg": { base: "#FAF6EF", surface: "#F3EDE2", raised: "#FFFFFF", sunken: "#EDE5D8" },
"s-dm": { bg: "#151009", surface: "#1E1710", raised: "#26201A", sunken: "#120D07", text: "#F5EEE4", "text-secondary": "#C8BAA8" },
```

Also update the EXISTING `dark` color token — **it's an object, not a string**:
```js
dark: {
  DEFAULT: "#1A1209",  // was #1A1A2E — warm ink
  50: "#FAF6EF",       // was #f5f5f8 — warm cream
  100: "#EDE5D8",      // was #e8e8f0
  200: "#C8B8A6",      // was #c8c8d8
  300: "#8A7A66",      // was #9999b0
  400: "#4A3D2E",      // was #666688
  500: "#1A1209",      // was #1A1A2E
},
```

Add blob radius, warm shadows, display font (as previously specified).

```bash
npm run build
git add tailwind.config.js app/globals.css
git commit -m "phase 1: add brand v2 tokens alongside existing" && git push
git tag rebrand-ph1 && git push origin rebrand-ph1
```

---

### Phase 2 — CSS Variable Bridge (30 min) 🟡

#### [MODIFY] `app/globals.css` — `:root` CSS vars

Change `--primary` HSL from teal to coral: `10 78% 60%`
Change `--ring` to coral
Change `--background` to cream: `34 44% 95%`
Change `--accent` to amber: `36 92% 44%`
**Keep `--radius: 12px`** (BUG #8 fix — don't change to 16px)

#### [MODIFY] `app/globals.css` — body styles (L40-44)

```css
body { font-family: "DM Sans", sans-serif; color: #1A1209; background: #FAF6EF; }
```

#### [MODIFY] `app/globals.css` — glass utilities (L62-75)

Warm-tint glass: `rgba(250, 246, 239, 0.88)` with `rgba(26, 18, 9, 0.08)` borders.

#### [MODIFY] `app/globals.css` — focus rings (L94-116)

`rgba(56, 178, 172, 0.5)` → `rgba(232, 98, 74, 0.5)` (both light and dark)

#### [MODIFY] `app/globals.css` — coral-pulse (L82-85)

`rgba(255, 107, 107, 0.4)` → `rgba(232, 98, 74, 0.4)`

```bash
npm run build
git add app/globals.css && git commit -m "phase 2: CSS var bridge — primary→coral, bg→cream, glass→warm" && git push
git tag rebrand-ph2 && git push origin rebrand-ph2
```

---

### Phase 3 — Color Migration: ALL 98 FILES (3 hours) 🔴

> **⚠️ SKIP Header.tsx (BUG #4). ALL header work happens in Prompt 2 Phase 5.**
>
> **Order: components/ui/ first → components/ major → app/ pages → api routes**

#### 3.1 — UI Components (15+ files)

Every `text-teal` → `text-s-coral`, `bg-teal` → `bg-s-coral`, `border-teal` → `border-s-coral`, `ring-teal` → `ring-s-coral`, `from-teal` → `from-s-coral`, `hover:text-teal` → `hover:text-s-coral`, `hover:bg-teal` → `hover:bg-s-coral`.

Also: every `text-coral` → `text-s-coral`, `bg-coral` → `bg-s-coral`, `fill-coral` → `fill-s-coral`.
Also: every `font-data` → `data-text`.
Also: every `shadow-coral-glow` → `shadow-warm-md`.

**CRITICAL — `expandable-tabs.tsx` BUG #1 fix:**
Line 49: `activeColor = "text-teal"` → `activeColor = "text-s-coral"`
Line 99: `isSelected ? \`${activeColor} bg-teal/10\`` → `isSelected ? \`${activeColor} bg-s-coral/10\``

**Other UI files:** SearchBar, SearchAutocomplete, SocialProofStrip, TrustBadges, StickyMobileCTA, EmptyState, Spinner, AnimatedButton, SolenExclusiveBadge, LanguageSwitcher, Toast, Breadcrumb, PWAInstallPrompt, ProgressDots, CategoryTree, PriceSlider, date-picker, QuickPreviewSheet, sidebar, Skeleton, GlassModal, BottomSheet.

#### 3.2 — Major Components

**SalonCard.tsx** — 12 brand refs. Also fix BUG #3: change prop type `solenTier?: "gold" | "teal" | "grey" | "dark"` → `"gold" | "coral" | "grey" | "dark"`. And change any `solenTier === "teal"` → `solenTier === "coral"`.

**HomePage.tsx** — 20+ refs. All teal → s-coral. Change all QUARTIER gradients to new palette. Replace `bg-white` root → `bg-s-bg-base`. Replace `bg-gray-50/50` → `bg-s-bg-surface`.

**CategoryPage.tsx** — 10 refs. All `categoryGradients` teal → warm palette. **Remove hardcoded `style={{ backgroundColor: "#FF6B6B" }}` (L70)** → `className="bg-s-coral"`.

**ChatWindow.tsx** — **BUG #12 fix.** 10 teal refs:
| Line | Current | Change To |
|---|---|---|
| 287 | `text-teal border-b-2 border-teal` | `text-s-coral border-b-2 border-s-coral` |
| 295 | `text-teal border-b-2 border-teal` | `text-s-coral border-b-2 border-s-coral` |
| 327 | `bg-teal text-white` (own message bubble) | `bg-s-coral text-white` |
| 337 | `text-teal-200` | `text-s-coral/70` (lighter variant) |
| 369 | `text-teal-200` (read receipt) | `text-s-coral/70` |
| 412 | `focus:border-teal` (URL input) | `focus:border-s-coral` |
| 415 | `bg-teal text-white` (send image button) | `bg-s-coral text-white` |
| 457 | `hover:text-teal hover:bg-teal/5` | `hover:text-s-coral hover:bg-s-coral/5` |
| 463 | `hover:text-teal hover:bg-teal/5` | `hover:text-s-coral hover:bg-s-coral/5` |
| 469 | `focus:border-teal` (textarea) | `focus:border-s-coral` |
| 472 | `bg-teal text-white ... hover:bg-teal/90` (send button) | `bg-s-coral text-white ... hover:bg-s-coral-hover` |

**FilterBar.tsx, LastMinuteCard.tsx, CompareBar.tsx, CompareDrawer.tsx, MapView.tsx, RecentlyViewed.tsx, ReviewCarousel.tsx, ReviewBreakdown.tsx, StaffPortfolio.tsx, QuartierTile.tsx, CategoryHero.tsx, WeatherBanner.tsx, WaitlistModal.tsx, ServiceTile.tsx, BookingSuccess.tsx, BookingCalendar.tsx, NearbySalons.tsx, TerminePage.tsx, ProfilePage.tsx, TutorialTour.tsx** — all: teal → s-coral, coral → s-coral, font-data → data-text.

**CategoryHero.tsx L54:** has BOTH `font-data` AND inline `style={{ fontFamily: "Space Grotesk, monospace" }}`. Replace BOTH → `data-text` + DELETE inline style.

**Footer.tsx** — BUG #9 fix: remove ALL 13 inline `style={{}}` props, change `style={{ backgroundColor: "#1A1A2E" }}` → `className="bg-s-ink"`.

**BottomNav.tsx** — `activeColor="text-teal"` → `activeColor="text-s-coral"`, `bg-white/90` → `bg-s-bg-base/90`.

**Chat sub-components:** BookingBubble, PhotoGallery, QuickReplyChips, ClientTags — all teal → s-coral.

**Dashboard:** DashboardLayout, SolenScoreCard (+ fix tier logic "teal"→"coral"), PromoManager.

**Auth:** SignIn.tsx — teal → s-coral.

**Loyalty:** StampCard.tsx — teal → s-coral, font-data → data-text.

```bash
npm run build
git add components/ && git commit -m "phase 3.1: all components — teal→coral, font-data→data-text, 50+ files" && git push
```

#### 3.3 — App Page Files (28+ files)

**SALON DETAIL PAGE `app/[locale]/salon/[slug]/page.tsx`** — 810 lines, 35 changes:

| Line | Current | Change To |
|---|---|---|
| 62 | `fill-coral text-coral` | `fill-s-coral text-s-coral` |
| 135 | `bg-coral/10 border border-coral/20` | `bg-s-coral/10 border border-s-coral/20` |
| 136 | `bg-coral/15` | `bg-s-coral/15` |
| 137 | `text-coral` | `text-s-coral` |
| 148 | `font-data font-bold text-coral tabular-nums` | `data-text font-bold text-s-coral` |
| 212 | `text-teal hover:underline` | `text-s-coral hover:underline` |
| 262 | `bg-white` | `bg-s-bg-base` |
| 265, 269 | `hover:text-teal` ×2 | `hover:text-s-coral` |
| 338 | `bg-teal/10 text-teal` | `bg-s-coral/10 text-s-coral` |
| 347 | `font-data font-semibold` | `data-text font-semibold` |
| 348 | `hover:text-teal` | `hover:text-s-coral` |
| 359,364,370,376,382,389 | `hover:text-teal` ×6 | `hover:text-s-coral` |
| 400 | `bg-white` | `bg-s-bg-base` |
| 406 | `border-teal text-teal` | `border-s-coral text-s-coral` |
| 418 | `text-teal` (Clock) | `text-s-coral` |
| 439, 456 | `font-data text-dark` ×2 | `data-text text-s-ink` |
| 470,475,484,493,502 | `text-teal` ×5 | `text-s-coral` |
| 562 | `bg-teal/5` | `bg-s-coral/5` |
| 577 | `font-data font-semibold` | `data-text font-semibold` |
| 578 | `text-teal` | `text-s-coral` |
| 621 | `bg-teal/10 text-teal` | `bg-s-coral/10 text-s-coral` |
| 667, 668 | `border-teal/30`, `text-teal` | `border-s-coral/30`, `text-s-coral` |
| 682 | `hover:border-teal` | `hover:border-s-coral` |
| 695 | `text-teal` | `text-s-coral` |
| 702 | `text-teal` | `text-s-coral` |
| 715 | `bg-white` | `bg-s-bg-raised` |
| 728 | `bg-coral ... shadow-coral-glow` | `bg-s-coral ... shadow-warm-md hover:bg-s-coral-hover` |
| 747 | `bg-white/95` | `bg-s-bg-base/95` |
| 751 | `bg-coral ... shadow-coral-glow` | `bg-s-coral ... shadow-warm-md` |
| 755 | `font-data` | `data-text` |
| 778 | `bg-dark/80` | `bg-s-ink/80` |

**ALL other app pages** — grep and fix each:
- `dashboard/page.tsx`, `dashboard/settings/`, `dashboard/analytics/`, `dashboard/revenue/`, `dashboard/bookings/`, `dashboard/services/`, `dashboard/segments/`, `dashboard/staff/`, `dashboard/reviews/`, `dashboard/review-moderation/`, `dashboard/calendar/`, `dashboard/messages/`, `dashboard/approvals/`, `dashboard/help-editor/`, `dashboard/all-salons/`, `dashboard/all-users/`
- `onboarding/salon/page.tsx`, `checkout/page.tsx`, `warum-solen/page.tsx`, `last-minute/page.tsx`
- `auth/signup/`, `auth/login/`, `auth/register/`
- `account/page.tsx`, `account/messages/`
- `profile/referral/page.tsx`
- `help/page.tsx`, `help/[slug]/`
- `brand/[slug]/`, `behandlungen/[...slug]/`
- `agb/`, `impressum/`, `datenschutz/`, `partner/`
- `app/not-found.tsx`, `app/error.tsx`

```bash
npm run build
git add app/ && git commit -m "phase 3.2: all app pages — salon detail, dashboard, auth, legal, error — teal→coral" && git push
```

#### 3.4 — API Routes + PWA + Tailwind Shadows

**API email templates:**
- `app/api/notifications/off-peak/route.ts` L94: `color: #38B2AC` → `color: #E8624A`
- `app/api/loyalty/award/route.ts` L117: `background: #38B2AC` → `background: #E8624A`
- `app/api/salons/[salonId]/client-tags/route.ts`: if `"teal"` is a valid color value, keep for now (DB enum), document as future migration
- `app/api/admin/solen-score/recalculate/route.ts`: `"teal"` → `"coral"` in tier assignment logic

**recharts SVG colors (NOT Tailwind — React props):**
- `app/[locale]/dashboard/analytics/page.tsx` L24: `const TEAL = "#4ECDC4"` → `const CORAL = "#E8624A"`
- Same file: update ALL references to `TEAL` constant
- `app/[locale]/dashboard/revenue/page.tsx` L152: `stopColor="#4ECDC4"` → `stopColor="#E8624A"`
- L153: `stopColor="#4ECDC4"` → `stopColor="#E8624A"`
- L179: `stroke="#4ECDC4"` → `stroke="#E8624A"`
- L183: `fill: "#4ECDC4"` → `fill: "#E8624A"`

**PWA manifest:**
- `public/manifest.json`: `theme_color` → `"#E8624A"` (currently `"#9B1D30"` — wine-red, NOT teal), `background_color` → `"#FAF6EF"` (currently `"#F8F4ED"`)
- ⚠️ Claude Code: do NOT grep for teal in this file — it has wine-red. Just replace the values directly.

**Service Worker (TWO copies exist):**
- `public/sw.js` L15: `CACHE_VERSION = 'solen-v6'` → `'solen-v6-rebrand'` (bump to invalidate)
- `sw.js` (ROOT) L15: `CACHE_VERSION = 'solen-v18'` → `'solen-v19'` (bump to invalidate)
- ⚠️ Both files must be updated. The root `sw.js` is the canonical one (v18), `public/sw.js` is older (v6).

**Tailwind shadows:**
- `tailwind.config.js`: update `coral-glow` shadow hex, update mesh gradients, add `warm-sm/md/lg` shadows

```bash
npm run build
git add app/api/ public/ sw.js tailwind.config.js && git commit -m "phase 3.3: API emails, recharts SVG, PWA manifest, SW cache bump" && git push
git tag rebrand-ph3 && git push origin rebrand-ph3
```

#### 3.5 — VERIFICATION SWEEP (MANDATORY)

```bash
# Zero teal class references (use -E for extended regex on macOS)
teal_count=$(grep -Ercn "text-teal|bg-teal|border-teal|ring-teal|from-teal|to-teal|via-teal|hover:text-teal|hover:bg-teal|focus:border-teal|focus:text-teal" components/ app/ --include="*.tsx" --include="*.ts" | grep -v ":0$" | wc -l)
echo "Teal references remaining: $teal_count"
# Target: 0

# Zero hardcoded hex (includes recharts SVG props)
hex_count=$(grep -Ercn "#38B2AC|#4ECDC4|#FF6B6B|#0F0F1A" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v ":0$" | wc -l)
echo "Hardcoded hex remaining: $hex_count"
# Target: 0

# Zero old coral without s- prefix — macOS-compatible (no \b)
old_coral=$(grep -Ern '"bg-coral[^-]|"text-coral[^-]|"fill-coral[^-]|"border-coral[^-]| bg-coral[^-]| text-coral[^-]| fill-coral[^-]' components/ app/ --include="*.tsx" --include="*.ts" | grep -v "s-coral" | wc -l)
echo "Old coral references remaining: $old_coral"
# Target: 0

npm run build
```

> ⚠️ **macOS grep note:** Always use `grep -E` (extended regex) on macOS. BSD grep's `\b` word boundary doesn't work without `-E`. All grep commands in this roadmap use `-E`.

If ANY count > 0, fix remaining before proceeding.

---

### Phase 4 — Typography Cleanup (30 min) 🟡

```bash
# Must return 0 (macOS-compatible)
grep -Ern "font-data|Space Grotesk" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Fix any remaining. Then:

- DELETE `.font-data { ... }` from `globals.css`
- DELETE `data: ["Space Grotesk", "monospace"]` from `tailwind.config.js`

```bash
# macOS-compatible
grep -Ern "font-data|Space Grotesk" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css"

# Also verify Bebas Neue isn't used on body text (should only be ≥40px headings)
grep -rn "font-display" components/ app/ --include="*.tsx" | grep -v "text-2xl\|text-3xl\|text-4xl\|text-5xl\|text-6xl\|text-7xl\|clamp" 
# Any results here = potential ALL CAPS on small text. Fix by removing font-display.

npm run build
git add app/globals.css tailwind.config.js && git commit -m "phase 4: remove Space Grotesk, font-data → data-text complete" && git push
git tag rebrand-ph4 && git push origin rebrand-ph4
```

---

## 📋 PROMPT 2: Layouts + Dark Mode (~5 hours)

> Start fresh session. Read `CLAUDE.md` and `UI_RULES.md` before anything.
>
> **START with verification sweep** to catch any drift from Prompt 1:
> ```bash
> teal_count=$(grep -Ercn "text-teal|bg-teal|border-teal" components/ app/ --include="*.tsx" --include="*.ts" | grep -v ":0$" | wc -l)
> echo "Teal refs: $teal_count (should be 0)"
> ```
> If > 0, fix before proceeding.

### Phase 5 — Layout Rebuilds (2.5 hours) 🔴

#### 5.1 [MODIFY] `components/layout/Header.tsx` — Full Rebuild

**Convert from** fixed full-width bar **to** sticky centered pill.

| Attribute | Current | New |
|---|---|---|
| position | `fixed top-0 left-0 right-0` | `sticky top-4 mx-auto max-w-3xl px-4` |
| shape | Full-width, no border-radius | `rounded-full` pill |
| bg | `bg-white/80 ... border-b border-gray-100` | `glass rounded-full shadow-warm-sm` |
| logo font | Syne `font-heading` | Bebas Neue `font-display text-2xl tracking-[0.06em] uppercase` |
| logo text | `solen.ch` | `so.len` |
| logo dot color | `text-teal` | `text-s-coral` |
| all nav colors | teal | s-coral |
| account button | `bg-teal rounded-button` | `bg-s-coral rounded-full` |
| scroll shrink | `py-2`/`py-3` based on scroll | `py-2.5` fixed (pill doesn't need shrink) |
| mobile menu | Dropdown below header | Same dropdown but styled with cream bg |

**ALL 14 teal references change here (skipped in Phase 3 per BUG #4).**

**ALSO: Remove dead scroll code (BUG #14):**
- DELETE the `useEffect` scroll listener (L62-67)
- DELETE the `scrolled` state variable
- DELETE the `shrunk` variable (L82-83)
- KEEP the `isHidden` logic — it hides the header on `/dashboard` and `/auth/` pages. This is correct.

**Note on root layout:** `app/[locale]/layout.tsx` renders `<Header locale={locale} />` inside a `<div className="pb-16 md:pb-0">`. No bg-white. The body background comes from `globals.css` (changed in Phase 2). No layout changes needed.

```bash
npm run build
git add components/layout/Header.tsx && git commit -m "phase 5.1: header → floating pill, Bebas Neue so.len logo, remove dead scroll code" && git push
```

#### 5.2 Fix ALL Page Top Padding (BUG #10)

After converting header from `fixed` to `sticky top-4`, pages no longer need large top padding. Update every page from the BUG #10 table above.

**Test each page** loads without excess whitespace or content hiding behind header.

```bash
npm run build
git add app/ components/ && git commit -m "phase 5.2: fix top padding on 12 pages for sticky header" && git push
```

#### 5.3 [MODIFY] `components/layout/Footer.tsx` — Final Cleanup

- ALL 13 inline `style={{}}` → deleted (use existing Tailwind classes)
- `style={{ backgroundColor: "#1A1A2E" }}` → `className="bg-s-ink"`  
- Logo → `font-display text-3xl tracking-[0.06em] uppercase text-white` with `<span className="text-s-coral">.</span>`
- `border-white/10` → `border-s-dm-text/10`

```bash
npm run build
git add components/layout/Footer.tsx && git commit -m "phase 5.3: footer — 13 inline styles removed, warm black bg, Bebas logo" && git push
```

#### 5.4 [MODIFY] `components/HomePage.tsx` — Hero Rebuild

Replace hero section (L192-231) with:
- Background blobs (CSS radial gradients, NOT images)
- Bebas Neue hero heading (≥56px, `clamp(56px,8vw,110px)`)
- Cream background (`bg-s-bg-base`)
- NO Unsplash background image
- Keep SearchBar component

**Keep ALL other sections** (category grid, featured salons, quartier, etc.) — they were already migrated in Phase 3.

```bash
npm run build
git add components/HomePage.tsx && git commit -m "phase 5.4: homepage hero — blobs + Bebas Neue" && git push
git tag rebrand-ph5 && git push origin rebrand-ph5
```

---

### Phase 6 — Component Polish (45 min) 🟡

#### 6.1 SalonCard Blob Hover Morph

Add to `motion.div` wrapper — blob shape on hover, keep `rounded-card` at rest.
Add `prefers-reduced-motion` check — no morph for accessibility.

#### 6.2 [NEW] `components/ui/BackgroundBlobs.tsx`

Reusable blob component for hero + salon profile headers.

```bash
npm run build
git add components/ && git commit -m "phase 6: SalonCard blob hover, BackgroundBlobs component" && git push
git tag rebrand-ph6 && git push origin rebrand-ph6
```

---

### Phase 7 — Dark Mode Warm Shift (2 hours) 🔴

#### 7.1 Update dark mode tokens in `tailwind.config.js`

```js
"dm-bg": "#151009",       // was #0F0F1A
"dm-surface": "#1E1710",  // was #1A1A2E  
"dm-text": "#F5EEE4",     // was #E2E8F0
```

#### 7.2 **BUG #11 FIX: Add `.dark {}` CSS variables to `globals.css`**

```css
.dark {
  --border: 30 15% 18%;
  --input: 30 15% 18%;
  --ring: 10 70% 55%;
  --background: 28 30% 5%;
  --foreground: 34 30% 93%;
  --primary: 10 70% 55%;
  --primary-foreground: 0 0% 100%;
  --secondary: 30 15% 12%;
  --secondary-foreground: 34 30% 93%;
  --muted: 30 15% 15%;
  --muted-foreground: 30 20% 60%;
  --accent: 36 85% 44%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 55%;
  --popover: 28 25% 8%;
  --popover-foreground: 34 30% 93%;
  --card: 28 25% 10%;
  --card-foreground: 34 30% 93%;
}
```

#### 7.3 Grep and fix ALL remaining dark hardcoded hex values

```bash
grep -rn "#0F0F1A\|#1A1A2E" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Replace all with token references.

**Test EVERY major page** in dark mode: homepage, salon, booking, dashboard, chat, auth.

```bash
npm run build
git add . && git commit -m "phase 7: dark mode warm shift + .dark CSS vars for 21st.dev" && git push
git tag rebrand-ph7 && git push origin rebrand-ph7
```

---

## 📋 PROMPT 3: Cleanup + Verification (~2 hours)

> **START with verification sweep:**
> ```bash
> teal_count=$(grep -Ercn "text-teal|bg-teal|border-teal" components/ app/ --include="*.tsx" --include="*.ts" | grep -v ":0$" | wc -l)
> hex_count=$(grep -Ercn "#38B2AC|#4ECDC4|#0F0F1A" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v ":0$" | wc -l)
> echo "Teal: $teal_count | Hex: $hex_count (both should be 0)"
> ```
> If > 0, fix before proceeding.

### Phase 8 — CSS Utilities (30 min) 🟢

Add blob float animation, reveal stagger, `prefers-reduced-motion` overrides in `globals.css`.

### Phase 9 — Remove Old Tokens (1 hour) 🟡

**ONLY after ALL verification sweeps pass.**

Remove from `tailwind.config.js`:
- Old `teal: { ... }` color (entire object)
- Old `coral: { ... }` color (entire object — now replaced by `s-coral`)
- Old mesh gradients referencing teal/coral hex
- Old `teal-glow`, `coral-glow` shadows (if fully replaced by `warm-*`)

Also:
- `npm uninstall react-router-dom` (dead dependency, 0 imports)
- Add driver.js theme override to `globals.css`:
  ```css
  .driver-popover { --driver-theme-color: #E8624A; }
  ```

```bash
# MANDATORY: must ALL return 0 before deleting tokens (macOS-compatible)
grep -Ercn "text-teal|bg-teal|border-teal|fill-teal" components/ app/ --include="*.tsx" --include="*.ts" | grep -v ":0$"
grep -Ern ' bg-coral[^-]| text-coral[^-]| fill-coral[^-]' components/ app/ --include="*.tsx" --include="*.ts" | grep -v "s-coral"
grep -Ercn "shadow-coral-glow|shadow-teal-glow" components/ app/ --include="*.tsx" --include="*.ts" | grep -v ":0$"
```

### Phase 10 — Final Documentation (30 min) 🟢

- Remove migration warning from `CLAUDE.md`
- Finalize `UI_RULES.md` with complete new design system
- [NEW] `DESIGN_ZONES.md` — every route classified Expressive (✨) or Functional (🔧)
- Tag: `git tag v2-design-coral -m "Solen v2 brand: coral/cream/warm"` && push

---

## ⏱ TOTAL EXECUTION

| Prompt | Phases | Time |
|---|---|---|
| **Prompt 1** | 0 + 1 + 2 + 3 + 4 | ~5 hours |
| **Prompt 2** | 5 + 6 + 7 | ~5 hours |
| **Prompt 3** | 8 + 9 + 10 | ~2 hours |
| **Total** | | **~12 hours** |

## DATABASE MIGRATION (Manual, Before Prompt 1)

```sql
-- Run in Supabase SQL Editor BEFORE starting Prompt 1
-- ⚠️ Table is 'salons' (NOT 'stores' — migration 013 dropped the old table)
UPDATE salons SET solen_tier = 'coral' WHERE solen_tier = 'teal';
UPDATE client_tags SET color = 'coral' WHERE color = 'teal';
-- If check constraints exist on these columns, alter them to replace 'teal' with 'coral'
```
