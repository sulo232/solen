# Solen · Hair History (Beauty Passport) — feature spec

> Captured 2026-05-14 from user direction. Status: **IDEA — not yet built.**
> Goal: track each customer's treatment history (bleach, color, cuts, treatments)
> in their profile so it's queryable by user + stylist, AI-parseable from free text,
> and surfaces damage warnings before risky service combos.

## Why this matters

Hair chemistry has memory. A bleach today is risky if there was bleach + ammonia color 4 weeks ago. Today every customer answers the same questions verbally to every new stylist — "when did you last bleach?", "any allergies?", "what brand?" — and the stylist takes their word for it. Mistakes happen. Hair breaks. Solen knows the booking history; **we can know the chemistry history too** and surface it. Differentiator vs Fresha/Treatwell which only know "did you book."

Adjacent: Solen V3 already has §0d.2 brand law for allergy/health data legal-grade display. This extends that principle to treatment history.

## User-facing feature shape

### 1. Onboarding capture
After first sign-up, optional onboarding step "**Deine Haar-Geschichte**" with two input modes:
- **Schnell**: type a free-text paragraph (e.g. "Habe 3× Balayage 2024, einmal blondiert im März, letzter Schnitt war Mai") → AI parses into structured timeline.
- **Detailliert**: structured form — pick treatment type + date + salon (if known) + brand (if known) + notes + photo upload.

User can skip. Onboarding is non-blocking; profile can be back-filled later.

### 2. Profile view — `Profil > Haar-Geschichte`
- Timeline view (newest first) of all treatments
- Counts at top: e.g. "12 Schnitte · 4 Färbungen · 2 Bleachings · seit Mai 2023"
- Each entry: type · date · salon (linked) · notes · photos
- Edit / delete / add manual entry buttons
- "Allergien & Empfindlichkeiten" section (PPD, sulfates, etc) — already required per §0d.2

### 3. Auto-log on booking confirmation
When a booking confirms (Stripe webhook fires), if the booked service is in the chemical-treatment category (color, bleach, perm, keratin, gloss, etc.), insert a `treatment` row into `hair_history` table linked to the user + booking + salon.

Status starts as `scheduled`. Salon-side has UI to mark "completed" with optional outcome notes ("client wanted ash blonde — went 1 shade darker than goal") + final photos. Status flips to `completed` at appointment finish.

### 4. Damage-warning engine (the big AI piece)
Before a user confirms a booking for a chemical treatment, check their `hair_history`:
- **Rule-based first pass**: hard rules from haircare science. E.g.:
  - Two bleaches within 6 weeks → 🟠 high damage risk
  - Bleach over fresh permanent color < 4 weeks → 🔴 chemistry conflict
  - Keratin treatment + new color < 2 weeks → 🟠 reduced color uptake
  - Perm + color same day → 🔴 banned combo
- **LLM second pass** (GPT-style): pass the customer's full history + planned service to an LLM with a system prompt like "You are a chemistry-aware hair stylist. Given this customer's history and planned service, identify any damage / outcome risks." Surfaces softer warnings rule-based can't catch.

Warning UI: appears in booking flow BEFORE final confirm. Three severity levels:
- 🟢 OK to proceed silently (no warning shown)
- 🟠 Soft warning ("Dein letztes Bleaching war vor 4 Wochen — frag den Stylist, ob ein Pflege-Treatment vorher sinnvoll wäre")
- 🔴 Hard warning + require acknowledge ("Bleach über frischer Färbung — höchstes Bruchrisiko. Bist du sicher?")

Soft + hard warnings always offer alternative ("Schau dir Pflegetreatments an" CTA).

### 5. Stylist-side surface
On the salon B2B side: when the salon opens the appointment, they see the customer's relevant history pinned at the top:
- "Klient: 3× Balayage in 2024 (zuletzt 12. März, Coiffeur Bahnhof)"
- "Letztes Bleaching: 6 Wochen her"
- "Allergien: PPD (Para-Phenylendiamin)"
- "Hinweise vom Kunden: 'Will diesmal kühler bleiben'"

Stylist can click → full history page with photos, notes, salons.

### 6. AI service-classification system (universal layer)
For 4-7 to work, every booking needs to be tagged with structured chemical-category metadata: `is_color_chemical`, `is_bleach`, `is_permanent_perm`, etc. Current `services` table only has free-text category + name.

