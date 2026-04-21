# DESIGN_SYSTEM.md — Flexibility Questionnaire

> You said the current doc is too prescriptive and hard to move around in. Fair.
> This doc sorts every rigid rule into 4 tiers so you can decide per-rule.
> Answer each question, then I'll regenerate `DESIGN_SYSTEM.md` as **defaults-with-escape-hatches** instead of bans-with-no-exits.

---

## How to read this

- **Tier 1 = Locked (brand / a11y / legal):** these should stay rigid. I'm listing them so you can challenge them, but my recommendation is "keep locked."
- **Tier 2 = Strong defaults (should relax):** the rule is right 90% of the time, but banning exceptions makes Claude brittle. Convert to "default + documented escape hatch."
- **Tier 3 = Style preferences (reconsider):** these are my taste choices dressed as rules. You may disagree.
- **Tier 4 = Architectural (your call):** big structural decisions that need a "yes / no / hybrid."

For each question:
- **Current rule** (what's in `DESIGN_SYSTEM.md` today)
- **My recommendation** (what I'd do)
- **Reasoning** (why)
- **Your answer** (you fill this in)

---

## Tier 1 — Locked (recommend: keep rigid)

### Q1. Coral `#E8624A` is the ONE brand color
- **Current:** `#E8735A` banned, `#E8624A` mandatory.
- **My rec:** Keep locked.
- **Reasoning:** Brand identity. Color drift is the #1 sign of an uncoordinated codebase.
- **Your answer:**

### Q2. Salon card cover = `aspect-square` (1:1), all viewports
- **Current:** Locked per your request, no responsive variants.
- **My rec:** Keep locked.
- **Reasoning:** You just asked for it. Consistency in the card grid is visible on every page.
- **Your answer:**

### Q3. Touch targets ≥44×44px, WCAG contrast, `prefers-reduced-motion`
- **Current:** Mandatory.
- **My rec:** Keep locked.
- **Reasoning:** Legal/accessibility. Non-negotiable in any design system.
- **Your answer:**

### Q4. All user-facing strings go through `useTranslations()` in 4 locales
- **Current:** Mandatory.
- **My rec:** Keep locked.
- **Reasoning:** Business requirement (Swiss 4-lang market).
- **Your answer:**

---

## Tier 2 — Strong defaults (recommend: loosen with escape hatches)

### Q5. `active:scale-[0.97]` on every pressable element
- **Current:** "0.97 everywhere. 0.98 is banned. One value."
- **My rec:** Make 0.97 the default, but allow `0.92–0.95` for small circular icon buttons (chevrons, close buttons, ≤32px hit area) with a code comment explaining why.
- **Reasoning:** Small buttons feel sluggish at 0.97 — the eye can't read a 3% scale on a 32px button. Apple/iOS uses stronger scales for small controls.
- **Your answer:**

### Q6. Card hover lift = exactly `-4px`
- **Current:** "`-4px` (not `-8px`, not `-1px`)."
- **My rec:** Default `-4px`. Allow `-2px` for small cards (< 200px tall) and `-6px` for hero cards (> 400px). Ban `-8px` and up.
- **Reasoning:** Lift-to-size ratio matters. A -4px lift on a 600px hero is invisible; on a 100px pill it's jarring.
- **Your answer:**

### Q7. UI durations ≤300ms
- **Current:** "Never exceed 300ms on app surfaces."
- **My rec:** Keep ≤300ms for state changes (hover, press, tab switch). Allow 400–600ms for **content entering** the page (section reveal, image fade-in, first paint) and illustration micro-animations (category icon plays). Ban >300ms for anything pressed or hovered.
- **Reasoning:** The 300ms rule exists to make interactions feel responsive. It doesn't apply to scene-setting animations. Conflating them makes the homepage feel sterile.
- **Your answer:**

### Q8. No `transition-all`
- **Current:** Banned.
- **My rec:** Keep banned in production components. Allow in prototypes/staging.
- **Reasoning:** `transition-all` transitions every property including `width` / `height`, causing layout jank. But the ban is painful during exploration.
- **Your answer:**

### Q9. Modal entrance = 180ms opacity + scale 0.96→1, NO spring
- **Current:** Hard ban on springs for modals.
- **My rec:** Default 180ms opacity+scale. Allow subtle spring `{stiffness: 500, damping: 35, mass: 0.5}` for bottom sheets on mobile (iOS-like pull-down feel).
- **Reasoning:** The "no springs on modals" rule prevents AI-slop over-bounce. But bottom sheets specifically benefit from mild spring — iOS does this. Banning it makes mobile feel un-native.
- **Your answer:**

### Q10. No image zoom on card hover (card lift is enough)
- **Current:** Removed entirely.
- **My rec:** Default no-zoom on content cards. Allow on hero/featured cards and editorial discovery tiles (marketing zone only).
- **Reasoning:** The "double effect" critique is valid for listing grids. But a featured homepage hero or a magazine-style editorial card reads as flat without it. The rule over-corrects.
- **Your answer:**

---

## Tier 3 — Style preferences (reconsider honestly)

### Q11. Glass consolidated to 2 variants (`.glass`, `.glass-subtle`)
- **Current:** 4 legacy variants aliased to 2.
- **My rec:** Keep 2 canonical. Let `.glass-search`, `.glass-toolbar`, `.glass-pill` stay as aliases forever (not "migrate on touch"). Naming context is useful even if the material is the same.
- **Reasoning:** I was wrong in the original doc. Forcing devs to type `.glass` everywhere loses the "where am I" signal. CSS deduplication is already free via the alias.
- **Your answer:**

### Q12. Typography: drop Syne, use only Bebas + DM Sans
- **Current:** Syne deprecated, `font-heading` aliased to Bebas.
- **My rec:** **Reverse this.** Keep all 3 typefaces. Bebas for display (≥40px), Syne for headings (16–36px), DM Sans for body.
- **Reasoning:** Bebas is condensed/uppercase — wrong for small headings. Syne is geometric/readable at 20–32px where Bebas looks shouty. "Most luxury brands use 2" is true but Solen's range (beauty editorial + functional booking) genuinely benefits from 3.
- **Your answer:**

### Q13. 7 colors → 3 active + 4 reserved
- **Current:** "Unless your component is [spa/premium/partnership/loyalty], you cannot use plum/sage/sand/yellow."
- **My rec:** Keep the categorization but change tone: "Prefer active colors. Reserved colors are defaults for [category]. Override with rationale in PR."
- **Reasoning:** The current phrasing ("you cannot use these") makes Claude refuse valid use cases (e.g., sage on an organic-feeling testimonial). Soft gate > hard gate.
- **Your answer:**

### Q14. Zones: 4 → 2 (marketing / app)
- **Current:** marketing = animated/glass/editorial. app = static/solid/functional.
- **My rec:** Keep 2 zones, but add a third concept: **"transitional"** for pages that bridge (e.g., `/salon/[slug]`, `/booking/confirmation`) — these need marketing warmth but also functional clarity. Allow subset of marketing behaviors (stagger reveal on first load) but not full animation.
- **Reasoning:** A salon detail page isn't "app" (people browse it) and isn't "marketing" (they're close to converting). Forcing it into one bucket creates weird UX.
- **Your answer:**

### Q15. Copy-exact classNames in §8 interaction patterns
- **Current:** Doc shows full className strings to "copy exactly."
- **My rec:** Replace with named utility classes in `globals.css`: `.interactive-card`, `.btn-primary`, `.btn-ghost`, `.link-inline`, `.filter-pill`. Doc shows the name, CSS file defines the values.
- **Reasoning:** Copy-pasted classNames across 200 components = 200 places to update when the spec changes. One CSS utility = one place.
- **Your answer:**

### Q16. Version-numbered class names banned (`.card-v4`, `shadow-v5-*`)
- **Current:** Deprecated; aliases kept "on touch" migration.
- **My rec:** **Keep the version numbers.** They encode the last intentional redesign moment and make it easy to grep "what's from V5 vs. what predates it."
- **Reasoning:** I was wrong. Version numbers as git-blame shortcuts are useful. The fear ("when V6 ships you migrate everything") assumes there will be a V6 — there might not. Cross that bridge later.
- **Your answer:**

### Q17. "USE THIS, DON'T REBUILD" table at top of doc
- **Current:** 12-row table.
- **My rec:** Expand to cover the 30 most-reused components, auto-generate from a comment header in each file (`// @canonical`), keep a human-readable markdown index.
- **Reasoning:** A hand-maintained list of 12 goes stale fast. Auto-generation keeps it honest.
- **Your answer:**

---

## Tier 4 — Architectural (your call)

### Q18. Build `/design-system` visual reference route?
- **Current:** Doesn't exist.
- **Context:** A single Next.js page at `app/[locale]/design-system/page.tsx` that renders every canonical component (SalonCard, Buttons, EmptyState, Skeleton, Modal, Toast, etc.) with variants. No Storybook dependency.
- **My rec:** Yes, but lean. One page, 200–300 lines, renders real components with sample props. Saves hours/week of "does this exist already?"
- **Your answer:**

### Q19. Canonical `<PageState>` that handles loading/empty/error?
- **Current:** `EmptyState` exists; loading/error are ad-hoc.
- **My rec:** Build `<PageState state="loading|empty|error" />` as a thin wrapper. Each page uses one component for all three states.
- **Reasoning:** Every page reimplements these, and every reimplementation drifts visually.
- **Your answer:**

### Q20. Convert `DESIGN_SYSTEM.md` to a **defaults + rationale + escape hatch** format
- **Current:** Most rules are phrased as bans/locks.
- **My rec:** Restructure every rule as:
  ```
  **Default:** [the normal choice]
  **Why:** [one sentence reasoning]
  **Escape hatch:** [when to deviate + how to document]
  **Banned:** [hard-no patterns only]
  ```
- **Reasoning:** This is the actual fix for your "hard to move around" complaint. Rules become guidance, not cops. Only genuinely dangerous patterns are banned.
- **Your answer:**

### Q21. Two-file split: `DESIGN_SYSTEM.md` (principles) + `DESIGN_SYSTEM_REFERENCE.md` (tokens/tables)?
- **Current:** Single 330-line file.
- **My rec:** Split. Principles file = ~150 lines, read once. Reference file = tables, token lists, grep commands, read as needed.
- **Reasoning:** You're right that the current doc has "too specific stuff" mixed with "high-level spirit." Splitting keeps the specifics available without polluting the philosophy.
- **Your answer:**

### Q22. Illustration prompt — locked or guideline?
- **Current:** Locked prompt template in §13.
- **My rec:** Keep as a **default** but allow category-specific variations (nails illustrations differ from spa). Document the constant (line weight, coral, cream bg) and the variable (subject, composition).
- **Reasoning:** First-illustration-sets-aesthetic is a real risk, but locking the prompt prevents category-appropriate variation.
- **Your answer:**

---

## Recommended bulk answers (if you just want to say "yes to my recs")

- **Tier 1 (Q1–Q4):** keep locked ✓
- **Tier 2 (Q5–Q10):** default + escape hatch for all
- **Tier 3 (Q11–Q17):** Q11 keep aliases forever, Q12 keep all 3 fonts (revert), Q13 soft-gate, Q14 add "transitional" zone, Q15 extract utility classes, Q16 keep version names (revert), Q17 auto-gen
- **Tier 4 (Q18–Q22):** yes / yes / yes / yes / guideline

If any of those feel wrong, mark the individual question with your preference and I'll honor it specifically.

---

## After you answer

Tell me either:
- **"go with your recs"** → I'll rewrite `DESIGN_SYSTEM.md` in the defaults+escape-hatch format, revert Q12/Q16, split into principles+reference, and note the changes.
- **"here are my answers: Q5=…, Q12=…"** → I'll honor each answer literally.
- **"just do Q20 and Q21 for now"** → I'll refactor the structure without changing rules.
