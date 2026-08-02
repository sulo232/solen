<!-- exists-check: this is the reference-lock capture that _plans/HOME_INSPO_CHROME_2026-08-01.md
     item H2 asks for ("ORDER OF WORK: reference-lock capture FIRST ... THEN propose. Do not name
     a duration from memory."). Searched _design-system/references/ first: one file exists,
     airbnb--home-search-chrome.md (captured 2026-07-31), which documents the category-ICON assets
     (the <video> crossfade objects) on airbnb.ch. It does not measure the SWITCH mechanism (URL
     behaviour, network requests, skeleton timing, indicator animation), which is what H2 asks
     about and what this file captures. No duplication; this is the missing half of the same
     surface. This file only, no product code touched, per the task brief. -->

# Airbnb, category switch mechanism (measured)

Captured 2026-08-02. Everything below came off the live airbnb.com product this session, via the
Browser pane's network/DOM/performance APIs, or off this repo's own source files. Nothing here is
from training memory. Where a number could not be pinned exactly, it is stated as a range with the
method that produced it, not smoothed into a single tidy figure.

## Premise check, first

The owner's example named a specific UI: "a horizontal row of category icons at the top (Icons,
Amazing views, Beachfront, Cabins...)". That row does not exist on the live airbnb.com homepage or
search-results page as of this capture (checked `/`, `/homes`, `/experiences`, `/services`,
`/s/homes`, `/s/Paris--France/homes`, desktop and mobile widths). The homepage now shows four
top-level content-type tabs instead: All / Homes / Experiences / Services
(`role="tablist"`, `role="tab"`, hrefs `/`, `/homes`, `/experiences`, `/services`). The
amenity/property-type row the owner remembers appears to have been redesigned away. This is stated
plainly per the task's own rule ("if airbnb.com blocks or does not load, say so"; the equivalent
here is: the exact element does not load, because it no longer exists).

The tabs that DO exist are the closest live analogue for the owner's actual complaint, switching
between category-like views and having the transition feel like a page load, so they are what got
measured. This is a substitution, named explicitly: not the literal row named, but the nearest live
Airbnb surface that does what the owner is describing (switch between category-shaped content
buckets, chrome held still).

## Philosophy

Airbnb's tab switch is not "faster", it is architecturally decoupled from data. Three things happen
in a strict order, and the first one is free: the URL updates via the History API synchronously,
inside the same click handler, before any network request fires. The second is near-free: a shimmer
skeleton mounts within about one frame (~60ms) of the click, so the user gets visual confirmation
the click registered before any data has arrived. The third is the only slow part: the actual
content swap, gated on a single GraphQL query, which takes anywhere from ~100ms (a tab visited
earlier this session, served from client cache) to ~950ms (a tab never fetched before, in this
session). The header, search bar and the tab row itself never repaint or remount across any of
this, confirmed by tagging them with a probe attribute that survives the full transition.

So "smooth" here is not one animation, it is the ABSENCE of a dead zone: something changes on
screen within one frame of the click, every time, regardless of how long the data takes. The
skeleton is not decoration, it is the thing that prevents the "did this even register" feeling the
owner is describing. Everything else, the sliding pill underline, the icon crossfade, is a garnish
on top of that, not the mechanism.

## Measured

