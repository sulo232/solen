/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode removed 2026-05-02 per Q62 — single light theme.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // V2 rebuild (2026-05-03): legacy components moved from `components/` to
    // `components-legacy/` per Part 9 of the strip-and-rebuild plan. Both
    // paths kept in `content` so Tailwind scans (a) any new components landing
    // in `components/` from the rebuild and (b) the legacy tree still in use
    // until each route gets migrated.
    "./components/**/*.{js,ts,jsx,tsx}",
    "./components-legacy/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy HSL vars (keep for backward compat)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ── Solen V3 Brand Tokens (V2-D15-3 lock 2026-05-07) ──
        // Brand orange #E8742A retired. Brand teal #043338 locked (Republik panel #4 user-flagged screenshot).
        // Backward-compat: `s-coral` token group RETAINED with V3 teal values across hundreds of
        // legacy import sites. Same token name, V3 value. Future cleanup: rename to `s-brand`.
        // Contrast: teal #043338 on white = 14.74:1 AAA. No `text-deep` variant needed — body-safe at any size.
        "s-coral": { DEFAULT: "#043338", hover: "#0A6873", subtle: "#E1F4F4", text: "#043338", button: "#043338", "button-hover": "#0A6873" },
        // ── V3 brand alias (preferred for new code) ──
        "s-brand": { DEFAULT: "#043338", pale: "#C2F0F1", subtle: "#E1F4F4", mid: "#0A6873" },
        // ── V3 category colorway tokens (V2-D15-3 — combo letters from public/solen-v2-combos.html) ──
        // bg + text per combo. Use as: `bg-s-cat-coiffeur text-s-cat-coiffeur-text`
        "s-cat-coiffeur":      "#FFF1DD", "s-cat-coiffeur-text": "#B5345A", // combo Z cream + cherry
        "s-cat-barbershop":    "#D8D6CB", "s-cat-barbershop-text": "#000000", // combo G bone + black
        "s-cat-nails":         "#CAE8FF", "s-cat-nails-text":     "#B50051", // combo A pale ice blue + magenta
        "s-cat-spa":           "#193120", "s-cat-spa-text":       "#948565", // combo I forest + sandy beige
        // ── V3 atmosphere wash colors (used as CSS gradient stops only) ──
        "s-atm-ice":   "#CAE8FF",  // pale ice blue (also Nails category bg)
        "s-atm-teal":  "#C2F0F1",  // pale teal (also brand pale, Spa soft tile)
        "s-atm-royal": "#005898",  // royal blue (atmosphere depth only)
        "s-atm-navy":  "#031E48",  // deep navy (horizon bleed only)
        // ── Retired V2/V1 token groups (kept undeclared — referenced as compat) ──
        // s-amber, s-blue, s-plum, s-yellow, s-sage, s-sand all retired V2-D15-3.
        // If legacy code still imports these, it will fail to compile until migrated.
        "s-ink": { DEFAULT: "#1A1209", secondary: "#56463E", tertiary: "#7A6957", disabled: "#C4B8A6" },
        "s-ink-2": "#56463E",
        "s-ink-3": "#7A6957",  // V3 update: was #9F8A7E (cool grey), now #7A6957 (warm grey) per LIVE_TRUTH §4
        "s-border": "#E8DFD2",
        "s-bg": { base: "#FFFFFF", surface: "#FAF7F3", raised: "#FFFFFF", sunken: "#FAF7F3" },  // dropped 'cream' #FFF4E8 (retired V2-D15)
        // ── Semantic Status Tokens (LIVE_TRUTH §3) ──
        "s-love":     "#FF4A6B",  // V3 added — heart icons (distinct from error)
        "s-success": { DEFAULT: "#16A34A", bg: "#E8F5E9" },
        "s-warning": { DEFAULT: "#F59E0B", bg: "#FFF3E0" },  // V3: aligned to LIVE_TRUTH §3 hex
        "s-error":   { DEFAULT: "#D32F2F", bg: "#FFEBEE" },  // V3: aligned to LIVE_TRUTH §3 hex
        "s-closed":   "#DC2626",  // V3 added — distinct from error
        "s-star":     "#F3A864",  // V3 added — rating stars only
      },
      fontFamily: {
        // V2-D15-3 (2026-05-07): Cooper BT (display) + ITC Avant Garde Gothic Std (body).
        // Free fallbacks: Sansita 900 (Cooper) + League Spartan (Avant Garde) + Inter Tight (final).
        // Retired V2-D15-3: Bricolage Grotesque, Inter Tight (as primary), Instrument Serif, JetBrains Mono.
        // Retired earlier: Anton, Bebas Neue, Fraunces, DM Sans, Plus Jakarta, Outfit, Phosphor, Figtree, Peace Sans, Open Sauce Sans.
        // `heading` aliased to display so existing `font-heading` className keeps working.
        display: ["'Cooper BT'", "'Cooper Black Std'", "'Cooper Black'", "'Sansita'", "Georgia", "serif"],
        heading: ["'Cooper BT'", "'Cooper Black Std'", "'Cooper Black'", "'Sansita'", "Georgia", "serif"],
        body:    ["'ITC Avant Garde Gothic Std'", "'Avant Garde'", "'League Spartan'", "'Inter Tight'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Legacy Tailwind vars (keep for shadcn compat)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // ── Solen V4 Design System ──
        card: "16px",      // V5: Salon cards, listing cards, content blocks
        "card-lg": "20px", // Hero cards, feature cards, modals
        panel: "16px",     // Inner panels within a card, review cards
        search: "99px",    // Search bar outer container fully rounded
        pill: "9999px",    // availability pills, tags
        btn:  "99px",      // CTA buttons, action buttons
        input: "16px",     // DESIGN_SPEC §3.3: form inputs (stable, not pill)
        sheet: "28px",     // Bottom sheets
      },
      boxShadow: {
        // ── Legacy aliases (mapped to DESIGN_SPEC shadow system) ──
        card: "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        "card-hover": "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        surface:        "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        "surface-hover": "0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)",
        // ── Legacy warm aliases (mapped to 3-level system) ──
        "warm-xs":    "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        "warm-sm":    "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        "warm-md":    "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        "warm-lg":    "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        "warm-xl":    "0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)",
        "warm-float": "0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)",
        "pressed":          "0 1px 1px rgba(50,47,44,.12), inset 0 1px 2px rgba(50,47,44,.06)",
        // ── Solen Shadow System (DESIGN_SPEC.md — 3 levels, warm-tinted) ──
        "elevation-1":      "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        "elevation-2":      "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        "elevation-3":      "0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)",
        // Aliases for backward compat
        "v5-card":       "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        "v5-card-hover": "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        "v5-float":      "0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)",
      },
      zIndex: {
        55: '55',
        60: '60',
        70: '70',
      },
      backdropBlur: {
        xs: "4px",
        panel: "20px",  // was: glass — renamed for V3
      },
      transitionTimingFunction: {
        // Legacy alias → mapped to DESIGN_SPEC easing
        "ease-out-strong": "cubic-bezier(0.22, 1, 0.36, 1)",
        "ease-in-out-strong": "cubic-bezier(0.77, 0, 0.175, 1)",
        "ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
        // DESIGN_SPEC.md easing tokens
        "ease-out-warm": "cubic-bezier(0.22, 1, 0.36, 1)",
        "ease-out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-in-subtle": "cubic-bezier(0.55, 0, 1, 0.45)",
        "spring-bounce": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      transitionProperty: {
        "transform-opacity": "transform, opacity",
        "shadow-transform": "box-shadow, transform",
        "colors-shadow": "color, background-color, border-color, box-shadow",
      },
      animation: {
        "count-up": "count-up 0.6s ease-out forwards",
        "slide-in-up": "slide-in-up 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        "fade-in": "fade-in 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        // V4 additions
        "v4-reveal": "v4-reveal 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "v4-scale-in": "v4-scale-in 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards",
      },
      keyframes: {
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-up": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // V4 new keyframes
        "v4-reveal": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "v4-scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
}
