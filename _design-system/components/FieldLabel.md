<!-- exists-check: net-new doc, no existing components/*.md covers FieldLabel , shipped
     in app/[locale]/_components/primitives/FieldLabel.tsx (2 real call-sites + 4
     internal compositions inside TextInput/Radio/Select/Textarea), had a registry
     mention nowhere and no dedicated doc until this file (A3 registry audit finding 3,
     2026-07-12). -->

# FieldLabel

**File:** [app/[locale]/_components/primitives/FieldLabel.tsx](../../app/[locale]/_components/primitives/FieldLabel.tsx)
**Layer:** 1 (chrome): B&W text label, with a red `s-error` required-dot as the only accent.
**Status:** documented-from-code 2026-07-12, not owner-locked. Live, 2 real call-sites + 4 internal compositions.

---

## Purpose

Form-field label, always rendered ABOVE the field, never inside it (floating labels are banned per the file's doc comment, `FieldLabel.tsx:23`).

**Note:** the file comment (`FieldLabel.tsx:24`) says "Avant Garde Gothic 600 12px ink-1", but the shipped code renders `text-[14px]` at `font-semibold` (`FieldLabel.tsx:41`): this doc describes the shipped code (14px), not the stale comment.

---

## Public API

```ts
interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;   // trailing red dot 5px (#DC2626); wins if both required+optional passed
  optional?: boolean;   // trailing "optional" tag, ink-3, lowercase, 12px
  children: React.ReactNode;
}
```
(`FieldLabel.tsx:6-18`)

```tsx
<FieldLabel htmlFor="email" required>E-Mail-Adresse</FieldLabel>
<FieldLabel htmlFor="website" optional>Website</FieldLabel>
```

---

## Visual signature (from code)

- **Label text:** `font-body font-semibold text-[14px] leading-[1.3] text-s-ink`, `inline-flex items-center gap-[6px]` (`FieldLabel.tsx:40-44`).
- **Required dot:** `w-[5px] h-[5px] rounded-full bg-s-error`, `aria-hidden` (`FieldLabel.tsx:47-52`). Only renders when `required` is true; `optional` is ignored if both props are passed (`!required && optional` gate, `FieldLabel.tsx:53`).
- **Optional tag:** `font-normal text-[12px] text-s-ink-3 lowercase`: literal text "optional" (`FieldLabel.tsx:54-57`).

---

## Real call-sites

2 real call-sites: `profile/settings/BeautyProfileForm.tsx`, `profile/settings/SettingsForm.tsx`. Plus 4 internal compositions (rendered by other primitives, not directly by page code): `TextInput.tsx`, `Radio.tsx`, `Select.tsx`, `Textarea.tsx`: none of these actually import/render `FieldLabel` inline per their own field anatomy (per the doc-comment pairing pattern at `TextInput.tsx:89-95`, "Composes with `<FieldLabel>` (above) and `<FieldHelper>` (below)"), so treat this as "designed to pair with" rather than "wraps".

---

## Use / Don't

**Use:** the label above any form field (`TextInput`, `Select`, `Textarea`, `Checkbox`/`Radio` groups). Pair with `FieldHelper` below the field for validation/hint text.
**Don't:** render inside the field as a floating/placeholder-replacement label (banned per the file's own doc comment). Don't pass both `required` and `optional` expecting both to show: `required` wins.

---

## Related

- `FieldHelper.tsx`: the below-field sibling (helper/error/warning/success message).
- `TextInput.tsx` / `Select.tsx` / `Textarea.tsx` / `Radio.tsx`: the field primitives this label is designed to pair with.