| what | measured | method |
|---|---|---|
| URL change | synchronous with the click; `location.href` already reflects the new route inside the same script turn that called `.click()`, before any await | `javascript_tool`: read `location.href` immediately after a programmatic `.click()` on the tab's `<a>`, same synchronous call |
| Full document load? | No. `performance.getEntriesByType('navigation').length` stayed at `1` across every tab switch; a `window.__marker` value set before the click survived every switch (a full reload resets `window`) | same instrumentation, checked before and after each switch |
| Network requests on switch | GraphQL only: `POST/GET .../api/v3/TabbedVerticalHomepage/<hash>?operationName=TabbedVerticalHomepage...` plus tracking pixels (`jitney`, `airdog`, `sgtm`). No `GET` request for an HTML document at the new URL | `read_network_requests` filtered to `airbnb`, immediately after switching Experiences to Services |
| Cold-tab fetch duration (first visit to a tab this session) | 949ms, one measured instance (`startTime` 261786.8, `responseEnd` 262735.8) | `performance.getEntriesByType('resource')` filtered to the `TabbedVerticalHomepage` request |
| Skeleton appears after click | within 40 to 60ms (first or second sample in a 40ms-interval poll) | timed DOM sampling loop (`setTimeout` every 40ms, reading `main.outerHTML`, image count, and a text snippet) run from inside the same script that fired the click, tab kept fronted throughout to avoid background-tab timer throttling |
| Skeleton identity | confirmed, not inferred: snippet at t+60ms literally contains `data-testid="shimmer-css-variable-index-1"`; `imgCount` is `0` while the skeleton is up (no real photos rendered, only shimmer blocks) | same sampling loop, `main.innerHTML.slice(0,300)` and `img[src]` count per sample |
| Skeleton duration, cold tab, trial 1 (Experiences to Services) | held from t+40ms to t+1240ms (~1.2s), then real content (imgCount 32, htmlLen jumped from ~86KB to ~465KB) by t+1320ms | same sampling loop, 40 samples at 40ms |
| Skeleton duration, cold tab, trial 2 (fresh full reload, then to Experiences) | shimmer from t+60ms to t+660ms (~600ms), real content (32 images) present by t+720ms | same method, separate trial after a hard `navigate()` to reset client cache |
| Warm-tab switch (revisiting a tab already fetched this session) | new content substantially present within ~100ms, fully settled (entrance animations finished, `document.getAnimations()` running count back to 0) by ~300ms; no visible shimmer window was observed in the sampled 50ms-resolution trace | same sampling loop, Services to Homes (Homes had been the first page loaded, so was warm) |
| Header / search bar / tab row repaint | never. A `data-probe` attribute set on the `<header>` and the `[role="tablist"]` node before the click was still present, on the SAME node, at every sample through the full transition, cold and warm | same sampling loop, checked `document.querySelector('header')?.getAttribute(...)` each tick |
| Selected-tab underline mechanism | ONE shared indicator, not per-tab elements: three `<span>` pieces (two 3px end-caps + a 10px middle piece) positioned via `transform: matrix(...)`, i.e. translateX + scaleX, not `left`/`width` | `getComputedStyle` walk of the `[role="tablist"]` subtree, comparing the "Homes" (selected) and "Experiences" (about to be selected) tabs |
| Underline animation | `transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), height 0.3s cubic-bezier(0.2, 0, 0, 1)` | computed style on the indicator `<span>` (class `u4v6jzs`) |
| Tab icon crossfade | the icon is two stacked images (static + "selected" variant), one fades out and the other in via `opacity`, `transition: opacity 0.3s cubic-bezier(0.2, 0, 0, 1)` | computed style walk of the icon wrapper divs inside a tab |
| Tab element itself (link, text) | no `transition`, no `border-bottom`, no `::after`/`::before` content; it is NOT what animates | computed style + pseudo-element check on the `<a role="tab">` and its text spans |

## What we do today (Solen)

Measured the same way, on the running dev tunnel at 390x844, clicking the Coiffeur pill in
`Header.tsx`. Two corrections to the task brief's own premise, stated plainly rather than built
past:

- The header's category pill row does **not** link to `/{locale}/{city}/{category}`. Its live hrefs
  are `/{locale}/{category}` (`/de/coiffeur`, `/de/barbershop`, `/de/nails`), from
  `HEADER_CATEGORIES` in `app/[locale]/_components/layout/Header.tsx:111-120`. The
  `/{locale}/{city}/{category}` route (`app/[locale]/[city]/[category]/page.tsx`) exists in the
  repo but is a separate, city-scoped browse surface reached elsewhere (search/discovery), not what
  the header pill row navigates. `_plans/HOME_INSPO_CHROME_2026-08-01.md` item H2 describes the
  route the same imprecise way ("`/{city}/{category}`"), so this is not a one-off misreading, worth
  fixing at the source next time that plan is touched.
- This exact ask is already an open, unchecked item: `_plans/HOME_INSPO_CHROME_2026-08-01.md` H2,
  quoting the owner verbatim and prescribing "reference-lock capture FIRST... THEN propose." This
  file is that capture. The proposal step is separate and has not happened.

