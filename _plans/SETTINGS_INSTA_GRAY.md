<!-- batch: settings-insta + delete-confirm + dashboard redesign + the GRAY-BACKGROUND reopen (owner 2026-07-20) -->
# Settings like Insta + kill type-to-confirm + dashboard redesign + the gray-background reopen

Owner 2026-07-20: "for settings yk profile sh i want more like insta; the delete sh no stop w the typing sh;
dashboard looks ass; the calendar i dont see any difference; overall i dont like ths background gray sh
everywhere, and it is everywhere outside these mockups too."

- [x] CORRECTION (owner repeat 2026-07-20): SETTINGS more like INSTA , DELIVERED: Instagram reference captured (Mobbin screen f08baa0d, "Settings and activity" row anatomy), sweep-settings-insta built as a v2 live mockup (form wall -> plain nav rows, real German labels, live language value, white-first), verified rendered (7 rows, wall hidden) + in the gallery. NEXT once approved: build the real sub-page structure in code.
- [x] DELETE type-to-confirm: REMOVE the "type KONTO LÖSCHEN to confirm" step (owner order). Replace with a plain confirm (button + one confirm dialog). -> FIX phase, owner-decided.
  - [x] the type-to-confirm step is GONE from the code, verified 2026-08-19: `grep -rn "KONTO LÖSCHEN"` over app/components/lib returns nothing.
  - [x] what replaced it is exactly what the item asked for: `SettingsForm.tsx:546` is one red outline button, and `DeleteConfirmModal` (`SettingsForm.tsx:596`) renders a warning paragraph plus Cancel and Delete. It has no text input of any kind, so nothing is typed to confirm.
  - WHY it is missing: deliberately removed on the owner's order, same day he gave it. `git log -S "KONTO LÖSCHEN"` names 72ea7d061 (2026-07-20, "Instagram-style settings hub ... delete loses type-to-confirm"), and `git merge-base --is-ancestor` confirms that commit is on main. So it is gone on purpose and stays gone. Do NOT restore it.
  - Why the box sat open anyway: the code landed and nobody ticked it, so the batch gate kept re-reporting a finished item as unfinished.
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
- [x] CORRECTION 2 DELIVERED (Pinterest account model, refs IMG_6646-6650):
  - [x] identity block (avatar + name + Solen-Konto + Profil ansehen / Profil bearbeiten pills) , measured soft tint.
  - [x] iconless rows + Einstellungen/Anmeldung/Support sections + external arrows + plain Abmelden.
  - [x] mapping: Empfehlungen anpassen = Beauty-Profil + Inspo; Konto = E-Mail/Telefon/Passwort; Support = help/agb/datenschutz.
  - [x] 3 live directions in sweep-settings-pinterest (A faithful / B hybrid / C profile-first); A + C rendered-verified; REC = A. Committed.
- [x] CORRECTION 3 DELIVERED (owner 2026-07-20, "i like hybrid but w lines + fonts like before"): settings pick = B HYBRID, refined:
  - [x] B2 pane in sweep-settings-pinterest: icons KEPT + hairline dividers between the big groups + the Before page's MEASURED row spec (label 15px/500 ink, pad 13x16, icons 22/1.9, gray chevron) + the FULL taxonomy rows (Konto, Empfehlungen, Haarprofil, Benachrichtigungen, Sprache, Formulare / Prämien: Treue, Stempel, Einladen / Anmeldung / Support). Rendered-verified + screenshot. NEXT once approved: build in code.
- [x] PROFILE PAGE Pinterest model DELIVERED (owner 2026-07-20, IMG_6647 anatomy, PIL-measured): sweep-profile-pinterest on /de/profile:
  - [x] tabs Gespeichert / Termine / third, tappable inside the mockup; gear -> settings
  - [x] live hero: the page's own next-appointment card promoted to a BIG block on top; seeded 1 upcoming confirmed booking (slot+booking) for the QA user so it demos; reads real data only
  - [x] 3 directions for the Collages slot: D1 Looks (REC, route exists as stub) / D2 Bewertungen (net-new, labeled) / D3 Gutscheine (real route state)
  - [x] grid = real past bookings (bookings API, cover photos) + real favorites (parsed live); search pill = net-new, labeled; Pinterest chips dropped (filters not built)
  - [x] rendered-verified: D1 Termine grid + Gespeichert tab + live block, screenshots taken. Favorites tiles show the icon fallback (favorites page SSR imgs not parseable), flagged.
- [x] SETTINGS TAXONOMY DELIVERED: Fresha profile+settings and Uber Eats account screens captured via Mobbin (verified, not memory); full proposal in the 2026-07-21 reply + made visible as the B2 row set. PARKED net-new candidates (need an owner yes + backend): Zahlungsmethoden (saved cards), Sicherheit (2FA/sessions), Adressen, user-reviews list (D2). Gift cards stay hidden (killed 2026-06-14).
- [x] REGISTERED this batch + ACTIVE row (survives compaction).
