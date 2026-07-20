<!-- batch: settings-insta + delete-confirm + dashboard redesign + the GRAY-BACKGROUND reopen (owner 2026-07-20) -->
# Settings like Insta + kill type-to-confirm + dashboard redesign + the gray-background reopen

Owner 2026-07-20: "for settings yk profile sh i want more like insta; the delete sh no stop w the typing sh;
dashboard looks ass; the calendar i dont see any difference; overall i dont like ths background gray sh
everywhere, and it is everywhere outside these mockups too."

- [x] CORRECTION (owner repeat 2026-07-20): SETTINGS more like INSTA , DELIVERED: Instagram reference captured (Mobbin screen f08baa0d, "Settings and activity" row anatomy), sweep-settings-insta built as a v2 live mockup (form wall -> plain nav rows, real German labels, live language value, white-first), verified rendered (7 rows, wall hidden) + in the gallery. NEXT once approved: build the real sub-page structure in code.
- [ ] DELETE type-to-confirm: REMOVE the "type KONTO LÖSCHEN to confirm" step (owner order). Replace with a plain confirm (button + one confirm dialog). -> FIX phase, owner-decided.
- [ ] DASHBOARD redesign: "looks ass" , run solen-taste-diagnosis on the rendered dashboard home (measured walk), then propose directions. Note the stranded Aurora V2 skin branch (bold-hellman) as a possible direction , surface, don't silently adopt.
- [ ] CALENDAR mockup honesty: on MOBILE the dead-token accents barely render (the 203 are desktop-grid). Either point the After at the desktop grid or drop the mockup and just FIX the dead token in code (already an approved mechanical fix).
- [ ] GRAY-BACKGROUND REOPEN (the big one): owner dislikes the sunken-gray wash product-wide. (a) INVENTORY: measure where bg-s-bg-sunken/#F4F4F5 renders as BACKGROUND WASH (page bgs, input fills, section fills, tiles) vs where gray is a SELECTED state (locked separately , do not conflate). (b) Build a v2 live probe: /de/profile/settings with gray backgrounds stripped to white + hairline borders (white-first). (c) If the owner confirms on the probe -> a design-system decision (LOCKFILE surface row reopened BY THE OWNER) + a sweep plan. Do NOT sweep before the probe is approved.
- [x] AVATAR UPLOAD DELIVERED (owner 2026-07-20):
  - [x] investigated: 5 existing upload endpoints found; client-photos bucket has a documented public-URL bug -> new PUBLIC `avatars` bucket instead (service-photos family), migration backfilled.
  - [x] Avatar-URL input REPLACED: round preview + "Foto ändern" picker + client downscale -> POST /api/profile/avatar -> profiles.avatar_url. Live-tested (upload 200, public URL 200, avatar renders); looked at rendered.
  - [x] cap: 100MB app-side per the owner; PLATFORM ceiling is 50MB (Supabase plan rejected 100MB) , flagged, harmless since the client downscales before upload.
- [x] CORRECTION DELIVERED (owner 2026-07-20 "make settings and profile-edit DIFFERENT , like the Insta profile page"):
  - [x] /profile/edit ("Profil bearbeiten"): Profilfoto upload + Name + Bio , rendered-verified (screenshot).
  - [x] settings/personal = E-Mail + Telefon ONLY (verified: no Foto/Bio/Name; hub sub-line updated in 4 locales).
  - [x] /de/profile "Profil bearbeiten" row -> /profile/edit (verified: 73px row, existing row grammar).
  - [x] Header title "Profil bearbeiten". Committed bebb6f099.
- [x] REGISTERED this batch + ACTIVE row (survives compaction).
