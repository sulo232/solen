# Roadmap R28: Accessibility (a11y) Hardening

> **Scope:** Add skip-to-content, focus traps in modals, `aria-live` regions, `aria-current="page"` on nav, form error linking with `aria-describedby`, keyboard navigation for carousels.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — additive HTML element | Skip link is `sr-only` by default |
| Phase 2 | 🟡 MEDIUM | Modal keyboard nav if focus trap is buggy | Test Tab and Shift+Tab cycling — ensure Escape still closes |
| Phase 3 | 🟢 SAFE | Nothing — additive aria attributes | Only ADD attributes, never remove existing ones |
| Phase 4 | 🟢 SAFE | Nothing — additive aria attributes | Only ADD `id` and `aria-describedby` |

---

## 🤖 Phase 1: Skip-to-Content Link + Landmark Roles

#### Files
- `[MODIFY]` `app/[locale]/layout.tsx` — Add skip link as first child inside `<body>`
- `[MODIFY]` Layout wrapper or main content area — Add `id="main-content"` and `role="main"` to the main content container

#### ✅ DO
```tsx
// First child inside <body> in app/[locale]/layout.tsx:
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-s-coral focus:text-white focus:rounded-btn focus:shadow-warm-md focus:text-sm focus:font-medium"
>
  Zum Inhalt springen
</a>

// On the main content wrapper:
<main id="main-content" role="main" tabIndex={-1} className="...">
```

#### ❌ DON'T
```tsx
// DON'T make the skip link visible by default — it should only show on keyboard focus
className="fixed top-4 left-4 ..."  // ← BAD: visible to all users

// DON'T put the skip link OUTSIDE <body> — it must be the first focusable element
```

#### Verification
```bash
npm run build
# Test: load page, press Tab — skip link should appear, press Enter — page scrolls to main content
git add -A && git commit -m "R28 phase 1: skip-to-content link + main landmark role"
```

> ⚠️ **BE CAREFUL**:
> - The `sr-only` class hides it visually — `focus:not-sr-only` reveals it on keyboard focus
> - Add `tabIndex={-1}` to `#main-content` so it can receive programmatic focus
> - Don't add skip links to dashboard — dashboard has its own keyboard nav

---

## 🤖 Phase 2: Focus Trapping in Modals

#### Files
- `[MODIFY]` `components/ui/GlassModal.tsx` — Add focus trap logic

#### Instructions
1. On modal open: store the previously focused element, then focus the first focusable child
2. On Tab at last focusable: wrap to first. On Shift+Tab at first: wrap to last.
3. On modal close: restore focus to the stored element.

#### ✅ DO
```tsx
import { useEffect, useRef, useCallback } from "react";

function useFocusTrap(ref: React.RefObject<HTMLDivElement>, isOpen: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = ref.current.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    firstEl?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, ref]);
}
```

#### ❌ DON'T
```tsx
// DON'T use a heavy library (focus-trap-react) just for this — the hook above is sufficient
// DON'T trap focus in dropdowns or tooltips — only full modals
// DON'T forget to restore focus on close — users lose their place otherwise
```

#### Verification
```bash
npm run build
# Test: open a modal, Tab should cycle within it, Shift+Tab should reverse, Escape should close + restore focus
git add -A && git commit -m "R28 phase 2: focus trap in GlassModal with useFocusTrap hook"
```

> ⚠️ **BE CAREFUL**:
> - Only apply focus trap to `GlassModal` — don't apply to `BottomSheet` (it's a partial overlay)
> - The `focusableSelectors` query must run AFTER the modal content has rendered — use `useEffect`
> - Escape key handling should ALREADY exist in GlassModal — just verify, don't add a second handler

---

## 🤖 Phase 3: aria-live for Dynamic Content + aria-current for Nav

#### Files
- `[MODIFY]` `components/BookingCalendar.tsx` — Add `aria-live="polite"` to the slot grid container (~line 590)
- `[MODIFY]` `components/ChatWindow.tsx` — Add `aria-live="polite"` to the messages container
- `[MODIFY]` `components/ui/Toast.tsx` — Verify `role="alert"` + `aria-live="assertive"` exists
- `[MODIFY]` `components/layout/BottomNav.tsx` — Add `aria-current="page"` to active nav links
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — Add `aria-current="page"` to active sidebar links (~line 163, 232)
- `[MODIFY]` `components/layout/Header.tsx` — Add `aria-current="page"` to active header links

#### ✅ DO
```tsx
// Slot grid — screen readers announce updates
<div aria-live="polite" aria-label="Verfügbare Zeitslots">
  {slots.map(slot => ...)}
</div>

// Nav links — screen readers announce current page
<Link
  href={href}
  aria-current={isActive ? "page" : undefined}
  className={...}
>
```

#### ❌ DON'T
```tsx
// DON'T use aria-live="assertive" for non-urgent updates — it interrupts screen readers
<div aria-live="assertive">  // ← BAD for slot grid — use "polite"

// DON'T add aria-live to the entire page — only to the specific dynamic region
<main aria-live="polite">  // ← BAD: every DOM change triggers an announcement
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R28 phase 3: aria-live on dynamic content, aria-current on nav links"
```

> ⚠️ **BE CAREFUL**:
> - `aria-live="polite"` waits for a pause before announcing — don't use it on rapidly updating content (like typing indicators)
> - `aria-current="page"` should only be on the CURRENTLY active link — not all links
> - Verify that Toast already has `role="alert"` — if yes, skip it

---

## 🤖 Phase 4: Form Error Linking

#### Files (grep for error displays):
```bash
grep -rn "text-xs text-s-error\|text-xs text-red" components/ --include="*.tsx" -l
```

- `[MODIFY]` `components/auth/SignIn.tsx` — Link errors to inputs with `aria-describedby`
- `[MODIFY]` `components/BookingCalendar.tsx` — Guest form validation errors
- `[MODIFY]` `components/ReviewForm.tsx` — Rating/text validation errors
- `[MODIFY]` `components/onboarding/steps/SalonProfileStep.tsx` — Profile form errors
- `[MODIFY]` `components/onboarding/steps/ServicesStep.tsx` — Service form errors

#### ✅ DO
```tsx
// Input with error linking
<input
  id="email-input"
  aria-describedby={emailError ? "email-error" : undefined}
  aria-invalid={!!emailError}
  ...
/>
{emailError && (
  <p id="email-error" role="alert" className="text-xs text-s-coral mt-1">
    {emailError}
  </p>
)}
```

#### ❌ DON'T
```tsx
// DON'T use generic IDs — each error must have a unique ID
id="error"  // ← BAD: conflicts if multiple errors exist

// DON'T forget aria-invalid on the input — screen readers use this to announce invalid state
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R28 phase 4: form error linking with aria-describedby and aria-invalid"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Every `id` must be unique on the page — use descriptive names like `"email-error"`, `"password-error"`
> - `aria-describedby` should point to the error element's `id` — not the input's `id`
> - Only add `aria-invalid={true}` when there IS an error — remove it (or set false) when fixed

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Skip-to-content link | Nothing |
| Phase 2 | 🤖 | Focus trap in GlassModal | Nothing |
| Phase 3 | 🤖 | aria-live + aria-current (6 files) | Nothing |
| Phase 4 | 🤖 | Form error linking (5 files) | Nothing |
