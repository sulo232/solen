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
Round 2 in progress this turn.
