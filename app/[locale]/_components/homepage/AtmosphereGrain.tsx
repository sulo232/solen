/**
 * Atmosphere grain — V2-D45-3 (2026-05-09).
 *
 * Subtle film-grain noise overlay across the entire viewport. Adds
 * tactile / editorial texture so the page reads as "designed surface"
 * not "flat digital." Generated procedurally via SVG `feTurbulence`
 * — no PNG asset, scales infinitely, can tune parameters.
 *
 * Mounting:
 *   • Fixed-position, full viewport, pointer-events-none
 *   • z-index 1 — above AtmosphereBlobs (z-0) but below content
 *     (Hero/FeedZone are z-1+ via relative + their own z values)
 *   • mix-blend-mode: overlay — enhances contrast on light areas
 *     (subtle dark grain on whites, near-invisible on darks)
 *   • opacity 0.05 — film-grain subtle, never assertive
 *
 * Tuning knobs (per user feedback):
 *   • baseFrequency 0.65 → finer grain, "magazine print" look
 *     (0.85+ = tighter; 0.4-0.5 = larger noise pattern)
 *   • opacity 0.05 → barely-there. Bump to 0.08 for visible texture.
 *   • mix-blend-mode overlay vs multiply: overlay = brightens lights,
 *     darkens darks; multiply = darkens everything. Overlay is the
 *     editorial-default.
 *
 * Server component. No state, no interaction.
 */
export function AtmosphereGrain() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 1, opacity: 0.10, mixBlendMode: "soft-light" }}
    >
      <filter id="solen-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        {/* Convert to grayscale alpha so noise is colorless texture */}
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0.6 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#solen-grain)" />
    </svg>
  );
}
