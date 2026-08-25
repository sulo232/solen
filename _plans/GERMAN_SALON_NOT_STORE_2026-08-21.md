# German copy says Salon, never Store (2026-08-21)

## Decision
A research council checked the live German interfaces of Treatwell (.ch/.de), Salonkee, MySalon.ch,
Booksy, Shore and Terminland. Every direct consumer marketplace in this vertical calls the business a
"Salon" to the shopper; the platforms saying Betrieb/Dienstleister/Geschaeft address the owner, not
the customer. Verdict: **German copy (customer AND owner surfaces) says Salon, not Store.**

Note on history: workstream 54 (2026-08-01, `HOME_V3_CATEGORY_MAP.md`) recorded a Salon-to-Store
rename as DONE. Workstream 58 (2026-08-10, `HOME_REGRESSIONS_2026-08-10.md`) found, while investigating
something else, that this had left the product with both words for one entity. This workstream is the
correction, continuing what pass 1 (commit `ffb09aba1`) already started.

## Rounds
- **Round 1** (commit `ffb09aba1`): metadata/title/description strings across ~11 named files +
  7 `messages/de.json` keys + a handful of near-duplicate misses caught by a repo grep (MobileMenu.tsx,
  search/page.tsx description, ueber-uns "Sind Sie ein Store?", warum-solen second badge, de.json
  `salonHelp`/`replyFromSalon`).
- **Round 2** (this file, in progress): the four stragglers (`salon/[slug]/layout.tsx`,
  `salon/[slug]/reviews/page.tsx`, `staff-invite/page.tsx`) + the full tail list from round 1's own
  report (homepage marketing components, salon PDP components, other customer pages including the
  `queue/[token]/page.tsx` and `walk-in-pay/page.tsx` inline locale objects, three components-legacy
  files) + a deliberate widening to owner/dashboard-facing German copy (`messages/de.json`
  `api.goLive.*`/`api.salonRejected.*`/admin checklist string, `SalonSwitcher.tsx`,
  `DashboardLayout.tsx`, `EditPanel.tsx`, `dashboard/all-salons/page.tsx`, `dashboard/marketing/page.tsx`).

## Explicitly out of scope (both rounds)
- `terms/components/TermsContent.tsx` + `TermsSidebar.tsx`, `privacy/components/PrivacyContent.tsx`:
  «Store-Partner» is a defined legal term through a contract and a privacy notice.
- `messages/en.json`, `fr.json`, `it.json`, and any `en:`/`fr:`/`it:` branch of an inline locale object.
- `salon/[slug]/layout.tsx:10` (French "Store d'ongles"), tracked separately, not this decision.
- `app/[locale]/dev/**`, `dashboard/admin-sandbox/page.tsx`: internal, not customer/owner copy.
- Any `import { Store } from "lucide-react"` / `<Store />` usage: an icon, not a word.
- Any hardcoded literal that renders identically regardless of the visited locale INSIDE a component
  whose sibling text IS genuinely locale-branched (would change what an EN/FR/IT visitor sees):
  `DetailPage.tsx:436`, `queue/[token]/page.tsx:359,390`.

## Status
**GERMAN: DONE, verified 2026-08-25 by re-scan, not by assumption.** Zero German strings call a
salon a store, measured two ways: every VALUE in `messages/de.json` (0 hits) and every inline
`de: { ... }` locale branch across `app/**` and `components*/**` (0 hits, 19 files carry one).
What still greps as "Store" in German-adjacent files is the Lucide `<Store />` ICON, code
identifiers, and stale code comments quoting the old strings. None of it renders as a word.

**FRENCH: found carrying the identical defect, and fixed the same day** (commit `07efec6f4`).
This was NOT in either round's scope, which is exactly why it survived. In French "store" means a
window blind, so the defect is worse there than in German: a French visitor read "Aide stores",
"Reponse du store", "Decouvrir d'autres stores", "Montrez ce code au store". 24 strings changed,
12 in `messages/fr.json` (against 376 that already said salon) and 12 in the inline `fr:` branches
of `walk-in-pay` and `queue/[token]`. English is byte-identical: the replace was scoped to the
`fr:` LINE because `salonEyebrow: "Store"` is correct in the English branch of the same object.

**Two defects found while in there, both fixed:**
- `api.salonRejected.body` in `messages/it.json` interpolated `{store}`, but
  `app/api/admin/salons/[id]/reject/route.ts:72` passes `{ salon, reason }`. An Italian-locale
  owner's rejection message could never render the salon name. A shipped bug, not a preference.
- tu/vous mixing in French. `blockedPausedBody` said "Reessaie plus tard ou choisis" and the queue
  page said "Ton retour", while every sibling string in the same object uses Veuillez/Votre/Vous
  and both German siblings are formal. COPY_LAW fixes French at vous.

**PARKED, needs the owner: the Italian WORD "store", 25 uses** (12 in `messages/it.json`, 13 in
inline `it:` branches). Deliberately NOT changed. Unlike French, "store" is a real borrowed word
in Italian commerce, so replacing it is a branding call that needs the same market research the
German decision got. Changing it on the German precedent alone would be a guess.

The French one-off this file already tracked, `salon/[slug]/layout.tsx:10` "Store d'ongles"
(window blind, mistranslation), was verified fixed: that line now reads `nails: "Onglerie"`.
