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

### 2b. Signifiers — make the UI teach itself
Good UI doesn't need instructions. The element's appearance signals what it does: a container around a selected tab tells you it's active; grayed-out text tells you it's disabled; a pressed-state on a button tells you the tap registered; a hover highlight tells you something is clickable. Every interactive element should *signify* its state and affordance visually — never rely on copy or tooltips alone.

> Ask: *Without reading any text, can a user tell what's selected, what's clickable, what's disabled, and what's currently active?*

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

### 10. Brand fit
Does this look like **Solen** — Swiss beauty marketplace, coral + warm ink + editorial typography, calm and confident — or like a generic SaaS template? Generic AI output gravitates toward purple gradients, glass cards everywhere, perfectly symmetric grids, dark mode toggles. Resist all of it.

> Ask: *If I removed the logo, would someone still recognize this as Solen? Or could it be any wellness app?*

---

## The output gate

Before you write code or generate a mockup, write a one-sentence answer to each numbered principle above. Example:

> 1. Flow — empty state shows "No favorites yet" with a CTA to browse; error state shows toast + retry; loading uses skeleton cards.
> 2. Primary action — "Book now" coral button, dominant. Secondary actions are ghost links.
> 3. Spacing — uses 16/24/32 vertical rhythm. Mobile padding bumped from 16 → 20.
> 4. Consistency — reuses `<SalonCard>`, `<Button variant="primary">`, existing radius token.
> 5. Restraint — no gradients, no shadows. One coral accent, white bg.
> 6. Icons — all lucide outlined, 20px, 1.5 stroke.
> 7. Feedback — button has hover/pressed/loading; save shows filled icon + toast.
> 8. Redundancy — removed decorative arrow above title; dividers replaced with spacing.
> 9. Accessibility — coral on white = 4.7:1; tap targets 48px; focus rings on all CTAs.
> 10. Brand fit — coral primary, Bebas display, square cover photos. Reads as Solen.

If any answer is "I don't know" or "I didn't think about it," **stop and figure it out before outputting**.

---

## Concrete heuristics (the tactical layer)

The principles above are the *thinking*. These are the **tactical rules of thumb** that turn a beginner-looking design into a polished one. Apply them when actually building:

### Typography
- **One font is enough.** Don't pair two display fonts. Solen uses Bebas (display) + Syne (headings) + DM Sans (body) — but each has a clear role and they never compete in the same block.
- **Tighten large text.** On display/headline sizes (32px+), pull letter-spacing to ~`-2%` to `-3%` and drop line-height to `110%–120%`. Default browser values look loose at scale.
- **Cap font sizes.** Landing/marketing pages: max ~6 sizes in the type scale. Dashboards/dense product UI: keep most text ≤24px, more sizes feels chaotic.
- **Group with line-height + space.** Tight line-height inside a paragraph, larger gap between paragraphs. Whitespace groups things — that's another form of hierarchy.

### Spacing
- **Whitespace > grids.** A 12-column grid is a guideline, not a rule. Whitespace and visual rhythm matter more.
- **4-point system.** Everything in multiples of 4 (4/8/12/16/20/24/32/48/64). Not because the number is magic — because every value can split in half cleanly, which keeps things consistent.
- **~32px between unrelated items.** Closer for items that belong together (label + input, icon + text).

### Color
- **Start with one primary brand color**, then build a ramp from it (lighten for backgrounds, darken for text). For Solen that's coral `#E8624A` → coral tints/shades.
- **Semantic colors mean things.** Blue = trust/info, red = danger/error, yellow = warning, green = success. Don't repurpose them for decoration — users learn the meaning across the web and you'll confuse them.
- **Color for purpose, not decoration.** If a color isn't doing a job (signaling state, drawing attention to a CTA, branding), it's noise.

### Shadows
- **Reduce opacity, increase blur.** Default `0 4px 6px rgba(0,0,0,0.1)` shadows look harsh. Drop to ~5–10% opacity, push blur to 16–32px+.
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
- **Animation must add clarity or functionality, not decoration.** A button press animation confirms the tap. A hamburger menu animating in consolidates navigation that no longer fits. A search bar collapsing into an icon reclaims space until the user wants to search. Each one earns its existence by *doing something*.
- **Progressive disclosure** > showing everything at once. Reveal complexity as the user reaches for it. A "More filters" toggle is better than 12 visible filters; an expandable detail row beats a wall of metadata.
- **"Load more" > infinite scroll.** Users keep control of pagination, can reach the footer, can bookmark a position. Infinite scroll is appropriate for feeds (Twitter, TikTok); for marketplaces, listings, and product surfaces, prefer load-more or numbered pagination.
- **Buttons should almost always have a small animation** (hover lift, color shift, scale on press). Scroll-jacking, parallax, and full-screen transitions should be used sparingly — they delight once and annoy forever.
- **Keep durations honest.** ≤200ms for state changes (hover, press), 200–400ms for transitions (modal open, route change), >400ms only for narrative moments. Faster feels snappier; slower feels broken.

### Design systems mindset
- A design system is a **shared language**, not a uniformity enforcer. Two designers/agents working from the same tokens should produce work that *feels* coherent without being identical.
- The *process* of defining the system (rules, scales, patterns) is often more valuable than the system itself — it forces decisions that would otherwise drift.
- **Break the system with intention, not by accident.** Every deviation from `SOLEN_DESIGN.md` should be a deliberate, justifiable choice — and ideally fed back into the system as a new pattern, not left as a one-off.

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

If you catch yourself producing any of these, **back up and re-run the checklist**.

---

## How other agents should use this

When briefing another tool (Claude Design, Cursor, a fresh Claude Code session), include this line:

> "Before outputting any UI work, read `_rules/SOLEN_UI.md` and `_tasks/SOLEN_DESIGN.md`. Walk through every principle in SOLEN_UI and answer how the design satisfies it before producing pixels. Apply the tactical heuristics (typography, spacing, shadows, buttons, image overlays, micro-interactions) when you build. SOLEN_DESIGN.md is the source of truth for tokens; SOLEN_UI is the thinking layer."

That's the contract. If the output doesn't reflect the checklist, send it back.
