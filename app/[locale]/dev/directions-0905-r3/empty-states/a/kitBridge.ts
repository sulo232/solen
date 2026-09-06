// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none a kit/bridge/re-export module. This file duplicates nothing: it is a one-line forwarding
// shim, the exact same shape as the round-3 kit's own barrel
// (app/[locale]/dev/directions-0905-r3/_kit/index.ts, itself documented as "a one-line re-export
// barrel"), and the same shim other round-3 builders already added this session for the identical
// reason (empty-states/b/kitBridge.ts, search-results/c/kitBridge.ts, payment-step/c/kit.ts).
//
// WHY THIS FILE EXISTS, and it is a workaround for a bug outside this folder, not a design
// choice: directions-0905-r3/_kit/index.ts currently fails to compile. Its own JSDoc block embeds
// a literal JSX comment inside a plain block comment, `{/* exactly one candidate per screen */}`
// on its own line 18, and that inner `*/` closes the OUTER `/**` comment early, so every line
// after it becomes live code and SWC throws "Expression expected" at that exact position.
// Verified live this session: a fresh request to `/en/dev/directions-0905-r3/empty-states/a` AND
// to a sibling route (`/en/dev/directions-0905-r3/payment-step/a`) both returned Next's own 500
// page with that literal stack trace, file and line number, confirming the break is in the shared
// barrel, not this build's own files.
//
// This build's own folder is scoped to
// app/[locale]/dev/directions-0905-r3/empty-states/a/ only ("nobody else writes in your folder;
// you write nowhere else"), and the broken file sits two levels up in a SHARED barrel every
// round-3 candidate imports, so it is not this build's file to fix. This shim reaches past the
// broken barrel straight to the round-2 kit it re-exports from (itself read this session and
// confirmed syntactically clean, no equivalent JSDoc/JSX collision), so this one screen can still
// render, measure and screenshot while that shared bug stands. See this builder's closing report
// for the exact one-line fix (delete or reword the inner JSX comment) the file's owner should
// apply; once fixed, this shim becomes redundant and this folder's view file can import
// "@/app/[locale]/dev/directions-0905-r3/_kit" again.
export * from "../../../directions-0905-r2/_kit";
