// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED
// hits, none a kit/bridge/re-export module. This file duplicates nothing: it is a one-line
// forwarding shim, the exact same shape as the round-3 kit's own barrel
// (`app/[locale]/dev/directions-0905-r3/_kit/index.ts`, itself documented as "a one-line
// re-export barrel").
//
// WHY THIS FILE EXISTS, and it is a workaround for a bug outside this folder, not a design
// choice: `directions-0905-r3/_kit/index.ts` currently fails to compile. Its own JSDoc block
// (lines 9-26) embeds a literal JSX comment inside a plain block comment --
// `{/* exactly one candidate per screen */}` on its own line 18 -- and that inner `*/`
// closes the OUTER `/**` comment early, so every line after it (17-25) becomes live code and
// SWC throws "Expression expected" at that exact position. Verified live this session: a
// fresh request to this route returned Next's own 500 page with that literal stack trace,
// file and line number. Confirmed by re-reading the file's raw bytes at that line.
//
// This build's own folder is scoped to app/[locale]/dev/directions-0905-r3/search-results/c/
// only ("nobody else writes in your folder; you write nowhere else"), and the broken file
// sits one level up in a SHARED barrel every round-3 candidate (A, B and this one) imports,
// so it is not this build's file to fix. This shim reaches PAST the broken barrel straight
// to the round-2 kit it re-exports from (itself read this session and confirmed syntactically
// clean, no equivalent JSDoc/JSX collision), so this one screen can still render, measure and
// screenshot while that shared bug stands. See the closing report for the exact one-line fix
// (delete or reword the inner JSX comment) that the file's owner should apply; once fixed,
// this shim becomes redundant and ViewC.tsx can import "../../_kit" again.
export * from "../../../directions-0905-r2/_kit";
