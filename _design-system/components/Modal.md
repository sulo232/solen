<!-- exists-check: net-new doc, no existing components/*.md covers Modal , the component
     has shipped in app/[locale]/_components/primitives/Modal.tsx since the V2-D18 era
     (8 real dashboard call-sites + FilterSheet), had a registry mention nowhere and no
     dedicated doc until this file (A3 registry audit finding 3, 2026-07-12). -->

# Modal

**File:** [app/[locale]/_components/primitives/Modal.tsx](../../app/[locale]/_components/primitives/Modal.tsx)
**Layer:** 1 (chrome) — centered overlay shell, no semantic color of its own; children (`ModalHeader`/`ModalBody`/`ModalFooter`) carry any Layer 2/3 content the caller composes.
**Status:** documented-from-code 2026-07-12, not owner-locked. Live, 8 real call-sites + 2 internal (composed by `Sheet.tsx` and `CookieConsent.tsx`).

---

## Purpose

Centered-overlay modal primitive for confirmations, focused single-task interactions, and desktop fallback of filter/settings sheets. Built on `react-aria-components` (`Modal`/`ModalOverlay`/`Dialog`/`Heading`) for focus-trap, scroll-lock, and portal behavior across browsers, per the architecture comment at `Modal.tsx:14-31` (explicit deviation from native-first, V2-D18).

Distinct from `Sheet` (bottom-anchored, mobile-shaped): modal works identically on mobile and desktop, never auto-dismisses, never stacks (`Modal.tsx:88-93`).

---

## Public API

```ts
interface ModalProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  size?: "sm" | "md" | "lg";              // default "md"
  isDismissable?: boolean;                // backdrop click dismisses, default true
  keyboardDismissDisabled?: boolean;      // Escape dismisses, default false (i.e. Escape IS enabled)
  className?: string;                     // applied to the modal surface
  overlayClassName?: string;              // applied to the backdrop
  children?: React.ReactNode;             // compose ModalHeader/ModalBody/ModalFooter
  "aria-label"?: string;
  "aria-describedby"?: string;
}
```
(`Modal.tsx:62-86`)

Composed sub-components (each with their own `size?: ModalSize` pass-through for padding):

- `<ModalHeader title? eyebrow? closeButton? closeAriaLabel? onClose? children? size? className?>` (`Modal.tsx:151-231`)
- `<ModalBody size? className? ...divProps>` (`Modal.tsx:237-259`)
- `<ModalFooter size? layout?: "right" | "between" className? ...divProps>` (`Modal.tsx:265-300`)

Composition pattern (`Modal.tsx:22-27`, sibling-not-wrapper, V2-D17):

```tsx
<Modal isOpen={open} onOpenChange={setOpen} size="md">
  <ModalHeader title="Termin bestätigen" eyebrow="Buchung" />
  <ModalBody>...</ModalBody>
  <ModalFooter>...</ModalFooter>
</Modal>
```

---

## Visual signature (from code)

- **Surface:** `bg-s-bg-base rounded-2xl shadow-elevation-3`, `overflow-hidden`, `max-h-[calc(100dvh-32px)]` (`Modal.tsx:33-37`).
- **Sizes (`modalSurfaceVariants`, `Modal.tsx:48-52`):** `sm` → `w-[min(360px,calc(100vw-32px))]`, `md` (default) → `w-[min(480px,calc(100vw-32px))]`, `lg` → `w-[min(640px,calc(100vw-32px))]`.
- **Backdrop:** `bg-[rgba(26,18,9,0.40)] backdrop-blur-[4px]`, `fixed inset-0`, flex-centers the modal (`Modal.tsx:125-134`).
- **z-index:** backdrop `z-modal-bg` (500), surface `z-modal` (510) (`tailwind.config.js:292-300`).
- **ModalHeader:** `border-b border-s-border`, padding `px-6 py-5` (`md`) or `px-7 py-6` (`lg`); eyebrow `font-body font-semibold text-[13px] text-s-ink-3`; title via `<Heading slot="title">` `font-body font-semibold text-[18px] leading-[1.3] text-s-ink truncate`; close X = `w-11 h-11 -m-2.5 rounded-md` icon-button, `text-s-ink-2` hover `text-s-ink` (`Modal.tsx:182-227`).
- **ModalBody:** `font-body font-normal text-[16px] leading-[1.55] text-s-ink`, padding `px-6 pt-4 pb-5` (`md`) or `px-7 pt-4 pb-6` (`lg`), scrolls (`overflow-y-auto`) (`Modal.tsx:243-258`).
- **ModalFooter:** `border-t border-s-border`, padding `px-6 py-4` (`md`) or `px-7 py-5` (`lg`); `layout="right"` (default) = `justify-end`, `layout="between"` = `justify-between` (`Modal.tsx:283-296`).

---

## Motion (from code)

- **Entry/exit:** `transition-[opacity,transform] duration-[250ms] ease-snap`; `data-[entering]:opacity-0 scale-[0.95]`; `data-[exiting]:opacity-0 scale-[0.95] duration-150` (`Modal.tsx:38-41`).
- **Backdrop fade:** `transition-opacity duration-200 ease-snap`; exit `duration-150` (`Modal.tsx:130-132`).
- **Reduced motion:** `motion-reduce:transition-opacity motion-reduce:duration-100`, scale collapses to `100` on both entering/exiting (`Modal.tsx:42-44`). Functional (no bounce/spring) per the file comment: "modals are functional, not playful" (`Modal.tsx:29-30`).
- **Close-X press:** `active:scale-[0.94]`, `transition-[color,transform] duration-150 ease-snap` (`Modal.tsx:220-221`).

---

## Real call-sites

8 real production call-sites (all `dashboard/*/page.tsx`) + `search/FilterSheet.tsx`, plus 2 internal composers:

- `dashboard/all-salons`, `dashboard/calendar`, `dashboard/all-users`, `dashboard/bookings`, `dashboard/badge-manager`, `dashboard/review-moderation`, `dashboard/staff`, `dashboard/services` (each `page.tsx`)
- `search/FilterSheet.tsx` — desktop fallback via `useResponsiveOverlay()`
- Internal: `primitives/Sheet.tsx` composes nothing of Modal directly, but `useResponsiveOverlay()` (defined in `Sheet.tsx`) is the switch callers use to pick `Modal` on desktop; `primitives/CookieConsent.tsx`'s `CookieSettingsModal` renders `<Modal size="lg">`.

---

## Use / Don't

**Use:** confirmations, focused single-task dialogs (login, settings), desktop fallback of a mobile `Sheet` (via `useResponsiveOverlay()`).
**Don't:** mobile-shaped bottom overlays (use `Sheet`), toasts/notifications (use `Toast`), stacking multiple modals (react-aria + this primitive assume one at a time).

---

## Related

- [Sheet.md](Sheet.md) — the bottom-anchored mobile sibling; `useResponsiveOverlay()` picks between the two.
- `FilterSheet.tsx` — the primary non-dashboard consumer, desktop path.
- `CookieConsent.tsx` — `CookieSettingsModal` composes `Modal` + `Switch`.
