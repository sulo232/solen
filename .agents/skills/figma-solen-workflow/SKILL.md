---
name: figma-solen-workflow
description: Solen-specific Figma design-to-code loop. Use when creating or modifying any homepage or customer-facing UI component. Enforces the mandatory flow — design in Figma, screenshot, user approval, implement, validate.
---

# Solen Figma Design-to-Code Workflow

This skill enforces the mandatory design loop for all customer-facing UI work on Solen.ch. **Never skip steps. Never write UI code before the design is approved.**

## When to Use

Any time you are about to create or modify a UI component for:
- Homepage (`components/HomePage.tsx` and its children)
- Any customer-facing page (salon detail, booking, discovery, profile, etc.)
- Shared UI primitives (`components/ui/`)

## The Loop (5 Steps — No Shortcuts)

### Step 1: Design in Figma

1. **Load the `figma-use` skill first** (mandatory before any `use_figma` call)
2. Open the Solen design file: **key `cInKwtgkD8TjUSSLDT40eF`**
3. Use `search_design_system` to find existing components, variables, and styles that match what you're building
4. Use `use_figma` to create or update the design:
   - Use design system tokens (variables), not hardcoded hex colors
   - Follow Solen's V5 design DNA: warm cream backgrounds, coral accents, Bebas Neue headlines, DM Sans body
   - Match existing component patterns in the file
5. If building something new, create it on a dedicated page/frame (e.g., "Homepage / Hero V2")

### Step 2: Screenshot

1. Call `get_screenshot` on the node you just designed
2. Present the screenshot to the user with a brief description of what you designed and why

### Step 3: Wait for Approval

**STOP HERE. Do NOT proceed to code until the user explicitly approves.**

Present the design with:
- What it shows (component name, section, purpose)
- Key design decisions you made (layout, spacing, color choices)
- Any trade-offs or alternatives considered

If the user requests changes:
- Go back to Step 1
- Update the design in Figma
- Re-screenshot and re-present

### Step 4: Implement

Once approved:
1. **Load the `figma-implement-design` skill**
2. Use `get_design_context` to extract code hints, component mappings, and token values
3. Implement the code following Solen's rules:
   - Use design tokens from `tailwind.config.js` (never hardcoded hex)
   - Follow `_rules/UI_RULES.md` for interaction patterns
   - Follow CLAUDE.md Rule 46 pre-commit checklist
   - Use `useTranslations()` for all text (all 4 locales)
   - Respect zone compliance (Zone 1-4)
4. Apply Solen animation standards:
   - Easing: `cubic-bezier(0.23, 1, 0.32, 1)`
   - Duration: 200-350ms for UI transitions
   - Enter from: `opacity:0, y:12` → `opacity:1, y:0`
   - Active states: `scale(0.97)` on buttons

### Step 5: Validate

1. Compare the live page (localhost:3010) against the Figma screenshot
2. Check for:
   - Color fidelity (tokens match Figma variables)
   - Spacing accuracy (padding/margins match Figma auto-layout)
   - Typography match (font, size, weight, line-height)
   - Responsive behavior (test 375px, 768px, 1280px)
   - Interaction states (hover, active, focus)
3. If discrepancies exist, fix them before reporting done
4. Ask the user for a screenshot comparison if needed (every 3-4 changes per `_tasks/homepage-visual-tracker.md`)

## Reference Files

- **Figma file key**: `cInKwtgkD8TjUSSLDT40eF`
- **Systems catalog**: `_rules/SYSTEMS.md` (all available tools, plugins, workflows)
- **Figma ↔ Code sync system**: `_rules/FIGMA_CODE_SYNC.md` (section map, comparison checklist, fix protocol)
- **QA registry**: `_tasks/VISUAL_QA_REGISTRY.md` (log findings here)
- **Design tokens**: `tailwind.config.js`
- **UI rules**: `_rules/UI_RULES.md`
- **Homepage tracker**: `_tasks/homepage-visual-tracker.md`
- **Visual target**: `.superpowers/brainstorm/22806-1775308737/content/homepage-vision.html`

## Anti-Patterns (Do NOT Do These)

- Writing UI code without designing in Figma first
- Skipping the screenshot step ("it looks fine in my head")
- Proceeding to code without explicit user approval
- Using hardcoded colors instead of Figma variables/design tokens
- Ignoring the visual target reference
- Batching more than 3-4 visual changes without asking for screenshot verification
