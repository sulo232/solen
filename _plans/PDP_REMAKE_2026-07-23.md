# PDP remake — real components (owner 2026-07-23)
Owner law: the deliverable is the REAL .tsx component modified 1:1 with what ships, shown on the real
route — NOT a standalone HTML mockup. Enforced by real-component-gate.py (Stop, wired).

## Atomic
- [~] reviews -> direction A (Summary-first) in real SalonReviews.tsx  (agent building)
- [~] CTA -> booking-first in real SalonAppCta.tsx  (agent building)
- [~] location -> zoom16 + pin-l ink + rounded frame + info card in real SalonLocation.tsx  (agent building)
- [~] portfolio -> fix overlapping lightbox in real portfolio component  (agent building)
- [x] count -> sunken pill in SalonHeader.tsx (applied+verified live)
- [x] #1 active pill = gray (no-black-selected law; stays gray unless owner says black wins)
- [x] gates hardened: mockup-defer, count-consistency, real-component (all self-tested + wired via node)
- [ ] #12 walk-in "co" distinguisher — OWNER INPUT NEEDED (logo/distance/other), blocks walk-in card only

## Also applied on branch (uncommitted)
#6 count-font, #7 nearby cards 1.5-up, #11 open green #22C55E
