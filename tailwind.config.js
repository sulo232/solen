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
          DEFAULT: "#1A1A2E",
          50: "#f5f5f8",
          100: "#e8e8f0",
          200: "#c8c8d8",
          300: "#9999b0",
          400: "#666688",
          500: "#1A1A2E",
        },
        // Dark mode surfaces
        "dm-bg": "#0F0F1A",
        "dm-surface": "#1A1A2E",
        "dm-text": "#E2E8F0",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        data: ["Space Grotesk", "monospace"],
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
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.12)",
        "coral-glow": "0 2px 8px rgba(255,107,107,0.15)",
        "teal-glow": "0 0 20px rgba(56, 178, 172, 0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.06)",
        "glass-hover": "0 16px 48px rgba(0,0,0,0.10)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,107,107,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,107,107,0)" },
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
