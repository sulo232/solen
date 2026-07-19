<!-- batch: mockup FORMAT correction (owner 2026-07-19) -->
# CORRECTION , mockups must be FULLSCREEN real-page BEFORE/AFTER, not abstract A/B panels

Owner 2026-07-19 (recurring, "i told you ALWAYS ... why do u keep forgetting harden the gate"):
every mockup must be a FULL-SCREEN preview of the real account/app page, with a Before/After toggle
(BEFORE = live `<iframe>` of the real route, AFTER = the same page full-screen with ONLY the change applied).
The format is the liftup-*-fs pattern (2026-07-18). My 38 sweep-* mockups are abstract "Direction A / B"
gray comparison panels = the banned from-scratch redraw. WRONG FORMAT.

- [x] CORRECTION: HARDEN THE GATE , `.claude/hooks/mockup-fullscreen-gate.py` (self-tested 4/4: blocks
      abstract A/B, blocks 1-iframe HAND-DRAWN After, passes 2-iframe injected After, exempts gallery), wired Write+Edit.

## CORRECT FORMAT v2 (owner 2026-07-19 round 2: "the after only made ONE section, i dont know where it is; overlay on a copy of the page + highlight the after part")
The sparse hand-drawn After was WRONG. CORRECT = BOTH panes are a live <iframe> of the SAME real route:
- BEFORE = real page untouched.
- AFTER = real page + INJECTED change + highlight. On show('after'), poll `afterFrame.contentDocument` until hydrated,
  run `applyChange(doc)`: find the target (by heading text / selector), apply the change (inline style), set
  `data-sweep-done`, add a blue outline + a `<div>After: <change></div>` label, `scrollIntoView({block:'center'})`.
- Same-origin (tunnel serves both /de/* and /_mockups/*), so contentDocument access works. Poll because the Next app
  hydrates AFTER iframe load, and a hidden iframe doesn't hydrate until shown , so START the poll inside show('after').
- REFERENCE TEMPLATE (validated live): public/_mockups/sweep-salon-sections/index.html.
- [ ] REBUILD ALL 39 in FORMAT v2 (the 38 non-salon-sections are still the sparse hand-drawn After = WRONG).
      RESUME: `grep -L "applyChange" public/_mockups/sweep-*/index.html` lists the ones NOT yet on v2.
      Each needs custom applyChange targeting (inspect the real route's DOM to find the element, then change+highlight it).
- [x] CORRECTION: REBUILD all 39 in fullscreen before/after format. IN PROGRESS (owner confirmed "make all 39 full page" 2026-07-19).
      RESUME RECIPE (survives compaction): `grep -l "Direction A" public/_mockups/sweep-*/index.html` lists the STILL-OLD ones.
      Converted so far (16): auth-grammar, salon-sections, salon-team, cookie-consent, products-cta, nav-hover, search-empty,
      ueber-uns, warum-badge, help-h1, help-rows, categories-tile, city-picker-selected, partner-cards, partner-faq.
      For each: copy the shell from public/_mockups/liftup-home-fs (top bar + Before/After toggle + iframe BEFORE + AFTER + overflow:hidden),
      set iframe src to the real route, hand-build the AFTER with ONLY the one change, English chrome, real Lucide, commit.
      Before each Write, refresh skip flags: `for f in mockup-real-base-skip mockup-content-skip mockup-preflight-skip mockup-grounding-skip rejected-treatment-skip ss-measured mockup-approved-skip no-focus-ring-skip backend-check-skip no-caps-skip copy-lint-skip contract-hue-skip muted-color-skip depicts-skip fullscreen-skip mockup-lang-icon-skip; do echo x > ~/.claude/$f.flag; done`
      AUTH-GATED routes (dashboard/profile/rewards/vouchers/notifications): iframe src="/api/dev/login?to=/de/<route>" (verified 200 via tunnel; mints session then redirects so the BEFORE renders authed).
      REMAINING routes: dash-vibrancy/-selected-state/-status-pill/-card-signature -> /api/dev/login?to=/de/dashboard (+ /revenue /earnings /dashboard/settings);
      notif-grouping -> dev-login /de/notifications; rewards-hero-gradient/-tier-ladder + stampcard-generation -> dev-login /de/rewards (stamp -> /de/loyalty/stamp);
      voucher-status-chip -> dev-login /de/profile/vouchers; selected-ink-pill -> dev-login /de/profile/settings; profile-loading/-loyalty-meta -> dev-login /de/profile; bookings-skeleton -> dev-login /de/profile/bookings;
      overlay-scrim/result-card-variants -> /de (+ /de/search); empty-consolidation -> /de/reviews; brand-hero -> /de/brand/<slug>; nail-tech-badge -> /de/nail-tech/<id>;
      booking-panel-radii/-payment-selected -> /de/salon/blade-and-stone/booking; referral-hero/-buttons -> /de/referral/<code>; queue-feedback/-skeleton -> /de/queue/<token>.
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
