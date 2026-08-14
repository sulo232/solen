# Taste R3 BUILD, implement approved decisions into real code (owner 2026-07-23 "stop asking, go build")

Owner: stop asking, build the approved decisions into the real product. Real code, layered loop (coder + reviewer), surgical, commit each, verify on the running app.

## Build items (approved decisions that need real code)
_ALL FOUR BLOCKED ON: build coder a31f161eb251ee252 running (real-code layered loop); unblocks on completion then app-verify._
- [x] B1 DONE commit 0ce7d986b (NotificationBell.tsx:48 bg-s-accent->bg-s-ink-2). Q21 notification count badge -> GRAY. NotificationBell.tsx currently bg-s-accent (blue); change the count badge to a neutral gray (bg-s-ink-2 or bg-s-ink). SMALL.
- [x] B2 DONE commit 7d91a0ba1 (dashboard/bookings/page.tsx:106-110 cancel button bg-s-error). RT7 destructive-red CTA. Token s-error #DC2626 already exists (tailwind.config.js:178). Apply it as the fill of the genuinely-destructive commit button only (the cancel-appointment / SalonCancelModal primary button). Leave every other commit CTA ink. SMALL.
- [x] B3 NO-OP verified: SalonAppCta.tsx already routes to /search (correct). The risky /de/{city} pattern lives in SalonBreadcrumb.tsx and becomes dead code after B4. R10 SalonAppCta routing. SalonAppCta.tsx chips route to /de/{city} which may 404; change to a safe fallback /search?city=X until those routes exist. SMALL.
- [x] B4 DONE commit 3b9a6b5bf (layout.tsx, SalonDetailV3.tsx, behandlungen pages) + app-VERIFIED: no breadcrumb on category + salon PDP, pages render, 0 console errors. /checkout left (verified orphaned, ~0 live nav refs, breadcrumb invisible to users, moot; strip if it ever goes live) and SEO JSON-LD schema kept (invisible, not the visible trail). RT8 remove breadcrumbs. Owner rejected breadcrumbs entirely. Remove the render calls (Breadcrumb / SalonBreadcrumb) from layouts + category pages surgically; leave the component files in place (harmless) unless trivially removable. Wired in: app/[locale]/layout.tsx, salon/[slug]/layout.tsx, nails/spa/coiffeur/checkout pages, SalonDetailV3.tsx, SalonBreadcrumb.tsx, FooterGate.tsx, HideInBooking.tsx. RISK: layout breakage, verify each page still renders.

## Keep-current (NO build): RT1 gray pill, RT2 blue ceiling, RT3 blue links, RT4 no-price card, RT6 1-col list, RT12 (no badge exists). PARKED: /business (Q34/Q35), category mockup (separate).

## Premortem (carried into the coder brief)
- R1 breadcrumb removal breaks a layout that structurally depends on the slot -> remove render call only, verify page renders, do not delete layout wrappers.
- R2 wrong button gets the red (RT7) -> apply ONLY to the cancel-appointment destructive commit, never a normal CTA.
- R3 gate misfire -> the new mockup gates are scoped to .html mockups, not .tsx; should not fire on code.
- OUT OF SCOPE: /business, partner page, the category mockup.

## Verify: after build, restart Next dev, load the salon PDP / category / cancel modal / notifications, confirm no breadcrumbs, gray badge, red cancel button, no 404 on app CTAs, no console errors.
