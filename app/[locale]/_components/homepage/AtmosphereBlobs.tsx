/**
 * Atmosphere blobs — V2-D64 (2026-05-15).
 *
 * **What changed from V2-D60**: container went from `fixed inset-0` (locked to
 * viewport — same blob composition no matter where you scrolled) → `absolute
 * inset-0` covering the full body scroll height. Each blob is now anchored at
 * a specific viewport-relative vertical (`top: Xvh`) so as you scroll down,
 * you pass THROUGH different color zones. The page reads as a long journey
 * across the V3 palette instead of one static gradient.
 *
 * Color zones (top → bottom):
 *   0–80vh    · peach + sage-pale     (Coiffeur + Nails — warm welcome)
 *   60–160vh  · emerald-pale + warm   (Spa zone fades in)
 *   140–240vh · soft-terra + peach    (warm cluster — Last-Minute zone)
 *   220–320vh · sage-pale + emerald   (cool zone — Nearby + Spa)
 *   300–400vh · peach + brand-subtle  (warm zone — Stylists)
 *   380–480vh · emerald-pale + sage   (cool zone — Discover / Inspiration)
 *   460vh+    · emerald-deep cluster  (closing zone — B2B + footer)
 *
 * Each blob: heavily blurred (140px), normal blend mode (NOT multiply — that
 * darkens against the white substrate and muddies the hues). V3 cat colors
 * only — no earth tones, no warning amber, no retired teal.
 *
 * Z-stacking: AtmosphereBlobs sits at z-index 0 with `isolation: isolate`,
 * below all page content (which renders at z-1+ via Section + FeedZone).
 *
 * Server component. No state, no interaction.
 */

// V2-D65 (2026-05-15) — atmosphere palette swap.
//
// **Why the swap**: V2-D60 used the cat-BG colors (#FFE8D8, #D4DDC8, etc.)
// which are pastels designed to sit BEHIND text on cards. Using pastels as
// atmosphere = washed out, no matter the opacity. Mock comparison at
// /solen-vibrancy-compare.html proved: DEEP colors at LOW alpha read RICHER
// than pale colors at HIGH alpha (because the pales are already pre-mixed
// with white; piling more alpha is diluting a dilution).
//
// V2-D65 palette = cat-TEXT variants (the deep end of each colorway):
const C_TERRACOTTA  = "#E0703D"; // Coiffeur TEXT — accent (deep warm)
const C_TERRA_DEEP  = "#A04A22"; // Nails TEXT — terra-deep
const C_INK         = "#2A1F18"; // Barbershop TEXT — ink (cool deep neutral)
const C_EMER_MID    = "#0F6F44"; // Spa TEXT — emerald-mid
const C_BRAND       = "#1A8F5C"; // s-brand emerald (deep)
const C_BRAND_DEEP  = "#084B2D"; // emerald-deep (closing zone anchor)

// Organic asymmetric radii for that hand-drawn blob look (not perfect circles).
const R1 = "60% 40% 50% 50% / 60% 60% 40% 40%";
const R2 = "50% 60% 40% 60% / 60% 40% 60% 40%";
const R3 = "60% 40% 50% 60% / 50% 40% 60% 50%";
const R4 = "55% 45% 60% 40% / 50% 55% 45% 50%";
const R5 = "50% 50% 60% 40% / 60% 40% 50% 50%";
const R6 = "58% 42% 48% 52% / 42% 58% 42% 58%";

interface Blob {
  top?: string;
  left?: string;
  right?: string;
  width: string;
  height: string;
  background: string;
  borderRadius: string;
  opacity: number;
}

