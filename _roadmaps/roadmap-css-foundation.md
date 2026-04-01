> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap A: CSS Foundation & Global Polish
> **Priority**: 🔴 P0 — Run FIRST or in parallel. Zero component logic changes.
> **Parallelism**: SAFE alongside ALL roadmaps. Only touches `globals.css` and `tailwind.config.ts`.
> **Estimated Time**: ~15 minutes
> **File Lock**: `app/globals.css`, `tailwind.config.ts`

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Page background change affects ALL pages | Test homepage + salon detail + dashboard |
| Phase 2 | 🟢 SAFE | Nothing | Adding new CSS, not modifying existing |
| Phase 3 | 🟢 SAFE | Nothing | CSS only |
| Phase 4 | 🟢 SAFE | Nothing | CSS only |

---

## 🤖 Phase 1: White Background + Scroll Fade Fix

**Problem**: `--bg: #F7F7F7` and `--base: #F7F7F7` give a warm grey tint. The `.scroll-fade-right::after` gradient fades to `#F5F0EB` (a different beige!). Both need to become white.

**File**: `app/globals.css`

### Step 1a: Change light-mode base colors (lines 31-32):
```diff
-    --bg: #F7F7F7;
-    --base: #F7F7F7;
+    --bg: #FAFAFA;
+    --base: #FAFAFA;
```

### Step 1b: Also change `--background` HSL on line 13:
```diff
-    --background: 34 44% 95%;
+    --background: 0 0% 98%;
```

### Step 1c: Fix the scroll-fade gradient (old line 305 AND line 725):
Both `.scroll-fade-right::after` blocks reference hardcoded beige colors. Update both:
```diff
-  background: linear-gradient(to left, #F5F0EB, transparent);
+  background: linear-gradient(to left, #FAFAFA, transparent);
```
And:
```diff
-  background: linear-gradient(to left, var(--base, #F7F7F7) 0%, transparent 100%);
+  background: linear-gradient(to left, var(--base, #FAFAFA) 0%, transparent 100%);
```

### Step 1d: Update glass backgrounds to match light grey base:
The `.glass` utility (line 121) references beige:
```diff
-    background: rgba(250, 246, 239, 0.88);
+    background: rgba(250, 250, 250, 0.88);
```
And `.glass-strong` (line 128):
```diff
-    background: rgba(250, 246, 239, 0.95);
+    background: rgba(250, 250, 250, 0.95);
```

✅ DO: Change ALL beige/warm-tint base references to neutral light grey `#FAFAFA`
❌ DON'T: Touch `.dark` variants — dark mode colors are fine
❌ DON'T: Touch `--glass-bg-card` or `--glass-bg-subtle` — they're already white-based

```bash
git add app/globals.css
git commit -m "design: switch global background from beige #F7F7F7 to clean light grey #FAFAFA"
```

> ⚠️ **BE CAREFUL**:
> - `body { background-color: var(--base); }` on line 91 means this propagates everywhere
> - Test: Dashboard pages should still look fine (they use their own bg classes)
> - The ambient gradients (`.ambient-v4`, `.ambient-v5`) use radial gradients with transparency — they'll still look correct on white. DO NOT touch them.

---

## 🤖 Phase 2: Custom Thin Scrollbar (Windows)

**Problem**: Windows users see a fat, chunky grey scrollbar. Needs to be thin and subtle.

**File**: `app/globals.css` — Add AFTER the existing `.scrollbar-hide` block (around line 678):

```css
/* ── Slim page scrollbar (Windows polish) ─────────────────────────── */
@media (hover: hover) {
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
  }
  /* Firefox */
  html {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }
  .dark ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
  }
  .dark ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  .dark html {
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }
}
```

✅ DO: Wrap in `@media (hover: hover)` so touch devices aren't affected
❌ DON'T: Modify existing `.scrollbar-hide` or `.scrollbar-none` utilities

```bash
git add app/globals.css
git commit -m "design: add slim custom scrollbar for Windows browsers"
```

---

## 🤖 Phase 3: Focus Ring → Black (Accessibility)

**Problem**: Focus ring is coral (`rgba(232, 98, 74, 0.5)`). Should be black with white offset.

**File**: `app/globals.css` — Modify the existing focus-visible block (lines 244-250):

```diff
  a:focus-visible,
  button:focus-visible,
  [tabindex]:focus-visible {
-    outline: 2px solid rgba(232, 98, 74, 0.5);
+    outline: 2px solid #1A1209;
    outline-offset: 2px;
    border-radius: 4px;
  }
```

The input focus ring (lines 253-259) stays — coral input ring is acceptable for form fields. Only interactive elements (links, buttons) need black.

✅ DO: Only change the `a`, `button`, `[tabindex]` ring
❌ DON'T: Change `input:focus-visible` — the coral box-shadow for inputs is fine

```bash
git add app/globals.css
git commit -m "a11y: change focus-visible ring from coral to black for interactive elements"
```

---

## 🤖 Phase 4: Subtle Divider Utility + Modal Backdrop Blur

**File**: `app/globals.css` — Add after the `.card-listing` block:

```css
/* ── V6 Subtle section divider ─────────────────────────────────────── */
.divider-subtle {
  border-top: 1px solid rgba(26, 18, 9, 0.08);
}
.dark .divider-subtle {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── V6 Modal/dialog backdrop — blur + dim ─────────────────────────── */
.backdrop-premium {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
```

```bash
git add app/globals.css
git commit -m "design: add divider-subtle utility and backdrop-premium modal overlay"
```

---

## 🔍 SELF-CHECK PROTOCOL

```bash
# 1. Verify no beige references remain in base
grep -n "F7F7F7\|F5F0EB\|F5EEE4\|250, 246, 239" app/globals.css | head -10
# Expected: Only inside .dark blocks or glass-shadow-inset

# 2. Build check
npm run build 2>&1 | tail -10

# 3. Visual check: open solen.ch/de — background should be pure white
```

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | White background | Nothing |
| Phase 2 | 🤖 | Scrollbar polish | Nothing |
| Phase 3 | 🤖 | Focus rings | Nothing |
| Phase 4 | 🤖 | Divider + backdrop utilities | Nothing |
