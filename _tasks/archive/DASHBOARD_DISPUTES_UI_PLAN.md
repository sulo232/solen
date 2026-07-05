# Dashboard Refunds/Disputes UI — Plan + Structure + Handoff (2026-06-01)

> PLAN-ONLY this session (owner: "plan + mockup now, build later"). The build happens in worktree `claude/nice-hugle-c0b706`. This doc is the handoff ("dropper") for that worktree.

## 🔒 LOCKED visual spec (2026-06-01) — build to this exactly

Owner locked the 3 mockups below after a full color-iteration pass. Build to them; do not re-litigate the palette.

**Mockups (in `public/`):**
- `solen-dashboard-disputes-aligned.html` — salon refund-review queue + case detail (timeline + action bar)
- `solen-dashboard-admin-cases.html` — admin unified case queue (search-by-code + Erstattung/Mehrbelastung toggle + cross-salon cards + escalated detail)
- `solen-dashboard-upcharge.html` — salon upcharge request + sent-requests list

**Locked treatment:**
- **Pills = the real `DashStatusPill` pale pattern** (pale bg + saturated text + dot). NO global saturation change — owner reviewed pale vs stronger vs solid and kept pale. Do NOT alter `DashStatusPill`.
- **ESKALIERT = `s-pop` vermilion `#C03001` on `#FFF1E6`** (the urgency-badge color), with a **pulsing dot**. (NOT the muddy `#9A3412/#F8E7DE` an earlier draft used.)
- **Timeline:** hollow light-grey "done" dots (`#BBB8B5` ring) + blue accent "now" dot; the now-dot **pulses**.
- **Pulse = the walk-in live indicator, verbatim:** `animation: ping 2.6s cubic-bezier(0,0,.2,1) infinite` (source: `components-legacy/salon/SalonWalkInPanel.tsx`). Applied to the timeline "now" dot + the ESKALIERT dot. `prefers-reduced-motion` disables it.
- **Amount chips (Option B):** refund/disputed amount in a pale-blue chip (`s-accent.pale` + hairline accent border, amount in `s-accent` blue); paid amount in a grey (`s-bg-sunken`) chip.
- **Buttons (dashboard vibrant skin):** primary = `bg-s-accent-bright` blue (`DashButton`), secondary = `bg-white border-s-border`, destructive = red outline, tertiary = ghost. NOT ink.
- **Active tab/filter:** white bg + accent text + accent border (selected = accent, not ink).
- **Search bar (admin) is NOT decorative — must be wired.** In the mockup it's a static `<input>` (no handler). For the build: on submit/debounce, `fetch('/api/admin/booking-disputes?code=' + encodeURIComponent(value.trim()))` and render the returned `disputes[]`. The endpoint already does the work (admin-gated, `trim().toUpperCase()`, exact `reference_code` lookup on `bookings`, scopes cases to that booking) and is committed (`b455c7c3f`) — only the client wiring is missing. The existing `BookingDisputePanel.tsx` calls the list endpoint but never passes `?code=`, so the search path currently has zero UI driving it.

## Goal
Bring the refund/dispute review design the owner liked (from the standalone mockups) INTO the existing operator dashboard, fitting its shell + patterns and extending the existing disputes surface. It is NOT a standalone page, and per the owner it does NOT merge with the price-dispute route (they coexist).

## Owner intent (gist)
"I like the refund/review design but it did not align with the dashboard I already had. Keep that structure but put it inside the dashboard." Plus a handoff so the nice-hugle worktree (where dashboard work happens) knows what to build.

