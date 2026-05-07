# SOLEN — Live Truth (the only principal)

> **THIS DOC IS THE FINAL WORD.** When in doubt, this wins — over Q-locks, over the reference HTML, over component JSDoc, over your memory. No history here. No "supersedes Q23" or "in-flight pivot" or "exception added last week" — those live in `_tasks/SOLEN_DESIGN.md` (history) for context. This doc is the **current locked state**, end of story.
>
> If you're tempted to reconcile this doc with another doc → don't. This wins. If this doc is wrong, **fix this doc first**, then propagate. Never the other way around.
>
> Updated: 2026-05-03.

---

## 1. Brand color (the primary signal)

| Role | Hex | Tailwind token | Where it appears |
|---|---|---|---|
| Brand primary | `#1B4D1B` | `s-coral.DEFAULT` (name retained for backward-compat — value is **green**) | CTAs, buttons, focus rings, brand-eyebrow dots, sliding underlines, time pulses, em-underlines |
| Brand hover | `#0F3010` | `s-coral.hover` / `s-coral.button-hover` | Hover state on the primary brand surfaces |
| Brand subtle/tint bg | `#E8EFE4` | `s-coral.subtle` | Light brand-tinted background (e.g. promise pill bg) |
| Brand deep text | `#0F3010` | `s-coral.text` | Deep text on light brand-tinted backgrounds |

**Tailwind classes** that resolve to the brand color: `bg-s-coral`, `text-s-coral`, `border-s-coral`, `focus-visible:ring-s-coral`. The token group is named `s-coral` for backward-compat across hundreds of import sites — **the value is forest green**.

**Contrast (WCAG):** brand-green `#1B4D1B` on white = **9.89:1**, passes AA body text. White on brand-green = 9.89:1, passes AA body for any text size. No banned-pair concerns post-Q64.

---

## 2. Secondary accent — amber

| Role | Hex | Tailwind token |
|---|---|---|
| Amber default | `#F3A864` | `s-amber.DEFAULT` |
| Amber hover | `#E69850` | `s-amber.hover` |
| Amber subtle/tint bg | `#FCEBD3` | `s-amber.subtle` |
| Amber deep text | `#8C4A14` | `s-amber.text` |

**Use amber for:** rating stars, eyebrow on dark register, hero accent line ("DIREKT GEBUCHT."), "Ohne Anrufen" promise pill, section eyebrows on light bg (per `.sec-eye{color:var(--amber)}` reference convention).

**Never use amber for:** primary CTAs (those are brand-green).

---

## 3. Semantic colors (DISTINCT from brand — never collapse)

| Semantic | Hex | When to use | Why distinct from brand |
|---|---|---|---|
| Love-red (heart save) | `#FF4A6B` | All heart-save icons (favorites, "love this") | Universal love-save semantic, must work even if brand color flips again |
| Status success | `#16A34A` | Success toasts, "Heute frei" availability chips, walk-in queue confirmations | Mid-green — distinct from brand forest-green `#1B4D1B`. Never collapse. |
| Status warning | `#F3A864` (amber) | Warning toasts, soft notifications | Same hex as amber accent — semantic and accent share token here intentionally |
| Status error | `#D32F2F` | Error toasts, form errors | — |
| Open-state green (Jetzt offen) | `#16A34A` | Salon "open now" indicator | Same as status success |
| Closed-state red | `#DC2626` | Salon "closed" indicator | — |

**Anti-pattern (banned):** using brand-green `#1B4D1B` for success status, OR using `s-coral` token for hearts. The semantic tokens above stay literal hexes in code; never reference brand tokens.

---

## 4. Warm-ink neutral scale (substrate)

| Role | Hex | Tailwind | Use |
|---|---|---|---|
| Ink primary (body text) | `#1A1209` | `text-s-ink` / `bg-s-ink` | All body text, dark register backgrounds (footer, BrowseByCity, QuartiersGrid) |
| Ink-2 (secondary text) | `#56463E` | `text-s-ink-2` | Secondary text (sub-lines, meta, italic quotes) |
| Ink-3 (warm grey) | `#9F8A7E` | `text-s-ink-3` | Tertiary text (count chips, divider labels, location text) |
| Ink-disabled | `#C4B8A6` | `text-s-ink-disabled` | Disabled state text |
| Border (warm hairline) | `#EFE7DD` | `border-s-border` | All hairline borders, dividers |
| Sunken surface | `#FAF7F3` | `bg-s-bg-sunken` | Cream-tinted surfaces (testimonial section bg, dashboard sidebar, card grid bg) |
| Cream warm | `#FFF4E8` | `bg-s-bg-cream` | Warm-cream surfaces (4-stat tiles, alerts) |
| Page bg | `#FFFFFF` | `bg-white` | Main page background — locked white |
| Shadow tint | `rgba(26,18,9, X)` | inline | All box-shadows. Use `0.04 / 0.06 / 0.08 / 0.18` etc. NEVER `rgba(0,0,0,X)`. NEVER colored-glow shadows. |

