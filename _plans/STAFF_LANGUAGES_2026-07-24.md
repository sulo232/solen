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
