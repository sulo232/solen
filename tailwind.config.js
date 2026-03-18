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
        // Solen Design System
        teal: {
          DEFAULT: "#38B2AC",
          light: "#5EC8BF",
          dark: "#2D9E97",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          light: "#FF9494",
          dark: "#E85555",
        },
        dark: {
          DEFAULT: "#1A1209",
          50: "#FAF6EF",
          100: "#EDE5D8",
          200: "#C8B8A6",
          300: "#8A7A66",
          400: "#4A3D2E",
          500: "#1A1209",
        },
        // Dark mode surfaces (legacy)
        "dm-bg": "#0F0F1A",
        "dm-surface": "#1A1A2E",
        "dm-text": "#E2E8F0",
        // ── Solen v2 Brand Tokens ──
        "s-coral": { DEFAULT: "#E8624A", hover: "#CC4E35", subtle: "#FAECE7", text: "#7A2415" },
        "s-amber": { DEFAULT: "#D4870A", hover: "#B3700A", subtle: "#FEF4E0", text: "#6B4005" },
        "s-blue": { DEFAULT: "#6BA3C8", hover: "#4E8AB5", subtle: "#EAF3FB", text: "#1A4D72" },
        "s-plum": { DEFAULT: "#4A1E3C", subtle: "#F0E8F0", text: "#4A1E3C" },
        "s-sage": { DEFAULT: "#7BA688", subtle: "#EBF5EE", text: "#2E5E3A" },
        "s-sand": { DEFAULT: "#C9A96E", subtle: "#F7F0E3", text: "#6B5430" },
        "s-ink": { DEFAULT: "#1A1209", secondary: "#4A3D2E", tertiary: "#8A7A66", disabled: "#C4B8A6" },
        "s-bg": { base: "#FAF6EF", surface: "#F3EDE2", raised: "#FFFFFF", sunken: "#EDE5D8" },
        "s-dm": { bg: "#151009", surface: "#1E1710", raised: "#26201A", sunken: "#120D07", text: "#F5EEE4", "text-secondary": "#C8BAA8" },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
      },
      borderRadius: {
        // Legacy
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Solen Design System
        card: "12px",
        button: "8px",
        pill: "9999px",
        blob: "30% 70% 70% 30% / 30% 30% 70% 70%",
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.12)",
        "coral-glow": "0 2px 8px rgba(232,98,74,0.15)",
        "teal-glow": "0 0 20px rgba(56, 178, 172, 0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.06)",
        "glass-hover": "0 16px 48px rgba(0,0,0,0.10)",
        "warm-sm": "0 2px 8px rgba(26,18,9,0.08)",
        "warm-md": "0 4px 16px rgba(26,18,9,0.12)",
        "warm-lg": "0 8px 32px rgba(26,18,9,0.16)",
      },
      backdropBlur: {
        xs: "4px",
        glass: "20px",
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)",
        "mesh-teal": "radial-gradient(at 40% 20%, hsla(174,51%,46%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(174,51%,46%,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(0,100%,71%,0.06) 0px, transparent 50%)",
        "mesh-coral": "radial-gradient(at 0% 0%, hsla(0,100%,71%,0.12) 0px, transparent 50%), radial-gradient(at 50% 100%, hsla(177,57%,62%,0.10) 0px, transparent 50%)",
      },
      animation: {
        "pulse-coral": "pulse-coral 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "count-up": "count-up 0.6s ease-out forwards",
        "slide-in-up": "slide-in-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
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
