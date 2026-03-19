# 🧹 PROMPT 4 of 4: Consistency Sweep — Tokens, Colors, Docs

> **Read `CLAUDE.md` (Section 12: Rules 15-19) and `UI_RULES.md` BEFORE starting.**
> **Prerequisite:** Prompts 1-3 must be 100% complete.
> **This is a cleanup-only prompt.** No new features. Pure consistency + documentation.

---

## 🚦 Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 16 (text-dark→s-ink) | 🟡 MED | Visual if wrong replace | Both resolve to same hex |
| 17 (bg-dark→s-ink) | 🟡 MED | Overlay opacity | Keep opacity values identical |
| 18 (bg-black→s-ink) | 🟢 SAFE | Nothing | Same visual |
| 19 (hover token) | 🟢 SAFE | Nothing | Direct replace |
| 20 (dedup file) | 🟢 SAFE | Import path | Grep check |
| 21 (inline styles) | 🟡 MED | Layout if wrong class | Test after |
| 22 (z-index) | 🟡 MED | Stacking if wrong value | Document first |
| 23 (CHF i18n) | 🟢 SAFE | Nothing | Optional fallback |
| 24 (UI_RULES docs) | 🟢 SAFE | Nothing | Doc only |

---

## Context: The `dark` vs `s-ink` Problem

In `tailwind.config.js`:
```
dark.DEFAULT = "#1A1209"   ← old token
s-ink.DEFAULT = "#1A1209"  ← new design system token
```

Both resolve to the **same hex color**. But:
- `text-dark` = 1008 refs (old naming)
- `text-s-ink` = 9 refs (new naming)

Additionally:
- `text-dark/50`, `text-dark/40`, etc. → should be `text-s-ink/50`, `text-s-ink/40`
- `bg-dark` overlays → should be `bg-s-ink`

After this prompt, ONLY `s-ink` and `s-dm` tokens should exist. The `dark` and `dm-*` colors in tailwind.config can be removed.

---

## 🤖 PHASE 16 — `text-dark` → `text-s-ink` (2.5 hours) 🟡

### 16.1 — Find and replace ALL variants

| Old | New | Est. Count |
|---|---|---|
| `text-dark/90` | `text-s-ink/90` | ~5 |
| `text-dark/80` | `text-s-ink/80` | ~15 |
| `text-dark/70` | `text-s-ink/70` | ~60 |
| `text-dark/60` | `text-s-ink/60` | ~80 |
| `text-dark/50` | `text-s-ink/50` | ~120 |
| `text-dark/40` | `text-s-ink/40` | ~100 |
| `text-dark/30` | `text-s-ink/30` | ~30 |
| `text-dark/20` | `text-s-ink/20` | ~10 |
| `text-dark` (no opacity) | `text-s-ink` | ~400 |
| `dark:text-dark/` (any) | `dark:text-s-ink/` | ~10 |
| `hover:text-dark` | `hover:text-s-ink` | ~20 |
| `group-hover:text-dark` | `group-hover:text-s-ink` | ~5 |

**Total: ~1000 replacements across ~70 files.**

### 16.2 — Top files by count

These files have the most `text-dark/` refs. Start here:

| File | Count |
|---|---|
| `app/[locale]/onboarding/salon/page.tsx` | 63 |
| `app/[locale]/dashboard/settings/page.tsx` | 56 |
| `app/[locale]/salon/[slug]/page.tsx` | 39 |
| `components/ProfilePage.tsx` | 30 |
| `app/[locale]/dashboard/calendar/page.tsx` | 30 |
| `app/[locale]/dashboard/services/page.tsx` | 24 |
| `components/TerminePage.tsx` | 23 |
| `app/[locale]/dashboard/badge-manager/page.tsx` | 19 |
| `app/[locale]/checkout/page.tsx` | 19 |
| `app/[locale]/auth/register/page.tsx` | 17 |

✅ DO: Replace ALL variants including opacities, hover, group-hover, dark: prefixes
❌ DON'T: Change `dark:text-dm-text` here — that was Prompt 1's job

> ⚠️ **BE CAREFUL**: `dark:text-dark/50` looks like a dark mode class but actually means "the `dark` token at 50% opacity in dark mode". Replace with `dark:text-s-ink/50` — NOT `dark:text-s-dm-text/50` (which is the dark mode TEXT token). The `text-dark` → `text-s-ink` replacement is a light-mode token swap, so `dark:` prefix doesn't change the mapping.

