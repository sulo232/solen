# _docs/FRONTEND.md , the frontend "how it works + how it connects" reference (2026-07-17)

Owner ask (paraphrased from dictation): we have the DESIGN defined (LOCKFILE/tokens/taste) but not
the FUNCTION. For each customer page and flow we lack: what it does, what features live on it, what
you can do, and, most of all, HOW IT CONNECTS to the next screen (a haircut has a duration that
carries into the total, then transfers to confirmation; a profile has clickable things; refund has
its own steps). It is hard to understand and build the frontend without this. Fan out subagents,
find + write everything down. "What do you think, give me your idea."

## The gap (researched, rule 12, NOT a duplicate)
- EXISTS: _inventory/SURFACE.md (STRUCTURAL, what routes/components/APIs exist, auto-gen), 
  _rules/KEY_FEATURES.md (flat 23-line feature list), _docs/BACKEND.md (deep backend how-it-works).
- MISSING: the FRONTEND counterpart to BACKEND.md , a living "how every customer surface works and
  connects" reference. This deliverable EXTENDS the BACKEND.md pattern to the frontend.

## The idea (recommended structure), FLOW-first because connections are the point
`_docs/FRONTEND.md`:
1. The customer journey GRAPH , entry points -> screens -> handoffs (what data passes screen to screen).
2. Per-FLOW specs (the meat). Each documents, grounded in real code (file:line, real vs computed data):
   the screens in order, everything you can DO on each, what each element is wired to, the state
   transitions, and the HANDOFF to the next screen (what carries over).
3. Per-surface feature inventory (each page: components/features present + what they do).
4. Connections table , the edges: screen X -> screen Y, trigger, data transferred.

## The flows to map (one read-only discovery agent each; DISCOVERY = parallelizable, allowed)
- [ ] 1. Discovery & Search (home -> city/category search -> results)
- [ ] 2. Salon page / PDP (what it shows, interactions, handoff to booking)
- [ ] 3. Booking flow (services w/ duration + add-ons -> staff -> time -> hair -> cart total -> handoff)
- [ ] 4. Checkout & Payment (methods, TWINT, vouchers/credits, guest, handoff to confirmation)
- [ ] 5. Confirmation & post-booking (confirmation, manage, reschedule, cancel, refund, report, upcharge)
- [ ] 6. Walk-in & Queue (join -> pay -> queue tracker -> tip)
- [ ] 7. Reviews & ratings (leave review, photos, stars, salon reply)
- [ ] 8. Profile & account (hub, bookings, favourites, vouchers, stamps, settings, hair profile)
- [ ] 9. Value store frontend (loyalty stamps, vouchers, gift cards, credits, referrals)
- [ ] 10. Inspo / discovery feed (feed, saved, boards, look detail)
- [ ] Synthesize all 10 into _docs/FRONTEND.md + the journey graph + connections table.
- [ ] Wire a pointer (like backend-doc-pointer) so new sessions load it. (after owner nod on the doc)

## Build method
One read-only subagent per flow reads the real route + components + wired data/APIs + _plans/
FLOW_HARNESS.md, and writes that flow's section grounded in the actual code (file:line), never
guessed. Mirrors how _docs/BACKEND.md was built (50-agent research). I synthesize.
