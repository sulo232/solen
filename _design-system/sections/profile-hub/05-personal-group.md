# Persoenlich group, hair profile + saved salons + stamps

**Reference:** no screenshot. Measured live: `_measured/profile-hub.json`. **No band record of its own**, same reason as 03.
**Component:** `app/[locale]/_components/profile/AccountHub.tsx:174-212`
**Layer:** 1 chrome. Row anatomy is the shared block in `03-bookings-group.md`.

## Layout

```
  Persoenlich                                   12/600 s-ink-2
  [hair glyph]   Haarprofil                     15.5/500, no subline
                                          [>]
  [Heart]        Gespeichert                    15.5/500
                 4 Salons                       13/400, live favourites count
                                          [>]
  [Stamp]        Stempel                        15.5/500
                 Noch N bis zur Belohnung       13/400
                                    [n/m] [>]   optional end badge, 13/500 ink
```

Three rows: `/{locale}/profile/haarprofil`, `/{locale}/profile/favorites`,
`/{locale}/profile/stamps`.

## Measured (390x844, signed in)
Per-row geometry is **not measured**. Contributions to the screen's measured roles:
- 3 of the 7 elements in the **15.5px / 500 / Inter Tight** label role
- 2 of the 5 elements in the **13px / 400** subline role. Haarprofil carries no subline by design (owner 2026-08-05, "i dont think every settings needs explanation")
- 1 of the 4 elements in the **12px / 600** group-label role
- **The stamps end badge did not render at capture time.** It is `text-[13px] font-medium tabular-nums text-s-ink` (AccountHub.tsx:205), a role that would key as 13px / 500 / `rgb(10, 10, 10)`. No such role appears anywhere in `profile-hub.json`. The only 13px role measured is 400 weight at `rgb(107, 107, 107)`. So the measured account had `stamps === null`, meaning no active loyalty card with at least one stamp and room left.

## Tokens
- The Gespeichert heart is `text-s-ink`, NOT the `#FF3366` save-heart token. On a navigation row the heart is decoration; `#FF3366` stays the save token wherever it means "saved by you" (AccountHub.tsx:188-196, owner 2026-08-03 twice: "remove pink sh bit looks so out of place", then "why is heart icon pink n how did u not flag it ever").
- The Haarprofil glyph is not a Lucide icon. It is `/hair-patterns/wavy.png`, an existing discovery asset, rendered as a CSS mask so it inherits `text-s-ink` (AccountHub.tsx:294-315).

## Interaction
- All three rows navigate. The stamps count badge is display only.

## Intentional deviations
- The mockup's "Meine Stylist:innen" row is not wired. No per-customer rebook-with-a-past-stylist page exists (`npm run exists stylist` and "favorite staff" both came back empty except the unrelated homepage `FeaturedStylists` and a `/dev` route), so the row is omitted rather than pointed at an invented destination (AccountHub.tsx:174-179).

## Empty state
Every row persists. Gespeichert shows the real favourites count from a head-only `count: "exact"`
query (`profile/page.tsx:84`); Stempel swaps to `stampsRowEmptySub` and drops the end badge when
there is no qualifying card.

## Against the floors
- Contributes **1 element** (the group label) to the **33.33% weight >= 600 FAIL**.
- Renders 3 of the seven distinct sizes (15.5, 13, 12), none uniquely. When a stamps card exists it adds a fourth measured role at 13px/500, which does not add a size but does add to the weight spread.
- **15.5px off-scale**: see `03-bookings-group.md`.
- Imagery 0. The Gespeichert row names a count of saved salons and shows none of their photographs, which is the whole screen's imagery failure in one row.
- **Against the ladder** (the benchmark ladder is `/de/salon/cuts-and-culture` measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, 30% of visible text at weight >= 600, 3 elevation steps, 34.66% photographic. The owner chose "same ladder everywhere", so it is this screen's target too.) This is the ONE group on the screen where the ladder's **34.66% photographic** could ever be earned, because Gespeichert is the only row whose underlying data is a set of salons that have photographs. It renders a count instead. Whether it should render photographs is a live design decision, not a defect to fix silently: if it ever does, `09-entity-consistency.md` names the component it would have to compose and the variant it would have to extend.

## Provenance
- Owner 2026-08-02, grouped-row hub
- Owner 2026-08-03, the heart on this row is ink, not pink
- Owner 2026-08-05, sublines that only restate the label are dropped (copy economy rule 1)
- FLOORS LAW 8/9, a saved salon renders through the real `SalonCard` on `/profile/favorites`, and this hub renders no store card at all
