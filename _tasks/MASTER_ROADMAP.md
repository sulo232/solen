# SOLEN — Master Roadmap

**Generated:** 2026-04-22
**Based on:** forensic git archaeology (DESIGN_AUDIT_MASTER.md, ROADMAP_AUDIT.md, INVENTORY_FULL.md, BACKEND_NEEDS_UI.md)

## The Goal, Stated Plainly

Solen = **Switzerland's default beauty & wellness booking marketplace.** Basel is launch city (focused GTM). Zürich + Bern next. The platform itself supports any Swiss city from day 1 — Basel is not a technical constraint, it's a go-to-market focus.

**Market:** Switzerland-wide from day 1 on the platform, Basel-first in acquisition/marketing.
**Categories:** Coiffeur · Barber · Nails · Spa · Makeup · Waxing.
**Two sides:** Consumer marketplace (solen.ch) + Salon partner dashboard.
**Monetization:** commission on bookings (Stripe Connect), subscription tiers for salons, referral economics.

## Table of Contents

- [Phase 0 — Design System Lock](#phase-0) *(in progress, ~95%)*
- [Phase 1 — Ship-Blockers & Polish](#phase-1) *(1-2 weeks)*
- [Phase 2 — Scraped Directory Flywheel](#phase-2) *(1 week)*
- [Phase 3 — Basel Public Launch](#phase-3) *(2-3 weeks)*
- [Phase 4 — Moat Features](#phase-4) *(rolling, 4-8 weeks, parallel with 3)*
- [Phase 5 — Swiss Expansion](#phase-5) *(2-4 weeks after Basel stable)*
- [Phase 6 — Growth & Network Effects](#phase-6) *(ongoing)*
- [Phase 7 — Scale / DACH / EU](#phase-7) *(6+ months out)*
- [Appendix: Non-negotiables, risks, ops](#appendix)

---

## <a id="phase-0"></a> PHASE 0 — Design System Lock (current)

### Goal
Clean repo, single design source of truth, ready-for-Claude-Design bundle.

### Exit criteria
- ✅ CLAUDE.md → 194 lines, points to `_tasks/SOLEN_DESIGN.md`
- ✅ SOLEN_DESIGN.md = single canonical design spec (coral + cream + Bebas + Fraunces + DM Sans)
- ✅ `public/solen-coral.html` = living preview, matches spec
- ✅ Retired design artifacts archived/deleted (V2 green+peach, Syne, glass-everywhere, blobs-everywhere)
- ✅ Build green on main (`0bd3daf6`)
- ✅ Branch cleanup — 5 dead branches deleted
- ⏸️ Reply badges shipped (`633fb66e`)
- ⏸️ StaffPortfolio shipped (`0bd3daf6`)
- 🟡 Claude Design ready — awaiting quota reset to iterate UI

### Remaining work
- Claude Design sessions to polish specific components that are still rough
- Potentially: photographer brief for real salon cover photos (replaces gradient placeholders)

---

## <a id="phase-1"></a> PHASE 1 — Ship-Blockers & Polish (1-2 weeks)

### Goal
Fix everything that blocks shipping Basel to real customers.

### Ship-blocker categories

#### 1.1 Payment flow (Stripe)
- [ ] End-to-end test: Stripe Payment Intent → booking confirm → webhook → salon notification
- [ ] TWINT support (Swiss mobile payment — huge adoption, ~70% of Swiss consumers)
- [ ] Cancellation refund logic (automatic if cancelled within salon's policy window)
- [ ] Tip flow (`/tip/[bookingId]/page.tsx`) end-to-end
- [ ] Walk-in pay (`/walk-in-pay/page.tsx`) end-to-end
- [ ] Gift card purchase + redemption (`/vouchers/buy`)
- [ ] Stripe Connect onboarding for salon owners (KYC docs, bank account link)
- [ ] Dispute webhook handling (groundwork for Phase 4 dispute flow)

#### 1.2 i18n completeness (DE primary, EN/FR/IT secondary)
- [ ] Audit: all user-facing strings pass through `useTranslations` — no hardcoded German
- [ ] Missing-key detection CI check
- [ ] Baseldeutsch dialect tones in DE strings (voice sample: "schnitt n pflege fürs haar")
- [ ] Booking confirmation emails in all 4 languages
- [ ] SMS templates in all 4 languages (seven.io integration)
- [ ] Legal pages (AGB, Datenschutz, Impressum) in all 4 languages

#### 1.3 Mobile UX polish
- [ ] `FloatingNavPill` → re-verify active state + backdrop blur on iOS Safari
- [ ] Bottom-sheet gestures (swipe to close, drag handle visible)
- [ ] Skeleton states for every async fetch
- [ ] Error boundaries on critical pages (salon detail, booking, checkout)
- [ ] Offline PWA fallback testing
- [ ] Touch targets ≥44px everywhere (WCAG requirement)
- [ ] Loading states don't flash-of-unstyled-content

#### 1.4 Known UI gaps (from BACKEND_NEEDS_UI.md — ~40 items)
Key unshipped UIs where backend exists:
- [ ] Salon owner: booking calendar drag-to-reschedule
- [ ] Salon owner: availability override per day
- [ ] Customer: favorites sync across devices
- [ ] Customer: notification preferences (email/SMS/push toggles)
- [ ] Customer: saved payment methods management
- [ ] Customer: booking reminders opt-in UI
- [ ] Customer: review prompt after service (currently backend only)
- [ ] Admin: moderation queue UI for flagged reviews
- [ ] Admin: salon approval workflow
- *(full list in `_tasks/BACKEND_NEEDS_UI.md` — ~40 items)*

#### 1.5 Consolidate `INCOMPLETE_FEATURES.md`
Currently has 1 entry. Consolidate from:
- `BACKEND_NEEDS_UI.md` (~40 items)
- Deleted moat roadmap entries (10+ items)
- Known bugs in `LESSONS_LEARNED.md`
- Outcome: proper prioritized backlog with SLA + owner + dependency graph

### Exit criteria
- All Stripe flows confirmed end-to-end with real Stripe test mode
- Zero hardcoded German strings (CI-enforced)
- Mobile Lighthouse score ≥90 across core pages
- Build green, no TypeScript errors, no runtime warnings in dev mode

---

## <a id="phase-2"></a> PHASE 2 — Scraped Directory Flywheel (1 week)

### Goal
Populate the platform with 100-300 Basel salons as **passive profiles** (`salons.source='scraped'`). SEO-indexed. Converts anonymous Google traffic to "hey this isn't my business, can I claim it?" inquiries.

### Why this matters
- Content flywheel — Google indexes "[Salon Name] Basel" pages, Solen ranks
- Passive profiles convert to paid partnerships when salons see their listing
- Competitive moat — Fresha can't easily replicate Solen's hyperlocal Basel inventory
- Without scraped inventory, homepage + /search are dead pages pre-launch

### Work items
- [ ] Scraper: Google Maps + existing salon directories (Lokal.ch, Local.ch, Comparis)
- [ ] Scraper output schema: name, address, geo, opening_hours, phone, category, photos
- [ ] Data entry: 100-300 Basel salons populated
- [ ] "Claim this listing" flow for salon owners
- [ ] Passive profile UI — clear "unverified" badge + "are you the owner?" CTA
- [ ] SEO: dynamic sitemap.xml including scraped salons
- [ ] SEO: structured data (JSON-LD `@type: BeautySalon`) per salon
- [ ] GA4 + Search Console verification
- [ ] Geo-targeted blog content: "Top 10 Coiffeure in Kleinbasel", "Beste Maniküre in Gundeldingen" etc.

### Exit criteria
- 100+ Basel salons live with SEO
- Claim flow works end-to-end
- Organic impressions starting to register in Search Console

---

## <a id="phase-3"></a> PHASE 3 — Basel Public Launch (2-3 weeks)

### Goal
Convert 5-10 scraped salons to paying partners. Go-live with public marketing. Enable ads + referral program.

### Gating threshold (DO NOT launch before)
- ≥5 active paying partner salons
- All Phase 1 ship-blockers resolved
- Stripe Connect payouts verified with real bookings
- Vercel production re-enabled (re-revert commit `1f3036de`)

### Work items

#### 3.1 Partner onboarding
- [ ] Sales pipeline: target list of 30-50 "ideal first partner" salons
- [ ] Onboarding kit: welcome email, video walkthrough, quick-start checklist
- [ ] White-glove onboarding for first 10 partners (Solen team manually sets up services/staff/hours)
- [ ] Partner success contact (email + WhatsApp availability)

#### 3.2 Marketing infrastructure
- [ ] Launch landing page (separate from logged-in homepage)
- [ ] Instagram account + launch content calendar
- [ ] Press: outreach to Basel lifestyle blogs (Tageswoche, Basler Zeitung)
- [ ] Influencer seeding: 10 Basel beauty influencers get free service + Solen share
- [ ] Google Ads campaigns (Basel geo-targeted)
- [ ] Meta Ads (Basel geo-targeted, lookalike of beauty-salon interest audiences)

#### 3.3 Referral program
- [ ] 10 CHF credit per referred friend who books
- [ ] Referral code generation + tracking (already built, verify wiring)
- [ ] Referral leaderboard (optional gamification)

#### 3.4 Pre-launch analytics setup
- [ ] PostHog funnels for: discover → salon → booking → payment → confirmed
- [ ] Drop-off alerts at each stage
- [ ] Daily/weekly KPI dashboard for Solen team

### Exit criteria
- 5+ paying partner salons live
- First 50 real bookings processed
- Ads + referral running
- Production promote done, Vercel auto-deploy re-enabled

---

## <a id="phase-4"></a> PHASE 4 — Moat Features (rolling, parallel with Phase 3)

### Goal
Ship the features that differentiate Solen from Fresha/Treatwell and are hard to copy.

### Features (priority-ordered)

#### 4.1 🔥 Chat-as-a-product (2 weeks)
- [ ] QuickReplyChips: salon owners get 1-tap templates ("Dankeschön!", "Bestätigt", "Wir melden uns") — already coded, verify wiring
- [ ] AISuggestion: Gemini-powered reply suggestions contextual to booking — already coded, needs GEMINI_API_KEY in Vercel env
- [ ] Photo-to-quote: customer sends style inspo photo → salon AI-drafts price estimate
- [ ] Smart routing: chat auto-escalates if no reply within 2h
- [ ] Unread count notifications (push + email)
- [ ] Chat-as-funnel: "send inspiration photo to this salon" CTA on every discovery item

#### 4.2 🔥 Client safety tags / allergy warnings (3-4 days)
- [ ] DB migration: `client_allergy_tags` table (or JSON on booking)
- [ ] Customer: add allergies to profile (PPD, parabens, sulfates, latex, etc.)
- [ ] Salon-side: allergy warning appears on booking immediately
- [ ] Legal-grade display: must acknowledge before service
- [ ] **Critical for liability** in Swiss consumer-protection + health regulations

#### 4.3 AI nail art gallery (already partially built)
- [ ] fal.ai integration: customer describes design → AI generates 4 nail art options
- [ ] Save to inspo board
- [ ] Send to nail tech as booking reference
- [ ] Nail tech dashboard: "client's wish" view

#### 4.4 Solen Score per salon (1 week)
- [ ] Algorithm: recency × rating × review volume × response time × cancellation rate
- [ ] Displayed as 0-100 score on salon card + detail page
- [ ] Editorial override for featured salons
- [ ] Transparency: "How is this calculated?" link

#### 4.5 Dispute flow (1-2 weeks)
- [ ] Migration 038: `price_disputes` table
- [ ] Customer: "Report issue" on completed bookings
- [ ] Structured reasons: hair_length, extra_treatment, materials, overtime
- [ ] 72h auto-approval window
- [ ] Admin dashboard at `/dashboard/disputes`
- [ ] Stripe payment hold during dispute
- [ ] Email notifications to both parties

#### 4.6 Gold pins on map (1-2 days)
- [ ] Featured/premium salons get gold map pin vs default coral
- [ ] Tier-based rendering (Solen Exclusive badge equivalent)

#### 4.7 Loyalty confetti (1 week)
- [ ] 10-stamp loyalty card per salon (barber vertical already has this)
- [ ] Celebration animation on 10th booking
- [ ] Free service voucher auto-generated
- [ ] Salon control over reward threshold

### Exit criteria
- 4.1 + 4.2 live (chat + allergies — highest ROI)
- At least 3 of 4.3-4.7 live before Phase 6 growth push

---

## <a id="phase-5"></a> PHASE 5 — Swiss Expansion (2-4 weeks after Basel stable)

### Goal
Open Zürich + Bern. Multi-city search. i18n complete.

### Work items
- [ ] Scrape Zürich + Bern salon directories (Phase 2 flywheel, rinse+repeat)
- [ ] Multi-city search UX (user picks city, default to geo-detected)
- [ ] City-specific landing pages: /zurich, /bern (SEO)
- [ ] Launch kits per city: local influencer seeding, local press
- [ ] i18n: verify all 4 languages, especially FR (Lausanne/Geneva later)
- [ ] Partner sales: repeat Basel playbook per city
- [ ] Unified cross-city analytics in PostHog

### Exit criteria
- 5+ partners per city
- Cross-city bookings possible (user in Basel books salon in Zürich while traveling)
- City picker is prominent in header/search

---

## <a id="phase-6"></a> PHASE 6 — Growth & Network Effects (ongoing)

### Goal
Turn the marketplace from bookings-only into a daily-use habit.

### Plays

#### 6.1 Discovery as engagement (not just conversion)
- [ ] Daily "inspiration" push (like a beauty version of TikTok For You)
- [ ] Save inspiration to boards
- [ ] Share boards with friends
- [ ] Discovery → booking conversion rate target: 15%+

#### 6.2 Rebook automation
- [ ] Smart rebook reminders based on visit cycle (every 4-6 weeks for hair, 3-4 for nails)
- [ ] 1-click rebook from email/push notification
- [ ] Waitlist: notify when cancellations open up

#### 6.3 Community
- [ ] Review photos (already supported)
- [ ] Before/after comparisons
- [ ] User-generated discovery content (with moderation)
- [ ] "Who in my network just booked X?" (privacy-gated)

#### 6.4 Loyalty across salons (platform-level)
- [ ] Solen Points earned per booking
- [ ] Points → CHF discount on future booking at any salon
- [ ] Gamified tiers (Bronze/Silver/Gold)

#### 6.5 Gift economy
- [ ] Buy a friend a haircut as a gift
- [ ] Corporate gift cards (B2B revenue)
- [ ] Wedding/birthday gift workflows

---

## <a id="phase-7"></a> PHASE 7 — Scale / DACH / EU (6+ months out)

### Goal
Beyond Switzerland if/when ready.

### Prerequisites
- Switzerland profitable or breakeven
- Strong LTV:CAC ratio
- Brand recognition in CH
- Multi-currency + multi-language infrastructure mature

### Expansion markets (priority order)
1. Austria (shares CHF payment habits, German primary)
2. Southern Germany (Freiburg, Stuttgart, Munich — geographic adjacency, German)
3. France (starting Lyon or Strasbourg — French speakers, FR i18n exists)
4. Italy (Milan — IT i18n exists)

### New work categories (NOT in scope now)
- Multi-currency pricing
- Regional payment methods (SEPA, Bancontact, etc.)
- Country-specific legal pages
- Per-country tax/VAT handling
- Compliance per market

---

## <a id="appendix"></a> APPENDIX

### A. Non-negotiables (never compromise on)
- **Swiss-warm voice** — never generic, never corporate, never "#beautybooking"
- **Data safety for allergies/health** — legal-grade display, explicit acknowledgment
- **Payment reliability** — booking confirmed = money flows, no partial states
- **Coral brand identity** — retain `#E8624A` + cream even during design iterations
- **Mobile-first** — desktop is a bonus, phone is the customer's reality
- **Open booking inventory** — no "call to confirm" flows, everything is bookable live

### B. Known risks
| Risk | Mitigation |
|------|-----------|
| Basel saturation before expanding | Start Zürich work at 50% Basel saturation (not 100%) |
| Salon churn in first 3 months | White-glove onboarding, weekly check-in for first month |
| Payment disputes overwhelm support | Phase 4 dispute flow must ship before launch scales |
| Stripe Connect onboarding friction | Pre-fill max data, KYC support offered to each partner |
| SEO slowness (passive profiles index takes 6-8 weeks) | Start Phase 2 scrape BEFORE Phase 3 launch by 8+ weeks |
| Hardcoded German strings leak | CI check + weekly manual audit |
| Claude Design output drift | Always validate against SOLEN_DESIGN.md + lock decisions in §20 |

### C. Operational / housekeeping
- **Vercel auto-deploy** is currently OFF from main (commit `1f3036de`). Re-enable at Phase 3 launch.
- **Dual Vercel projects** (solen + solen.ch) — consolidate to one before Phase 3 to save build minutes.
- **Dead branches** — delete after Phase 1: modern-ui-design (errored v0), frosted-glass-components-EiGsa, claude/debug-api-errors-mh2yT (merged), claude/review-solen-design-rules-9yQ1s (merged), claude/document-solen-concepts-zUc0S.
- **moat/session3** — extract last useful commits then archive with tag `archive/moat-session3-2026-04-22`.
- **feature/customer-frontend** + **feature/salon-dashboard** — mostly merged, delete after confirmation.
- **`INCOMPLETE_FEATURES.md`** — needs Phase 1.5 consolidation (40+ items from BACKEND_NEEDS_UI).

### D. Target metrics per phase
| Phase | Metric | Target |
|-------|--------|--------|
| Phase 1 | Build green, no regressions | 100% |
| Phase 2 | Scraped Basel salons live | 100-300 |
| Phase 3 | Paying partners + bookings | 5-10 / 50+ |
| Phase 4 | Moat features shipped | 4 of 7 |
| Phase 5 | Per-city partners | 5+ each |
| Phase 6 | DAU / WAU / MAU | TBD, set at Phase 5 end |
| Phase 7 | International partners | 10+ per new country |

---

## Decision log / open questions

1. **Market scope confirmed:** Switzerland from day 1, Basel-first for GTM. Platform does not geofence users/salons to Basel only — any Swiss city can sign up and book now, Basel gets marketing focus.
2. **Claude Design usage:** iterate on specific components as they surface. Not a replacement for SOLEN_DESIGN.md — it generates within the locked system.
3. **Hard vs soft deadlines:** Phase 1-3 are stacked sequentially. Phase 4 can parallelize with 3. Phase 5+ after 3 stable.
4. **Who owns what:** TBD — assumes solo dev + AI assist through Phase 3. Phase 4+ likely needs domain specialists (fal.ai tuning, legal for allergy, Stripe Connect support).
5. **Budget:** not documented anywhere in git. Need to define before Phase 3 ads budget.

---

**Status line:**
We are in Phase 0 wrap. Next meaningful work = Phase 1.1 (payment flow end-to-end test + TWINT integration) OR Phase 1.5 (consolidate INCOMPLETE_FEATURES). Both are unblocking future phases.
