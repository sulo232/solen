<!-- exists-check: net-new doc, no existing components/*.md covers Sheet , shipped in
     app/[locale]/_components/primitives/Sheet.tsx (3 real call-sites + used inside
     FilterSheet via useResponsiveOverlay), had a registry mention nowhere and no
     dedicated doc until this file (A3 registry audit finding 3, 2026-07-12). -->

# Sheet

**File:** [app/[locale]/_components/primitives/Sheet.tsx](../../app/[locale]/_components/primitives/Sheet.tsx)
**Layer:** 1 (chrome) — bottom-anchored overlay shell, no semantic color of its own.
**Status:** documented-from-code 2026-07-12, not owner-locked. Live, 3 real call-sites + `FilterSheet`'s mobile path via `useResponsiveOverlay()`.

---

## Purpose

Mobile-only bottom-anchored overlay. Inherits the `Modal`'s `react-aria-components` portal + focus-trap + scroll-lock behavior; differs in CSS positioning (bottom-anchored vs centered) and motion (`translateY(100%) → 0` vs `scale(0.95) → 1`) (`Sheet.tsx:14-20`). On desktop, callers use `useResponsiveOverlay()` (exported from this same file) to fall back to `Modal`.

---

## Public API

```ts
interface SheetProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  height?: "auto" | "default" | "full";   // default "default"
  isDismissable?: boolean;                // default true
  keyboardDismissDisabled?: boolean;      // default false
  className?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
}
```
(`Sheet.tsx:70-91`)

Composed sub-components:

- `<SheetHeader title? eyebrow? closeButton? closeAriaLabel? onClose? children? className?>` (`Sheet.tsx:206-271`)
- `<SheetBody className? ...divProps>` (`Sheet.tsx:277-297`)
- `<SheetCTARow layout?: "primary-only" | "reset-and-primary" | "secondary-and-primary" className? ...divProps>` (`Sheet.tsx:303-340`)

Plus the responsive-picker hook:

```ts
function useResponsiveOverlay(): "sheet" | "modal"
```
Returns `"sheet"` below 768px, `"modal"` at/above (`Sheet.tsx:363-375`). SSR-safe: defaults to `"sheet"` during SSR, hydrates on client mount.

Composition (`Sheet.tsx:22-30`, sibling-not-wrapper):

```tsx
<Sheet isOpen={open} onOpenChange={setOpen} height="default">
  <SheetHeader title="Sortieren nach" />
  <SheetBody>...</SheetBody>
  <SheetCTARow>
    <button>Zurücksetzen</button>
    <button>Anwenden</button>
  </SheetCTARow>
</Sheet>
```

---

## Visual signature (from code)

- **Surface:** `bg-s-bg-base rounded-t-[28px]` (top-only radius), shadow `0_-4px_28px_rgba(50,47,44,0.12),0_-2px_8px_rgba(50,47,44,0.06)`, `absolute bottom-0 left-0 right-0` (`Sheet.tsx:37-41`).
- **Heights (`sheetSurfaceVariants`, `Sheet.tsx:52-60`):** `auto` → `h-auto max-h-[calc(100dvh-64px)]`; `default` (default) → `h-[75dvh] max-h-[calc(100dvh-64px)]`; `full` → `h-[90dvh] max-h-[calc(100dvh-64px)]`.
- **Backdrop:** `bg-[rgba(26,18,9,0.40)] backdrop-blur-[4px]`, `fixed inset-0` (`Sheet.tsx:174-176`).
- **z-index:** backdrop `z-sheet-bg` (400), surface `z-sheet` (410) (`tailwind.config.js:292-300` — one tier below Modal's 500/510).
- **Grab handle:** `w-9 h-1 rounded-full bg-s-ink/20`, centered, drag-to-dismiss zone above the content (`Sheet.tsx:188-194`).
- **SheetHeader:** `px-5 py-4 border-b border-s-border`; eyebrow `font-body font-semibold text-[13px] text-s-ink-3`; title `font-body font-semibold text-[18px] leading-[1.3] text-s-ink truncate`; close X = `w-11 h-11 -m-2.5 rounded-md` icon-button (`Sheet.tsx:226-268`, same recipe as `ModalHeader`).
- **SheetBody:** `px-5 pt-3 pb-4`, `font-body font-normal text-[16px] leading-[1.55] text-s-ink`, `overflow-y-auto` with `-webkit-overflow-scrolling: touch` for iOS momentum (`Sheet.tsx:283-296`).
- **SheetCTARow:** `border-t border-s-border`, `px-5 pt-4`, safe-area-aware bottom padding `pb-[max(1rem,env(safe-area-inset-bottom))]`, `bg-s-bg-base`; `primary-only` = `justify-stretch`, other layouts = `justify-between` (`Sheet.tsx:320-336`).

---

## Behavior (from code)

- **Backdrop step-back:** while a sheet is open, `#main-content` gets a `.sheet-scale-back` class (`translateY(10px) scale(.965) brightness(.96)`, per the code comment at `Sheet.tsx:125-128`, classes live in `globals.css`) — owner-approved "Option B" (2026-06-11).
- **Drag-to-dismiss:** pointer-driven, the grab handle follows the finger; release under 90px snaps back, past 90px dismisses (`Sheet.tsx:140-165`). Buttons/backdrop/Escape remain valid dismiss paths regardless (gesture is never the only way out).
- **Motion:** entry `transition-transform duration-[600ms] ease-glide`, `data-[entering]:translate-y-full`; exit `data-[exiting]:translate-y-full data-[exiting]:duration-200 data-[exiting]:ease-snap` (`Sheet.tsx:42-45`). Backdrop fade `duration-300 ease-snap` entry / `duration-200` exit (`Sheet.tsx:178-180`).
- **Reduced motion:** collapses to opacity-only, `duration-100` (`Sheet.tsx:46-49`).

---

## Real call-sites

3 real call-sites: `salon/SalonTeam.tsx`, `primitives/DateTimePicker.tsx` (the strip layout's "more dates" full month-grid), `dashboard/bookings/page.tsx`. Plus `FilterSheet.tsx`'s mobile path via `useResponsiveOverlay()`.

---

## Use / Don't

**Use:** mobile filter/sort/settings/date-drill-in sheets (< 768px). Pair with `Modal` via `useResponsiveOverlay()` for the desktop fallback.
**Don't:** desktop-only overlays (use `Modal` directly). Don't introduce a second bottom-sheet implementation — extend this one (variants live in `height`).

---

## Related

- [Modal.md](Modal.md) — the centered desktop sibling; `useResponsiveOverlay()` picks between the two.
- [FilterSheet.md](FilterSheet.md) — the primary consumer of the responsive pattern.
- `DateTimePicker.tsx` — uses `Sheet` for the strip layout's "more dates" full-month fallback.
