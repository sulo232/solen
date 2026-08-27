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
  - [x] THE MEASURED WALK IS DONE, 2026-08-27, on the rendered `/de/dashboard` at 1440x900 through a real dev session, not read from source. Named violations with numbers, against this project's own floors:
    **10 distinct font sizes** in the first viewport (34/26/24/20/17/16/15/14/13/12). The ceiling is 4. Two and a half times over.
    **4 distinct weights** (400/500/600/700). The ceiling is 2.
    **43.1% of visible text at weight >= 600.** The EMPHASIS BUDGET ceiling is roughly 30%.
    **Body text is 12px.** The design contract's text-size row puts body at 14 and reserves 12 for meta.
    What PASSES and must not be "fixed": the anchor is 34px at 2.83x body, clearing both the >=28px display-anchor floor and the >=1.8x ratio floor. Do not touch it.
    A false lead worth recording so it is not chased again: 17 elements in the first viewport render a solid ink-black fill, which looked like the banned black-on-selected. Inspected, they are the collapsed sidebar's peek tooltips (`pointer-events-none absolute left-[52px]`), which are legitimately ink. Not a violation.
  - [x] ROOT CAUSE NAMED, and it is not layout. `tailwind.config.js:81` aliases the RETIRED token `s-coral` to `#0A0A0A`, plain ink. 180 references across 58 dashboard files still use it, so elements designed as coloured accents render black. That is the mechanism behind "too monochrome". The calendar's 26 of them are fixed (below); the other 154 are not.
  - [ ] DIRECTIONS: three are now grounded and costed, and the pick is HIS by name (a dashboard reskin is
    not an indifference-band call). Nothing here is adopted.
    **D1, take the gray off the page wrapper.** Built and rendered as a probe, see the GRAY item (b) below.
    One CSS line on one wrapper. Does not touch layout, type or cards. Smallest possible move.
    **D2, restore the dead token.** `tailwind.config.js:81` aliases the retired `s-coral` to plain ink
    `#0A0A0A`, and 180 references across 58 dashboard files still point at it, so elements drawn as
    coloured accents render black. 26 of them in the calendar are already fixed (commit `290af37f5`);
    154 are not. This is the mechanism behind the monochrome look, so D2 changes more than D1 does.
    **D3, the stranded Aurora V2 skin.** VERIFIED PRESENT 2026-08-27, and the plan file's branch name was
    wrong: it is `claude/bold-hellman-b31513`, not `bold-hellman`. Seven phases, 98 files,
    +1,899 / -953 against main, ending at `f49ff5f01`. It was finished and never merged. It is the
    largest option and the only one that needs a real review before it could land.
    NOT DECIDED, and deliberately not started: this is the one place in this batch where guessing costs
    the most, because D3 rewrites 98 files.
- [x] CALENDAR mockup honesty , RESOLVED by taking the second arm, the one he had already approved ("just FIX the dead token in code"). Committed `290af37f5` on 2026-08-27. The mockup is dropped rather than re-pointed at the desktop grid, because the mockup only existed to show a defect that is now gone.
  - [x] all 26 `s-coral` tokens across 18 lines in `app/[locale]/dashboard/calendar/page.tsx` replaced with `s-accent-bright`. Verified: 0 `s-coral` left, `s-accent-bright` occurrences 10 -> 36, which is exactly 10 + 26.
  - [x] grounded, not invented: `LOCKFILE.md:128` names the replacement for this exact retired token ("blue accent use `s-accent`") and `LOCKFILE.md:1574` makes dashboard files exempt from the sparse-blue rule while explicitly NOT exempt from the retired-token rule, naming `s-coral`. Almost every call site already carried an `s-accent-bright` border, so the fix restores an intended pairing rather than choosing a new colour.
  - [x] the locked selected state is untouched: the view switcher stays `bg-s-bg-sunken` + `text-s-ink` + semibold. Only the UNSELECTED tab's hover changed. No black or blue fill was introduced on a selected state.
  - [x] `tsc --noEmit` exit 0, full suite unchanged at 165 of 166 (the one failure is a pre-existing Stripe webhook assertion, proven to pre-date this by a control run).
