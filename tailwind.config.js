/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false,
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
        // ── Solen V4 Design System ──
        card: "12px",      // V4: Salon cards, listing cards, content blocks
        "card-lg": "20px", // Hero cards, feature cards, modals
        panel: "16px",     // Inner panels within a card, review cards
        search: "99px",    // Search bar outer container fully rounded
        pill: "9999px",    // availability pills, tags
        btn:  "99px",      // CTA buttons, action buttons
        input: "10px",     // form inputs, dashboard cards
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
        // ── V4 Elevation System (Airbnb-inspired) ──
        "elevation-1":      "0 1px 2px rgba(26,18,9,.04)",
        "elevation-2":      "0 2px 8px rgba(26,18,9,.06), 0 1px 2px rgba(26,18,9,.04)",
        "elevation-3":      "0 8px 28px rgba(26,18,9,.1), 0 2px 6px rgba(26,18,9,.04)",
        // ── V5 Layered Shadows ──
        "v5-card":       "0 1px 2px rgba(26,18,9,.04), 0 4px 12px rgba(26,18,9,.03)",
        "v5-card-hover": "0 4px 12px rgba(26,18,9,.06), 0 12px 32px rgba(26,18,9,.06)",
        "v5-float":      "0 8px 32px rgba(26,18,9,.10), 0 2px 8px rgba(26,18,9,.04)",
        "v5-glow-coral": "0 0 24px rgba(232,98,74,.12)",
        // ── Glow Effects (micro-interactions) ──
        "glow-coral":    "0 0 24px rgba(232, 98, 74, 0.4)",
        "glow-amber":    "0 0 20px rgba(212, 135, 10, 0.35)",
        "glow-subtle":   "0 0 16px rgba(26, 18, 9, 0.08)",
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
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 seed=%221%22 /%3E%3CfeColorMatrix type=%22saturate%22 values=%220.3%22/%3E%3C/filter%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23F5F0EB%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E\")",
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
