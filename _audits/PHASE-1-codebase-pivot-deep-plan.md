# Phase 1 Deep Plan · Codebase pivot audit

> Locked 2026-05-13. Per master plan cadence: deep plan → approve → execute.
> Phase 1 follows Phase 0 (scope teardown ✅ complete + V2-D58.0 locked +
> US-leaders audit additive supplements identified).
> Duration: ~1.5 hrs. Deliverable: `_audits/codebase-pet-pivot-audit.md`
> + `V2-D58.1` entry in `V2_REBUILD_LOG.md`. Output is **read-only** — no
> migrations, no renames, no schema changes. Just the map.

---

## Goal

Map every beauty-specific touchpoint in the Solen codebase. Output:

1. **Rename map** — every beauty term + its grooming equivalent
2. **File action list** — for every affected file: survives / rename / rebuild / delete
3. **Schema delta** — exact migrations needed in Phase 3
4. **Route plan** — which `/[locale]/*` routes change
5. **Component reorganization** — what goes in `components-legacy/{coiffeur,barber,nail,spa}/`, what survives in `components-legacy/booking/`, etc.
6. **Translation file plan** — which `messages/*.json` keys to rename
7. **Risk callouts** — anywhere the pivot might break existing state in subtle ways

Phase 3 (schema migrations) and Phase 4 (consumer flow rebuild) execute against this map.

**Out of scope for Phase 1:** writing migrations, renaming files, deleting code, making brand decisions. Phase 1 is READ + PLAN only.

---

## Sub-steps (sequenced)

### 1.1 · Grep-based inventory (~25 min)

Run targeted greps for beauty terms across the codebase. Output: file list per term.

**Terms to grep** (case-insensitive):

| Group | Terms |
|---|---|
| Category enum values | `coiffeur`, `barbershop`, `nails`, `spa`, `makeup`, `waxing` |
| Beauty UI nouns (DE) | `Stilist`, `Coiffeur`, `Coiffeuse`, `Barbershop`, `Maniküre`, `Haarschnitt`, `Schnitt`, `Färben`, `Make-up`, `Wellness` |
| Beauty UI nouns (EN) | `stylist`, `salon`, `barber`, `manicure`, `haircut`, `hair color` |
| Data model | `hair_type`, `suitable_gender`, `suitable_for` (age_group), `specialties` |
| Service nouns | `service`, `Dienstleistung`, `Behandlung` |
| Files of interest | `components/{coiffeur,barber,nail,spa}/**/*` |

**Commands** (saved as a `_audits/phase-1-greps.sh` for reproducibility):

```bash
# 1. Category enum hits
rg -l --type=ts --type=tsx 'SalonCategory|"coiffeur"|"barbershop"|"nails"|"spa"|"makeup"|"waxing"' --glob '!node_modules' --glob '!_audits/**' --glob '!_archive/**'

# 2. Beauty UI nouns (German)
rg -l 'Stilist|Coiffeur|Coiffeuse|Barbershop|Maniküre|Haarschnitt|Färben' --glob '!node_modules' --glob '!_audits/**' --glob '!_archive/**'

# 3. Data model lock points
rg -l 'hair_type|suitable_gender|HairType' --glob '!node_modules' --glob '!_audits/**' --glob '!_archive/**'

# 4. Routes
ls 'app/[locale]/coiffeur' 'app/[locale]/barbershop' 'app/[locale]/nails' 'app/[locale]/spa' 'app/[locale]/makeup' 'app/[locale]/waxing' 2>/dev/null

# 5. Component dirs
find components-legacy/{coiffeur,barber,nail,spa} -type f 2>/dev/null
```

**Output**: a markdown table grouped by category, with file paths + line counts per file.

### 1.2 · Categorize findings (~20 min)

For each file from §1.1, assign one of:

