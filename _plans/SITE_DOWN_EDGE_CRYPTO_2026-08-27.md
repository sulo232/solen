<!-- batch: the site does not build, found 2026-08-27 while opening a link to main -->
# THE SITE DOES NOT BUILD, and it has nothing to do with today's merge

Found 2026-08-27 the moment a preview of `main` was opened for the owner. Every page returns a
Next.js build error instead of the site:

    Module not found: Can't resolve 'crypto'
    ./lib/unsubscribe-token.ts (1:1)
    import trace: lib/email.ts -> lib/alert-admin.ts -> lib/ratelimit.ts -> app/api/cities/route.ts

## WHY, and the control that says it is not the merge

`app/api/cities/route.ts:9` declares `export const runtime = "edge"`. It imports
`lib/ratelimit.ts`, which statically imports `alertAdmin` from `lib/alert-admin.ts`, which
imports `lib/email.ts`, which imports `lib/unsubscribe-token.ts`, whose first line is
`import { createHmac, timingSafeEqual } from "crypto"`. Node's `crypto` does not exist in the
Edge runtime, so webpack cannot resolve it and the build stops.

**CONTROL, run before touching anything:** every link of that chain is byte-identical on
`1ebf80abb` (main as it stood BEFORE today's merge) and on the stress-test branch. The merge
did not introduce it. `lib/unsubscribe-token.ts` arrived in `5f2d05549` ("Four backend holes
closed: a lockout, an email hole, and two silent failures").

**Blast radius:** 20+ API routes declare `runtime = "edge"` and import `lib/ratelimit.ts`, so
this is not one route, it is the whole build.

**Why typecheck missed it:** `tsc --noEmit` resolves `crypto` from `@types/node` and is happy.
Runtime availability per Next.js runtime is a bundler question, not a type question. Typecheck
passing is exactly the "necessary but never sufficient" case the project rules name.

## Boxes

- [x] Break the static chain. Done TWICE over, both links cut: `lib/ratelimit.ts:294` now loads
  `alertAdmin` at call time (`import("@/lib/alert-admin")`), and `lib/unsubscribe-token.ts` no
  longer imports Node `crypto` at all. It was rewritten onto Web Crypto
  (`globalThis.crypto.subtle`), which exists in BOTH the Edge runtime and Node, so the root file
  every chain converges on is now runtime-neutral rather than one chain being patched.
- [x] PROVED with a real build, run by me and not taken from the builder: `npx next build`
  completes and prints the full route table. All 102 edge routes resolved.
- [x] The German homepage renders through the tunnel at 390x844, screenshotted: real salon
  photos, real prices, zero console errors. German copy saying "Store": 0 of 5,873 keys.
- [~] An independent reviewer is running now, briefed to BREAK it, not bless it (timing leak,
  token compatibility, fail-open, a missing await anywhere, the build claim, globalThis.crypto
  availability). My own controls so far, run separately from the builder's: old and new tokens
  byte-identical across 6 emails including unicode and the empty string, with a known-answer
  control proving the comparison itself discriminates; every call site awaits, including
  `app/api/unsubscribe/route.ts:43`, where an unawaited Promise would have been truthy and made
  EVERY token valid.
- [x] No other edge route reaches a Node-only built-in TODAY, and the build is the proof rather
  than a grep: webpack resolves the whole module graph per runtime, so a second bad chain would
  have failed the same way the first one did, and the build is clean.

  **But the hazard is still live, and this is the part worth keeping.** 21 files under `lib/` and
  `app/` still statically import Node built-ins (`crypto` in 9, `node:fs`/`node:path`/`node:os` in
  the dev pages, `node:net` in the SSRF guard). None is reachable from an edge route right now.
  The moment any edge route imports one, or imports something that imports one, the whole build
  dies again exactly as it did today, and typecheck will still pass while it happens. Notable:
  `lib/barber/loyalty-qr.ts` is the same HMAC shape this file just moved off Node crypto and is
  the most likely next casualty.
