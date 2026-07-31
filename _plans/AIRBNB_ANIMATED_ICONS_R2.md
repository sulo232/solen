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
