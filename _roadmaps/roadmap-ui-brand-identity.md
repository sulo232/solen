# Roadmap: Solen.ch UI Brand Identity & Design System Integration

> This roadmap applies the new "Solen Carpet System" (blobs, vibrant multi-color sections, specific typography) across the platform, inspired by Treatwell.ch and the provided 4-Zone design framework.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Build failures if tailwind config has syntax errors | Test `npm run build` immediately after |
| Phase 2 | 🟢 SAFE | Nothing — new component, no existing imports affected | — |
| Phase 3 | 🔴 HIGH | Homepage Hero layout shift, duplicate blob layers, mobile horizontal scroll | Remove old inline blobs BEFORE adding `<BlobBackground>`. Test at 320px viewport width. |
| Phase 4 | 🟡 MEDIUM | Footer link accessibility if contrast ratio drops | Run WCAG contrast check on white text over new gradient |
| Phase 5 | 🟡 MEDIUM | SalonCard `overflow-hidden` clipping child elements outside new blob radius | Ensure inner `<Link>` uses `rounded-[inherit]` to follow parent blob shape |
| Phase 6 | 🟢 SAFE | Nothing | — |
| Phase 7 | 🟢 SAFE | Documentation only | — |

---

## Pre-Flight Scan Results (R10)

Before writing this roadmap, the following codebase scan was performed:

### Existing Component Conflict
```
components/ui/BackgroundBlobs.tsx   → EXISTS (26 lines, variant="hero"|"section")
components/ui/BlobBackground.tsx    → EXISTS (36 lines, zone=1|2, created earlier this session)
```
**Decision:** `BackgroundBlobs.tsx` is the OLD component (simpler, `absolute` positioned, no zone system, no grain). `BlobBackground.tsx` is the NEW one. Phase 2 must **replace** `BackgroundBlobs.tsx` by merging its functionality into `BlobBackground.tsx`, then update all imports. This prevents two near-identical components from confusing future agents.

### Consumers of `BackgroundBlobs`
```bash
grep -rn "BackgroundBlobs" components/ app/ --include="*.tsx"
```
Must be run at execution time to find and update all import sites.

### Banned Token Violations Found (Current State)
| File | Line | Violation | Fix |
|---|---|---|---|
| `components/HomePage.tsx` | 253 | `rounded-2xl` | Replace with `rounded-card` |
| `components/CategoryPage.tsx` | 61 | `bg-white` without `dark:` pair | Add `dark:bg-s-dm-surface` |

### Existing Blob Integrations (Already Applied This Session)
| File | What Was Done |
|---|---|
| `tailwind.config.js` | `blob-a` through `blob-e` border radii added |
| `app/globals.css` | `solen-float`, `solen-reveal`, `.blob-interactive`, `.grain-overlay` added |
| `components/ui/BlobBackground.tsx` | Created with `zone` prop |
| `components/HomePage.tsx` | BlobBackground zone=1, Last-Minute `bg-s-coral-subtle`, Partner Banner added |
| `components/CategoryPage.tsx` | BlobBackground zone=2, DirectoryCard blob-d → blob-b hover |
| `components/SalonCard.tsx` | blob-d resting shape, blob-b hover morph via framer-motion |
| `components/layout/Footer.tsx` | Vibrant gradient wave background |
| `UI_RULES.md` | Section 10 updated with blob tokens |

> ⚠️ These changes were applied directly during an earlier conversation step. This roadmap **documents, validates, and completes** the remaining work including fixes for gaps, dark mode pairs, banned tokens, documentation sync, and component consolidation.

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1: Tailwind & CSS Token Completion
**Goal:** Ensure all blob radii, brand color variants, and keyframe animations are correctly defined with no syntax errors.

**[MODIFY] `tailwind.config.js`**
- Verify `blob-a` through `blob-e` exist under `theme.extend.borderRadius`
- Verify `shadow-warm-float` exists under `theme.extend.boxShadow`
- Verify all `s-coral`, `s-amber`, `s-blue`, `s-plum`, `s-yellow`, `s-sage`, `s-sand` have `DEFAULT`, `hover` (where applicable), `subtle`, and `text` variants

**[MODIFY] `app/globals.css`**
- Verify `@keyframes solen-float` (6s ease-in-out infinite, translateY + slight rotate)
- Verify `@keyframes solen-reveal` (0.4s fade-up for stagger children)
- Verify `.blob-interactive` class with `transition: border-radius 500ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 300ms, background 150ms, box-shadow 300ms`
- Verify `.grain-overlay` with `position: fixed; inset: 0; pointer-events: none; z-index: 999; opacity: 0.04` and SVG noise texture. Hidden on mobile (`@media max-width: 768px`)
- Verify `prefers-reduced-motion` block includes `.hero-blob` alongside existing animation classes

