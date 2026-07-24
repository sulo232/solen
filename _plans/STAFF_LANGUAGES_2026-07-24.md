# Staff languages + map checks (owner 2026-07-24, ref Fresha IMG_6695/6696)

## EXISTS-CHECK RESULT (rule 12): languages backend ALREADY EXISTS - extend, do not rebuild.
- DB: staff_members.languages text[] + GIN index (migration 20260327_add_languages_to_staff.sql)
- Types: lib/types.ts:164, database.types.ts, _shared.ts:29 (StaffMember.languages?: string[]|null)

## Atomic
- [ ] #1 map style -> design system EVERYWHERE (LOCKFILE 0.13 already updated; verify + confirm all 3 maps use SOLEN_BASEMAP_CONFIG)
- [ ] #2 map scalability check (report)
- [ ] #3 map backend + security check / S1 (report)
- [ ] #4 SalonTeam.tsx: REMOVE specialties[0] subtitle (reverses V3-D234)
- [ ] #5 SalonTeam.tsx: SHOW languages formatted "EN / JP / DE" (Fresha style)
- [ ] #6a verify /api/salons/[slug] + barber route SELECT staff_members.languages
- [ ] #6b admin dashboard/staff/page.tsx: ADD a languages selector (chips) next to specialties
- [ ] #6c admin: include languages in the save payload + the upsert RPC
- [ ] booking staff-picker (booking/page.tsx) also shows languages under name (Fresha ref IMG_6696)

Status: ACTIVE

## PARKED (owner 2026-07-24): review the DAILY customer-nudge crons
Owner did not realise all these run daily and wants to review cadence later (do NOT change now):
rebooking-nudge (11:00), welcome-series (10:00), nail-infill-reminders (10:00), barber-smart-reminders (08:00, time-sensitive), birthday-messages (09:00), review-prompt (hourly). Schedules in .github/workflows/cron-jobs.yml.
DONE this turn: transit lookup cadence daily->weekly (nearest-stop cache 7d + Directions revalidate 7d).
