<!-- exists-check: net-new workstream detail file. Closest existing: _plans/MOTION_LAW.md (#40, motion law research incl. Airbnb, but no captured asset), _plans/APPLE_MOTION_ADOPT.md (adoption tracker for already-decided Apple gesture physics). Neither holds an animated-icon asset capture. `npm run exists "animated icon"` returns 0 hits. -->

# Airbnb animated icons, then a Solen one

Owner ask (2026-07-31, dictated): use an MCP to generate Airbnb-style animated icons with a transparent
background, after actually researching how Airbnb makes their icons; the target subject is a person
sitting in a barber or coiffeur chair that rotates. Then, mid-turn: "First, go ahead and research
Airbnb's animation frame by frame, like, of their icons right now."

The literal order narrowed this turn to research only. The build half is below and is not started.

## Atomic asks, this turn's scope (research)

- [x] A1. Research Airbnb's icon animation frame by frame, from the real thing.
  - verified: commit a6d6795bb. 411 RGBA frames decoded by ffmpeg into
    `public/_pixel-refs/airbnb/icons-motion/frames/<clip>/NNN.png`; per-frame alpha geometry in
    `frame-metrics.json` (produced by `analyze.py`), alpha-masked per-frame motion energy in
    `motion-energy.json` (`energy.py`), 9 contact sheets in `sheets/` (`sheets.py`).
- [x] A2. Capture the actual assets rather than describing them from memory.
  - verified: commit a6d6795bb. 9 real files at `public/_pixel-refs/airbnb/icons-motion/webm/*.webm`,
    downloaded from `a0.muscache.com/videos/search-bar-icons/webm/`. ffprobe on them returns
    `codec_name=vp9`, tag `alpha_mode=1`, 180x162, `r_frame_rate=30/1`. The HEVC `.mov` variant was
    fetched and probed too (51 frames, same dimensions). Live-page evidence in `live-page-manifest.json`.
- [x] A3. Write a durable spec and arm the reference lock.
  - verified: commit 29becd151, `_design-system/references/airbnb--animated-icons.md` (Identity,
    Philosophy, Measured, Port map, Conflicts, Known limits). Lock armed at
    `~/.claude/state/active-ref-299044ad.json`, written by the reference-lock step 4 snippet.
- [x] A4. Deliver it as a served visual page, not a markdown file.
  - verified: commit 29becd151, `public/_research/airbnb-icon-motion.html`, served on port 3222 from
    this worktree. Live readback in the running page: 9/9 videos `readyState` 4, 9/9 frame strips
    loaded at 1170x190, 9 timing rows, 3 timeline segments. INTERACTION dispatched and read back:
    a synthetic `click` on the third cell drove `house-selected.webm` from `currentTime` 0 to 0.396
    to 0.766 and left it `paused` on its final frame, which is the Airbnb behaviour reproduced.
- [x] A5. Establish what generation route is actually available (the dictated "six field MCP" reading).
  - verified: `lottiefiles` MCP returns HTTP 403 on `search_animations` and `get_popular_animations`
    (3 calls). `lottiefiles-creator` MCP responds (`get_rules` returned its layer-ordering contract).
    Higgsfield MCP is connected and answered live: `models_explore(type:'3d')` lists
    `tripo_h3_1_image_to_3d`, `image_to_3d` (Meshy), `sam_3_3d`, `hunyuan3d_v3_image_to_3d`;
    `generate_3d(get_cost:true)` returns 9 credits; `balance` returns 1000 credits on a plus plan.
    Local encode capability confirmed: `ffmpeg -h encoder=libvpx-vp9` lists `yuva420p`, so we can
    write the same alpha WebM Airbnb ships. `three` is NOT installed in this repo (`require` throws),
    so the turntable renderer is the one genuinely missing piece.

### A5, what was found

- `lottiefiles` MCP (search and browse published animations): **HTTP 403 on every call**, three separate
  attempts across two tools. Unusable this session.
- `lottiefiles-creator` MCP (author a Lottie programmatically): **works**, `get_rules` returned its layer
  ordering contract. So a generation route exists.
- But the measured research says Lottie is the WRONG TARGET for a copy of this reference. Airbnb's icons
  are pre-rendered 3D baked to alpha video, with real perspective and self-shadowing across the turn.
  Lottie is 2D vector. A Lottie can imitate the timing exactly and cannot imitate the look.
- So the route splits, and the split is the owner's call, not mine. See the decisions below.

## Owner decisions, not tasks

These are questions, not work items. None can be answered from the code, the reference, or a default.

1. **Subject and casting.** A person seated in a rotating salon chair carries a skin tone, hair, and
   gender read that a house or a balloon does not. This is a brand decision.
2. **Route.** Either (a) Lottie via `lottiefiles-creator`, which is available right now and gets the
   timing but reads flat and 2D next to the reference, or (b) real 3D authored and baked to alpha video
   like Airbnb, which matches the look and needs a 3D tool this session does not have.
3. **A near-linear easing token.** The reference measures near-linear (fit 0.040) and none of the four
   locked easings (snap, spring, glide, thud) is. Adopting the reference means adding a token or
   accepting a different feel.
4. **A video-per-icon asset class.** New for Solen. The reference set is 604 KB for three icons.

Build (author, encode VP9 WebM with alpha plus HEVC `.mov`, mockup-first) starts once 1 and 2 are answered.

## What the research found

Full spec: `_design-system/references/airbnb--animated-icons.md`.
Served report: `public/_research/airbnb-icon-motion.html`.
Assets: `public/_pixel-refs/airbnb/icons-motion/` (webm, hevc, 411 RGBA frames, 9 contact sheets,
frame-metrics.json, motion-energy.json, live-page-manifest.json).

The five things that would have been wrong if guessed:

1. It is not Lottie and it is not "Lava". The live web ships VP9 WebM with `alpha_mode=1`, plus an HEVC
   `.mov` with alpha for Safari. "Lava" appears only as three dormant experiment flags in the page payload.
2. There are three clips per icon, not one: a full turn for the inactive state, a full turn for the active
   state, and a short select clip. Missing this is missing the whole interaction.
3. The clip holds still at both ends. `house-twirl` is 1700 ms long but only moves from 200 to 1267 ms.
4. It never loops and it does nothing on hover. One play on arrival, then a still picture.
5. The easing is near-linear (RMS fit 0.040) rather than ease-out (0.127). It reads as mass, not as UI.

## Tooling built this turn

- `scripts/capture/harvest-lottie.mjs` , loads a URL list behind a four-way load guard (status, off-host
  redirect, error UI at 200, unrendered body), saves every Lottie JSON the page actually fetched, and
  dumps the WAAPI timeline, the CSS transition recipes, and the DOM animation hosts. Found zero Lottie on
  Airbnb, which is itself the finding.
- `scripts/capture/_abnb-probe2..6.mjs` , session probes: the `lava` string sweep over the page payload,
  the top-area media inventory that found the CDN URLs, the stacked-video rest-state inventory, and the
  `HTMLMediaElement` hook installed before page load that produced the choreography timings.
- `public/_pixel-refs/airbnb/icons-motion/{analyze,energy,sheets,summarize}.py` , per-frame alpha geometry,
  alpha-masked motion energy, contact sheets, and the structure summary.

## Traps found

- The icon set is A/B gated. One in two fresh sessions renders a plain text tab bar with no icons at all,
  so a single capture run can honestly report "there are no animated icons". Retry with fresh contexts.
- Raw per-frame pixel diff over the whole canvas is misleading: RGB under fully transparent pixels is
  arbitrary and produced a fake spike on frame 1 of every short clip. Mask by alpha first.
- Silhouette width is a bad motion proxy for rotationally symmetric objects. The balloon and the bell spin
  a full turn while their outline barely changes.
