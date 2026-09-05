<!-- exists-check: net-new vs airbnb--reviews.md, airbnb--home-mobile.md, airbnb--profile-list.md,
     airbnb--fonts-vs-ours.md, airbnb--icons-vs-ours.md, AIRBNB_SYSTEM_VS_OURS.md because none of
     them opens a single ROOM/LISTING page: home-mobile stops at the feed, reviews.md captures the
     full-reviews sub-page reached FROM a listing but not the listing shell around it (hero, title
     block, host block, amenities, sticky reserve bar). Read all six before writing this. This file
     reuses reviews.md's review-card numbers (avatar, name, divider) rather than re-measuring them. -->

# Airbnb, mobile web listing (room) page

REF: airbnb / web-mobile / listing-page / live-DOM + screenshot

## Identity

- **Brand / platform / surface:** Airbnb, web in mobile view, a single listing/room page.
- **Source:** `https://www.airbnb.com/rooms/1617434888964259732` ("City Getaway", Zurich),
  reached from `https://www.airbnb.com/s/Zurich--Switzerland/homes`. Logged out.
- **Viewport:** 390x844, deviceScaleFactor 3, iPhone Safari user agent, locale en-US.
- **Date:** 2026-09-05.
- **Method:** repo Playwright (`node`, not the Claude_Browser pane, per this task's scope),
  `getComputedStyle` + `getBoundingClientRect` on live DOM, full-page + viewport screenshots.
  Stills at `public/_pixel-refs/airbnb/listing-page/` (`listing-hero-390.png`,
  `listing-full-390.png`). No login, no credentials, no commits.

## Philosophy

The listing page sells the SPACE, not the platform. Fonts and chrome disappear; a 26px title,
a 40px round host avatar, and one big review-count number are the only display-weight elements
on an otherwise 14-16px body page. The one place Airbnb breaks its own quiet-neutral palette is
the single commit action: the sticky "Reserve" pill is not black, it is the brand's rausch
pink-to-coral gradient, pixel-sampled directly off the rendered button (not read from any color
token, since resolved background-color reported transparent, evidence the fill sits on a
gradient layer / pseudo-element the computed-style walk cannot see). Every other button on the
page, including the checkout flow's "Next" step button, is plain ink black. So the brand color
is reserved for exactly one thing: the first commit tap on a listing, not for buttons in general.

## Measured

| element | value | tag |
|---|---|---|
| page title (`<h1>`, "City Getaway") | 26px / 500, line-height 30px, `rgb(34,34,34)` | verified |
| breadcrumb-style h2 above title ("Room in Zurich, Switzerland") | 14px / 400, `rgb(108,108,108)` | verified |
| section heading (`<h2>`, "What this place offers" / "Where you'll be" / "Where you'll sleep") | 22px / 600, line-height 26px, `rgb(34,34,34)` | verified |
| sub-heading (`<h3>`, "Listing highlights" item titles e.g. "Self check-in") | 14px / 500, line-height 20px | verified |
| amenity row text ("Kitchen" etc, icon + label) | 16px / 400, row height 48px, `padding: 0 6px` | verified |
| host avatar | 40 x 40px circle, `border-radius: 50%`, placeholder fill `rgb(221,221,221)` when unloaded | verified |
| rating number (large, mid-page) | 22px / 600, line-height 26px, `gap: 2px` to the star | verified |
| section divider (`<hr>`) | 1px height, `border-color: rgb(221,221,221)`, full-bleed | verified |
| sticky reserve bar container | full-width, 97px tall, sits at the viewport bottom (`position` resolves fixed/sticky in-flow) | verified |
| **Reserve button (pill CTA)** | radius **999px** (true pill), `padding: 14px 24px`, h **48px**, text 16px/500 white, fill = **rausch gradient**, pixel-sampled across the button: `rgb(228,28,92)` to `rgb(234,89,140)` (deep pink-red to lighter coral/pink, left-to-right) | verified (computed `background-color` reported transparent through 3 ancestor hops; the fill was recovered by PIL-sampling `listing-hero-390.png` at the button's device-pixel rect) |
| body / UI font | `"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif` | verified |
| review card (avatar, name, body, row divider) | reused from `airbnb--reviews.md`: avatar 48x48 circle, reviewer name 16px/500 `rgb(34,34,34)`, review body 14px/400, row-to-row divider 1px `rgb(221,221,221)`, 35px body-to-divider gap + 24px divider-to-next-avatar gap | verified (prior capture, cross-checked: same `rgb(221,221,221)` hairline as this file's own `<hr>` reading) |
| card corner radius, search-result equivalent card (for cross-reference) | 20px | verified (from `search-results.json`, same session) |

## Not measured

- The exact CSS mechanism painting the Reserve button's gradient (background-image vs. a layered
  pseudo-element) was not traced; the computed `background-color` chain returns transparent at
  every ancestor. Stated as a gap, not guessed.
- Amenity icon SVG stroke width and exact icon set were not enumerated (six icons sampled at
  12-24px box sizes, inconsistent, likely mixed icon families per amenity type). Not claimed as a
  system.
- Gallery photo count and aspect ratio inside the hero (whether it is a single hero photo or an
  n-up grid) were not resolved: `heroImg` returned a 0x0 box (the actual visual hero is rendered
  via a background-image div, `heroContainer`, not a paintable `<img>` at this scroll position).

## Port map

| Airbnb value | Our token / value | inside our lock? |
|---|---|---|
| Section heading 22/600 | Our section-H2 is `clamp(18px,2vw,20px)` (LOCKFILE text-size table) | Airbnb is larger and heavier. Would need a new size, breaks nothing structurally but is a size change. Owner call. |
| Sub-heading 14/500 | Matches our name/body 14px, our weight-500 tier | Fits inside our system without a new token. |
| Divider `rgb(221,221,221)` | Our hairline `s-border #E4E4E7` | Close but not identical; `#E4E4E7` is our locked cool-neutral hairline, no change needed, already reads the same family. |
| Reserve pill radius 999 | Our button/chip radius is locked **16px**, explicitly NOT a capsule (LOCKFILE, owner 2026-08-16 "you're really elongating this pill") | Direct conflict, see below. |
| Reserve fill = rausch gradient | Our locked CTA fill is `bg-s-ink` (#0A0A0A), ONE commit button stays ink (taste rule 3, LOCKFILE design contract) | Direct conflict, see below. |
| Checkout "Next" button: ink `rgb(34,34,34)`, radius 12px, h 40px | Our `bg-s-ink` ink fill is close in spirit; our radius for buttons is 16px not 12px | Small delta (12 vs 16), lower stakes than the Reserve-button conflict. |
| Host avatar 40x40 circle | Matches our avatar sizing pattern elsewhere in the system (ground per taste rule 9, not re-measured here) | No new value needed, size already common in our system. |
| Amenity row height 48px, icon + 16px label | Compatible with our `h-11` (44px) touch-target floor, slightly taller | No conflict, a comfortable superset of our floor. |

## Conflicts

- **CONFLICT [CTA color]: Airbnb fills its ONE primary commit button (Reserve) with its brand
  gradient (pink-to-coral), not black. Solen's lock says the one commit button stays ink
  (`bg-s-ink`), and blue/brand color is reserved for small clickable accents only, never a big
  CTA (taste rule 3, LOCKFILE design contract table, "link" row).** Airbnb's own checkout "Next"
  button IS black, so even Airbnb does not apply brand color to every CTA, only to the very first,
  highest-stakes tap on a listing. Owner call: keep Solen's ink-only CTA law as is, or borrow the
  Airbnb pattern of a brand-colored FIRST commit distinct from subsequent step buttons. Either way
  this is a locked axis (taste rule 3, "LOCKED 2026-06-10") and needs his yes, not a silent copy.
- **CONFLICT [radius]: Reserve button radius is a true 999px capsule. Solen's button/chip radius
  is locked at 16px specifically to avoid the capsule look (owner 2026-08-16, describing a pill
  that "looks like it has a sharp corner" at width).** Airbnb's own capsule does not have that
  problem because it never grows past its content width by much; still, adopting a full capsule
  anywhere on Solen breaks a named, dated lock. Owner call.
- **CONFLICT [type budget]: this single screen alone carries at least 6 distinct size/weight
  pairs (26/500, 22/600, 16/400, 14/500, 14/400, 12/500 from the reused reviews numbers) before
  counting review-card text.** LOCKFILE caps a customer screen at 4 sizes / 2 weights, gate-enforced.
  Airbnb's PDP-equivalent screen is not budget-compliant by our own rule; porting its full type
  range wholesale would trip the type-budget gate. A partial port (pick 4 sizes, not all 6) is
  the compliant path if the owner wants the Airbnb feel without breaking the gate.
