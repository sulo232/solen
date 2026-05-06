# Type System Audit — `lib/types.ts`

**Date**: 2026-03-22
**Scope**: 974 lines, 94 exported types (11 enums, 18 core, 12 discovery, 14 megabuild, 10 nail, 8 barber, composite + API response types)
**Imports**: 67 files across `app/`, `components/`, `lib/`

---

## Section A: Missing Locale Fields (i18n Drift)

The project supports 4 locales (`de`, `en`, `fr`, `it`) but several core types only define 2.

| # | Issue | Type | Line | Severity | Fix |
|---|---|---|---|---|---|
| 1 | `locale` union missing `"it"` — Italian users fail type safety | `Profile` | :59 | 🔴 | Add `"it"` to union |
| 2 | Missing `description_fr`, `description_it` | `Salon` | :82-83 | 🔴 | Add 2 fields |
| 3 | Missing `name_fr`, `name_it`, `description_fr`, `description_it` | `Service` | :130-136 | 🔴 | Add 4 fields |
| 4 | Missing `label_fr`, `label_it` | `NailDynamicPricingRule` | :858-859 | 🟡 | Add 2 fields |
| 5 | Missing `salon_script_fr`, `salon_script_it` | `AIVisionResult` | :550-551 | 🟡 | Add 2 fields |

**Root cause**: Core types were built for de/en only. When fr/it were added globally (i18n.ts, messages/), the types weren't backported. Discovery types (newer) correctly have all 4 locales.

---

## Section B: Type Assertion Debt

57 `as unknown as` / `as any` assertions across 34 API route files in `app/api/`. These are symptoms of type-schema drift — Supabase queries return columns the TypeScript types don't define.

| # | File | Count | Reason |
|---|---|---|---|
| 1 | `app/api/stripe/webhook/route.ts` | 6 | Booking relations not typed |
| 2 | `app/api/cron/rebooking-nudge/route.ts` | 4 | Booking + salon join not typed |
| 3 | `app/api/bookings/[id]/dispute/route.ts` | 3 | Dispute relations not typed |
| 4 | `app/api/loyalty/redeem/route.ts` | 3 | Card + program join not typed |
| 5 | `app/api/conversations/[id]/messages/route.ts` | 3 | Message relations not typed |
| 6 | `app/api/bookings/[id]/confirm/route.ts` | 3 | Booking relations not typed |
| 7 | 28 other API routes | 1-2 each | Various join/relation casts |

**Note**: These assertions are NOT the primary fix target. Fixing Section A (locale fields) eliminates some; the rest require typed Supabase join helpers — a separate effort.

---

## Section C: Structural Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | `Salon` missing `group_id` field (FK → `salon_groups`, per CLAUDE.md schema) | 🟡 | Add `group_id?: string \| null` |
| 2 | `Salon` missing `solen_score`, `solen_tier`, `score_details` (per CLAUDE.md schema) | 🟡 | Add 3 fields |
| 3 | `SalonClosure` has `start_date`/`end_date` but DB table `salon_closures` has single `date` column | 🟡 | Verify DB schema, align type |
| 4 | `StaffBreak` has `salon_id` and `specific_date` not listed in DB schema `staff_breaks` table | 🟢 | May be runtime extensions — verify |
| 5 | `BarberLoyaltyHistory` doesn't match DB `barber_loyalty_history` columns (`stamped_by` → `stamps_collected`) | 🟡 | Align with actual DB |

---

## Section D: No Issues Found

| Check | Result |
|---|---|
| Duplicate types (local + lib/types.ts) | None found |
| Unused exported types | All 94 types have at least 1 import |
| Missing type exports referenced by importers | None — all imports resolve |
| Naming convention (interface = PascalCase, type = PascalCase) | Consistent |
| Field naming (snake_case matching DB columns) | Consistent |

---

## Fix Plan

**Phase 1 — Locale completeness (🔴 CRITICAL, this session)**:
1. `Profile.locale`: add `"it"`
2. `Salon`: add `description_fr`, `description_it`
3. `Service`: add `name_fr`, `name_it`, `description_fr`, `description_it`
4. `NailDynamicPricingRule`: add `label_fr`, `label_it`
5. `AIVisionResult`: add `salon_script_fr`, `salon_script_it`

**Phase 2 — Schema alignment (🟡 MEDIUM, separate session)**:
- Add `group_id`, `solen_score`, `solen_tier`, `score_details` to `Salon`
- Verify `SalonClosure` and `BarberLoyaltyHistory` against live DB
- Audit 57 type assertions for removability

**Phase 3 — Type assertion cleanup (🟢 LOW, follow-up)**:
- Create typed Supabase join helpers
- Remove unnecessary `as any` casts
