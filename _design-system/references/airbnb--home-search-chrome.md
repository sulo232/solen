<!-- exists-check: net-new vs _tasks/completed/_audits/airbnb-homepage-audit-v6.md,
     _plans/motion-audit/HOME_SEARCH_INSPO.md, docs/superpowers/plans/2026-03-31-airbnb-fresha-homepage-polish.md.
     I read the closest two. audit-v6 (2026-03-31) is a gap list of OUR site measured against Airbnb,
     it contains no captured Airbnb asset and no measurement of Airbnb's own chrome.
     HOME_SEARCH_INSPO (2026-07-25) is our own motion audit of our own routes. Neither is a capture
     of Airbnb's assets, which is what the reference-check gate asks for and what this file is.
     This is the first file in _design-system/references/, the location CLAUDE.md names for
     `<brand>--<surface>.md` captures. -->

# Airbnb , home search chrome (phone)

Captured 2026-07-31. Everything below came off the live product or off files downloaded from
Airbnb's CDN in the same session. Nothing here is from training memory.

## How it was captured

The owner selected four elements on the live airbnb.ch home page and pasted their DOM into the
session: three category-icon `<video>` nodes and the tab-bar scroller that wraps them. I then
downloaded the referenced assets and measured them locally with PIL and ffprobe.

Local copies of the captured assets, so this file is checkable without the network:

- `public/_mockups/_assets/refs/airbnb/house.png` , the poster still
- `public/_mockups/_assets/refs/airbnb/house.webm` , the VP9 alpha video
- `public/_mockups/_assets/refs/airbnb/house.mov` , the HEVC alpha video

Source URLs, live at capture time (HTTP 200 confirmed on all three):

- `https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240`
- `https://a0.muscache.com/videos/search-bar-icons/webm/house-selected.webm`
- `https://a0.muscache.com/videos/search-bar-icons/hevc/house-selected.mov`

## The category icon, mechanism

Each icon is not an image and not an icon font. It is a `<video playsinline tabindex="-1">` with a
poster still plus two sources, one per codec family:

```html
<video playsinline tabindex="-1" poster="...original/<uuid>.png?im_w=240" style="animation-delay: 100ms;">
  <source src=".../hevc/consierge-selected.mov#t=0.001" type='video/mp4; codecs="hvc1"'>
  <source src=".../webm/consierge-selected.webm" type="video/webm">
</video>
```

So the resting state is a still 3D render with a real alpha channel, and selecting the tab plays a
short transparent video of the same object. HEVC-with-alpha covers Safari, VP9 covers Chrome.
Siblings carry staggered inline `animation-delay` values of 0ms, 50ms and 100ms, so the row
animates as a cascade rather than in unison.

Filenames follow `<object>-selected`: `house-selected`, `balloon-selected`, `consierge-selected`
(Airbnb's own spelling of concierge).

## Measured, not eyeballed

| what | measured |
|---|---|
| poster canvas | 240 x 216, RGBA, real alpha, 39 KB |
| poster content bbox | (23, 7) to (221, 208) |
| object size inside the canvas | 198 x 201, aspect 0.985 |
| object width as share of canvas | 82.5% |
| opaque area (alpha > 200) | 21.1% of the canvas |
| webm | VP9, 180 x 162, 64 KB |
| mov | video/quicktime, hvc1, 73 KB |

The 21.1% is the number that matters for us. The object nearly spans the tile edge to edge, yet
fills only about a fifth of its area, because it is a small dense three-dimensional object with a
lot of transparent air around it. That is what makes it read as an object sitting inside the pill
rather than as a glyph printed on it. A flat icon that fills its box will not read the same way at
the same pixel size.

## The tab bar around them

The row is a `ContentScroller` inside a `TabBar`, tagged in their own DOM as
`data-xray-jira-component="Guest: Search Bar"`. Items are `<a role="tab" aria-selected>` with ids
of the form `search-block-tab-ALL`, so the whole row is a real tablist and each tab is a link, not a
button. Labels observed in German: Alles, Unterkuenfte, Erlebnisse, Services.

## What Solen takes from this

1. The category pill loses its hairline border and carries a soft shadow instead. On the selected
   pill the shadow goes INSET, so the selected item recedes while its neighbours sit proud. That is
   the "sunken" the owner asked for by name, and it lands on our already-locked `#F4F4F5` selected
   fill without changing the token.
2. A card sits directly under the search pill, white, generous radius, its own shadow, with a small
   rounded photo on the right. On Airbnb it carries a continuation of a previous search.
3. The icon slot geometry, a small dense object in a generous transparent tile.

## What Solen does not take

- The bottom tab bar. The owner rejected it by name: "I don't wanna have a bottom navigation bar
  like Airbnb. That's gonna look fucking ass."
- The red. Named exclusion from the start of this workstream.
- The gray page background. Airbnb's chrome sits on light gray, and that gray is what makes their
  white pill shadows read. The owner rejected a gray background on 2026-07-31 ("why is the
  background fucking gray? I never told you to make the background gray"), so our version stays
  white and tightens the shadows to compensate. If the pills read flat, the gray page is the lever,
  and reversing that rejection is his call, not mine.
- The video-based icons themselves. The owner said 2026-07-31 "forget abt the icon ill generate em",
  so sourcing is closed. The mechanism above stays documented here because if he later wants the
  icons to animate on selection, this is the shape that does it, and the byte costs are already
  measured.