### 16.3 — Verification

```bash
grep -rn "text-dark" components/ app/ --include="*.tsx" | grep -v "dark:text-s-dm\|dark:text-dm\|node_modules" | wc -l
# MUST be 0 (or only inside comments)
```

```bash
npm run build
git add -A && git commit -m "phase 16: text-dark → text-s-ink across entire codebase (~1000 refs)" && git push
git tag consistency-ph16 && git push origin consistency-ph16
```

---

## 🤖 PHASE 17 — `bg-dark` → `bg-s-ink` (30 min) 🟡

Replace ALL `bg-dark` variants:

| Old | New | Usage |
|---|---|---|
| `bg-dark/80` | `bg-s-ink/80` | Overlays (StaffPortfolio) |
| `bg-dark/40` | `bg-s-ink/40` | Backdrop blur overlays |
| `bg-dark/30` | `bg-s-ink/30` | Light overlays |
| `bg-dark` | `bg-s-ink` | Tooltips, solid bg |
| `dark:bg-dark/40` | `dark:bg-s-ink/40` | Dark mode overlays |

Files: StaffPortfolio, DashboardLayout, CompareDrawer, ProfilePage, TerminePage, GlassModal, CookieBanner, AnimatedButton, SalonCard, QuickPreviewSheet, MapView.

> ⚠️ **BE CAREFUL**: `bg-dark/40` as an overlay = `bg-s-ink/40`. Keep the SAME opacity. Don't accidentally drop the `/40` during replacement.

```bash
grep -rn "bg-dark" components/ app/ --include="*.tsx" | grep -v "dark:bg-s-dm\|dark:bg-dm\|node_modules\|darkMode" | wc -l
# MUST be 0
npm run build
git add -A && git commit -m "phase 17: bg-dark → bg-s-ink for overlays and tooltips" && git push
```

---

## 🤖 PHASE 18 — `bg-black` → `bg-s-ink` (15 min) 🟢

| File | Old | New |
|---|---|---|
| `WaitlistModal.tsx` | `bg-black/40` | `bg-s-ink/40` |
| `chat/PhotoGallery.tsx` | `bg-black/80` | `bg-s-ink/80` |
| `BookingCalendar.tsx` | `bg-black/40` | `bg-s-ink/40` |
| `BottomSheet.tsx` | any `bg-black` | `bg-s-ink` |

```bash
grep -rn "bg-black" components/ app/ --include="*.tsx" | wc -l
# MUST be 0
npm run build
git add -A && git commit -m "phase 18: bg-black → bg-s-ink (warm overlays)" && git push
```

---

## 🤖 PHASE 19 — Fix Nonexistent Hover Tokens (15 min) 🟢

### 19.1 — `hover:bg-s-coral-dark` (13 refs)

`s-coral-dark` does NOT exist in tailwind.config. Replace:

```diff
-hover:bg-s-coral-dark
+hover:bg-s-coral/90
```

or use the existing `hover:bg-s-coral-hover` token (which resolves to `#CC4E35`).

### 19.2 — `hover:bg-s-coral-hover` (if any)

Check if this token works. It should — `s-coral.hover` = `#CC4E35`. Standardize:

**Decision:** Use `hover:bg-s-coral-hover` everywhere for coral button hovers (cleaner than `/90`).

### 19.3 — `s-sand-dark` token

Verify `s-sand-dark` exists after Prompt 1 adds it. If not, add manually.

```bash
grep -rn "bg-s-coral-dark\|hover:bg-s-coral-dark" components/ app/ --include="*.tsx" | wc -l
# MUST be 0
npm run build
git add -A && git commit -m "phase 19: fix nonexistent hover tokens" && git push
```

---

## 🤖 PHASE 20 — Duplicate File Cleanup (15 min) 🟢

### 20.1 — ExpandableTabs duplicate

Two files exist:
- `components/ui/ExpandableTabs.tsx` (PascalCase)
- `components/ui/expandable-tabs.tsx` (kebab-case)

```bash
# Check which one is imported
grep -rn "ExpandableTabs\|expandable-tabs" components/ app/ --include="*.tsx" | grep "import"
```

Delete the one that's NOT imported. If both are imported, consolidate to PascalCase.