- [ ] GRAY-BACKGROUND REOPEN (the big one): owner dislikes the sunken-gray wash product-wide. (a) INVENTORY: measure where bg-s-bg-sunken/#F4F4F5 renders as BACKGROUND WASH (page bgs, input fills, section fills, tiles) vs where gray is a SELECTED state (locked separately , do not conflate). (b) Build a v2 live probe: /de/profile/settings with gray backgrounds stripped to white + hairline borders (white-first). (c) If the owner confirms on the probe -> a design-system decision (LOCKFILE surface row reopened BY THE OWNER) + a sweep plan. Do NOT sweep before the probe is approved.
  - [x] (a) INVENTORY MEASURED 2026-08-27. Counted over `app/`, `components/`, `components-legacy/` and `lib/`, classifying each hit by whether selection vocabulary (isSelected / isActive / checked / aria-selected / data-state) sits within two lines of it.
    **810 uses are a background wash. 260 are a selected state.** Selected-gray is locked separately by the design contract and is NOT part of this reopen, so the 260 stay.
    Split of the 810 by who actually sees the page, which is what decides where a probe starts:
    **349 on the customer site · 289 on `/dev/*` and sandbox pages no customer can reach · 172 on the salon-owner dashboard.**
    So more than a third of the gray he called "everywhere" is on pages only the team opens. Stripping those changes nothing he can see and would be the wrong place to start.
    Worst customer-facing files: `warum-solen/page.tsx` (16), `_components/search/SearchTemplate.tsx` (12), `_components/layout/Header.tsx` (8), `_components/search/SearchOverlay.tsx` (7), `notifications/NotificationsClient.tsx` (7), then `auth/register`, `booking/lookup` and `booking/resend-link` at 6 each.
    Header and SearchTemplate matter out of proportion to their counts: they render on nearly every customer page, so they are the two files where a change is felt everywhere at once. That, not the raw leaderboard, is where the probe in (b) should point.
    Caveat on the method: the classifier reads two lines of context, so a selected-state hit written far from its condition would land in the wash column. The 349 is an upper bound on the customer site, not an exact figure.
  - [x] (a2) RENDER-TIME MEASUREMENT, 2026-08-27, and it REFRAMES the whole item. The 810 source hits above count CODE. This counts PAINT: 5,500 hit-tested points per screen over a live signed-in session at 402x844, resolving each point to the colour actually on top, so a gray box under a loaded photo is correctly counted as photo.
    **Two instruments were wrong before this one and both were caught by a control, recorded so neither is repeated.** Reading computed `backgroundColor` reported 44.6% gray on the home page; the control (do those boxes contain a loaded, covering `<img>`?) came back `naturalWidth 160, opacity 1, covers 100%` on all of them, so that gray is never painted and the number was an artifact. Then a scroll sweep returned byte-identical numbers at four different offsets; the cause is `scroll-behavior: smooth`, so a synchronous loop reads the pre-animation viewport every time. Fixed by forcing `scrollBehavior=auto` and waiting between samples. Known-answer control for the final instrument: run on a page built with a gray body and white panels, it returns 46.4% gray attributed to `body` and 53.6% white, which is exactly right.
    **THE RESULT, share of one phone screen painted gray, first viewport unless noted:** warum-solen **73.5%** (two full-width `bg-s-bg-sunken` sections) - salon-owner dashboard **44.3%** (one `min-h-screen bg-s-bg-sunken` page wrapper) - profile/settings **12.8%** (the one identity block) - booking/lookup **8.8%** (one info box) - home at the foot **7.7%** (the newsletter block) - a salon PDP **4.2%** (3.7 of it the `bg-s-sand` Termin/Walk-in switcher, which is warm sand, not the cool sunken) - inspo 1.6% - home 1.2% - notifications 1.2% - category 1.2% - city result 1.1% - profile **0%** - bookings **0%**.
    **So "gray everywhere" is FALSE as stated and TRUE where he actually spends his own time.** Every screen a CUSTOMER browses is 0 to 4.2% gray and 42 to 88% white. The two heavy ones are the marketing page and HIS OWN dashboard, which is also the surface he called "looks ass" in the same original message. That is very likely the source of the impression, and it makes the dashboard item above and this item the same item.
    Consequence for (b): the probe should NOT start at /de/profile/settings. At 12.8% it cannot show him a difference worth judging. The probe that answers his complaint is the dashboard at 44.3%, or warum-solen at 73.5%.
  - [x] (b) PROBE BUILT AND VERIFIED 2026-08-27: `public/_mockups/dashboard-without-the-gray/index.html`.
    Two panels, both loading the REAL `/de/dashboard` from the running server with real data. Nothing is
    redrawn. After the second panel loads, exactly one rule is injected into it, the page wrapper's
    `bg-s-bg-sunken` painted white. Measured after building: before panel wrapper `rgb(244, 244, 245)`,
    after panel `rgb(255, 255, 255)`, both panels `textLen 733`, so the content is provably identical and
    only the colour differs.
    NOTHING IS ADDED TO COMPENSATE, and that is measured rather than assumed: all 12 of the 12 white
    blocks over 120x40 on that screen already draw their own 1px border, `withNoBoundaryAtAll: 0`, so
    FLOORS LAW 4 option (c) is already satisfied without the tray. A mistake made while building this is
    recorded inside the file: the first pass read only `borderTopWidth`, concluded the 402x57 top bar had
    no border, and injected a compensating hairline. Re-measured on all four sides it is 0/0/1/0. The
    injection was removed and the false line deleted.
    RE-POINTED by (a2) and this is why: settings paints 12.8% gray, too small a difference to judge. The
    dashboard paints 44.3%.
  - [ ] (c) HIS CALL, and it is the only thing left in this item. Reopening a LOCKFILE surface row is his
    by name. Two arms, both decided in advance so this is a question and not a stop:
    ARM A, he says the white one is better -> the LOCKFILE surface row reopens and a sweep plan gets
    written for the 349 customer-site wash sites, starting with `Header.tsx` and `SearchTemplate.tsx`
    because those two render on nearly every page.
    ARM B, he says keep the gray -> the tray stays, the item closes, and the dashboard's real problems
    (10 font sizes, 4 weights, 43.1% bold, 12px body) are what get worked instead.
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