## Existing dashboard structure (MATCH THIS)
- Shell: `components-legacy/dashboard/DashboardLayout.tsx`. A 64px fixed left icon rail (white, `border-r border-s-border`, "S" logo top, `RAIL_NAV` icon items, active item = `bg-s-accent-bright text-white`, profile avatar bottom). Mobile = drawer nav. Content area = `flex-1 p-6 space-y-6` on `bg-s-bg-sunken`.
- Page composition: wrap in `<DashboardLayout>`; inner `<div className="max-w-4xl mx-auto">` (or a grid); header row `flex items-center gap-3 mb-6` with a lucide icon + `<h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">Title</h1>`.
- Cards: `rounded-2xl border border-s-border bg-white p-5` (disputes route) or `rounded-[12px] border border-s-ink/5 bg-white p-5 shadow-warm-md` (earnings). White cards on the sunken bg.
- Status pills: `px-2 py-1 rounded-pill text-xs font-medium` with semantic bg/text (`bg-s-success-bg text-s-success`, `bg-s-amber-subtle text-s-amber-text`, `bg-s-blue-subtle text-s-blue-text`, `bg-s-bg-sunken text-s-ink/50`).
- **Buttons (dashboard vibrant skin, NOT the marketing ink rule):** primary = **accent blue `bg-s-accent-bright` #276EF1** (the canonical `DashButton` primary), secondary = `bg-white border-s-border`, destructive = red outline (`text-s-closed` + border). The dashboard is EXEMPT from the V3-D192 ink-CTA lock (CONTROL_ELEVATION line 93: "Dashboard is EXEMPT, it has its own vibrant skin, LOCKFILE §12"). NOTE: the existing `disputes/page.tsx` uses inline `bg-s-ink` buttons, which is a DEVIATION; build with the blue `DashButton` and ideally realign that page. Amounts use `data-text` / tabular nums.
- Tokens (V3-D421): ink #0A0A0A, ink-2 #6B6B6B, border #E7E5E4, bg-sunken #F5F5F4, accent #276EF1, success #16A34A (.bg #E8F5E9), warning #F1AE27, closed/error #DC2626. Fonts Inter Tight (headings) + Inter (body). No em-dashes in copy.
- Existing surfaces to extend / coexist with: the `disputes` route (`app/[locale]/dashboard/disputes/page.tsx` = Preisstreitigkeiten = salon price-increase/upcharge) and `components-legacy/admin/BookingDisputePanel.tsx` (admin dispute resolution: customer-vs-salon, refund/escalate/warn, status pills).

## What `main` already built (the backend the UI wires to — committed b455c7c3f)
- `GET /api/dashboard/disputes` — salon-scoped refund-review queue (open cases for the owner's salon).
- `GET /api/admin/booking-disputes?code=` — admin search by order code + filters; `GET .../[id]` — case detail + `case_events` timeline; `POST .../[id]/action` — approve / reject / refund (routes through the one chokepoint `lib/bookings/issue-refund.ts`), admin_approved / admin_rejected.
- Data: `booking_disputes` (extended: `direction` refund|upcharge, `reason_code`, `requested_amount`/`resolved_amount` Rappen, `eligibility`, the review-first status machine, guest cols, `escalated`) + `case_events` (the timeline). Migrations applied to the live DB.
- The CUSTOMER side (report/refund entry, status, escalate, upcharge approve) is already built as real FE. The SALON + ADMIN dashboard UI is the gap this plan fills.

## The plan (build later, in nice-hugle)
1. **Salon refund-review queue** — a dashboard page (add `dashboard/refunds`, or extend `dashboard/disputes` with a Refunds tab) using `<DashboardLayout>` + the card/header/pill patterns. Lists cases from `/api/dashboard/disputes`; each card shows customer / reason / amount / status; expand to the case detail + `case_events` timeline + an action bar (approve full or partial -> `issueRefund`; reject + reason). Salon-owner gated.
2. **Admin unified case queue** — extend `BookingDisputePanel` (or a new admin page) for the new `booking_disputes` cases: search by order code, the `case_events` timeline, admin final-decision actions (admin_approved / admin_rejected / force refund).
3. **Coexist** with the existing `Preisstreitigkeiten` (price-dispute) route. Do NOT merge them this pass (owner call).
4. Use the aligned mockup (below) as the visual spec.

## Aligned mockup
`public/solen-dashboard-disputes-aligned.html` — the salon refund-review queue + a case detail with the `case_events` timeline, rendered INSIDE the dashboard shell (64px rail + content area), using the dashboard's card / header / pill patterns and the liked refund-review content design. This replaces the standalone full-page mockups for the dashboard surfaces.

## Execution
- This session: plan + structure (this doc) + the aligned mockup. No build.
- Later, in `claude/nice-hugle-c0b706`: build the salon + admin UI per this plan + mockup. Recommended shape (same as the refund backend): plan -> sequenced single-writer multi-agent build -> adversarial review + audit. Wire to the live endpoints above; design-system tokens only; tsc + screenshot + gemini verify.

## Handoff ("dropper") for nice-hugle
This doc + the mockup are dropped into the `claude/nice-hugle-c0b706` worktree (`_tasks/` + `public/`) so it has them physically, no merge needed to read them. IMPORTANT: the backend the UI calls lives on `main` (commit b455c7c3f) and the `booking_disputes` / `case_events` schema is applied to the live DB. Before building, nice-hugle should rebase/merge `main` (or cherry-pick the booking_disputes migration + the dispute/admin endpoints), otherwise the endpoints + types it wires to will not exist on its branch.
