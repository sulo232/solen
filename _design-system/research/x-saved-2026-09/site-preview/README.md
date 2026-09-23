# Whole-site preview of the 6 rules (2026-09-23, not approved)

The real dev site with one script (`system2.js`) layered on top by `proxy.mjs` (port 3491 -> dev server 3000). No product code changed. Stop the proxy and the preview is gone.

- `shots/*.jpg`: today vs new, 12 real pages at 402px (7 customer, 5 dashboard).
- `pages2.mjs` captures them, `sbs2.py` builds the side-by-sides.
- The rules come from the X saves comparison: `public/_research/x-components/`.

Status: mockup for the owner's eye check. Product code follows only after approval.

Update: the live overlay preview is retired (the owner wants mockups, not the live site with a layer on top).
`snapshot.mjs` froze the 12 pages into standalone static pages at `public/_research/site-mockup/` (no scripts, own copies of CSS, fonts and images). Open `/_research/site-mockup/index.html`.