### 20.2 — Check for other duplicates

```bash
# Two files with similar names (case-insensitive duplicates)
find components/ -iname "*.tsx" | sort -f | uniq -di
```

```bash
npm run build
git add -A && git commit -m "phase 20: remove duplicate component files" && git push
```

---

## 🤖 PHASE 21 — Inline Styles → Tailwind (30 min) 🟡

21 refs of `style={{...}}` in components. Most are probably for dynamic values (which is OK), but check for hardcoded ones:

```bash
grep -rn 'style={{' components/ --include="*.tsx" | head -25
```

Replace any `style={{ color: "..." }}` or `style={{ backgroundColor: "..." }}` with Tailwind classes.

✅ DO: Keep `style={{}}` for truly dynamic values (calculated positions, animations)
❌ DON'T: Replace `style={{ width: `${percent}%` }}` — those need to be dynamic

```bash
npm run build
git add -A && git commit -m "phase 21: inline styles → Tailwind where possible" && git push
```

---

## 🤖 PHASE 22 — z-index Scale + Documentation (30 min) 🟡

### 22.1 — Define scale in UI_RULES.md

Add z-index section:
```markdown
## Z-Index Scale
| Token | Value | Used For |
|---|---|---|
| z-base | 10 | Content above bg |
| z-sticky | 20 | Sticky headers in dashboard |
| z-nav | 30 | Dashboard side/bottom nav |
| z-overlay | 40 | FilterBar sticky, CompareBar, StickyMobileCTA |
| z-header | 50 | Main Header, BottomNav, dropdowns |
| z-modal-backdrop | 55 | Modal/drawer backdrops |
| z-modal | 60 | Modals, drawers, sheets |
| z-toast | 70 | Toast notifications, CookieBanner |
```

### 22.2 — Fix stacking conflicts

Currently z-50 is used for: Header, BottomNav, modals, sheets, dropdowns, CookieBanner — all fighting for the same layer. Fix:

| Component | Current | New |
|---|---|---|
| `GlassModal.tsx` backdrop | z-50 | z-55 (behind modal) |
| `GlassModal.tsx` content | z-50 | z-60 |
| `CompareDrawer.tsx` backdrop | z-50 | z-55 |
| `CompareDrawer.tsx` drawer | z-50 | z-60 |
| `CookieBanner.tsx` | z-50 | z-70 |
| `QuickPreviewSheet.tsx` | z-50 | z-60 |
| `BottomSheet.tsx` | z-50 | z-60 |
| `PWAInstallPrompt.tsx` | z-50 | z-70 |
| `Toast.tsx` | (any) | z-70 |

> ⚠️ **BE CAREFUL**: Tailwind doesn't support z-55/60/70 by default. Add them to `tailwind.config.js`:
```js
zIndex: {
  55: '55',
  60: '60',
  70: '70',
}
```

```bash
npm run build
git add -A && git commit -m "phase 22: z-index scale — fix stacking conflicts" && git push
```

---

## 🤖 PHASE 23 — CHF → i18n Currency (45 min) 🟢

Create a currency formatter utility:

#### [NEW] `lib/format-currency.ts`

```typescript
export function formatCurrency(amount: number, locale: string = "de-CH"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

Replace ALL `CHF {price}` with `{formatCurrency(price, locale)}` in:
- ServiceTile, LastMinuteCard, SalonCard, CompareDrawer
- BookingSuccess, BookingCalendar, SearchAutocomplete
- PriceSlider, QuickPreviewSheet, ChatWindow
- MapView (HTML string — use inline: ``ab ${formatCurrency(minPrice)}``)
- ProfilePage (referral value)
- PromoManager (dashboard)

> ⚠️ **BE CAREFUL**: `formatCurrency()` needs `locale` param. In components, get it from `useLocale()`. In server components, get it from `params.locale`. MapView HTML strings can't use hooks — pass locale as a prop.

```bash
grep -rn "CHF " components/ app/ --include="*.tsx" | grep -v "import\|//\|node_modules" | wc -l
# Should be 0
npm run build
git add -A && git commit -m "phase 23: CHF → formatCurrency() i18n-ready" && git push
```

---

## 🤖 PHASE 24 — Hardcoded Hex Colors → Tokens (15 min) 🟢

21 refs of hardcoded hex like `#333`, `#E8624A`, etc. in component files.

