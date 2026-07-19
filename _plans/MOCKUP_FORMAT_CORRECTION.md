<!-- batch: mockup FORMAT correction (owner 2026-07-19) -->
# CORRECTION , mockups must be FULLSCREEN real-page BEFORE/AFTER, not abstract A/B panels

Owner 2026-07-19 (recurring, "i told you ALWAYS ... why do u keep forgetting harden the gate"):
every mockup must be a FULL-SCREEN preview of the real account/app page, with a Before/After toggle
(BEFORE = live `<iframe>` of the real route, AFTER = the same page full-screen with ONLY the change applied).
The format is the liftup-*-fs pattern (2026-07-18). My 38 sweep-* mockups are abstract "Direction A / B"
gray comparison panels = the banned from-scratch redraw. WRONG FORMAT.

- [x] CORRECTION: HARDEN THE GATE , `.claude/hooks/mockup-fullscreen-gate.py` (self-tested 3/3: blocks
      abstract A/B, passes liftup-fs, exempts the gallery index), wired into settings.json Write+Edit.
- [ ] CORRECTION: REBUILD the 38 sweep-* mockups in the fullscreen before/after format (live iframe BEFORE +
      full-screen AFTER + toggle). Grounded in each real route. In progress , converting highest-value first.
- [ ] Gallery index unchanged (exempt from the gate).

Real-route map for the rebuild (mockup -> real route to iframe as BEFORE):
- sweep-dash-vibrancy / selected / status-pill / card-signature -> /de/dashboard (+ /revenue, /earnings, /settings)
- sweep-selected-ink-pill -> /de/profile/settings ; sweep-voucher-status-chip -> /de/profile/vouchers
- sweep-auth-grammar -> /de/auth/reset-password ; sweep-empty-consolidation -> /de/reviews
- sweep-booking-* -> /de/salon/[slug]/booking ; sweep-city-picker / nav-hover / cookie / overlay -> / (header/overlay)
- full 39 list in _plans/MOCKUP_QUEUE.md

## Correct format (copy from public/_mockups/liftup-home-fs/index.html)
`<!-- Base: capture live --><!-- Scale: full-page -->` + `body{overflow:hidden}` + fixed top bar with a
Before/After segmented toggle + BEFORE pane = `<iframe src="/de/<route>">` + AFTER pane = the same page
full-screen with ONLY the one proposed change applied. Iframe BEFORE needs the dev server + tunnel live.
