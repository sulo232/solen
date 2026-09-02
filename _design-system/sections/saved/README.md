# Saved section docs

**READ THIS FIRST: the measured route for this folder does not exist.**

`_design-system/sections/_measured/saved.json` was captured at `/de/profile/saved`. There is no
such route. `find app -ipath "*saved*"` returns exactly two saved surfaces and neither is that
path:

- `app/[locale]/profile/favorites/page.tsx`, saved SALONS, titled "Favoriten"
- `app/[locale]/inspo/saved/page.tsx`, saved LOOKS, titled "Gespeichert"

`git log --all -- "app/[locale]/profile/saved"` returns nothing, so the path was never a route on
any branch. The mapping is a mistake in the measurement script's own route table:
`scripts/measure-sections.mjs`, `SPECLESS_SCREENS`, `{ folder: "saved", route: "/de/profile/saved", auth: true }`.
This folder's own `CORPUS.md` names the two real surfaces correctly in its header, dated
2026-07-29, so the corpus and the script disagree and the corpus is right.

**What `saved.json` actually measured: the localized 404 page.** Every text role in its `main`
band matches `app/[locale]/not-found.tsx` exactly:

| measured role in `saved.json` | source | match |
|---|---|---|
| 96px / 700 / Inter Tight / `rgba(0, 0, 0, 0)` / letter-spacing -4.8px / `"404"` | `not-found.tsx:24-29`, `text-[clamp(96px,18vw,120px)] tracking-[-0.05em] bg-clip-text text-transparent` | 18vw at 390 = 70.2, clamps to 96. -0.05em at 96 = -4.8px. Transparent because the fill is a clipped gradient. |
| 20px / 700 / Inter Tight / `"Diese Seite wurde abgeschnitten."` | `not-found.tsx:38-40`, `text-[clamp(20px,2.8vw,24px)]`, copy key `errors.404_title` (`messages/de.json:3474`) | 2.8vw at 390 = 10.9, clamps to 20. |
| 14.5px / 400 / Inter / `rgb(107, 107, 107)` / `"Verschoben oder nie da gewesen. Ihr naechster Termin ist trot"` | `not-found.tsx:42-44`, `text-[14.5px] text-s-ink-2`, copy key `errors.404_description` | exact |
| 14px / 600 / Inter Tight / white, on a card `radius 99`, `background rgb(10, 10, 10)`, `padding 14px 28px`, 141x48 / `"Salons finden"` | `not-found.tsx:47-52`, `rounded-btn bg-s-ink px-7 py-3.5 text-sm font-semibold`, copy key `errors.404_browse` | `text-sm` is 14px, `py-3.5 px-7` is 14px 28px |
| 13.5px / 600 / Inter / `rgb(107, 107, 107)` / `"Zur Startseite"` | `not-found.tsx:53-58`, `text-[13.5px] font-semibold text-s-ink-2`, copy key `errors.404_home` | exact |

So the record's `redirectedAway: false` and `settled: true` are both true and both beside the
point: the URL never moved because a 404 renders in place. This folder therefore has **no
measurement of any saved screen at all**, and every number below is marked `not measured`.

**One thing I could not explain.** `saved.json` records `httpStatus: 200`. A missing route and an
explicit `notFound()` both produce 404. There is a second candidate path to the same rendered
page: `app/[locale]/[city]/[category]/page.tsx` calls `notFound()` at line 206 for an unknown
city or category, and `profile` / `saved` would read as that pair. Neither candidate explains a
200. `curl -i http://localhost:3457/de/profile/saved` against the running dev server settles it.
I could not run it: nothing is listening on 3457 now, and the control proves that rather than a
route problem, because the same curl against `/de/profile`, a route that does exist, also returns
nothing.

## What this folder specs instead

Files 01 to 04 spec **`/de/profile/favorites`**, the saved-salons surface, because that is the
screen this folder's corpus grades (its pattern table cites `FavoritesList.tsx:101` by line) and
it is the one that composes the registered `SalonCard`. File 05 specs **`/de/inspo/saved`**, the
saved-looks surface, because the bottom tab bar's heart lands there
(`BottomNav.tsx:96`, `href: "/inspo/saved"`) and a spec of "saved" that omitted it would describe
a screen most customers never reach.