| Category | Meaning |
|---|---|
| **SURVIVES 1:1** | No changes needed — neither code nor copy depend on beauty semantics |
| **RENAME ONLY** | Same logic, swap labels / copy / class names (e.g. `SalonCard` → `GroomerCard`, "Stilist:innen" → "Groomer:innen") |
| **REBUILD** | Logic needs rewrite (e.g. category-aware components like `CategoryHero`, `CategoryPage`, `category-detect.ts`) |
| **DELETE** | Beauty-category-specific UI with no grooming equivalent (e.g. `NailDesignCard`, `CutHistoryTimeline`, hair-type filter) |
| **GENERALIZE** | Was hardcoded to N beauty cats, refactor to be category-driven from data (e.g. `Header.tsx` `CATEGORIES` constant) |

Output: per-file action plan.

### 1.3 · Rename map (~15 min)

Term-by-term equivalence table. Lock vocabulary so Phase 4 rebuilds use consistent words.

| Beauty (current) | Grooming (target) | Notes |
|---|---|---|
| Salon | Groomer (Hundesalon) | Keep "Salon" if context allows (e.g. URL slug `/salon/[slug]`) but the UI label is "Hundesalon" |
| Stilist:in | Groomer:in / Hundepfleger:in | EN: Stylist → Groomer |
| Coiffeur | (delete as top-level category — services replace) | Coiffeur was both category + service. Now only a service variant: "Schnitt" |
| Haarschnitt | Schnitt | Drop "Haar-" prefix; works for dog hair |
| Färben | (delete from MVP) | Dog grooming doesn't have hair coloring at scale |
| Maniküre | Krallenkürzen | Closest analog |
| Make-up | (delete) | No grooming equivalent |
| Wellness | (delete from category list) | Spa concept doesn't translate to dog grooming MVP |
| hair_type | coat_type | Beauty was profile-level; grooming is pet-level (separate table) |
| suitable_gender | suitable_size_class | Size drives grooming price |
| Beauty in der Schweiz | Hundepflege in der Schweiz | Hero eyebrow swap |
| Schöner aussehen, schneller buchen | Glücklicher Hund, schneller gebucht | Hero h1 — Phase 2 brand can refine |
| salon detail | groomer detail | Page name |
| services.suitable_for (age_group human) | (delete from human profile, add to pet schema if needed for puppy variants v2) | |

Lock this map BEFORE Phase 2 (brand) so brand copy uses the right terminology.

### 1.4 · Database schema delta (~15 min)

Inventory exact changes needed in Phase 3 migrations. Output a SQL preview (not yet executed).

**Tables to DROP / nullify:**
- `profiles.hair_type` column (drop or set null + deprecated)
- `services.suitable_gender` column
- `services.suitable_for` (age_group human enum) column
- Possibly retire beauty-category-specific tables if any exist (check: `nail_designs`?)

**Tables to ALTER:**
- `salons.category` enum — DROP values `coiffeur`/`barbershop`/`nails`/`spa`/`makeup`/`waxing`; ADD `dog_grooming` (or keep multi-cat for future cat expansion: `dog_grooming` + `cat_grooming` + `mobile_grooming`)
- `staff_members.specialties` — generic field stays; content swap only (breed specialties replace hair-type specialties)

**Tables to ADD:**

