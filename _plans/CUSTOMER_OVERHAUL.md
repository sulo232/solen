# Customer-facing overhaul , conformance mockup pass (2026-07-17)

Owner ask (verbatim): "okay park that for now but start maiking mockups tons of it for each screens
cz we have all new gates n principal lets overhaul the customer facing side first make me tons if
mockup".

## What this is (and is not)
- IS: a CONFORMANCE pass. Every core customer screen measured against the now-settled numeric law,
  then shown as a copy-of-real-page before/after so the owner approves per screen. Grounded in
  RATIONALE.md + LOCKFILE + TASTE_LOG + this session's settled work. NO new visual directions.
- IS NOT: fresh redesign concepts per screen (that would be inventing; the owner's "cz we have all
  new gates n principal" says APPLY the law, not guess new looks). Not full-bleed (graveyarded).

## The settled law being applied
rhythm 32 inter-section; off-grid -> nearest 4pt; type floors (name 14 / meta 12 / H2 18-20 / body
14 / CTA >=15 / eyebrow 11); radius card 16 / input 12 / sheet 28 / pill full; hairline #E4E4E7;
blue #276EF1 only on small clickable text; semantic star/success/error/heart; selected = gray
sunken #F4F4F5 never ink/blue; filters neutral; touch >=44; no fabricated data; no decorative dots.
Input law already SHIPPED this session (cfd175ce4).

## Screens (wave 1, the core journey)
home /de · search /de/basel/coiffeur · pdp /de/salon/cuts-and-culture · booking .../booking ·
inspo /de/inspo · lookup /de/booking/lookup · queue /de/queue/<token> · profile /de/profile.
Long tail (later waves): vouchers, loyalty/stamps, gift-cards, confirmation, checkout, account,
brand, nail-tech, the legal/marketing pages.

## Process
1. Read-only audit workflow (wf_69e88b01-328): capture each screen 390x844 + measure vs the law +
   per-screen findings (numeric-autofix vs judgment). [running/done]
2. Assemble per-journey before/after gallery mockups from the findings.
3. Owner approves per screen -> apply to real code (coder + loop-reviewer), one commit per screen.

## Parked owner picks (from the homepage-rhythm probes this session)
- Hero search-card position: f (headline 40px, card 52%) marked / e (47%) / d (padding).
- Bottom-sheet gap: 144 marked (biggest that keeps the category poke) / 120 / 168 / 192.
- mt-[18px]: recurs 23x across 9 files as an unofficial shadow token, name it or sweep to 16/20.
- Page rhythm value: 32 shipped to the primitive + bypassing sections.
