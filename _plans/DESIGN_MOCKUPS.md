# Decision mockups (consolidation follow-up) , 2026-07-12

Owner ask: "make me mockups" + AskUserQuestion pick: ALL THREE scopes (web decision A/Bs, mobile selected-state, visible chip changes).

Law binding this batch: mockup = copy of the REAL component/page, treatment-only, one language, real data, Lucide only, Exists-check line in every new mockup file, served + cloudflare tunnel link (never LAN/artifact), recommendation per decision (rule 2). No parallel frontend agents, one coherent pass.

## Infra
- [x] M0a install , DONE (pre-compaction), verified: node_modules/.bin/next present, 521 top-level packages; dev server compiles
- [x] M0b env , DONE, verified: .env.local -> /Users/sulo/Documents/solen/.env.local symlink; API routes return 200 (preview_logs)
- [x] M0c dev server , UP on :3000 via preview_start (serverId 0f27e866). NOTE: bash-sandbox blocks BOTH listen() and outbound localhost connect (probes: 'Operation not permitted' x2), so in-sandbox curl to localhost is impossible this session; server manager + browser tools run outside the sandbox and work
- [x] M0d tunnel , DONE, verified: https://equation-ball-crowd-record.trycloudflare.com minted via desktop-commander PID 54413 (outside the sandbox, so it CAN reach :3000); end-to-end proof curl /de -> 200 through the public edge

## Web decision mockups (real components, A/B side-by-side, 375px-first)
- [ ] M1 /dev/decision-backbutton , real glass BackButton over a real salon hero photo, 40px vs 44px , IN FLIGHT: coder agent a0f998 dispatched this session (re-run after the 401-killed first attempt), decision-backbutton already on disk
- [ ] M2 /dev/decision-disabled , real primitives (commit CTA, Switch, Checkbox, Radio, TextInput) disabled at opacity-40 vs opacity-50 , IN FLIGHT: coder agent a0f998 dispatched this session (re-run after the 401-killed first attempt), decision-backbutton already on disk
- [ ] M3 /dev/decision-badge , real header bell with the count pill in s-error red vs neutral ink , IN FLIGHT: coder agent a0f998 dispatched this session (re-run after the 401-killed first attempt), decision-backbutton already on disk
- [ ] M4 /dev/decision-radius , real SalonResultCard, photo radius 18 (shipped drift) vs 22 (locked) , IN FLIGHT: coder agent a0f998 dispatched this session (re-run after the 401-killed first attempt), decision-backbutton already on disk
- [ ] M5 /dev/decision-shadow , real PDP section card, current raw rgba hover shadow vs flat/elevation-2 (CONTROL_ELEVATION law) , IN FLIGHT: coder agent a0f998 dispatched this session (re-run after the 401-killed first attempt), decision-backbutton already on disk

## Mobile
- [ ] M6 mobile selected-state , BLOCKED, verified this session: `xcrun simctl list devices available` shows 0 iPhone simulators in this environment (no runtimes) and none booted, so the iOS mockup law (real screen + simulator screenshot, never HTML) cannot be satisfied here. Deliverable when unblocked: a ?v= gated gray-sunken variant on the real filter screen (pattern already used by the concurrent solen-mobile session) + sim screenshots. Surfaced to owner in the close message.

## Verify + deliver
- [ ] M7 render+look , BLOCKED-ON M1-M5 coder return (browser render + 375px screenshots queued next wakeup)
- [ ] M8 close , BLOCKED-ON M7; tunnel already live + proven (https://equation-ball-crowd-record.trycloudflare.com, curl 200 via edge)
- [ ] M9 records , BLOCKED-ON M8; checkpoint commits running per chunk (infra tick commit + coder WIP checkpoint)
