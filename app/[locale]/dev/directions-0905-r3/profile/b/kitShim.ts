// exists-check: net-new vs the guard's suggested matches (a payment-system roadmap doc, an
// Airbnb profile/payments reference, two PDP review-filter direction files, and a locale-allow
// SQL migration) because none of them is a kit re-export barrel; this file exists only to work
// around a build-breaking bug in the shared round-3 kit barrel, see below.
//
// LOCAL WORKAROUND, not a second kit, and not a permanent file. The shared round-3 kit barrel
// (app/[locale]/dev/directions-0905-r3/_kit/index.ts) currently fails to compile: its own header
// JSDoc contains a worked JSX example, `<KitProvider system="a" | "b" | "c">   {/* exactly one
// candidate per screen */}`, and the `*/` inside that embedded `{/* ... */}` closes the OUTER
// `/** ... */` block comment early (block comments do not nest in JS/TS), turning the remaining
// doc lines into top-level code. Confirmed live, not guessed: /en/dev/directions-0905-r3/
// confirmation/b and /en/dev/directions-0905-r3/payment-step/b, two sibling screens that import
// the exact same barrel, both return 500 with the identical SWC "Expression expected" error at
// that file's line 18. This is a pre-existing bug in shared infrastructure, not introduced by
// this builder, and this builder's own brief hard-bans writing outside its one named folder
// (app/[locale]/dev/directions-0905-r3/profile/b/), so the shared barrel is not edited here.
//
// This file is the exact same one-line re-export the broken barrel already declares
// (`export * from "../../directions-0905-r2/_kit"`, one path segment shallower since this file
// sits one directory deeper), so nothing about the round-3 kit surface is duplicated or
// reimplemented, only re-exposed from this screen's own folder so it can render while the shared
// barrel is broken. ./page.tsx and ./ProfileBView.tsx import from here instead of "../../_kit"
// until the upstream file is fixed; once it is, both should switch back and this file should be
// deleted.
export * from "../../../directions-0905-r2/_kit";
