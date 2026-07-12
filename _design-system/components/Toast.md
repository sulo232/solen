# Toast

**File:** [app/[locale]/_components/primitives/Toast.tsx](../../app/[locale]/_components/primitives/Toast.tsx)
**Locked since:** V3-D462 (2026-06-13) — Chime/Google-Photos white-pill recipe (supersedes the V3-D195/V3-D196 dark ink pill this doc used to describe)
**Updated 2026-07-12:** this doc previously documented the retired V3-D195/V3-D196 dark-`bg-s-ink` top-of-viewport recipe. Rewritten below to match the shipped `Toast.tsx` code (§ Visual signature / Motion / A11y).
**SOURCE.md links:** [§6 Motion](../SOURCE.md#§6--motion-vocabulary) · [§10 Loading / empty / error / async state grammar](../SOURCE.md#§10--loading--empty--error--async-state-grammar) · [§11 Clickable Surface Contract](../SOURCE.md#§11--clickable-surface-contract) · [§12 z-index](../SOURCE.md#§12--z-index--overlay-layering-scale) · [§16 a11y](../SOURCE.md#§16--accessibility-rules)

---

## Purpose

Transient confirmation / warning / error feedback after a user action. Toasts are **docked at the bottom of the viewport** (thumb-reach, mobile-first), slide up, dismiss themselves after 4 s (or earlier on click). Used for:

- Save / unsave confirmations
- Error rollbacks for optimistic mutations (per §10.4)
- "Coming Soon" affordances via the `<ComingSoon>` wrapper (option D in §11)
- Network / RLS error feedback
- Background-action status (auto-save, sync)

Solen rolls its own toast (no `react-hot-toast`, no `sonner`) — owning the motion + tone discipline matters more than the ~40 lines saved by a library.

---

## Public API

There are **two ways to call**. Prefer the singleton (`toast.success()`) — the `useToast()` hook + `ToastProvider` form is back-compat for legacy callers.

### New singleton API (preferred)

```ts
import { toast, Toaster } from "@/app/[locale]/_components/primitives/Toast";

// Mount the portal ONCE at app root (e.g. inside <body> in layout.tsx):
<Toaster />

// Fire from anywhere — no hook, no provider:
toast.show("Generic notice");                   // no circle badge
toast.success("Look gespeichert");              // green circle badge
toast.error("Buchung fehlgeschlagen");          // red circle badge, aria-live="assertive"
toast.info("Diese Funktion kommt bald");        // blue circle badge (s-accent)
toast.warning("Verbindung instabil");           // amber circle badge

// With action button:
toast.info("Filter zurückgesetzt", {
  action: { label: "Rückgängig", onClick: restoreFilters },
});

// With description sub-line:
toast.error("Termin nicht verfügbar", {
  description: "Der Slot wurde bereits gebucht. Wähle einen anderen.",
});

// Sticky (no auto-dismiss):
toast.error("Manuell schliessen", { duration: Infinity });

// Programmatic dismiss:
const id = toast.success("...");
toast.dismiss(id);    // dismiss one
toast.dismiss();      // dismiss all
```

### Back-compat hook API (legacy callers — dev/primitives/page.tsx)

```ts
import { ToastProvider, useToast } from "@/app/[locale]/_components/primitives/Toast";

// Provider (renders `<Toaster />` internally):
<ToastProvider>{children}</ToastProvider>

// In any client component:
const t = useToast();
t.success({
  title: "Look gespeichert",
  description: "...",
  action: "Rückgängig",   // string label
  onAction: undo,
});
t.dismiss(id);
t.dismissAll();
```

The legacy hook delegates to the singleton — every toast lives in one store, regardless of which API created it.

### TypeScript

```ts
export type ToastTone = "default" | "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  description?: React.ReactNode;
  duration?: number;          // ms. Default 4000. Pass Infinity for sticky.
  ariaLive?: "polite" | "assertive";
}
```

---

## Visual signature

```
            ┌──────────────────────────────────────┐
            │ (✓)  Look gespeichert      Rückgängig │  ← bg-white, border-s-border
            └──────────────────────────────────────┘     text-s-ink, rounded-[16px]
                ↑                          ↑
          26px circle badge          blue text action
        (tint bg + saturated glyph)  (text-s-accent, no underline/chevron)
```

Per `Toast.tsx:197-213` (`TOAST_PILL` + `toneBadge`):

- **Background:** `bg-white` with `border border-s-border`. Text stays `text-s-ink` — the circle badge carries the tone signal, not the pill body.
- **Text:** title `font-body font-semibold text-[14px] leading-[1.35] text-s-ink`; optional description `font-body font-normal text-[13px] leading-[1.4] text-s-ink-2`.
- **Shape:** `rounded-[16px]`, `shadow-elevation-3`, `px-4 py-3`.
- **Width:** full minus gutter on mobile; `md:max-w-[420px] md:min-w-[280px]`.
- **Position (`Toast.tsx:229-242`):** docked at the **bottom**, safe-area aware.
  - Mobile: `bottom: max(1rem, env(safe-area-inset-bottom) + 1rem)`, centered, `left-4 right-4`.
  - `md+`: bottom-right, `bottom-6 right-6`, `items-end`, `max-w-[420px]`.

### Circle-badge colors (`toneBadge`, `Toast.tsx:208-213`)

| Tone | Badge bg (tint) | Glyph color | Icon |
|---|---|---|---|
| `default` | (no badge) | — | — |
| `success` | `bg-s-success-bg` `#E8F5E9` | `text-s-success` `#16A34A` | `Check` |
| `error` | `bg-s-error-bg` `#FEE2E2` | `text-s-error` `#DC2626` | `X` |
| `warning` | `bg-s-warning-bg` `#FDF6E7` | `text-s-warning` `#F1AE27` | `AlertTriangle` |
| `info` | `bg-s-accent-pale` `#EAEFFE` | `text-s-accent` `#276EF1` | `Info` |

The badge is a 26px circle (`w-[26px] h-[26px]`), glyph rendered at `size={15} strokeWidth={3}` (`Toast.tsx:346,350`). Pastel tint bg + saturated glyph, never a screamy saturated solid (taste rule 6).

---

## Motion details

Per `Toast.tsx:252-330` (`ToastItem`), motion is plain CSS transitions on inline `style`, NOT `motion/react` — the code comment (`Toast.tsx:256-264`) states the `AnimatePresence` + portal + `useSyncExternalStore` combo had presence-detection issues in this environment.

| Stage | Property | Duration | Easing |
|---|---|---|---|
| Enter (bottom-docked slide-up) | `transform: translateY(20px) → translateY(0)`, `opacity: 0 → 1` | transform 350 ms / opacity 200 ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (transform, spring-overshoot settle) / `cubic-bezier(0.4, 0, 0.2, 1)` (opacity) |
| Auto-dismiss timer | — | 4000 ms default (`DEFAULT_DURATION`); override via `duration` | — (`setTimeout`) |
| Exit (timer or click) | `opacity: 1 → 0` | 150 ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

3-state machine: `entering → open → exiting`, driven by two nested `requestAnimationFrame` calls on mount (`Toast.tsx:274-279`) so the browser paints the initial `translateY(20px)` before transitioning. No `layout` animation library — the stack reorders cheaply because each toast keys on its `id`.

**Reduced motion:** the global `prefers-reduced-motion` block in `app/globals.css` line 681 forces all transitions to `0.01ms`. The toast still appears + dismisses; just without the slide.

---

## Stack rules

- **Max 3 visible.** New toasts push onto the top of the stack; if the stack already has 3, the oldest is dropped (no queue — newest wins, because newest is most relevant in async UX).
- **Newest at top.** Stack grows downward visually. The user's most recent action sits closest to where their eye expects feedback.
- **Click to dismiss.** Tapping the toast body (NOT the action button) dismisses it. Action button click runs the handler AND dismisses.

---

## A11y

| Attribute | Value | Why |
|---|---|---|
| `role` | `"alert"` for `error`, `"status"` for everything else | Screen readers escalate `alert` to interrupt, `status` to wait |
| `aria-live` | `"assertive"` for `error`, `"polite"` otherwise | Matches WCAG 4.1.3 |
| Region | `<ol role="region" aria-label="Benachrichtigungen">` wraps the stack | Landmark for assistive nav |
| Focus | Toast is NOT auto-focused (interrupting focus is disorienting) | User keeps their place in the page |
| Toast body | `focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2` (`Toast.tsx:334`) | Ink outline reads on the white V3-D462 pill |
| Action button | `focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2` (`Toast.tsx:372`) | Blue outline matches the blue action text |

---

## Do / Don't

### Do

- Use the singleton (`toast.success(msg)`) — no need for the Provider in new code.
- Match the toast tone to the action's truth — `success` for confirmations, `error` for rollbacks, `info` for "we got it / coming soon".
- Use `<ComingSoon>` wrapper for unimplemented surfaces — it fires `toast.info("X kommt bald")` automatically.
- Pass a description sparingly — most toasts work fine title-only.
- Use `duration: Infinity` for errors the user MUST acknowledge.

### Don't

- Don't show a toast on every save/unsave heart — the heart animation IS the confirmation. Toast is for non-visible state changes (background sync, mutations that don't have an inline UI).
- Don't toast inside a loop. If 5 things failed, ONE toast: "5 Buchungen konnten nicht geladen werden."
- Don't use exclamation marks ("Gespeichert!") — see §18 voice rules. Plain "Gespeichert." (no punctuation in toasts is fine too).
- Don't pass a ReactNode `action` — the structured `{ label, onClick }` form is the only one supported in the new API. Legacy callers can keep using `action: "..." + onAction:`.
- Don't render the `<Toaster />` more than once per page tree.

