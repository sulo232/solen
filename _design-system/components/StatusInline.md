<!-- exists-check: net-new doc, extends/replaces StatusPill.md , StatusPill.tsx was DELETED 2026-06-30 (REMOVED.md:46) and superseded by salon/StatusInline.tsx, which had a registry row but no dedicated component doc until this file (A3 registry audit finding 1). StatusPill.md is kept for history with a tombstone banner, not deleted. -->

# StatusInline

**File:** [app/[locale]/_components/salon/StatusInline.tsx](../../app/[locale]/_components/salon/StatusInline.tsx)
**Layer:** 3 (semantic UI: color IS the meaning: open word in `s-open` green, closed word in `s-closed` red; universal open/closed convention, `StatusInline.tsx:19-20`).
**Status:** documented-from-code 2026-07-12, not owner-locked. Live, 2 real call-sites.

---

## Purpose

Split-color inline open/closed status: the status word ("Geöffnet"/"Geschlossen") renders in its semantic color, the trailing time detail renders in muted ink, with NO pill chrome (`StatusInline.tsx:1-21`). Extracted V3-D232 (2026-05-27) from `SalonSidebar` for reuse, and is the literal replacement for the deleted `StatusPill` (superseded 2026-06-30: see [StatusPill.md](StatusPill.md), [REMOVED.md:46](../REMOVED.md)).

Per the file's own header comment, this follows a captured Fresha pattern (les-mains-basel @ 1440): inline text, no pill background/radius: matched to Solen tokens (muted grey → `s-ink-2`).

---

## Public API

```ts
function StatusInline({
  isOpen: boolean,
  label: string,       // e.g. "Geöffnet · Schliesst um 19:30" from computeOpenStatus
  size?: "sm" | "md" | "lg",   // sm=13px, md=15px (default), lg=16px
}): JSX.Element
```

(`StatusInline.tsx:24-33`. No `showDot` prop: this component never renders a dot, unlike the deleted `StatusPill`.)

---

## Behavior (from code)

- `label` is split on the first space into `head` (the status word) and `rest.join(" ")` (`tail`, everything else): `StatusInline.tsx:34,37`. The doc comment (`StatusInline.tsx:13-17`) expects the caller's label to already be shaped like `"Geöffnet · Schliesst um HH:MM"` or `"Geschlossen · Öffnet HH:MM"` (single leading word, then the rest).
- `head` renders `font-semibold` + `text-s-open` (`#1F8900`) when `isOpen`, else `text-s-closed` (`#DC2626`) (`StatusInline.tsx:41-43`, tokens per `tailwind.config.js:174,193`).
- `tail` (if non-empty) renders `text-s-ink-2 font-normal` (`StatusInline.tsx:44`).
- **No separator dot.** Code comment V3-D442 (`StatusInline.tsx:35-36`): "no separator dot. The green/red head vs grey tail colour IS the separator": matches taste rule 2 (contrast between adjacent elements IS the separator, don't also add a `·`).
- Sizes (`StatusInline.tsx:38`): `sm` → `text-[13px]`, `md` (default) → `text-[15px]`, `lg` → `text-[16px]` (matches Fresha per comment).
- Root element is `<span className="font-body inline-flex items-baseline gap-1.5">`: an inline element, safe inside a meta row.

---

## Token usage (from code)

| Token | Hex | Where |
|---|---|---|
| `s-open` | `#1F8900` | open-state head word (`tailwind.config.js:174`) |
| `s-closed` | `#DC2626` | closed-state head word (`tailwind.config.js:193`) |
| `s-ink-2` | (grey) | tail (time detail) text |

---

## Real call-sites

- `salon/SalonHeader.tsx:118`: `<StatusInline isOpen={status.isOpen} label={status.label} size="md" />` (salon-detail H1 meta row)
- `salon/SalonSidebar.tsx:154`: `<StatusInline isOpen={status.isOpen} label={status.label} />` (default `md`, desktop sticky sidebar)

---

## Use / Don't

**Use:** any open/closed status readout on salon-detail surfaces (header, sidebar): the current single-source replacement for the deleted `StatusPill`.
**Don't:** rebuild a pill-chrome status component (`StatusPill` is deleted, not to be recreated). Don't add a separator dot between `head` and `tail`: the color contrast already separates them (taste rule 2). Don't use for non-open/closed binary states (active/inactive tab = `TabPill`, verified/unverified = a purpose-built component).

---

## Related

- [StatusPill.md](StatusPill.md): the deleted predecessor this component replaces (kept for history).
- `salon/SalonHeader.tsx`, `salon/SalonSidebar.tsx`: the two real call-sites.
- `COMPONENT_REGISTRY.md` Salon table: registry row for this component.
