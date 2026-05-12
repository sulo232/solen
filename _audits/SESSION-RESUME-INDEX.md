# Session Resume Index · Solen → Dog Grooming Pivot

> Last updated 2026-05-13. If you're reading this after a context compaction
> (or in a fresh session) and need to pick up where the pivot work left off
> — start here. Read the 4 files below in order, then check "Current state"
> + "Next action" to know what to do.

---

## Read in this order (10-15 min total)

1. **`_audits/pet-grooming-scope-teardown-v2.md`** — the super-synthesis master doc
   - §1–§10: original Phase 0 (market context, competitors, service catalog, etc.)
   - §11–§24: 14 sub-phase summaries with locked decisions (booking, mobile, reviews, pricing, search, onboarding, notifications, adjacent, edge-cases, SEO, B2B, photography, loyalty, trust)
   - §25: **consolidated MVP feature spec + Phase 3 SQL preview + Phase 4 component checklist** — the single source of truth for execution

2. **`_audits/PHASE-1-codebase-pivot-deep-plan.md`** — what's next (Phase 1: codebase pivot audit)
   - 9 sub-steps from grep inventory → V2-D58.1 lock
   - ~2 hrs, READ-ONLY (no code changes)
   - 4 decisions with defaults (salons→groomers VIEW alias, /salon→/groomer redirects, cat-ready species enum, subscription deferred v2)

3. **`/Users/sulo/.claude/plans/immutable-shimmying-meerkat.md`** — master pivot plan (7 phases overview)
   - Phase 0 ✅ DONE (v1 + extensions)
   - Phase 1 — codebase audit (deep plan ready, awaiting user approval)
   - Phase 2-6 — brand / schema / consumer flow / marketing / B2B

4. **`_tasks/V2_REBUILD_LOG.md`** top 2 entries — V2-D58.0 + V2-D58.0.1 status snapshots

---

## Current state

**Pivot direction locked 2026-05-13:** Solen → dog grooming booking, Fresha-style, Basel-first. Market validation: no CH-localized dog grooming marketplace exists; existing groomers prefer WhatsApp over web booking; ~65-70% of Solen codebase survives the pivot (booking engine, payments, profiles, auth, search, F2 header structure).

**Phase 0 status:** COMPLETE.
- v1 = 7 sub-steps (0.1 Fresha UX → 0.7 V2-D58.0 lock) ✅
- US-leaders feature audit (PetSmart/Petco/Groomit/Scenthound) ✅
- v2 extensions = 14 parallel research agents (0.8 booking deep-dive → 0.21 trust+safety) + super-synthesis + V2-D58.0.1 lock ✅
- ~10 hrs of research, 16 audit deliverables in `_audits/`

**Phase 1 status:** Deep plan locked, awaiting user approval to execute.

---

## Next action (user decision)

User needs to choose:

1. **Approve Phase 1 execution** ("go" / "run Phase 1") → I execute 9 sub-steps (grep inventory → rename map → schema delta → routes plan → component reorg → translations → synthesis → V2-D58.1 lock). Output: `_audits/codebase-pet-pivot-audit.md`. ~2 hrs. READ-ONLY (no code touched). **No commits without further authorization per `feedback_never_auto_commit.md`.**

2. **Review Phase 0 v2 super-synthesis first** at `_audits/pet-grooming-scope-teardown-v2.md` (especially §25). Catch anything to override before Phase 1 builds on it.

3. **Adjust Phase 1 deep plan** before execution — change the 4 surfaced defaults (salons→groomers alias strategy, route renames, species enum, subscription deferral).

---

## Locked decisions you can't lose (consolidated from v2 super-synthesis §25)

