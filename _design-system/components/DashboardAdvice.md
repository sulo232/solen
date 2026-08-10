<!-- exists-check: net-new vs _design-system/components/DashboardUI.md (that doc owns the five
     generic operator primitives; this is one composed feature panel with its own data contract
     and evidence rules, and it USES DashPanel from there rather than adding a primitive) and vs
     lib/salon-hours.ts (extended, not duplicated: the Zurich civil-time reader and the day-hours
     lookup were added there so this panel and isOpenNow read one clock). -->

# DashboardAdvicePanel

`app/[locale]/_components/dashboard/DashboardAdvice.tsx`
Composes: `DashPanel` (`DashboardUI.md`) · Computation: `lib/dashboard-advice.ts` ·
Data: `GET /api/analytics/salon/[id]?advice=1`

Owner decision 9, 2026-08-09 (verbatim *"9 a"*): the salon owner's dashboard gets a panel
that says what to do next, *"your Tuesday afternoons are empty"*, not one more number.

## What it renders

One `DashPanel` titled `dashboard.homePage.adviceTitle`, containing up to three rows and one
source note.

A row is: title (15/600 ink) + body (13, `s-ink-2`) + an ink text link with `ArrowRight`, the
same link treatment the other dashboard panels use for their header action. No icon chip, no
tone colour, no coloured left edge bar (that one is graveyarded, owner 2026-07-15).

The source note is one line, 12px `s-ink-3`, at the foot of the panel: the evidence window,
stated once so no row has to repeat it.

## The four rules, and what each needs before it may speak

All four compare the salon against ITSELF. There is no cross-salon benchmark anywhere in this
panel, because we do not have one.

| row | fires when | links to |
|---|---|---|
| `empty_slot` | an open weekday/daypart has zero kept appointments in the window | settings, off-peak tab |
| `quiet_slot` | an open slot is at or under half the salon's own per-slot average | settings, off-peak tab |
| `busy_slot` | an open slot is at or over double that average | staff |
| `cancellations` | 15% or more of the window's appointments were cancelled or missed | settings, cancellation tab |

Shared preconditions for the three slot rules: opening hours cover at least two slots, at least
20 kept appointments in the window, and a per-slot average of at least 2. A slot the salon is
CLOSED for can never appear, which is the whole reason the panel reads `salons.opening_hours`.

## When there is nothing to say

The panel never falls back to a generic tip. It renders the reason, with the real number:

- fewer than 20 kept appointments: `adviceNotEnoughTitle` / `adviceNotEnoughBody` (states the
  count it has and the count it needs)
- opening hours missing or covering fewer than two slots: `adviceNoHoursTitle` /
  `adviceNoHoursBody`, plus a link to add them
- enough history, nothing out of line: `adviceNothingTitle` / `adviceNothingBody`

## Don't

- Do not add a rule that needs data we do not hold (industry averages, "salons like yours",
  projected revenue). No-fabrication binds this panel harder than any other dashboard surface,
  because advice is read as a claim about what will happen next.
- Do not widen the window to make a rule fire. The window is whole weeks so every weekday gets
  the same number of samples; an uneven window biases the quietest-slot answer.
- Do not read `new Date(starts_at).getDay()` or `.getHours()` anywhere in this path. The server
  runs in UTC and the salon does not; use `zurichCivil()` from `lib/salon-hours.ts`.
