# 🪦 REMOVED — the graveyard. Checked by `npm run exists` and the mockup hook.

Things the owner DELETED or REJECTED on purpose. Proposing/rebuilding anything on this list is the
project's #1 recurring failure (it has happened after nearly every context compression). One line per
item: `keywords | what | why/when | record`. Keywords are fuzzy-matched (separators ignored) by
scripts/exists.mjs — list every spelling someone might search.

- last-minute lastminute angebote-page | standalone last-minute pages + APIs + homepage strip | owner removed 2026-06-11; survives ONLY as the search Angebote filter + Settings>Angebote tab + coupons | memory project_lastminute_packages_removed
- pakete packages package-manager | the entire packages feature (pages, APIs, PackageManager, redeem banner) | owner removed 2026-06-11; DB tables legacy-only; NEVER rebuild | memory project_lastminute_packages_removed
- walk-in-pay status stepper queue-number wait-time-on-pay | any status/number/stepper/wait-time UI on /walk-in-pay | payment-only page; queue/[token] is THE single tracker, PDP panel shows wait pre-join; dedup 068a4e5ca, re-proposal killed again 2026-06-12 | memory project_walkin_single_tracker
- walk-in QR qr-code | QR codes anywhere in walk-in | name is enough; QR ok for stamps only | memory project_walkin_single_tracker
- staff verfügbarkeit availability-section | Verfügbarkeit section + tab on the staff profile | owner picked A2 (pure Fresha anatomy) 2026-06-11; availability lives in the booking date picker | commit 777d6c4ad
- barber-slug barber-profile-route | /salon/[slug]/barber/[barberSlug] duplicate staff profile | dead duplicate deleted 2026-06-11; staff/[staffId] is canonical | session 2026-06-11
- booking stepper progress-bar step-indicator | ANY progress UI in the booking flow (icon stepper, segment bar, Schritt-N meta) | mockup-20 lock: back arrow is the navigation, exactly Fresha | memory project_booking_flow_canonical, commit 9a15debd0
- booking floating-service-cards | separate floating service cards on booking step 1 | superseded same night by the Atelier grouped card | commit bcd148d92
- dispute-notification price-disputes | DisputeNotification dashboard render + legacy admin disputes page/API | removed in the disputes cleanup wave | tasks #34-37
- daily ticket reset ticket-number-reset | daily walk-in ticket-number reset | superseded by the atomic no-reset counter ("no reset, no race, no TZ math") | lib/walkin/join.ts:54
- geist font | Geist font anywhere | owner rejects repeatedly; Inter Tight + Inter only | memory feedback_no_geist_font
- anton signature-lockup ftu-empty | SignatureLockup Anton font + EmptyStateFTU | pre-pivot fonts killed 2026-06-11 | session 2026-06-11
- coral s-coral | coral as an accent anywhere customer-facing | B&W pivot 2026-05-25; blue #276EF1 is the only accent | memory project_palette_b_w_pivot
- in-page back-button deep-page-back | per-page back buttons under the global header | the global Header IS the back (V3-D461); only focused flows keep their own | memory project_single_global_back
- dog grooming pivot | the dog-grooming pivot | killed 2026-05-16 | memory project_pivot_shelved
- fuer-salons fusion categories-comparison-badges | "pull categories grid / comparison chart / trust badges INTO /fuer-salons" | the page ALREADY HAS all three (it was /partner all along, renamed 2026-06-12); W10 items 1-3 were based on a stale two-page premise | this file, 2026-06-12
- discovery entdecken redesign | ANY change to /entdecken page or home discovery section | 🔒 NO-TOUCH, permanent owner lock | memory project_video_audit_ds_upgrade
- fuer-salons business b2b-rename canonical-b2b | renaming /partner to /fuer-salons or /business (any B2B route rename) | owner 2026-06-12: /partner IS canonical, owner consolidated it personally; W10 items 5/6 void; aliases 301 to /partner (2026-06-12) | next.config.mjs redirects
