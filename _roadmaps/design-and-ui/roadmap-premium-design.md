# 🎨 Premium Design Overhaul — Execution Roadmap

> **Created**: 2026-03-23
> **Audit Source**: `premium_design_audit.md` (2026-03-23 full codebase scan)
> **Rules Reference**: `UI_RULES.md` §16 + §19, `CLAUDE.md` Rule 20 + Rule 30
> **Scope**: Replace ALL banned design tokens (colors, shadows, radii, spacing) with design system tokens. Zero visual regressions — only token naming changes.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Token-identical replacements only |
| Phase 2 | 🟢 SAFE | Nothing | Token-identical replacements only |
| Phase 3 | 🟢 SAFE | Nothing | Token-identical replacements only |
| Phase 4 | 🟡 MEDIUM | Quartier tile gradients (visual change) | Verify quartier cards still have distinct colors |
| Phase 5 | 🟡 MEDIUM | `GlassCard`/`GlassModal` radius change (12px vs ~24px) | Visually QA modals/cards — they'll shrink from ~24px to 12px corners |
| Phase 6 | 🟡 MEDIUM | Body line-height change could shift layouts | Check homepage hero, salon cards, and modals for text overflow |

**All phases are 🤖 CLAUDE CODE PHASES — no manual steps required.**

---

## Phase 1: Replace Banned Color Tokens
**Risk: 🟢 SAFE** — These are simple class-name swaps. Visual output is identical or intentionally corrected to match the design system.

### [MODIFY] `components/SalonCard.tsx`
**Lines 88, 115, 171:**

```diff
# Line 88: Gold tier ring
- ring-2 ring-yellow-400/50
+ ring-2 ring-s-yellow/50

# Line 115: Top Salon badge
- bg-yellow-400 text-yellow-900
+ bg-s-yellow-subtle text-s-yellow-text

# Line 171: Availability badge
- bg-emerald-500 text-white
+ bg-s-success text-white
```

### [MODIFY] `components/CategoryPage.tsx`
**Line 80:**

```diff
- fill-amber-400 text-amber-400
+ fill-s-amber text-s-amber
```

### [MODIFY] `components/FilterBar.tsx`
**Line 150:**

```diff
- fill-amber-400 text-amber-400
+ fill-s-amber text-s-amber
```

### [MODIFY] `components/ui/SearchAutocomplete.tsx`
**Line 188:**

```diff
- fill-amber-400 text-amber-400
+ fill-s-amber text-s-amber
```

### [MODIFY] `components/discovery/ItemCard.tsx`
**Line 19:**

```diff
- hair: "bg-amber-500/70",
+ hair: "bg-s-amber/70",
```

### [MODIFY] `components/discovery/VideoCard.tsx`
**Line 18:**

```diff
- hair: "bg-amber-500/70",
+ hair: "bg-s-amber/70",
```

### [MODIFY] `components/discovery/DiscoveryAdmin.tsx`
**Line 334:**

```diff
- "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
+ "bg-s-yellow-subtle text-s-yellow-text"
```

### [MODIFY] `components/chat/ClientTags.tsx`
**Line 24:**

```diff
- blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
+ blue: "bg-s-blue-subtle text-s-blue-text dark:bg-s-blue/10 dark:text-s-blue",
```

### [MODIFY] `components/HomePage.tsx`
**Lines 75–79 (QUARTIERS gradient colors):**

```diff
- { slug: "gundeli",     name: "Gundeli",     bg: "from-s-coral/30 to-blue-200"  },
+ { slug: "gundeli",     name: "Gundeli",     bg: "from-s-coral/30 to-s-blue/20"  },

- { slug: "st_johann",   name: "St. Johann",  bg: "from-amber-300/40 to-amber-100/10" },
+ { slug: "st_johann",   name: "St. Johann",  bg: "from-s-amber/40 to-s-amber-subtle" },

- { slug: "iselin",      name: "Iselin",      bg: "from-purple-300/40 to-purple-100/10" },
+ { slug: "iselin",      name: "Iselin",      bg: "from-s-plum-subtle to-s-plum-subtle/10" },

- { slug: "bruderholz",  name: "Bruderholz",  bg: "from-green-300/40 to-green-100/10" },
+ { slug: "bruderholz",  name: "Bruderholz",  bg: "from-s-sage/40 to-s-sage-subtle" },

- { slug: "breite",      name: "Breite",      bg: "from-rose-300/40 to-rose-100/10" },
+ { slug: "breite",      name: "Breite",      bg: "from-s-coral/30 to-s-coral-subtle" },
```