#### ✅ DO
```javascript
// tailwind.config.js — blob radii
"blob-a": "40% 60% 70% 30% / 40% 50% 60% 50%",
"blob-b": "60% 40% 45% 55% / 50% 60% 40% 50%",
"blob-c": "50% 50% 40% 60% / 60% 40% 60% 40%",
"blob-d": "40% 60% 55% 45% / 30% 30% 70% 70%",
"blob-e": "70% 30% 50% 50% / 40% 60% 40% 60%",
```

#### ❌ DON'T
```javascript
// DON'T: Create a Tailwind plugin for blob radii — they are simple strings
// DON'T: Use rem/px for blob shapes — they must be percentage-based for organic morphing
```

#### Verification
```bash
npm run build
git add -A && git commit -m "phase 1: verify and complete tailwind blob tokens and CSS keyframes"
git push origin main
sleep 30
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Expected: 200 or 307
```

#### Banned Token Check (Rule 20)
```bash
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-" components/ app/ --include="*.tsx" | grep -v "node_modules\|darkMode\|//\|s-dm\|s-ink\|s-amber" | head -5
# Must return 0 results
```

> ⚠️ **BE CAREFUL:** A misplaced comma or unclosed string in `tailwind.config.js` will crash the ENTIRE Next.js build. After editing, `npm run build` MUST pass before committing. The existing `blob: "30% 70% 70% 30% / 30% 30% 70% 70%"` token should be kept for backward compatibility.

---

### Phase 2: Component Consolidation (`BackgroundBlobs` → `BlobBackground`)
**Goal:** Merge the old `BackgroundBlobs.tsx` into the new `BlobBackground.tsx` and delete the old component, so there is exactly one blob background primitive.

**Step 2.1: Find all imports of old component**
```bash
grep -rn "BackgroundBlobs" components/ app/ --include="*.tsx" --include="*.ts"
# List every file that imports BackgroundBlobs
```

**Step 2.2: [MODIFY] Each consumer file**
- Replace `import BackgroundBlobs from "@/components/ui/BackgroundBlobs"` with `import BlobBackground from "@/components/ui/BlobBackground"`
- Replace `<BackgroundBlobs variant="hero" />` with `<BlobBackground zone={1} />`
- Replace `<BackgroundBlobs variant="section" />` with `<BlobBackground zone={2} />`

**Step 2.3: [DELETE] `components/ui/BackgroundBlobs.tsx`**
- Remove the file entirely after all imports are updated.

**Step 2.4: [MODIFY] `CLAUDE.md` Section 3.3**
- Change the line `**Background blobs**: <BackgroundBlobs> from BackgroundBlobs.tsx` to `**Background blobs**: <BlobBackground> from BlobBackground.tsx — accepts zone={1} (maximalist) or zone={2} (soft/subtle)`

#### BEFORE (old import)
```tsx
import BackgroundBlobs from "@/components/ui/BackgroundBlobs";
// ...
<BackgroundBlobs variant="hero" />
```
#### AFTER (new import)
```tsx
import BlobBackground from "@/components/ui/BlobBackground";
// ...
<BlobBackground zone={1} />
```

#### ✅ DO
```tsx
// DO: Use the zone system consistently
<BlobBackground zone={1} />  // Homepage, discovery — full opacity, grain overlay
<BlobBackground zone={2} />  // Search, category — 50% opacity, no grain
```

#### ❌ DON'T
```tsx
// DON'T: Keep both components alive — this confuses future agents
import BackgroundBlobs from "@/components/ui/BackgroundBlobs";  // ❌ DELETED
import BlobBackground from "@/components/ui/BlobBackground";    // ✅ USE THIS
```

#### Verification
```bash
# Confirm old component is gone
ls components/ui/BackgroundBlobs.tsx 2>&1  # Should say "No such file"
# Confirm no remaining imports
grep -rn "BackgroundBlobs" components/ app/ --include="*.tsx"  # Must return 0 results
npm run build
git add -A && git commit -m "phase 2: consolidate BackgroundBlobs into BlobBackground"
git push origin main
sleep 30
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
```

