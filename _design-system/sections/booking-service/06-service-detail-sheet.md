<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md section 7, row "Variant /
     add-on picker" (read first), which records that this sheet already exceeds every app in the
     sample. Net-new as a per-section spec. `npm run exists "booking service"` returns
     ServiceDetailSheet as a COMPONENT hit and no spec for it, plus a GRAVEYARD hit for
     SalonServicesSheet (removed 2026-07-19), which is a DIFFERENT surface (the PDP's full-screen
     service picker) and is not being re-proposed here. -->

# Service detail sheet (options and add-ons) , section spec

**Reference:** not in `_design-system/sections/_measured/booking-service.json`. The sheet is closed at rest, so every number below is read from source and labelled as such · `CORPUS.md` section 7, row "Variant / add-on picker"
**Component:** `components-legacy/booking/ServiceDetailSheet.tsx`, mounted from `ServicesStaffStep.tsx:611-625`
**Layer:** 1 chrome (full-screen overlay) + Layer 3 child (ToggleCircle)

## Layout

```
 +-------------------------------------------------+  fixed inset-0, z-60, white
 |                                        ( X )    |  40px circle on sunken
 |  Herrenschnitt                                  |  28px / 700 Inter Tight
 |  Waschen, Schnitt, Styling.                     |  15px s-ink-2
 |                                                 |
 |  Variante                                       |  17px / 700
 |  Erforderlich                                   |  13px / 500 grey
 |  Kurz                                     ( o ) |  16px/600 + 13px meta, 22px radio
 |  ----------------------------------------       |  divide-y at 6% ink
 |  Lang                                     (o)   |
 |                                                 |
 |  Extras                                         |  17px / 700
 |  Optional                                       |  13px grey
 |  Bartpflege                               (+)   |  ToggleCircle lg
 +-------------------------------------------------+
 |  CHF 45          [ Entfernen ]  [ Fertig ]      |  22px/700 total, two buttons
 |  30 Min                                         |  13px grey
 +-------------------------------------------------+
```

Rendered through `createPortal` into `document.body`, so it escapes the step's stacking context entirely.

## Measured

**Nothing here was measured.** The sheet mounts only when `sheetServiceId` is set (`ServicesStaffStep.tsx:611`), which requires a tap on a service that has add-ons or options. The measurement is of the resting page. Values below are source, with the file's own line numbers.

| item | value | source |
|---|---|---|
| shell | `fixed inset-0 z-[60] flex flex-col bg-white` | `:127` |
| entrance | spring from `y: 100%`, damping 34, stiffness 320 | `:129-131` |
| close control | `h-10 w-10 rounded-full bg-s-bg-sunken`, `X` 20px `strokeWidth 2.2` | `:137-139` |
| title | 28px / 700 / `font-heading` / `leading-tight` / `tracking-[-0.01em]` | `:144` |
| description | 15px `leading-relaxed text-s-ink-2` | `:148` |
| group label | 17px / 700 `font-heading` | `:154, :196` |
| group sublabel | 13px / 500 `text-s-ink-2` ("Erforderlich"), 13px `text-s-ink-2` ("Optional") | `:157, :199` |
| option row | 16px / 600 name, 13px `text-s-ink-2 tabular-nums` meta, `py-4` | `:171-175` |
| option radio | 22x22 `rounded-full border-2`, 11px ink dot when on | `:180-184` |
| row divider | `divide-y divide-s-ink/[0.06]` | `:160, :200` |
| add-on control | `ToggleCircle size="lg"` (36px) | `:217` |
| footer | `border-t border-s-border px-4 py-3.5` | `:225` |
| footer total | 22px / 700 `font-body` `leading-none tabular-nums` | `:232` |
| footer meta | 13px `text-s-ink-2` | `:239` |
| secondary button | `rounded-btn border border-s-border px-5 py-3.5` 15px / 600 ink | `:249` |
| primary button | `rounded-btn bg-s-ink px-7 py-3.5` 15px / 600 white | `:257` |

## Tokens

- Radius: `rounded-btn` (99px) on both footer buttons, `rounded-full` on the close control and the radios. The sheet itself is full-bleed with no radius, so the locked sheet radius of 28 does not apply: this is a full-screen surface, not a bottom sheet with a visible top edge.
- The row divider is `s-ink` at 6 percent rather than the `s-border` hairline used everywhere else on this screen.
- Total is `font-body` (Inter) while every other heading in the sheet is `font-heading` (Inter Tight), the same split the running total bar uses.

## Interaction

- **Opens** from the ToggleCircle of any service that has add-ons or options. A service with add-ons but no required option commits to the cart at the moment the sheet opens, so the sheet is a refinement surface, not a confirmation one (`ServicesStaffStep.tsx:452-461`).
- **Every pick commits live.** Choosing an option calls `onChange` immediately; toggling an add-on commits as soon as the selection is valid, meaning a required option has already been chosen (`ServiceDetailSheet.tsx:100-119`). There is no separate confirm.
- **A chosen option replaces the base price and duration** rather than adding to them, and the cart is rebuilt from scratch on every commit so totals cannot drift (`ServicesStaffStep.tsx:207-243`).
- **The footer price shows a from-price only while no option is chosen** (`showFrom`, `:123, :231-235`); once one is picked it shows the real total and the duration line appears.
- **Entfernen** removes the service and all its add-ons and closes the sheet (`ServicesStaffStep.tsx:245-254`). **Fertig** only closes (`:256`), because the changes are already committed.
- The price line re-animates on every change, keyed on the value, 220ms.

## Against the floors

- **Nothing here can be graded against a measured number.** Listed in the README under "Not yet measured".
- **Display anchor (>= 28px):** the sheet's title is 28px in source, which is the only element anywhere on this route's surface that reaches the floor. It is inside an overlay, so it does not give the underlying screen an anchor.
- **Size ceiling (<= 4 per screen):** source shows 28, 22, 17, 16, 15, 13 inside the sheet alone, six sizes. Not measured, so not counted in the screen totals in the README.
- **Touch targets:** the option rows are `py-4` around a two-line stack, comfortably over 44px; the 22px radio is decorative rather than the hit target, since the whole row is the button (`:164-168`). The close control is 40x40, 4px under the floor. The add-on rows use the same full-row button with a 36px ToggleCircle inside.
- **Hairline consistency:** the sheet's internal dividers are `s-ink/[0.06]`, not the locked `s-border` `#E4E4E7` used by the rows in `03`. Two divider treatments on one flow.
- **Semantic colour:** none in the source.

## Intentional deviations

- **Options and add-ons fold into one sheet.** `CORPUS.md` section 7 records that this exceeds every reference in the sample, which uses a modal for variants and a separate upsell step for add-ons.
- **No dimmed backdrop.** The sheet is opaque and full-screen (`:127`), where the sampled apps put a centred modal over a dimmed list (`CORPUS.md` section 6). The list does not stay visible behind it.
- **Live commit, no confirm button.** "Fertig" closes rather than saves, which is the opposite of the modal convention in the sample.

## Empty state

Unreachable. The sheet only opens for a service that has at least one add-on or one option (`ServicesStaffStep.tsx:452-462`), so it cannot render with both lists empty.

## Provenance

- Fresha options and add-ons, Variant A (`ServicesStaffStep.tsx:610`)
- Owner 2026-07-19 , the live-commit behaviour and the ToggleCircle convention shared with the row
- `CORPUS.md` section 7 , the verdict that this component already exceeds the sample
