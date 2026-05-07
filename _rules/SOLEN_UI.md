# Solen UI — Think Before You Output

> Principles checklist every agent (Claude Code, Claude Design, Cursor, fresh sessions) MUST walk through BEFORE producing any UI/UX output — new screen, component, redesign, layout change, color tweak, copy update. Forces a principle-check so output isn't generic AI slop. Universal UI/UX principles live here; Solen-specific tokens (palette, fonts, retired patterns) live in `_tasks/SOLEN_DESIGN.md`. Both are required reading before shipping pixels.

> **Hard stop**: before writing a single line of UI code or generating a mockup, walk through every principle below and answer how your design satisfies it. If you can't answer one, the design isn't ready. Don't output yet.

---

## Why this skill exists

Solen is in active design overhaul. Multiple agents (Claude Code, Claude Design, Cursor, future you) touch the same surfaces. Without a shared thinking layer, output drifts into generic SaaS aesthetics — gradient buttons, drop shadows everywhere, no empty states, decorative arrows, mismatched icons, cramped spacing.

This file is the **mental checklist every agent runs before producing UI**. It's not a rulebook. It's a forcing function: articulate *why* your design works before you commit to pixels.

For Solen-specific locks (coral hex, fonts, retired patterns, glass rules, blob rules) → `_tasks/SOLEN_DESIGN.md` is the source of truth. This skill sits *on top* of that — universal principles, not tokens.

---

## The 10 principles — answer each before outputting

### 1. Flow first
Did you sketch the flow before designing the screen? What's the **happy path**, **empty state**, **error state**, **loading state**, **skip path**? Most beginner designs only handle the happy path — users feel the gaps instantly.

> Ask: *If I'm a first-time user and I have nothing to show / something fails / I want to skip — does this screen still work?*

### 1b. User intent before aesthetics
Before picking colors, icons, or layouts, answer: **what is the user trying to do on this surface?** A booking marketplace exists to help users *find a salon and book*, not to impress designers. Start from intent — what action does the user want to complete? — and let the UI emerge from that. Hero images, gradient backgrounds, and 3D flair don't add functionality if the core action (search → results → book) wasn't designed first.

A surface can serve multiple intents (e.g. "I know what I want" → search; "I'm browsing" → curated listings + filters). Add functionality only as intents expand — don't gold-plate one path while ignoring others.

> Ask: *What's the primary intent of this surface? What's the secondary intent? Does the design serve them, or am I just decorating?*

### 2. One primary action
Every screen has ONE thing the user should do next. Can a stranger scan this in 2 seconds and know what it is? If you have three equally-weighted CTAs, you have zero.

> Ask: *What's the single most important action? Is it visually dominant? Is everything else clearly secondary?*

### 2a. Copy is part of design
Words *are* the UI. A button labeled "Earn tokens" when the action actually claims voting rewards is broken design — the same way a misaligned padding is broken design. Three principles for UI copy:

1. **Match copy to action.** A button label states what tapping it does. "Claim rewards" not "Earn tokens." "Save changes" not "Submit." "Book appointment" not "Continue."
2. **Don't repeat the parent context.** If the section heading says *"Voting"*, the row below doesn't need *"Last 10 votes"* — just *"Last 10"*. If the card already shows a price, the label "Price:" is dead weight. Headings + adjacent context carry meaning; let them.
3. **Fewer words wins** when clarity is preserved. Four words rarely beat one good one. Compression isn't terseness — it's removing noise to make the signal louder.

> Ask: *Does this copy match the action it triggers? Am I repeating context that's already established? Could I cut a word and lose nothing?*

### 2b. Signifiers — make the UI teach itself
Good UI doesn't need instructions. The element's appearance signals what it does: a container around a selected tab tells you it's active; grayed-out text tells you it's disabled; a pressed-state on a button tells you the tap registered; a hover highlight tells you something is clickable. Every interactive element should *signify* its state and affordance visually — never rely on copy or tooltips alone.

> Ask: *Without reading any text, can a user tell what's selected, what's clickable, what's disabled, and what's currently active?*

### 2c. Selection by weight or contrast, not by brand-color flood
Active/selected states (selected tab in nav, active filter chip, "current" indicator) should be signaled by **weight increase + ink color**, not by flooding the element in brand color. Even Uber Eats — whose brand IS green — uses **black icon + black bold label** for selected tabs, not green flood. Brand color stays reserved for actual brand moments (CTAs, hero, logo), not for "this is the active tab."