> ⚠️ **BE CAREFUL:** `CLAUDE.md` Section 3.3 references `BackgroundBlobs.tsx` — if you forget to update it, the next agent will recreate the old component. Also check `components/index.ts` barrel exports for a `BackgroundBlobs` re-export.

---

### Phase 3: HomePage Enhancements (Zone 1: Full Maximalist)
**Goal:** Clean up the existing HomePage implementation: fix banned tokens, verify dark mode pairs, ensure no duplicate blob layers.

**[MODIFY] `components/HomePage.tsx`**

**3.1: Fix banned token `rounded-2xl` (line ~253)**
```diff
- className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/80 dark:bg-s-dm-surface/80 ..."
+ className="flex flex-col items-center gap-2 p-4 rounded-card bg-white/80 dark:bg-s-dm-surface/80 ..."
```

**3.2: Verify Hero section has NO duplicate inline blobs**
The old hero had 3 hardcoded `<div className="absolute ... rounded-full bg-s-coral/15 blur-3xl">` blobs. These were removed when `<BlobBackground zone={1} />` was added. Verify they do NOT still exist — if they do, delete them.

**3.3: Verify Last-Minute section wrapper**
The `<section>` wrapping LastMinuteCard must use:
```tsx
<section className="py-12 my-10 bg-s-coral-subtle/40 dark:bg-s-coral-subtle/5 border-y border-s-coral/10 rounded-blob-e mx-2 sm:mx-6 overflow-hidden relative">
```
- ✅ Has dark mode pair (`dark:bg-s-coral-subtle/5`)
- ✅ Uses `rounded-blob-e` (not generic tailwind)
- ✅ Has horizontal margin (`mx-2 sm:mx-6`) so blob edges are visible

**3.4: Verify Partner Banner**
Must exist between the Quartier section and the Footer. Must have:
- `bg-s-ink` background with inner `bg-s-blue/20` and `bg-s-coral/20` glow blobs
- Text: `text-white` (acceptable for text on `s-ink` background — WCAG passes)
- CTA button: `rounded-blob-a blob-interactive bg-s-coral hover:bg-s-coral-hover`
- Link target: `/${locale}/partner`

**3.5: Verify background is `bg-transparent` not `bg-s-bg-base`**
Since `<BlobBackground>` uses `fixed` positioning, the main container must be `bg-transparent` (or `bg-s-bg-base` with reduced opacity) to let the blobs show through.

#### ✅ DO
```tsx
// DO: Use design system tokens for all radii
<div className="rounded-card bg-white/80 dark:bg-s-dm-surface/80">

// DO: Ensure the main container doesn't block the fixed blobs
<div className="min-h-screen bg-transparent relative overflow-x-hidden">
```

#### ❌ DON'T
```tsx
// DON'T: Use generic Tailwind radii
<div className="rounded-2xl">  // ❌ BANNED per Rule 20
<div className="rounded-lg">   // ❌ BANNED per Rule 20

// DON'T: Add inline blobs AND BlobBackground — creates double-layered mess
<BlobBackground zone={1} />
<div className="absolute ... bg-s-coral/15 blur-3xl">  // ❌ DUPLICATE
```

#### Verification
```bash
# Check for banned rounded tokens in HomePage
grep -n "rounded-2xl\|rounded-lg\|rounded-xl\|rounded-3xl" components/HomePage.tsx
# Must return 0 results

# Verify dark mode pairs
grep -n "bg-white" components/HomePage.tsx | grep -v "dark:\|text-white\|//"
# Every bg-white should have a dark: pair (except inside coral/ink buttons)

npm run build
git add -A && git commit -m "phase 3: fix banned tokens and verify dark mode pairs in HomePage"
git push origin main
sleep 30
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/coiffeur
```

> ⚠️ **BE CAREFUL:** `components/HomePage.tsx` is the PRODUCTION homepage (Rule 7). Do NOT refactor its structure — only fix tokens and verify existing blob integrations. If a bg-white does not have a dark pair, add `dark:bg-s-dm-surface` or `dark:bg-s-dm-raised` as appropriate. Do NOT touch the data fetching logic, SalonCard rendering, or any API calls.

---

### Phase 4: Footer Vibrant Redesign Verification
**Goal:** Ensure the footer has the correct gradient wave background, links remain accessible, and dark mode works.

**[MODIFY] `components/layout/Footer.tsx`**

