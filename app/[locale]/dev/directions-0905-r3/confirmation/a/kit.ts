// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 owner-rejected
// round-2 hits from the 2026-09-06 pass (see `_design-system/REMOVED.md`), none of them a kit
// module. This file is NOT a second kit: every line below is a straight re-export, no component
// is redeclared.
//
// Why this file exists, and why it does not import through this round's own shared barrel: the
// shared round-3 kit's own `_kit/index.ts` (one folder up from this route's own tree, out of this
// screen's writable scope per the brief) carries a live syntax defect in its top JSDoc comment: a
// `{/* ... */}` JSX-comment example written INSIDE a `/** ... */` block comment. The first `*/`
// the parser meets (inside that inline example) closes the outer doc-comment early, so the prose
// after it is parsed as code and the whole module fails to build. Confirmed live this session:
// requesting this route through that barrel returned a 500 with the exact SWC error "Expression
// expected" at that file's own line 18, column matching the end of the embedded `*/}` sequence.
// This is a defect in shared infrastructure every round-3 screen imports, not something this
// screen's own files caused, and the brief for this build is explicit that this folder is the
// only one this screen writes to ("Nobody else writes in your folder; you write nowhere else").
// So: re-export the same underlying kit (the round-2 kit, which the broken barrel itself only
// re-exports unchanged, per that barrel's own README: "every export below is a re-export of the
// SAME file the round-2 kit already ships") directly, from inside this screen's own folder, and
// flag the upstream defect for a fix at its source rather than editing a file outside this scope.
// The moment that barrel's comment is fixed, this file can be deleted and the view's import
// switched back to it with no other change.

export * from "../../../directions-0905-r2/_kit";
