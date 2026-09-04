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
        "s-amber":        "#F1AE27",  // was warnings → alias to s-warning DEFAULT
        "s-blue":         "#276EF1",  // was info chips / category-color → alias to s-accent DEFAULT
        "s-plum":         "#6B6B6B",  // was secondary highlight → alias to s-ink-2
        "s-sand":         "#F4F4F5",  // cool light grey (alias to s-bg.sunken; reverses warm #F8F5F2)
        "s-amber-subtle": "#FDF6E7",  // was warning pastel bg → alias to s-warning.bg
        // color-tokens-06 (2026-07-27): s-amber-text deleted here (was "#906309").
        // A sitewide grep found ZERO callsites; see LOCKFILE.md RETIRED section.
        // Section tints — values updated to fit Little Amps cream/dusty-blue palette
        // (V3-D120 removed bg-tint usage from homepage; tokens kept for back-compat).
        "s-wasabi":  "#F6EDE3",  // cream — was warm ivory (V3-D119), was green-yellow (V3-D107)
        "s-droplet": "#E8F0F4",  // pale dusty blue — was sea-glass (V3-D119)
        // color-tokens-06 (2026-07-27): s-cream deleted here (was "#E9DFC8", the
        // former back-compat cream alias, zero live callsites).
        // V3-D329 (Section A+C+D): conflicting s-accent yellow definition REMOVED.
        // This earlier object literal was being silently overridden by the s-accent
        // royal-blue definition further down (Tailwind config evaluation order: last
        // wins). Now explicit — the only s-accent is the royal blue below at line ~177.
        // To revert to yellow accent: comment that line + uncomment this one.
        // color-tokens-06 (2026-07-27): s-butter deleted here (was "#F2D77B",
        // former bright-accent alias, zero live callsites).
        // Sage: wellness whisper, never loud.
        "s-sage": { DEFAULT: "#A8B89A", pale: "#D4DDC8" },
        // color-tokens-06 (2026-07-27): the V3 category colorway family
        // (s-cat-coiffeur/barbershop/nails/spa + their -text variants) and the V3
        // atmosphere wash family (s-atm-cream/terra/sage/bone/butter) are deleted
        // here. Both were the Earthen Wellness palette, already RETIRED in prose
        // by LOCKFILE.md since the B&W pivot; a sitewide grep found zero live
        // callsites for any of the 13 tokens across app/components/components-legacy/lib.
        // Ink (text): V2-D70 cool-grey scale + V3-D73 contrast fix + V3-D87 white-substrate retune ──
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
        // palette. DEFAULT #0A0A0A (near-black, not pure #000). Border = #E0DDDB (V3-D447).
        // color-tokens-04 (2026-07-27): `secondary`/`tertiary` sub-keys and the sibling
        // `s-ink-3` token were FOUR live spellings of this exact same #6B6B6B hex with
        // zero semantic difference between them. Deleted; every callsite now reads
        // `s-ink-2`, the one grey-2 name. Token naming grammar: a variant is either a
        // nested key OR a flat hyphen-suffix sibling, never both, for the same hex.
        "s-ink": { DEFAULT: "#0A0A0A", disabled: "#C5C8C4" },
        "s-ink-2": "#6B6B6B",  // V3-D138: pure neutral grey (was warm #6B7068)
        "s-border": "#E4E4E7",  // cool neutral hairline (white-first, no cream; reverses warm #E8E4DF)
        // V3-D315 (W9 follow-up, 2026-05-27): chart-grey 3-tier scale for data-vis
        // (competitor bars, hierarchy charts). Replaces opacity-modifier-on-ink-2
        // pattern (`bg-s-ink-2/40` / `bg-s-ink-2/30`) which surfaced as a recipe-smell
        // in W5 /partner pricing comparison. Use these for any bar chart where you
        // need ink (primary brand row) + 2 progressively-muted greys for context.
        // Primary data emphasis: use s-ink directly, not a chart alias.
        // color-tokens-06 (2026-07-27): s-chart-1 deleted here (was "#0A0A0A", an
        // alias of s-ink with zero live callsites; use s-ink directly instead).
        // chart-2 = secondary contextual row (e.g. main competitor)
        // chart-3 = tertiary contextual row (e.g. competitor range / "others")
        "s-chart-2": "#9CA3AF",  // medium grey — secondary chart row
        "s-chart-3": "#D1D5DB",  // light grey — tertiary chart row
        // V2-D70 (2026-05-18): substrate fine-tuned #F8F7F2 → #F9F8F6 (warm pearl /
        // alabaster per Aurex/Fresha spec). Slightly warmer + softer than V2-D68.
        // Hero gets a peach radial gradient via .bg-s-bg-peach + custom CSS layer.
        // Sunken updated to a soft warm-neutral that pairs with the new pearl base.
        // V2-D68 history (kept for archeology): substrate F8F7F2 + atmosphere wash retired.
        // V2-D60 history: cream-on-cream → WHITE on cream (killed beige collapse).
        // V3-D138 (2026-05-25): sunken stone surface. V3-D460 (council 2026-06-09, owner-approved):
        // WARMED #F5F5F4 (cool) -> #F8F5F2 (warm) — the "dead-grey" fix. Warmth lives in the surface
        // itself, not in accent colour; this cascades to every hover-bg / input-active / inert surface.
        "s-bg": { base: "#FFFFFF", surface: "#FFFFFF", raised: "#FFFFFF", sunken: "#F4F4F5", active: "#F4F4F5", peach: "#F4F4F5" },
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
        // Open-status green ONLY (Geöffnet text + open dot). Fresha's calmer
        // rgb(31,137,0) = #1F8900, owner 2026-06-12 "make the green more like Fresha".
        // FIXED 2026-08-15 (owner: "the green is, like, just too bright. I don't like
        // that."): the literal now matches its own recorded source above, it never did
        // before. Measured contrast on white: old #22C55E = 2.32:1 (fails WCAG 1.4.3 AA
        // and the 3:1 graphical floor); new #1F8900 = 4.53:1 (AA pass).
        // s-success stays the universal success green everywhere else.
        // `text` is NOT a second green, it is this green's legibility variant, the same
        // DEFAULT-plus-.text split s-success/s-warning/s-error already use. It exists because a
        // FILL and a TEXT STROKE are not the same job: DEFAULT 2.68:1 is fine for an 8px disc and
        // unreadable as 15px type, where the floor is 4.5:1. `text` measures 4.53. Without the
        // split, honouring his pick on the dot would have silently deleted the green from the
        // header line, which is the one line he asked to HAVE green ("write it to when it's open").
        "s-open": { DEFAULT: "#21B646", text: "#1F8900" },  // owner picked A off /dev/round5, 2026-08-15.Interpolated a quarter of the way from the #22C55E he called too bright toward the #1F8900 he called too dark. Contrast 2.68 on white: fine for the DOT, which is redundant with the word beside it, and too pale for TEXT, which is why StatusInline stopped colouring the word.
        // Selected-pill black, owner-picked 2026-08-15 from the four-way mockup at
        // /dev/pill-ceramic ("I don't know about, like, probably d. Yeah. Let's use d. So, yeah,
        // replace them."). Direction D: ink lifted one step off pure so a 44px filled pill stops
        // reading as a hole punched in the page, with no gradient and no shadow, because those
        // were the two directions that multiply into noise when four pills sit in a row.
        // A TOKEN, not a literal, exactly as the mockup said it would become if he picked one.
        // Contrast against its white label: 16.4:1, so it clears AA and AAA with room.
        //
        // PROMOTED 2026-08-15 from "the selected pill's black" to THE INK FILL, everywhere.
        // Owner: "I want the black used everywhere to be this ... not everywhere, like, text.
        // Don't change it ... for example, button ... what's already, like, fulfilled black ...
        // I want that to be this color. I want you to actually put in design system."
        // The rule that makes it apply lives in app/globals.css, in the `.bg-s-ink` override at
        // the top of @layer utilities, and that block carries the full reasoning plus the list of
        // what is deliberately NOT covered (text, borders, glyphs, alpha scrims, gradient stops).
        // Read it before changing either value: `s-ink` below stays #0A0A0A because it is the TEXT
        // ink and has 5475 call sites.
        "s-ink-soft": { DEFAULT: "#1C1C1F" },
        "s-warning": { DEFAULT: "#F1AE27", bg: "#FDF6E7", text: "#B45309" },  // V3-D421: the "amber twin" of s-accent (Uber-blue HSL S+L, hue rotated to 40deg) so warning is cohesive with the accent. .text = deep amber for text-on-pale.  // V3: aligned to LIVE_TRUTH §3 hex. `.text` = readable amber for text-on-pale (V3-D347 dashboard)
        // V3-D347 — operator-dashboard CALENDAR service palette (vibrant, dashboard-only per LOCKFILE §12). Store-defined service types; NO makeup.
        "s-cal": { hair: "#2563EB", color: "#EC4899", nails: "#8B5CF6", spa: "#10B981", barber: "#F97316" },
        "s-error":   { DEFAULT: "#DC2626", bg: "#FEE2E2" },  // V3-D421: consolidated onto the locked red (was off-brand #D32F2F); error == closed, one red system
        // V3-D213 (2026-05-26, salon verifier fix #6): burnt-amber urgency for
        // "Last-Minute" / "Nur noch X" / off-peak deal pills. Distinct from
        // s-warning (system warning) and s-pop (vermilion urgency held in reserve).
        // Matches Fresha + ClassPass urgency treatment — pastel bg + ink-on-warm.
        // Per V3-D199 saturation contract: DEFAULT L=33% S=80% (deep burnt umber),
        // bg L=95% S=88% (pale apricot). Replaces 3 hardcoded hex usages in
        // SalonHeader's last-minute pill (was inline #FFF1E6 + #9A3412 + rgba).
        "s-urgency": { DEFAULT: "#C2410C", bg: "#FFF1E6", border: "rgba(194,65,12,0.22)" },
        // V3-D424 (2026-06-02): VIVID orange for FOCAL "surcharge / extra-charge" moments
        // (customer Nachzahlung, dashboard upcharge). The missing vivid warm hue.
        // ⚠ s-warning.text (#906309) + s-urgency (#9A3412) are DARK-for-text-on-pale
        // (readability) — NOT focal colors; using them as a hero/focal number reads muddy.
        // Vivid warm focal => s-surcharge.DEFAULT on a light s-surcharge.bg.
        "s-surcharge": { DEFAULT: "#EA580C", bg: "#FFEDD5" },
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
        // V3-D421 (2026-06-01): DEFAULT reverted #185CE0 -> #276EF1 (Uber's exact blue, verified vs Uber brand palette). Accent is functional-only now (focus ring / spinner / input per CANON.md), so the old "blue text vibrates" reason for deepening is moot; #276EF1 = 4.6:1 on white (passes AA). Split collapsed: DEFAULT = deep = bright.
        // DS-6 (2026-06-11, video-audit, owner-approved): deep re-activated as the
        // hover/pressed step for interactive blue (links/chips/inline actions):
        // hover:text-s-accent-deep, 150ms. Never used at rest. LOCKFILE §1 + §1.5.
        "s-accent":   { DEFAULT: "#276EF1", deep: "#1E54B7", bright: "#276EF1", pale: "#EAEFFE" },
      },
      fontFamily: {
        // V3-D190 (2026-05-26): Inter Tight (display), supersedes V3-D75
        // Bricolage Grotesque. Inter Tight at weight 900 reads as modern
        // confident (Tap2/Linear/Vercel pattern) where Bricolage read as
        // 2026-05-31 (V3-D410): body font Hanken Grotesk to Inter. Mirrors Uber's
        // one-family display+text structure (Inter Tight + Inter matches Uber Move +
        // Uber Move Text); Inter 400 reads solid where Hanken 400 read thin. No Geist.
        // Font-loading fossil fix: both fonts are self-hosted via next/font/google in
        // app/layout.tsx (--font-inter-tight, --font-inter CSS variables), replacing
        // the old runtime Google-Fonts @import. Consume the variable first so the
        // real self-hosted family resolves; the quoted name is a fallback only.
        display: ["var(--font-inter-tight)", "'Inter Tight'", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-inter-tight)", "'Inter Tight'", "system-ui", "-apple-system", "sans-serif"],
        body:    ["var(--font-inter)", "'Inter'", "system-ui", "-apple-system", "sans-serif"],
        // V3-D470 (2026-06-10): JetBrains Mono RETIRED (owner: "the W-047 font is
        // different"). Codes render Inter Tight tabular via .font-mono-code (globals.css).
        // `mono` key kept pointing at Inter Tight so any stray font-mono resolves in-family,
        // never browser-default monospace. See LOCKFILE §13.4.
        mono:    ["var(--font-inter-tight)", "'Inter Tight'", "system-ui", "-apple-system", "sans-serif"],
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
        // whisper — the GROUPED LIST CARD shadow (Atelier service-grouping mockup,
        // owner-approved 2026-06-11). Barely-there lift for rows-in-one-card lists.
        whisper:            "0 1px 3px rgba(10,10,10,0.04), 0 10px 28px -14px rgba(10,10,10,0.10)",
        "elevation-1":      "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        // V3 (2026-06-29, owner + council): single-layer (the old two-layer read as a "double line").
        // "A" (0 1px 4px) came back too light; council pick = a touch heavier, still single-layer, visible.
        "elevation-2":      "0 2px 8px rgba(50,47,44,0.09)",
        "elevation-3":      "0 6px 16px rgba(50,47,44,0.12)",
        // ── Float (V3-D-depth, 2026-06-09; SOFTENED same day) ── a SUBTLE, restrained lift for
        // resting cards, NOT a wide decorative float. The original wide float read as over-engineered
        // ("visual overworking" per Tim Gabe; owner: "overmade the depths"). Premium feel comes from
        // MOTION, not heavy shadows. Resting content gets this quiet lift; only OVERLAYS (sheets,
        // lightbox, gallery, dropdowns) earn a stronger shadow. Cascades to tiles + salon cards.
        "float":            "0 1px 2px rgba(50,47,44,0.05), 0 4px 12px -6px rgba(50,47,44,0.10)",
        // Aliases for backward compat
        "v5-card":       "0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)",
        "v5-card-hover": "0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)",
        "v5-float":      "0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)",
      },
      zIndex: {
        55: '55',
        60: '60',
        70: '70',
        // "nav": persistent bottom chrome (BottomNav). Above ordinary page content
        // (highest in-page usage is 90, OfflineBanner) and below every layer in the
        // V3 lock below, so a sheet, modal, toast or the cookie banner always covers
        // it. Added 2026-09-04, replacing a raw z-[700] that sat inside the tooltip
        // layer and blocked the toast Undo button underneath it.
        nav: '150',
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
        // "shadow-transform" REMOVED (motion-06, 2026-07-27): bundled box-shadow with transform
        // under a name implying both are compositor-cheap, box-shadow is not (LOCKFILE SS3.5).
        // Zero live usages when removed (grep -rn "shadow-transform" app -> 0 hits).
        "colors-shadow": "color, background-color, border-color, box-shadow",
      },
      animation: {
        "count-up": "count-up 0.6s ease-out forwards",
        "slide-in-up": "slide-in-up 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        "fade-in": "fade-in 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        // mockup-ok: WCAG 2.2.2 conformance fix. Was `infinite`, so a 6-card skeleton grid ran
        // 30 concurrent unbounded loops until the fetch resolved. Bounded to 3 cycles (4.5s,
        // under the 5s ceiling) and held on the final frame (forwards). The keyframe below is a
        // symmetric 3-stop gradient (colour, highlight, same colour), so both the 0% and 100%
        // endpoints land on the flat neutral fill, never a mid-sweep highlight (`bg-position` at
        // +/-200% pushes the highlight fully out of view either direction).
        "shimmer": "shimmer 1.5s ease-in-out 3 forwards",
        // mockup-ok: WCAG 2.2.2 conformance fix, same technique as `shimmer` above.
        // `animate-ping` (BentoBusiness.tsx "Bestätigt 23 Sek." halo) was Tailwind's
        // stock `infinite`; bounded to 3 cycles of the stock 1s/timing (3s, under the
        // 5s ceiling), held on the final frame (forwards, ping's own keyframe already
        // ends at opacity 0 / scale 2, so it settles invisible, leaving just the solid
        // dot as the resting state).
        "ping-bounded": "ping 1s cubic-bezier(0, 0, 0.2, 1) 3 forwards",
        // mockup-ok: WCAG 2.2.2 conformance fix. `animate-pulse` was NOT on the known
        // offender list (RANK 1) even though it is the same infinite-loop shape as
        // shimmer/ping; BentoBusiness's 3 "customer is typing" dots ran it unbounded.
        // Bounded to 2 cycles of the stock 2s timing (4s, under the 5s ceiling even
        // with the dots' up to 400ms stagger), held on the final frame (forwards;
        // pulse's own keyframe ends back at opacity 1, so the dots settle fully
        // visible, a legible static state).
        "pulse-bounded": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 2 forwards",
        // mockup-ok: WCAG 2.2.2 conformance fix, same technique as shimmer/ping/pulse above.
        // `animate-spin` (Loader2/RefreshCw page-load indicators) was Tailwind's stock
        // `infinite`; bounded to 4 cycles of the stock 1s/linear timing (4s, under the
        // 5s ceiling). `forwards` holds the final frame at a WHOLE rotation (spin's
        // keyframe is 0deg->360deg, so 4 full cycles land back at the upright, legible
        // icon, never mid-turn), so a fetch that is still running past 4s reads as a
        // paused/static icon in the loading slot, not a frozen half-spin.
        "spin-bounded": "spin 1s linear 4 forwards",
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
