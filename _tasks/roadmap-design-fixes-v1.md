# Design Fixes & Color System v1.0 — Roadmap

> **Scope:** Fix 5 UI bugs + integrate full color token system + fix dark mode docs + update UI_RULES.md
> **File naming:** `roadmap-design-fixes-v1.md`
> **Created:** 2026-03-19

---

## Pre-Scan Evidence (R10)

**Scans performed before writing this roadmap:**

1. **Affected patterns:**
   - `grep -rn "LOCALE_FLAGS" components/` → Only in `components/ui/LanguageSwitcher.tsx` (lines 14, 73)
   - `grep -rn "rounded-none" components/layout/Header.tsx` → Line 89 (scroll transition)
   - `grep -rn "categoryInfo.label" components/layout/Header.tsx` → Line 102 (duplication source)
   - `grep -rn "s-yellow" tailwind.config.js` → 0 results (token missing, needs adding)
   - `grep -rn "0F0F1A\|1A1A2E" UI_RULES.md` → Line 9 (old cool dark mode values)
   - `curl -sL -w "%{http_code}" https://www.solen.ch/de/auth/login` → 500 (broken)

2. **`_tasks/INCOMPLETE_FEATURES.md`:** 1 entry (Supabase Storage upload route) — unrelated to this roadmap.

3. **`_tasks/completed/`:** 11 completed roadmaps reviewed — none conflict with these changes.

4. **Import/component verification:**
   - `motion`, `AnimatePresence` — already imported in `Header.tsx` line 7 ✅
   - `cn` — already imported in `Header.tsx` line 12 ✅
   - `SignIn` component — exists at `components/auth/SignIn.tsx` ✅
   - `User` icon from `lucide-react` — already imported in `Header.tsx` line 9 ✅

---

## ⚡ AUTONOMOUS EXECUTION PROTOCOL

> **ZERO MANUAL INTERACTION.** Claude Code MUST execute the entire roadmap without asking the user for permission, input, or confirmation. After every phase:

### After EVERY Phase — Auto-Push + Health Check:
```bash
# 1. Build
npm run build

# 2. Commit + push (no questions asked)
git add -A
git commit -m "phase N: [description]"
git push

# 3. Wait for Vercel deployment (90 seconds)
sleep 90

# 4. Health check — verify site is up
for url in https://www.solen.ch/de https://www.solen.ch/de/coiffeur https://www.solen.ch/de/auth/login; do
  status=$(curl -sL -o /dev/null -w "%{http_code}" "$url")
  echo "$url → $status"
  if [ "$status" != "200" ]; then
    echo "❌ HEALTH CHECK FAILED: $url returned $status"
  fi
done

# 5. If ANY health check fails → investigate and fix immediately before proceeding to the next phase
```

### If Health Check Fails:
1. Check Vercel deployment logs: `npx vercel logs --token=$VERCEL_TOKEN 2>/dev/null || echo "Check Vercel dashboard"`
2. If build failed → read the error, fix it, re-commit, re-push
3. If 500 error → `curl -sL https://www.solen.ch/de 2>&1 | tail -20` to inspect
4. If the fix requires reverting the phase → `git revert HEAD --no-edit && git push`
5. Document the failure in the commit message: `"phase N: fix — [what broke and why]"`

> **IMPORTANT:** Do NOT stop and ask the user. Debug it, fix it, push it.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | Affected Files | How to Prevent |
|---|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | `tailwind.config.js` | Pure CSS token additions, no existing code changes |
| Phase 2 | 🟢 SAFE | Language switcher dropdown | `components/ui/LanguageSwitcher.tsx` | Remove duplicate render, keep functionality intact |
| Phase 3 | 🟡 MEDIUM | Header layout on ALL pages | `components/layout/Header.tsx` | Test scrolled + unscrolled state on desktop & mobile. Do NOT touch `BottomNav.tsx`. Verify on `/de`, `/de/coiffeur`, `/de/nails`, `/de/spa` |
| Phase 4 | 🟡 MEDIUM | Login page (already 500) | `components/auth/SignIn.tsx`, `app/[locale]/auth/login/page.tsx` | Read SignIn.tsx fully first. Check all imports exist. Test with `npm run dev` before pushing |
| Phase 5 | 🟢 SAFE | Nothing | `UI_RULES.md`, `CLAUDE.md` | Documentation updates only — no code changes |
| Phase 6 | 🟢 SAFE | Nothing | `UI_RULES.md` | Documentation additions only — typography & color usage guide |
| Phase 7 | 🟡 MEDIUM | Visual changes across 6+ components | See list below | One file at a time. `npm run build` after each sub-commit. Test dark mode toggle. |

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1: Add Complete Color Token Families to Tailwind Config

> **Goal:** Add missing color tokens so all v1.0 families (coral, amber, blue, plum, sage, sand, yellow) have hover/subtle/text variants in Tailwind.

#### [MODIFY] `tailwind.config.js`

**Current state:** The config already has most families (`s-coral`, `s-amber`, `s-blue`, `s-plum`, `s-sage`, `s-sand`, `s-ink`, `s-bg`, `s-dm`). Missing: `s-yellow` family, `s-plum.hover`, some shadows, and border tokens.