---

## Edge cases

| Case | Behavior |
|---|---|
| Toast fired before `<Toaster />` mounts | Toast queued in store; renders as soon as `<Toaster />` is mounted (SSR-safe — store is module-level, `<Toaster />` only renders on the client via `useEffect` + `createPortal`). |
| Same message fires 10× rapidly | Each call appends; stack caps at 3 — oldest drops. No dedupe (intentional — different opportunities to notice). |
| User taps action button | `onClick` runs, toast dismisses immediately. No double-fire. |
| `duration: Infinity` | Toast sticks. Only click-to-dismiss or `toast.dismiss(id)` removes it. |
| Network error during render | Store is pure JS — no SSR data fetching. Toasts only fire from client events, so this can't happen. |
| Component unmounts while toast is showing | Toast keeps showing — it lives in the module-level store, not the component tree. |
| `prefers-reduced-motion: reduce` | Global override (globals.css:681) makes the slide instant. Auto-dismiss timer is unaffected. |

---

## Provenance

- **V3-D462** (2026-06-13) — owner-locked to the Chime/Google-Photos recipe (`Toast.tsx:193-196`): white pill (`bg-white border-s-border shadow-elevation-3`) replaces the V3-D195/V3-D196 dark `bg-s-ink` pill; a 26px circle-badge icon (tint bg + saturated glyph) replaces the 10px plain dot; bottom-docked position (thumb reach) replaces top-of-viewport; one blue text action (no underline/chevron). Motion moved from `motion/react` to plain CSS transitions (`Toast.tsx:256-264`). This doc was not updated for V3-D462 until 2026-07-12 (A3 registry audit finding 2a).
- **V3-D195** (2026-05-26) — rebuilt from V3-F.4 rich-context primitive into a module-level singleton + `<Toaster />` portal. New API: `toast.success(msg)` string-first. Back-compat: `ToastProvider` + `useToast()` retained for `dev/primitives/page.tsx`. Top-of-viewport positioning (was bottom). Ink-bg + colored-dot variants (was tone-bar left edge). Resolves [Q12](../QUESTIONS.md#q12).
- **V3-F.4** (legacy era, replaced) — rich-options ToastProvider with `success({ title, description, action, onAction })`. Lives on as the back-compat shim.

---

## Related

- **[ComingSoon](ComingSoon.md)** — wraps any clickable surface, fires `toast.info("X kommt bald")` on click. Canonical implementation of §11 option D.
- **[LoadingStates.md](LoadingStates.md) Pattern 4** — toast for optimistic mutation rollback.
- **[Skeleton](Skeleton.md)** — sibling primitive for §10.1 loading skeletons.
- **`app/[locale]/layout.tsx`** — mounts `<Toaster />` (the singleton portal, `layout.tsx:135`). Correction 2026-07-12: this line previously (falsely) said the layout still mounted the legacy `<ToastProvider>`; it does not, `layout.tsx:7-9`'s own comment confirms `ToastProvider` (`components-legacy/ui/Toast`) was retired.
