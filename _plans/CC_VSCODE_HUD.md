# Workstream 34 , Claude Code VS Code HUD (visuals: context, limits, subagents, insight)

Owner ask (2026-07-25, verbatim intent): "improve the Claude Code experience in VS Code , right now there isn't really an indicator. I want visuals: how much context is left, how much of the 5-hour limit and the weekly limit is left, how the subagents are doing, a status bar, and a little insight thing so it tells me what it's doing instead of just tool-call after tool-call. Also give me ideas on what to add and what you're actually capable of."

## Readback , atomic asks

- [x] A1. Research what already exists (rule 12) , do NOT build a second status bar , verified: `~/Documents/claude-statusbar` exists (README.md 4072 bytes, `out/` built, `node_modules/`, installed into VS Code) => EXTEND it, do not create a second extension
- [x] A2. Establish whether 5h / weekly limit data is reachable at all (the existing README claims it is not) , verified: `~/.claude.json` -> `cachedUsageUtilization.utilization` carries `five_hour` and `seven_day` percent + `resets_at` + `fetchedAtMs`. The README's "unreachable" claim is FALSE.
- [x] A3. Context left , shown as a visual , SHIPPED d980fe4: `ctx N%` in the strip with a 5-cell gauge, tooltip shows tokens / window / percent, window size auto-detected
- [x] A4. 5-hour limit remaining , SHIPPED d980fe4: `5h N%` in the strip, gauge + reset countdown + cache age in the tooltip, `?` suffix when stale
- [x] A5. Weekly (7-day) limit remaining , SHIPPED d980fe4: `7d N%`, same treatment, plus per-model `weekly_scoped` rows
- [x] A6. Subagent state , SHIPPED d980fe4: running count in the strip, tooltip lists each agent as `agentType · elapsed · description`
- [x] A7. Status bar , SHIPPED d980fe4, deployed to `~/.vscode/extensions/local.claude-statusbar-0.0.1`, warning background at 80%
- [ ] A8. "Insight" , **REDIRECTED by the owner (see D4)**. The tool-name readout built in round 1 is REJECTED by name. Rebuild as: why-not-what, warnings/stalls in colour, plain-English session recap. IN FLIGHT: round-2A coder dispatched 2026-07-25, covers P2a + P2c + P2d data layer.
- [x] A9. Ideas menu , written into this file below under "A9 , ideas menu (the durable copy)". 11 ideas, ranked into three tiers, each naming what it needs. `verified:` the section exists in this file.
- [x] A10. Capability statement , written into this file below under "A10 , what is actually possible". Three buckets: readable from disk, readable only via the live call, not readable at all. `verified:` the section exists in this file.

## Findings (measured 2026-07-25)

**A1 , it already exists.** `~/Documents/claude-statusbar` v0.0.1, installed at
`~/.vscode/extensions/local.claude-statusbar-0.0.1`. Round 1 grew it 635 -> ~1100 lines.
The installed copy is a real directory, NOT a symlink, so `src/` edits do nothing until
`out/` and `package.json` are copied across , that is what `deploy.sh` (new) exists for.

**A2 , the README's central limitation is FALSE as of CLI 2.1.219 / ext 2.1.220.**
README said: "No 5-hour / 7-day usage limit display ... this extension has no source to
read that data from." Two sources measured today:

1. `~/.claude.json` -> `cachedUsageUtilization` (87KB file, cheap to poll). Contains
   `five_hour.utilization` (%), `seven_day.utilization` (%), both `resets_at`, plus a
   `limits[]` array with per-model `weekly_scoped` entries and `severity`.
   Caveat measured: it is a CACHE. Mine was 144 min stale and its `five_hour.resets_at`
   had already passed => staleness must be rendered, never hidden.
2. `${BASE_API_URL}/api/oauth/usage` with the OAuth header , the exact endpoint the
   official extension calls (`extension.js` offset ~2290484). Live. Owner picked this
   (D1) with a hardening requirement.

**Context window `[1m]` still not detectable from the transcript.** Confirmed: transcript
records `message.model = "claude-opus-5"`, suffix stripped. `~/.claude.json`
`projects[cwd].lastModelUsage` is `{}` for solen, so that is not a fallback either.
=> shipped an observed-tokens heuristic (tokens seen > configured window => promote to 1m,
one-way for the session), config kept as the override.

**Cost readout is dead for the owner's actual model.** `src/pricing.ts` has no entry for
`claude-opus-5`, `claude-sonnet-5`, or `claude-fable-5`, and `costOf` returns 0 for an
unknown model, so the `$` segment never renders. Verified rates (claude-api skill,
2026-07-25, USD per 1M in/out): opus-5 5/25 · fable-5 10/50 · sonnet-5 3/15 (intro 2/10
through 2026-08-31) · haiku-4-5 1/5 · opus-4-8 / 4-7 / 4-6 5/25. Queued for round 2.

## Owner decisions (2026-07-25, answered)

- **D1. Limits source = LIVE FETCH**, verbatim: *"live fetch but make fixes not patch find
  a way to eliminate the risk from the undocumented endpoint"*. So live is the primary
  path and the undocumented-endpoint risk gets ENGINEERED OUT, not accepted:
  validate the response shape before trusting any field; on any failure (network, auth,
  401/404, shape mismatch, timeout) fall back to the `~/.claude.json` cache silently and
  keep rendering; never throw into the extension host; never block the 1s tick; cache the
  last good live reading so a transient failure does not blank the strip. The cache path
  is not a patch, it is the designed floor.
