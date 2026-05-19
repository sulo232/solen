/**
 * HeroSpotlight — V3-D81 (2026-05-19, Fresha pattern).
 *
 * Replaces the V3-D80 5-blob scatter system. Now matches fresha.com:
 * two big pre-blurred SVGs anchored at the top of <main>, clipped by
 * overflow-hidden on the page wrapper. Atmosphere lives ONLY behind the
 * hero — below the fold is pure white work-mode surface.
 *
 * Recipe (measured from fresha.com):
 *   - Container: absolute, inset-x-0, top-0, h-0 (zero-height anchor)
 *   - Inner: rotation wrapper (~145deg)
 *   - 2 SVGs, each = ONE big organic shape with blur BAKED IN via
 *     <feGaussianBlur stdDeviation="100"> inside the SVG defs.
 *   - opacity 1, mix-blend-mode normal, NO CSS filter — the softness
 *     lives in the SVG itself.
 *   - Same hue family, only 2 colors — brand blue + accent yellow.
 *
 * Why this beats the 5-blob scatter:
 *   - One cohesive wash, not 5 competing color zones
 *   - Hero gets the warmth, the rest of the page stays pure white →
 *     clear "tinted hero / white work-mode" hierarchy
 *   - Cards underneath sit on actual white, not faint pastel.
 *
 * Mounted inside a wrapper with `overflow-hidden` so the SVGs spill
 * upward/outward and the clip handles the "atmosphere ends here" line.
 */

export function HeroSpotlight() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-0"
    >
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{ transform: "translate(-50%, 0) rotate(15deg)" }}
      >
        {/* Yellow spotlight — warm side */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1997 1473"
          width={1500}
          height={1100}
          fill="none"
          style={{
            position: "absolute",
            left: -200,
            top: 80,
            transform: "scale(1.3)",
          }}
        >
          <g filter="url(#sp-yellow-blur)">
            <path
              d="M1796.69 736.346c0 295.874-237.09 535.734-529.55 535.734C974.67 1272.08 200 1032.22 200 736.346c0-295.877 774.67-535.732 1067.14-535.732 292.46 0 529.55 239.855 529.55 535.732Z"
              fill="#FFC32B"
              fillOpacity={0.32}
            />
          </g>
          <defs>
            <filter
              id="sp-yellow-blur"
              x="0"
              y="0.614"
              width="1996.69"
              height="1471.46"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="100" />
            </filter>
          </defs>
        </svg>

        {/* Blue spotlight — cool side, slightly overlaps yellow for blend */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1503 1955"
          width={1100}
          height={1500}
          fill="none"
          style={{
            position: "absolute",
            left: -750,
            top: -350,
            transform: "scale(1.4)",
          }}
        >
          <g filter="url(#sp-blue-blur)">
            <path
              d="M930.893 1727.62c-281.395 91.43-582.776-59.94-673.153-338.09-90.377-278.15-101.647-1089.025 179.748-1180.456 281.396-91.431 748.902 571.204 839.272 849.356 90.38 278.15-64.47 577.76-345.867 669.19Z"
              fill="#1638C4"
              fillOpacity={0.22}
            />
          </g>
          <defs>
            <filter
              id="sp-blue-blur"
              x="0.696"
              y="0.486"
              width="1501.84"
              height="1953.79"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="100" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}
