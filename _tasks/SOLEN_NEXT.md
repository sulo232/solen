# SOLEN — What's Next

**Living checklist of everything we still need to ship.** Roadmap, deferred features, launch playbook, risks, metrics, ops state.

> **Active phase status lives in `_tasks/V2_REBUILD_LOG.md` `## Status` (one-liner).** This file does NOT track what phase we're currently in — it tracks **what work exists** to be done.

> **Maintenance discipline:** when an item ships, strike it from this file in the same commit (V2-D05 incremental cleanup pattern). Stale entries here = drift.

> **Authority:** see `_tasks/SOLEN_LIVE_TRUTH.md` §0c.1 row "Roadmap, deferred features, risk register, ops state". Created via V2-D38 (2026-05-09) from MASTER_ROADMAP.md keep/crop triage.

---

## §1 · Quality bar

**The shipping test:** "Would a Swiss salon owner trust this platform at first glance?"

If the answer is "almost," it's not ready.

---

## §2 · Locked strategic decisions

These are not preferences — they're load-bearing decisions that affect every phase below.

- **Market scope (V2-D38):** Switzerland from day 1, Basel-first GTM. Platform supports any Swiss city; Basel gets focused acquisition/marketing. Not geofenced.
- **Sequencing rule (V2-D38):** Phases 1-3 are sequential. Phase 4 can parallelize with Phase 3. Phase 5+ only after Phase 3 stable.

---

## §3 · Pre-launch UI work (carries from MASTER_ROADMAP Phase 1-2)

### §3.1 · Component polish

- [ ] Salon detail page — photo gallery, services, reviews, sticky booking sidebar
- [ ] Booking wizard — step-by-step matching V3 spec
- [ ] Checkout page — Stripe card form + tip + order summary
- [ ] Dashboard (salon-owner side) with V3 tokens
- [ ] All filter pills, modals, bottom sheets
- [ ] Empty states, skeletons, toasts, loading states
- [ ] Footer — 4 columns desktop, accordion mobile
- [ ] Cookie banner (Phase 0 §F.8)
- [ ] 404 + error pages

### §3.2 · Mobile UX bar

- [ ] Mobile Lighthouse ≥90 across core pages
- [ ] Touch targets ≥44px everywhere (WCAG)
- [ ] Active-scale + tap bounce on every interactive element
- [ ] Backdrop blur verified on iOS Safari (Android < 12 fallback to flat)
- [ ] Bottom-sheet gestures (swipe to close, drag handle)
- [ ] FloatingNavPill — re-verify active state + backdrop blur on iOS Safari
- [ ] Skeleton states for every async fetch
- [ ] Error boundaries on critical pages (salon detail, booking, checkout)
- [ ] Offline PWA fallback testing
- [ ] Loading states don't flash-of-unstyled-content

### §3.3 · Payment ship-blockers (Stripe)

