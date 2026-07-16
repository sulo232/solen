/**
 * ICON_STROKE / strokeForSize: calibrated size-to-stroke table (ig9, owner-approved
 * 2026-07-16, "IG-principles round 1: all 12 ADD candidates APPROVED"; TASTE_LOG.md:331).
 *
 * Before this module, stroke width was picked ad-hoc per call site: FilterSheet chip
 * icons at 14px used 1.9, the queue ProgressStepper's 18px step icon used 2, and the
 * header hamburger/X at 22px used 2.2 (_design-system/SOURCE.md:580). The approved
 * principle is stem-matching, not small-icon legibility: each icon sits beside text
 * set at a locked type-role size, and Inter's own glyph stems grow thicker as the
 * font size grows, so a bigger icon next to bigger text needs a THICKER stroke to
 * read as the same visual weight, not a thinner one. This table is anchored to the
 * two calibration points the owner approved in the mockup
 * (public/_mockups/ig-principles/index.html:217/224, a 14px icon at stroke 1.6 next
 * to a 12-13px chip label, and :218/225, a 24px icon at stroke 2.4 next to a
 * 17px/600 section header) and linearly interpolated across the three real
 * call-site sizes (14 / 18 / 22px) in between. Monotonic rule: stroke width
 * INCREASES as icon size increases.
 */

const ICON_STROKE_TABLE: { maxSize: number; stroke: number }[] = [
  { maxSize: 14, stroke: 1.6 },
  { maxSize: 18, stroke: 1.9 },
  { maxSize: 22, stroke: 2.2 },
  { maxSize: 24, stroke: 2.4 },
];

/** Calibrated stroke width for a given Lucide icon `size` (px). Monotonic: bigger icon, thicker stroke (stem-matched to the larger neighboring text). */
export function strokeForSize(px: number): number {
  const match = ICON_STROKE_TABLE.find((row) => px <= row.maxSize);
  return match ? match.stroke : ICON_STROKE_TABLE[ICON_STROKE_TABLE.length - 1].stroke;
}
