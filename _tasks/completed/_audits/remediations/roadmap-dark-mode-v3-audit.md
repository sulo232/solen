# 🌙 Dark Mode V3 System Audit & Fix Roadmap

> **Saved to:** `_roadmaps/roadmap-dark-mode-v3-audit.md`
> **Design authority:** `_rules/UI_RULES.md` §1, §9, §15, §16, §20, §21, §23
> **Roadmap standard:** `_rules/ROADMAP_RULES.md` R1–R10

---

## Accuracy Assessment

| Issue | WCAG/Design Requirement | Accuracy Level | Notes |
|---|---|---|---|
| Hardcoded `#fff`/`#000` in components | §20 bans `dark:text-white`/`dark:bg-black` | **HIGH** — must fix before ship | Found in SearchAutocomplete, ImageUploader, HeroVisualCard |
| Partner section dark-navy flash | Intentional `bg-s-plum` but no `dark:` invert rule | **HIGH** — contradicts §18 Color Table | `bg-s-plum` inverts to lavender `#C090B4` in dark mode per §9 |
| Text contrast WCAG AA | `--ink3` (#8A7A66) same in both modes per §9 — may fail on dark surfaces | **HIGH** — legal/a11y requirement | Must audit all `text-s-ink/50` pairs against dark bg |
| Cookie banner dark mode | CookieBanner already has `dark:bg-s-dm-surface` | **MEDIUM** — partially done | Toggle knob `bg-white` without dark pair is the only gap |
| SearchAutocomplete missing dark: | Input + dropdown use `bg-white/80`, `bg-white/95` with no dark pair | **HIGH** | User-facing, always visible |
| Transition on theme toggle | §1 requires `transition: background-color 300ms ease, color 300ms ease` on `html` | **MEDIUM** — check `globals.css` | Only these two properties, NOT `all` |

---

## ⚠️ Contradictions with `UI_RULES.md` (IMPORTANT — read before executing)

### Potential Conflict 1 — Partner Section `bg-s-plum`
**UI_RULES.md §18 (Color Usage table):**
> Dark depth blocks, dividers: Light = `bg-s-plum + text-white`, Dark = `bg-s-plum-subtle + text-s-plum-text`

This means a `bg-s-plum` section on the homepage/partner page **must** switch to `bg-s-plum-subtle + text-s-plum-text` in dark mode — it should NOT stay dark navy. If it's randomly appearing dark navy without the proper token, it's using an unlisted value or triggering system dark-mode CSS without the `[data-theme="dark"]` guard. This is a bug caused by the author mixing Tailwind `dark:` prefixes (which respond to system OS preference) while the app uses `[data-theme="dark"]` on `<html>`. **These two systems fight each other.**

> **Resolution:** Every `dark:` prefix in the codebase must match the `[data-theme="dark"]` data-attribute system — NOT the OS media query Tailwind default. This is already the configured approach (`darkMode: 'class'` in `tailwind.config.js`) but components using raw `dark:*` Tailwind classes that haven't been audited may conflict.

### Potential Conflict 2 — `dark:text-white` Usage Rule
**UI_RULES.md §20 Rule 20:**
> `dark:text-white` (on non-buttons) → BANNED. Use `dark:text-s-dm-text` (warm off-white)

If any component uses `text-white` on non-button elements in dark mode, it violates this. Use `dark:text-s-dm-text` (#F5EEE4) which is the warm, on-brand off-white.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | Prevention |
|---|---|---|---|
| Phase 1 — Token Audit + globals.css | 🟢 SAFE | Nothing | Read-only audit + CSS changes only |
| Phase 2 — SearchAutocomplete dark pairs | 🟡 MEDIUM | Search UI layout | Add `dark:*` classes only, don't touch logic |
| Phase 3 — Partner/Plum section | 🟡 MEDIUM | Partner page visual | Use `dark:bg-s-plum-subtle dark:text-s-plum-text` per §18 |
| Phase 4 — Cookie banner & toggle knob | 🟢 SAFE | Cookie flow | Knob stays `bg-white` on coral background (acceptable per §21) |
| Phase 5 — WCAG AA contrast audit | 🟡 MEDIUM | Text readability | Run Lighthouse after, fix any contrast failures |

---

## Phase 0 — Pre-Flight Scan (Manual, no code changes)
**Goal:** Identify every component with hardcoded whites/blacks before touching code.

```bash
# Find hardcoded hex colors in components (must be 0 result for dark mode tokens):
grep -Ern "#fff|#FFF|#ffffff|#FFFFFF|#000|#000000" components/ app/ --include="*.tsx" | grep -v "//\|import\|svg\|logo\|\.ico" | head -30

# Find dark:text-white violations (non-button):
grep -Ern "dark:text-white" components/ app/ --include="*.tsx" | grep -v "btn-coral\|rounded-pill\|// " | head -20

# Find components missing dark: pairs on bg-white:
grep -Ern "bg-white[^/]" components/ app/ --include="*.tsx" | grep -v "dark:\|//\|bg-white/\|toggle\|knob\|svg" | head -20

# Find components missing dark: pairs on text-s-ink:
grep -Ern "text-s-ink[^/]" components/ app/ --include="*.tsx" | grep -v "dark:\|//\|text-s-ink-" | head -20
```

---

## 🤖 CLAUDE CODE PHASES

---

## Phase 1 — `globals.css` Theme Transition Check
**Goal:** Ensure the HTML-level theme transition is exactly what §1 specifies.

### [MODIFY] `app/globals.css`

✅ **DO:**
```css
html {
  transition: background-color 300ms ease, color 300ms ease;
}

[data-theme="dark"] {
  color-scheme: dark;
}
```

❌ **DON'T:**
```css
html {
  transition: all 300ms ease; /* ← transitions layout, shadows, too jarring */
}
```

> ⚠️ **BE CAREFUL:** Only `background-color` and `color` should transition. No other CSS properties. Check that `ThemeScript.tsx` sets `[data-theme="dark"]` on `<html>` before first render to prevent FOUC.

**Verification:**
```bash
grep -n "transition" app/globals.css | grep "html"
# Must show: transition: background-color 300ms ease, color 300ms ease;
```

**Commit:** `git commit -m "phase 1: enforce §1 html transition rule in globals.css"`

---

## Phase 2 — SearchAutocomplete Dark Mode Pairs
**Affected file:** `[MODIFY] components/ui/SearchAutocomplete.tsx`

The input wrapper uses `bg-white/80 backdrop-blur-sm` with **no dark mode pair**. The dropdown uses `bg-white/95` with **no dark mode pair**.

✅ **DO:**
```tsx
// Input field
className="... bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-sm border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 ..."

// Dropdown results container
className="... bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-lg border border-s-ink/5 dark:border-white/10 ..."
```

❌ **DON'T:**
```tsx
// Missing dark: pairs — stays white in dark mode
className="... bg-white/80 backdrop-blur-sm border border-s-ink/10 ..."
```

> ⚠️ **BE CAREFUL:** The SearchAutocomplete renders on the homepage hero (Zone 1). Do NOT remove the glassmorphism `backdrop-blur-sm` — it's valid in Zone 1+2 per §13. Only ADD dark: pairs.

**Verification:**
```bash
grep -n "bg-white" components/ui/SearchAutocomplete.tsx
# Every bg-white line must have a dark:bg-s-dm-* counterpart on the same className
```

**Commit:** `git commit -m "phase 2: add dark mode pairs to SearchAutocomplete"`

---

## Phase 3 — Partner Section / `bg-s-plum` Inversion Fix
**Goal:** The section (likely in `components/HomePage.tsx` or a partner sub-site component) uses `bg-s-plum` which, per §9 and §18, must invert to `bg-s-plum-subtle + text-s-plum-text` in dark mode.

**Affected file:** Search first:
```bash
grep -rn "bg-s-plum\|bg-plum\|plum\|navy\|dark-navy" components/ app/ --include="*.tsx" | grep -v "//\|s-plum-subtle\|s-plum-text" | head -20
```

### Pattern to Apply

✅ **DO:**
```tsx
// Plum section correctly inverts in dark mode
<section className="bg-s-plum dark:bg-s-plum-subtle text-white dark:text-s-plum-text">
  {/* Content */}
</section>
```

❌ **DON'T:**
```tsx
// Using raw dark: that doesn't match [data-theme="dark"] system
<section className="bg-s-plum dark:bg-[#0A0A1A]">  {/* ← unlisted hex, wrong system */}
```

> ⚠️ **BE CAREFUL:** If the component already has a `dark:` variant that uses a non-system color (e.g., `dark:bg-blue-900`), it means Tailwind's OS-level `dark:` is triggering instead of the `[data-theme="dark"]` class. Since `tailwind.config.js` uses `darkMode: 'class'`, ALL `dark:` prefixes respond to `class` on `<html>` — this is correct. The bug is using a wrong color token. Fix by using `dark:bg-s-plum-subtle`.

**Commit:** `git commit -m "phase 3: fix partner section plum inversion for dark mode per §9"` 

---

## Phase 4 — Cookie Banner & Toggle Knob
**Good news:** `CookieBanner.tsx` is **largely compliant** (uses `dark:bg-s-dm-surface`, `dark:text-s-dm-text`, `dark:border-white/10`). 

**Only gap:** Toggle knob `<div className="w-4 h-4 rounded-full bg-white" />` on the "Always On" (disabled) toggle. The knob is on a `bg-s-coral` track, so `bg-white` is intentional (UI_RULES §21 exception: "Every `bg-white` has a `dark:bg-s-dm-*` pair unless on a coral button or toggle knob"). **This is already correct — no change needed here.**

> ✅ **No changes needed to CookieBanner.tsx.** It is already dark mode compliant.

---

## Phase 5 — WCAG AA Contrast Audit
**Goal:** Verify text contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text ≥18px or 14px bold) in dark mode.

**Known concern from §9:**
> `--ink3` (#8A7A66) stays the same in BOTH light and dark — but in dark mode it sits on `#151009` background. Check passes: #8A7A66 on #151009 = ~4.8:1 ✅

**Steps:**
1. Run Chrome Lighthouse in dark mode (toggle `[data-theme="dark"]` on `<html>` in DevTools)
2. Accessibility score must be ≥ 90
3. Any contrast failure → switch the failing text to the next darker token from §15:
   - If `text-s-ink/50` fails → use `text-s-ink/70` on that element in dark mode

```bash
# After deploying, check contrast programmatically:
npx lighthouse https://www.solen.ch/de/ --only-categories=accessibility --output=json | grep -A2 "color-contrast"
```

> ⚠️ **BE CAREFUL:** Do NOT globally change `--ink3` values — the token table (§9) documents it as intentionally the same. Fix only specific instances that fail Lighthouse.

**Commit:** `git commit -m "phase 5: fix WCAG AA contrast failures identified by Lighthouse audit"`

---

## 🧑 MANUAL PHASES

### Manual A — Browser Dark Mode Smoke Test
After all phases, manually toggle dark mode via the ThemeToggle in the Header and visually verify:

| Component | Expected Dark Mode State | ✅ / ❌ |
|---|---|---|
| Homepage hero | Warm dark bg `#151009`, text warm off-white | |
| Partner/Plum section | Soft lavender bg (`#F0E8F0`), plum text | |
| Search bar | Dark surface (`#1E1710`), light text | |
| Cookie banner | Dark surface, no white flash | |
| Navbar | Dark glass `rgba(21,16,9,.88)` | |
| Dashboard layout | `#1E1710` surface, no glass | |
| Category tiles | Colors brighten (coral → `#F07560`) | |

### Manual B — Transition Quality Check
Toggle theme 3× rapidly. Verify:
- Only `background-color` and `color` animate (nothing else jumps)
- No layout shift during toggle
- No white flash before dark mode applies (ThemeScript runs before paint)

---

## Dependency Ordering (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 0 | 🤖 | Pre-flight grep scan | Nothing |
| Phase 1 | 🤖 | globals.css transition fix | Nothing |
| Phase 2 | 🤖 | SearchAutocomplete dark pairs | Phase 0 (know which lines) |
| Phase 3 | 🤖 | Partner/plum inversion | Phase 0 (find exact file) |
| Phase 4 | — | CookieBanner — no changes needed | — |
| Phase 5 | 🤖 | WCAG contrast fixes | Phases 1–3 deployed |
| Manual A | 🧑 | Visual browser audit | Phase 5 |
| Manual B | 🧑 | Transition quality | Manual A |

---

## Final Phase — Rule Files Update (R8)

If Phase 3 reveals previously undocumented plum-inversion behavior in production, update:
- `_rules/UI_RULES.md` §18 (Color Usage table) — add explicit note: "Plum sections MUST include `dark:bg-s-plum-subtle dark:text-s-plum-text`. Dark-only raw hex in plum sections is BANNED."
- Add to §20 BANNED TOKEN LIST: any nav-only `dark:` hex not from the system token table

---

## Proposed Add to `CLAUDE.md` / `UI_RULES.md` (to prevent recurrence)

The following rule should be added to `_rules/UI_RULES.md` §21 (Design Token Validation):

```
### Rule 33: DARK MODE PAIR COMPLETENESS (MANDATORY)

Every component that uses a light-mode surface token MUST have the corresponding dark-mode pair on the same element:

| Light token | Required dark pair |
|---|---|
| `bg-white` | `dark:bg-s-dm-raised` or `dark:bg-s-dm-surface` |
| `text-s-ink` | `dark:text-s-dm-text` |
| `border-s-ink/10` | `dark:border-white/10` |
| `bg-s-plum` (depth blocks) | `dark:bg-s-plum-subtle dark:text-s-plum-text` |

Verification (run before every push):
```bash
grep -Ern "bg-white[^/]|text-s-ink[^/]" components/ app/ --include="*.tsx" \
  | grep -v "dark:\|//\|toggle\|knob\|btn-coral\|rounded-pill" \
  | head -10
# Must return 0 results
```
```