- **D2. UI = status bar PLUS a real panel.** Gauges, 5h/weekly bars that colour-shift,
  token-burn sparkline, one card per running subagent, session timeline.
- **D3. "status part two" = STATUS OF THE WORK ITSELF** , what step Claude is on, what is
  done, what is left. NOT a second tool-call strip.
- **D4. Insight , the round-1 build is REJECTED.** Owner verbatim: *"i dont want to see
  what tool its running i dont understand and i keep seeing in chat too and i dont like
  that so much"*. The `$(tools) Running npm run build · 12s` item must go. Wanted instead:
  (a) **why, not what** , which of my asks is being worked and what step it is at;
  (b) **warnings and stalls, with colour** , long-running call, quiet subagent, context or
  limits about to run out, repeated failures; (c) **session recap when it finishes**, in
  plain English.

## Build phases

- [x] P1 , SHIPPED d980fe4 + deployed: usage limits from the cache with staleness, context
      gauge, auto 1m detection, subagent detail, `deploy.sh`, tests extended (compile clean,
      fixture-check OK)
- [ ] P2 , round 2 (owner-directed). Round 2A DISPATCHED 2026-07-25 to a coder subagent,
      running at time of writing; 2B not yet dispatched.
  - [ ] P2a. Kill the tool-name insight item (D4) , IN FLIGHT (round 2A, task 1)
  - [ ] P2b. Live `/api/oauth/usage` fetch, shape-validated, cache-backed, non-throwing (D1)
        , **BLOCKED on the owner**, concrete blocker: the call needs the OAuth token from the
        macOS keychain item `Claude Code-credentials`, and reading it makes macOS prompt for
        keychain access. Asked in the closing report; until the owner says yes, the cache
        path (already shipped) stays primary. Everything else in D1 (shape validation,
        backoff, timeout, non-throwing, cache floor) is specified and ready to build.
  - [ ] P2c. Work-status readout: current step, done, remaining (D3) , data layer IN FLIGHT
        (round 2A, task 3: `src/workstate.ts`). Rendering is round 2B.
        Sources verified today: `aiTitle` and `lastPrompt` records, plus `TodoWrite` tool
        calls (present in 23 of 29 transcripts for this project, so common but not certain).
  - [ ] P2d. Warnings and stalls with colour (D4b) , detector IN FLIGHT (round 2A, task 3:
        `detectWarnings`). Rendering is round 2B.
  - [ ] P2e. Plain-English session recap on idle (D4c) , queued for round 2B, not started
  - [ ] P2f. Webview panel: gauges, bars, burn sparkline, agent cards, timeline (D2) ,
        queued for round 2B, not started. Mockup-first before it lands.
  - [ ] P2g. Add opus-5 / sonnet-5 / fable-5 to `pricing.ts` , IN FLIGHT (round 2A, task 2),
        plus an `isKnownModel` export so an unpriced model reads "unknown" instead of $0.00

## A9 , ideas menu (the durable copy)

Ranked, each grounded in data measured to exist on disk. Items 1-5 of the build phases
above are already covered and are not repeated here.

**Cheap, high value**
1. Burn rate and projection , "at this pace you hit the 5-hour limit in about 40 minutes",
   from token deltas over time. No new source needed.
2. Cost history per session / day / week / model. All 29 transcripts for this project are
   on disk and unread by the extension today.
3. Time-to-compaction estimate , context growth rate against the detected window.
4. Finish notification , a native VS Code notification when a long run ends, carrying the
   plain-English recap (P2e).
5. Live ticking reset countdown rather than a value that only refreshes on hover.

**Worth it, more work**
6. Subagent detail , what each was asked, elapsed, cost, outcome. `agent-*.meta.json` plus
   each agent's own `agent-*.jsonl` are both already parsed for cost.
7. Per-turn model and cost, to catch an expensive model running where it was not needed.
8. Session pinning , today two windows on the same project both follow whichever `.jsonl`
   has the newest mtime. The README already admits this; pinning fixes it.
9. Limit history , only the current snapshot is stored anywhere, so this requires the
   extension to start sampling and keeping its own record. The history only starts the day
   it is switched on, which is the argument for doing it early.

**Not worth it**
10. A weekly usage chart before item 9 exists would be fabricating data (no-fabrication rule).
11. Changing how Anthropic's own sidebar renders. That is `anthropic.claude-code`, not ours.

## A10 , what is actually possible

**Readable from disk, no network call:** every message and its model; exact input, output,
cache-read and cache-creation token counts; every tool call and result; subagent metadata
and each subagent's own transcript; the session title (`aiTitle`); the user's prompt
(`lastPrompt`); the todo list; git branch; cwd; permission mode; CLI version.

**Readable only via the live call:** current 5-hour and weekly percentages and reset times
fresh rather than cached. Endpoint `${BASE_API_URL}/api/oauth/usage`, OAuth header, token in
the macOS keychain under `Claude Code-credentials`.

**Not readable, and must not be invented:** the `[1m]` context marker (inferred from
observed tokens instead, and the tooltip says "auto-detected"); limits in dollars
(`limit_dollars` is null on this plan); any history of limit usage (only the current
snapshot is persisted); anything Claude reasoned about that was not written down.

**Out of reach entirely:** altering the official Claude Code extension's own UI.

## Notes

- Round 1 lost two coder subagents to transient API 500s mid-task; work survived on disk
  and was resumed by message rather than restarted. Repo is now git-tracked (was not),
  first commit d980fe4, so a future interruption is recoverable.
