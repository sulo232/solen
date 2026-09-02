<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md pattern 3 (the venue
     photograph, 10 of 49 overall but 10 of the ~12 marketplace apps) and its components table, which
     records this hero as "already composed, already data-driven, none" required. `npm run exists
     confirmation` returns 10 hits including this route and BookingConfirmation.tsx; nothing new is
     proposed here. -->

# Cover-photo hero , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json`, `bandAnatomy.hero` · `CORPUS.md` pattern 3 and the grid section (a full-bleed hero that ignores the gutter, in 4 of the closest apps)
**Component:** `components-legacy/booking/BookingConfirmation.tsx:400-423`
**Layer:** 1 (chrome)

## Layout

```
y=84   +-------------------------------------------------------+
       |                                                       |
       |          salon cover photo, full bleed                |  402 x 240
       |          object-fit: cover, radius 0                  |
       |                              ( ? )  frosted help      |
       +-------------------------------------------------------+
y=324
```

Edge to edge. The photo ignores the 20px page gutter every other band on this screen uses.

## Measured

| item | value |
|---|---|
| wrapper | `DIV.relative h-[240px] w-full overflow-hidden`, [0, 84, 402, 240] |
| image | [0, 84, 402, 240], `object-fit: cover`, border-radius 0 |
| source | `images.unsplash.com` through `/_next/image`, so it is `props.salonCoverUrl`, data driven |
| image area | 96480 px, the only photograph on the screen |
| overlay | **none.** A scan of every element on the page for a gradient `backgroundImage` returned nothing |

The hero starts at y 84 rather than 0 because the global sticky header occupies the first 84px. The header is transparent, so the photo is visible behind it, but the photo's own box begins below it.

**The help control inside the hero was not measured.** Source: `inset-x-4 top-4`, a 44px circle carrying `FROST_GLASS`, so it sits at about y 100 over the photograph.

## Tokens

- Wrapper: `relative h-[240px] w-full overflow-hidden`
- Image: `next/image` with `fill`, `sizes="(max-width: 440px) 100vw, 440px"`, `className="object-cover"`, `priority`, `aria-hidden`
- Help control over the photo: `grid h-11 w-11 place-items-center rounded-full text-s-ink` plus `FROST_GLASS` (`lib/frost-glass.ts`), which is the locked treatment for a control over a photograph
- With no photo the control drops the frost and gains `border border-s-border bg-white`, which is the locked flat treatment on a calm surface

## Interaction

- The photograph is decoration in the accessibility tree (`aria-hidden`, empty `alt`) and carries no tap target. Tapping the salon is done in `02`, one band below.
- The help circle links to `/{locale}/help`.
- **There is deliberately no back control here.** V3-D461, one up-affordance and never both: the global header already renders a back arrow on this deep page, and a second frosted circle on the photo duplicated it. Render-verified 2026-07-16.

## Against the floors

- **Imagery (FLOORS LAW 2): EXEMPT by name, and it nearly clears the number anyway.** The floor's exemption list is "forms, checkout payment step, legal, receipts", and a booking confirmation is a receipt. Measured regardless: 96480 px of photography in a 402x844 first viewport is **28.4%**, against the floor's roughly one third. It is the only screen in this four-screen pass that carries meaningful imagery at all.
- **Content, not decoration: PASS.** The `src` is `props.salonCoverUrl`, resolved from the booking. The floor's 2026-07-25 clarification bans a hero whose `src` is baked into a component, and this is the opposite: the photo IS the salon the customer just booked.
- **Elevation is earned by the background: PASS.** A control over a photograph gets frost, which is the contract's own decision tree.
- **No fabricated fallback: PASS.** With no `salonCoverUrl` the hero is omitted entirely rather than rendering a grey box or a placeholder image, and the help control renders flat instead. That matches the no-bare-grey-box rule the imagery lock states, by omission rather than by substitute. Not measured; this salon has a photo.
- **FLOORS LAW 1 (a), a photographic focal is present: PASS.** This is the only one of the four screens in this pass that clears it.
- **CORPUS pattern 3: MATCHED.** 10 of 49 corpus screens carry the venue photograph and 10 of the roughly 12 marketplace apps do. The corpus names this explicitly so nobody simplifies toward the 39-of-49 majority, which is made of utilities.

## Intentional deviations

- **Full bleed with no radius and no overlay**, where Fresha reverses the salon name out over the photo. Solen puts the name below the photo instead (`02`), and the measurement confirms there is no gradient scrim anywhere, which is what makes that possible: no text sits on the image.
- **240px, a fixed height**, not a ratio. Every other photographic surface in the product sizes by aspect.

## Empty state

- **No `salonCoverUrl`:** the entire hero is dropped and the help control renders in a `flex items-center justify-end px-4 pt-4` row instead (`:417-422`). The screen then opens on the salon row with no photograph, which fails FLOORS LAW 1 (a) and takes the imagery number to zero. Not measured.

## Provenance

- V3-D461 , one up-affordance on a deep page, never both, render-verified 2026-07-16
- `CORPUS.md` pattern 3 , the venue photograph, kept deliberately against the corpus majority
- FLOORS LAW 2, 2026-07-25 clarification , imagery is satisfied by real content, never by a baked-in decorative `src`