**Anti-pattern (banned):** pure black `#000000`, pure-black shadows `rgba(0,0,0,X)`, cool-grey hexes like `#9E958C`/`#767676`/`#EBEBEB`/`#e5e7eb` — always use warm-ink tints.

---

## 5. Per-category accent colors (LOCKED EXCEPTIONS — not subject to brand pivots)

| Category | Hex | Where it appears |
|---|---|---|
| COIFFEUR | `#D4870A` (amber-deep) | CategoriesGrid tile, Coiffeur salon card cover, CoiffeurIcon |
| BARBER | `#4A1E3C` (plum) | CategoriesGrid tile, Barber salon card cover, BarberIcon, PartnerBlock card bg |
| **NAILS** | `#E8624A` (coral hex) | CategoriesGrid tile, Nails salon card cover, NailsIcon — **this hex IS the OLD pre-Q64 brand coral. It is locked here as the NAILS CATEGORY COLOR — NOT brand drift. Never sweep this hex in `components/ui/ImageFallback.tsx` or `components/icons/category/NailsIcon.tsx`.** |
| SPA | `#7BA688` (sage) | CategoriesGrid tile, Spa salon card cover, SpaIcon |
| MAKEUP | `#C9A96E` (sand) | CategoriesGrid tile, Makeup salon card cover, MakeupIcon |
| WAXING | `#6BA3C8` (blue) | CategoriesGrid tile, Waxing salon card cover, WaxingIcon |

The pre-sweep hook (`.claude/hooks/pre-sweep-check.sh`) explicitly excludes the 2 files where `#E8624A` is the NAILS color, so any agent attempting `replace_all` for `#E8624A` in user code will be blocked unless the user has approved it.

---

## 6. Typography

| Role | Family | Weight | Size convention |
|---|---|---|---|
| Display (headings, hero, big numbers) | Anton | single weight 400 | always uppercase. h1-h6 globally have `text-transform: uppercase` per `globals.css` base layer |
| Body | Figtree | 400-700 | default body text. Base size 14-15px, sub-lines 12-13px |
| Mono (numerics, code) | JetBrains Mono | 400-500 | tabular-nums on prices, ratings, counts, timers per Q43 |
| Letter-spacing | Anton: `0.01em` (Q48) · all-caps eyebrows: `0.18-0.22em` | | |

**Anti-pattern (banned):** Bebas Neue, Fraunces, DM Sans, Plus Jakarta, Outfit, Phosphor (all retired). JSDoc comments mentioning these are stale — ignore. The Tailwind token `font-heading` aliases to Anton (not Bebas, despite legacy naming in some component files).

---

## 7. Locked patterns (the homepage above-fold + key components)

### Hero (homepage above-fold)
- **Eyebrow**: amber `#F3A864` Figtree 700 11px `.22em` uppercase ("Von der Schweiz. Für dich.")
- **Headline**: 2-tone Anton `clamp(64px, 9vw, 130px)` line-height 0.87 — first line ink, second line amber. Currently: "BEAUTY." (ink) + "DIREKT GEBUCHT." (amber).
- **Sub-line**: italic Figtree 15-17px ink-2.
- **Primary CTA**: Q49 stacked Was/Wo/Wann search button (3-row) → opens GuidedSearch sheet. **Do NOT replace with horizontal segmented search bar.**
- **Quick action chips** below: Last-Minute / In der Nähe / Trending — outlined pill style.

### Promise pills (under hero)
- 3 pills horizontally: "Sofort buchbar" (sage tint) · "Ohne Anrufen" (amber tint) · "Heute frei" (blue tint)
- 32px height, `0 14px` padding, 99px radius, Figtree 600 13px, 7×7px dot before label
- Bg + text use the per-pill color tints; brand-green pill uses `s-coral.subtle/text/DEFAULT` (which post-Q64 = green family)

