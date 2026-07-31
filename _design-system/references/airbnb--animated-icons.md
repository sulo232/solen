<!-- exists-check: net-new vs _plans/APPLE_MOTION_ADOPT.md, _design-system/MOTION.md, _plans/GEOMETRY_RESEARCH.md, _roadmaps/roadmap-ui-brand-identity.md. Read the closest match (APPLE_MOTION_ADOPT.md): it is an ADOPTION TRACKER for already-decided Apple gesture physics, with per-item verification checkboxes, not a captured external reference. MOTION.md is Solen's own motion vocabulary. Neither holds a captured brand reference. `_design-system/references/` is the location the reference-lock skill specifies for exactly this file, and the directory is currently empty, so this is the first entry in that convention, not a duplicate. `npm run exists "animated icon"` returns 0 hits. -->

# Airbnb, animated search-bar icons

Reference-lock capture. Read this before writing any code or mockup for a Solen animated icon.

## Identity

| field | value |
|---|---|
| brand | Airbnb |
| platform | web-desktop (1440 x 950, Chromium 131 UA, locale en-US, currency CHF) |
| surface | the Homes / Experiences / Services tab icons in the top search bar on `airbnb.com` |
| interaction | play on page load, play on tab click, hold at rest |
| source | `https://a0.muscache.com/videos/search-bar-icons/webm/*.webm` and `/hevc/*.mov` |
| capture date | 2026-07-31 |
| assets | `public/_pixel-refs/airbnb/icons-motion/` (webm, hevc, 411 decoded RGBA frames, sheets, frame-metrics.json, motion-energy.json, live-page-manifest.json) |
| report | `public/_research/airbnb-icon-motion.html` (served, plays the real files) |
| capture method | headless Chromium against the live site with a load guard (status, off-host redirect, error UI at 200, unrendered body); ffmpeg `libvpx-vp9` to RGBA frames; PIL and NumPy for per-frame geometry and alpha-masked motion energy; `HTMLMediaElement.play` and `currentTime` hooked via `addInitScript` before page load for the choreography |

## Philosophy

The icon is a small physical object that was filmed, not a diagram that was given a transition. Motion
is a greeting, not a state: it plays once when you arrive and then holds perfectly still, and the frame
it holds on is the last frame of the animation, so the movement never contradicts the icon you end up
looking at. The turn is near linear with soft ends, because a thing with mass does not ease out. Choosing
gets a smaller and shorter move than arriving does. Clip length follows the object, not a duration token.

## Measured

### Format

| value | measurement | tier |
|---|---|---|
| container, codec | WebM, VP9, container tag `alpha_mode=1`, so real per-pixel alpha | verified |
| Safari fallback | `.mov` HEVC with alpha at `/hevc/`, same 180x162, same 51 frames | verified |
| source size | 180 x 162 px | verified |
| frame rate | 30 fps constant | verified |
| displayed size | 72 x 72 CSS px, from a 36 px layout box carrying `transform: matrix(2,0,0,2,0,0)` | verified |
| file size | 36.9 KB to 123.6 KB per clip, 604 KB for all nine | verified |
| encoder | `Lavc61.19.100 libvpx-vp9`, handler `Apple Video Media Handler` | verified |
| "Lava" | NOT the format served. Three dormant flags only: `media_web_homepage_enable_lava_search_icons` = control, `web_homepage_loads_lava_v2` = treatment_unknown, `pdp_rare_finds_lava_animation_v2` = treatment | verified |
| authored in 3D | real perspective and self-shadowing across the turn, which a 2D vector format cannot do | expect |
| authoring tool | not measured |
| rotation angle per frame | not measured (the camera was not solved) |

### The clip set, three per icon

Nine files, `{house, balloon, consierge} x {twirl, twirl-selected, selected}`. Airbnb's own spelling of
"consierge" is kept because it is the real filename. The bare name (`house.webm`) returns 403.

| clip | frames | length | still start | moving | still end | peak motion |
|---|---|---|---|---|---|---|
| house-twirl | 51 | 1700 ms | 200 ms | 200 to 1267 ms | 433 ms | 733 ms |
| house-twirl-selected | 51 | 1700 ms | 200 ms | 200 to 1100 ms | 600 ms | 600 ms |
| house-selected | 23 | 767 ms | 33 ms | 33 to 733 ms | 33 ms | 133 ms |
| balloon-twirl | 51 | 1700 ms | 233 ms | 233 to 1667 ms | 33 ms | 533 ms |
| balloon-twirl-selected | 51 | 1700 ms | 33 ms | 33 to 1667 ms | 33 ms | 533 ms |
| balloon-selected | 46 | 1533 ms | 33 ms | 33 to 1467 ms | 67 ms | 333 ms |
| consierge-twirl | 51 | 1700 ms | 200 ms | 200 to 1600 ms | 100 ms | 667 ms |
| consierge-twirl-selected | 51 | 1700 ms | 33 ms | 33 to 1600 ms | 100 ms | 600 ms |
| consierge-selected | 31 | 1033 ms | 33 ms | 33 to 900 ms | 133 ms | 233 ms |