| # | File | Section | Component | Route |
|---|---|---|---|---|
| 1 | `01-header-title.md` | Global header, "Favoriten" title | `layout/Header.tsx:472` | `/de/profile/favorites` |
| 2 | `02-count-line.md` | The count line, "N Salons" | `profile/FavoritesList.tsx:98-100` | `/de/profile/favorites` |
| 3 | `03-saved-grid.md` | The saved-salon grid | `FavoritesList.tsx:101-107` + `components-legacy/SalonCard.tsx` | `/de/profile/favorites` |
| 4 | `04-empty-state.md` | Zero state, banner + hint + top-rated rail | `profile/EmptyStateDiscovery.tsx` | `/de/profile/favorites` |
| 5 | `05-saved-looks.md` | The second saved surface | `app/[locale]/inspo/saved/page.tsx` | `/de/inspo/saved` |

**This EXTENDS `CORPUS.md` in this folder and does not replace it.** Where the corpus reaches a
verdict (1 column on mobile, photo on every item, keep the heart, no per-card Buchen button), the
files below cite it rather than re-deriving it.

## Is the screen thin?

`/de/profile/favorites` is genuinely thin, and that is the finding rather than a gap in this
spec. Populated, it is three bands: a title that lives in the global header, a 13px count line,
and a grid. There is no filter, no sort, no tab bar, no section headings, and the corpus says not
to add them (zero of 131 saved screens grouped their saves by anything). The screen's richness in
the zero state is the opposite: `EmptyStateDiscovery` renders more distinct elements empty than
the screen ever renders full.

## What was folded

Nothing could be folded from a measurement, because there is no measurement of these screens.
The rule this folder will follow when one is taken: the all-containing `<main>`
(`favorites/page.tsx:76`, `max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8`) is the page, not a section,
and the `<div className="mt-2">` that wraps the empty state (`favorites/page.tsx:81`) is a wrapper,
folded into `04-empty-state.md`.

## Against the floors

**Not gradeable.** The floors are measured on a rendered first viewport, and no render of either
saved route was captured. Two things can be said without a measurement, and neither is a grade:

1. The imagery floor is the one floor this screen archetype is built to pass **by content**: the
   card photo comes from `salons.cover_photo_url`, never from a baked-in `src`, which is exactly
   what FLOORS LAW 2 asks for. Whether it clears 33% of the viewport at 390x844 is not measured.
2. FLOORS LAW 8, the same thing looks the same everywhere, has a live open question here that
   needs no measurement to state: **one product, two saved screens, two different card systems.**
   `/de/profile/favorites` renders `components-legacy/SalonCard.tsx`; `/de/inspo/saved` renders
   `ItemCard` / `VideoCard` in a `MasonryGrid`. They save different entities, so this is not
   automatically a defect, but the bottom-nav heart labelled "saved" reaches only one of them.

## Target ladder

The owner's decision, the salon page's own ladder: **anchor 30px, body 14px, ratio 2.14x, five
distinct sizes with four of them in the densest cluster, bold share 30%, three elevation levels,
emphasis carried by size and colour at weight 500 rather than by weight 600.** Where the source
literals below already collide with it (the empty state alone authors 22, 18, 17, 14.5, 14, 13.5,
13, 12.5), the file says so under `Against the floors` without proposing a fix.

## Not yet measured

Everything below is absent from `_measured/`, and the reason is one reason: the route in the
script's table does not exist, so neither real screen has ever been measured by this tool.

- `/de/profile/favorites` populated: every band box, every text role, the card grid geometry, the photo area share, the size and weight counts, the bold share, the elevation steps.
- `/de/profile/favorites` empty: the same list, for `EmptyStateDiscovery`.
- `/de/inspo/saved` populated and empty: the same list again, plus the masonry column geometry.
- The header title band on both routes. `profile-hub.json` measures the same `Header.tsx` band on `/de/profile` at height 84 with an 18px/700 title; whether the "Favoriten" and "Gespeichert" titles render at the same size on their own routes is not measured. `/de/inspo/saved` does not use the header title slot at all, it draws its own 22px h1 in the body.
- Whether the count line and the first card row fit the first viewport at 390x844.
- What `/de/profile/saved` actually returns as an HTTP status.

**The one measurement that closes all of the above:** point `scripts/measure-sections.mjs` at
`/de/profile/favorites` and `/de/inspo/saved` with `--auth`, and fix the `saved` row in
`SPECLESS_SCREENS` so a later run cannot re-measure a 404. Not done here: this task's scope is
documentation only, and `scripts/` is a source file.