### Salon cards (A3 — pre-launch)
- **Photos KILLED.** Card image area is solid per-category color block + Anton uppercase salon name
- 1:1 aspect ratio
- White text 90% opacity on colored bg
- Heart top-right (love-red `#FF4A6B`, NOT brand)
- Badge top-left (frosted pill, e.g. "TOP BEWERTET", "BELIEBT")
- Salon detail page (`/salon/[slug]`) keeps photos — pre-launch kill is cards-only

### Salon detail hero (Q52)
- Single full-bleed photo (~50% viewport height, NO carousel, NO auto-rotate, NO dot indicators)
- Top controls: back button left + share + heart right (each 36px white-95% circle, soft shadow). Heart = `#FF4A6B` love-red.
- Bottom-fade overlay: `linear-gradient(to top, rgba(26,18,9,.85) 0%, rgba(26,18,9,.55) 45%, transparent 100%)`
- Eyebrow inside overlay: amber `#F3A864`. Headline: Anton white uppercase.
- Optional `topBadges` (Solen Favorit / Top bewertet) above headline + optional `offPeakBadge` top-left
- Below photo: thumbnail strip 3 visible + `+N` overflow → opens PhotoLightbox
- Below thumbs: meta strip (`★ rating · open-state · etc.`)

### Sticky tab bar (Q52 + Q35)
- Sliding underline = brand-green `#1B4D1B` (`bg-s-coral`), 2px, 200ms ease per Q35 motion grammar
- Inactive text: `#9F8A7E` warm-grey ink-3
- Active text: warm-ink (selection-by-weight, NOT brand-flood per SOLEN_UI #2c)
- Focus ring: 2px brand-green outline, 2px outside-offset

### Booking wizard (Q55 + Q56)
- 3 steps: Service+Staff → Date+Time → Pay+Confirm
- 3-segment progress bar (brand-green fill = current OR completed, sunken bg for inactive)
- Eyebrow `Schritt N / 3` + Anton step label
- Tappable previous segments only (forward-jump banned — breaks validation)

### Confirmation moment (Q57)
- Q36 celebration ring (booking kind, ~700ms coral expand + checkmark scale-in) — `CelebrationRing` component
- Q48 signature: eyebrow `Bestätigt · #<bookingId>` + Anton `Buchung bestätigt`
- Summary card (Was / Wann / Wo / Wer)
- 3 utility chips: In Kalender / Wegbeschreibung / Teilen
- Secondary CTA `Zur Buchung →` (neutral, NOT brand)
- **Banned**: confetti, auto-redirect, upsell, ReviewPrompt (last is in 24h cron, not here)

### Header (Phase 8.6)
- **Homepage**: logo + always-visible compact search pill + hamburger/profile. NO icon-tab category strip.
- **Category pages** (`/coiffeur` etc.): full SVG icon-tab nav for cross-category browsing
- **Dashboard + auth pages**: header hidden entirely

### Footer
- Bg: `#1A1209` warm-ink dark
- Sprout SVG icon (brand-green leaves) + Anton "SOLEN" wordmark
- Tagline + 3 columns (Plattform / Für Salons / Rechtliches) + lang switcher

---

## 8. Anti-patterns — NEVER do these

These lose visual identity, break semantic discipline, or cause documented regressions:

### Color discipline
- Use `s-coral` (brand) token for heart icons → use literal `#FF4A6B`
- Use brand-green `#1B4D1B` for success-status surfaces → use status `#16A34A`
- Brand color flood for selection (active tabs, selected chips) → use weight + ink contrast (SOLEN_UI #2c)
- Pure black `#000000` body text → warm-ink `#1A1209`
- Pure-black shadows `rgba(0,0,0,X)` → warm-ink-tinted `rgba(26,18,9,X)`
- Colored-glow shadows (`rgba(coral, X)`, `rgba(amber, X)`) → warm-ink only
- Hue-shift hover states (`#1B4D1B → #2A6B2E`) → use `filter: brightness(1.05)` instead
- Cool-grey hexes (`#9E958C`, `#767676`, `#EBEBEB`, Tailwind `#e5e7eb` default) → warm-ink tints

### Typography
- Bebas Neue / Fraunces / DM Sans / Plus Jakarta / Outfit / Phosphor (all retired, do not reintroduce in new code)
- `font-heading` + `font-bold` (Anton is single-weight 400; bold variants no-op)
- Negative letter-spacing (Fraunces-era convention; Anton uses positive `0.01em`)
- Pure black body text

### Layout / structure
- Carousel hero on salon detail (single full-bleed only per Q52)
- Bottom-sheet booking modal (use full-page wizard route per Q53)
- Photos on salon discovery cards (pre-launch — A3)
- Category icon-strip in homepage header (Phase 8.6 retired — keep on category pages)
- Glass-everywhere effects (V5 retired; glass allowed only on header on scroll)
- Blobs in every section (only allowed in hero + Instagram per ref)
- Decorative gradients (Q23 ban; gradient only on Live-Activity Q58 + loyalty hero Q59)
- 3:2 cover photos (V5 retired — use 1:1 squares per Q26)
- Dark mode (Q62 retired — single light theme)
- 5-photo Airbnb grid hero (Q52 superseded)
- Dot-indicator carousels (banned per Q52 + Q58)

### i18n
- `t("foo.bar.baz") || "fallback"` pattern when the key doesn't exist in `messages/de.json` — next-intl returns the literal key path (NOT undefined), so the fallback NEVER fires. Either (a) add the key to messages/de.json + en.json + fr.json + it.json, OR (b) hardcode the German string. Do not ship the broken pattern.

### Process (sweep + verify)
- Mass token sweeps without first running `grep -c '<value>' public/solen-coral.html _tasks/SOLEN_DESIGN.md` — runtime hook will block
- Claiming "verified / done / matches" without a cited file:line from the rendered HTML or this doc
- Single-section verifier dispatch counted as full-page verification (run the FULL-PAGE LOOP — see §11)
- Above-fold-only screenshots counted as full-page screenshot scan (must screenshot top + middle + bottom)

---

## 9. Locked exceptions (carve-outs from the rules above)

These are the 4 specific cases where a "rule" has a deliberate exception:

1. **Hero accent line stays AMBER, not brand-green**
   The second line of the homepage hero ("DIREKT GEBUCHT.") is rendered in amber `#F3A864`, hardcoded in `SignatureLockup.tsx`, NOT via `s-coral` token. This is a single-spot override — every other use of brand color follows §1.

2. **NAILS category color = `#E8624A` (the old brand coral hex)**
   See §5. Locked exception in 2 files (ImageFallback CATEGORY_COLORS map + NailsIcon gradient stops). Pre-sweep hook excludes these files.

3. **Coral-amber gradient on Live-Activity / Loyalty / Dashboard "Now" pill**
   8 instances currently render `linear-gradient(135deg, #1B4D1B 0%, #F3A864 100%)` (post-Q64). The blend through olive in the middle is a known visual concern (spawned task chip for user decision). Until resolved, treat as locked-as-rendered.

4. **`s-coral` Tailwind token name**
   The token group keeps its name `s-coral` even though all values resolve to green. Backward-compat across hundreds of import sites. **Future cleanup**: rename to `s-brand` so name matches value.

---

## 10. Where things actually live (so you know what to touch)

| Concern | File |
|---|---|
| Brand tokens (current values) | `tailwind.config.js` (theme.extend.colors.s-coral.* etc.) |
| CSS variables (focus ring, etc.) | `app/globals.css` (`:root` + `@layer base`) |
| Visual reference (HTML demo) | `public/solen-coral.html` (preview at `localhost:3000/solen-coral.html`) |
| Q-lock decision history (read for context, NOT for current values) | `_tasks/SOLEN_DESIGN.md` §20 decisions log |
| Universal UI principles | `_rules/SOLEN_UI.md` |
| Pre-sweep runtime guard | `.claude/hooks/pre-sweep-check.sh` |
| Design verifier subagent | `.claude/agents/design-verifier.md` |
| /verify slash command | `.claude/commands/verify.md` |
| Phase 8 structural plan | `_tasks/PHASE_8_STRUCTURAL_ALIGNMENT.md` |
| Build learnings (L0-L8 protocol) | `_tasks/SOLEN_BUILD_LEARNINGS.md` |
| Project rules | `CLAUDE.md` |

---

## 11. The FULL-PAGE LOOP (verification recipe)

Before claiming any homepage / page-level work is "complete," run this in order. End state is YES or NO. If any step is "no/unsure," answer is NO.

1. **Curl + grep raw keys** (whole doc):
   ```bash
   curl -s http://localhost:3000/de > /tmp/_homepage.html
   grep -cE '\b[A-Z]+\.[A-Z]+\.[A-Z]+\b' /tmp/_homepage.html      # must be 0
   grep -cE '\b(home|salon|profile|partner|categories|quartiers|filters|testimonials)\.[a-z]+\.' /tmp/_homepage.html   # must be 0
   ```

2. **Three screenshots**: top (scroll 0), middle (scroll height/2), bottom (scroll height-viewportHeight). Compare each to the matching slice of `solen-coral.html` opened side-by-side. Document PASS/FAIL per pair.

3. **Section list, live vs reference**: enumerate every section in render order. Counts equal? Names equal? Order equal? If counts differ → structural drift (extra section, redundant section).

4. **Per-section verifier dispatch + page-level pass**: each section verified individually, plus a final "whole page flow + visual rhythm + cross-section redundancy" verifier dispatch.

5. **Lesson-propagation grep**: take the patterns fixed in the last 3 commits and grep ALL `components/home/*.tsx` (and adjacent shared components used on home). Zero hits = lesson propagated.

6. **Cross-section visual checks** (manual): adjacent sections share purpose? (redundancy). Background colors alternate as reference? Below-fold sections use banned patterns?

7. **Full diff review**: `git diff main..HEAD components/ public/solen-coral.html` reviewed end-to-end, not just last commit.

If 1-7 all YES → page is complete. Otherwise NO. Apply L8 Guardrail B: never claim PASS without citation.

### Step 8 — The Catch Pre-Mortem (NEW 2026-05-03 — non-skippable)

Before claiming "done" / "verified" / "complete" / "ready to commit" on ANY UI change, the agent MUST stop and answer this in writing (in the conversation, not silently):

> **"If [user] catches a problem in this output in the next reply, what is the most likely thing they catch? Name 3 candidates. For each, did I check it directly — not via a verifier-PASS proxy?"**

Rules:
1. The 3 candidates must be **specific and falsifiable**, not vague. ("Brand-color flood" is good. "Looks weird" is not.)
2. For each candidate, "checked directly" = the agent personally read the rendered output OR ran a grep with explicit count. "Verifier returned PASS" or "hook didn't fire" or "screenshot looked roughly right" do NOT count as direct.
3. If ANY of the 3 candidates was NOT directly checked, the agent must do that check before shipping. No exceptions.
4. The 3 candidates must include at least one PRINCIPLE-LEVEL check (one-primary, brand-flood, redundancy, restraint), not only token-level.

**Why this exists** (from the 5-agent root-cause audit, Agent 5):
- The agent shipped 4+ infrastructure layers (L8, hooks, verifier, LIVE_TRUTH) and still violated them within hours.
- "Compliance via documentation" — writing the rule produces a memory artifact but no commitment to re-activate it at decision time.
- Verifier PASS becomes "laundered authority" — agent trusts the delegated check uncritically.
- The Pre-Mortem cannot be satisfied by ANY tool's PASS signal because it requires *predicting the user's likely catch* — which is a simulation task, not a verification task.

**This step is non-skippable.** No "go autonomous" / "no cap" / "keep going" user message overrides it. If the user says "ship it," the agent MUST still run the Pre-Mortem in the same reply before the commit goes out. The user can override per-instance with explicit "skip pre-mortem this once" — never blanket.

**What this looks like in practice** (the agent's reply pattern before any "done" claim):
```
Catch Pre-Mortem before shipping:
1. Most likely catch: <specific thing> — checked directly via <method>: <result>
2. Most likely catch: <specific thing> — checked directly via <method>: <result>
3. Most likely catch: <specific thing> — checked directly via <method>: <result>
All 3 directly checked. Shipping.
```
OR if a check failed:
```
Catch Pre-Mortem caught: <specific thing> not yet verified directly. Doing that now: <fix>. Re-running pre-mortem after.
```

---

## 12. When to update this doc

Update **this doc first** whenever:
- A token value changes (brand color flip, new accent color)
- A new locked exception is added
- A retired pattern reactivates OR a current pattern retires
- A new file becomes a sweep-hook exclusion
- A new anti-pattern is discovered through user feedback

When you update this doc, then propagate to: `tailwind.config.js`, `app/globals.css`, the verifier protocol, and (if relevant) `CLAUDE.md`. **This doc is the source; the others mirror.**

Don't add a Q-lock entry to `_tasks/SOLEN_DESIGN.md` unless it represents a real new decision worth preserving in the history. Q-locks are slow; this doc moves fast.