```sql
-- pets table (informed by Phase 0 §5 + US-leaders audit §4)
CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat')),  -- cat is v2 enum-ready
  breed text,
  is_mixed_breed boolean DEFAULT false,  -- Groomit pattern from US audit
  size_class text NOT NULL CHECK (size_class IN ('xs', 's', 'm', 'l', 'xl')),
  coat_type text CHECK (coat_type IN ('short', 'long', 'double', 'curly', 'wire')),
  coat_condition text CHECK (coat_condition IN ('clean', 'normal', 'matted')),  -- v2 surcharge trigger
  age_years numeric(3, 1),
  allergies text,
  conditions text,
  behavior_notes text,
  vaccinations_current boolean,  -- free-text MVP, structured file v2
  vaccination_record_url text,  -- v2 upload
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- bookings.pet_id (new column)
ALTER TABLE bookings ADD COLUMN pet_id uuid REFERENCES pets(id);

-- services.is_addon (US audit — Polish, Breath Freshener, etc.)
ALTER TABLE services ADD COLUMN is_addon boolean DEFAULT false;
-- services.is_express (Quick Wash from PetSmart/Scenthound)
ALTER TABLE services ADD COLUMN is_express boolean DEFAULT false;
-- services.age_tier (v2 puppy variants)
ALTER TABLE services ADD COLUMN age_tier text CHECK (age_tier IN ('puppy', 'adult', 'senior'));
-- services.suitable_size_class (replaces suitable_gender)
ALTER TABLE services ADD COLUMN suitable_size_class text[];  -- array of XS/S/M/L/XL this service supports

-- salons → "groomers" alias (lower-risk approach)
-- Option A: RENAME TABLE salons TO groomers (breaks all existing queries)
-- Option B: CREATE VIEW groomers AS SELECT * FROM salons (zero migration risk)
-- Phase 1 RECOMMENDATION: Option B alias. Rename salons → groomers in Phase 4 once consumer flow is rebuilt.

-- groomers.guarantees_solen_promise (Phase 2 brand decision — schema-ready)
ALTER TABLE salons ADD COLUMN guarantees_solen_promise boolean DEFAULT false;
```

**Decisions surfaced in §1.4 (Phase 3 will execute these):**

1. **`salons` → `groomers` rename:** Option B (CREATE VIEW alias) recommended for MVP. Lower migration risk. Rename happens in Phase 4 when consumer flow rebuilds against `groomers`.
2. **Category enum:** start with `dog_grooming` only (single value) for MVP. Add `cat_grooming` + `mobile_grooming` to enum in v2 (no migration cost — just add values).
3. **Subscription support:** add `subscriptions` table + `subscription_id` on `bookings` in v2, NOT Phase 3. Schema-aware only.

### 1.5 · Routes plan (~10 min)

| Current route | Phase 4 action | Notes |
|---|---|---|
| `app/[locale]/coiffeur/` | DELETE | Category landing page no longer needed |
| `app/[locale]/barbershop/` | DELETE | Same |
| `app/[locale]/nails/` | DELETE | Same |
| `app/[locale]/spa/` | DELETE | Same |
| `app/[locale]/makeup/` | DELETE | Same |
| `app/[locale]/waxing/` | DELETE | Same |
| `app/[locale]/salon/[slug]/` | **RENAME** → `/groomer/[slug]/` (with redirect) | Salon detail page becomes groomer detail |
| `app/[locale]/salon/[slug]/barber/[barberSlug]/` | DELETE (per-staff page not in MVP) | If staff pages exist, defer to v2 |
| `app/[locale]/salon/[slug]/booking/` | RENAME → `/groomer/[slug]/booking/` | Booking flow |
| `app/[locale]/search/` | RENAME → `/groomers/` (listing) | Or keep `/search` and rebuild result page |
| `app/[locale]/dashboard/{barber-clients,nail-clients,...}` | DELETE | Beauty B2B dashboards |
| `app/[locale]/_components/homepage/Coiffeur.tsx` | RENAME → `GroomerSection.tsx` | Or rebuild |
| `app/[locale]/_components/homepage/{Entdecken,FeaturedStylists,LastMinute,Nearby,RecentlyViewed}.tsx` | RENAME content only | Generic, just swap copy |

**Redirects:** Phase 4 should add 301 redirects from `/salon/*` → `/groomer/*` to preserve any indexed URLs. Probably in `next.config.js`.

### 1.6 · Component reorganization plan (~15 min)

