<!-- exists-check: net-new doc, no existing components/*.md covers Switch , shipped in
     app/[locale]/_components/primitives/Switch.tsx, had a registry mention nowhere and
     no dedicated doc until this file (A3 registry audit finding 3, 2026-07-12). Round-2
     correction (2026-07-12): the original "5 real call-sites" list wrongly included
     layout/CityTopBar.tsx (an unrelated copy string, not an import); re-verified by
     import grep, 4 real call-sites. -->

# Switch

**File:** [app/[locale]/_components/primitives/Switch.tsx](../../app/[locale]/_components/primitives/Switch.tsx)
**Layer:** 1 (chrome), B&W on-state, no semantic color.
**Status:** documented-from-code 2026-07-12, not owner-locked. Live, 4 real call-sites.

---

## Purpose

Boolean on/off toggle, distinct from a checkbox ("include in this list"). Track 44x24px, knob 20x20px, per the file's own doc comment (`Switch.tsx:23-31`). Anti-pattern flagged in the same comment: don't use a switch for "select 1 of 2-5 mutually exclusive options" (that's a radio group). Switch is on/off ONLY.

**Note:** the file comment (`Switch.tsx:27`) says the on-state "uses brand-teal", but the shipped code renders `bg-s-ink` on-state (`Switch.tsx:83`), ink, not teal. This doc describes the shipped code, not the stale comment.

---

## Public API

```ts
interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "value"> {
  checked?: boolean;               // controlled
  defaultChecked?: boolean;        // uncontrolled initial state, default false
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;         // rendered LEFT of the switch when present
  subLabel?: React.ReactNode;      // sub-label below the main label
}
```
(`Switch.tsx:6-21`. `forwardRef<HTMLButtonElement>`.)

Renders bare (just the `role="switch"` button) when no `label` is passed; renders a full row (`<label>` wrapper with `flex justify-between`, bottom hairline) when `label` is present (`Switch.tsx:104-126`).

---

## Visual signature (from code)

- **Track:** `w-11 h-6` (44x24px), `rounded-full`, `transition-colors duration-200 ease-snap` (`Switch.tsx:80-83`).
  - Checked: `bg-s-ink`. Unchecked: `bg-s-ink/15`.
- **Knob:** `w-5 h-5` (20x20px), `rounded-full bg-white`, offset `top-[2px]`, `left-[22px]` when checked / `left-[2px]` when unchecked, `transition-[left,transform] duration-200 ease-snap` (`Switch.tsx:91-99`). Shadow `0_1px_2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.04)`.
  - Press feedback: `active:scale-[0.92] active:transition-transform active:duration-100 active:ease-thud` (when not disabled).
- **Disabled:** `opacity-40 cursor-not-allowed` on the track (`Switch.tsx:85`).
- **Focus:** `focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2` (`Switch.tsx:84`).
- **Labeled row (when `label` passed):** `flex items-center justify-between gap-4`, `py-[14px] border-b border-s-border last:border-b-0`; label `font-body font-normal text-[16px] text-s-ink`; `subLabel` (if passed) `font-body font-normal text-[13px] text-s-ink-3 mt-1` (`Switch.tsx:106-124`).

---

## A11y

`role="switch"`, `aria-checked`, `aria-disabled` when disabled (`Switch.tsx:74-77`). When `label` is passed, the row is a native `<label htmlFor={id}>` wrapping the button, so a passed `id` wires the click target to the visible label.

---

## Real call-sites

4 real call-sites, re-verified by import grep 2026-07-12 (round-2 correction, `layout/CityTopBar.tsx` was falsely claimed before, that file only contains an unrelated copy string "Switch city for local content:" at `CityTopBar.tsx:74`, it never imports `Switch`):

- `profile/settings/SettingsForm.tsx:7` imports `Switch`, 2 rows (`SettingsForm.tsx:207,210`).
- `dashboard/cities-admin/page.tsx:14` imports `Switch` (barrel import), 1 row (`page.tsx:99`).
- `dashboard/bundles/page.tsx:46` imports `{ Skeleton, Switch }` (barrel import), 2 rows (`page.tsx:299,579`).
- `primitives/CookieConsent.tsx:7` imports `Switch`, `CookieSettingsModal` renders 3 rows: Notwendig/Analyse/Marketing (`CookieConsent.tsx:363,374,385`).

---

## Use / Don't

**Use:** binary on/off settings (notifications, cookie categories, feature toggles).
**Don't:** single-select from 3+ mutually exclusive options (use a radio group or `PillToggle mode="single"`). Don't use for "add to this list" semantics (use `Checkbox`).

---

## Related

- [FieldLabel.md](FieldLabel.md) / `FieldHelper.tsx`: pair for form-field anatomy when a switch sits inside a longer form (vs. the built-in `label`/`subLabel` row pattern used in settings lists).
- `CookieConsent.tsx`: the richest real consumer (3 switches in one modal).