**Add to `theme.extend.colors`:**

```js
// Already exists — DO NOT duplicate:
// "s-coral": { DEFAULT: "#E8624A", hover: "#CC4E35", subtle: "#FAECE7", text: "#7A2415" },
// "s-amber": { DEFAULT: "#D4870A", hover: "#B3700A", subtle: "#FEF4E0", text: "#6B4005" },
// "s-blue": { DEFAULT: "#6BA3C8", hover: "#4E8AB5", subtle: "#EAF3FB", text: "#1A4D72" },
// "s-plum": { DEFAULT: "#4A1E3C", subtle: "#F0E8F0", text: "#4A1E3C" },
// "s-sage": { DEFAULT: "#7BA688", subtle: "#EBF5EE", text: "#2E5E3A" },
// "s-sand": { DEFAULT: "#C9A96E", dark: "#D4C9B4", subtle: "#F7F0E3", text: "#6B5430" },

// ADD these missing entries:
"s-yellow": { DEFAULT: "#F2C144", subtle: "#FEF8E0", text: "#7A5C00" },
"s-plum": { DEFAULT: "#4A1E3C", hover: "#3A1630", subtle: "#F0E8F0", text: "#4A1E3C" },
// ^ Replace existing s-plum to add 'hover' key
```

**Add to `theme.extend.boxShadow`:**

```js
// Already exists: "warm-sm", "warm-md", "warm-lg"
// ADD:
"warm-float": "0 24px 72px rgba(26,18,9,0.18)",
```

✅ **DO:**
```js
"s-yellow": { DEFAULT: "#F2C144", subtle: "#FEF8E0", text: "#7A5C00" },
```

❌ **DON'T:**
```js
"yellow": "#F2C144",  // Wrong — must use s- prefix per design system
```

> ⚠️ **BE CAREFUL:**
> - Do NOT remove ANY existing color entries — only ADD new ones or ADD keys to existing entries
> - The `s-plum` entry needs its `hover` key added — check the existing entry first and merge, don't replace
> - The `s-sand` already has a `dark` key — keep that, it's used somewhere
> - Run `npm run build` after this phase to verify no Tailwind purge errors

**Commit:** `git commit -m "phase 1: add s-yellow family + s-plum hover + warm-float shadow to tailwind config"`

**Verify:**
```bash
npm run build  # Must pass
grep -r "s-yellow" tailwind.config.js  # Should return 1 result
```

---

### Phase 2: Fix Language Switcher Duplication

> **Goal:** Fix the `DE DE` bug in the language dropdown.

#### [MODIFY] `components/ui/LanguageSwitcher.tsx`

**Root cause:** Lines 14-19 define `LOCALE_FLAGS` with identical values to `LOCALE_LABELS` (both are `{ de: "DE", en: "EN", fr: "FR", it: "IT" }`). The dropdown (line 73-74) renders both `{LOCALE_FLAGS[key]}` AND `{label}`, producing `DE DE`.

**Changes:**
1. Delete the `LOCALE_FLAGS` constant entirely (lines 14-19)
2. In the dropdown button (lines 63-76), change the render from two spans to one:

**BEFORE:**
```tsx
<span>{LOCALE_FLAGS[key]}</span>
<span>{label}</span>
```

**AFTER:**
```tsx
<span>{label}</span>
```

✅ **DO:**
```tsx
// Single render per language option:
<button key={key} onClick={() => switchLocale(key)} className={...}>
  <span>{label}</span>
</button>
```

❌ **DON'T:**
```tsx
// Don't add flag emojis — they render inconsistently cross-platform:
<span>🇩🇪</span>  // Bad — looks different on Android vs iOS vs Windows
```

> ⚠️ **BE CAREFUL:**
> - The trigger button (line 58) shows globe icon + `{LOCALE_LABELS[locale]}` — this is CORRECT, don't modify it
> - Only modify the DROPDOWN items (inside the `{open && (...)}` block)
> - Don't change the `switchLocale` function or cookie logic — those work correctly
> - Run `npm run build` after

**Commit:** `git commit -m "phase 2: fix language switcher DE DE duplication"`

**Verify:**
```bash
npm run build
grep -n "LOCALE_FLAGS" components/ui/LanguageSwitcher.tsx  # Should return 0 results
```

---

### Phase 3: Fix Header — Scroll Transition, Category Duplication, Compact Profile Button

> **Goal:** Fix 3 header bugs: (A) jarring square→circle scroll, (B) category label duplication, (C) cramped sticky bar with profile outside pill.

#### [MODIFY] `components/layout/Header.tsx`

**3A — Fix scroll transition (lines 85-90):**

Both states should use `rounded-full`. Only vary `max-width`, `padding`, `shadow`, and `backdrop`:

**BEFORE:**
```tsx
scrolled
  ? "mt-4 max-w-3xl glass rounded-full shadow-warm-sm py-2.5 px-5 sm:px-8 dark:bg-s-dm-surface/80 dark:border-white/5"
  : "max-w-5xl bg-s-bg-base/80 backdrop-blur-lg rounded-none py-4 px-6 sm:px-8 dark:bg-s-dm-bg/80"
```