**DELETE entirely** (~25 files):
- `components-legacy/coiffeur/` — beauty-specific
- `components-legacy/barber/` — `CutHistoryTimeline.tsx`, `ExpressRebook.tsx`, etc.
- `components-legacy/nail/` — `NailDesignCard.tsx`, `DesignHistoryTimeline.tsx`, `ShapeLengthPicker.tsx`, `MaterialSelector.tsx`, `InspoBoard.tsx`
- `components-legacy/spa/` — beauty-specific

**RENAME** (find/replace SalonCard → GroomerCard, etc.):
- `components-legacy/salon/SalonCard.tsx` → `GroomerCard.tsx`
- `components-legacy/salon/SalonDetailV3.tsx` → `GroomerDetailV3.tsx`
- `components-legacy/salon/SalonHero.tsx`, `SalonHeader.tsx`, etc. → `Groomer*.tsx`
- `app/[locale]/_components/salon/*` (17 component split files from V2-D53.3) → `_components/groomer/*`

**KEEP 1:1** (no changes):
- `components-legacy/booking/*` — entire booking flow logic
- `components-legacy/payment/*` + Stripe wiring
- `components-legacy/profile/*` (will add pet management UI in Phase 4)
- `components-legacy/auth/*`
- `components-legacy/review/*`
- `components-legacy/map/*`
- `components-legacy/search/*` (except category-detect.ts which needs rebuild)
- `app/[locale]/_components/layout/Header.tsx` — F2 design, just swap CATEGORIES constant

**BUILD NEW** (Phase 4 work):
- `app/[locale]/_components/pet/PetSelector.tsx`
- `app/[locale]/_components/pet/PetProfileForm.tsx`
- `app/[locale]/_components/pet/PetCard.tsx`
- `app/[locale]/_components/groomer/SizeClassFilter.tsx`
- `app/[locale]/_components/groomer/ServiceAddonPicker.tsx` (multi-select for upsells)

### 1.7 · Translation file plan (~10 min)

Audit `messages/*.json` (de, en, possibly fr, it):

- Grep for keys containing `coiffeur|barbershop|nail|spa|haarschnitt|maniküre|stilist`
- Categorize each key: DELETE / RENAME (and what to)
- New keys needed: `pet-profile.*`, `groomer.*`, `services.dog-grooming.*`

**Output:** a per-file rename table, executed in Phase 4 alongside the component renames.

### 1.8 · Synthesize audit doc (~15 min)

Write `_audits/codebase-pet-pivot-audit.md` with these sections:

1. Executive summary (~65-70% reuse, 30% rebuild)
2. Grep findings table (files per beauty term)
3. Per-file action plan (categorized)
4. Rename map (full term table from §1.3)
5. Schema delta (SQL preview from §1.4)
6. Routes plan (from §1.5)
7. Component reorganization (from §1.6)
8. Translation file plan (from §1.7)
9. Risks identified (see below)
10. Phase 3 (schema) + Phase 4 (rebuild) ready-to-execute checklist

### 1.9 · Phase 1 close — lock V2-D58.1 (~5 min)

Add entry to `_tasks/V2_REBUILD_LOG.md`:

```
**2026-05-13 (V2-D58.1 — Phase 1 codebase pivot audit complete)** — 
Detailed beauty→grooming rename map locked. ~65-70% of code survives
1:1 (booking engine, payments, geo, auth, profile, checkout, search,
header structure). ~30% rebuilds: SalonCategory enum, hair_type drop,
suitable_gender drop, 6 category landing pages delete, ~25 beauty-
specific components delete, salon→groomer rename + alias, new pets
table + bookings.pet_id, services.is_addon/is_express/age_tier/
suitable_size_class fields. Salons table stays — Phase 3 creates
`groomers` VIEW as alias for zero migration risk. Subscription support
schema-aware (subscriptions + bookings.subscription_id) deferred to v2,
not Phase 3. Routes plan: delete 6 category pages, rename /salon/* →
/groomer/* with 301 redirects in next.config.js. Translation file
audit + rename plan locked. Critical risks: (R1.1) bookings.suitable_for
references — confirm no downstream queries break when column dropped.
(R1.2) staff_members.specialties content swap manual — no migration
clean way. (R1.3) discovery API bulk-import seed queries beauty-locked
— Phase 4 rewrites to grooming keywords. Phase 2 (brand) and Phase 3
(schema execution) both unblocked. ·
```

