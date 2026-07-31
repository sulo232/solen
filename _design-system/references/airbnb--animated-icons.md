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

---

## Solen icon set: LOCKED values (owner-approved 2026-07-31)

The owner approved these by name. Do not re-open them without him saying so.

| element | value | how it was set |
|---|---|---|
| **Barber chair upholstery** | **`#D76537`**, hsv(0.048, 0.742, 0.843) | Owner verbatim: "I like the orange, the color exactly. The color I like exactly, the orange brownish type, the color is perfect to write it down." 62% of the object's visible pixels. |
| Barber chair frame | `#A8A8A8`, a flat mid grey, sat 0.000 | Owner: the cream "is not really right... make it gray, actually". Was `#FFFAF6` at value 1.000. |
| Blow dryer body | `#EBC23D`, hsv(0.128, 0.740, 0.922) | Matched to the yellow swatch he pasted, around `#F2D24F`. |
| Clip length | 2500 ms, 75 frames at 30fps, 300ms still in / 600ms still out | Owner asked for the turn to slow down from the original 1700ms. |
| Barber motion | plain 360, no tilt, no bob | Owner: "just make it a normal straight 360 instead of this going up and down thingy on the barber". |
| Dryer motion | 360 plus an 11 degree tilt and a 0.035 bob | Owner: "on the blow dry, I like it". |
| Shine | `--gloss` 0.85 chair, 0.55 dryer; roughly 33% and 31% highlight pixels | Owner named matte as the recurring problem across every round. |
| Air / puff | **NOT SHIPPED.** See the note below. | |

All colour figures are measured on frame 1 of the rendered clip at 180x162, with transparent pixels
excluded, so they describe the object rather than the canvas.

### The air: four attempts, still wrong, currently removed

Attempted as soft alpha sprites (read as smoke, rejected), then as 3D tube ribbons (right technique,
owner drew it), then faded by screen-facing so it stopped sweeping the frame, then with the jet
direction flipped after measuring that the emitter projected to screen x=151 while the nozzle mouth
measured x=41. That flip put it on the mouth at rest but the owner then saw it leaving from the BACK
during the turn, which the flip caused. It is removed from the shipped clip rather than shipped wrong.

Next attempt should not tweak the direction again. The emitter is derived from the mesh's bounding-box
extreme along the jet axis, and a bounding box has no idea which end is the nozzle, so on a shape that
is long in both directions it can only ever be right at one angle. The fix is to find the nozzle
geometrically (the small circular opening) or to author the ribbons as part of the source image so
they come through the mesh already attached.