```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" components/ --include="*.tsx" | grep -v "//\|import\|svg\|node_modules"
```

Replace with design tokens:
- `#1A1209` → `s-ink` (already a token)
- `#E8624A` → `s-coral` (already a token)
- `#333` → `s-ink/80` (approximate)
- `#FAF6EF` → `s-bg-base`
- etc.

> ⚠️ **BE CAREFUL**: MapView uses hex in HTML template strings for Mapbox popups — these can't use Tailwind classes. Leave those as hex but use the correct values from the design system.

```bash
npm run build
git add -A && git commit -m "phase 24: hardcoded hex → design tokens" && git push
```

---

## 🤖 PHASE 25 — UI_RULES.md Full Documentation (30 min) 🟢

#### [MODIFY] `UI_RULES.md`

Add these sections:

### 25.1 — Custom Border Radius

```markdown
## Border Radius
| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 12px | Cards, modals, sheets |
| `rounded-button` | 8px | Buttons, inputs, dropdowns |
| `rounded-pill` | 9999px | Badges, pills, chips, toggle buttons |
| `rounded-blob` | organic % | SalonCard hover effect |
Standard Tailwind `rounded-*` should NOT be used for these — use the design tokens.
```

### 25.2 — Shadow Scale

```markdown
## Shadows
| Token | Usage |
|---|---|
| `shadow-card` | Cards at rest |
| `shadow-card-hover` | Cards on hover |
| `shadow-glass` | Glassmorphism panels |
| `shadow-glass-hover` | Glassmorphism hover |
| `shadow-warm-sm` | Buttons, small elevations |
| `shadow-warm-md` | Active cards, dropdowns |
| `shadow-warm-lg` | Modals, sheets |
| `shadow-coral-glow` | Coral CTA pulse |
```

### 25.3 — Font System

```markdown
## Typography
| Token | Font | Usage |
|---|---|---|
| `font-display` | Bebas Neue | Hero titles, large splash text |
| `font-heading` | Syne | Section headers, card titles, nav |
| `font-body` | DM Sans | Body text, descriptions, UI text |
| `data-text` | DM Mono / tabular nums | Prices, ratings, scores, counters |
Body default = `font-body` (set on `<body>`). You don't need `font-body` class unless overriding.
```

### 25.4 — Blur/Glass

```markdown
## Glassmorphism
| Token | Value | Usage |
|---|---|---|
| `backdrop-blur-glass` | 20px | Modals, sheets, navbar pill |
| `backdrop-blur-xs` | 4px | Subtle overlays |
| Standard `backdrop-blur-sm/md/lg` | — | General purpose |
```

### 25.5 — Color Token Hierarchy (UPDATED)

