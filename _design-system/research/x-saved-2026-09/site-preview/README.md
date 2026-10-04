# Whole-site preview of the 6 rules (2026-09-23, not approved)

The real dev site with one script (`system2.js`) layered on top by `proxy.mjs` (port 3491 -> dev server 3000). No product code changed. Stop the proxy and the preview is gone.

- `shots/*.jpg`: today vs new, 12 real pages at 402px (7 customer, 5 dashboard).
- `pages2.mjs` captures them, `sbs2.py` builds the side-by-sides.
- The rules come from the X saves comparison: `public/_research/x-components/`.

Status: mockup for the owner's eye check. Product code follows only after approval.

Update: the live overlay preview is retired (the owner wants mockups, not the live site with a layer on top).
`snapshot.mjs` froze the 12 pages into standalone static pages at `public/_research/site-mockup/` (no scripts, own copies of CSS, fonts and images). Open `/_research/site-mockup/index.html`.

## Update 2026-10-04: owner fix round

- `system2.js`: lighter box shadow, today's salon cards and search bar kept, map and cards left alone, shadow room in scrollers, no fade above the sticky Book bar, salon header per the owner's Fresha reference (clock + open word only, grey review count, dot, address in a grey 12px box). `?flat=1` renders the buttons comparison variant.
- `mock-interact.js`: injected into every frozen page so it can be tapped (press feedback, chips, days, time slots, add with live total, Continue to the date step). Simulated; nothing is booked.
- `snapshot.mjs`: maps are frozen as screenshots of themselves (overlays hidden during capture); a final system pass runs right before freezing. Do not re-shoot `booking-time` while the slot data is empty: the committed page uses September slots.
- `buttons-inventory.mjs` lists every button look on the frozen pages; `buttons-pairs.mjs` renders the today-vs-flat pairs in `public/_research/site-mockup/buttons/`.
