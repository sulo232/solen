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
        // V3-D328 (Section A, 2026-05-27): `s-coral` alias REMOVED. The token name
        // "coral" had been an alias for the OLD brand green (#3B7A57) since the V2 →
        // V3 B&W pivot. User saw a green checkmark on StampCard + green refs surviving
        // post-sweep — root cause was this alias mapping bg-s-coral → still-rendering
        // green. Killing the alias means any future `bg-s-coral` reference compiles to
        // nothing (invisible bug = caught immediately, never silently renders as green).
        //
        // History of this alias:
        //   V2-D48: Backward-compat alias to brand DEFAULT (emerald-forest #1F5C42)
        //   V2-D70: Bumped to #3B7A57 (matches Solen logo green per spec)
        //   V3-D328: KILLED — Solen palette is now B&W + royal blue + universal-color
        //            (s-ink / s-accent / s-success / s-warning / s-error / s-star /
        //            s-urgency / s-bg). "coral" naming is misleading — never coral, always
        //            was green. To revert: re-add a token line + bulk rename callsites.
        // V3-D121 (2026-05-24): brand pivoted Solen orange → Little Amps colorway.
        // Source: littleampscoffee.com CSS extracted directly. Audit-clean
        // version (white substrate kept, banner stays neutral ink to avoid
        // double-anchor, only BentoBusiness anchors in deep coffee).
        // V3-D122 (2026-05-24): hue muted #FFC000 → #E8A93D per user "ts too
        // yellow." Pure golden yellow read as school-bus / construction. Amber
        // is warmer, less aggressive, still a strong attention pop.
        // V3-D139 (2026-05-25): forest emerald reset (Tailwind emerald-600/700/900
        // family). Darker, more "premium-craft" than V3-D138 spotify green
        // (#1DB954 → #16A34A, ~1 stop deeper). Reserved for PRIMARY CTA + LOGO
        // DOT only (≤3% of any view per 80/17/3 rule — see _tasks/SOLEN_DESIGN.md).
        //   DEFAULT  #16A34A  forest emerald       — primary CTA, logo dot ONLY
        //   pale     #DCFCE7  pale emerald wash    — hover wash (rare)
        //   subtle   #F0FDF4  ultra-pale emerald   — focus glow / ultra-subtle
        //   mid      #15803D  emerald hover        — :hover state
        //   deep     #14532D  emerald pressed      — :active / pressed (darker, near-forest)
        // WCAG: text-white on #16A34A = ~3.6:1 PASSES AA Large (3:1) — good for
        // bold/large CTAs. text-s-ink (#0A0A0A) on #16A34A = ~5.8:1 PASSES AA
        // Normal — safer for small/regular text. Choose per element size.
        "s-brand": { DEFAULT: "#16A34A", pale: "#DCFCE7", subtle: "#F0FDF4", mid: "#15803D", deep: "#14532D" },
        // NEW V3-D121 tokens:
        //   s-cool — dusty blue cool whisper (replaces teal in section arrows + secondary accents)
        //   s-pop  — vermilion held in reserve for "urgency" badges only (NOT general accents)
        "s-cool": "#89B4CA",   // dusty blue — section arrows, info chips, link color
        "s-pop":  "#C03001",   // vermilion — urgency badges only, do not use for general accents
        // ─── V3-D332 (2026-05-28) — W10.5a dashboard rescue: re-alias retired tokens ───
        // Per /dashboard triage (_dashboard-triage.md): ~1043 references to retired
        // tokens were producing ZERO CSS — invisible white CTAs on transparent buttons,
        // identical-color calendar categories, unreadable status pills. The dashboard
        // wasn't "ugly drift" — it was functionally broken in <10s of operator clicks.
        // These aliases restore rendering site-wide WITHOUT touching 1043 callsites.
        // Per LOCKFILE §10 conflict resolution + V3-D192 B&W pivot: each alias maps to
        // the closest live semantic equivalent. File-by-file cleanup defers to W17+.
        // Form: plain hex strings — Tailwind 3.x JIT computes opacity modifiers
        // (`bg-s-coral/10`, `bg-s-coral/[0.06]`) correctly on plain-hex tokens.
        // To revert: delete these 7 lines + accept dashboard returns to broken state.
        "s-coral":        "#0A0A0A",  // was CTAs / active state / brand → alias to s-ink (B&W pivot)
        "s-amber":        "#F59E0B",  // was warnings → alias to s-warning DEFAULT
        "s-blue":         "#185CE0",  // was info chips / category-color → alias to s-accent DEFAULT
        "s-plum":         "#6B6B6B",  // was secondary highlight → alias to s-ink-2
        "s-sand":         "#F5F5F4",  // was muted bg surface → alias to s-bg.sunken
        "s-amber-subtle": "#FFF3E0",  // was warning pastel bg → alias to s-warning.bg
        "s-amber-text":   "#F59E0B",  // was warning text → alias to s-warning DEFAULT
        // Section tints — values updated to fit Little Amps cream/dusty-blue palette
        // (V3-D120 removed bg-tint usage from homepage; tokens kept for back-compat).
        "s-wasabi":  "#F6EDE3",  // cream — was warm ivory (V3-D119), was green-yellow (V3-D107)
        "s-droplet": "#E8F0F4",  // pale dusty blue — was sea-glass (V3-D119)
        // Cream — kept for back-compat with non-homepage components that still reference it.
        // NOT used in the new V3-D107 section rhythm; superseded by s-peach.
        "s-cream": "#E9DFC8",
        // V3-D329 (Section A+C+D): conflicting s-accent yellow definition REMOVED.
        // This earlier object literal was being silently overridden by the s-accent
        // royal-blue definition further down (Tailwind config evaluation order: last
        // wins). Now explicit — the only s-accent is the royal blue below at line ~177.
        // To revert to yellow accent: comment that line + uncomment this one.
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
        // ── Ink (text) — V2-D70 cool-grey scale + V3-D73 contrast fix + V3-D87 white-substrate retune ──
        // Per spec: never use pure black (#000000) — causes eye strain. Primary
        // is dark rich charcoal #1A1C19, secondary is medium cool grey #6B7068.
        // V3-D73 (2026-05-18): tertiary darkened #9BA09A → #7A7F78 — calculated
        // against pearl substrate #F4F4F6 (passed AA Normal at that bg).
        // V3-D87 (2026-05-20): tertiary darkened AGAIN #7A7F78 → #5F635D after
        // V3-D86 substrate flip to pure #FFFFFF. Old #7A7F78 against white = 3.86:1
        // (FAILS WCAG AA Normal 4.5:1). New #5F635D = ~5.0:1 against white. Fixes
        // washed-out reading of section eyebrows + salon-card category meta +
        // Reviews meta lines (the "feels muted" complaint root-caused by uiux-audit
        // skill, 2026-05-20).
        // V3-D138 (2026-05-25): ink neutralized to pure greyscale per Spotify
        // palette. DEFAULT #0A0A0A (near-black, not pure #000), secondary +
        // tertiary collapse to #6B6B6B (single neutral grey-2). Border = #E7E5E4.
        "s-ink": { DEFAULT: "#0A0A0A", secondary: "#6B6B6B", tertiary: "#6B6B6B", disabled: "#C5C8C4" },
        "s-ink-2": "#6B6B6B",  // V3-D138: pure neutral grey (was warm #6B7068)
        "s-ink-3": "#6B6B6B",  // V3-D138: collapsed onto ink-2 (was #5F635D)
        "s-border": "#E7E5E4",  // V3-D138: neutral hairline (was warm #E8E6E0)
        // V3-D315 (W9 follow-up, 2026-05-27): chart-grey 3-tier scale for data-vis
        // (competitor bars, hierarchy charts). Replaces opacity-modifier-on-ink-2
        // pattern (`bg-s-ink-2/40` / `bg-s-ink-2/30`) which surfaced as a recipe-smell
        // in W5 /partner pricing comparison. Use these for any bar chart where you
        // need ink (primary brand row) + 2 progressively-muted greys for context.
        // chart-1 = primary data emphasis (use s-ink directly for THIS — included as alias for chart-row consistency)
        // chart-2 = secondary contextual row (e.g. main competitor)
        // chart-3 = tertiary contextual row (e.g. competitor range / "others")
        "s-chart-1": "#0A0A0A",  // alias of s-ink — primary chart row
        "s-chart-2": "#9CA3AF",  // medium grey — secondary chart row
        "s-chart-3": "#D1D5DB",  // light grey — tertiary chart row
        // V2-D70 (2026-05-18): substrate fine-tuned #F8F7F2 → #F9F8F6 (warm pearl /
        // alabaster per Aurex/Fresha spec). Slightly warmer + softer than V2-D68.
        // Hero gets a peach radial gradient via .bg-s-bg-peach + custom CSS layer.
        // Sunken updated to a soft warm-neutral that pairs with the new pearl base.
        // V2-D68 history (kept for archeology): substrate F8F7F2 + atmosphere wash retired.
        // V2-D60 history: cream-on-cream → WHITE on cream (killed beige collapse).
        // V3-D138 (2026-05-25): sunken aligned to user spec #F5F5F4 (cool stone
        // grey). active + peach also neutralized — apricot peach (#FFE8D8) is
        // dead. Use sunken for hover-bg / input-active / inert surfaces.
        "s-bg": { base: "#FFFFFF", surface: "#FFFFFF", raised: "#FFFFFF", sunken: "#F5F5F4", active: "#F5F5F4", peach: "#F5F5F4" },
        // V2-D48: bg.base flipped white → cream #F5EBDD (Earthen Wellness page bg). Surface +
        // sunken updated. raised stays white for cards/modals. active = cream-warm input typing.
        // V2-D16 (2026-05-08) note: cream #FFF4E8 was wrongly retired in V2-D15 comment above.
        // V2-D15 retired CREAM SUBSTRATE (page bg #FBF8F3 → white). It did NOT retire #FFF4E8 micro-tint
        // for input active-typing state (LIVE_TRUTH §F.1.0 + §14.3 search row both still cite it).
        // Re-added as `s-bg.active` — distinct from substrate. Use `bg-s-bg-active` in className.
        // ── Semantic Status Tokens (LIVE_TRUTH §3) ──
        // V3-D85-semantic (2026-05-19): collapsed warm semantic family per council
        // reduction (5 colors → 4). s-love now does double duty: heart-saved AND
        // sale/discount chips (Airbnb pattern). Muted from #FF4A6B → #CC4A60 to
        // escape gendered-pink read and stay calm against the brand royal-blue.
        // .soft = warm-red light bg for sale chips. .deep = darker warm-red for
        // hue-matched text on .soft backgrounds.
        "s-love":     { DEFAULT: "#CC4A60", soft: "#FAD2DA", deep: "#A23548" },
        "s-success": { DEFAULT: "#16A34A", bg: "#E8F5E9" },
        "s-warning": { DEFAULT: "#F59E0B", bg: "#FFF3E0", text: "#B45309" },  // V3: aligned to LIVE_TRUTH §3 hex. `.text` = readable amber for text-on-pale (V3-D347 dashboard)
        // V3-D347 — operator-dashboard CALENDAR service palette (vibrant, dashboard-only per LOCKFILE §12). Store-defined service types; NO makeup.
        "s-cal": { hair: "#2563EB", color: "#EC4899", nails: "#8B5CF6", spa: "#10B981", barber: "#F97316" },
        "s-error":   { DEFAULT: "#D32F2F", bg: "#FFEBEE" },  // V3: aligned to LIVE_TRUTH §3 hex
        // V3-D213 (2026-05-26, salon verifier fix #6): burnt-amber urgency for
        // "Last-Minute" / "Nur noch X" / off-peak deal pills. Distinct from
        // s-warning (system warning) and s-pop (vermilion urgency held in reserve).
        // Matches Fresha + ClassPass urgency treatment — pastel bg + ink-on-warm.
        // Per V3-D199 saturation contract: DEFAULT L=33% S=80% (deep burnt umber),
        // bg L=95% S=88% (pale apricot). Replaces 3 hardcoded hex usages in
        // SalonHeader's last-minute pill (was inline #FFF1E6 + #9A3412 + rgba).
        "s-urgency": { DEFAULT: "#9A3412", bg: "#FFF1E6", border: "rgba(154,52,18,0.22)" },
        "s-closed":   "#DC2626",  // V3 added — distinct from error
        // V3-D200 (2026-05-26): s-star Q1 resolution — ink #1A1A1A → yellow #FFC32B
        // per universal-color convention (V3-D197). V3-D95 "never yellow" rule is
        // SUPERSEDED — yellow stars are the universal rating signal (Airbnb/Google/
        // Yelp/TripAdvisor) and shipping code already uses yellow inline. This
        // unfucks the drift between token + reality.
        "s-star":     "#FFC32B",  // V3-D200 — yellow rating signal (universal convention)

        // V3-D192 (2026-05-26): Royal blue activated as THE Solen accent.
        // Supersedes V3-D189 "no accent" lock. Reserved per palette-pivot memory
        // 2026-05-25, now in production use. The Uber-formula "one saturated
        // accent" — used on primary CTAs + section bullets + emphasis moments.
        // To REVERT: comment out this token + change any `s-accent` callsites
        // back to `s-ink`. Single deletion point.
        // V3-D204 (2026-05-26): accent flipped #1638C4 (deep royal) → #276EF1
        // (brighter, more saturated). User-supplied color. HSL(215°, 88%, 55%) —
        // slightly above V3-D199 saturation contract L=51% cap; contract widened
        // to L 36-60% to match modern semantic-color range (Tailwind 500 lives here).
        // V3-D329 (2026-05-27, Section C+D combined): DEFAULT shifts #276EF1 →
        // #185CE0 per user "blue text vibrates" + "green doesn't match blue
        // vibrancy" (green-blue Pair 4 pick). Single token-level change:
        //   - L drops 55 → 49 → text-on-pale-bg vibration calms
        //   - Saturation matched with s-success #16A34A (similar muted vibrancy)
        //   - Old #276EF1 preserved as `s-accent.bright` for places that
        //     explicitly need the punchier hit (CTAs at large sizes, etc.)
        // The "deep" hex is now the DEFAULT; "deep" alias kept as itself for
        // backward compat with existing callsites that use s-accent-deep.
        "s-accent":   { DEFAULT: "#185CE0", deep: "#185CE0", bright: "#276EF1", pale: "#EAEFFE" },
      },
      fontFamily: {
        // V3-D190 (2026-05-26): Inter Tight (display) — supersedes V3-D75
        // Bricolage Grotesque. Inter Tight at weight 900 reads as modern-
        // confident (Tap2/Linear/Vercel pattern) where Bricolage read as
        // humanist-warm. Body font Hanken Grotesk unchanged.
        // V3-D317 (2026-05-27): single-family swap to Geist (Uber-Move-like
        // geometric sans). Display/heading/body all collapse to one family —
        // weight contrast carries the hierarchy instead of family contrast.
        display: ["'Geist'", "system-ui", "-apple-system", "sans-serif"],
        heading: ["'Geist'", "system-ui", "-apple-system", "sans-serif"],
        body:    ["'Geist'", "system-ui", "-apple-system", "sans-serif"],
        // V3-D318 (2026-05-27): JetBrains Mono for codes/receipts (font-mono-code class)
        mono:    ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
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
