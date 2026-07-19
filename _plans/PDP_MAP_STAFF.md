<!-- batch: salon PDP map + staff-scroll (owner 2026-07-19) -->
# CORRECTION , salon PDP: the map + the staff-scroll jump

Owner 2026-07-19: "i dont like it's not acc[urate] map in store page and also not clickable and it expands, and
also staff i dont like how it jumps when u scroll."

- [ ] CORRECTION: the store-page (salon PDP) MAP is NOT ACCURATE (wrong location / not the real pin). BLOCKED on owner: is the pin wrong (seed coords 47.5613,7.5878) , I fix coords/geocoding once confirmed.
- [ ] CORRECTION: the map is NOT CLICKABLE. It IS an <a> to Google Maps today; BLOCKED on owner fork: tap = open Google Maps directions, or expand to an inline interactive map? (DRIFT LEDGER: interactive mini-map was tried + felt "stuck", replaced with static.)
- [x] CORRECTION: the map "expands" , removed the `group-hover:scale-[1.02]` on the map img (SalonLocation.tsx). Verified rendered (no scale class).
- [x] CORRECTION: the STAFF (Team) row JUMPS when you scroll , removed the "bounce hello" wave (IntersectionObserver + team-wave), snap-mandatory->snap-proximity (SalonTeam.tsx). Verified rendered (hasWave=false, snap=proximity).

DRIFT LEDGER warning (2026-07-02): a past map failure = built a BUTTON over the owner's repeated "auto-update on zoom". Do not repeat , investigate the real behavior first, measure, then fix (no guess-and-apply).