### [MODIFY] `components/nail/NailDesignCard.tsx` + `components/discovery/ItemCard.tsx` + `components/discovery/VideoCard.tsx`
**`bg-black/30` → `bg-s-ink/30`** (2 instances per file, 6 total)

```diff
- bg-white/30 dark:bg-black/30
+ bg-white/30 dark:bg-s-ink/30
```

✅ **DO:**
```tsx
<div className="bg-s-yellow-subtle text-s-yellow-text">Top Salon</div>
<Star className="fill-s-amber text-s-amber" />
```

❌ **DON'T:**
```tsx
<div className="bg-yellow-400 text-yellow-900">Top Salon</div>
<Star className="fill-amber-400 text-amber-400" />
```

> ⚠️ **BE CAREFUL:**
> - The quartier gradients (Iselin, Bruderholz, Breite) will look slightly different — verify by checking `/:locale` homepage quartier section
> - `DiscoveryAdmin.tsx` line 334 may be inside a ternary — preserve the conditional structure
> - `ClientTags.tsx` has a Record object — only change the `blue` key's value, leave other keys untouched
> - DO NOT touch any `s-amber`, `s-coral`, or `s-yellow` tokens — those are correct

**Commit:** `git commit -m "phase 1: replace banned color tokens (yellow/amber/emerald/green/purple/rose/blue)"`

**Verify:**
```bash
npm run build
grep -Ern "yellow-400|yellow-500|yellow-700|yellow-900|amber-400|amber-500|emerald-500|bg-green-|bg-purple-|bg-rose-|bg-blue-[123]|bg-black/" components/ --include="*.tsx" | grep -v "s-" | head -5
# Must return 0 results
```

---

## Phase 2: Replace Non-Token Shadows
**Risk: 🟢 SAFE** — The warm tokens produce similar visual results with warmer undertones. No layout shifts.

### Files to modify (21 files):

| File | Current | Replacement |
|---|---|---|
| [MODIFY] `components/HomePage.tsx` L254 | `hover:shadow-md` | `hover:shadow-card-hover` |
| [MODIFY] `components/ServiceTile.tsx` L30 | `hover:shadow-md` | `hover:shadow-card-hover` |
| [MODIFY] `components/QuartierTile.tsx` L36 | `hover:shadow-md` | `hover:shadow-card-hover` |
| [MODIFY] `components/SalonCard.tsx` L91 | `hover:shadow-lg` | `hover:shadow-card-hover` |
| [MODIFY] `components/SalonCard.tsx` L109 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/CompareBar.tsx` L23 | `shadow-lg` | `shadow-warm-lg` |
| [MODIFY] `components/MapView.tsx` L235 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/MapView.tsx` L237 | `shadow-md` | `shadow-warm-md` |
| [MODIFY] `components/MapView.tsx` L254 | `shadow-lg` | `shadow-warm-lg` |
| [MODIFY] `components/FilterBar.tsx` L39 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/FilterBar.tsx` L196 | `shadow-lg` | `shadow-warm-lg` |
| [MODIFY] `components/editor/EditorPage.tsx` L201 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/dashboard/WalkInModal.tsx` L64 | `shadow-xl` | `shadow-warm-lg` |
| [MODIFY] `components/nail/InspoBoard.tsx` L102 | `shadow-xl` | `shadow-warm-lg` |
| [MODIFY] `components/nail/NailDesignCard.tsx` L104 | `drop-shadow-sm` | remove (text already on dark overlay) |
| [MODIFY] `components/discovery/ItemCard.tsx` L128 | `drop-shadow-sm` | remove |
| [MODIFY] `components/discovery/VideoCard.tsx` L133 | `drop-shadow-sm` | remove |
| [MODIFY] `components/discovery/GenderToggle.tsx` L27 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/discovery/InfoTabs.tsx` L38 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/ui/SolenExclusiveBadge.tsx` L29 | `shadow-lg` | `shadow-warm-lg` |
| [MODIFY] `components/ui/PWAInstallPrompt.tsx` L66 | `shadow-lg` | `shadow-warm-lg` |
| [MODIFY] `components/ui/QuickPreviewSheet.tsx` L94 | `shadow-2xl` | `shadow-warm-lg` |
| [MODIFY] `components/ui/CookieBanner.tsx` L76, L123 | `shadow-2xl` | `shadow-warm-lg` |
| [MODIFY] `components/ui/ImageUploader.tsx` L129 | `shadow-sm` | `shadow-warm-sm` |
| [MODIFY] `components/ui/HomeSearchBar.tsx` | check for `shadow-*` | replace with design token |