**4.1: Verify background structure**
The footer must have:
```tsx
<footer className="relative bg-s-ink text-s-bg-base overflow-hidden">
  {/* Background layer */}
  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-gradient-to-br from-s-ink via-s-ink to-s-plum/80" />
    <div className="absolute -bottom-[60%] -left-[10%] w-[120%] h-[120%] rounded-[100%] bg-gradient-to-r from-s-coral/30 via-s-plum/40 to-s-amber/30 blur-3xl transform rotate-[-8deg] opacity-60" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-s-blue/20 blur-3xl" />
    <div className="absolute -top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-s-coral/10 blur-3xl" />
  </div>
  <div className="relative z-10 ...">
    {/* Links grid */}
  </div>
</footer>
```

**4.2: Verify WCAG contrast**
- All link text uses `text-white/70` on the dark `s-ink` + gradient background → passes AA
- Section headers use `text-white/60 uppercase tracking-wider` → acceptable for decorative headers
- Verify hover states: `hover:text-white` provides sufficient increase

**4.3: Verify mobile layout**
- Grid: `grid-cols-2 sm:grid-cols-4`
- No horizontal overflow on 320px viewport
- Background gradients don't cause performance issues on low-end devices (avoid `blur-3xl` stacking more than 3 layers)

#### ✅ DO
```tsx
// DO: Keep background effects in a separate pointer-events-none container
<div className="absolute inset-0 pointer-events-none" aria-hidden="true">
```

#### ❌ DON'T
```tsx
// DON'T: Apply gradients directly to the footer element (breaks z-index)
<footer className="bg-gradient-to-r from-s-coral to-s-plum">  // ❌ Text becomes unreadable

// DON'T: Use more than 3-4 blur-3xl layers (performance hit on mobile)
```

#### Verification
```bash
npm run build
git add -A && git commit -m "phase 4: verify footer vibrant background and WCAG compliance"
git push origin main
sleep 30
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
```

> ⚠️ **BE CAREFUL:** The Footer is used on EVERY page (imported in multiple layouts). Any crash here takes down the entire site. Do NOT change the link structure, only verify the visual background layer. If links are inaccessible (contrast too low), increase opacity on `text-white/70` to `text-white/80`.

---

### Phase 5: Category/Search Pages (Zone 2: Soft Maximalist)
**Goal:** Ensure search and category pages use subtle branding without clutter. Fix dark mode gaps.

**[MODIFY] `components/CategoryPage.tsx`**

**5.1: Fix `bg-white` without dark pair (DirectoryCard, line ~61)**
```diff
- className="rounded-blob-d hover:rounded-blob-b blob-interactive bg-white dark:bg-s-dm-surface ..."
```
Currently correct — double-check this pairing exists. If `bg-white` appears without `dark:bg-s-dm-*`, add the pair.

**5.2: Verify BlobBackground zone=2**
```tsx
<BlobBackground zone={2} />
```
This renders blobs at 50% opacity with no grain. The hero gradient overlay (`from-white/60 to-transparent`) ensures text readability above the blobs.

**5.3: Verify unused `gradient` variable**
The old `categoryGradients` record and `gradient` variable may now be unused since we replaced the hero background. If unused, remove to avoid dead code.

**[MODIFY] `components/SalonCard.tsx`**

**5.4: Verify blob physics**
```tsx
// Resting state (via style prop):
style={{ borderRadius: "40% 60% 55% 45% / 30% 30% 70% 70%" }}  // blob-d

// Hover state (via framer-motion):
whileHover={{ y: -4, borderRadius: "60% 40% 45% 55% / 50% 60% 40% 50%", boxShadow: "..." }}  // blob-b

// Inner Link must inherit parent shape:
<Link className="block w-full h-full rounded-[inherit] ...">
```

**5.5: Verify `prefers-reduced-motion` respect**
The framer-motion `whileHover` already checks `window.matchMedia("(prefers-reduced-motion: reduce)")` and returns `{}` if true. Verify this is present.

#### ✅ DO
```tsx
// DO: Use rounded-[inherit] on children so they follow the parent blob shape
<motion.div style={{ borderRadius: "40% 60% 55% 45% / 30% 30% 70% 70%" }}>
  <Link className="rounded-[inherit] overflow-hidden">
```

#### ❌ DON'T
```tsx
// DON'T: Use static rounded-card on the Link when parent has blob-d shape
<motion.div style={{ borderRadius: "40% 60% 55% 45% / ..." }}>
  <Link className="rounded-card">  // ❌ Inner rectangle clips outside the organic parent shape
```

