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
        // ── Solen Brand Tokens (DESIGN_SPEC.md is source of truth) ──
        // Q64 GREEN PIVOT (2026-05-03): brand primary flipped from coral #E8624A to
        // forest green #1B4D1B. Token name `s-coral` retained for backward-compat across
        // hundreds of import sites — value is GREEN. Future cleanup: rename token group
        // to `s-brand` so the name matches the value. Per Q64:
        //   - DEFAULT #1B4D1B forest green (was #E8624A coral)
        //   - hover #0F3010 deep green (was #D4574A)
        //   - subtle #E8EFE4 light green tint (was #FAECE7 light coral tint)
        //   - text #0F3010 deep green (was #C95A3A deep coral)
        //   - button + button-hover same as DEFAULT/hover
        // Contrast: green #1B4D1B on white = 9.89:1 (vs coral 3.35:1) — fixes Q45
        // banned-pair #3 (white-on-coral 3.35:1 body fail).
        "s-coral": { DEFAULT: "#1B4D1B", hover: "#0F3010", subtle: "#E8EFE4", text: "#0F3010", button: "#1B4D1B", "button-hover": "#0F3010" },
        "s-amber": { DEFAULT: "#F3A864", hover: "#E89953", subtle: "#FCEBD3", text: "#8C4A14" },
        "s-blue": { DEFAULT: "#6BA3C8", hover: "#4E8AB5", subtle: "#EAF3FB", text: "#1A4D72" },
        "s-plum": { DEFAULT: "#4A1E3C", hover: "#3A1630", subtle: "#F0E8F0", text: "#4A1E3C" },
        "s-yellow": { DEFAULT: "#F2C144", subtle: "#FEF8E0", text: "#7A5C00" },
        "s-sage": { DEFAULT: "#7BA688", subtle: "#EBF5EE", text: "#2E5E3A" },
        "s-sand": { DEFAULT: "#C9A96E", dark: "#D4C9B4", subtle: "#F7F0E3", text: "#6B5430" },
        "s-ink": { DEFAULT: "#1A1209", secondary: "#56463E", tertiary: "#9F8A7E", disabled: "#C4B8A6" },
        "s-ink-2": "#56463E",
        "s-ink-3": "#9F8A7E",
        "s-border": "#EFE7DD",
        "s-bg": { base: "#FFFFFF", surface: "#FAF7F3", raised: "#FFFFFF", sunken: "#FAF7F3", cream: "#FFF4E8" },
        // s-dm.* dark-mode tokens removed 2026-05-02 per Q62 — single light theme.
        // ── Semantic Status Tokens ──
        "s-success": { DEFAULT: "#16A34A", bg: "#E8F5E9" },
        "s-warning": { DEFAULT: "#E65100", bg: "#FFF3E0" },
        "s-error": { DEFAULT: "#C62828", bg: "#FFEBEE" },
      },
      fontFamily: {
        // Q23 + Q48 (2026-05-02): Anton (display) + Figtree (body). Earlier values
        // (Bebas Neue / Fraunces / DM Sans) retired per SOLEN_DESIGN.md §20.
        // `heading` aliased to display so existing `font-heading` className keeps working.
        display: ["Anton", "Impact", "sans-serif"],
        heading: ["Anton", "Impact", "sans-serif"],
        body: ["Figtree", "system-ui", "sans-serif"],
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
