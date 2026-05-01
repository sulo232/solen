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

### 2. One primary action
Every screen has ONE thing the user should do next. Can a stranger scan this in 2 seconds and know what it is? If you have three equally-weighted CTAs, you have zero.

> Ask: *What's the single most important action? Is it visually dominant? Is everything else clearly secondary?*

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

If you catch yourself producing any of these, **back up and re-run the checklist**.

---

## How other agents should use this

When briefing another tool (Claude Design, Cursor, a fresh Claude Code session), include this line:

> "Before outputting any UI work, read `.claude/skills/solen-ui/SKILL.md` and `_tasks/SOLEN_DESIGN.md`. Walk through the 10 principles in solen-ui and answer each before producing pixels. SOLEN_DESIGN.md is the source of truth for tokens; solen-ui is the thinking layer."

That's the contract. If the output doesn't reflect the checklist, send it back.
