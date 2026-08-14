# Onboarding rebuild spec , Option 1 (collapse) + enriched. Build target.

Owner-approved (2026-06-30): collapse the two wizards into ONE source of truth, enriched with profiling
questions that curate the dashboard. Mockup: the `enriched_onboarding_option1` visualize widget (3 new
questions + curated cards for solo-barber vs 6-staff-coiffeur). Design = Solen locked skin (#276EF1,
Inter Tight/Inter, sentence case, NO ALL-CAPS, NO emoji, NO em-dash, calm-gray selected pills, ink commit CTA).

## The shape
- **Thin public CREATE** `app/[locale]/onboarding/salon` + `OnboardingFlow.tsx`: salon name + city +
  category(multi) + "Woher kennst du Solen?" (acquisition) + TOS. POST `/api/salons` creates the salon
  (is_active:false) → redirect into `/dashboard/setup`. REMOVE the quick-win-service + photos steps here
  (they move to setup). Keep draft autosave (`/api/salon-draft`).
- **Single COMPLETE wizard** `app/[locale]/dashboard/setup` + `SetupWizard.tsx` (the 7 steps, becomes the
  one home for everything post-create): Profil(+photo) · TEAM ("Wie viele arbeiten bei euch?") ·
  Services(AI-seeded, quick-win first) · Öffnungszeiten · Arbeitszeiten(skip if solo) · Zahlungen(Stripe) ·
  ZIELE ("Was ist gerade am wichtigsten?") · Bereit→go-live(REAL, already wired in P2). Drop duplicated
  profile/category/photo fields from CREATE; use ONE upload bucket (pick `salons`, retire `salon-gallery`
  in this flow , verify no other consumer first).

## NEW data , additive migration (apply_migration, idempotent, nullable; NEVER db push/reset)
```sql
alter table public.salons add column if not exists acquisition_source text;
alter table public.salons add column if not exists team_size text;          -- 'solo' | '2_5' | '6_10' | '10_plus'
alter table public.salons add column if not exists onboarding_goals text[];  -- subset of goal keys below
```
- acquisition_source values: `instagram | google | empfehlung | vorbeigelaufen | anderes`.
- goal keys: `fill_slots | reduce_no_shows | new_clients | keep_regulars`.
- Wire these into `createSalonSchema` (acquisition on create) + the salons PATCH allowlist (team_size,
  goals on setup) , today `salons/route.ts` COMMENTS OUT collected fields; persist these instead of dropping.

## City handling (correct the real defect, do NOT expand to 8)
- Onboarding city select = the 3 LAUNCHED routing cities from `lib/cities.ts` `CITIES` (basel/zuerich/bern),
  localized via `getCityName`. NOT a hardcoded inline list; NOT `SEARCH_CITIES` (the other 5 have no
  lat/lng + no `/[city]` page → a salon there can't be placed).
- On submit set `latitude/longitude` from `CITIES[slug]` (kill the hardcoded Basel 47.5596/7.5886 default
  at `salons/route.ts:650`); keep quartier logic but derive from the chosen city, not force 'grossbasel'.

## Curation (the payoff) , dashboard home reads {salonCategories, team_size, onboarding_goals}
Render a small "Empfohlene nächste Schritte" card-stack on `/dashboard` home, rules (each card deep-links
to a REAL existing route; NO fabricated targets):
- goal fill_slots → Walk-in queue (`/dashboard/queue-display` or walk-in setup) + Last-Minute deal (LastMinuteManager).
- goal reduce_no_shows → Anzahlung/deposit setting (P5, gate "coming" only if route absent) + booking rules.
- goal new_clients → profile/photos completeness + Inspo/discovery post.
- goal keep_regulars → loyalty + review-request setting.
- team_size solo → hide team-invite card; team_size>solo with unaccepted invites → "Team einladen (N offen)".
- category barbershop → walk-in; nails → infill/retention; spa → rooms; coiffeur → formulas/CRM.
Only show cards whose target route EXISTS now; everything else deferred (no dead clicks).

## Files
- `app/[locale]/onboarding/OnboardingFlow.tsx` (thin create; city from CITIES; acquisition q; drop service+photos steps)
- `app/[locale]/onboarding/salon/page.tsx` (wrapper; redirect to /dashboard/setup on success)
- `app/api/salons/route.ts` (persist acquisition_source + city lat/lng; stop dropping google_place_id/cancellation_policy or remove from schema)
- `components-legacy/onboarding/SetupWizard.tsx` + `steps/TeamStep.tsx` (+ new team-size question), new `steps/GoalsStep.tsx`
- `app/api/salon/[id]` PATCH allowlist or the setup save route (team_size, onboarding_goals)
- `app/[locale]/dashboard/page.tsx` (curated next-steps card-stack)
- migration via apply_migration

## Build order (each = its own loop + screenshot verify; mockup already approved)
- OB-1 structural collapse: thin create + redirect into setup + city fix + persist dropped fields + one bucket.
- OB-2 questions: migration + acquisition (create) + team-size + goals (setup) persisted.
- OB-3 curation: dashboard next-steps card-stack from the answers (real routes only).

## Design / acceptance
- Sentence case everywhere (PROPOSE dropping the current ALL-CAPS onboarding styling , confirm with owner if they push back). No emoji on category chips (setup currently uses ✂️🪒💅🧖 , replace with Lucide or none). No em-dash. Calm-gray selected pills. One ink commit CTA per step.
- Resumable (draft + setup-progress). Go-live real (P2). No dead clicks, no fabricated data/counts.
- Verify each OB step with a logged-in screenshot at 1440 + 375.
