> ⚠️ **STALE — REFERENCES RETIRED DESIGN SYSTEM** (flagged 2026-05-06)
>
> This file references the previous V5 design tokens (coral hexes, Bebas Neue, locked component patterns, etc.) which are currently **in flux**. **Don't cite values or rules from this file as authoritative.** Read `_tasks/SOLEN_DESIGN.md` for current state, or ask the user. Archived context: `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap C: Header, Navigation & Tab Bar Polish
> **Priority**: 🟡 P1 — Run IN PARALLEL with roadmaps A and B
> **Parallelism**: SAFE alongside CSS foundation and card interactions. Touches DIFFERENT files.
> **Estimated Time**: ~25 minutes
> **File Lock**: `components/layout/Header.tsx`, `components/layout/BottomTabBar.tsx`, `components/ui/Breadcrumb.tsx`, `components/ui/AirbnbSearchBar.tsx`

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | CSS only on breadcrumb |
| Phase 2 | 🟡 MEDIUM | Profile dropdown behavior | Test logged-out + logged-in states |
| Phase 3 | 🟢 SAFE | Nothing | CSS class addition only |
| Phase 4 | 🟢 SAFE | Nothing | CSS property change only |

---

## 🤖 Phase 1: Fix Breadcrumb on Homepage + Search Bar Caret

### Step 1a: Fix breadcrumb homepage detection

**File**: `components/ui/Breadcrumb.tsx`

The `isHomepage` check (lines 36-43) has edge cases. Replace with a more robust regex:

```diff
-  const isHomepage =
-    pathname === "/" ||
-    pathname === `/${locale}` ||
-    pathname === `/${locale}/` ||
-    withoutLocale === "/" ||
-    withoutLocale === "" ||
-    !withoutLocale ||
-    withoutLocale.replace(/\//g, "") === "";
+  const normalizedPath = pathname.replace(/\/$/, "");
+  const isHomepage =
+    normalizedPath === "" ||
+    normalizedPath === "/" ||
+    normalizedPath === `/${locale}` ||
+    /^\/(de|en|fr|it)\/?$/.test(pathname);
```

### Step 1b: Change search input caret color

**File**: `components/ui/AirbnbSearchBar.tsx` (or wherever the search input is)

First find the input:
```bash
grep -n "caret-\|caret_color\|caretColor" components/ui/AirbnbSearchBar.tsx components/ui/GuidedSearch.tsx
```

If a coral caret exists, change it:
```diff
-className="... caret-s-coral ..."
+className="... caret-s-ink ..."
```

If it's set via inline style:
```diff
-style={{ caretColor: "#E8624A" }}
+style={{ caretColor: "#1A1209" }}
```

If there's no explicit caret styling, add `caret-s-ink` to the search input className.

```bash
git add components/ui/Breadcrumb.tsx components/ui/AirbnbSearchBar.tsx
git commit -m "fix: breadcrumb homepage detection + change search caret from coral to black"
```

> ⚠️ **BE CAREFUL**:
> - Test breadcrumb on: `/de` (should NOT show), `/en` (should NOT show), `/de/coiffeur` (SHOULD show)
> - If `AirbnbSearchBar.tsx` doesn't have the caret, check `GuidedSearch.tsx`

---

## 🤖 Phase 2: Profile Dropdown for Logged-Out Users

**Problem**: `Header.tsx` line 281-287 — when logged out, clicking profile icon is a direct `<Link>` to `/auth/login`. Should open a dropdown instead.

**File**: `components/layout/Header.tsx`

Replace lines 279-288 (the logged-out else branch):

```tsx
) : (
  /* Logged-out: dropdown with Login/Sign Up options */
  <>
    <button
      onClick={() => setProfileOpen(prev => !prev)}
      aria-label={t("login")}
      aria-expanded={profileOpen}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-s-ink/[0.06] text-s-ink hover:bg-s-ink/[0.10] active:scale-[0.98] transition-[background-color,transform] duration-200"
    >
      <User className="w-4 h-4" />
    </button>

    {/* Guest dropdown */}
    {profileOpen && (
      <div
        className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-input z-[60] overflow-hidden glass-frost shadow-v5-float"
      >
        <nav className="py-1" role="menu">
          <Link
            href={`/${locale}/auth/login`}
            onClick={() => setProfileOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-semibold text-s-ink hover:bg-s-ink/[0.03] transition-colors min-h-[40px]"
          >
            {t("login")}
          </Link>
          <Link
            href={`/${locale}/auth/login`}
            onClick={() => setProfileOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-medium text-s-ink/70 hover:bg-s-ink/[0.03] transition-colors min-h-[40px]"
          >
            {t("signup") ?? "Registrieren"}
          </Link>
          <div className="border-t border-s-ink/[0.06] my-1" />
          <Link
            href={`/${locale}/help`}
            onClick={() => setProfileOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-medium text-s-ink/50 hover:text-s-ink hover:bg-s-ink/[0.03] transition-colors min-h-[40px]"
          >
            {t("help") ?? "Hilfe"}
          </Link>
        </nav>
      </div>
    )}
  </>
)
```

