# Motion probe report , WCAG 2.2.2 (Pause, Stop, Hide, Level A) , mode: SLOW (network-delayed)

Generated: 2026-07-25T21:03:44.260Z
Base URL: http://localhost:3000  Budget: 5000ms  Watch window: 7500ms  Viewport: 390x844  Mode: SLOW (network-delayed)

Runtime probe, not a source scan (see file header for why). Criterion: moving/blinking
information that starts automatically, lasts past 5s, and runs alongside other content
needs a user-facing pause/stop/hide mechanism. prefers-reduced-motion does NOT discharge it.

SLOW MODE: same-origin xhr/fetch requests were delayed ~9000ms (context.route + route.continue) so any loop that runs while data is still loading is measured as the exposure it actually is on a slow connection, not downgraded to LIVE-DOM-CONDITIONAL. This is NOT comparable to a normal (settled-state) run - see _probe-report.md for that baseline.

Totals: CSS-LOOP=0  LIVE-DOM=0  LIVE-DOM-CONDITIONAL=0 (report-only)  1 route(s)

---
## /de/salon/old-town-barbers [mode: SLOW]

SLOW MODE: 11 same-origin xhr/fetch request(s) delayed ~9000ms. A fetch still open at the 5000ms budget is reported below as blocking LIVE-DOM, not LIVE-DOM-CONDITIONAL - see the --slow doc block at the top of this file.

### CSS-LOOP (0)

none found

### LIVE-DOM (0)

none found

### LIVE-DOM-CONDITIONAL (0, report-only, route still fetching at the 5000ms budget)

none found

input: lastInputAt=2378ms (0 unless the cookie-consent click fired; the probe does not otherwise interact)

