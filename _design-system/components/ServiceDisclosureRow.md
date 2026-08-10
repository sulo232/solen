# ServiceDisclosureRow

<!-- exists-check: net-new vs _plans/BOOKING_SVC_TIERED.md, _design-system/components/PriceFrom.md,
     _design-system/components/SalonResultCard.md, _design-system/components/StatusInline.md, because
     BOOKING_SVC_TIERED.md is the PLAN that parked this exact rollout ("roll out the tap-to-expand
     pattern to the DASHBOARD, SALON page, and SETTINGS ... surface 1 (salon services) MOCKUP built
     ... PAUSED, resume: owner approves the salon mockup") and holds no component contract; PriceFrom
     is the price string only and is composed INSIDE this row, not replaced by it; SalonResultCard and
     StatusInline describe a salon entity card and a semantic status word, neither of which is a
     service row or a disclosure. This file is the component contract that plan was waiting for. -->

`app/[locale]/_components/primitives/ServiceDisclosureRow.tsx`

Layer 1 (chrome: disclosure affordance). Status: new, 2026-08-09.

## Why it exists

The booking service step got a tap-to-expand service row on 2026-07-18 (owner-approved,
`public/_mockups/liftup-booking-services-tiered/index.html`): the row body is a tap target that
only opens the description, a small chevron flips when it opens, and selection lives on a separate
control to the right.

The rollout of that row to the salon page was planned the next day (owner 2026-07-19, *"all three,
plan it out"*), mocked up as `public/_mockups/liftup-salon-services-expand/index.html`, and then
PARKED in `_plans/BOOKING_SVC_TIERED.md` waiting on the owner. On 2026-08-09 he answered decision
10, verbatim: *"A like short n if its too long tap to expand yk"*. That is the approval the plan was
parked on, so the booking step's inline row was lifted into this primitive and both surfaces now
render it. There is one implementation, not two.

## API

```tsx
<ServiceDisclosureRow
  title={<h4 className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">{name}</h4>}
  meta={<p className="mt-1 text-[14px] text-s-ink-3 tabular-nums">{duration}</p>}
  description={service.description_de}
  price={<div className="mt-3 text-[15px] font-bold text-s-ink"><PriceFrom amount={price} label="ab" /></div>}
/>
```

| prop | type | notes |
|---|---|---|
| `title` | `ReactNode` | The name row. Sits beside the chevron. |
| `meta` | `ReactNode` | Duration line plus any suffix the surface adds (gender label). |
| `description` | `string \| null` | Salon-authored text. Null, undefined or blank collapses the whole affordance. |
| `price` | `ReactNode` | Rendered last, BELOW the description, matching the approved mockups' row order (name, duration, description, price). |
| `className` | `string` | Extra classes on the tap target. |

`title`, `meta` and `price` are nodes on purpose. Booking and the PDP have different locked type
rows (booking: name 600, price bold; PDP: name 500 per RANGE LAW A1, price via `PriceFrom emphasis`),
and passing class strings through props would make this component the owner of values that LOCKFILE
owns. What it DOES own is what the owner approved as a behaviour: the chevron, its flip, the
accordion, its timing, and the description type.

## What is frozen inside it

- chevron: Lucide `ChevronDown`, `size={18}`, `text-s-ink-3`, `transition-transform duration-[260ms] ease-glide`, `rotate-180` when open
- description panel: height-auto accordion, `duration: 0.18` + `GLIDE_EASE` (the 2026-07-18 polish round dropped this from `ENTER_DURATION` because the expand read too slow)
- description text: `pr-2 pt-2.5 text-[14px] leading-relaxed text-s-ink-2`
- tap target: `min-w-0 flex-1 text-left` + `butterPress("row")`

## Rules

- **The trailing control is NEVER inside this component.** Booking keeps its `ToggleCircle` as a
  sibling (it is the only select control); the PDP keeps its "Buchen" link as a sibling. Nesting an
  interactive control inside the disclosure button would make the tap ambiguous, which is exactly
  what the 2026-07-18 design separated.
- **No description, no affordance.** The component renders a plain `div` instead of a `button` and
  drops the chevron. A chevron that opens nothing is a dead click.
- **Not for FAQ prose** (that is `FAQItem`, a native `<details>`) and not for a row whose tap should
  navigate.

## Call-sites

- `app/[locale]/_components/salon/SalonServices.tsx` (salon PDP service list)
- `components-legacy/booking/ServicesStaffStep.tsx` (booking service step)

## Still parked

`_plans/BOOKING_SVC_TIERED.md` also lists the DASHBOARD and SETTINGS surfaces for this pattern.
Decision 10 named the salon page only, so those two stay parked; when they resume they use this
component.
