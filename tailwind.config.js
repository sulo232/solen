/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
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
        // ── Solen v2 Brand Tokens ──
        "s-coral": { DEFAULT: "#E8624A", hover: "#CC4E35", subtle: "#FAECE7", text: "#7A2415" },
        "s-amber": { DEFAULT: "#D4870A", hover: "#B3700A", subtle: "#FEF4E0", text: "#6B4005" },
        "s-blue": { DEFAULT: "#6BA3C8", hover: "#4E8AB5", subtle: "#EAF3FB", text: "#1A4D72" },
        "s-plum": { DEFAULT: "#4A1E3C", hover: "#3A1630", subtle: "#F0E8F0", text: "#4A1E3C" },
        "s-yellow": { DEFAULT: "#F2C144", subtle: "#FEF8E0", text: "#7A5C00" },
        "s-sage": { DEFAULT: "#7BA688", subtle: "#EBF5EE", text: "#2E5E3A" },
        "s-sand": { DEFAULT: "#C9A96E", dark: "#D4C9B4", subtle: "#F7F0E3", text: "#6B5430" },
        "s-ink": { DEFAULT: "#1A1209", secondary: "#4A3D2E", tertiary: "#8A7A66", disabled: "#C4B8A6" },
        "s-bg": { base: "#FAF6EF", surface: "#F3EDE2", raised: "#FFFFFF", sunken: "#EDE5D8" },
        "s-dm": { bg: "#151009", surface: "#1E1710", raised: "#26201A", sunken: "#120D07", text: "#F5EEE4", "text-secondary": "#C8BAA8" },
        // ── Semantic Status Tokens ──
        "s-success": { DEFAULT: "#2E7D32", bg: "#E8F5E9" },
        "s-warning": { DEFAULT: "#E65100", bg: "#FFF3E0" },
        "s-error": { DEFAULT: "#C62828", bg: "#FFEBEE" },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
      },
      borderRadius: {
        // Legacy Tailwind vars (keep for shadcn compat)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // ── Solen V3 Design System ──
        card: "20px",      // Salon cards, glass stat cards, Last Minute card, category tiles, modals
        panel: "16px",     // Inner panels within a card, review cards, section content blocks
        search: "99px",    // Search bar outer container fully rounded
        pill: "9999px",    // availability pills, tags
        btn:  "99px",      // CTA buttons, action buttons (V3 standard)
        input: "12px",     // form inputs, dashboard cards (Zone 4)
        // NOTE: rounded-button (8px) REMOVED — use rounded-btn (99px)
        // NOTE: rounded-blob REMOVED — NEVER rule #6
      },
      boxShadow: {
        // ── Legacy warm aliases (renamed for V3 clarity) ──
        card: "0 1px 2px rgba(26,18,9,.06)",
        "card-hover": "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08)",
        // shadow-glass renamed to shadow-surface (values unchanged — already warm):
        surface:        "0 8px 32px rgba(26,18,9,0.06)",
        "surface-hover": "0 16px 48px rgba(26,18,9,0.10)",
        // ── V3 Apple Warm Shadow System ──
        "warm-xs":    "0 1px 2px rgba(26,18,9,.06)",
        "warm-sm":    "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)",
        "warm-md":    "0 2px 4px rgba(26,18,9,.08), 0 4px 16px rgba(26,18,9,.06)",
        "warm-lg":    "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07)",
        "warm-xl":    "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08)",
        "warm-float": "0 24px 72px rgba(26,18,9,.18)",
        // ── Colour-matched button glows ──
        "coral-glow":       "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)",
        "coral-glow-hover": "0 4px 8px rgba(232,98,74,.32), 0 8px 28px rgba(232,98,74,.22)",
        "amber-glow":       "0 2px 4px rgba(212,135,10,.22), 0 4px 16px rgba(212,135,10,.14)",
        "pressed":          "0 1px 1px rgba(26,18,9,.12), inset 0 1px 2px rgba(26,18,9,.06)",
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
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)",
        "mesh-warm": "radial-gradient(at 40% 20%, rgba(232,98,74,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(212,135,10,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(107,163,200,0.06) 0px, transparent 50%)",
      },
      transitionTimingFunction: {
        "ease-out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
        "ease-in-out-strong": "cubic-bezier(0.77, 0, 0.175, 1)",
        "ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionProperty: {
        "transform-opacity": "transform, opacity",
        "shadow-transform": "box-shadow, transform",
        "colors-shadow": "color, background-color, border-color, box-shadow",
      },
      animation: {
        "pulse-coral": "pulse-coral 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "count-up": "count-up 0.6s ease-out forwards",
        "slide-in-up": "slide-in-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-coral": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,98,74,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(232,98,74,0)" },
        },
        "slide-in-up": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
