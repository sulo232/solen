# Round-2 kit

Exists-check: `npm run exists kit` (run before any file in this folder was created) returned one
REMOVED hit (an unrelated continue-card date/weekday feature) and one unrelated DB table
(`makeup_kit_items`), no existing round-2 kit module. `npm run exists directions` listed every
round-1 and round-2 dev-direction file; none is a shared token/system/component kit, each screen
re-derives its own sizes, pill fills and card treatment inline, which is the exact drift
`_design-system/research/WHAT_IS_MISSING_2026-09-05.md` and `_plans/R2_LOOK_SYSTEMS.md` name as
round 1's failure. This folder is the mechanical form of that plan's Part A (the base recipes)
and Part B (the three look systems' deltas): one place every round-2 mockup reads from, so a
value is decided once instead of once per screen.

## How a builder uses it, in ten lines

```tsx
import { KitProvider, Card, SectionTitle, Meta, Price, Pill, StatusBadge,
         PrimaryButton, SecondaryButton, TextLink } from "../_kit";

export default function MyScreen() {
  const [selected, setSelected] = React.useState(0);
  return (
    <KitProvider system="lift">           {/* "lift" | "rule" | "tray", exactly one per screen */}
      <SectionTitle as="anchor">Your appointment is confirmed</SectionTitle>
      <Card variant="photo">
        <Meta>Zurich, Niederdorf</Meta>
        <Price amount={85} />
        <StatusBadge status="confirmed" label="Confirmed" />
      </Card>
      <Pill active={selected === 0} onClick={() => setSelected(0)}>Hair</Pill>
      <PrimaryButton onClick={() => {}}>Book appointment</PrimaryButton>
      <SecondaryButton onClick={() => {}}>Get directions</SecondaryButton>
      <TextLink href="/en/profile/bookings">Manage booking</TextLink>
    </KitProvider>
  );
}
```

## The rule

**A mockup contains no pill, badge, button, size, weight, radius or colour literal of its own;
it imports these.** If a screen needs a value this kit does not have, that is a finding to raise
(the kit is incomplete, or the screen needs a new base recipe added to
`_plans/R2_LOOK_SYSTEMS.md` Part A first), never a reason to write `text-[13.5px]` or
`rounded-[20px]` inline.

## What is in here

- `tokens.ts`: the type ramp (A5), spacing ladder (A6), radius values (A1/A7, with the C1
  capsule override), colour roles (A8) and the press-motion recipe (A9). Every constant carries
  its provenance in a comment.
- `systems.ts`: `SYSTEMS`, one entry per look-system key (`lift`, `rule`, `tray`): its
  one-sentence definition verbatim from Part B, its deltas from the base, and its discriminator
  (the one measurable thing a critic checks to prove a screen belongs to it).
- `KitProvider.tsx`: `<KitProvider system="lift">` wraps a mockup's tree once; `useSystem()` /
  `useSystemKey()` read the active system from inside any kit component.
- `Pill.tsx`: composes the real, registered `TabPill` primitive (never redraws it), capsule
  corner.
- `StatusBadge.tsx`: the exact `BookingCard.tsx` statusConfig shape, ink text + a semantic-hue
  icon (see the file's own header comment for the two changes and why).
- `PrimaryButton.tsx` / `SecondaryButton.tsx`: the one ink commit action and its neutral
  outline sibling, both carrying press-motion direction A.
- `TextLink.tsx`: the small blue clickable text recipe (never a fill, never a button, never
  body text).
- `Card.tsx`: the three A7 card treatments (`photo` / `grouped` / `entity`), border/shadow
  toggled per active system.
- `SectionTitle.tsx`, `Meta.tsx`, `Price.tsx`: the type-ramp steps pinned to components so a
  mockup never re-types a font-size.
- `index.ts`: the single import surface.
- `../kit-preview/page.tsx` (one level up, NOT inside this folder): every kit component in
  every state, all three systems switchable by `?s=lift|rule|tray`, for a critic to measure the
  kit itself in isolation from any one screen. It lives outside `_kit/` because Next.js's App
  Router treats any `_`-prefixed folder as private and excludes everything under it from
  routing (verified live: `.../_kit/preview` 404s, `.../kit-preview` 200s on the same server);
  that file's own header comment explains the same thing. Route:
  `/en/dev/directions-0905-r2/kit-preview?s=lift|rule|tray`.

## What is deliberately NOT in here

Anything the task brief did not name: no EmptyState/ErrorState/Skeleton/Avatar wrappers (those
registered primitives are composed directly by a mockup when needed, the same way `Pill.tsx`
composes `TabPill`, they do not need a kit-level indirection layer). No dashboard/operator
recipes (FLOORS LAW scope line: this kit governs customer screens only).
