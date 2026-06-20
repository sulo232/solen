# Inspo home , design direction (council + owner, 2026-06-20)

Records the council consultation + the owner's decided direction for the `/inspo` feed HOME chrome.
Feeds the mockup phase in [AUDIT.md](AUDIT.md) section 7.1 (feed chrome) + 7.7 (filters). Mockup-first still applies:
nothing ships until a mockup of the REAL page is approved. Cards are explicitly OUT of scope for this pass
(owner: keep as-is).

## Council (Gemini 3.1 Pro + Grok 4 + Claude Opus orchestrator)

Opus-CLI seat was unreachable (auth) so Claude is represented by the orchestrator. Gemini + Grok converged hard:

- **#1 problem (unanimous): category collision.** Hair-only chrome (the "Haare" pill + Shag/Layered/Blowout photo-chips)
  over a multi-category product (hair / nails / barber / spa) is broken IA. "You cannot filter a heterogeneous feed
  with homogeneous tools." A nails/spa user has no real entry point.
- Council's primary rec was a **top-level category segmented control** scoping the whole page; both REJECTED a pure
  blended "For You" as primary (beauty intent is siloed: "no one accidentally books a 180 CHF Wolf Cut when they came
  for a 40 CHF manicure").
- Also: kill the photo-scrim chips (visual noise competing with the feed) for neutral DS pills; kill / demote
  "Kollektionen" above the feed (redundant, pushes looks below the fold); demote the creator handle and anchor each
  card on the LOCAL bookable salon (an LA TikToker is friction on a Basel booking app); purge mismatched seed images.
- Phase-2 booking signals: Gemini = a REAL "1.2 km" / "Frei diese Woche" flag to beat Pinterest on intent; Grok =
  "Book this look" ink button on card hover.

## Owner's decided direction (this is what we build toward)

The owner refined the council's "segmented control" into a lighter, progressive-disclosure model:

1. **Category switcher = PILLS, not a heavy segmented control.** Keep the CURRENT filter-pill shape , the rounded-box
   (`rounded-card`, 16r) "Haare" treatment ("the box rounded corner"). Category pills are the FIRST control, top of page.
2. **Two-level progressive disclosure.** Top level = category pills (Hair / Nails / Barber / Spa). TAP a category ->
   it EXPANDS to reveal that category's sub-style pills. For Hair, reuse the EXISTING data-driven quick-chips we have
   today (Shag, Layered, Blowout, etc., from `/api/discovery/chip-terms`). Nails / Barber / Spa each get their own
   sub-taxonomy. Same rounded-box pill shape at both levels.
3. **Default surface = blended "For You"** (all categories mixed). The owner wants the blended-for-you, AND the
   category pills + search to scope it. So the model is a HYBRID: blended default, pill-scoped drill-down. (This is the
   council's "hybrid" option , both listed it, neither picked it as primary; owner picks it.)
4. **Booking intent woven in** (Gemini's angle). Kept in mind now; the real distance/availability + "book this look"
   signals are data-coupled , phase 2.
5. **Feed cards: KEEP AS-IS** ("what we got rn"). No card redesign this pass. Save heart / play glyph / salon+price+
   handle stay as they are now.
6. **Selected pill state stays on the lock:** blue border + blue text, NO fill. Neutral resting pills
   (`bg-s-bg-sunken` + ink-2). No per-category color.

## Open / phase-2 (carries decisions from AUDIT.md section 8)

- **Per-category sub-taxonomy.** Hair chips exist + are data-driven; Nails (shapes/sets), Barber (cuts), Spa
  (treatments) need their own chip-term source , extend `/api/discovery/chip-terms` to be category-scoped. (Data work,
  not just UI.)
- **Inventory-aware category pills (owner-flagged via Claude pushback).** Solen is Basel-only + early; only render
  category pills that have REAL looks, ordered by depth. No empty "Spa" pill (no-fabrication rule). A thin category
  degrades to 2 columns rather than a sad 4-col grid.
- **Real booking signal** (distance / "Frei diese Woche" / book-this-look) , needs geo + live availability. Defer;
  must be real data (AUDIT D2).
- **Seed-image mismatch cleanup** (leaves for "Balayage", mountain for "Gel Nails") , data/content fix, not design.

## Status

Direction WRITTEN DOWN, not yet built (owner: "write it down" first). Next when greenlit: mockup of the real `/inspo`
page with the category-pill + progressive-disclosure chrome (cards untouched), shown as a link for approval before any
code. Section maps to AUDIT.md 7.1 + 7.7.
