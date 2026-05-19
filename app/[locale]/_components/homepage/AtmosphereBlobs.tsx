/**
 * AtmosphereBlobs — V3-D80 (2026-05-19).
 *
 * Site-wide soft pastel atmosphere. 5 blobs scattered down the page so a
 * subtle warmth follows the user as they scroll — no single "spotlight"
 * concentrated in the hero, no banner-bright wash.
 *
 * Recipe (locked):
 *   - Container: absolute top-0, -z-10, height: 550vh
 *   - 5 blobs, soft pastel palette (s-accent-soft yellow, s-brand-pale
 *     blue, peach, sage, lavender-cream).
 *   - blur(110px) saturate(0.95) — soft, not vibrant.
 *   - mix-blend-mode: normal (V2-D54 retired multiply — muddied substrate).
 *   - opacity 0.42-0.55 — visible as warmth, never as paint.
 *
 * Z-stacking: -z-10 with isolation: isolate guarantees blobs sit behind
 * every non-positioned element regardless of parent stacking context.
 *
 * Server component. No state, no interaction.
 */

// Soft pastel palette — calibrated to read as ATMOSPHERE on pure-white
// substrate, not as paint. Pure pastels (already pre-mixed with white)
// keep opacity high without becoming vibrant.
const C_YELLOW   = "#FFE19F"; // s-accent-soft — warm welcome
const C_BLUE     = "#B8C4F0"; // s-brand-pale — cool zone
const C_PEACH    = "#FFE0C8"; // warm bridge between yellow and terra
const C_SAGE     = "#D4DDC8"; // cool calm
const C_LAVENDER = "#E5DDEC"; // neutral pastel — quiet transition

// Organic asymmetric radii — keeps blobs hand-drawn, not circular.
const R1 = "60% 40% 50% 50% / 60% 60% 40% 40%";
const R2 = "50% 60% 40% 60% / 60% 40% 60% 40%";
const R3 = "60% 40% 50% 60% / 50% 40% 60% 50%";
const R4 = "55% 45% 60% 40% / 50% 55% 45% 50%";
const R5 = "50% 50% 60% 40% / 60% 40% 50% 50%";

interface Blob {
  top: string;
  left?: string;
  right?: string;
  width: string;
  height: string;
  background: string;
  borderRadius: string;
  opacity: number;
}

const BLOBS: Blob[] = [
  // Blob 1 — top-right warm yellow. Sits behind hero h1 + SearchBar.
  { top: "-5vh",   right: "-10%", width: "65%", height: "55vh", background: C_YELLOW,   borderRadius: R1, opacity: 0.55 },

  // Blob 2 — mid-left cool blue. Behind first content sections (Zuletzt /
  // ArtistOfTheMonth area).
  { top: "70vh",   left:  "-12%", width: "60%", height: "55vh", background: C_BLUE,     borderRadius: R2, opacity: 0.48 },

  // Blob 3 — mid-right peach. Behind Nearby / CategoryPromos zone.
  { top: "160vh",  right: "-15%", width: "65%", height: "55vh", background: C_PEACH,    borderRadius: R3, opacity: 0.50 },

  // Blob 4 — lower-left sage. Behind FeaturedStylists / Coiffeur / Entdecken.
  { top: "250vh",  left:  "-10%", width: "60%", height: "55vh", background: C_SAGE,     borderRadius: R4, opacity: 0.45 },

  // Blob 5 — closing right lavender. Behind Reviews / BentoBusiness / Footer.
  { top: "360vh",  right: "-10%", width: "65%", height: "60vh", background: C_LAVENDER, borderRadius: R5, opacity: 0.50 },
];

export function AtmosphereBlobs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 right-0 -z-10 overflow-hidden"
      style={{ isolation: "isolate", height: "550vh" }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="atm-blob absolute"
          style={{
            ...b,
            mixBlendMode: "normal",
          }}
        />
      ))}
      <style>{`
        .atm-blob { filter: blur(80px) saturate(0.95); }
        @media (min-width: 768px) {
          .atm-blob { filter: blur(110px) saturate(0.95); }
        }
      `}</style>
    </div>
  );
}
