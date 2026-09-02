<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md section 7, row "Empty
     state" (read first), which records this component as existing and wired. Net-new as a per-section
     spec vs components-legacy/ui/EmptyState.tsx and profile/EmptyStateDiscovery.tsx (the two other
     empty-state implementations, both read before writing this) and _design-system/research/
     TASTE_EMPTY_STATES.md (the 12-app evidence behind the locked anatomy, cited not duplicated).
     `npm run exists "booking service"` returns no spec for it. -->

# Zero-services state , section spec

**Reference:** not in `_design-system/sections/_measured/booking-service.json`. The measured salon (`cuts-and-culture`) has 11 bookable services, so this branch did not render. Every number below is source · `CORPUS.md` section 7, row "Empty state"
**Component:** `components-legacy/booking/EmptyServicesState.tsx`, chosen at `app/[locale]/salon/[slug]/booking/page.tsx:248, 274-283`
**Layer:** 1 chrome + Layer 3 (star, accent link)

This is not a section of the service step. It is the whole route in the state where the salon has no bookable services: the page picks between `BookingWizard` and this component, so the step chrome (`01`), the pill row (`02`), the group cards (`03`) and the running total bar (`04`) do not exist in this state at all.

## Layout

```
 +-------------------------------------------------+  min-h-[70vh], centred as one unit
 |                                                 |
 |                   ( store )                     |  80px disc, s-bg-sunken, Lucide 34px
 |            Keine Services verfuegbar            |  24px / 700 Inter Tight
 |     calm explanation, max-width 340             |  15px s-ink-2
 |                                                 |
 |   +-----------------------------------------+   |  rounded-card 16, hairline, elevation-1
 |   | [56px] Salon name                       |   |  16px / 600
 |   |        * 4.8 (54)  Address              |   |  star + 13px, blue count, grey address
 |   +-----------------------------------------+   |
 |                                                 |
 |   [        Zum Salon              ->     ]      |  52px ink CTA, radius 99
 |            Salon anrufen                        |  15px / 600 blue, only when a phone exists
 +-------------------------------------------------+
```

## Measured

**Nothing here was measured.** Source values, with line numbers.

| item | value | source |
|---|---|---|
| shell | `flex min-h-[70vh] flex-col`, inner `flex-1 items-center justify-center px-1 text-center` | `:44-46` |
| icon disc | 80x80 `rounded-full bg-s-bg-sunken`, `Store` 34px `strokeWidth 1.8` `text-s-ink-2`, `mb-6` | `:47-49` |
| headline | 24px / 700 `font-heading` `leading-[1.2] tracking-[-0.01em] text-s-ink` | `:50` |
| body | 15px `leading-relaxed text-s-ink-2`, `max-w-[340px]`, `mt-3` | `:53` |
| salon card | `mt-7 max-w-[420px] rounded-card border border-s-border bg-white p-3 shadow-elevation-1` | `:56` |
| thumbnail | 56x56 `rounded-[12px]`, cover photo or a sunken initial tile | `:58-65` |
| salon name | 16px / 600 `font-heading`, truncate | `:67` |
| rating | `Star` 14px `fill-s-star text-s-star` (`#FFC32B`) + 13px / 600 tabular ink | `:71-72` |
| review count | 13px tabular `text-s-accent` (`#276EF1`) | `:74` |
| address | 13px `text-s-ink-2`, truncate | `:78` |
| primary CTA | `h-[52px] max-w-[420px] rounded-btn bg-s-ink` 15px / 600 white + `ArrowRight` 17px, `mt-6` | `:87` |
| phone link | 15px / 600 `text-s-accent` + `Phone` 15px, `mt-4`, renders only when a phone exists | `:92-99` |

## Tokens

- `rounded-card` = 16px, the locked FORM/summary card radius, correctly paired with `shadow-elevation-1` (LOCKFILE radius row). This is the right card grammar for a single distinct entity, and it is deliberately not the 24px grouped-list card used in `03`.
- `s-star` `#FFC32B`, `s-accent` `#276EF1`, `s-bg-sunken` `#F4F4F5`, `s-ink-2` `#6B6B6B`.

## Interaction