| Domain | Lock |
|---|---|
| **Pivot direction** | Solen → dog grooming, Basel-first, Fresha-style marketplace |
| **MVP service catalog** | 9 services: Bad / Quick Wash (new from US audit) / Bürsten / Vollverwöhnpaket / Schnitt / Krallenkürzen / Pfotenpflege / Ohrenreinigung / Zahnpflege. Size-class-priced on Schnitt/Voll/Deshedding. |
| **Pet profile MVP fields** | 5 required (name, species, breed, size_class, coat_type) + 4 optional (age, allergies, temperament, vaccinations free-text) + Mixed Breed checkbox + optional photo |
| **Booking flow** | 8 steps first-time / 5-6 returning. OpenTable slot-pills on cards + Doctolib 1-task-per-screen + StyleSeat magic-link guest claim. CHF 20 platform-default deposit. 24h free cancel / 50% within 24h / 100% no-show + 30min grace. |
| **Geographic launch** | Basel + 5-10km radius. Zürich after 100 bookings. |
| **MVP filter set (5 chips)** | Distance / Price / 4★+ rating / Availability / Service-type. Inline chips + drawer + bottom-sheet mobile. URL persistence. Default sort "Recommended". |
| **Mobile UX** | 64px sticky 1-bar header / hero-pill search / 2-col 165px salon cards / sticky-bottom CTA on detail not homepage |
| **Reviews UX** | Pet-name-as-avatar (Groomit pattern) / rating-tier histogram / lightbox gallery / owner-response deferred v2 |
| **Pricing presentation** | "ab CHF X · 60 Min." on cards / size-class modal after pick / à-la-carte add-ons / line-item surcharges (never silent) |
| **Onboarding** | Email + Google + Apple OAuth (skip Facebook) / pet profile deferred to first booking / CHF 10 first-booking auto-discount |
| **Notifications** | Resend (email) + eCall.ch (SMS, CH-compliant) / 24h reminder + 2h opt-in / post-visit review 24h after / push deferred v2 |
| **SEO** | URL pattern `/[locale]/[city]/hundepflege/[slug]` / Schema.org LocalBusiness + Service[] + AggregateRating / de-CH + en-CH at MVP / city pages: Basel + ZH + BE + LU × 2 locales = 8 pages |
| **Trust + safety** | Hand-verified Basel groomers at MVP / CHF 1M Berufshaftpflicht minimum / EFZ Tierpfleger / SVBT badge as CH differentiator / 5-promise Solen Versprechen: "Geprüfte Hygiene · Tierfreundlich · Versichert · Faire Preise · 100% kostenlose Stornierung 24h" |
| **Photography** | Lifestyle real-photo / warm-natural grade / 70% dog-with-human / Swiss-breed rotation mandatory (Berner / Schäferhund / Pinscher / Dackel + mixes alongside Golden/Labrador) |
| **Phase 6 B2B model** | Zero base fee + 18% first-booking-only commission + min CHF 5 + daily Stripe Connect payouts. Deferrable. |
| **Solen Abo v2** | 2 tiers (Basic CHF 39 / Plus CHF 79) / 4-8 week cadence configurable per pet / dual-sided CHF 10 referral / schema-aware in Phase 3, ship v2 |
| **Brand direction (Phase 2 decisions still OPEN)** | Wellness > Luxury positioning. Solen-rebrand vs keep / display font / accent color all deferred to Phase 2. |

---

## Where files live

```
_audits/
├── pet-grooming-scope-teardown-v2.md   ← SUPER-SYNTHESIS (read first)
├── pet-grooming-scope-teardown.md      ← Phase 0 v1 (preserved)
├── 2026-05-13-us-pet-grooming-leaders-audit.md
├── PHASE-0-EXTENSIONS-deep-plan.md     ← what got executed in v2
├── PHASE-1-codebase-pivot-deep-plan.md ← what's NEXT
├── booking-flows.md                    ← sub-phase 0.8
├── mobile-ux-patterns.md               ← 0.9
├── reviews-photos-ux.md                ← 0.10
├── pricing-presentation.md             ← 0.11
├── search-filter-ux.md                 ← 0.12
├── onboarding-flow.md                  ← 0.13
├── notifications-ux.md                 ← 0.14
├── adjacent-booking-patterns.md        ← 0.15
├── empty-states-edge-cases.md          ← 0.16
├── seo-patterns.md                     ← 0.17
├── b2b-groomer-side.md                 ← 0.18
├── photography-brand-patterns.md       ← 0.19
├── loyalty-subscription-patterns.md    ← 0.20
├── trust-safety-mechanics.md           ← 0.21
└── pet-refs/
    ├── *.jpeg (Phase 0 v1 reference screenshots)
    └── mobile/*.jpeg (8 mobile-width screenshots from 0.9)

_tasks/V2_REBUILD_LOG.md  ← top 2 entries: V2-D58.0 + V2-D58.0.1

/Users/sulo/.claude/plans/immutable-shimmying-meerkat.md  ← master plan

~/.claude/projects/-Users-sulo-Documents-solen/memory/
├── MEMORY.md
├── feedback_never_auto_commit.md  ← CRITICAL: don't commit without permission
├── feedback_auto_push.md          ← push AFTER an authorized commit
├── feedback_check_skills_first.md
├── feedback_plain_english.md
├── feedback_recommend_and_visualize.md
├── feedback_no_vercel_deploy.md
└── feedback_dont_invent.md
```

---

## Critical rules to remember (from memory files)

1. **NEVER `git commit` or `git push` without explicit user permission.** Edit + stage freely; STOP before commit and ask. (`feedback_never_auto_commit.md`)
2. **Always plain English.** Short sentences, no preamble, no hedging, match user's casual register. (`feedback_plain_english.md`)
3. **For visual/design questions, check skills first.** `huashu-design` for variation exploration, `screenshot-spec` for precision matching, `site-teardown` for URL analysis. (`feedback_check_skills_first.md`)
4. **Don't invent.** When values aren't locked (hex, sizes, copy), ASK. (`feedback_dont_invent.md`)
5. **Lead with recommendation, visualize visual Qs.** (`feedback_recommend_and_visualize.md`)
6. **Commits include `[skip vercel]` suffix.** No Vercel auto-deploy. (`feedback_no_vercel_deploy.md`)

---

## Quick orientation checklist for resuming

After reading the 4 files at top, you should be able to answer:

- [ ] What's the pivot? (Solen → dog grooming)
- [ ] Why? (no CH dog grooming marketplace; ~65-70% code survives)
- [ ] What's the 9-service MVP catalog?
- [ ] What's the booking flow shape? (8 steps, OpenTable slot-pills, etc.)
- [ ] What's locked vs still open in Phase 2 brand?
- [ ] What does Phase 1 do? (codebase audit, READ-ONLY)
- [ ] What does Phase 1 NOT do? (no commits, no migrations, no renames)

If yes to all → you're ready to execute Phase 1 (or any later phase) per the master plan cadence.
