<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md section 4 and
     _design-system/sections/booking-staff/CORPUS.md pattern 9, which asked whether this echo exists
     in Solen and recorded that it was "not verified in Solen's DateTimeStep.tsx". This file answers
     it with a rendered measurement. `npm run exists "date time step"` returns DateTimeStep.tsx. -->

# Stylist recall pill , section spec

**Reference:** `_design-system/sections/_measured/booking-datetime.json`, `bandAnatomy.staffChip` · `booking-staff/CORPUS.md` pattern 9 (the downstream echo of the staff choice)
**Component:** `components-legacy/booking/DateTimeStep.tsx:162-186`
**Layer:** 1 (chrome), with a real photograph inside it

## Layout

```
y=68  +--------------------+
      | (o) Jonas       v  |   120 x 42, radius 9999, hairline, transparent fill
      +--------------------+
       28px avatar  14/500  ChevronDown 16
```

Left aligned to the page gutter, one row, nothing beside it.

## Measured

| item | value |
|---|---|
| pill | [16, 68, 120, 42], radius 9999, background `rgba(0, 0, 0, 0)`, border 1px `rgb(228, 228, 231)`, padding `6px 12px 6px 6px` |
| name | 14px / 500 / Inter / `rgb(10, 10, 10)` / line-height 21 / count 1 / "Jonas" |
| avatar | 26 x 26 rendered image area, 676 px, the only photograph on the screen |
| card signature in band 0 | radius 9999, border 1px `rgb(228, 228, 231)`, background transparent, padding `6px 12px 6px 6px`, count 1, example 120x42 |

The avatar element is `h-7 w-7` (28px) with `overflow-hidden` and a 1px border, so the image inside it renders at 26 x 26 = 676 px. Measured area and source agree.

**This band is 42px tall.** Every other tappable control on the screen is 43 (slot pills), 48 (the CTA) or 88 (day tiles).

## Tokens

- Pill: `flex items-center gap-2 rounded-full border border-s-border py-1.5 pl-1.5 pr-3`, hover `border-s-ink/25`
- Avatar wrapper: `grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-s-border bg-white`. The white fill is an owner-specified fix: the fallback `Users` glyph was blending into the sunken background behind it.
- Name: `text-[14px] font-medium text-s-ink`
- Affordance: `ChevronDown size={16} strokeWidth={1.9} className="text-s-ink-2"`. Clickability is signalled by the chevron and the border, not by colour, which is the locked rule.
- Fallback with no stylist picked: `Users size={14} strokeWidth={1.6}` and the label `tStaff('any')`.

## Interaction

- Tapping it calls `goToStep(staffList.length > 1 ? 'staff' : 'services-staff')` (`:165`). On a one-stylist salon it lands on the service step, because there is no staff step to return to.
- It is not a filter and not a menu. It navigates.
- **It duplicates the back arrow's destination on this screen.** Both the chrome's back control and this pill return to the staff step. The pill adds recall (it names who is selected), the arrow does not.

## Against the floors

- **Touch target (>= 44px): FAIL by 2px.** 120 x 42, measured. `py-1.5` (6 + 6) plus a 28px avatar plus 2px of border is 42. Going to `py-2` clears it.
- **Imagery (FLOORS LAW 2): EXEMPT surface, and this is the whole of its photography.** 676 px on a 402x844 viewport is 0.2%. The floor exempts form surfaces by name, so this is not a fail, and adding a decorative photo to raise the number is refused by the same floor.
- **Locked radius: PASS**, a pill control.
- **CORPUS answered.** `booking-staff/CORPUS.md` pattern 9 records that 3 of 4 corpus apps echo the chosen provider on the following screen and that the pattern was "not verified in Solen's `DateTimeStep.tsx`". Verified: it exists, it carries the stylist's photograph and name, and it is tappable back to the choice. Solen matches the pattern.

## Intentional deviations

- **The echo is a control, not a summary line.** In the corpus the echo is usually a static header line. Here it is the only way back to the stylist choice other than the generic arrow, which is a stronger version of the pattern rather than a weaker one.
- **No availability copy on it.** Consistent with the staff step: there is no per-stylist availability endpoint, so any "next free" text would be fabricated.

## Empty state

- **No stylist picked** (`selectedStaffId === 'any'`, which is the default): the avatar slot renders the `Users` glyph and the label reads the "Egal" string. Not measured, this run picked Jonas deliberately so the downstream pay step would carry a real name.
- **Stylist with no `avatar_url`:** same `Users` glyph fallback. Not measured.

## Provenance

- The stylist pill replaced the older bespoke date affordances when the shared `DateTimePicker` primitive took over the strip, the grouped slots and the month sheet (`DateTimeStep.tsx:188-192`)
- Owner-specified fix, undated in source , the white circle behind the fallback glyph
- V3-D445 , one `DateTimePicker` primitive, no bespoke date UI
