/**
 * Visual Effects Utilities — Parallax, grain, and micro-interaction helpers
 */

/** Parallax motion values for image containers (slower movement = depth) */
export const PARALLAX = {
  /** Images move 15% slower than frame for depth effect */
  imageSlow: {
    initial: { y: 0 },
    whileInView: { y: -20 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  /** Slight offset on carousel swipe */
  carouselShift: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 },
  },
} as const;

/** Glow effects for interactive elements */
export const GLOW = {
  /** Coral glow for primary CTAs */
  coral: "0 0 24px rgba(232, 98, 74, 0.4)",
  /** Amber glow for secondary elements */
  amber: "0 0 20px rgba(212, 135, 10, 0.35)",
  /** Subtle blur glow for floating UI */
  subtle: "0 0 16px rgba(26, 18, 9, 0.08)",
} as const;

/** Grain & texture overlays for atmospheric depth */
export const TEXTURES = {
  /** SVG data URL for subtle grain (1-2% opacity) */
  grainSvg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='1' /%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23F5F0EB' filter='url(%23noise)'/%3E%3C/svg%3E`,

  /** Apply subtle grain overlay class */
  grainOverlay: `
    position: relative;
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 seed=%221%22 /%3E%3CfeColorMatrix type=%22saturate%22 values=%220.3%22/%3E%3C/filter%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23F5F0EB%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E');
      opacity: 0.015;
      pointer-events: none;
    }
  `,
} as const;

export default { PARALLAX, GLOW, TEXTURES };