Approach: an **AI service-classifier** runs against each salon's service catalog. Inputs: service name + description + price + duration. Output: structured tag set. Stored in `services.classification` JSON column. Re-runs when salon adds new services. Reviewed by salon owner during onboarding ("Solen hat diesen Service als 'Bleach' kategorisiert — stimmt das?").

## Data model sketch

```sql
-- New tables (Phase ?? — when this feature ships)

CREATE TABLE hair_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),  -- nullable: manual entries don't have a booking
  salon_id UUID REFERENCES salons(id),       -- nullable: pre-Solen history doesn't have a salon
  service_id UUID REFERENCES services(id),   -- nullable: free-text entries don't have a service

  -- Snapshot fields (denormalized so deletes of source don't lose history)
  treatment_type TEXT NOT NULL,        -- e.g. 'bleach', 'permanent_color', 'gloss', 'cut', 'treatment'
  treatment_label TEXT NOT NULL,       -- display: e.g. 'Balayage', 'Damen-Schnitt'
  treatment_date DATE NOT NULL,
  salon_label TEXT,                    -- snapshot of salon name at time of treatment

  -- Optional structured fields
  brand TEXT,                          -- e.g. 'L'Oréal Majirel', 'Wella Koleston'
  color_level TEXT,                    -- e.g. '7N', 'natural blonde 7'
  notes TEXT,
  photo_urls TEXT[],

  -- Source tracking
  source TEXT NOT NULL,                -- 'auto_booking', 'onboarding_freetext', 'onboarding_form', 'manual_profile_edit'
  ai_parsed_from TEXT,                 -- original free-text input if AI-parsed

  status TEXT NOT NULL DEFAULT 'completed',  -- 'scheduled' | 'completed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX hair_history_user_date_idx ON hair_history (user_id, treatment_date DESC);
CREATE INDEX hair_history_user_type_idx ON hair_history (user_id, treatment_type);

-- Service classification (one row per service, JSON-flexible)
ALTER TABLE services ADD COLUMN classification JSONB DEFAULT '{}'::jsonb;
-- Example shape:
-- {
--   "is_chemical": true,
--   "is_color": true,
--   "is_bleach": true,
--   "is_permanent": false,
--   "is_perm": false,
--   "is_keratin": false,
--   "damage_class": 3,  -- 0 (no damage) to 5 (high damage)
--   "ai_confidence": 0.92,
--   "ai_classified_at": "2026-XX-XX"
-- }

-- Damage warnings audit log (so we know what we showed which user)
CREATE TABLE booking_damage_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,              -- 'soft' | 'hard'
  reason_code TEXT NOT NULL,           -- 'bleach_too_soon', 'color_over_color', 'allergy_match', ...
  message TEXT NOT NULL,               -- exactly what we displayed to user
  acknowledged BOOLEAN NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW()
);
```

## AI/LLM integration points

### 1. Onboarding free-text parser
- **Input**: user types "Habe 3× Balayage in 2024, einmal blondiert im März, letzter Schnitt Mai"
- **Output**: array of `{ treatment_type, treatment_date_approx, count }`
- Model: GPT-4o-mini or Claude Haiku (cheap, structured JSON output)
- Prompt: provides German treatment vocabulary + date inference rules + JSON schema

### 2. Service classifier (per salon onboarding)
- **Input**: salon's service list with name + description + duration + price
- **Output**: JSONB classification per service (see schema above)
- Model: GPT-4o-mini OK; LLM with structured output
- Salon owner reviews + corrects during onboarding ("Solen hat 'Strähnchen' als Bleach klassifiziert — stimmt: ja/nein")

### 3. Damage warning LLM
- **Input**: user's last N treatments (max 20) + planned service classification
- **Output**: `{ severity: 'none' | 'soft' | 'hard', reason: string, recommendation: string }`
- Model: needs hair-chemistry knowledge — Claude Sonnet or GPT-4 (not the cheapest tier)
- Cached at booking-creation: same warning shown to user, also shown to stylist
- Cost control: only runs for `is_chemical: true` services. Cuts vs. blow-dry: skip.