✅ **DO:**
```tsx
<div className="shadow-card hover:shadow-card-hover">...</div>
<div className="shadow-warm-lg">Modal</div>
```

❌ **DON'T:**
```tsx
<div className="shadow-md hover:shadow-lg">...</div>
<div className="shadow-2xl">Modal</div>
```

> ⚠️ **BE CAREFUL:**
> - `drop-shadow-sm` on text overlays (NailDesignCard, ItemCard, VideoCard) — removing it is fine because the text is on a dark blurred overlay already. But verify readability if the overlay opacity is low.
> - `CookieBanner.tsx` has TWO shadow instances (L76 and L123) — update both
> - `MapView.tsx` has THREE different shadow instances on different elements — update each to its correct level
> - DO NOT touch `shadow-card`, `shadow-card-hover`, `shadow-warm-*`, `shadow-glass`, `shadow-coral-glow` — those are correct tokens

**Commit:** `git commit -m "phase 2: replace non-token shadows with warm design system shadows"`

**Verify:**
```bash
npm run build
grep -Ern "shadow-sm[^a]|shadow-md[^a]|shadow-lg[^a]|shadow-xl|shadow-2xl|drop-shadow-sm|drop-shadow-md" components/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|//" | head -5
# Must return 0 results
```

---

## Phase 3: Replace Non-Token Border Radii
**Risk: 🟢 SAFE** — Mostly class-name swaps. `GlassCard` and `GlassModal` will have slightly tighter corners (from ~24px to 12px).

### Files to modify (8 files):

| File | Current | Replacement |
|---|---|---|
| [MODIFY] `components/ui/GlassCard.tsx` L12, L20 | `rounded-3xl` | `rounded-card` |
| [MODIFY] `components/ui/GlassModal.tsx` L75 | `rounded-3xl` | `rounded-card` |
| [MODIFY] `components/ChatWindow.tsx` L341, L346, L360 | `rounded-2xl`, `rounded-xl`, `rounded-lg` | `rounded-card`, `rounded-card`, `rounded-button` |
| [MODIFY] `components/loyalty/StampCard.tsx` L68 | `rounded-lg` | `rounded-card` |
| [MODIFY] `components/TerminePage.tsx` L352 | `rounded-lg` | `rounded-button` |
| [MODIFY] `components/chat/PhotoGallery.tsx` L61, L92 | `rounded-lg` | `rounded-card` |
| [MODIFY] `components/ui/SolenExclusiveBadge.tsx` L29 | `rounded-lg` | `rounded-button` |
| [MODIFY] `components/ui/CategoryTree.tsx` L99 | `rounded-lg` | `rounded-button` |
| [MODIFY] `components/nail/InspoBoard.tsx` L102 | `rounded-t-2xl sm:rounded-card` | `rounded-t-card sm:rounded-card` |

✅ **DO:**
```tsx
<div className="rounded-card shadow-glass">Card</div>
<div className="rounded-button">Button/Input</div>
<span className="rounded-pill">Badge</span>
```

❌ **DON'T:**
```tsx
<div className="rounded-3xl">Card</div>
<div className="rounded-lg">Button</div>
<span className="rounded-full">Badge</span>
```

> ⚠️ **BE CAREFUL:**
> - `GlassCard.tsx` is used by multiple consumers — changing it from `rounded-3xl` (~24px) to `rounded-card` (12px) will affect ALL glassmorphism cards. Verify `auth/login`, `WaitlistModal`, and any other GlassCard consumers visually.
> - `GlassModal.tsx` same concern — all modals will go from ~24px to 12px corners. This is intentional per the design system but is a visual change.
> - `GlassCard.tsx` L12 is a JSDoc comment — only change L20 (the actual className)
> - `InspoBoard.tsx` uses `rounded-t-2xl` (mobile bottom sheet top corners) — replace with `rounded-t-card` which evaluates to `border-top-left-radius: 12px; border-top-right-radius: 12px`
> - `rounded-t-card` may not exist as a Tailwind utility by default. If build fails, use `rounded-t-[12px]` instead.

**Commit:** `git commit -m "phase 3: replace non-token border radii (rounded-lg/xl/2xl/3xl → card/button)"`

**Verify:**
```bash
npm run build
grep -Ern "rounded-lg|rounded-xl[^=]|rounded-2xl|rounded-3xl" components/ --include="*.tsx" | grep -v "rounded-card\|rounded-button\|rounded-pill\|rounded-blob\|//" | head -5
# Must return 0 results
```

---

