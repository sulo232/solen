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
        // ── Solen V3 Brand Tokens — V2-D48 EARTHEN WELLNESS LIGHT (2026-05-09) ──
        // Overrides V2-D15-3 dark-teal palette. New primary brand: moss-soft #5C7765.
        // Heartbeat accent: terracotta #C97A57. Bright accent: butter #F2D77B.
        // See `_tasks/_beta/EARTHEN_WELLNESS_PALETTE.md` and `public/solen-v2-earthen-wellness-light.html`.
        // RETIRED V2-D48: dark teal #043338, pale teal #C2F0F1, ice blue #CAE8FF, royal blue #005898,
        // navy #031E48, magenta #B5345A/#B50051, forest #193120, sandy beige #D9C9A8 (cat letter).
        //
        // Backward-compat: `s-coral` token group still references the brand DEFAULT — same token name,
        // new value. V2-D48-2: shifted from muted moss-soft #5C7765 → vibrant emerald-forest #1F5C42
        // per user "more vibrant + dark green everywhere". Saturated, classic luxury-craft green.
        // ── V2-D70 WARM MINIMAL PIVOT (2026-05-18) — Aurex/Fresha lane ──
        // Brand: punchy emerald #1A8F5C → forest #3B7A57 (matches Solen logo green
        // exactly per user spec). Lower saturation, more "premium minimal" feel.
        // Accent: terracotta #E0703D → #D87352 (matches Solen logo dot exactly).
        // Substrate: #FAF3E6 cream (V2-D60) → #F9F8F6 warm pearl/alabaster.
        // Cards stay WHITE on the pearl bg — soft contrast lets cards float
        // with shadow (Aurex lift). Plus Jakarta Sans replaces Peace Sans +
        // Open Sauce One — single family at extreme weight contrast.
        "s-coral": { DEFAULT: "#3B7A57", hover: "#2D5E43", subtle: "#E5F2EA", text: "#3B7A57", button: "#3B7A57", "button-hover": "#2D5E43" },
        "s-brand": { DEFAULT: "#1F5037", pale: "#A6CDB5", subtle: "#DCEDDF", mid: "#163A28", deep: "#0E2B1D" },
        "s-accent": { DEFAULT: "#D87352", soft: "#E89B83", deep: "#A04A22" },
        // ── Bright accent (butter) — sparingly, for stat-card highlights ──
        "s-butter": "#F2D77B",
        // ── Sage — wellness whisper, never loud ──
        "s-sage": { DEFAULT: "#A8B89A", pale: "#D4DDC8" },
        // ── V3 category colorway tokens — V2-D48 Earthen Wellness mapping ──
        // V2-D60: cat tile bgs slightly desaturated to stay readable on lighter substrate.
        // Text colors updated to match new brand-mid + accent-deep values.
        "s-cat-coiffeur":      "#FFE8D8", "s-cat-coiffeur-text":   "#E0703D", // peach + warm terracotta
        "s-cat-barbershop":    "#EAE0D0", "s-cat-barbershop-text": "#2A1F18", // bone + ink
        "s-cat-nails":         "#D4DDC8", "s-cat-nails-text":      "#A04A22", // sage-pale + terra-deep
        "s-cat-spa":           "#D4F2E0", "s-cat-spa-text":        "#0F6F44", // brand subtle + brand mid (emerald)
        // ── V3 atmosphere wash colors — Earthen Wellness ──
        "s-atm-cream":  "#FAF3E6",  // V2-D60: matches new base
        "s-atm-terra":  "#F0A98C",  // V2-D60: matches new accent-soft (more saturated)
        "s-atm-sage":   "#D4DDC8",  // wellness whisper (unchanged)
        "s-atm-bone":   "#EAE0D0",  // V2-D60: matches new sunken
        "s-atm-butter": "#F2D77B",  // bright accent (unchanged)
        // ── Ink (text) — V2-D70 cool-grey scale + V3-D73 contrast fix ──
        // Per spec: never use pure black (#000000) — causes eye strain. Primary
        // is dark rich charcoal #1A1C19, secondary is medium cool grey #6B7068.
        // V3-D73 (2026-05-18): tertiary darkened #9BA09A → #7A7F78 per advanced-UI
        // doc audit — old value contrast vs new substrate #F4F4F6 was ~2.24
        // (FAILS WCAG AA at 4.5 AND AA Large at 3.0). New #7A7F78 = ~4.5:1 against
        // pearl substrate, passes AA Normal (4.5:1) and AA Large easily.
        "s-ink": { DEFAULT: "#1A1C19", secondary: "#6B7068", tertiary: "#7A7F78", disabled: "#C5C8C4" },
        "s-ink-2": "#6B7068",  // V2-D70: medium cool grey per spec (was warm #5C4A3A)
        "s-ink-3": "#7A7F78",  // V3-D73 contrast fix — was #9BA09A, failed WCAG vs new substrate
        "s-border": "#E8E6E0",  // V2-D70: cool-warm neutral hairline for pearl bg (was warm bone #EAE0D0)
        // V2-D70 (2026-05-18): substrate fine-tuned #F8F7F2 → #F9F8F6 (warm pearl /
        // alabaster per Aurex/Fresha spec). Slightly warmer + softer than V2-D68.
        // Hero gets a peach radial gradient via .bg-s-bg-peach + custom CSS layer.
        // Sunken updated to a soft warm-neutral that pairs with the new pearl base.
        // V2-D68 history (kept for archeology): substrate F8F7F2 + atmosphere wash retired.
        // V2-D60 history: cream-on-cream → WHITE on cream (killed beige collapse).
        "s-bg": { base: "#FFFFFF", surface: "#FFFFFF", raised: "#FFFFFF", sunken: "#F6F6F8", active: "#FFFAF1", peach: "#FFE8D8" },
        // V2-D48: bg.base flipped white → cream #F5EBDD (Earthen Wellness page bg). Surface +
        // sunken updated. raised stays white for cards/modals. active = cream-warm input typing.
        // V2-D16 (2026-05-08) note: cream #FFF4E8 was wrongly retired in V2-D15 comment above.
        // V2-D15 retired CREAM SUBSTRATE (page bg #FBF8F3 → white). It did NOT retire #FFF4E8 micro-tint
        // for input active-typing state (LIVE_TRUTH §F.1.0 + §14.3 search row both still cite it).
        // Re-added as `s-bg.active` — distinct from substrate. Use `bg-s-bg-active` in className.
        // ── Semantic Status Tokens (LIVE_TRUTH §3) ──
        "s-love":     "#FF4A6B",  // V3 added — heart icons (distinct from error)
        "s-success": { DEFAULT: "#16A34A", bg: "#E8F5E9" },
        "s-warning": { DEFAULT: "#F59E0B", bg: "#FFF3E0" },  // V3: aligned to LIVE_TRUTH §3 hex
        "s-error":   { DEFAULT: "#D32F2F", bg: "#FFEBEE" },  // V3: aligned to LIVE_TRUTH §3 hex
        "s-closed":   "#DC2626",  // V3 added — distinct from error
        "s-star":     "#F3A864",  // V3 added — rating stars only
      },
      fontFamily: {
        // V3-D75 typography (2026-05-18): Bricolage Grotesque (display) +
        // Hanken Grotesk (body/UI). Bricolage = playful-geometric for h1/h2
        // hero impact; Hanken = clean neutral workhorse for body + UI labels.
        display: ["'Bricolage Grotesque'", "system-ui", "-apple-system", "sans-serif"],
        heading: ["'Bricolage Grotesque'", "system-ui", "-apple-system", "sans-serif"],
        body:    ["'Hanken Grotesk'", "system-ui", "-apple-system", "sans-serif"],
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
        // ── V3 z-index lock (V2-D18, 2026-05-09) — LIVE_TRUTH §8 ──
        // Use as `z-modal-bg`, `z-modal`, `z-toast` etc in className.
        // Backdrop / surface pairs follow §8 naming: `*-bg` for the dim layer,
        // bare token for the content layer above.
        "sheet-bg":  "400",
        "sheet":     "410",
        "modal-bg":  "500",
        "modal":     "510",
        "toast":     "600",
        "tooltip":   "700",
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
        // ── V3 motion vocabulary (V2-D16, 2026-05-08) — LIVE_TRUTH §F.1 + §5b ──
        // Use as `ease-snap`, `ease-spring`, `ease-glide`, `ease-thud` in className.
        "snap":   "cubic-bezier(0.4, 0, 0.2, 1)",     // standard UI transitions (focus, color)
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)", // bouncy reveal (toggle, check)
        "glide":  "cubic-bezier(0.16, 1, 0.3, 1)",     // long-distance smooth (sheet open)
        "thud":   "cubic-bezier(0.7, 0, 0.84, 0)",     // press-down feel (button press scale)
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
