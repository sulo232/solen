/**
 * Atmosphere blobs — V2-D45 (2026-05-09).
 *
 * Six heavily-blurred organic shapes in V3 palette only — pale teal,
 * pale ice blue, sandy beige, cream, deeper teal. Mounted as a fixed
 * ambient layer above the body wash (z-index -2/-1) but below all
 * page content. Adds personality and warm anchors (sandy beige + cream)
 * to the otherwise all-blue body wash, per user feedback "rn we only
 * got blue hues" + Treatwell-footer reference (but in V3 palette, NOT
 * pink/coral — explicit user direction "the blue, like not pink n sh").
 *
 * Visual reference: public/solen-v2-atmosphere-blobs.html (subtle variant).
 *
 * Sits in its own isolation context with mix-blend-mode: multiply so
 * blobs intermix where they overlap (teal+beige produces sage midtones)
 * but don't multiply against the body wash beneath or content above.
 *
 * Pure CSS, no animation — keeps it free of GPU cost at rest. If the
 * user later wants slow drift, gate via prefers-reduced-motion and use
 * translate-only @keyframes.
 *
 * Z-stacking summary:
 *   • body::before (-2, fixed) — radial-gradient base wash
 *   • body::after (-1, absolute) — parallax echo wash
 *   • AtmosphereBlobs (0, fixed) — THIS layer
 *   • Page content (auto / z-1+, sibling)
 *
 * Server component. No state, no interaction.
 */

// V2-D48 EARTHEN WELLNESS LIGHT (2026-05-09): full palette swap from V3 teal/ice-blue
// to earth tones. moss-pale, terra-soft, sage-pale, bone, butter — no blue, no teal.
// Alphas 0.18-0.32 (whisper, not paint) so cream bg dominates ~85% of viewport.
const BLOBS = [
  // Top-left emerald-pale (lighter brand) — V2-D48-2
  { top: "-10%", left: "-20%", width: "70%", height: "50%", background: "#A8CFB8", borderRadius: "60% 40% 50% 50% / 60% 60% 40% 40%", opacity: 0.32 },
  // Top-right terra-soft (warm heartbeat hint)
  { top: "5%", right: "-25%", width: "70%", height: "45%", background: "#E8B89B", borderRadius: "50% 60% 40% 60% / 60% 40% 60% 40%", opacity: 0.28 },
  // Mid-page bone (alt surface tone, anchors visual rhythm)
  { top: "35%", left: "-10%", width: "80%", height: "30%", background: "#E8DDC9", borderRadius: "60% 40% 50% 60% / 50% 40% 60% 50%", opacity: 0.30 },
  // Mid-right butter (bright counterpoint, sparingly)
  { top: "28%", right: "-20%", width: "65%", height: "35%", background: "#F2D77B", borderRadius: "50% 50% 60% 40% / 60% 40% 50% 50%", opacity: 0.18 },
  // Bottom-left sage-pale (wellness whisper)
  { bottom: "-8%", left: "-25%", width: "80%", height: "40%", background: "#D4DDC8", borderRadius: "50% 50% 50% 50% / 50% 60% 40% 50%", opacity: 0.28 },
  // Bottom-right terra-soft (closing warm note)
  { bottom: "-12%", right: "-15%", width: "70%", height: "35%", background: "#E8B89B", borderRadius: "60% 40% 50% 60% / 40% 60% 50% 60%", opacity: 0.24 },
  // Extra emerald-pale mid-bottom (cohesion in feed area) — V2-D48-2
  { top: "55%", left: "20%", width: "75%", height: "30%", background: "#A8CFB8", borderRadius: "55% 45% 60% 40% / 50% 55% 45% 50%", opacity: 0.22 },
] as const;

export function AtmosphereBlobs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            ...b,
            filter: "blur(80px)",
            mixBlendMode: "multiply",
          }}
        />
      ))}
    </div>
  );
}
