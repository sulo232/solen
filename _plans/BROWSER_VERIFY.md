# Browser-verify enforcement + site-testing MCP

Owner ask 2026-07-02 (voice): "agent browser ... make it so in a loop ... if I tell you to go
test out everything in the website, actually go test it out, use the agent browser skill to click
through / tap through stuff, and check if it actually works before you conclude."

Picked via AskUserQuestion: **enforcement hook** + **Vercel-style MCP server**. Reel skipped
(Instagram login-gated; "MCP Builder by Vercel" = `mcp-handler` / `@vercel/mcp-adapter` + Next.js
template for deploying MCP servers , confirmed via web search, no need for the reel).

## Atomic asks
- [x] Download/watch the IG reel (CLOSED , owner picked Skip twice). Owner re-invoked `/watch` 2026-07-02. BLOCKED: 4 distinct attempts (anon; chrome cookies in-sandbox; chrome cookies out-of-sandbox 48 cookies; after yt-dlp update) all return IG "empty media response / no csrf token" , yt-dlp's Instagram extractor is broken/blocked for this reel regardless of auth. CONCRETE dependency to unblock: owner drops the .mp4 locally (I /watch the file) OR exports a Netscape cookies.txt from a logged-in IG session (I retry `yt-dlp --cookies`). Awaiting owner pick.
- [x] Enforcement hook: a `Stop` gate that blocks ending the turn when this turn edited rendered UI (`*.tsx`/`*.css` under `app|src|components`) but never actually drove a browser (claude-in-chrome / preview_* / playwright / localhost-curl) to verify it. LIVE.
  - [x] Author `.claude/hooks/browser-verify-gate.sh`
  - [x] Self-test 17/17 (block/pass/ordering/prior-turn-stale/override/backend-only/mockup/boundary-noise + round-2 regressions O human-text-"tool_result", P curl:3001, Q isMeta-not-boundary)
  - [x] loop-reviewer round 1 FAIL -> 2 defects fixed (structural turn-boundary vs substring; curl any-port) -> re-verified green
  - [x] Wire into `.claude/settings.json` under `hooks.Stop`
- [x] Site-testing MCP server , FORK RESOLVED 2026-07-02: **LOCAL Playwright stdio MCP** at `scripts/mcp/site-tester/` (reaches localhost; reuses Playwright already in repo). BUILT + hardened over 4 review rounds.
  - [x] Scaffold local stdio MCP (`crawl.mjs` engine + `index.mjs` server + `selftest.mjs` + `README.md`); `@modelcontextprotocol/sdk` added; engine import-clean (testable without the SDK)
  - [x] Tool `test_site({url,maxPages,sameOriginOnly,viewport,maxElements})` , HERMETIC per-element (reload + re-find by stable locator per element -> no stale handles); reports pass/fail/**skip**, maxElements cap + `capped` (no silent truncation)
  - [x] Tool `check_route({url})` , single-route smoke (status, console errors, renderedText, failedRequests, screenshot)
  - [x] Self-test 74/74 against live fixtures (rule 12.5), README + register snippet written (not auto-wired)
  - [x] loop-reviewer: R1 FAIL (stale-handle false pass) -> R2 FAIL (survived + delayed-nav mis-attribution) -> R3 rearchitect hermetic (class DEAD) FAIL only on hidden-element default-pass leaf -> R4 fix (skip branches set result:"skip" + summary.skipped + regression test) -> GREEN. Converged.

## Design decisions / caveats surfaced
- The hook guards the LOCAL dev loop (what I do mid-turn). A Vercel-DEPLOYED MCP can only reach PUBLIC URLs and has serverless timeouts , it smoke-tests production, it does NOT verify localhost. Different moments; both wanted.
- Verification signals the gate accepts: `mcp__claude-in-chrome__*`, `mcp__Claude_Preview__*`, `mcp__playwright__*`, `Task(design-verifier)`, or a Bash curl/wget of localhost:3000. Any one ends the block.
- Loop-safety: the gate can trap a turn (Stop can't end). Escape = `touch .claude/browser-verify-skip.flag` (30-min TTL) AND tell the owner why verification was impossible. Message is explicit so the model self-releases instead of looping.

## Open / next
- After hook PASS + wired: present the MCP surface fork (local stdio MCP that can hit localhost vs Vercel-deployed remote MCP for prod smoke-tests; what tools it exposes; where it lives).
