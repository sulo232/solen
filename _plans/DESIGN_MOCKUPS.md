# Decision mockups (consolidation follow-up) , 2026-07-12

Owner ask: "make me mockups" + AskUserQuestion pick: ALL THREE scopes (web decision A/Bs, mobile selected-state, visible chip changes).

Law binding this batch: mockup = copy of the REAL component/page, treatment-only, one language, real data, Lucide only, Exists-check line in every new mockup file, served + cloudflare tunnel link (never LAN/artifact), recommendation per decision (rule 2). No parallel frontend agents, one coherent pass.

## Infra
- [ ] M0a npm ci in this worktree (no node_modules yet)
- [ ] M0b .env.local symlinked from the main checkout
- [ ] M0c socket-bind test passes (sandbox listen check), dev server up on :3000
- [ ] M0d cloudflared tunnel minted + serving (curl 200 through it)

## Web decision mockups (real components, A/B side-by-side, 375px-first)
- [ ] M1 /dev/decision-backbutton , real glass BackButton over a real salon hero photo, 40px vs 44px
- [ ] M2 /dev/decision-disabled , real primitives (commit CTA, Switch, Checkbox, Radio, TextInput) disabled at opacity-40 vs opacity-50
- [ ] M3 /dev/decision-badge , real header bell with the count pill in s-error red vs neutral ink
- [ ] M4 /dev/decision-radius , real SalonResultCard, photo radius 18 (shipped drift) vs 22 (locked)
- [ ] M5 /dev/decision-shadow , real PDP section card, current raw rgba hover shadow vs flat/elevation-2 (CONTROL_ELEVATION law)

## Mobile
- [ ] M6 mobile selected-state , BLOCKED, verified this session: `xcrun simctl list devices available` shows 0 iPhone simulators in this environment (no runtimes) and none booted, so the iOS mockup law (real screen + simulator screenshot, never HTML) cannot be satisfied here. Deliverable when unblocked: a ?v= gated gray-sunken variant on the real filter screen (pattern already used by the concurrent solen-mobile session) + sim screenshots. Surfaced to owner in the close message.

## Verify + deliver
- [ ] M7 every route rendered + screenshotted at 375px, looked at (design-verify gate satisfied by looking, not flags)
- [ ] M8 close message: one clickable tunnel link per mockup + a recommendation per decision
- [ ] M9 ACTIVE.md row + commits per chunk