- [ ] End-to-end test: Payment Intent → booking confirm → webhook → salon notification
- [ ] **TWINT support** (Swiss mobile payment — ~70% Swiss adoption; non-negotiable)
- [ ] Cancellation refund logic (automatic if cancelled within salon's policy window)
- [ ] Tip flow (`/tip/[bookingId]/page.tsx`) end-to-end
- [ ] Walk-in pay (`/walk-in-pay/page.tsx`) end-to-end
- [ ] Gift card purchase + redemption (`/vouchers/buy`)
- [ ] Stripe Connect onboarding for salon owners (KYC docs, bank account link)
- [ ] Dispute webhook handling (groundwork for §4.5 dispute flow below)

### §3.4 · i18n completeness (DE primary, EN/FR/IT secondary)

- [ ] Audit: all user-facing strings pass through `useTranslations` — no hardcoded German
- [ ] Missing-key detection CI check
- [ ] Baseldeutsch dialect tones in DE strings (sample voice: "schnitt n pflege fürs haar")
- [ ] Booking confirmation emails in all 4 languages
- [ ] SMS templates in all 4 languages (seven.io integration)
- [ ] Legal pages (AGB, Datenschutz, Impressum) in all 4 languages

### §3.5 · BACKEND_NEEDS_UI gaps (~10 specific items)

Where backend exists but UI is missing:

- [ ] Salon owner: booking calendar drag-to-reschedule
- [ ] Salon owner: availability override per day
- [ ] Customer: favorites sync across devices
- [ ] Customer: notification preferences (email/SMS/push toggles)
- [ ] Customer: saved payment methods management
- [ ] Customer: booking reminders opt-in UI
- [ ] Customer: review prompt after service (currently backend only)
- [ ] Admin: moderation queue UI for flagged reviews
- [ ] Admin: salon approval workflow

### §3.6 · Photographer brief

- [ ] Real salon cover photos (replace gradient placeholders) — needs photographer for Basel salons

---

## §4 · Scraped directory flywheel

### §4.1 · Why this matters

- **SEO flywheel** — Google indexes "[Salon Name] Basel" pages, Solen ranks
- **Conversion** — passive profiles convert to paid partnerships when salons see their listing
- **Competitive moat** — Fresha can't easily replicate Solen's hyperlocal Basel inventory
- **Pre-launch density** — without scraped inventory, homepage + /search are dead pages

### §4.2 · Work items

- [ ] Scraper: Google Maps + existing salon directories (Lokal.ch, Local.ch, Comparis)
- [ ] Scraper output schema: name, address, geo, opening_hours, phone, category, photos
- [ ] Data entry: 100-300 Basel salons populated
- [ ] "Claim this listing" flow for salon owners
- [ ] Passive profile UI — clear "unverified" badge + "are you the owner?" CTA
- [ ] SEO: dynamic sitemap.xml including scraped salons
- [ ] SEO: structured data (JSON-LD `@type: BeautySalon`) per salon
- [ ] GA4 + Search Console verification
- [ ] Geo-targeted blog content: "Top 10 Coiffeure in Kleinbasel", "Beste Maniküre in Gundeldingen"

### §4.3 · Exit criteria

- 100+ Basel salons live with SEO indexed
- Claim flow works end-to-end
- Organic impressions starting to register in Search Console

---

## §5 · Public launch playbook

### §5.1 · Gating threshold (DO NOT launch before)

- ≥5 active paying partner salons
- All §3 ship-blockers resolved
- Stripe Connect payouts verified with real bookings
- Vercel production re-enabled (re-revert commit `1f3036de` per §10.1)

### §5.2 · Partner onboarding

- [ ] Sales pipeline: target list of 30-50 "ideal first partner" salons
- [ ] Onboarding kit: welcome email, video walkthrough, quick-start checklist
- [ ] White-glove onboarding for first 10 partners (Solen team manually sets up services/staff/hours)
- [ ] Partner success contact (email + WhatsApp availability)

### §5.3 · Marketing infrastructure

- [ ] Launch landing page (separate from logged-in homepage)
- [ ] Instagram account + launch content calendar
- [ ] Press: outreach to Basel lifestyle blogs (Tageswoche, Basler Zeitung)
- [ ] Influencer seeding: 10 Basel beauty influencers get free service + Solen share
- [ ] Google Ads campaigns (Basel geo-targeted)
- [ ] Meta Ads (Basel geo-targeted, lookalike of beauty-salon interest audiences)

### §5.4 · Referral program

- [ ] 10 CHF credit per referred friend who books
- [ ] Referral code generation + tracking (already built — verify wiring)
- [ ] Referral leaderboard (optional gamification)

### §5.5 · Pre-launch analytics

- [ ] PostHog funnels for: discover → salon → booking → payment → confirmed
- [ ] Drop-off alerts at each stage
- [ ] Daily/weekly KPI dashboard for Solen team

### §5.6 · Exit criteria

- 5+ paying partner salons live
- First 50 real bookings processed
- Ads + referral running
- Production promote done, Vercel auto-deploy re-enabled

---

## §6 · Deferred features ledger (the moat)

These differentiate Solen from Fresha/Treatwell. Hard to copy. Priority-ordered.

### §6.1 · Chat-as-a-product (~2 weeks)

- [ ] **QuickReplyChips** — salon owners get 1-tap templates ("Dankeschön!", "Bestätigt", "Wir melden uns") — already coded, verify wiring
- [ ] **AISuggestion** — Gemini-powered reply suggestions contextual to booking — already coded, needs `GEMINI_API_KEY` in Vercel env
- [ ] **Photo-to-quote** — customer sends style inspo photo → salon AI-drafts price estimate
- [ ] **Smart routing** — chat auto-escalates if no reply within 2h
- [ ] Unread count notifications (push + email)
- [ ] Chat-as-funnel — "send inspiration photo to this salon" CTA on every discovery item

### §6.2 · Client allergy tags (3-4 days) — liability-critical

- [ ] DB migration: `client_allergy_tags` table (or JSON on booking)
- [ ] Customer: add allergies to profile (PPD, parabens, sulfates, latex, etc.)
- [ ] Salon-side: allergy warning appears on booking immediately
- [ ] Legal-grade display: must acknowledge before service (per LIVE_TRUTH §0d.2)

### §6.3 · AI nail art gallery

- [ ] fal.ai integration: customer describes design → AI generates 4 nail art options
- [ ] Save to inspo board
- [ ] Send to nail tech as booking reference
- [ ] Nail tech dashboard: "client's wish" view

### §6.4 · Solen Score per salon (~1 week)

- [ ] Algorithm: recency × rating × review volume × response time × cancellation rate
- [ ] Displayed as 0-100 score on salon card + detail page
- [ ] Editorial override for featured salons
- [ ] Transparency: "How is this calculated?" link

### §6.5 · Dispute flow (~1-2 weeks)

- [ ] Migration: `price_disputes` table
- [ ] Customer: "Report issue" on completed bookings
- [ ] Structured reasons: hair_length, extra_treatment, materials, overtime
- [ ] 72h auto-approval window
- [ ] Admin dashboard at `/dashboard/disputes`
- [ ] Stripe payment hold during dispute
- [ ] Email notifications to both parties

### §6.6 · Gold pins on map (1-2 days)

- [ ] Featured/premium salons get gold map pin vs default brand-teal
- [ ] Tier-based rendering (Solen Exclusive badge equivalent)

### §6.7 · Loyalty confetti (~1 week)

- [ ] 10-stamp loyalty card per salon (barber vertical already has this)
- [ ] Celebration animation on 10th booking (per LIVE_TRUTH §5c.4 confetti pop)
- [ ] Free service voucher auto-generated
- [ ] Salon control over reward threshold

### §6.8 · Exit criteria for moat phase

- §6.1 + §6.2 live (chat + allergies — highest ROI, highest legal urgency)
- At least 3 of §6.3-§6.7 live before §7 growth push

---

## §7 · Growth plays

Turn the marketplace from bookings-only into a daily-use habit.

### §7.1 · Discovery as engagement

- [ ] Daily "inspiration" push (TikTok-for-beauty pattern)
- [ ] Save inspiration to boards
- [ ] Share boards with friends
- [ ] Discovery → booking conversion rate target: 15%+

### §7.2 · Rebook automation

- [ ] Smart rebook reminders based on visit cycle (every 4-6 weeks for hair, 3-4 for nails)
- [ ] 1-click rebook from email/push notification
- [ ] Waitlist: notify when cancellations open up

### §7.3 · Community

- [ ] Review photos (already supported)
- [ ] Before/after comparisons
- [ ] User-generated discovery content (with moderation)
- [ ] "Who in my network just booked X?" (privacy-gated)

### §7.4 · Cross-salon Solen Points

- [ ] Solen Points earned per booking
- [ ] Points → CHF discount on future booking at any salon
- [ ] Gamified tiers (Bronze/Silver/Gold)

### §7.5 · Gift economy

- [ ] Buy a friend a haircut as a gift
- [ ] Corporate gift cards (B2B revenue)
- [ ] Wedding/birthday gift workflows

---

## §8 · City expansion (post-launch, ongoing)

### §8.1 · Open Zürich + Bern

- [ ] Scrape Zürich + Bern salon directories (§4 flywheel, rinse + repeat per city)
- [ ] Multi-city search UX (user picks city, default to geo-detected)
- [ ] City-specific landing pages: `/zurich`, `/bern` (SEO)
- [ ] Launch kits per city: local influencer seeding, local press
- [ ] i18n: verify all 4 languages, especially FR (Lausanne/Genève later)
- [ ] Partner sales: repeat Basel playbook per city
- [ ] Unified cross-city analytics in PostHog

### §8.2 · Exit criteria

- 5+ partners per city
- Cross-city bookings possible (user in Basel books salon in Zürich while traveling)
- City picker prominent in header/search

---

## §9 · DACH / EU (6+ months out)

### §9.1 · Prerequisites

- Switzerland profitable or breakeven
- Strong LTV:CAC ratio
- Brand recognition in CH
- Multi-currency + multi-language infrastructure mature

### §9.2 · Expansion markets (priority order)

1. **Austria** — shares CHF payment habits, German primary
2. **Southern Germany** — Freiburg, Stuttgart, Munich (geographic adjacency, German)
3. **France** — starting Lyon or Strasbourg (French speakers, FR i18n exists)
4. **Italy** — Milan (IT i18n exists)

### §9.3 · Out-of-scope-now categories

- Multi-currency pricing
- Regional payment methods (SEPA, Bancontact, etc.)
- Country-specific legal pages
- Per-country tax/VAT handling
- Compliance per market

---

## §10 · Risk register

| Risk | Mitigation |
|---|---|
| Basel saturation before expanding | Start Zürich work at 50% Basel saturation (not 100%) |
| Salon churn in first 3 months | White-glove onboarding, weekly check-in for first month |
| Payment disputes overwhelm support | §6.5 dispute flow must ship before launch scales |
| Stripe Connect onboarding friction | Pre-fill max data, KYC support offered to each partner |
| SEO slowness (passive profiles take 6-8 weeks to index) | Start §4 scrape BEFORE §5 launch by 8+ weeks |
| Hardcoded German strings leak | CI check + weekly manual audit |

---

## §11 · Target metrics per phase

| Phase | Metric | Target |
|---|---|---|
| Pre-launch UI (§3) | Build green, no regressions | 100% |
| Scraped flywheel (§4) | Scraped Basel salons live | 100-300 |
| Public launch (§5) | Paying partners + bookings | 5-10 / 50+ |
| Moat features (§6) | Moat features shipped | 4 of 7 |
| City expansion (§8) | Per-city partners | 5+ each |
| Growth (§7) | DAU / WAU / MAU | TBD, set at §6 end |
| DACH/EU (§9) | International partners | 10+ per new country |

---

## §12 · Operational state

### §12.1 · Vercel auto-deploy
**OFF** since commit `1f3036de`. Re-enable at §5 launch (gate #4).

### §12.2 · Dual Vercel project consolidation
TWO Vercel projects exist (`solen` + `solen.ch`). Consolidate to one before §4 starts to save build minutes + reduce confusion.

---

## §13 · Anti-patterns

❌ Treating §3 items as future work — they're pre-launch ship-blockers.
❌ Adding new entries here without striking the corresponding `[ ]` when done.
❌ Treating §6 + §7 features as required for v1 — they're explicitly **deferred**.
❌ Editing this file to track current phase status — that lives in `V2_REBUILD_LOG.md ## Status`.
❌ Carrying tactical phase plans here. This is a "what" file, not a "when" file.

---

**File health check:** if every checkbox in §3 + §4 + §5 is unchecked when LIVE_TRUTH says we've shipped Phase 4, the file has drifted. Audit + reconcile.