```markdown
## Text Colors (ONLY use these)
| Light Mode | Dark Mode | Usage |
|---|---|---|
| `text-s-ink` | `dark:text-s-dm-text` | Primary text |
| `text-s-ink/70` | `dark:text-s-dm-text/70` | Secondary text |
| `text-s-ink/50` | `dark:text-s-dm-text/50` | Tertiary/muted |
| `text-s-ink/40` | `dark:text-s-dm-text/40` | Disabled/hint |
| `text-s-coral` | `dark:text-s-coral` | Accent (large text only!) |
| `text-s-coral-text` | `dark:text-s-coral` | Accent (body text) |

## BANNED tokens (do not use):
- ~~`text-dark`~~ → use `text-s-ink`
- ~~`bg-dark`~~ → use `bg-s-ink`
- ~~`bg-black`~~ → use `bg-s-ink`
- ~~`dark:text-dm-text`~~ → use `dark:text-s-dm-text`
- ~~`dark:bg-dm-surface`~~ → use `dark:bg-s-dm-surface`
- ~~`text-gray-*`~~ → use `text-s-ink/*`
- ~~`bg-gray-*`~~ → use `bg-s-bg-*` or `bg-s-sand`
```

```bash
npm run build
git add -A && git commit -m "phase 25: UI_RULES.md — full design system documentation" && git push
```

---

## 🤖 PHASE 26 — Remove Legacy Colors from Tailwind Config (15 min) 🟢

#### [MODIFY] `tailwind.config.js`

After all `text-dark` and `bg-dark` refs are replaced, remove the legacy `dark` color and `dm-*` colors:

```diff
 colors: {
-  dark: {
-    DEFAULT: "#1A1209",
-    50: "#FAF6EF",
-    100: "#EDE5D8",
-    200: "#C8B8A6",
-    300: "#8A7A66",
-    400: "#4A3D2E",
-    500: "#1A1209",
-  },
-  "dm-bg": "#151009",
-  "dm-surface": "#1E1710",
-  "dm-text": "#F5EEE4",
```

These are now duplicated by `s-ink` and `s-dm` tokens.

> ⚠️ **BE CAREFUL**: Run the verification FIRST:
```bash
grep -rn "text-dark\|bg-dark\|border-dark\|dark:bg-dm-\|dark:text-dm-\|dark:border-dm-" components/ app/ --include="*.tsx" | wc -l
# MUST be 0 before removing from config
```

Also check `darkMode` config reference:
```bash
grep -rn "darkMode\|dark-50\|dark-100\|dark-200\|dark-300\|dark-400\|dark-500" components/ app/ --include="*.tsx" | wc -l
```

If 0, safe to remove.

Also update `CLAUDE.md` Section 3. Design Tokens to remove references to legacy `dark` and `dm-*` tokens. Add a note that `s-ink` is the only text color token and `s-dm` is the only dark mode token family.

```bash
npm run build
git add -A && git commit -m "phase 26: remove legacy color tokens from tailwind.config + update CLAUDE.md" && git push
git tag v3-consistency && git push origin v3-consistency
```

---

## 🤖 PHASE 27 — Final Verification (15 min) 🟢

```bash
# ALL must return 0:
grep -rn "text-dark" components/ app/ --include="*.tsx" | wc -l
grep -rn "bg-dark" components/ app/ --include="*.tsx" | grep -v "darkMode" | wc -l
grep -rn "bg-black" components/ app/ --include="*.tsx" | wc -l
grep -rn "bg-gray-\|text-gray-\|border-gray-" components/ app/ --include="*.tsx" | wc -l
grep -rn "dark:bg-dm-\|dark:text-dm-\|dark:border-dm-" components/ app/ --include="*.tsx" | wc -l
grep -rn "s-coral-dark" components/ app/ --include="*.tsx" | wc -l
grep -rn "CHF " components/ --include="*.tsx" | grep -v "import\|//" | wc -l
```

```bash
npm run build
git add -A && git commit -m "phase 27: final consistency verification" && git push
git tag v3-final && git push origin v3-final
```

---

## 📊 Dependency Ordering

| Phase | Type | What | Depends On |
|---|---|---|---|
| 16 | 🤖 | `text-dark` → `text-s-ink` | Prompts 1-3 done |
| 17 | 🤖 | `bg-dark` → `bg-s-ink` | Nothing |
| 18 | 🤖 | `bg-black` → `bg-s-ink` | Nothing |
| 19 | 🤖 | Fix hover tokens | Nothing |
| 20 | 🤖 | Dedup files | Nothing |
| 21 | 🤖 | Inline styles | Nothing |
| 22 | 🤖 | z-index scale | Nothing |
| 23 | 🤖 | CHF → formatCurrency() | Nothing |
| 24 | 🤖 | Hex → tokens | Nothing |
| 25 | 🤖 | UI_RULES docs | Phases 22, 23, 24 |
| 26 | 🤖 | Remove legacy config | Phases 16, 17 MUST be done |
| 27 | 🤖 | Final verification | All above |

## 📊 Summary

| Phase | What | Time | Refs |
|---|---|---|---|
| 16 | `text-dark` → `text-s-ink` | 2.5h | ~1000 |
| 17 | `bg-dark` → `bg-s-ink` | 30min | ~39 |
| 18 | `bg-black` → `bg-s-ink` | 15min | ~4 |
| 19 | Fix nonexistent hover tokens | 15min | ~13 |
| 20 | Dedup ExpandableTabs | 15min | 2 files |
| 21 | Inline styles → Tailwind | 30min | ~21 |
| 22 | z-index scale | 30min | ~40 |
| 23 | CHF → formatCurrency() | 45min | ~19 |
| 24 | Hardcoded hex → tokens | 15min | ~21 |
| 25 | UI_RULES.md full docs | 30min | — |
| 26 | Remove legacy tailwind colors | 15min | — |
| 27 | Final verification | 15min | — |
| **Total** | | **~6.5h** | **~1200 refs** |