All tier: verified. The movement window is per-frame mean absolute RGBA difference inside the alpha mask,
thresholded at 5 percent of that clip's peak. Silhouette width alone is useless here: the balloon and the
bell are rotationally symmetric and spin without changing outline.

Every `twirl` is exactly 1.700 s and 51 frames. The short clips are not equalised: 767 / 1533 / 1033 ms.

### Choreography

| trigger | behaviour | tier |
|---|---|---|
| page load | all three twirls play once, staggered left to right. `play()` at 855 / 1007 / 1155 ms in one session and 893 / 1051 / 1193 ms in another, so gaps of 152, 148 and 158, 142 ms. Stagger is about **150 ms** | verified |
| hover | nothing at all. No `play()`, no `currentTime` write, no transform change, held 1.4 s per tab | verified |
| click a tab | the matching short clip plays once from 0. The twirl videos are removed from the DOM, the short clips are faded in from `opacity: 0` to `1` | verified |
| at rest | two stacked `<video>` at identical coordinates, one `opacity: 1` one `0`, crossfaded by a CSS transition. The visible one is paused on its final frame | verified |
| loop | never. `loop=false`, `autoplay=false`, `preload=auto`, playback is a JS `play()` call | verified |
| crossfade duration | not measured (computed `transition` read back as the shorthand `all`) |

### Easing

Normalised progress of the moving alpha centroid across all 23 frames of `house-selected`, RMS error
against standard curves: linear 0.040, ease-in-out `(.42,0,.58,1)` 0.066, ease-out `(0,0,.58,1)` 0.127,
material standard `(.4,0,.2,1)` 0.162, ease-out-quart `(.25,1,.5,1)` 0.324.

So: near linear with soft ends, NOT the usual fast-out slow-in. Tier: verified for the centroid track,
expect for the claim that this reflects the underlying camera move.

## Port map

| Airbnb | Solen equivalent |
|---|---|
| VP9 WebM with alpha, plus HEVC `.mov` for Safari | the same, no proprietary format is needed. Solen ships neither today, so this is a net-new asset pipeline |
| 180 x 162 source at 72 px display, about 2.5x | keep a 2 to 2.5x source over the display box |
| one-shot play on mount, about 150 ms stagger | maps onto the Motion-22 cascade vocabulary in `_design-system/MOTION.md`; the 150 ms is the reference value, not a Solen token yet |
| near-linear turn with soft ends | none of the four Solen easings (snap, spring, glide, thud) is near-linear. A genuine gap, not a substitution to make silently |
| final frame equals the rest icon | new rule if adopted: the static icon must BE the last frame, never a separate SVG |
| never plays on hover | consistent with Solen restraint, no conflict |
| the 3D house / balloon / bell look | do NOT port the aesthetic. LOCKFILE dual-axis stands: structure and behaviour may come from a named reference, the Solen look does not |

## Conflicts

- CONFLICT [motion]: the reference easing is near-linear, and Solen's four easing tokens (snap, spring,
  glide, thud) are all eased. Adopting the reference means adding a token or accepting a different feel.
  Owner call.
- CONFLICT [assets]: a video per icon is a new asset class for Solen (604 KB for three icons here). No
  budget or delivery convention exists for it. Owner call.
- CONFLICT [subject]: the owner's ask is a person seated in a rotating salon chair. A human figure carries
  a casting decision (skin tone, hair, gender read) that a house or a balloon does not. Owner call, and it
  blocks authoring, not research.
- No TASTE_LOG or REMOVED.md entry covers animated icons. `npm run exists "animated icon"` returns 0 hits.
  Nothing here re-litigates a settled call.

## Known limits

- Desktop web only. The iOS and Android apps were not captured and may genuinely ship Lava.
- The icon set is A/B gated: one in two fresh sessions rendered a plain text tab bar with no icons.
  Everything above comes from the variant that has them.
- Mobile web at 390 px was not captured.
- The LottieFiles MCP returned HTTP 403 on every call this session, so no cross-check against published
  Lottie files was possible.
