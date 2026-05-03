---
name: verify
description: Verify a live UI section matches the locked design reference (delegates to design-verifier subagent)
argument-hint: <section> [<route>] [<reference-line-range>]
---

Dispatch the `design-verifier` subagent to check whether the named section matches the locked design reference at `public/solen-coral.html`.

# Args

- **section** (required) — short name of the section to verify (e.g. `hero`, `promise-pills`, `categories-grid`, `salon-cards`, `footer`)
- **route** (optional, default `/de`) — live URL path to check
- **reference-line-range** (optional) — e.g. `712-762` to scope the verifier to a specific block of `solen-coral.html`. If omitted, the verifier infers from the section name.

# Examples

- `/verify hero` — verify the homepage hero against reference (default route /de, infer line range)
- `/verify promise-pills /de 722-726` — verify the 3 promise pills, scoped to ref lines 722-726
- `/verify cards /de 822-899` — verify the salon cards section
- `/verify footer /de 1130-1180` — verify footer

# What this does (the calling agent — me — should do)

1. Resolve the **live component path** for the named section. Map known sections:
   - `hero` → `components/home/HeroAboveFold.tsx`
   - `promise-pills` → `components/home/HeroAboveFold.tsx` (within hero)
   - `categories-grid` → look for `CategoriesGrid` component (may not exist yet)
   - `salon-cards` → `components/ui/FeaturedSalonCarousel.tsx` + `components/SalonCard.tsx` + `components/ui/ImageFallback.tsx`
   - `footer` → `components/layout/Footer.tsx`
   - `testimonials` → `components/TestimonialCarousel.tsx`
   - other → grep for it; if you can't find a single file, ask the user
2. If reference-line-range is missing, **find it via grep on `public/solen-coral.html`**. Common anchors:
   - `<!-- HERO -->` → starts at first match line
   - `<!-- SALON CARDS` → starts there
   - `<!-- FOOTER -->` → starts there
3. Dispatch the `design-verifier` subagent via the Agent tool with `subagent_type: "design-verifier"` and a prompt that contains:
   - Section name
   - Reference line range
   - Live component path(s)
   - Live route URL
   - Any specific properties to focus on if provided
4. Wait for the verifier's response.
5. Report the verifier's verdict (PASS or FAIL with gaps) verbatim back to the user.
6. If FAIL: do NOT fix anything yet — wait for user direction. The slash command is verification only.

# What this does NOT do

- Does not edit code (verifier is read-only by design)
- Does not commit (separate user step)
- Does not require the dev server to be running (verifier degrades gracefully)
