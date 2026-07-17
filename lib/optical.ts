/**
 * Optical corrections, owner-approved 2026-07-15 (_design-system/TASTE_LOG.md, "Taste Lab
 * round 1", Optical alignment row): "play/asymmetric glyphs nudge toward visual center,
 * circles next to squares get a small size overshoot, icon-text baselines eye-checked at 2x".
 *
 * Candidate numbers from _design-system/RATIONALE.md:144 (Domain 6, "Optical vs mathematical
 * alignment"): circles sized next to squares ~2-4% overshoot; play/chevron glyphs ~4-8% nudge
 * toward visual center. Corroborated by research/GEOMETRY_PRINCIPLES_2026-07-17.md: Apple HIG
 * ("An asymmetric icon can look off center even though it's not"), Material 3's circle-vs-square
 * keyline (20dp circle / 18dp square in the same 24dp box), and type-design overshoot (about 3%
 * for a round letterform like O).
 *
 * ONE shared place for both numbers, a call site imports from here, it never hand-picks its
 * own magic overshoot/nudge value.
 */

/**
 * Circle-next-to-square size overshoot. Picked 3% (the type-design O-overshoot figure, the
 * middle of the RATIONALE 2-4% band). A circle inscribed in a box encloses less area than the
 * box itself, so at an equal box height it reads smaller than a same-box square neighbour;
 * the overshoot restores equal PERCEIVED size, not equal area (area-matching runs closer to
 * Material's 11% and reads oversized).
 */
export const CIRCLE_OVERSHOOT = 0.03;

/**
 * Asymmetric-glyph visual-center nudge. Picked 6% (the middle of the RATIONALE 4-8% band).
 * Flexbox centers a glyph by its bounding box; an asymmetric glyph (play, chevron, send/
 * paper-plane) carries its visual mass toward one edge of that box, so a bounding-box center
 * reads off-center. Symmetric glyphs (X, plus, search, heart) already center correctly by
 * bounding box and must NOT be nudged.
 */
export const GLYPH_NUDGE = 0.06;

/**
 * Overshot circle diameter (px) for a circle sized to sit next to a same-box square of
 * `squareBoxPx`. Rounds to the nearest px.
 */
export function opticalCircleSize(squareBoxPx: number): number {
  return Math.round(squareBoxPx * (1 + CIRCLE_OVERSHOOT));
}

/**
 * Visual-center nudge (px) for an asymmetric glyph of `glyphSizePx`. Floors at 1px so the
 * correction is never rounded away to nothing at typical icon sizes (11-24px).
 */
export function opticalGlyphNudge(glyphSizePx: number): number {
  return Math.max(1, Math.round(glyphSizePx * GLYPH_NUDGE));
}
