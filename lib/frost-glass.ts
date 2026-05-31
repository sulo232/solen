import type { CSSProperties } from "react";

/**
 * FROST_GLASS: the canonical "A" control treatment (V3-D420, see _design-system/CONTROL_ELEVATION.md).
 *
 * Elevated white glass for an interactive control that sits OVER a photo / image,
 * where the background can't guarantee legibility (hero icons, gallery, card overlays).
 * 80% white + 4px backdrop-blur + white inner border + soft shadow + inset highlight.
 *
 * This is the ONLY place white+shadow is allowed. On flat white / stone chrome,
 * controls go flat (B) or ink (C), never elevated-white.
 *
 * Extracted from SalonHero.tsx (V3-D72) so SaveHeart, card overlays, etc. stop
 * re-deriving the recipe inline.
 */
export const FROST_GLASS: CSSProperties = {
  background: "rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  border: "1px solid rgba(255, 255, 255, 0.6)",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
};