| what | measured | method |
|---|---|---|
| URL change | NOT synchronous. In two clean trials (tab kept fronted, 40ms polling), the URL and DOM stayed byte-for-byte identical to the pre-click state (`bodyHtmlLen` unchanged) for 360 to 400ms after the click, before anything visible happened | same timed-sampling technique as the Airbnb measurement, run against the live tunnel |
| Full document load? | No. `navigation` entry count stayed at `1`, a `window.__marker` survived every switch, and the network log showed only RSC/data requests, no document GET, matching Airbnb's mechanism | same instrumentation |
| Dead zone before ANY visual change | ~360 to 400ms of nothing: no skeleton, no pill feedback beyond the pill's own 220ms fill crossfade, old content frozen on screen | timed sampling, both trials agreed within ~40ms |
| Skeleton appears | abruptly, at the same moment the URL changes (~370 to 400ms after click), not before | same |
| Skeleton identity | `app/[locale]/coiffeur/loading.tsx` (`Skeleton` + 6x `SkeletonCard`), confirmed live via `[class*="skeleton" i]` element count: 37 skeleton pieces on first paint of the loading state | file read + DOM query during the sampling window |
| Skeleton duration | trial 1: still showing 31 of the original 37 skeleton pieces at t+1600ms (1.6s after click) and not yet resolved; trial 2 (fresh reload first): fully resolved (0 skeleton elements, real content, URL confirmed `/coiffeur`) at t+2440ms after click | same sampling loop, extended to poll until `skeletonElCount === 0` |
| Total time, click to fully-settled real content | 1.6s+ (trial 1, not yet done at last sample) to 2.44s (trial 2) | same |
| Header / search bar repaint | never. `data-probe` on `<header>` survived every sample in both trials | same probe-attribute technique used on Airbnb |
| Pill selected-state animation | already smooth and comparable in quality to Airbnb's icon crossfade: two stacked `<span>` fill layers (white, `#F4F4F5` sunken) cross-fade via `opacity`, `transition: opacity 0.22s cubic-bezier(0.1, 0.9, 0.2, 1)` | computed style walk of the Coiffeur tab's child spans |
| Sibling category routes | `app/[locale]/coiffeur/` has a `loading.tsx`; `app/[locale]/barbershop/` and `app/[locale]/nails/` do NOT (checked directory listing directly). A switch to those two currently has no Suspense fallback at all, so the frozen dead-zone would run even longer, all the way to full data-ready, with no skeleton step in between | `ls` on the three route directories |

## Root cause, as far as the code explains it

`Header.tsx:1-11` already documents the owner's exact complaint, dated 2026-07-31 ("when you click
services, it goes to the service bit smoothly... that's what I want"), and records that the header
category row was switched from plain `next/link` to `next-view-transitions`' `Link` (API-identical,
wraps the navigation in `document.startViewTransition`) on that date. `<ViewTransitions>` is mounted
globally at `app/layout.tsx:74`. So the plumbing this task might have proposed is already landed,
current as of today (`git log` on `Header.tsx`: last commit 2026-08-02 19:10:16). The 360 to 400ms
dead zone and the 1.6 to 2.4s skeleton window measured above are the CURRENT, already-attempted
state, not an unaddressed gap.

A second file in the same area names the same unresolved timing problem directly:
`HomeSearchPill.tsx:108-122` deliberately reverts one link (the search-bar edit affordance) from the
`next-view-transitions` `Link` back to a plain `<a>`, with the comment "the route change is wrapped
in `document.startViewTransition`, and the mount-time effect... does not survive that window... If
the view-transition timing is ever fixed, revert to Link." That is an internal admission, from
today's work, that the view-transition timing on this exact mechanism is not settled.

The likely mechanical difference from Airbnb: Airbnb's skeleton is independent of the data fetch, it
mounts on click regardless of how long the GraphQL query takes (60ms observed in every trial, cold
or warm). Solen's `loading.tsx` is a Next.js App Router Suspense fallback, and with
`next-view-transitions` wrapping the navigation in `startViewTransition`, the visible swap (old page
to loading skeleton) appears to wait for the transition-ready signal rather than mounting the
instant React registers the click, which is consistent with the measured 360 to 400ms of nothing.
This is stated as the best explanation the code comments support, not as something independently
verified by reading `next-view-transitions`' internals in this session, that would need a follow-up
read of the library source or a maintainer doc.

## What would have to change, cheapest first

1. **Give barbershop and nails a `loading.tsx`.** They have none today (confirmed above), so they
   are strictly worse than coiffeur right now. Copy `app/[locale]/coiffeur/loading.tsx`'s pattern
   (`Skeleton` + `SkeletonCard` grid). Files: `app/[locale]/barbershop/loading.tsx` (new),
   `app/[locale]/nails/loading.tsx` (new).
2. **Close the 360 to 400ms dead zone with an optimistic pending state, decoupled from the RSC
   fetch.** Next.js 15.3.8 (the version installed here, confirmed in `package.json` and in
   `node_modules/next/dist/client/app-dir/link.js`) ships `useLinkStatus()`, a hook that reports
   `pending` the instant a `<Link>` navigation starts, independent of when data arrives. Wiring the
   Coiffeur/Barbershop/Nails pills in `Header.tsx` (`HEADER_CATEGORIES`, lines 111-120, and the
   render around line 227) to flip a visible state (even just the pill's own already-smooth 220ms
   fill, held in the "active" look immediately rather than waiting for the route to resolve) on
   `pending` would give the same "something happened" signal Airbnb gets from its 60ms shimmer,
   without touching the data-fetch path at all. File: `app/[locale]/_components/layout/Header.tsx`.