## Phase 4: Fix Non-8pt Grid Spacing
**Risk: 🟡 MEDIUM** — `gap-5` (20px) → `gap-6` (24px) slightly increases spacing. Visual diff is minimal but verify.

### Files to modify (2 files):

| File | Line | Current | Replacement |
|---|---|---|---|
| [MODIFY] `components/HomePage.tsx` | L437 | `gap-5` | `gap-6` |
| [MODIFY] `components/CategoryPage.tsx` | L286 | `gap-5` | `gap-6` |

✅ **DO:**
```tsx
<div className="grid grid-cols-3 gap-4">  {/* 16px — 8pt grid */}
<div className="grid grid-cols-3 gap-6">  {/* 24px — 8pt grid */}
```

❌ **DON'T:**
```tsx
<div className="grid grid-cols-3 gap-5">  {/* 20px — NOT on 8pt grid */}
<div className="grid grid-cols-3 gap-7">  {/* 28px — NOT on 8pt grid */}
```

> ⚠️ **BE CAREFUL:**
> - `HomePage.tsx` L437 `gap-5` is inside the empty-state last-minute card — verify the flex layout still looks balanced
> - `CategoryPage.tsx` L286 `gap-5` is the main salon grid — the 4px increase to `gap-6` is subtle. If the grid looks too wide on mobile, use `gap-4` instead.
> - DO NOT change `gap-1.5`, `gap-2`, `gap-3` — these are valid 4px sub-grid values for compact elements

**Commit:** `git commit -m "phase 4: fix non-8pt grid spacing (gap-5 → gap-6)"`

**Verify:**
```bash
npm run build
grep -Ern "gap-5|gap-7|gap-9" components/ --include="*.tsx" | head -3
# Must return 0 results
```

---

## Phase 5: App Pages — Shadow/Radius/Color Sweep
**Risk: 🟡 MEDIUM** — 29 app page files have violations. Same token swaps as phases 1-3, but higher volume.

### Strategy
Apply the SAME replacement rules from Phases 1-3 to all `app/[locale]/` page files. Use targeted search-and-replace:

| Pattern | Replacement | Files (29 total) |
|---|---|---|
| `shadow-sm` (not `shadow-sm-*`) | `shadow-warm-sm` | Dashboard pages, auth pages |
| `shadow-md` | `shadow-warm-md` | Dashboard, partner page |
| `shadow-lg` | `shadow-warm-lg` | Help, walk-in-pay, auth |
| `shadow-xl` / `shadow-2xl` | `shadow-warm-lg` | Modals in dashboard pages |
| `rounded-lg` | `rounded-button` | Dashboard tables, auth inputs |
| `rounded-xl` / `rounded-2xl` | `rounded-card` | Dashboard cards, modals |
| `yellow-*` / `amber-*` / `emerald-*` | Design tokens | Badge-manager, platform-analytics |
| `bg-green-*` / `bg-red-*` | `bg-s-success/error` | Dashboard status indicators |

### Files to modify:
| Tag | File |
|---|---|
| [MODIFY] | `app/[locale]/help/page.tsx` |
| [MODIFY] | `app/[locale]/walk-in-pay/page.tsx` |
| [MODIFY] | `app/[locale]/onboarding/salon/page.tsx` |
| [MODIFY] | `app/[locale]/partner/page.tsx` |
| [MODIFY] | `app/[locale]/warum-solen/page.tsx` |
| [MODIFY] | `app/[locale]/brand/[slug]/page.tsx` |
| [MODIFY] | `app/[locale]/auth/login/page.tsx` |
| [MODIFY] | `app/[locale]/auth/register/page.tsx` |
| [MODIFY] | `app/[locale]/auth/reset-password/page.tsx` |
| [MODIFY] | `app/[locale]/bookings/[id]/respond-adjustment/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/bookings/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/calendar/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/clients/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/messages/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/settings/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/services/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/staff/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/revenue/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/segments/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/approvals/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/all-salons/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/all-users/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/badge-manager/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/discovery-posts/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/help-editor/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/platform-analytics/page.tsx` |
| [MODIFY] | `app/[locale]/dashboard/review-moderation/page.tsx` |

> ⚠️ **BE CAREFUL:**
> - Dashboard pages are Zone 4 (Structured) — they should use `rounded-card` max, ZERO animation, palette on borders/icons only
> - Auth pages are Zone 3 (Functional) — ZERO animation, coral CTA + cream base only
> - Many dashboard pages use `rounded-lg` on table rows/cells — these should become `rounded-button` (8px)
> - Some pages import `DashboardLayout` which may itself have violations — check but do NOT modify `DashboardLayout.tsx` in this phase (it was already handled in Phase 2/3)
> - Split into sub-commits if more than 10 files change: `phase 5a`, `phase 5b`, `phase 5c`