- **Zum Salon:** a `next/link` to `/{locale}/salon/{slug}` (`:85-91`).
- **Salon anrufen:** `tel:` link with whitespace stripped, rendered only when the salon has a phone number (`:92-100`).
- **There is no back control and no close control in this state.** `BookingWizard` owns the flow's only back and X (`BookingWizard.tsx:186-218`) and it is not rendered here. The global header, breadcrumb and bottom nav are all removed on this route by `HideInBooking` (`HideInBooking.tsx:64-66`, `app/[locale]/layout.tsx:112-114, 129-131, 169-171`). So the only ways out of this screen are the ink CTA and the browser's own back gesture.

## Against the floors

- **Nothing here can be graded against a measured number.** Listed in the README under "Not yet measured".
- **NEVER-AGAIN floor 4, no muted focal: FAIL.** The focal is a `#6B6B6B` Lucide glyph on a `#F4F4F5` disc. That is the washed-out gray disc the floor names, and the same shape as the payment empty state it was written for.
- **Locked empty-state anatomy: FAIL on two named items.** The design-contract states row asks for a 3D category icon from `/icons/categories/` or a ghost preview and says "NEVER a grey Lucide disc", and asks for the state to sit "on the sunken tray inside a living page". This renders a grey Lucide disc, and the substrate is `min-h-screen bg-white` (`page.tsx:260`) with no tray. The headline is 24px / 700 against the row's 18 / 600, and the row's PROMISE-plus-GESTURE structure is present.
- **FLOORS LAW 9, composed from the registry: FAIL.** `components-legacy/ui/EmptyState.tsx` exists and is referred to as "the locked EmptyState" inside the registry's PaymentMethods row. This is a third hand-built empty state (`EmptyState`, `EmptyStateDiscovery`, this one) and it has zero rows in `_design-system/COMPONENT_REGISTRY.md`.
- **Blue is a small clickable accent only (taste rule 3): FAIL on the review count.** The `(N)` is `text-s-accent` inside a plain `div` with no link and no handler (`:68-79`), so it is blue text that cannot be tapped. The rule allows blue on review counts because they are "small tappable metadata".
- **Display anchor (>= 28px): FAIL, by 4px.** The headline is 24px.
- **NEVER-AGAIN floor 3, empty state as one centred unit: partly satisfied, not measured.** The cluster is centred (`:44-46`). The message-to-CTA gap the floor caps at 24px is not a single gap here: `mt-7` (28px) to the salon card, then `mt-6` (24px) to the CTA, with a card in between. Trapped dead space below the CTA is not measured.
- **No fabricated data: PASS.** Rating, review count, address and phone each render only when present.
- **The chrome exemption's stated premise does not hold in this state.** `HideInBooking.tsx:92-94` justifies stripping the global header on `/booking` with "the booking wizard draws an arrow on every step (BookingWizard.tsx:186)". In this branch the wizard is not rendered, so no arrow exists. The same comment records the owner reverting exactly this failure on 2026-08-09 for seven other routes: "we should keep the back. how else are they gonna go back?". The reason the two disagree is checkable and mechanical: the chrome exemption is matched on the path (`HideInBooking.tsx:66`) while the back control belongs to a component the page may not render (`page.tsx:248`).

## Intentional deviations

- **No step indicator.** The component's own comment (`:17-20`) explains the omission by saying the live wizard "is a 3-step indicator with different labels ("Auswahl / Datum & Zeit / ...")". **That description is stale.** `BookingWizard.tsx:40-44` records mockup 20, owner-approved 2026-06-11, as removing progress UI entirely: "NO progress UI anywhere". The conclusion (no indicator here) matches the live flow; the reason written next to it does not.
- **One ink commit plus one blue text link**, per CONTROL_ELEVATION C, rather than two buttons.

## Empty state

This IS the empty state. Its own degenerate case is a salon with no cover photo, no rating, no address and no phone, which renders the initial tile, the name, and the single CTA.

## Provenance

- Audit gap #8 , built from the approved mockup `public/_mockups/restraint/booking-empty-services.html` (`:9-10`)
- `_design-system/research/TASTE_EMPTY_STATES.md` , the 12-app evidence behind the locked anatomy this component predates
- Owner 2026-08-09 , "we should keep the back. how else are they gonna go back?" (`HideInBooking.tsx:85-86`)
