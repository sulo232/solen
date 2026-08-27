# The count line, "N Salons"

**Reference:** no screenshot, and **no measurement**. See this folder's `README.md`.
**Component:** `app/[locale]/_components/profile/FavoritesList.tsx:98-100`
**Layer:** 1 chrome, four lines of JSX. No registered component.

## Layout

```
   4 Salons                                   13/400 s-ink-2
   (mt-6 gap to the grid)
   [card] ...
```

One paragraph, left aligned, directly under the header. It is the entire chrome of this screen:
there is no filter row, no sort control and no tab bar.

## Measured
**not measured.**

## Tokens
Source literals, read from `FavoritesList.tsx:98`, not measured:
- `font-body text-[13px] text-s-ink-2`, so `#6B6B6B` at 13px, weight 400
- Copy key `Profile.salonsCount` with a live `count`, the same key the `/de/profile` Gespeichert row uses for its subline (`AccountHub.tsx:204`), so one fact has one phrasing on both screens

## Interaction
None. It is a label.

## Intentional deviations
- The count is printed. The corpus measured this as a minority pattern: 23 of 80 apps print a count on the saved screen. It is kept because the same number already renders on the account hub row, so removing it here would make the two disagree.
- No sort control, against 18 of 80 apps that offer one. The corpus's own finding is that zero of 131 saved screens grouped saves by anything and chronological-newest-first is the only ordering it could observe. That is what `favorites/page.tsx:35` does: `order("created_at", { ascending: false })`, re-applied after the `.in()` fetch at lines 62-63 because PostgREST does not preserve the id order.

## Empty state
Not rendered. When the list is empty the server component renders `EmptyStateDiscovery` instead
of `FavoritesList` entirely (`favorites/page.tsx:80-99`), so there is no "0 Salons" line.

There is a second, thinner zero state: when the customer removes the LAST card in the current
session, `FavoritesList` returns its own inline block (`FavoritesList.tsx:82-95`), a 15px
`s-ink-2` line plus a 14px `s-accent` link to `/inspo`, not the rich discovery empty state. The
comment says the rich one renders on a fresh load. So this screen has two different zero states
that a customer can reach in one session, and they do not look alike.

## Against the floors
- **13px at weight 400 is on the locked scale** (`ALLOWED_PX` 13, body-small mobile).
- The session-empty fallback authors **15px** and **14px** (`FavoritesList.tsx:85,88`), both on scale, and it carries no photograph, no icon and no ink CTA, which is a different anatomy from the locked `EmptyState` component. Recorded, not fixed.
- Everything measurable about this band: not measured.

## Provenance
- Owner 2026-06-13, the heart had no way to REMOVE a favourite, which is why this client wrapper exists at all
- Corpus `CORPUS.md` section 1 and section 2, count line and ordering