**Commits:**
```bash
git commit -m "phase 5a: premium tokens — auth + public pages (help, partner, warum-solen)"
git commit -m "phase 5b: premium tokens — dashboard pages (page, bookings, calendar, clients)"
git commit -m "phase 5c: premium tokens — remaining dashboard pages"
```

**Verify after each sub-commit:**
```bash
npm run build
```

**Final verify:**
```bash
grep -Ern "shadow-sm[^a]|shadow-md[^a]|shadow-lg[^a]|shadow-xl|shadow-2xl|rounded-lg[^a]|rounded-xl|rounded-2xl|rounded-3xl|yellow-[0-9]|emerald-|bg-green-|bg-purple-|bg-rose-" app/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob\|s-\|//" | head -5
# Must return 0 results
```

---

## Phase 6: Typography & CSS Baseline Polish
**Risk: 🟡 MEDIUM** — Adding `line-height` to body could shift vertical spacing globally.

### [MODIFY] `app/globals.css`
**Line 62 — add line-height to body:**

```diff
  body {
    font-family: "DM Sans", sans-serif;
+   line-height: 1.75;
  }
```

### [MODIFY] `app/globals.css`
**Add `rounded-t-card` custom utility (for InspoBoard Phase 3 fix):**

```diff
  .data-text {
    font-family: "DM Sans", sans-serif;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
+
+ /* Directional card radius utilities */
+ .rounded-t-card {
+   border-top-left-radius: 12px;
+   border-top-right-radius: 12px;
+ }
```

> ⚠️ **BE CAREFUL:**
> - Adding `line-height: 1.75` to body affects EVERY element that inherits body font. This is intentional per `UI_RULES.md` §18 ("Line-height 1.75-1.85"), but verify:
>   - Homepage hero text (uses custom `leading-none` / `leading-tight` — should override)
>   - Dashboard tables/grids — check that data rows don't become too tall
>   - Chat bubbles (`ChatWindow.tsx` sets `leading-relaxed` — should override)
> - If the line-height causes visible layout issues, use `1.6` instead of `1.75` as a compromise
> - `rounded-t-card` might conflict if Tailwind already generates this from the config. Check `npm run build` first.

**Commit:** `git commit -m "phase 6: typography baseline (body line-height) + rounded-t-card utility"`

**Verify:**
```bash
npm run build
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Replace banned color tokens (10 files) | Nothing |
| Phase 2 | 🤖 | Replace non-token shadows (21+ files) | Nothing |
| Phase 3 | 🤖 | Replace non-token border radii (8 files) | Nothing |
| Phase 4 | 🤖 | Fix non-8pt spacing (2 files) | Nothing |
| Phase 5 | 🤖 | App pages sweep (29 files) | Phases 1–3 (to avoid re-work) |
| Phase 6 | 🤖 | Typography/CSS baseline (1 file) | Phase 3 (needs `rounded-t-card` for InspoBoard) |

> Phases 1–4 can be executed in parallel or any order. Phase 5 should come after 1–3 to avoid pattern confusion. Phase 6 is last because the `line-height` change is the most visually impactful.

---

## R8: Post-Execution — CLAUDE.md / UI_RULES.md Updates

✅ **Already done** — `UI_RULES.md` §16 and §19 + `CLAUDE.md` Rule 20 and Rule 30 were updated BEFORE this roadmap was created. No further documentation changes needed.

---

## Final Verification (MANDATORY — after ALL phases)

```bash
# 1. Build passes
npm run build

# 2. Full banned token sweep — must return 0 results
grep -Ern "shadow-sm[^a]|shadow-md[^a]|shadow-lg[^a]|shadow-xl|shadow-2xl|rounded-lg[^a]|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|bg-yellow-|text-yellow-|ring-yellow-|bg-emerald-|bg-green-|bg-purple-|bg-rose-|bg-blue-[123]|fill-amber-|bg-amber-|gap-5[^0]|gap-7|gap-9" components/ app/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob\|s-dm\|s-ink\|s-amber\|s-yellow\|s-success\|//\|node_modules" | head -10

# 3. Visual spot-check these routes:
# - / (homepage — hero, categories, quartiers, salon cards, partner CTA)
# - /coiffeur (category page — salon grid, filter bar)
# - /salon/[any-slug] (profile — booking calendar, reviews)
# - /dashboard (admin — overview cards, sidebar)
# - /auth/login (glassmorphic card, inputs)
```
