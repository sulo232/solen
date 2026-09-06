// exists-check: `npm run exists payment-step/c` (run this session) returned 0 matches. This is
// not a second kit: it is a LOCAL re-export shim, inside this builder's own folder only, working
// around a live syntax error in the shared round-3 barrel this file would otherwise import from
// (that barrel's own JSDoc comment embeds a literal `{/* ... */}` JSX comment, which closes the
// outer `/** */` block comment early and breaks every screen that imports it, confirmed live:
// GET /en/dev/directions-0905-r3/payment-step/c returned 500, ModuleBuildError, "Expression
// expected" at that file's line 18). That file is shared infrastructure this task does not name
// and this builder does not edit it (task brief: "Nobody else writes in your folder; you write
// nowhere else"). This shim re-exports the exact same underlying module the broken barrel itself
// points to, so nothing here is a second Card/Pill/StatusBadge, only a working import path for
// this one screen until the shared barrel is fixed centrally.
export * from "@/app/[locale]/dev/directions-0905-r2/_kit";
