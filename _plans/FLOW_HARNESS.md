# Dev Flow Harness , walkable, login-free, real-component flow preview (2026-07-08)

Owner ask (voice, 2026-07-08, after rejecting the per-finding before/after mockup): "change the whole structure of the mockup. I want each FLOW. I want to be able to, even without logins, like as a developer, have a copy of those flows (e.g. all the booking flows), click and see all the animations, go back and stuff. And test out everything on the front end, see if it works right now, over Cloudflare. Think how to make that actually happen. This is a system just for THIS session/project, NOT global."

## What this is (and is not)
- **A project-local dev harness inside the Solen app** at `/[locale]/dev/flows`. Lives in the repo, dev-only (`notFound()` in prod). NOTHING goes in `~/.claude` (owner: "not global").
- It **drives the REAL routes/components**, not static copies. So the animations, the back button, the interactions are the real app, and walking a flow IS a test of whether it works right now. (Static copies were the rejected model, and they rot.)
- **No login required**: reuse the existing `app/api/dev/login/route.ts` bypass (mints the seed test-owner session; the code already handles the cloudflared/tunnel host). Flows that are guest-first (booking, per PSYCHOLOGY law 4) need no session at all; flows behind auth get entered via `/api/dev/login?to=<flow url>`.
- **Reachable over the cloudflare tunnel** on phone (same tunnel doctrine, global rule 0.5).

## Why this supersedes the mockup approach
The 2026-07-08 audit (271 findings) still stands as the findings list. But the DELIVERY of fixes is no longer per-finding before/after panels (rejected). Instead: the harness lets the owner walk every real flow and judge/verify it live. Fixes then land in the real components (layered loop) and are immediately visible in the harness because it IS the real app.

## Atomic asks
- [x] A. Scrap the audit-fix before/after mockup (`/dev/audit-fixes` deleted + REMOVED.md line 2026-07-08).
- [x] B. Project-local (NOT global) dev flow harness at `/[locale]/dev/flows` (2026-07-08, hub + layout built).
- [x] C. Organized BY FLOW: all 12 flows listed on the hub (booking wired, 11 others as visibly-disabled "coming" cards).
- [x] D. Booking enters guest-first with no manual login (verified logged-out 200, no /auth redirect); the dev-login bypass path is documented on the hub for flows that will need it later.
- [x] E. Booking walks real screens / real animations / working back nav (the real BookingWizard, untouched).
- [x] F. Drives the REAL frontend (real page.tsx + BookingWizard + real slug muse-beauty-studio), so it doubles as a live "does it work now" test.
- [~] G. Reachable over the cloudflare tunnel (phone) , BLOCKED by the environment, not the harness. Verified live 2026-07-09: hub 200 (all 12 flows, no error boundary) + booking guest-entry 200 (no /auth redirect) on a fresh server (:3012). Tunnel registered at CF edge zrh02, but the `next dev` background process is REAPED between tool calls in this session (origin went 200 -> 000 across two commands), so cloudflared 530s (origin gone). Same background-reap behavior that killed the audit workflow earlier. A persistent tunnel must be run from a real terminal (the owner's machine), where the server does not get reaped. Concrete owner path: `npm run dev` then `cloudflared tunnel --url http://localhost:3000`.
- [x] H. REFERENCE FIRST: hub + booking wired + committed (`cf2b26cfd`) + verified live 2026-07-09. Awaiting owner eyeball of the booking pattern before wiring the other 11 flows.

## Build notes / architecture
- Hub `/[locale]/dev/flows/page.tsx`: cards grouped by flow. Each wired card = a deep link into the real route at step 1 with a real seeded entity; through `/api/dev/login?to=` when a session is needed.
- Real test salon slug: discovered live from `/api/salons` (never fabricated).
- A dev-only "flow bar" ("All flows" / "Restart") shown ONLY under `/dev/flows/*`, never touching the global layout.
- The Stripe pay step is the one boundary: the harness lands you ON the pay step (real UI) but does not complete a live charge. Test-mode wiring is a later decision.

## Status
- 2026-07-08: pivot recorded, rejected mockup scrapped. Building hub + booking reference via the layered loop.
- 2026-07-08: reference build shipped by the coder. `app/[locale]/dev/flows/{page.tsx,layout.tsx}` +
  `_components/FlowBar.tsx`. Booking wired: real slug `muse-beauty-studio` (15 services, 3 staff,
  verified live), direct guest entry (`/de/salon/muse-beauty-studio/booking` returns 200 logged out,
  no `/auth` redirect), lands on the real PayConfirmStep without submitting a charge. Other 11 flows
  render as `ComingSoon`-wrapped disabled cards (opacity-50, cursor-not-allowed, toast on tap, never
  a live link). `npx tsc --noEmit`: no new errors (only the 2 pre-existing ones). Awaiting reviewer
  pass, then owner sign-off before wiring the rest.
