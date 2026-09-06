// exists-check: `npm run exists directions-0905-r3` (this session) confirms the round-3 kit
// barrel at ../../_kit (index.ts) already carries Candidate C's value sheet. This file is NOT a
// second kit and duplicates no component: it is a one-line re-export bridge, mechanically
// identical to what ../../_kit/index.ts itself already does (`export * from
// "<the round-2 kit path>"`), added ONLY because that shared barrel currently fails to compile
// (see below) and this build's own scope is "your folder only, never the shared kit".
//
// BLOCKING BUG IN THE SHARED BARREL, verified live this session, not touched (out of this
// folder's scope): ../../_kit/index.ts's own JSDoc header contains the line
// `<KitProvider system="a" | "b" | "c">   {/* exactly one candidate per screen */}` inside a
// `/** ... */` block comment. The `*/` inside that JSX-style inner comment closes the OUTER
// block comment early, so every line after it until the next real `*/` becomes live (garbage)
// TypeScript. Confirmed with a fresh curl against the running dev server BEFORE this file
// existed: `/en/dev/directions-0905-r3/confirmation/a`, `/en/dev/directions-0905-r3/search-results/c`
// and `/en/dev/directions-0905-r3/payment-step/a` all returned HTTP 500 with the identical
// next-swc-loader "Expression expected" trace pointing at that file's line 18, meaning every
// round-3 candidate on every screen is currently broken by this one shared file, not something
// specific to this screen or this candidate. Reported to the orchestrator in this build's closing
// report as a shared-kit blocker; the one-line real fix is removing the `*/`-containing JSX-style
// comment from inside that block comment (e.g. rewriting it as a parenthetical, not a `{/* */}`).
// This bridge lets THIS screen render and be screenshotted without editing that shared file,
// per this build's own hard boundary ("nobody else writes in your folder; you write nowhere
// else").
//
// Depicts: every kit primitive this screen uses (KitProvider, Card, SectionTitle, Meta, Price,
// StatusBadge, TextLink, tokens) -> app/[locale]/dev/directions-0905-r3/_kit/index.ts (the
// intended barrel; re-exported here from its own real underlying source since that barrel does
// not currently compile, see above).

export * from "../../../directions-0905-r2/_kit";