**AFTER:**
```tsx
scrolled
  ? "mt-3 max-w-3xl glass rounded-full shadow-warm-sm py-2 px-4 sm:px-6 dark:bg-s-dm-surface/80 dark:border-white/5"
  : "mt-2 max-w-5xl bg-s-bg-base/60 backdrop-blur-lg rounded-full py-3 px-5 sm:px-8 border border-transparent dark:bg-s-dm-bg/60"
```

Key: both have `rounded-full`. CSS `transition-all duration-500` handles the smooth `max-width` shrink.

**3B — Fix category label duplication (lines 98-104):**

Animate the category text out when scrolled. The icon stays, the text fades/slides away:

**BEFORE:**
```tsx
{CategoryIcon && categoryInfo && (
  <div className="flex items-center gap-1.5 text-s-coral ml-1">
    <span className="text-s-ink/20 dark:text-s-dm-text/20">|</span>
    <CategoryIcon size={18} />
    <span className="text-sm font-medium hidden sm:inline">{categoryInfo.label}</span>
  </div>
)}
```

**AFTER:**
```tsx
{CategoryIcon && categoryInfo && (
  <div className="flex items-center gap-1.5 text-s-coral ml-1">
    <span className="text-s-ink/20 dark:text-s-dm-text/20">|</span>
    <CategoryIcon size={18} />
    <AnimatePresence>
      {!scrolled && (
        <motion.span
          key="category-label"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="text-sm font-medium hidden sm:inline overflow-hidden whitespace-nowrap"
        >
          {categoryInfo.label}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
)}
```

**3C — Profile button always shows only icon, positioned outside the pill:**

The user wants the profile button to ALWAYS be just the user icon (no "Profil" text), and positioned as a floating circle OUTSIDE the main nav pill.

Restructure the header to have:
1. The main nav pill (with logo, links, language, theme, messages)
2. A separate circular profile button floating outside the pill

**BEFORE (profile button inside actions div, lines 142-149):**
```tsx
<Link
  href={profileHref}
  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 min-h-12 rounded-full bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
>
  <User className="w-4 h-4" />
  {t("account")}
</Link>
```

**AFTER (profile button as standalone circle after the nav pill `</div>` closes):**

Move the profile button to be a sibling of the nav pill container, not inside it. Place it after the main `<div className={cn("mx-auto flex...")}> ... </div>`:

```tsx
{/* Profile circle — outside nav pill */}
<Link
  href={profileHref}
  className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-s-coral text-white hover:bg-s-coral-hover hover:scale-105 active:scale-95 transition-all duration-200 shadow-warm-sm ml-3 shrink-0"
  aria-label="Profil"
>
  <User className="w-5 h-5" />
</Link>
```

Wrap both the nav pill div and the profile button in a flex container:
```tsx
<header className="sticky top-0 z-50 w-full px-4">
  <div className="flex items-center justify-center gap-3">
    {/* Main nav pill */}
    <div className={cn("flex items-center justify-between transition-all duration-500 ease-out rounded-full", ...)}>
      {/* logo, nav links, actions (lang, theme, messages, mobile hamburger) */}
    </div>
    {/* Profile circle — outside pill */}
    <Link href={profileHref} className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-s-coral text-white hover:bg-s-coral-hover hover:scale-105 active:scale-95 transition-all duration-200 shadow-warm-sm shrink-0" aria-label="Profil">
      <User className="w-5 h-5" />
    </Link>
  </div>
  {/* Mobile menu stays here */}
</header>
```

**Also: reduce nav link spacing when scrolled (lines 108-126):**

```tsx
<nav className={cn(
  "hidden md:flex items-center",
  scrolled ? "gap-1" : "gap-4"
)} aria-label="Hauptnavigation">
```

And reduce link padding when scrolled:
```tsx
<Link
  className={cn(
    "text-sm font-medium transition-all duration-200 rounded-full",
    scrolled ? "px-2 py-1 text-xs" : "px-3 py-1.5",
    isActive ? "text-s-coral bg-s-coral/8" : "text-s-ink/70 hover:text-s-ink hover:bg-s-ink/5 dark:text-s-dm-text/70 dark:hover:bg-white/5"
  )}
>
```

> ⚠️ **BE CAREFUL:**
> - This phase modifies the global Header visible on EVERY page — test on homepage, coiffeur, nails, spa
> - Do NOT modify the mobile hamburger menu or mobile nav at all
> - Do NOT modify the `BottomNav.tsx` — it's mobile-only
> - The profile Link `href` logic (logged in → `/profile`, not → `/auth/login`) must be preserved
> - `motion` and `AnimatePresence` are already imported at line 7 — do NOT add duplicate imports
> - The `cn` utility is already imported at line 12
> - Test both scrolled and unscrolled states — scroll 51+ px to trigger scrolled state

**Commit:** `git commit -m "phase 3: fix header scroll transition, category duplication, profile outside pill"`

**Verify:**
```bash
npm run build
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de  # Must be 200
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/coiffeur  # Must be 200
```

---

### Phase 4: Fix Login Page 500 Error

> **Goal:** Fix the `/auth/login` page returning 500.

#### [MODIFY] `components/auth/SignIn.tsx`
#### [MODIFY] `app/[locale]/auth/login/page.tsx` (if needed)