---

## Risks identified upfront

| # | Risk | Mitigation |
|---|---|---|
| R1.1 | `services.suitable_for` (age_group) drop may break booking queries downstream | Phase 1 audit greps for every reference; Phase 3 migration includes deprecation period not hard drop |
| R1.2 | `staff_members.specialties` is a content swap, no migration cleanups | Manual seed data + admin UI in Phase 6 |
| R1.3 | `app/api/admin/discovery/bulk-import/route.ts` has beauty-hardcoded seed queries (Gemini) | Phase 4 rewrites with grooming keyword list |
| R1.4 | Route `/salon/[slug]/barber/[barberSlug]/` is per-staff page (V2-D53.4 area) | Defer to v2 — single groomer detail page covers MVP |
| R1.5 | Multi-locale `messages/` may have stale beauty keys in fr/it not yet audited | Phase 1.7 audits ALL locales not just de/en |
| R1.6 | `salons` → `groomers` view alias may confuse PostgREST RLS policies | Phase 3 tests RLS on view before going to prod |
| R1.7 | Phase 2 brand decisions (name, accent) depend on Phase 1 vocabulary lock | Phase 1.3 rename map is fixed BEFORE Phase 2 starts |

---

## What Phase 1 does NOT do

- Does NOT touch any code files (no renames, no deletes, no edits to types.ts)
- Does NOT write any migrations (Phase 3)
- Does NOT make brand decisions (Phase 2)
- Does NOT rebuild any UI (Phase 4)
- Does NOT touch translation files (Phase 4)
- Does NOT delete any beauty migration files in `supabase/migrations/` (git history preserved)

Phase 1 is a **map**, not an **execution**. Output is one .md file + one log entry.

---

## Decision points surfaced in Phase 1 (not blocking — locked at end of Phase 1 with defaults)

1. **`salons` rename strategy:** Option B (VIEW alias) — default. User can override to Option A (hard rename) if preferred.
2. **`/salon/` → `/groomer/` rename + redirects:** default = yes, do redirects in `next.config.js`. User can override to "keep `/salon/`" if SEO concern.
3. **Cat grooming schema-readiness:** include `species` CHECK constraint that accepts `'dog'` and `'cat'` from day 1. Default = yes, cheap insurance.
4. **Subscription schema-readiness:** defer entirely (no `subscriptions` table in Phase 3). Default = defer. User can override to include if Solen Abo is MVP-critical.

These decisions get **locked in the audit doc** with defaults. User reviewing the doc at Phase 1 close can override any of them.

---

## Total Phase 1 estimate

| Sub-step | Duration |
|---|---|
| 1.1 Grep inventory | 25 min |
| 1.2 Categorize findings | 20 min |
| 1.3 Rename map | 15 min |
| 1.4 Schema delta | 15 min |
| 1.5 Routes plan | 10 min |
| 1.6 Component reorganization | 15 min |
| 1.7 Translation file plan | 10 min |
| 1.8 Synthesize audit doc | 15 min |
| 1.9 Phase 1 close | 5 min |
| **Total** | **~2 hrs** |

Slightly over master plan estimate (1-2 hrs) due to US-leaders audit adding new fields (is_addon/is_express/age_tier, is_mixed_breed, coat_condition). Acceptable scope creep.

---

## What approves Phase 1 to execute

User says "go" / "approve" / "ship it" → execute 1.1 through 1.9 in sequence. No further questions needed during execution; if anything is genuinely ambiguous (very unlikely at the file-grep level), default per "Decision points" above.
