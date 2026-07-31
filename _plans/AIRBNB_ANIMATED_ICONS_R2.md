<!-- exists-check: extends _plans/AIRBNB_ANIMATED_ICONS.md (the research + build-1 batch). This file holds
     the owner's round-2 feedback batch only, so the first file stays the durable record of the capture. -->

# Round 2, owner feedback on build 1 (2026-07-31)

Owner, dictated: the lighting on Airbnb's is brighter; our red is not vibrant enough; the chair does not
face straight; it is still too muted overall; he wants a female / coiffeur version that is NOT the same
chair, so a barber and a coiffeur are distinguishable; and he wants ideas for how to make that
distinction, because he thinks long hair alone will not read and a person is hard to get right.

## Atomic asks

- [x] R1. Lighting: match Airbnb's brightness.
  - verified: measured on frame 1, alpha-masked. Airbnb house luminance 0.480, balloon 0.413; build 1 was
    **0.309**, the darkest of the set. v3 is **0.474**, which sits on the house. Value 0.581 -> 0.785
    against the balloon's 0.774. Controls added to `scripts/capture/turntable-render.mjs`:
    `--exposure`, `--lift`, `--tonemap`.
- [x] R2. The chair does not face straight.
  - verified: this was real and measurable. Scored every one of the 51 frames for how much cape and skin
    is visible; the rest frame showed **16.7% cape**, the true front was frame 26 at **48.4%**. So the
    icon was resting on its own back quarter. Added `--start-angle`; at 237.7 degrees the rest frame now
    measures **48.5% cape**. Frames in `public/_pixel-refs/solen-icons/frames/chair-v3/`.
- [x] R3. Diagnose why the red is not vibrant.
  - verified: it was never a saturation problem. Airbnb's balloon red is value **0.720** at saturation
    0.775; build 1's red was saturation 0.716 (already there) at value **0.538**, so the red was DARK,
    not dull. Brightening fixed the value (0.618 to 0.708) but ACES filmic tone mapping then crushed the
    saturation to 0.53. Switching to no tone mapping plus a saturation pass recovered part of it and
    stalled at 0.533, which proves the ceiling is baked into the mesh texture, not the lighting.
- [x] R4. Fix the red at its source.
  - verified: commit pending this turn. New source `public/_pixel-refs/solen-icons/src/barber-v2.png`
    measures red saturation **0.775** at value **0.766**, against the old crimson's 0.607 / 0.514 and
    Airbnb's balloon red at 0.775 / 0.720. So the source red now matches Airbnb's saturation exactly and
    runs slightly brighter. Re-meshed to `mesh/barber-v2.glb`; the rendered clip
    `out/barber-hero.webm` measures red 0.811 / 0.909.
- [x] R5. A coiffeur icon that is a different object from the barber icon.
  - verified: `public/_pixel-refs/solen-icons/out/coiffeur-hero.webm`, 180x162, 30fps, 1.700 s,
    `alpha_mode=1`, 41,689 bytes, loop closes byte-identical. It is a backwash basin chair, not a
    variant of the barber chair: reclined seat, white shampoo bowl behind the head, five point brass
    base. Source `src/coiffeur-v1.png`, mesh `mesh/coiffeur-v1.glb`, frames `frames/coiffeur-hero/`.
- [x] R6. Ideas for how a coiffeur and a barber read as different at icon size.
  - verified: written up in the Ideas section below, grounded in the captured reference rather than
    taste. The decisive evidence: Airbnb's own three icons are three unrelated objects, a house, a
    balloon and a bell. They never distinguish two categories by varying one object.
- [x] R7. Show both, playing, next to the Airbnb originals.
  - verified: `public/_research/solen-chair-icon.html`, served on 3222 and over the tunnel. It plays all
    five clips, and carries a 72px and 44px row so the two categories can be judged at the size they
    will actually be used. INTERACTION dispatched and read back with a trusted Playwright click at 390
    wide: `barber-hero.webm` ran 0 to 0.734 to 1.700 and parked on its final frame, alongside Airbnb's
    own clip in the same run (`scripts/capture/_click-proof.mjs`).
    The owner's PICK is still open, which is a decision for him, not a task for me.

## Ideas: how to tell a coiffeur from a barber at 72px

Ranked by how much survives when the icon is 72 pixels wide.

1. **A different chair, not a different person. STRONGEST.** Barber is the heavy pedestal chair: round
   chrome base, thick padded arms, headrest, a footrest bar low at the front. Coiffeur is the backwash
   basin chair: a reclined seat with a white shampoo bowl cradling the head, on a slim five point star
   base with castors. The two silhouettes differ at the top and at the bottom, which is where the eye
   reads shape first. This is the Airbnb move: three categories, three unrelated objects.
2. **A category colour. STRONG, and it does the work when shape blurs.** Barber keeps the bright
   scarlet and chrome, which is what a barbershop already signals in the world. Coiffeur takes a warm
   blush rose with brass. At small sizes hue is recognised before form, so this is the cue that survives
   the worst case.
3. **One object in the scene instead of a held tool.** A hood dryer arcing over the head reads as salon
   from very far away, and it changes the silhouette more than any amount of hair does. The barber
   equivalent is the pole, though a pole risks reading as decoration rather than as the subject.
4. **The gown.** Barber cape is short and square at the shoulders. Salon gown is long and draped. Real,
   but too small a difference to carry the meaning on its own.
5. **Hair length. WEAKEST alone, which is what the owner suspected.** It only reads when the hair mass
   contrasts against the gown colour, and at 72px it is a few pixels. Keep it as a third cue, never the
   first.