✅ DO: Reuse the existing `profileOpen` state and `profileRef` click-outside handler — they already work
✅ DO: Use the same `glass-frost shadow-v5-float` styling as the logged-in dropdown
❌ DON'T: Create a new state variable — `profileOpen` already handles toggle
❌ DON'T: Add sign-up as separate route unless it exists — link both to `/auth/login`

```bash
git add components/layout/Header.tsx
git commit -m "feat: add profile dropdown menu for logged-out users (Login, Sign Up, Help)"
```

> ⚠️ **BE CAREFUL**:
> - The existing `profileRef` click-outside handler (lines 66-74) already covers this — it closes `profileOpen` on outside click
> - The existing ESC handler (lines 57-63) only targets `mobileOpen`, not `profileOpen`. Consider adding: `if (e.key === "Escape" && profileOpen) setProfileOpen(false);`
> - Check if translation keys `signup` and `help` exist in the `navigation` namespace. If not, use the `?? "fallback"` pattern shown above

---

## 🤖 Phase 3: Bottom Tab Bar Backdrop Blur

**Problem**: Mobile bottom tab bar has `glass-frost` but could be more glassy. Also check i18n.

**File**: `components/layout/BottomTabBar.tsx`

### Step 3a: Verify tab bar labels are i18n'd

Looking at the code, line 113: `{t(key as any)}` — this IS using `useTranslations("navigation")`. The labels ARE translated.

Check if the keys exist:
```bash
grep -n '"home"\|"discover"\|"search"\|"account"' messages/de.json messages/en.json | head -10
```

If the keys exist under `"navigation"` namespace, the labels should work. If they show German on the English route, the issue is locale detection, not missing keys.

### Step 3b: Add backdrop-blur to tab bar (if not already present)

Line 70 already has `glass-frost` class which includes `backdrop-filter: blur(20px)`. This is correct.

Double check: The `glass-frost` class in globals.css already includes blur. The tab bar should already be blurry. If it looks solid, the issue might be that `border-t border-black/[0.06]` is too visible.

Soften the border:
```diff
-className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-frost border-t border-black/[0.06] dark:border-s-dm-text/10"
+className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-frost border-t border-black/[0.04] dark:border-s-dm-text/[0.06]"
```

```bash
git add components/layout/BottomTabBar.tsx
git commit -m "design: soften bottom tab bar border for more subtle glass effect"
```

> ⚠️ **BE CAREFUL**:
> - Tab bar already has good styling. Only make the border softer.
> - Do NOT change the height (56px) or padding behavior — those are tuned for safe-area-inset-bottom

---

## 🤖 Phase 4: Sticky Header Shadow Transition

**Problem**: When you scroll past 200px, the header morphs from transparent to glass-frost. This already works (line 113-117). But the shadow appears instantly.

**File**: `components/layout/Header.tsx`

The `transition-[max-width,padding,min-height,background-color,border-color,box-shadow]` on line 113 already includes `box-shadow`. So the shadow SHOULD transition smoothly.

Check if `shadow-warm-lg` is the problem — it might be a custom utility that doesn't support transitions. If so, use inline style instead:

```diff
-scrolled ? "mt-2 max-w-4xl min-h-[52px] py-1.5 px-4 sm:px-6 glass-frost shadow-warm-lg border border-black/[0.06]"
+scrolled ? "mt-2 max-w-4xl min-h-[52px] py-1.5 px-4 sm:px-6 glass-frost border border-black/[0.06]"
```

And add inline shadow that's part of the transition:
```tsx
style={{
  boxShadow: scrolled
    ? "0 4px 16px rgba(26,18,9,0.06), 0 12px 40px rgba(26,18,9,0.04)"
    : "none",
  transition: "box-shadow 300ms ease-out"
}}
```

This ensures the shadow fades in smoothly rather than popping.

```bash
git add components/layout/Header.tsx
git commit -m "design: smooth shadow transition on sticky header scroll state"
```

> ⚠️ **BE CAREFUL**:
> - The header is a critical component. Only change the shadow behavior.
> - Test: scroll slowly — shadow should fade in, not pop
> - Do NOT change the glass-frost class or the morph animations

---

## 🔍 SELF-CHECK PROTOCOL

```bash
# 1. TypeScript
npx tsc --noEmit 2>&1 | tail -5

# 2. Build
npm run build 2>&1 | tail -10

# 3. Breadcrumb check
grep "isHomepage" components/ui/Breadcrumb.tsx

# 4. Profile dropdown — verify logged-out users see a menu
# (manual: open solen.ch/de in incognito, click profile icon)
```

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Breadcrumb fix + caret color | Nothing |
| Phase 2 | 🤖 | Profile dropdown for guests | Nothing |
| Phase 3 | 🤖 | Tab bar border soften | Nothing |
| Phase 4 | 🤖 | Header shadow transition | Nothing |
