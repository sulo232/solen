# Claude Design — Prompt

Paste the block below into Claude Design as your first message.
**Attach `_tasks/SOLEN_DESIGN.md` as a file with this prompt.**

Start a **new** Claude Design project — don't reuse old Solen projects (cached old design will leak in).

---

## PROMPT — COPY EVERYTHING BELOW

I'm building the homepage and specific pages for **Solen.ch** — a Swiss beauty-booking marketplace (Basel-first). Think *editorial Swiss magazine meets neighborhood Fresha*.

## ⚠️ CRITICAL — READ THE ATTACHED FILE

The attached `SOLEN_DESIGN.md` is the **complete and only** design system. Every color, font, component spec, radius, shadow, and interaction rule lives in that file. Your job:

1. **Read the whole file before generating anything.**
2. **Never introduce values outside what's declared there.**
3. **If I ask for something that contradicts the file, ask before overriding — don't silently diverge.**

**Ignore any connected codebase references** — if you see files mentioning `green`, `peach`, `Plus Jakarta Sans`, `Outfit`, `Phosphor Icons`, or `V5 zones`, those are a retired attempt. The active system is 100% what's in `SOLEN_DESIGN.md`.

## At a glance (full details in the attached file)

**Palette:** coral `#E8624A` primary · cream `#FAF6EF` bg · warm ink `#1A1209` text · + amber / plum / sage / blue / yellow supporting family

**Fonts:**
- Bebas Neue → hero display, Instagram tiles, discount numerals, footer logo (ALWAYS UPPERCASE)
- Syne → section titles, card names, button labels (never italic)
- DM Sans → body, meta, prices (italic only for hero subtitle + pull quotes)

**Key locked rules:**
- Salon card cover photo = **1:1 square** (not 3:2, not landscape)
- Glass blur used ONLY in 3 places: nav pill, hero card overlay + booking summary, trust strip
- Blobs used ONLY in: hero + dark sections (plum/ink) + Instagram tiles
- `--sh-xl` shadow appears max 2 places per page — everywhere else `--sh-lg` max on hover
- Grain overlay at 3.8% opacity desktop only
- Radii: `--r20` (cards), `--r99` (pills/buttons), `--r12-18` (inputs/search)
- No dark mode. No emoji as UI icons. No `#000000`.

## What I'll ask you to build

I'll request specific pages or components one at a time. Examples:

- "Build the homepage" — 13 sections in the order listed in `SOLEN_DESIGN.md` §12
- "Build the salon detail page" — photo gallery, services, reviews, sticky booking sidebar on desktop, sticky mobile CTA
- "Build the booking wizard" — 4 steps: services → staff → date/time → confirmation
- "Build the checkout page" — Stripe card form + tip + order summary
- "Build the dashboard calendar" — weekly grid, staff color coding, slot detail modal
- "Redesign the Instagram section with new copy" / "add empty state for no recently visited"

## Output expectations

- Single HTML file per request (or React components if I ask for React)
- Responsive: desktop 1280px + mobile 375px
- German copy throughout (DE is primary language)
- Interactive states visible: hover, active, focus
- Placeholder gradients for images (real photos swap in later)
- Real lucide-react SVG icons inline (NOT emoji)
- Apply all locked decisions from `SOLEN_DESIGN.md` — especially:
  - Square 1:1 salon card images
  - Glass in correct places only
  - Blobs in correct places only
  - Shadow discipline (prefer `--sh-sm` / `--sh-md`)
  - Warm shadows (never `rgba(0,0,0,x)`, always `rgba(26,18,9,x)`)

## Tone

- German primary, then EN/FR/IT
- "Von Basel. Für Basel." energy — confident, warm, neighborhood-local, not corporate
- "du/dein" to the customer; "wir" used sparingly
- CHF formatting: `CHF 85` (not $85 or 85€)
- Ratings to 1 decimal: `4.8`
- Example headlines: `BEAUTY. BASEL.` · `DEIN SALON. BASEL BUCHT.` · `LAST MINUTE −40%`

## Start here

1. Confirm you've read `SOLEN_DESIGN.md` in full
2. Tell me which palette tokens, fonts, and component patterns you've loaded
3. **Wait for my specific request** (homepage, salon detail, booking, etc.) — don't generate until asked