**Recommendation: 1 plus 2, with 5 riding along.** The object carries the meaning, the colour carries
the recognition, the hair is a bonus. The person in both stays a smooth featureless clay figure, which
also sidesteps casting a face, a skin tone or a gender read into a brand mark.

---

# Round 3, owner feedback (2026-07-31, same session)

Owner: the bright barber is too bright; too much primary colour, Airbnb does not use primaries like
that; the hair clashes with the creams, make it brunette; how do we get Safari to play it; and the big
one, if barber and coiffeur are both a person in a chair, then spa and inspo and the rest cannot follow
that pattern (spa would be stones, not another person lying down), so two humans plus a pile of objects
will read as a broken set. He asked for ideas.

## Atomic asks

- [x] S1. Safari playback.
  - verified: `out/*.apng` now ship next to the webm, produced by the new APNG step in
    `scripts/capture/encode-alpha-icon.sh`. barber-calm 182,024 bytes, coiffeur 149,981, both 35 stored
    frames totalling 1689 ms, real alpha, play once and stop. Measured alternatives, all on the same
    frame set: WebM VP9 alpha 51,402 bytes but no Safari; HEVC alpha NOT PRODUCIBLE here, the
    videotoolbox encoder returns `-12908` on four flag combinations; animated WebP 52,794 bytes and
    would be the best of both, but this machine has no `libwebp` (`img2webp`, `cwebp`, `webpmux` all
    absent, ffmpeg built without it) and PIL's writer drops the frame durations; ProRes 4444 succeeded
    at 1,038,456 bytes, which is 20x too big and not a web format. NEXT if the owner wants the small
    file: `brew install webp`, then one `img2webp` call replaces the APNG at a third of the size.
- [x] S2. Measure the primary-colour complaint.
  - verified, and he is right with numbers behind it. Neutral pixel share (saturation under 0.25),
    frame 1, alpha-masked: Airbnb house **65.4%**, Airbnb bell **64.0%**, Airbnb balloon 1.7%. Ours:
    barber **13.8%**, coiffeur 34.2%. So Airbnb runs two quiet icons and one loud one, and ours is
    nearly all shouting. Worse, ours mixes hue families: red 24% plus blue 41% in one object, while
    every Airbnb icon stays inside ONE family (balloon is red plus orange; house is green plus a red
    door on grey; bell is a desaturated steel).
- [x] S3. Rebuild to the palette finding.
  - verified: `out/set-barber.webm`, frame 1 at 180x162 alpha-masked, measures **68.7% neutral**
    against Airbnb's house at 65.1 and bell at 64.0, with the coloured pixels at saturation **0.785**
    against Airbnb's 0.707. So it is MORE restrained overall and MORE vivid where it counts, which is
    the split the owner was asking for. Blue is gone entirely: the hue histogram shows one warm family
    and no blue bucket at all, against 41% blue before. Source `src/obj-barber.png`, mesh
    `mesh/obj-barber.glb`, frames `frames/set-barber/`. The brunette-hair note is moot, there is no
    person any more.
- [x] S4. Family rule decided by the owner and built.
  - verified: owner picked objects-only, and specifically "for the salon we're gonna make it a blow
    dryer", overruling both my basin-chair and hood-dryer options. Built: `out/set-barber.webm` (48,172
    bytes) and `out/set-dryer.webm` (38,495 bytes), plus `set-barber.apng` (179,715) and
    `set-dryer.apng` (163,253) for Safari. Both 180x162, 30fps, 1.700 s, `alpha_mode=1`, loop closes
    byte-identical. Shown at 72px and 44px on `public/_research/solen-chair-icon.html`. INTERACTION
    proven with a trusted Playwright click at 390 wide: set-barber ran 0 to 0.706 to 1.700 and
    set-dryer 0 to 0.705 to 1.700, both parking on their final frame.
  - His call beat mine. I argued the weak pair was two chairs and offered a hood dryer as the escape;
    he cut further, to a handheld dryer with no chair at all. That is a bigger silhouette gap than
    either option I put up, and it makes the set a chair plus a tool rather than two chairs.
- [ ] S5. The dryer's pink is still pale: coloured pixels measure saturation 0.412 against Airbnb's
      0.707. The cause is the source image, a dusty rose, not the render. Pushing the render's
      saturation to 2.6 only reached 0.424 while dropping neutral share to 30%, because multiplying
      chroma on an already pale colour hits the ceiling. Fixing it properly needs ONE new source image
      in a stronger pink, which costs credits, so it waits for the owner's word.

## The set problem, and the answer the reference already gives

The owner's instinct is right and the captured reference settles it: **Airbnb's icon set contains no
people at all.** A house, a balloon, a bell. Three objects. Nothing else.

That is the rule to copy. One object per category, no humans anywhere:

| category | object |
|---|---|
| barber | the barber chair alone, chrome pedestal and leather |
| coiffeur | the backwash basin chair, or a hood dryer |
| spa | stacked stones, or a rolled towel with a candle |
| nails | a polish bottle |
| inspo | a hand mirror, or a folded lookbook |

Why this beats the current direction:
- It scales. Every future category has an obvious object; not every category has a plausible person.
- It removes the casting question permanently. No face, skin tone, hair type or gender read is baked
  into a brand mark.
- It reads better small. A chair alone is one silhouette; a chair plus a person is two shapes fighting
  inside 72 pixels, which is also why the current icons needed a hero-angle hunt to look right at all.
- It matches the reference exactly, which is the whole point of having captured it.

The cost, stated plainly: a bare chair is colder than a chair with someone in it. Airbnb pays that same
price and buys it back with warm colour and soft light, which is exactly the lever S3 is about.
