# DashboardUI — operator-console primitives

**File:** `app/[locale]/_components/dashboard/DashboardUI.tsx`
**Provenance:** V3-D346 (2026-05-29) — dashboard B&W redesign, Phase 2. First registry-compliant primitives for the operator console (the 41 `/dashboard` routes previously ran entirely on un-registered `components-legacy/dashboard/*`).

## Purpose

The five reusable building blocks every dashboard route recomposes. Built fresh against the LOCKFILE B&W system to replace the retired-token (`s-coral`/`s-amber`) legacy widgets. Universal — no category branches (V3-D205).

## Components + Layer + API

| Component | Layer | API | Use for |
|---|---|---|---|
| **DashPanel** | 1 (chrome) | `<DashPanel title? actionLabel? actionHref? className?>{children}</DashPanel>`. White `rounded-2xl` + hairline. Optional header (Section-H2 title + "→" action link). | Any titled content card: today-list, activity, tables, settings sections. |
| **DashStatCard** | 1 (chrome) | `<DashStatCard label value prefix? suffix? delta?>`. `delta: {label, direction: "up"\|"down"\|"flat"}`. Big ink value + semantic delta (up=success, down=error, flat=ink-3). | KPI strips: overview, analytics, earnings, revenue. |
| **DashStatusPill** | 3 (semantic UI) | `<DashStatusPill tone>{label}</DashStatusPill>`. `tone: "success"\|"warning"\|"error"\|"neutral"`. Pale `.bg` + **saturated semantic TEXT** + dot (V3-D347 vibrant skin — never ink text on a colored pill). Warning uses `s-warning.text` for contrast. | Booking/order/verification state across tables, calendar, lists. |
| **DashRow** | 1 (chrome) | `<DashRow href? className?>{children}</DashRow>`. Hairline-divided row, hover fill when `href`. Compose children freely. | List/table rows: bookings, clients, staff, services. |
| **DashQuickAction** | 1 (chrome) | `<DashQuickAction icon title subtitle? href>`. Icon chip (lucide) + title + subtitle, hover fill. | Action shortcut grids. |
| **DashButton** | 2 (accent) | `<DashButton variant? size? icon? href? onClick? disabled?>`. `variant: primary (accent-blue #276EF1) \| secondary (outline) \| ghost`. `rounded-btn`. | Dashboard primary/secondary actions. Primary uses accent-blue per §12 (dashboard-only — customer CTAs stay ink). |

## Visual signature

White surfaces on `bg-s-bg-sunken` page, `border-s-border` hairlines, `rounded-card-lg` (20px) cards, Inter Tight headings + Inter body (NEVER Geist). **Vibrant skin (V3-D347, LOCKFILE §12):** accent-blue `#276EF1` (`s-accent.bright`) is the PRIMARY for active nav + primary buttons; status/charts use the universal semantics at full saturation; status pills use saturated semantic TEXT (not ink). Star = `text-s-star`. Dashboard-only — the customer-facing site stays B&W.

## Do / Don't

- **Do** reuse these in every dashboard route sweep (Phase 3). **Don't** recreate per-route variants.
- **Do** use `DashStatusPill` for multi-state status (open/confirmed/pending/cancelled). **Don't** use the salon `StatusPill` here — that's binary open/closed only.
- **Don't** add category branches; parameterize via props (V3-D205).

## Related

- [[COMPONENT_REGISTRY]] — Dashboard section
- LOCKFILE §1 (tokens), §2.5 (type roles), §3 (radius/shadow), §6 (copy)
- Pattern-setter mockup: `public/solen-dashboard-redesign.html` (Variant A)