The login page imports `SignIn` from `@/components/auth/SignIn`. The page itself (`app/[locale]/auth/login/page.tsx`) is a server component that renders a login card with blobs. The `SignIn` component is client-side.

**Steps (in order):**
1. Read `components/auth/SignIn.tsx` fully — check for missing imports, non-existent API calls, or server-only APIs used in a client component
2. Run `npm run build` — if it passes, the issue is runtime-only. Check the build output for warnings.
3. Start dev server `npm run dev &`, wait 5s, then `curl -sL http://localhost:3000/de/auth/login -o /dev/null -w "%{http_code}"` — if 500, check terminal output for the error stack trace.
4. Fix the root cause. Common fixes:
   - Add `"use client"` if missing
   - Replace any non-existent imports with working alternatives
   - If `cookies()` from `next/headers` is used in a `"use client"` component → move it to a server action or API route
5. If fix is complex (e.g., requires rebuilding the entire auth flow) → document in `_tasks/INCOMPLETE_FEATURES.md` with:
   - **Feature:** Login page
   - **File/Line:** exact file and line where it breaks
   - **Blocker:** reason it can't be fixed in this phase
   - **Next Steps:** what the next agent needs to do
6. Kill dev server: `kill %1 2>/dev/null`

✅ **DO:**
```tsx
// Ensure SignIn.tsx has "use client" at the top:
"use client";

// Ensure all imports reference files that exist:
import { createBrowserSupabaseClient } from "@/lib/supabase"; // Verify this function exists in lib/supabase.ts
```

❌ **DON'T:**
```tsx
// Don't add try-catch that silently swallows errors:
try { return <SignIn /> } catch { return null; }  // Wrong — hides the real error

// Don't use cookies() in a "use client" component:
"use client";
import { cookies } from "next/headers"; // WRONG — server-only API in client component
```

> ⚠️ **BE CAREFUL:**
> - The login page MUST remain functional for all auth flows (email, Google OAuth)
> - Do NOT modify `lib/supabase.ts` — it's shared across the entire app
> - Do NOT modify the Supabase auth configuration or redirect URLs
> - Do NOT modify `middleware.ts` — it was recently fixed and is working
> - If the SignIn component uses `cookies()` from `next/headers`, it must be in a server component or route handler, not a client component
> - Do NOT change the login page URL structure (`/[locale]/auth/login`)
> - Test locally with `npm run dev &`, then `curl -sL http://localhost:3000/de/auth/login -o /dev/null -w "%{http_code}"` BEFORE pushing — must return 200
> - After pushing, wait 90s then curl the login page to verify 200
> - Kill dev server after testing: `kill %1 2>/dev/null`

**Commit:** `git commit -m "phase 4: fix login page 500 error"`

**Verify (automated):**
```bash
npm run build                                                                    # Must pass
npm run dev &                                                                    # Start dev server in background
sleep 5                                                                          # Wait for boot
curl -sL -o /dev/null -w "%{http_code}" http://localhost:3000/de/auth/login      # Must be 200
kill %1 2>/dev/null                                                              # Kill dev server
# After push + deploy:
curl -sL -o /dev/null -w "%{http_code}" https://www.solen.ch/de/auth/login       # Must be 200 after deploy
curl -sL -o /dev/null -w "%{http_code}" https://www.solen.ch/de                  # Must still be 200
```

---

### Phase 5: Update Documentation — UI_RULES.md + CLAUDE.md (R8 Final Phase)

> **Goal:** Fix the dark mode documentation conflict + add new tokens documentation. This is the final phase and MUST update CLAUDE.md per rule R8.

#### [MODIFY] `UI_RULES.md`

**Fix 1 — Dark mode colors at line 9:**

**BEFORE:**
```markdown
Dark background: `#0F0F1A` (`dm-bg`), Dark surface: `#1A1A2E` (`dm-surface`), Dark text: `#E2E8F0` (`dm-text`)
```

**AFTER:**
```markdown
Dark background: `#151009` (`s-dm-bg`), Dark surface: `#1E1710` (`s-dm-surface`), Dark text: `#F5EEE4` (`s-dm-text`)
```

These warm values match what's already in `tailwind.config.js` (line 27). The old cool values (`#0F0F1A`, `#1A1A2E`, `#E2E8F0`) were never deployed — this is a docs-only fix.

**Fix 2 — Update Section 9 (Dark Mode Tokens table) to match:**

