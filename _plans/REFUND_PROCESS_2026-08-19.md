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

- [ ] A salon that ignores a case blocks it forever. There is no timeout and no auto-escalation.
      The screen says "Salon responds by {date}" and nothing enforces that date.
- [ ] "Solen typically decides within 3 business days" (`escSolenTypical`, `escFormSla`) has no
      timer, no queue age, and no alert behind it.
- [ ] "You can report up to 14 days after your appointment" (`reportWindowNote`) is RENDERED IN
      ZERO FILES. The window is never shown to a customer and never enforced on the server.
- [ ] "Salon responds by {date}" (`respondsBy`) is also RENDERED IN ZERO FILES.
- [ ] "You can escalate for {days} more days" (`escWindowOpen`) is rendered, but nothing on the
      server refuses a late escalation.

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