> Ask: *If this surface had three selected states, would I know which one is the active tab vs an active CTA? Or would brand color be doing too many jobs?*

### 2d. Button states use brightness + motion, never hue shifts
Hover/active states on a colored button must NOT shift the hue toward a "darker version" with a different hex (e.g. `#043338` → `#0A6873` would read as "now it's a different teal," not "pressed"). Use **`filter: brightness(0.94)`** on hover and **`filter: brightness(0.88) + transform: scale(0.98)`** on active. Same hue, modulated brightness. The eye reads brightness shift as "same surface, less light" (physical/believable). Hue shift reads as "this turned into another color" (alien). Optionally add an arrow-translate or shadow-tighten for further pressed-feel without inventing colors. (Exception: V3 brand-teal hover gradient `linear-gradient(180deg, #0A6873 0%, #043338 100%)` is a deliberate lift-on-hover pattern per LIVE_TRUTH §1 — that's an intentional gradient, not a flat hue swap.)

### 3. Spacing rhythm
Beginner UIs are cramped. Use a consistent scale (Solen uses a 4/8/12/16/24/32/48/64 rhythm). Mobile needs **more** space than you think. Stacked content needs vertical breathing room to group naturally.

> Ask: *Is everything on the scale? Does it breathe? On a 375px-wide screen, would this still feel calm?*

### 4. Consistency
Same thing → same design. Back button and skip button are the same component class — they should match in size, radius, weight, padding. Two search bars on the same flow should be identical except for placeholder text.

> Ask: *Am I reusing tokens (color, spacing, radius)? Am I reusing components? Or am I redesigning the same primitive in three places?*

### 5. Restraint with effects
Gradients, shadows, glows, blurs, borders — all amplify when used sparingly, all add noise when used everywhere. Default: don't use them. Add only when they solve a real hierarchy or affordance problem.

> Ask: *Am I adding this effect because it helps the user, or because empty space scares me? If I removed it, would the design get worse — or actually better?*

If gradient: variations of the same hue only, never two different colors. If shadow: light gray, generous blur, low intensity — never Figma defaults.

### 5b. Brand color discipline — brand primary is *signal*, never *substrate*
Brand primary (Solen coral, or whatever the current brand color is) belongs to **brand moments**: logo, hero CTAs, accent on brand-defining surfaces. It does **not** automatically become the heart-save color, the urgency-today color, the success-green, or the error-red. Those are *semantic* concerns and need their own tokens (love red, urgency amber, success green, danger red) — independent of brand pivots.

> Ask: *If the brand primary changes tomorrow (palette pivot, reskin), does my UI still mean what it means? Or does the heart turn green and the "today" indicator turn green and the save toast turn green?*

If brand primary leaks into emotional/semantic uses, you have **brand-color flood** — a junior pattern. The eye stops being trained to recognize "X is brand" because brand is showing up everywhere. Mature systems reserve brand color for ~10% of visual surface (Solen UI #5b "60/30/10 split").

**Concrete prohibitions:**
- Heart save state must use a literal heart-color hex (`#FF4A6B` or warm-red), NOT `var(--coral)` or whatever the brand token resolves to.
- "Urgency today" / "active now" must use a literal warm-red hex, NOT brand primary.
- Tab bar selected state = bolder weight + ink color, NEVER brand-color flood.
- Status colors (success / warning / error / info) are semantic tokens with their own hex, NOT derived from brand primary.

### 5c. No colored-glow shadows. Warm-ink-tinted only.
Drop shadows and box shadows use **warm-ink tint** (`rgba(26,18,9,0.x)` per SOLEN_DESIGN.md §5) — never pure-black `rgba(0,0,0,0.x)`, never brand-color glow (`rgba(coral, …)`, `rgba(amber, …)`). Q16 retired the `--sh-coral` / `--sh-amber` colored-glow tokens; never reintroduce. Black-grey shadows on a warm-ink palette read clinical / off-brand; warm-ink tint keeps shadows in the same tonal family as the rest of the system.

> Ask: *Is this shadow elevating a surface (functional) or making the button feel "warmer/glowier" (decorative)? If decorative, kill it.*

### 5d. Borders > shadows for in-flow separation
For lists, feeds, and adjacent cards: use `1px solid rgba(ink, 0.06–0.10)` plus generous whitespace. Reserve shadows for **floating** elements that have left the document flow — modals, sheets, sticky CTAs, dropdowns, the cart pill. Adding shadows to in-flow cards reads as visual noise and signals junior-tier work (Uber Eats / Stripe / Linear pattern).

### 6. Icon discipline
One library. Matched stroke width and fill style. Lucide outlined for Solen (per design system). Icons should mean something — purely decorative icons are noise. Use labels when the icon isn't universally understood (house/save/user are fine; abstract glyphs need tooltips).

> Ask: *Is every icon from the same set, with the same weight? Does each icon earn its spot, or is it filler?*

Pro nuance: different icon styles in the same screen can work IF they're in visually separate zones with different roles (e.g. nav icons vs. category icons vs. status icons). But default to one style.

### 7. Interactive feedback
Every interactive element needs visible states: **hover**, **pressed/active**, **loading**, **success**, **error**, **disabled**. A button with no pressed state during a slow load looks broken. A save action with no confirmation feels ignored.

> Ask: *If the user taps this and the network takes 2 seconds, do they know it worked? If it fails, do they know why?*

### 8. Redundancy hunt
Can I delete this and the design still works? Decorative arrows on swipeable carousels, borders that don't separate anything, dividers between already-spaced sections, labels that repeat the icon — all candidates for deletion.

> Ask: *Walk through every element. For each: what does it do? If it doesn't do anything, kill it.*

### 9. Accessibility floor
Contrast ≥4.5:1 for body text, ≥3:1 for large text and UI components. Tap targets ≥44×44px. Visible focus state on keyboard navigation. Text readable at smallest screen size without zoom. No information conveyed by color alone.

> Ask: *Could someone with low vision / using only a keyboard / on a small phone still use this? Have I actually checked the contrast or am I guessing?*

### 8b. Respect layout conventions (and break them intentionally)
30+ years of web has trained users where to find things: **navigation at the top, content flowing top-to-bottom and left-to-right, primary CTAs eye-catching and easy to find**. Designs that follow these conventions are easier to scan, easier to make responsive, easier to extend with new sections. Breaking conventions is fine — sometimes great — but only when you have a reason. *"You don't break the system by accident. You break it with intention."*

> Ask: *Am I breaking a convention because it serves the user better here, or because I think it'll look unique? If it's the latter, put it back.*

### 8c. Design for real content, not perfect content
Beginner designs assume titles will always be short, prices will always be 2 digits, images will always have a dark background, lists will always have 5 items. Real content breaks all of that. Long titles, multi-line addresses, untranslated strings ~30% longer in DE/FR, photos with bright skies behind a save icon, empty arrays, lists with 200 items — design for those cases up-front, not as bug fixes later.

Common content edge cases to handle:
- **Long text** → truncate with ellipsis, ensure tooltip/full view available
- **Icons on imagery** → add a contrasting backdrop (circle, scrim) so the icon is always readable regardless of photo content
- **Numeric extremes** → "1" vs "1,000+" both need to fit; align consistently
- **Empty states** → first-time user with no data, filtered list with no matches, network error
- **Long lists** → pagination, "load more," or virtualized scroll; avoid infinite scroll where users need to reach the footer

> Ask: *If the title is 80 characters / the image is white / there are 0 items / there are 200 items / the user speaks German — does this still hold up?*

### 9b. Hierarchy via contrast
Hierarchy comes from **contrast** — differences in size, weight, color, position. A card that lists info in equal-weight rows reads like a spreadsheet, not a design. Most important thing → larger, bolder, top-positioned, or color-differentiated. Price, status, key actions stand out because they *differ* from the surrounding text. Image at the top of a card adds color and makes scanning effortless.

> Ask: *What is the most important thing on this surface? Is it visually different enough that the eye lands there first? Or does everything weigh the same?*

### 9c. Design the experience, not just the screen
Static screens are the floor, not the ceiling. Senior-tier work treats UI design **like a movie**: how does the user move from screen A to screen B? Does the transition explain *what changed*? Does motion create continuity (the same element morphing into its new role) or rupture (a hard cut that loses the user)?

Apps that feel exceptional — Phantom Wallet, Airbnb, Duolingo — invest in **inter-screen experience**: shared element transitions, choreographed reveals, micro-animations that punctuate state changes. Most designers stop at the static frame. Don't.

> Ask: *What happens between this screen and the next? Is there continuity, or a hard cut? Does the user understand what changed and why?*

### 9d. Emotional design — how does it *feel*?
Functionality is now table stakes. Anyone can ship features — APIs, no-code, AI. The remaining edge is **how the product makes people feel** when they open it: smooth, premium, playful, calming, trustworthy. Solen sells beauty and wellness — a category where users *expect* to feel cared for. Cold, transactional, generic-SaaS UX will lose to a competitor that gets the emotional layer right.

Three emotional registers to think about for any surface:

- **Delight** — micro-interactions that reward small actions (a subtle bounce on favorite, a sparkle on a confirmed booking, a smiling progress animation). Borrowed from Duolingo: emotional feedback loops keep people coming back.
- **Trust** — polish *is* trust in high-stakes categories (payments, personal data, first-time bookings). Every clean transition, every responsive tap, every well-formed empty state is a trust signal. Borrowed from Phantom: friendly visuals make intimidating domains feel approachable.
- **Premium** — tactile, responsive interactions (a chart that glows under your finger, a card that has a real moment of motion when it flips). Borrowed from Revolute: motion is how a digital product communicates quality. Static screens feel cheap; choreographed details feel expensive.

Solen's blend: **calm + premium + warm**. Not playful-cartoony like Duolingo; not crypto-edgy like Phantom; closer to Revolute's elevated polish, with editorial warmth.

> Ask: *When the user opens this screen, what should they feel? Do the visuals, motion, and copy actually deliver that feeling — or do they just deliver the function?*

### 10. Brand fit
Does this look like **Solen** — Swiss beauty marketplace, brand teal `#043338` + Republik colorway panels (4 cats Z/G/A/I) + warm ink + Cooper-display typography, calm and confident — or like a generic SaaS template? Generic AI output gravitates toward purple gradients, glass cards everywhere, perfectly symmetric grids, dark mode toggles. Resist all of it.

Brand history (do not reintroduce): V1 forest green `#1B4D1B` (Q64) → V2 brand orange `#E8742A` (V2-D13/D14) → **V3 dark teal `#043338`** (V2-D15-3, locked 2026-05-07, Republik panel #4). See `_tasks/V2_REBUILD_LOG.md` V2-D15-3 for full lock history.

> Ask: *If I removed the logo, would someone still recognize this as Solen? Or could it be any wellness app?*

---

## The output gate

Before you write code or generate a mockup, write a one-sentence answer to each numbered principle above. Example:

> 1. Flow — empty state shows "No favorites yet" with a CTA to browse; error state shows toast + retry; loading uses skeleton cards.
> 2. Primary action — "Book now" green button (brand primary), dominant. Secondary actions are ghost links.
> 3. Spacing — uses 16/24/32 vertical rhythm. Mobile padding bumped from 16 → 20.
> 4. Consistency — reuses `<SalonCard>`, `<Button variant="primary">`, existing radius token.
> 5. Restraint — no gradients, no shadows. One brand-teal accent, white bg.
> 6. Icons — all lucide outlined, 20px, 1.5 stroke.
> 7. Feedback — button has hover/pressed/loading; save shows filled icon + toast.
> 8. Redundancy — removed decorative arrow above title; dividers replaced with spacing.
> 9. Accessibility — brand teal `#043338` on white = 9.89:1; tap targets 48px; focus rings on all CTAs.
> 10. Brand fit — brand teal `#043338` + category-combo panel (Z/G/A/I) per page, Cooper BT display once, square cover photos, line-art accents. Reads as Solen.

If any answer is "I don't know" or "I didn't think about it," **stop and figure it out before outputting**.

---

## Concrete heuristics (the tactical layer)

The principles above are the *thinking*. These are the **tactical rules of thumb** that turn a beginner-looking design into a polished one. Apply them when actually building:

### Typography
- **One font is enough.** Don't pair two display fonts. Solen uses **Cooper BT** (display: hero h1, logo, feature h2, category panel h1 only) + **ITC Avant Garde Gothic Std** (everything else — body, UI, section h2s, microcopy). V2-D15-3 lock 2026-05-07. Free fallbacks: Sansita 900 + League Spartan + Inter Tight. Each has a clear role and they never compete in the same block.
- **Tighten large text.** On display/headline sizes (32px+), pull letter-spacing to ~`-2%` to `-3%` and drop line-height to `110%–120%`. Default browser values look loose at scale.
- **Cap font sizes and weights.** Aim for **~4 sizes and ~2 weights** on a typical surface. Beginners ship 6+ sizes and 4+ weights and the UI feels chaotic. Counting the sizes/weights on your screen is the fastest way to spot the mistake.
- **Workhorse type scale (Solen's locked sizes — pick from these, don't invent):**

  | Role | Size / Weight / Line height |
  |---|---|
  | Caption / micro | 11 / 400 / 16 |
  | Caption emphasized | 12 / 600 / 18 |
  | Secondary body / meta | 12 / 400 / 18 |
  | List title / button-sm / rating | 13 / 600 / 20 |
  | Default body | 14 / 400 / 22 |
  | Default body emphasized / button-md | 14 / 700 / 22 |
  | Section title | 20 / 600 / 28 |
  | Page sub-heading | 24 / 600 / 32 |
  | Page heading | 32 / 700 / 40 |
  | Hero (Cooper BT only — ≤1 per page) | 48–104 / 900 / 0.95 |

  Cooper BT appears at most once per page (the hero/landing headline + logo + ONE category panel headline). Everywhere else is Avant Garde Gothic.
- **Reuse sizes across roles.** Instead of inventing a new size for "decimal fractions" or "secondary numbers," reuse an existing size from the scale.
- **Use monospace for variable-length numerics.** Counters, prices, timers, balances — anything that grows or changes — should use a monospace (or tabular-numerals) variant so digits don't jitter as values change.
- **Group with line-height + space.** Tight line-height inside a paragraph, larger gap between paragraphs. Whitespace groups things — that's another form of hierarchy.
- **Anti-pattern: pure black `#000000` for body text.** Solen uses warm-ink `#1A1209` (warm dark), not pure black. Pure black on white reads as cold/clinical against the brand's warm category (beauty/wellness).

### Spacing
- **Whitespace > grids.** A 12-column grid is a guideline, not a rule. Whitespace and visual rhythm matter more.
- **4-point system.** Everything in multiples of 4 (4/8/12/16/20/24/32/48/64). Not because the number is magic — because every value can split in half cleanly, which keeps things consistent.
- **~32px between unrelated items.** Closer for items that belong together (label + input, icon + text).

### Color
- **Start with one primary brand color**, then build a ramp from it (lighten for backgrounds, darken for text). For Solen V3 (V2-D15-3) that's brand teal `#043338` → pale teal `#C2F0F1` (text on dark panels) → brand subtle `#E1F4F4` (pill bg) → brand mid `#0A6873` (hover). History: V0 coral `#E8624A` → V1 forest green `#1B4D1B` (Q64) → V2 brand orange `#E8742A` (V2-D13/D14) → V3 dark teal (current).
- **Semantic colors mean things.** Blue = trust/info, red = danger/error, yellow = warning, **status-green `#16A34A` = success** (DISTINCT from brand-teal `#043338` — different jobs, different hexes, never collapse them). Don't repurpose semantic colors for decoration — users learn the meaning across the web and you'll confuse them.
- **Color for purpose, not decoration.** If a color isn't doing a job (signaling state, drawing attention to a CTA, branding), it's noise.
- **60 / 30 / 10 split.** A balanced UI roughly follows: ~60% neutral (white/light gray bg), ~30% complementary (warm ink text, dividers, secondary surfaces), ~10% brand accent (brand-teal on CTAs, key indicators, focus). When everything fights for attention with the brand color, nothing wins. When the brand color is starved, the design feels dull.
- **Reserve strong color for meaning.** If brand-teal is on every button, header, icon, and chip, it stops drawing the eye. Save it for the CTA and one or two key indicators per screen — that's where it earns its weight.

### Shadows
- **Reduce opacity, increase blur.** Default `0 4px 6px rgba(26,18,9,0.1)` shadows look harsh. Drop to ~5–10% opacity, push blur to 16–32px+. (Use warm-ink `rgba(26,18,9,…)` tint per §5c, never pure black.)
- **Cards = subtle. Popovers/floating = stronger.** Hierarchy: closer to the surface = lighter shadow.
- **The shadow rule:** *if the shadow is the first thing you notice on a design, you're using it wrong.*

### Buttons
- **Padding ratio:** rough rule — horizontal padding ≈ vertical padding × 2 (so a 40px-tall button has ~80px-equivalent in horizontal padding, depending on label length).
- **Ghost buttons = sidebar links.** A nav item is just a button without a default background; it gets a fill on hover/active. They're the same primitive.
- **Min 4 states:** default, hover, pressed/active, disabled. Add loading (spinner) when the action triggers a network call.

### Icons
- **Size to line-height.** If body text is 16/24, icons inline with body should be 24px. Mismatched sizes look amateur.
- **One library, one weight.** Solen = lucide outlined. Don't mix stroke widths within the same surface.

### Inputs
- Need: default, focus (visible ring/border), filled, error (red border + message), warning, disabled. Optionally: success/validated.
- Error messages live below the input, not in a tooltip. Color alone (red border) is not enough — pair with text.

### Image overlays
- **Don't slap a 50% black overlay over an image** — kills the photo. Use a **linear gradient** (transparent at top → semi-opaque at bottom) so the image breathes where there's no text and stays readable where text sits.
- For extra polish: a **progressive blur** on top of the gradient (clear at top, blurred at bottom) reads as more modern than a flat darken.

### Micro-interactions
- A button has states. A *micro-interaction* is the small confirming animation that tells the user the action completed: a "Copied!" chip sliding up after copy-to-clipboard, a heart pulsing on favorite, a checkmark drawing on save. Every meaningful action benefits from one.
- Keep them fast (<300ms) and subtle. They confirm, they don't perform.

### Cards
- Image at the top → instant scannability and color.
- Most important info → largest, top, possibly colored differently.
- Secondary info (location, time, etc.) → smaller, below, dimmer.
- Use icons + visual elements (a line, an arrow) instead of words where possible (e.g. "from Jamesville to Syracuse" → two pinned dots connected by a line).

### Animation & motion
- **Locked timing scale (pick from these, don't invent):**
  - **Fast (≤200ms):** hover, ripple, color change, button press feedback
  - **Default (250–400ms):** modal open, sheet open, drawer slide, route nav
  - **Theatrical (≤600ms):** page push, hero zoom, narrative reveals — use sparingly
- **Locked easing (pick from these, don't invent):**
  - **Default out-curve:** `cubic-bezier(0.2, 0.8, 0.4, 1)` — used for entrances, reveals, button feedback
  - **Symmetric (round-trip motions only):** `cubic-bezier(0.4, 0, 0.2, 1)` — for things that genuinely open/close mirror-image
  - **Anti-pattern:** browser default `ease`/`ease-in-out` on UI motion. That's the spec-default tell.
- **Animation must add clarity or functionality, not decoration.** A button press animation confirms the tap. A hamburger menu animating in consolidates navigation that no longer fits. A search bar collapsing into an icon reclaims space until the user wants to search. Each one earns its existence by *doing something*.
- **Progressive disclosure** > showing everything at once. Reveal complexity as the user reaches for it. A "More filters" toggle is better than 12 visible filters; an expandable detail row beats a wall of metadata.
- **"Load more" > infinite scroll.** Users keep control of pagination, can reach the footer, can bookmark a position. Infinite scroll is appropriate for feeds (Twitter, TikTok); for marketplaces, listings, and product surfaces, prefer load-more or numbered pagination.
- **Buttons should almost always have a small animation** (hover lift, color shift, scale on press). Scroll-jacking, parallax, and full-screen transitions should be used sparingly — they delight once and annoy forever.
- **Keep durations honest.** ≤200ms for state changes (hover, press), 200–400ms for transitions (modal open, route change), >400ms only for narrative moments. Faster feels snappier; slower feels broken.

### Emotional touchpoints (where to invest)
Not every surface needs to be emotionally rich — that path leads to over-animated, distracting UI. Pick the **moments that matter** and invest there. For Solen, these are the highest-leverage emotional touchpoints:

- **First impression** — landing page hero, first paint of the home feed, first-time-user onboarding. These set quality expectations for everything after. Polish here punches above its weight.
- **Confirmation moments** — booking confirmed, favorite added, review submitted, payment succeeded. Users wait for these; reward them with a moment that says "yes, it worked, and we care that it did." Subtle bounce, soft glow, animated checkmark — fast (<400ms), warm, never gaudy.
- **Progress / momentum** — bookings completed, streak of self-care visits, profile completion. Anything that gives a sense of *building something over time* deepens engagement. Animate the progress, don't just show a number.
- **High-stakes interactions** — payment screens, booking the appointment, entering personal info. Polish here = trust. Slow, smooth transitions, no jank, no flashing layouts. The user is putting money or data on the line; the UI must feel handled.
- **Tactile data** — anything the user explores by gesture (a calendar drag, a map pan, a price slider, a salon photo carousel). Make it respond *physically* — feel the inertia, see the highlight follow the finger. This is what cheap UIs miss and premium ones nail.

Skip the emotional layer on: utility screens (settings, terms of service, error messages), high-frequency repetitive actions (a search that runs 50 times a session shouldn't have a celebration animation — it'd be exhausting), and anywhere it would slow down a pro user.

### Visual pattern reuse (connect related parts)
When two parts of the UI represent the same concept, give them the **same visual marker** so users connect them instantly. Example: a pulsing red dot on the "current voting period" in a graph + the same pulsing red dot on the "commit" indicator in the action panel — the user immediately understands these two things are linked, without reading any label. Reuse a shape, color, animation, or icon across separated UI regions to *teach* the relationship.

Caveat: only reuse the marker when the things genuinely *are* related. Reusing a pattern for unrelated UI is worse than no reuse — it implies a connection that doesn't exist.

### Design systems mindset
- A design system is a **shared language**, not a uniformity enforcer. Two designers/agents working from the same tokens should produce work that *feels* coherent without being identical.
- The *process* of defining the system (rules, scales, patterns) is often more valuable than the system itself — it forces decisions that would otherwise drift.
- **Break the system with intention, not by accident.** Every deviation from `SOLEN_DESIGN.md` should be a deliberate, justifiable choice — and ideally fed back into the system as a new pattern, not left as a one-off.

### Token architecture — layers, not flat
Tokens are layered. Don't flatten them into one bucket of named hex values:

1. **Primitive tokens** — raw values: `teal-900: #043338`, `mono-300: #F0F0F0`, `scale-600: 16px`.
2. **Semantic tokens** — role-based: `text-primary`, `border-default`, `surface-raised`, `status-positive`, `love-red`. They *reference* primitives.
3. **Component tokens** — component-scoped: `button-primary-fill`, `card-padding`. They reference semantics.
4. **Product composites** — domain widgets: `salonCard`, `bookingWizard`. They consume component tokens but live outside the design system core.

A change to a primitive should propagate up. A change to a composite should never reach back to a primitive. **Semantic tokens are the layer that protects against brand pivots** — `love-red` stays `#FF4A6B` even if `brand-primary` flips from coral to green.

### State patterns — skeleton-first, sheet-for-confirmation
- **Loading:** skeleton screens shaped like the eventual content for region/list/page fetches. Spinner reserved for inline button-state only (network call confirming the user's tap). Never use a full-page spinner for content loads.
- **Destructive / financial confirmations** ("Cancel booking", "Place order", "Delete account") live in **bottom sheets**, not OS alerts. Keeps the user in flow, allows richer copy (showing what's being confirmed), avoids OS-alert friction.
- **Toasts** for action-result feedback (booking saved, message sent, copy success) — top of viewport, dark fill, white text, 5s auto-dismiss, optional retry/undo action. Don't toast for content errors (use inline error grammar).

### Icon rendering on photos
- Icons that overlay imagery (heart on a salon photo, save on a product image) need **dual-stroke or drop-shadow legibility**, not `mix-blend-mode: difference`.
- `mix-blend-mode: difference` reads great on consistent dark/light album-art, but on real photos with mid-grey areas it computes the icon to a muddy gray.
- Use **white fill + 1px dark hairline shadow** (`filter: drop-shadow(0 1px 2px rgba(0,0,0,.4))`) — boring but reliable.

---

## What to read alongside this

| File | When |
|---|---|
| `_tasks/SOLEN_DESIGN.md` | Always. Source of truth for tokens, retired patterns, locked decisions. |
| `public/solen-coral.html` | When you need a visual reference for the current locked design. |
| `_rules/I18N_ROUTING.md` | Before any copy or layout — text expands ~30% in DE/FR. |
| `_rules/LESSONS_LEARNED.md` | Before starting non-trivial work. Past mistakes, fixes. |
| `CLAUDE.md` | The project contract. Surgical edits only. |

---

## Anti-patterns to never produce

These are signals that the agent skipped the checklist:

- Two-color gradients on buttons or cards
- Drop shadows using Figma/Tailwind defaults at full opacity
- Mixed icon libraries on the same screen (Lucide + Heroicons + emoji)
- "Click here" or "Submit" as primary CTA copy
- Three equally-weighted primary buttons on one screen
- Empty arrays / null states with no empty-state UI
- Buttons with no pressed/loading state
- Tap targets under 44px
- Hardcoded hex values when a token exists
- Glass cards outside the 3 sanctioned contexts (see SOLEN_DESIGN §6)
- Decorative blobs outside sanctioned slots (see SOLEN_DESIGN §7)
- Dark mode references (Solen is light-mode only)
- "V2" or "Zone 1/2/3/4" language (retired)
- Loose default letter-spacing on large display text (looks unrefined)
- Default line-height on headlines (should be 110–120%)
- Pairing two display fonts in the same block
- Flat 50% black overlay on images (use a gradient instead)
- Equal-weight rows on cards (looks like a spreadsheet — apply hierarchy)
- Decorative use of semantic colors (red/green/yellow for non-meaningful styling)
- Action with no confirming micro-interaction (copy/save/favorite without feedback)
- Mismatched icon size vs. surrounding text line-height
- Decorating before deciding what the user is trying to do (aesthetics before intent)
- Designing only for "perfect content" — short titles, ideal images, exactly 5 items
- Save/favorite icons placed directly on photos with no contrast backdrop
- Infinite scroll on listings/marketplace pages (footer becomes unreachable)
- Animations that don't serve a purpose (decorative scroll-jacking, gratuitous parallax)
- Breaking the design system by accident (a one-off color, radius, or font that nobody decided on)
- Button labels that don't match the action ("Submit" / "Continue" / "Earn tokens" when the action is clearly something specific)
- Repeating the parent heading in the row/cell below it ("Voting" heading + "Last 10 votes" row → just "Last 10")
- 6+ font sizes or 4+ font weights on a single surface (count them — it's the fastest mistake to spot)
- Proportional-width digits on counters, prices, or timers that change (causes visual jitter)
- Brand color used so heavily it loses meaning ("if everything is brand-teal, nothing is brand-teal")
- Designing only static screens and ignoring how the user moves between them
- Skeumorphism stack-up (45 layers of shadows trying to feel "tactile")
- Treating UI as purely functional — shipping features without thinking about how they *feel*
- A first impression (landing, onboarding, first paint) that looks like every other SaaS template
- Confirmation actions (booking, favorite, payment) with no emotional reward — just a state flip
- Charts, calendars, sliders that don't respond to finger drag/hover (static where it should be tactile)
- Heavy animation on high-frequency utility actions (turns delight into noise)
- **Colored shadows** of any kind on buttons, cards, or surfaces (`rgba(coral, 0.x)`, "warm glow," "amber halo") — use neutral grayscale shadows only for actual elevation
- **Brand primary color tied to emotional / semantic UI atoms** (heart save = brand color, urgency-today = brand color, error/success = brand color). Brand is signal, not substrate (see §5b).
- **Hue-shifted hover states** on colored buttons (e.g. swapping one hex for another that's perceptually a different hue). Use brightness shift only (`filter: brightness(0.94)`). Exception: V3 brand-teal hover gradient (LIVE_TRUTH §1) is an intentional lift-on-hover, not a flat hue swap.
- **`mix-blend-mode: difference` on icons over real photos** (creates muddy gray on mid-tone backgrounds). Use white fill + dark hairline shadow instead.
- **Pure black `#000000` for body text** in a warm-category app (beauty/wellness). Use warm-ink (`#1A1209`) instead.
- **Tab-bar / nav selection done via brand-color flood** instead of weight + ink. Selection = bolder weight + dark color, never "the active tab is now coral/green."
- **Flat token architecture** — primitives, semantics, components, and composites all jumbled into one named-hex bucket. Token layers exist for a reason; flattening them defeats them.
- **Live availability / scarcity signals on every card** ("3 spots today" / "Last spot 14:30" everywhere). Real urgency only; max ~20% of cards in any viewport. When everything is scarce, nothing is.

If you catch yourself producing any of these, **back up and re-run the checklist**.

---

## How other agents should use this

When briefing another tool (Claude Design, Cursor, a fresh Claude Code session), include this line:

> "Before outputting any UI work, read `_rules/SOLEN_UI.md` and `_tasks/SOLEN_DESIGN.md`. Walk through every principle in SOLEN_UI and answer how the design satisfies it before producing pixels. Apply the tactical heuristics (typography, spacing, shadows, buttons, image overlays, micro-interactions) when you build. SOLEN_DESIGN.md is the source of truth for tokens; SOLEN_UI is the thinking layer."

That's the contract. If the output doesn't reflect the checklist, send it back.
