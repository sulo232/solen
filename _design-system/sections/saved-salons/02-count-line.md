# The count line, "2 Salons"

**Reference:** `_measured/saved-salons.json`, the 13px role inside band 1. The line has no band of
its own; see Measured.
**Component:** `app/[locale]/_components/profile/FavoritesList.tsx:98-100`
**Layer:** 1 chrome. Four lines of JSX, no registered component, and none is needed for a label.

## Layout

```
   84   main starts, px-4 pt-4
  100   2 Salons                                    13/400, #6B6B6B
  120
        (mt-6, 24px)
  144   [ card 1 ]
```

One paragraph, left aligned, directly under the header. It is the entire chrome of this screen.
There is no filter row, no sort control and no tab bar between the title and the first card.

## Measured

**No band.** The count line is a bare `<p>` with no heading child and no landmark tag, so it fails
both tests `extractSections` uses to promote a node. Its text role is measured inside band 1:

| size | weight | family | colour | line-height | count | sample |
|---|---|---|---|---|---|---|
| 13 | 400 | Inter | `rgb(107, 107, 107)` | 19.5 | 1 | "2 Salons" |

Its box is **derived, not measured**, and the derivation closes to the pixel: band 1 (`main`) starts
at 84 and the page wrapper is `max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8` (`favorites/page.tsx:76`),
so the line starts at 84 + 16 = 100, left 16, width 358. Its line-height is 19.5, so it ends at
119.5, and band 2 carries `mt-6` (24px). 119.5 + 24 = 143.5, and band 2 is measured at top 144. The
arithmetic and the render agree.

"2 Salons" is the real count: the account rendered two cards.

## Tokens

- `font-body text-[13px] text-s-ink-2`, so Inter 13/400 at `#6B6B6B`. Measured `rgb(107, 107, 107)`,
  which is `#6B6B6B`, so token and render agree.
- Copy key `Profile.salonsCount`, `{count} {count, plural, one {Salon} other {Salons}}`
  (`messages/de.json:5981`). The same key feeds the account hub's Gespeichert row, so one fact has
  one phrasing on both screens.

## Interaction

None. It is a label.

## Intentional deviations

- **The count is printed at all.** `saved/CORPUS.md` measured this as a minority pattern, 23 of 80
  apps. It stays because the same number already renders on the account hub row, so removing it
  here would make the two screens disagree about one fact.
- **No sort control**, against 18 of 80 apps that offer one. The corpus found zero of 131 saved
  screens grouping saves by anything, and chronological newest-first is the only ordering it could
  observe. That is what the route does: `favorites/page.tsx:35` orders by `created_at` descending,
  then re-sorts after the `.in()` fetch at lines 62-63 because PostgREST does not preserve id order.

## Empty state

Not rendered. With zero favourites the server component renders `EmptyStateDiscovery` instead of
`FavoritesList` entirely (`favorites/page.tsx:80-99`), so there is never a "0 Salons" line.

There is a second, thinner zero state a customer can reach in the same session: removing the LAST
card returns `FavoritesList`'s own inline block (`FavoritesList.tsx:82-95`), a 15px `s-ink-2` line
plus a 14px `s-accent` link to `/inspo`. So this screen has two different zero states, they do not
look alike, and which one a customer sees depends on whether the page was reloaded.

## Against the floors

- **13/400 is on the locked scale** (LOCKFILE 12, body-small mobile). No violation.
- **It contributes one of the screen's six sizes.** Removing it would take the screen from 5 own
  sizes to 4 and clear the ceiling, which is worth stating precisely because it is the cheapest
  size on the screen to lose and the least useful to lose: the count is the only real number the
  populated screen carries outside the rating, and FLOORS LAW 1c asks for at least one tabular or
  real number. Cutting it to pass a ceiling would break a floor.
- **The session-empty fallback authors 15px and 14px**, both on scale, and carries no photograph, no
  icon and no ink CTA. That is a different anatomy from both the locked `EmptyState` primitive and
  the registered `EmptyStateDiscovery` this same screen uses on a fresh load. Recorded in
  `05-empty-state.md`, not fixed.

## Provenance

- Owner 2026-06-13, the heart had no way to remove a favourite, which is why this client wrapper
  exists at all
- `saved/CORPUS.md` sections 1 and 2, the count line and the ordering