const BLOBS: Blob[] = [
  // V2-D65 — deep colors at LOW alpha (0.20-0.38). Opacity ranges chosen so
  // text on white cards always reads cleanly (max alpha calibrated against
  // a white card with #2A1F18 ink text body — never breaks WCAG).

  // ZONE 1 — 0 to 80vh (Hero + first sections: warm welcome, terracotta + emerald)
  { top: "-5vh",   right: "-12%", width: "60%", height: "55vh", background: C_TERRACOTTA, borderRadius: R1, opacity: 0.32 },
  { top: "5vh",    left:  "-15%", width: "55%", height: "50vh", background: C_EMER_MID,   borderRadius: R2, opacity: 0.28 },

  // ZONE 2 — 60 to 160vh (cool zone — emerald + ink hints)
  { top: "70vh",   right: "10%",  width: "55%", height: "50vh", background: C_BRAND,      borderRadius: R3, opacity: 0.30 },
  { top: "110vh",  left:  "-8%",  width: "55%", height: "45vh", background: C_TERRA_DEEP, borderRadius: R4, opacity: 0.22 },

  // ZONE 3 — 140 to 240vh (warm cluster — Last-Minute / Nearby area)
  { top: "160vh",  right: "-15%", width: "60%", height: "55vh", background: C_TERRACOTTA, borderRadius: R5, opacity: 0.34 },
  { top: "200vh",  left:  "10%",  width: "55%", height: "45vh", background: C_TERRA_DEEP, borderRadius: R6, opacity: 0.26 },

  // ZONE 4 — 220 to 320vh (cool zone — emerald-mid + ink atmosphere)
  { top: "250vh",  left:  "-12%", width: "60%", height: "55vh", background: C_EMER_MID,   borderRadius: R1, opacity: 0.32 },
  { top: "290vh",  right: "0%",   width: "55%", height: "50vh", background: C_BRAND,      borderRadius: R2, opacity: 0.30 },

  // ZONE 5 — 300 to 400vh (warm again — Coiffeur featured row)
  { top: "340vh",  right: "-10%", width: "65%", height: "55vh", background: C_TERRACOTTA, borderRadius: R3, opacity: 0.30 },
  { top: "380vh",  left:  "5%",   width: "50%", height: "45vh", background: C_BRAND,      borderRadius: R4, opacity: 0.26 },

  // ZONE 6 — 380 to 480vh (cool — Entdecken / Inspiration zone)
  { top: "430vh",  left:  "-15%", width: "60%", height: "55vh", background: C_EMER_MID,   borderRadius: R5, opacity: 0.32 },
  { top: "470vh",  right: "10%",  width: "55%", height: "45vh", background: C_BRAND_DEEP, borderRadius: R6, opacity: 0.22 },

  // ZONE 7 — 460vh+ (closing zone — anchor in emerald-deep, warm echo)
  { top: "520vh",  right: "-10%", width: "60%", height: "50vh", background: C_BRAND_DEEP, borderRadius: R1, opacity: 0.28 },
  { top: "560vh",  left:  "-8%",  width: "55%", height: "50vh", background: C_TERRACOTTA, borderRadius: R2, opacity: 0.24 },
];

export function AtmosphereBlobs() {
  return (
    <div
      aria-hidden
      // V2-D64: was `fixed inset-0` (viewport-locked → same view at every scroll
      // position). Now `absolute top-0 left-0 right-0` with an explicit large
      // height so the blob layer spans the full page height. The last blob is
      // at top:560vh, so 650vh container easily contains all positions plus
      // their blur halos. Blobs are positioned via `top: Xvh` page-relative
      // (vh always references viewport-height, so a blob at 70vh appears 70vh
      // down the document — exactly where we want).
      // V2-D65 fix: was z-0 which created a positioned stacking context
      // ABOVE the page content (Hero, FeedZone, etc are mostly z-auto). With
      // the FeedZone glass dropped, atmosphere was painting OVER content
      // instead of behind it. -z-10 (negative) explicitly anchors atmosphere
      // BEHIND every non-positioned element regardless of stacking context.
      className="pointer-events-none absolute top-0 left-0 right-0 -z-10 overflow-hidden"
      style={{ isolation: "isolate", height: "650vh" }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          // V2-D67-fu12 (2026-05-16) — mobile perf: blobs 7+ hidden under 768px,
          // and blur cut 100px → 50px on mobile via CSS class instead of inline
          // (inline `filter` would lock the value across breakpoints). Result:
          // 6 blobs at half-blur on phones vs 14 at full blur on desktop —
          // dramatic GPU savings on iOS Safari without changing the desktop look.
          className={`atm-blob absolute ${i >= 6 ? "hidden md:block" : ""}`}
          style={{
            ...b,
            mixBlendMode: "normal",
          }}
        />
      ))}
      <style>{`
        .atm-blob { filter: blur(50px) saturate(1.3); }
        @media (min-width: 768px) {
          .atm-blob { filter: blur(100px) saturate(1.6); }
        }
      `}</style>
    </div>
  );
}