| Token | Light | Dark |
|---|---|---|
| Background | `bg-s-bg-base` (#FAF6EF) | `dark:bg-s-dm-bg` (#151009) |
| Surface | `bg-s-bg-raised` (#FFFFFF) | `dark:bg-s-dm-surface` (#1E1710) |
| Raised | — | `dark:bg-s-dm-raised` (#26201A) |
| Text | `text-s-ink` (#1A1209) | `dark:text-s-dm-text` (#F5EEE4) |
| Secondary text | `text-s-ink/70` | `dark:text-s-dm-text-secondary` (#C8BAA8) |

**Fix 3 — Add new color families to UI_RULES.md Section 2 (after existing Primary Colors):**

```markdown
- **Extended Families (v1.0):**
  - Yellow: `#F2C144` (class: `s-yellow`) — tags, badges, "Top Rated"
    - Variants: `s-yellow-subtle` (#FEF8E0), `s-yellow-text` (#7A5C00)
  - Sage: `#7BA688` (class: `s-sage`) — spa/wellness category
    - Variants: `s-sage-subtle` (#EBF5EE), `s-sage-text` (#2E5E3A)
  - Sand: `#C9A96E` (class: `s-sand`) — supporting warm surfaces
    - Variants: `s-sand-subtle` (#F7F0E3), `s-sand-text` (#6B5430)
  - Plum: `#4A1E3C` (class: `s-plum`) — depth, dark blocks
    - Variants: `s-plum-hover` (#3A1630), `s-plum-subtle` (#F0E8F0), `s-plum-text` (#4A1E3C)
```

✅ **DO:**
```markdown
  - Yellow: `#F2C144` (class: `s-yellow`) — tags, badges, "Top Rated"
```

❌ **DON'T:**
```markdown
  - Yellow: `#F2C144` — tags  <!-- Missing class name, too vague -->
```

#### [MODIFY] `CLAUDE.md`

**R8 requirement — update these SPECIFIC sections:**

1. **Section 3.3 (Design System)** — line 79: Add new color families after the existing colors list:
   ```markdown
   - **Extended Colors**: Yellow `#F2C144` (`s-yellow`), Plum `#4A1E3C` (`s-plum`), Sage `#7BA688` (`s-sage`), Sand `#C9A96E` (`s-sand`). Each has `DEFAULT`, `hover` (where applicable), `subtle`, `text` variants.
   ```

2. **Section 3.3 (Design System)** — confirm the dark mode note matches tailwind.config.js warm values. If not present, add:
   ```markdown
   - **Dark mode**: Warm dark base `#151009` (`s-dm-bg`), surface `#1E1710` (`s-dm-surface`), text `#F5EEE4` (`s-dm-text`). NEVER use cool grey or pure black.
   ```

3. **Do NOT modify** Sections 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 of CLAUDE.md.

> ⚠️ **BE CAREFUL:**
> - Do NOT delete any existing content from `UI_RULES.md` or `CLAUDE.md`
> - Only update the specific values that are wrong (dark mode hex codes in UI_RULES.md line 9)
> - Only ADD new entries (yellow, sage, sand, plum documentation)
> - Keep the existing Section 16 (BANNED tokens) in UI_RULES.md unchanged
> - After editing CLAUDE.md, verify no existing rules were accidentally deleted by checking line count
> - Do NOT add any new rules or sections to CLAUDE.md — only update existing Section 3.3

**Commit:** `git commit -m "phase 5: fix dark mode docs conflict in UI_RULES.md + add v1.0 color families to CLAUDE.md"`

**Verify:**
```bash
# Verify dark mode values are consistent across docs + code:
grep -n "0F0F1A\|1A1A2E\|E2E8F0" UI_RULES.md CLAUDE.md          # Should return 0 results (old values removed)
grep -n "151009\|1E1710\|F5EEE4" UI_RULES.md tailwind.config.js  # Should return matching values in both files

# Verify CLAUDE.md wasn't accidentally truncated:
wc -l CLAUDE.md  # Should be ~795 lines (±5 from additions)

# Final build + deploy check:
npm run build
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de  # Must be 200
```

---

### Phase 6: Typography & Color Usage Guide

> **Goal:** Add a practical "how to use" cheat sheet to `UI_RULES.md` so Claude Code knows WHEN and WHERE to use each font, color, and variant — based on the Solen.ch Design System v1.0 concept.

#### [MODIFY] `UI_RULES.md`

Add a **new Section 18: Typography & Color Usage Guide** after the existing Section 17 (Currency Formatting). This section tells Claude Code exactly which design token to pick for any given UI situation.

**Add this content:**

```markdown
## 18. Typography & Color Usage Guide (Design System v1.0)

### Font Hierarchy — Which Font Where

| Context | Font | Class | Weight | Size | Extra Rules |
|---|---|---|---|---|---|
| Homepage hero heading | Bebas Neue | `font-display` | — | `clamp(64px, 9vw, 140px)` | Always uppercase. Line-height 0.88. Stack in 1-4 word lines. |
| Section numbers (01, 02) | Bebas Neue | `font-display` | — | 64px (`--s-text-4xl`) | Always uppercase. Letter-spacing 0.04em. |
| Category page hero | Bebas Neue | `font-display` | — | 96px (`--s-text-5xl`) | Only for hero text. Drop to Syne at ≤48px. |
| Page-level headings | Syne | `font-heading` | 800 | 48px (`--s-text-3xl`) | Letter-spacing -0.02em. Never italic. |
| Section titles | Syne | `font-heading` | 800 | 32px (`--s-text-2xl`) | |
| Card headings, modal titles | Syne | `font-heading` | 700 | 24px (`--s-text-xl`) | |
| Nav links | DM Sans | `font-body` | 400 | 13px (`--s-text-sm`) | |
| Lead text, intro paragraphs | DM Sans | `font-body` | 500 | 18px (`--s-text-lg`) | |
| All body text | DM Sans | `font-body` | 400 | 16px (`--s-text-base`) | Line-height 1.75-1.85. |
| Hero descriptions, pull quotes | DM Sans | `font-body` | 300 italic | 16px | Use `italic` + weight 300 for contrast. |
| Captions, metadata, tags | DM Sans | `font-body` | 400 | 13px (`--s-text-sm`) | |
| Labels, eyebrows, badges | Syne or DM Sans | `font-heading` or `font-body` | 700 or 600 | 11px (`--s-text-xs`) | Uppercase. Letter-spacing 0.12em. |
| Prices, ratings, counters | DM Sans | `data-text` | 500 | varies | Always `tabular-nums`. |
| Dashboard headings | Syne | `font-heading` | 700 | varies | Never use Bebas Neue in dashboard. |

**Rules:**
- Bebas Neue NEVER appears below 40px
- Bebas Neue is ALWAYS uppercase (add `uppercase` class)
- Syne is NEVER italic
- DM Sans italic is ONLY for hero descriptions and pull quotes
- Dashboard/admin pages: only Syne 700 for headings, DM Sans for everything else. No Bebas Neue.

### Color Usage — Which Color Where

| UI Element | Light Mode | Dark Mode | Notes |
|---|---|---|---|
| Primary CTA buttons | `bg-s-coral` + `text-white` | Same | Hover: `bg-s-coral-hover` |
| Secondary CTA buttons | `bg-s-amber` + `text-white` | Same | Hover: `bg-s-amber-hover` |
| Accent elements, map pins | `text-s-blue` or `bg-s-blue` | Same | Hover: `bg-s-blue-hover` |
| Spa/wellness category tags | `bg-s-sage-subtle` + `text-s-sage-text` | `bg-s-sage-subtle` + `text-s-sage-text` | |
| "Top Rated" / "Neu" badges | `bg-s-yellow-subtle` + `text-s-yellow-text` | Same | |
| Category tags (general) | `bg-s-coral-subtle` + `text-s-coral-text` | Same | Use `-text` variant for WCAG AA |
| Dark depth blocks, dividers | `bg-s-plum` + `text-white` | `bg-s-plum-subtle` + `text-s-plum-text` | Plum inverts in dark mode |
| Supporting warm surfaces | `bg-s-sand-subtle` | `bg-s-sand-subtle` | Warm fill for secondary cards |
| Headings (large) | `text-s-ink` | `dark:text-s-dm-text` | |
| Body text | `text-s-ink-secondary` or `text-s-ink` | `dark:text-s-dm-text` | |
| Captions, metadata | `text-s-ink-tertiary` | `dark:text-s-dm-text/50` | |
| Disabled states | `text-s-ink-disabled` | `dark:text-s-dm-text/30` | + `opacity-40` + `pointer-events-none` |
| Success states | `bg-s-success-bg` + `text-s-success` | Same tokens auto-adjust | |
| Error states | `bg-s-error-bg` + `text-s-error` | Same tokens auto-adjust | |
| Warning states | `bg-s-warning-bg` + `text-s-warning` | Same tokens auto-adjust | |

**WCAG Color Rules:**
- `text-s-coral` (#E8624A) on cream FAILS AA for body text (<18px). Use `text-s-coral-text` (#7A2415) instead.
- `text-s-coral` is OK for: icons, badges, headings ≥18px bold, buttons (white bg).
- Every `*-subtle` background has a matching `*-text` color that passes AA. Always pair them.

### Shadow Usage

| Context | Token |
|---|---|
| Cards at rest | `shadow-card` |
| Cards on hover | `shadow-card-hover` |
| Buttons, small elevations | `shadow-warm-sm` |
| Active dropdowns, popovers | `shadow-warm-md` |
| Modals, sheets, floating panels | `shadow-warm-lg` |
| Hero floating elements | `shadow-warm-float` |
| Glassmorphism panels | `shadow-glass` |
| CTA pulse effect | `shadow-coral-glow` |

### Zone Guidelines (Design Thinking)

These are NOT enforced in code but guide design decisions:

| Zone | Pages | Typography | Colors | Animation | Shapes |
|---|---|---|---|---|---|
| 1 — Maximalist | Homepage, discovery, category pages | All three fonts | Full palette, full saturation | Hover effects active | `rounded-card`, `rounded-pill` |
| 2 — Soft | Salon profiles, search results, reviews | Syne + DM Sans | Full palette | Hover effects only | `rounded-card` |
| 3 — Functional | Booking, payment, auth, login | Syne + DM Sans | Coral CTA + cream base only | ZERO animation | `rounded-button`, `rounded-card` |
| 4 — Structured | Dashboard, admin, calendar, settings | Syne 700 + DM Sans | Palette on borders/icons only | ZERO animation | `rounded-card` max |
```

✅ **DO:**
```tsx
// Salon card tag — use subtle bg + text variant for WCAG:
<span className="bg-s-sage-subtle text-s-sage-text text-xs font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-pill">
  SPA
</span>

// Hero heading — Bebas Neue, large, uppercase:
<h1 className="font-display text-[clamp(64px,9vw,140px)] leading-[0.88] uppercase text-s-ink">
  SOLEN
</h1>

// Body description — DM Sans italic light:
<p className="font-body italic font-light text-base text-s-ink-secondary leading-relaxed">
  Beauty is personal. Finding your perfect salon shouldn't feel complicated.
</p>
```

❌ **DON'T:**
```tsx
// Wrong — Bebas Neue below 40px:
<span className="font-display text-sm">Small label</span>

// Wrong — coral as body text (fails WCAG AA):
<p className="text-s-coral text-sm">This small text fails accessibility</p>

// Wrong — Syne italic (never italic per design system):
<h2 className="font-heading italic">Never do this</h2>
```

> ⚠️ **BE CAREFUL:**
> - This is an APPEND to `UI_RULES.md` — add as new Section 18 after the existing Section 17
> - Do NOT modify any existing sections (1-17)
> - Verify the file still has the "Rule Enforcement" line at the end
> - The zone guidelines are DOCUMENTATION ONLY — do not create zone-aware CSS classes or components

**Commit:** `git commit -m "phase 6: add typography and color usage guide to UI_RULES.md"`

**Verify:**
```bash
npm run build  # Must pass (no code changes, but verify nothing broke)
grep -n "Section 18" UI_RULES.md  # Should return the new section header
grep -c "Rule Enforcement" UI_RULES.md  # Should return 1 (still at the end)
```

---

### Phase 7: Token Consistency Cleanup

> **Goal:** Fix 7 inconsistency patterns found during codebase scan. These are the same TYPE of bug as the `LOCALE_FLAGS` duplication and the `DE DE` issue — things that look wrong, use banned tokens, or lack dark mode pairing.

#### 7A — Fix `bg-white` Missing Dark Mode Pairs

#### [MODIFY] `components/BookingCalendar.tsx`
#### [MODIFY] `components/ui/GlassCard.tsx`
#### [MODIFY] `components/ui/date-picker.tsx`

Every `bg-white` in a component MUST have a `dark:bg-s-dm-surface` or `dark:bg-s-dm-raised` pair. Found 10+ instances missing this.

**Files to fix (exact locations from grep scan):**
- `components/BookingCalendar.tsx` lines 258, 265, 378, 433 — add `dark:bg-s-dm-raised`
- `components/ui/GlassCard.tsx` lines 21, 24 — add `dark:bg-s-dm-surface/80` and `dark:bg-s-dm-surface/90`
- `components/ui/date-picker.tsx` lines 53, 67 — add `dark:bg-s-dm-raised`

✅ **DO:**
```tsx
<div className="bg-white dark:bg-s-dm-raised rounded-card">
```

❌ **DON'T:**
```tsx
<div className="bg-white rounded-card">  // Missing dark: pair
```

> ⚠️ **BE CAREFUL:**
> - Do NOT change any layout, padding, or border classes — only add the `dark:` pair
> - `CookieBanner.tsx` line 143 uses `bg-white` inside a toggle switch — this is intentional (toggle knob), leave it
> - `ImageUploader.tsx` line 129 uses `bg-white/90` for an overlay button — change to `dark:bg-s-dm-surface/90`
> - Test dark mode toggle after changes

---

#### 7B — Fix Old `teal` Token in Spinner

#### [MODIFY] `components/ui/Spinner.tsx`

**Line 16** uses `border-t-teal` — this is a BANNED old branding token.

**BEFORE:**
```tsx
const color = invert ? "border-white/30 border-t-white" : "border-s-coral/30 border-t-teal";
```

**AFTER:**
```tsx
const color = invert ? "border-white/30 border-t-white" : "border-s-coral/30 border-t-s-coral";
```

> ⚠️ **BE CAREFUL:** Only change `border-t-teal` to `border-t-s-coral`. Don't touch the invert branch.

---

#### 7C — Fix Mislabeled `teal` in ClientTags

#### [MODIFY] `components/chat/ClientTags.tsx`

**Line 22:** The color key is `teal` but it renders coral styles. **Line 160:** The dropdown shows "Coral" for value `teal`.

**BEFORE:**
```tsx
teal: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",
// ...
<option value="teal">Coral</option>
```

**AFTER — Option A (rename key):**
```tsx
coral: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",
// ...
<option value="coral">Coral</option>
```

> ⚠️ **BE CAREFUL:** If renaming the key from `teal` to `coral`, grep for all references to the `teal` tag value. It may be stored in the database `client_tags` table with `color = 'teal'`. If so, you MUST also add a migration OR keep backward compatibility:
```tsx
// Backward compat: support both old 'teal' and new 'coral' keys
teal: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",  // legacy DB values
coral: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20", // new correct name
```

---

#### 7D — Fix Hardcoded Hex Colors

#### [MODIFY] `components/dashboard/SolenScoreCard.tsx`

**Line 22** uses `"#D4AF37"` (hardcoded gold), `bg-amber-50`, `border-amber-200` — banned generic Tailwind tokens.

**BEFORE:**
```tsx
gold: { label: "Top Salon", color: "#D4AF37", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-700", Icon: Star },
```

**AFTER:**
```tsx
gold: { label: "Top Salon", color: "#D4870A", bg: "bg-s-amber-subtle dark:bg-s-amber-subtle", border: "border-s-amber/20 dark:border-s-amber/30", Icon: Star },
```

Use `#D4870A` (our `s-amber` token) instead of generic gold `#D4AF37`.

> ⚠️ **BE CAREFUL:**
> - `BookingSuccess.tsx` line 57 and `StampCard.tsx` lines 19-21 also have hardcoded hex arrays for confetti/decoration colors — these are OK to keep since they're purely decorative animations, not UI tokens
> - `SignIn.tsx` lines 151-154 have Google logo SVG hex colors — these are MANDATED by Google brand guidelines, do NOT change them
> - Only fix `SolenScoreCard.tsx` in this phase

---

#### 7E — Fix QuartierTile Emoji Usage

#### [MODIFY] `components/QuartierTile.tsx`

**Lines 15-24** use emoji for quartier icons (`🏛️`, `🌉`, `🌿`, etc.).

`UI_RULES.md` Section 5 says: "Use `lucide-react` exclusively. No raw emojis for UI elements."

Replace emoji with lucide-react icons:
```tsx
import { Building2, Drama, TreePine, Anchor, Trees, Church, Compass, Landmark, MapPin } from "lucide-react";

const quartierIcon: Record<string, typeof Building2> = {
  grossbasel: Landmark,
  kleinbasel: Drama,
  gundeli: TreePine,
  st_johann: Anchor,
  iselin: Trees,
  // ... map all quartiers to icons
};
```

Then render as:
```tsx
const Icon = quartierIcon[slug] ?? MapPin;
<Icon className="w-6 h-6 text-s-coral" />
```

> ⚠️ **BE CAREFUL:**
> - Check that all quartier slugs have a mapping — grep `components/` for all quartier references
> - Keep the fallback (`MapPin`) for unknown quartiers
> - Do NOT change the `SalonCard.tsx` quartierLabels — those are text labels, not emoji

**Commit (all 7A-7E together):** `git commit -m "phase 7: fix token consistency — dark mode pairs, banned teal, hardcoded hex, emoji"`

**Verify:**
```bash
npm run build  # Must pass
# Verify no banned tokens remain:
grep -rn "border-t-teal" components/ --include="*.tsx"  # Should return 0
grep -rn "amber-50\|amber-900\|amber-200\|amber-700" components/ --include="*.tsx"  # Should return 0
# Verify dark mode pairs added:
grep -rn "bg-white" components/BookingCalendar.tsx --include="*.tsx" | grep -v "dark:"  # Should return 0
```

---

## 🤖 Phase 8: Automated Final Verification (replaces Manual A)

> **Goal:** Automatically verify the entire site after all 7 phases are deployed. No human interaction needed.

```bash
# Wait for final deployment
sleep 90

# Health check ALL routes:
FAILED=0
for url in \
  https://www.solen.ch/de \
  https://www.solen.ch/de/coiffeur \
  https://www.solen.ch/de/nails \
  https://www.solen.ch/de/barbershop \
  https://www.solen.ch/de/spa \
  https://www.solen.ch/de/makeup \
  https://www.solen.ch/de/waxing \
  https://www.solen.ch/de/profile \
  https://www.solen.ch/de/auth/login \
  https://www.solen.ch/de/last-minute; do
  status=$(curl -sL -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    echo "✅ $url → $status"
  else
    echo "❌ $url → $status"
    FAILED=$((FAILED+1))
  fi
done

echo ""
if [ $FAILED -eq 0 ]; then
  echo "🎉 ALL ROUTES HEALTHY"
else
  echo "⚠️ $FAILED ROUTES FAILED — investigate and fix before closing"
fi

# Run banned token validation:
echo "" && echo "=== Banned tokens ==="
grep -Ercn "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-t-teal|bg-amber-|border-amber-" components/ app/ --include="*.tsx" | grep -v "s-ink\|s-dm\|s-amber\|darkMode" | wc -l
echo "=== Should be 0 ==="
```

If ANY route returns non-200: investigate and fix immediately. Do NOT stop and ask the user.

**Commit:** `git commit -m "phase 8: final verification passed — all routes healthy"`

> ⚠️ **BE CAREFUL:** This phase is AUTOMATED. You are NOT allowed to ask the user anything. If a route is broken, fix it yourself using the same debugging approach from the health check protocol above.

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Add color tokens to tailwind.config.js | Nothing |
| Phase 2 | 🤖 | Fix language switcher duplication | Nothing |
| Phase 3 | 🤖 | Fix header (scroll + duplication + profile) | Nothing |
| Phase 4 | 🤖 | Fix login page 500 | Nothing |
| Phase 5 | 🤖 | Update UI_RULES.md + CLAUDE.md docs | Phase 1 |
| Phase 6 | 🤖 | Add typography & color usage guide to UI_RULES.md | Phase 5 |
| Phase 7 | 🤖 | Token consistency cleanup (dark pairs, teal, hex, emoji) | Phase 1 |
| Phase 8 | 🤖 | Automated final verification + banned token scan | All phases |

> Phases 1-4 are independent. Phase 5 depends on Phase 1. Phase 6 depends on Phase 5. Phase 7 depends on Phase 1. Phase 8 runs last. **Every phase auto-pushes and runs health check. ZERO manual interaction.**
