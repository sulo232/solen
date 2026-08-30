# REFUND PROCESS: does it exist, who decides, is it legal (2026-08-19)

Owner, verbatim: *"Is there even a refund process, and how does it even proceed? Who is gonna
decide it? those stuff. That's what you need to flag, not this dumb fucking shit. And, also, with
the tax and fix if it's legal or not, you're the one that needs to build those shit, bro. Fix those
stuff as a loop."*

He is right that translating the words on those screens was the wrong thing to lead with. What
follows was measured, not recalled, and every table check was run only after a control on a table I
know exists (`bookings`, `profiles`, `salons`). My first reader returned "not present" for ALL of
them including the controls, so that reading was thrown away.

## WHAT EXISTS, and more of it than I expected

- **The flow is real end to end.** Customer files a case (`app/api/bookings/[id]/dispute`), salon
  sees it (`app/api/dashboard/disputes`), admin acts
  (`app/api/admin/booking-disputes/[id]/action`).
- **The tables are live**, not just in migration files: `booking_disputes` (3 rows) and
  `case_events` (7 rows), snapshot captured 2026-08-14.
- **Money actually moves**, through one chokepoint, `lib/bookings/issue-refund.ts`. It sets
  `reverse_transfer` so the money is clawed back from the salon's transferred funds, and
  `refund_application_fee` so Solen's commission goes back too.
- **The decision path is: salon first, then Solen.** Admin actions available: dismiss,
  resolve_with_note, escalate, refund, admin_approve, admin_reject, warn_customer, warn_salon.
- **VAT IS handled**, which I did not expect. `lib/bookings/notify-refund.ts` does a Swiss VAT
  credit-note split of the refunded slice, only when the salon is VAT-registered and the booking
  actually carried VAT at payment.
- **Nothing auto-approves, by design.** `lib/bookings/dispute-engine.ts` says eligibility and
  fast-track are reviewer HINTS only and no transition reads them to act.

## WHAT IS MISSING, and this is the answer to his question

**Every deadline the screens promise is printed and never kept.** No cron touches
`booking_disputes` for timing (checked all 28), and there is no business-day arithmetic anywhere in
`app/` or `lib/`.

- [x] A salon that ignores a case blocks it forever. FIXED 2026-08-20: `app/api/cron/dispute-timeout`
      (new, GET, CRON_SECRET-gated, wired to the daily-03-utc nightly-maintenance job in
      `.github/workflows/cron-jobs.yml`) escalates a refund-direction case still sitting in
      `open`/`salon_reviewing` past `SALON_RESPONSE_WINDOW_HOURS` (48h, `dispute-engine.ts`, the
      same constant the "Salon responds by {date}" copy now computes from) via a new shared
      `escalateCase()` transition (same status write + `mediation_started_at`/`mediation_deadline_at`
      columns the admin "escalate" action already used, plus a `case_events` row so the customer's
      timeline shows it happened, actor_role='system', new `tlEscalatedAuto` copy so it never reads
      "by you"). Never refunds or approves anything, review-first line 13 holds; a human still
      decides via the now-escalated case. Idempotent: CAS-guarded, verified with a mocked-DB test
      (double-call does not double-escalate, a case that moved off-status is skipped). Does NOT
      close the box at line 39 below (Solen's own post-escalation 3-business-day SLA still has no
      timer); that is a separate, unbuilt item.
- [x] "Solen typically decides within 3 business days" now has something behind it.
      **The queue sort turned out to be ALREADY FIXED**, and finding out why matters more than the
      fix: it landed inside commit 0ba01b740, whose message says "NO DECORATION is now law". That
      commit swept up an entire background workflow's output with `git add -A`, 17 files and 591
      insertions, under a message about a rule. So the work existed and the history hid it. The
      agent sent to build it found the contradiction and correctly built nothing.
      verified live, not read off the code: the endpoint's real ordering call run against the
      actual table returned 2026-05-28, 2026-05-29, 2026-05-30, strictly oldest first, and the
      opposite branch (resolved views) correctly returned descending.
      What WAS missing and is now added: the waiting time per open case on
      `app/[locale]/dashboard/refunds/page.tsx`, so the person who has to keep the 3 day promise can
      see which case is closest to breaking it. No new copy key: it reuses the existing
      `dashboard.timeJustNow / timeMinAgo / timeHoursAgo / timeDaysAgo` already used by the same
      tiered pattern in two other dashboard components. Parity stayed at 5,853 keys, which is the
      proof nothing new was added. Plain text, no badge and no colour, because that is a look
      decision and it is his.
      The sweep that hid this is now guarded: ~/.claude fd3666c.