3. **Investigate the `next-view-transitions` + Suspense interaction directly**, since
   `HomeSearchPill.tsx:118` already flags it as suspect. Confirm whether `startViewTransition` is
   waiting for the FULL navigation (through `loading.tsx` AND the real data) before swapping, versus
   the more common pattern of transitioning to the loading state first and letting the real content
   stream in underneath. If it is waiting for the full round-trip, that is the direct cause of the
   measured 1.6 to 2.4s window, and the fix is a timing change in how the transition is triggered,
   not a new skeleton. Files: `app/layout.tsx:74`, `app/[locale]/_components/layout/Header.tsx`,
   possibly a shared hook if the same fix needs to apply to `SalonCard.tsx`'s existing use of the
   same `Link`.
4. **Warm the common categories, the way Airbnb's cache made its second visit near-instant.**
   Airbnb's cold-to-warm difference (949ms to ~100ms) is entirely a client-cache effect. Next.js
   `<Link prefetch>` (on by default for viewport-visible links in the App Router) should already be
   doing something like this for the header pills; worth confirming with the network panel whether
   the RSC payload for Coiffeur/Barbershop/Nails is actually being prefetched on hover/viewport
   entry, or whether something in the current setup (the `next-view-transitions` `Link` wrapper, or
   a `dynamic = 'force-dynamic'` on those pages) is defeating prefetch. This is the most structural,
   least localized item on this list, and the one most likely to need its own measurement pass
   before a fix, not just a code change.

## NOT MEASURED

- A screenshot of Airbnb's skeleton mid-transition. The shimmer window (as short as ~600ms cold,
  ~100ms warm) is shorter than this tool's round-trip latency for a sequential `computer` screenshot
  call (observed 3 to 14+ seconds per call in this session), so every screenshot attempt landed on
  the already-settled state. The skeleton's existence, timing, and identity were confirmed instead
  via direct DOM instrumentation (`data-testid`, element counts, `outerHTML` length) sampled from
  inside the same script that fired the click, which is a stronger signal than a screenshot would
  have been for timing, but there is no visual capture of it in this file.
- A screenshot of Solen's skeleton mid-transition, for the same reason (its window, 1.2 to 2.4s, is
  longer, but every attempted screenshot round-trip still landed after full resolution).
- Airbnb mobile web at 390x844 specifically for the tab switch. The category tabs were measured at
  1280x900 (desktop breakpoint) because at narrower widths (390 and 618 wide, both tried) the
  Airbnb homepage rendered a different layout (search-first, tabs present but the browser pane's
  own coordinate-to-click mapping was unreliable at that size in this session, see below). The
  underlying mechanism (client-side GraphQL swap, shimmer skeleton, no document reload) is not
  expected to differ by viewport, since it is a data-fetching and History API behaviour, not a CSS
  layout behaviour, but this was not independently confirmed at mobile width.
- The exact frame-accurate duration of Solen's 360 to 400ms dead zone. Two trials measured it at
  "unchanged through t+360ms, changed by t+400ms" (40ms sampling resolution), so the true value is
  somewhere in a 40ms window, not pinned to the millisecond.
- Whether Next.js `<Link>` prefetch is actually firing for the header category pills in production
  (item 4 above). This session only observed dev-tunnel behaviour; prefetch and RSC caching can
  behave differently in a production build.
- Why the `computer` tool's `ref`-based click resolution twice clicked the wrong on-screen target
  during this session (see below), a tooling quirk rather than an Airbnb or Solen finding, noted so
  the numbers above are understood as coming from direct `element.click()` calls (confirmed working
  and confirmed to trigger the same real navigation path, verified by the URL and network changes
  that followed), not from the coordinate-based clicker.

## Tooling note (not a product finding)

Two mechanical issues showed up while capturing this and are recorded here so the numbers above are
legible as trustworthy: (1) `computer` `left_click` using a `ref` argument twice landed on the wrong
tab (clicking "Homes" when "Experiences" was intended); switching to a direct
`document.querySelector(...).click()` inside `javascript_tool` fixed this and was used for every
timing measurement in this file. (2) A `setTimeout`-based polling loop run against a tab that was
not the fronted/active tab was silently clamped to roughly 1-second intervals by background-tab
timer throttling, producing a false "nothing changed for a full second" read on Solen's transition
on the first attempt; every number in this file was re-captured with the target tab explicitly
fronted (`tabs_select`) before sampling.