### 4. Stylist-side history summarizer (optional v2)
- **Input**: customer's full history (potentially 20+ entries)
- **Output**: 2-3 sentence summary highlighting most relevant info for THIS appointment
- Model: GPT-4o-mini
- Pre-generated when stylist opens the appointment, cached for 24h

## Privacy / GDPR considerations
- Hair history is personal health-adjacent data. Customer must opt in during onboarding.
- All data exportable + deletable per GDPR Art 15 + 17 (Solen already has this for bookings).
- AI passes to OpenAI/Anthropic: PII-scrub names before sending; use anonymized IDs.
- Stylist sees customer's history ONLY for confirmed bookings + only within 30 days post-appointment.
- Salon-level visibility is the customer's choice (toggle: "Salons dürfen meine Geschichte sehen").

## Phase plan (rough)

| Phase | Deliverable | Effort |
|---|---|---|
| 0 | This spec (done) | — |
| 1 | Schema migrations (hair_history + services.classification + booking_damage_warnings) | 2-3 hr |
| 2 | AI service classifier — run against existing salon services, store classification | 4-6 hr |
| 3 | Auto-log on booking confirm (Stripe webhook integration) | 2-3 hr |
| 4 | Profile view — `/profile/haar-geschichte` (read-only first pass) | 4-6 hr |
| 5 | Onboarding free-text parser + structured form | 6-8 hr |
| 6 | Damage warning engine — rule-based first pass, LLM second pass | 8-12 hr |
| 7 | Stylist-side surface on B2B salon dashboard | 4-6 hr |
| 8 | Edit/delete in profile + history-sharing toggle | 4-6 hr |
| 9 | Polish + analytics + privacy controls | 6-8 hr |

**Total: ~40-60 hrs.** Not v1 launch. Slot for Phase 6 (B2B / post-launch retention features).

## Open product questions

1. **Mandatory or opt-in?** Per §0d.2 brand law allergy data is mandatory-display. Treatment history could be opt-in (privacy) OR opt-in-display-only (always collected, customer controls sharing). Recommend opt-in-with-strong-encourage: every customer sees the onboarding step + can dismiss.

2. **Pre-Solen history**: do we let users back-fill treatments from before they joined? Yes — that's how onboarding free-text parser earns its keep.

3. **Photo uploads**: required, optional, or skipped? Recommend OPTIONAL — strong nudge to add "before" photo at booking + "after" photo at stylist-side checkout. Hair-history photos make for a beautiful timeline view.

4. **Cross-salon history visibility**: by default, Salon B sees Salon A's history when customer books with Salon B. Customer can toggle this off per-salon ("verstecke Geschichte von Coiffeur X von zukünftigen Salons").

5. **AI cost ceiling**: damage-warning LLM at booking flow could get expensive. Cap at: only chemical services + cached warning per booking + use the cheap model (Haiku/GPT-4o-mini) for first-pass scoring, Sonnet only for soft+ warnings.

6. **What's the consumer's compelling value-prop framing?**: "Wir merken uns deine Haar-Geschichte, damit jeder Stylist von Anfang an weiss, was du brauchst." Or harder: "Niemand sollte zweimal erklären müssen, was sie sich angetan haben." Need copy round.

## Why this is a moat

Fresha, Treatwell, Booksy all do bookings. None of them track CHEMISTRY. Solen could be the only Swiss platform where:
- Customer never re-explains their history
- Stylist always knows what they're walking into
- Damage warnings prevent expensive haircare disasters
- Auto-logged timeline becomes the customer's personal beauty record

This is a **retention + trust + brand** feature, not just a UX nice-to-have. Power user spends 8x more on hair than average; they're the people who care most about chemistry consistency.

## File pointers (for future implementer)

When this gets built:
- Schema migrations go in `supabase/migrations/`
- AI prompts live in `lib/ai-vision.ts` (or split: `lib/ai/hair-history-parser.ts`, `lib/ai/damage-warnings.ts`, `lib/ai/service-classifier.ts`)
- Profile UI: `app/[locale]/profile/haar-geschichte/page.tsx` + components in `app/[locale]/_components/profile/`
- Booking flow warning component: `components-legacy/booking/HairDamageWarning.tsx` (or new V3 path)
- Stylist B2B view: `app/[locale]/salon-dashboard/clients/[id]/page.tsx`
- Salon onboarding classifier: `app/[locale]/onboarding/salon/services/page.tsx`