- [x] "You can report up to 14 days after your appointment" (`reportWindowNote`) is RENDERED IN
      ZERO FILES. CORRECTED 2026-08-20: the "never enforced on the server" half of this line was
      already stale before this pass started. `app/api/bookings/[id]/report/route.ts` POST already
      rejects a case filed more than 14 days after `starts_at` with 400 `REPORTING_WINDOW_CLOSED`,
      shipped 2026-07-27 (commit 584fc3f7c, `REPORTING_WINDOW_DAYS = 14`, ToS section 13.1a). Not
      re-built here, verified: live POST against a real 78-day-old paid booking (5e2650c6, logged in
      as its real owner) returns the 400, and zero rows landed in `booking_disputes` afterward
      (SQL count = 0). The boundary formula was re-derived line-for-line from the file and asserted
      at +-10s either side of the 14-day line (Node script, all 5 cases pass, including a future
      confirmed booking staying open). The RENDERED half was the real gap: `reportWindowNote` never
      appeared in any component. FIXED: added it to `ReportRefundEntry.tsx` (the report-entry
      screen, above the reason list) using the identical treatment already shipped 5 lines below it
      in the same file (`reviewTimelineNote`'s Info-icon note), not a new visual decision. Mockup at
      `/dev/report-window-note` (real booking data, real i18n string), rendered and screenshotted;
      applied to the real component and verified live on the real route
      `/en/bookings/[id]/report`, logged in as a real customer, screenshot confirms the note renders
      between the booking summary and "What went wrong?".
- [x] "Salon responds by {date}" (`respondsBy`) is also RENDERED IN ZERO FILES. FIXED 2026-08-20:
      added `salonRespondsByDeadline()` + `SALON_RESPONSE_WINDOW_HOURS = 48` to `dispute-engine.ts`
      (the number was already live in copy, 5 strings x 4 locales, "48 hours" / "up to 48h" / "2
      days", just never turned into a real Date anywhere; not invented here). No new column: the
      deadline is computed from `created_at`, null once the case leaves open/salon_reviewing. Wired
      into `shapeCase()` (customer GET /api/bookings/[id]/report) and `/api/dashboard/disputes`
      (salon list), both importing the SAME function, so the date and the dispute-timeout cron's
      escalation cutoff (line 40 above) read the identical constant and can never drift apart.
      Rendered: customer case screen (`RefundCaseView.tsx`, the existing `respondsBy` i18n key,
      open/salon_reviewing only) and the salon refund queue list (`dashboard/refunds/page.tsx`, new
      `respondBy` key, en/de/fr/it). Verified: `npx tsx` against the real imported function on a
      real row's created_at (2026-05-29T16:33:07Z) matches created_at+48h exactly, and returns null
      for all 9 other statuses plus a malformed date; live GET on booking 7325d90a (salon_rejected)
      returns `"salon_responds_by":null` correctly. Could NOT live-render the positive path or the
      salon-dashboard wiring: no live row is currently `open`, and `/api/dashboard/disputes` has a
      SEPARATE PRE-EXISTING BUG (confirmed via revert-and-retest, unrelated to this change: it 500s
      with `{"error":"Bad Request"}` on every filter while the identical query succeeds directly
      against PostgREST) that blocks that screen entirely, flagged separately (task_b25dba12), not
      fixed here per the off-limits/scope boundary for this item.
- [x] "You can escalate for {days} more days" is now enforced AND the screen matches it.
      verified: commit b71980a71. The server refuses a late escalation with a 400, computed from
      the SAME helper the screen calls (`escalateDaysLeft`, `components-legacy/refund/shared.ts`)
      so the two can never disagree. Boundary-driven against the real imported function: 2 days ago
      allows, 20 days ago refuses, 13d 23h 59m allows, null allows.
      **My first attempt FAILED review, for exactly the class this session is about.** I made the
      server honest and left the screen lying: at zero days the CTA still rendered and still said
      "you can still escalate today", and the error box would have shown a German customer the raw
      code ESCALATION_WINDOW_CLOSED. Both closed in one repair round. `escWindowToday` is retired
      because the reviewer's control proved it described a state that cannot exist.
      Two new keys in all four locales, each rendered in the same change: `escWindowClosedNote`,
      `toastEscalateWindowClosed`. Checked by me rather than taken from the report: both render in
      `RefundCaseView.tsx`, `escWindowToday` renders nowhere, no eszett and no dashes in the added
      German, typecheck clean, parity OK at 5,853 keys.

## THE ONE RULE ANY FIX MUST NOT BREAK

`dispute-engine.ts` line 13: **nothing auto-approves.** A timeout must ESCALATE a case to Solen for
a human decision. It must never issue a refund on its own. Building auto-refund-on-timeout would
be the single most expensive mistake available here, because it moves real money with no human.

## OUT OF SCOPE for this pass

- `lib/bookings/issue-refund.ts`, the money chokepoint. It works and it is the one place that talks
  to Stripe. Not to be touched.
- Changing any refund POLICY (who gets money back, how much). That is his call, not a build.
- The three tables the copy hints at but nothing reads: `dispute_evidence`, `booking_upcharges`,
  `refunds`. All referenced in ZERO files, so they are not silent no-ops, they are just absent, and
  absent-and-unreferenced is not a bug.