#### Verification
```bash
# Check for bg-white without dark pairs in CategoryPage
grep -n "bg-white" components/CategoryPage.tsx | grep -v "dark:\|//"
# Must return 0 results (every bg-white needs a dark pair)

# Check for banned rounded tokens
grep -n "rounded-2xl\|rounded-lg\|rounded-xl" components/CategoryPage.tsx components/SalonCard.tsx
# Must return 0 results

npm run build
git add -A && git commit -m "phase 5: zone 2 search page cleanup and SalonCard blob physics"
git push origin main
sleep 30
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/coiffeur
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/barbershop
```

> ⚠️ **BE CAREFUL:** `SalonCard.tsx` is used on EVERY page that lists salons (Homepage, CategoryPage, Favorites, Search Results). Any change here has a massive blast radius. Do NOT change the data display logic — only the border-radius/shadow interaction layer. If the blob shape clips cover photos badly, revert to `rounded-card` and note in `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 6: Full Documentation Sync
**Goal:** Update ALL documentation files to reflect the new design system additions (CLAUDE.md Rules 22 and 23).

**[MODIFY] `UI_RULES.md`**
- Section 10 ("Border Radius & Blob Physics"): Verify `blob-a` through `blob-e` are documented with usage descriptions
- Section 11 ("Shadows"): Verify `shadow-warm-float` is documented
- Section 4 ("Animations"): Add note about `blob-interactive` transition and `solen-float` keyframes
- Section 17 (Zone Guidelines): Update Zone 1 shapes to include `rounded-blob-*` and Zone 2 to include `rounded-blob-d` resting / `rounded-blob-b` hover

**[MODIFY] `CLAUDE.md`**
- Section 3.3: Update `Background blobs` line to reference `BlobBackground.tsx` (not `BackgroundBlobs.tsx`)
- Section 3.3: Add new line: `**Radii**: card 12px, pill 9999px, button 8px, blob-a/b/c/d/e organic % (see UI_RULES.md §10)`
- Section 3.3: Add `**Blob physics**: .blob-interactive for 500ms spring border-radius morphing on hover`

#### Cross-Check (Rule 23)
```bash
# Verify all four files are in sync:
grep -n "151009\|1E1710\|F5EEE4" tailwind.config.js UI_RULES.md CLAUDE.md
# All files must show the SAME hex values

# Verify blob token consistency:
grep -n "blob-a\|blob-b\|blob-c\|blob-d\|blob-e" tailwind.config.js UI_RULES.md
# Both files must list the same 5 tokens
```

#### Verification
```bash
npm run build
git add -A && git commit -m "phase 6: documentation sync for blob design system"
git push origin main
sleep 30
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
```

> ⚠️ **BE CAREFUL:** If you skip this phase, the next AI agent will not know about `.blob-interactive` or the zone system and will create conflicting implementations. This is the most commonly skipped phase — DO NOT SKIP IT.

---

## Dependency Execution Order (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Verify/complete Tailwind & CSS tokens | Nothing |
| Phase 2 | 🤖 | Consolidate BackgroundBlobs → BlobBackground | Phase 1 |
| Phase 3 | 🤖 | HomePage banned token fixes + verification | Phase 1, Phase 2 |
| Phase 4 | 🤖 | Footer background verification + WCAG | Phase 1 |
| Phase 5 | 🤖 | Category pages zone 2 + SalonCard blob physics | Phase 1, Phase 2 |
| Phase 6 | 🤖 | Documentation sync (UI_RULES.md + CLAUDE.md) | Phase 1-5 |

---

## Final Validation Checklist

After ALL phases are complete, run the full suite:

```bash
# 1. Build
npm run build

# 2. Banned token scan (Rule 20)
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl" components/ app/ --include="*.tsx" | grep -v "node_modules\|darkMode\|//\|s-dm\|s-ink\|s-amber\|tailwind" | head -10
# Must return 0 results

# 3. Dark mode pair check (Rule 21)
grep -rn "bg-white" components/ --include="*.tsx" | grep -v "dark:\|toggle\|CookieBanner\|//\|knob\|text-white" | wc -l
# Should be 0

# 4. Old component cleanup check
grep -rn "BackgroundBlobs" components/ app/ --include="*.tsx"
# Must return 0 results

# 5. Documentation consistency (Rule 23)
grep -n "blob-a\|blob-b\|blob-c\|blob-d\|blob-e" tailwind.config.js UI_RULES.md CLAUDE.md
# All three files must reference the same 5 tokens

# 6. Live site check
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/coiffeur
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/barbershop
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/dashboard
# All should return 200 or 307
```
