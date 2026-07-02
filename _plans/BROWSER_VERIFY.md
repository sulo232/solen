# Browser-verify enforcement + site-testing MCP

Owner ask 2026-07-02 (voice): "agent browser ... make it so in a loop ... if I tell you to go
test out everything in the website, actually go test it out, use the agent browser skill to click
through / tap through stuff, and check if it actually works before you conclude."

Picked via AskUserQuestion: **enforcement hook** + **Vercel-style MCP server**. Reel skipped
(Instagram login-gated; "MCP Builder by Vercel" = `mcp-handler` / `@vercel/mcp-adapter` + Next.js
template for deploying MCP servers , confirmed via web search, no need for the reel).

## Atomic asks
- [ ] Download the IG reel , BLOCKED (login-gated, sandbox can't reach browser cookies). Owner chose **Skip it**. CLOSED as won't-do per owner.
- [x] Enforcement hook: a `Stop` gate that blocks ending the turn when this turn edited rendered UI (`*.tsx`/`*.css` under `app|src|components`) but never actually drove a browser (claude-in-chrome / preview_* / playwright / localhost-curl) to verify it. LIVE.
  - [x] Author `.claude/hooks/browser-verify-gate.sh`
  - [x] Self-test 17/17 (block/pass/ordering/prior-turn-stale/override/backend-only/mockup/boundary-noise + round-2 regressions O human-text-"tool_result", P curl:3001, Q isMeta-not-boundary)
  - [x] loop-reviewer round 1 FAIL -> 2 defects fixed (structural turn-boundary vs substring; curl any-port) -> re-verified green
  - [x] Wire into `.claude/settings.json` under `hooks.Stop`
- [ ] Site-testing MCP server , FORK RESOLVED 2026-07-02: owner wants the one that "clicks through buttons / sees frontend" of what's being built = **LOCAL Playwright stdio MCP** (reaches localhost:3000; reuses `@playwright/test` already in repo). Vercel-remote rejected implicitly (can't reach localhost).
  - [ ] Scaffold local stdio MCP at `scripts/mcp/site-tester/` (ESM, `@modelcontextprotocol/sdk`), crawl logic factored into a plain testable async fn
  - [ ] Tool `test_site({url,maxPages,sameOriginOnly,viewport})` , crawl + click every interactive element, capture console/network/nav errors, structured pass/fail report (cap elements, log what's capped , no silent truncation)
  - [ ] Tool `check_route({url})` , single-route smoke (status, console errors, rendered?, screenshot)
  - [ ] Self-test the crawl fn against a live target (rule 12.5), README + register snippet
  - [ ] loop-reviewer PASS

## Design decisions / caveats surfaced
- The hook guards the LOCAL dev loop (what I do mid-turn). A Vercel-DEPLOYED MCP can only reach PUBLIC URLs and has serverless timeouts , it smoke-tests production, it does NOT verify localhost. Different moments; both wanted.
- Verification signals the gate accepts: `mcp__claude-in-chrome__*`, `mcp__Claude_Preview__*`, `mcp__playwright__*`, `Task(design-verifier)`, or a Bash curl/wget of localhost:3000. Any one ends the block.
- Loop-safety: the gate can trap a turn (Stop can't end). Escape = `touch .claude/browser-verify-skip.flag` (30-min TTL) AND tell the owner why verification was impossible. Message is explicit so the model self-releases instead of looping.

## Open / next
- After hook PASS + wired: present the MCP surface fork (local stdio MCP that can hit localhost vs Vercel-deployed remote MCP for prod smoke-tests; what tools it exposes; where it lives).
