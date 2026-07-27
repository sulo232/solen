// exists-check: net-new vs _rules/CODE_SAFETY.md (Rule 29 is a self-check checklist for an agent claiming "done", not a scope-boundary rule for what needs a test), _rules/SECURITY_RULES.md (documents feature-flag/rate-limit usage, not test scope), vitest.config.ts (states the WHAT in a header comment but never the boundary rule or expansion triggers)

# Testing scope (testing-release-09)

At Solen's current scale (1 developer, ~28 salons, pre-launch), this is the
ENTIRE required unit-test surface:

> Every function under `lib/bookings/**`, `lib/purchases/**`, and
> `lib/walkin/**` that moves money OR mutates booking/slot state gets a
> companion vitest file proving at least one success case and one failure
> case.

Nothing else needs a unit test today: no UI component, no route handler
wrapper, no percentage coverage target. A read-only helper (a query with no
write) or a notification-only function (an email/push send with no state
mutation) is correctly untested.

This expands ONLY when one of these fires, never on a vague "we should have
more tests" feeling:

1. A second paid engineer joins (a second author needs the safety net a lone
   developer's own care substitutes for today).
2. Transaction volume crosses roughly 50 bookings/day (the blast radius of an
   undetected regression grows past what manual QA before a deploy can catch).
3. A money-path bug ships to production that a unit test would have caught
   (the concrete, retrospective proof the boundary was drawn too narrow).

## What's covered today (2026-07-27)

`tests/lib/bookings/`: `charge-fee.test.ts`, `customer-cancel-money.test.ts`,
`dispute-engine.test.ts`, `issue-refund.test.ts`, `off-session-charge.test.ts`,
`claim-slot.test.ts`, `auto-assign.test.ts`, `authorize.test.ts`.
`tests/lib/purchases/`: `issue-purchase-refund.test.ts`.
`tests/api/stripe/`: `webhook.test.ts` (signature rejection, idempotency,
one full event-type state transition; not exhaustive over all ~14 Stripe
event types by design, see testing-release-11).

`claim-slot.ts`, `auto-assign.ts`, and `authorize.ts` were added 2026-07-27:
they don't move money directly, but they mutate slot/booking state and gate
who can act on a booking (a wrong claim double-books a slot; a wrong
auto-assign silently ignores a salon's configured daily cap; a wrong
authorize resolution is exactly what lets the wrong party issue a refund), so
they meet the "mutates booking/slot state" half of the stated bar.

## What's correctly NOT covered

`lib/bookings/`: `guest-access.ts` (crypto primitives, exercised indirectly
through `authorize.test.ts`'s guest-path cases; a dedicated
`hashToken`/`verifyAccessToken` unit test is a reasonable future addition but
not required by this rule since it's read-only/derivation logic, not a
state mutation), `notify-*.ts` (notification-only), `reference.ts`
(read/derivation-only), `refund-config.ts` (a config reader, no mutation).

Route handlers that are thin wrappers over an already-tested lib function
(e.g. `app/api/bookings/[id]/refund/route.ts` calling `issueRefund`) don't
need their own duplicate test; the lib function's test already proves the
logic, and the route's own job (auth, request parsing) is either covered by
`authorize.test.ts` or is thin enough that a build/typecheck failure would
catch a wiring break.
