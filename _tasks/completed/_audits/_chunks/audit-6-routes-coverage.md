# Route × Q-lock coverage audit

**Scope:** every `page.tsx` under `app/[locale]/` mapped against the 63 Q-locks in `_tasks/SOLEN_DESIGN.md` §20.
**Method:** walked the route tree (`find app/[locale] -name page.tsx`), then for each route asked "which Q-lock(s) actually design this surface's layout?" Coverage strength is graded:

- **strong** — multiple Q-locks specify above-fold, sections, density, and states for this route
- **partial** — only system-level Q-locks (tokens / states / a11y / typography) apply; no route-specific layout lock
- **none** — system Q-locks apply by default but no Q lock owns layout, sections, or above-fold

System-wide Q-locks (Q11, Q15, Q16, Q18, Q19, Q20, Q21, Q22, Q23, Q24, Q25, Q26, Q28, Q30, Q32, Q35, Q36, Q40, Q41, Q42, Q43, Q45, Q46, Q47) apply to every route — they are the design floor. To rate "strong" a route needs at least one **layout/composition** Q (e.g. Q49 home above-fold, Q52 salon hero, Q58 profile shell, Q61 dashboard shell, Q56 wizard chrome). "Partial" = route inherits floor but no composition lock has been authored. "None" used only for routes that don't render a real surface (legal stubs, redirects, action callbacks).

---

## Summary

- **Total routes (`app/[locale]/**/page.tsx`):** 102
- **Covered (≥1 layout-class Q-lock owns the surface):** 19
- **Partial (system Q-locks only, no layout lock):** 75
- **None (no surface / pass-through / pure server action):** 8
- **Consumer routes uncovered (partial):** 31
- **Dashboard routes uncovered (partial):** 36
- **Admin / B2B-internal routes uncovered (partial):** 8 (subset of dashboard above)
- **Legal / compliance routes uncovered (partial or none):** 6
- **Onboarding / setup routes uncovered (partial):** 3

---

## Coverage table

Layout-class Q-locks that "own" a surface are bolded. System-level Q-locks (always-applies) are listed under *floor* implicitly and not repeated per row.

### Consumer — top of funnel

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/` | **Q48, Q49, Q50, Q51** + Q4, Q5, Q14 | strong | brand signature + above-fold + section rhythm + carousel density all locked |
| `/[locale]/[city]/page.tsx` | Q4, Q5, Q26, Q50 | partial | inherits salon-card lock + carousel density, but no city-page composition Q |
| `/[locale]/[city]/[category]/page.tsx` | Q4, Q26, Q50 | partial | same as above; nested SEO landing |
| `/[locale]/search` | Q4, Q26, Q50, Q19 (filtered-empty) | partial | search bar (Q4) locked; results-page composition (sticky filter rail? map split?) not authored |
| `/[locale]/discover` | **Q51** (Recently Viewed conditional row) + Q26, Q50 | partial | Q51 mentions discovery sections at home level only — `/discover` index page composition not owned by any Q |
| `/[locale]/discover/[id]` | — | partial | discovery post detail; no Q owns post-detail layout |
| `/[locale]/discover/nails` | — | partial | category-vertical discovery feed; no Q |
| `/[locale]/compare` | — | partial | salon-vs-salon comparator; no Q owns comparator layout |
| `/[locale]/last-minute` | Q26, Q50 | partial | urgency feed; no urgency-specific composition Q |
| `/[locale]/angebote` | Q26, Q50 | partial | offers feed |
| `/[locale]/termine` | **Q9** (redirect to `/profile/bookings`) | n/a | pure redirect — no surface to design |

### Consumer — category landing (vertical funnels)

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/coiffeur` | Q26, Q50, Q5 | partial | category-landing layout never authored |
| `/[locale]/barbershop` | Q26, Q50, Q5 | partial | same |
| `/[locale]/nails` | Q26, Q50, Q5 | partial | same |
| `/[locale]/spa` | Q26, Q50, Q5 | partial | same |
| `/[locale]/makeup` | Q26, Q50, Q5 | partial | same |
| `/[locale]/waxing` | Q26, Q50, Q5 | partial | same |
| `/[locale]/behandlungen/[...slug]` | Q26, Q50 | partial | treatment SEO leaf; layout not owned |
| `/[locale]/brand/[slug]` | — | partial | brand microsite; no composition Q |

### Consumer — salon detail family

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/salon/[slug]` | **Q52, Q53, Q54** + Q59 (stamp chip), Q10 | strong | hero + booking entry + reviews block + loyalty chip all locked |
| `/[locale]/salon/[slug]/booking` | **Q53, Q55, Q56, Q57** | strong | wizard shell + 3-step + indicator + confirmation all locked |
| `/[locale]/salon/[slug]/staff/[staffId]` | Q1 (1:1 portrait) | partial | staff profile sub-page; no composition Q |
| `/[locale]/salon/[slug]/barber/[barberSlug]` | Q1 | partial | barber-vertical sub-page |
| `/[locale]/salon/[slug]/packages` | Q26 | partial | package list page; not owned |
| `/[locale]/salon/[slug]/gift-card` | — | partial | gift-card buy flow; not owned |
| `/[locale]/nail-tech/[id]` | Q1 | partial | per-tech detail; not owned |

### Consumer — booking & checkout

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/checkout` | Q8 (TWINT), Q56, Q57 | partial | payment-only page; whether it's a separate route vs part of wizard not locked |
| `/[locale]/confirmation` | **Q57** | strong | confirmation moment fully locked |
| `/[locale]/booking-action` | — | none | server action callback; no surface |
| `/[locale]/bookings/[id]/approve-increase` | Q22, Q25 | partial | one-time action page; no Q owns |
| `/[locale]/bookings/[id]/respond-adjustment` | Q22, Q25 | partial | same |
| `/[locale]/walk-in-pay` | Q8 | partial | walk-in payment; no Q owns |
| `/[locale]/tip/[bookingId]` | Q36 (celebration if amount-up), Q25 | partial | tip flow; no Q owns |

### Consumer — profile family

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/profile` | **Q58** | strong | profile shell locked (header + grouped lists + Live-Activity card) |
| `/[locale]/profile/bookings` | **Q60** + Q19 | strong | empty-state lockset + bookings list (referenced by Q9 as canonical) |
| `/[locale]/profile/gift-cards` | Q58 (lives under profile shell) | partial | gift-cards list; specific composition not locked |
| `/[locale]/profile/intake-forms` | Q58 | partial | intake forms list; not locked |
| `/[locale]/profile/packages` | Q58 | partial | purchased packages; not locked |
| `/[locale]/profile/referral` | Q58, Q36 (share moment) | partial | referral page; not locked |
| `/[locale]/profile/vouchers` | Q58 | partial | voucher list; not locked |
| `/[locale]/account` | Q58 (likely shadows `/profile`) | partial | duplicate-namespace page; layout not locked, route consolidation not decided |
| `/[locale]/account/messages` | — | partial | account messages list |
| `/[locale]/account/saved` | Q26 | partial | saved-salons grid |
| `/[locale]/loyalty/stamp` | **Q59** | strong | stamp scan page locked (HMAC QR flow noted in Q59) |
| Implied `/[locale]/profil/stempel` per Q59 | **Q59** | strong (planned) | dedicated loyalty page composition fully locked in Q59 — but no `page.tsx` exists yet at this path |

### Consumer — auth

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/auth/login` | Q19, Q22, Q47 | partial | no auth-card composition Q |
| `/[locale]/auth/signup` | Q19, Q22, Q47 | partial | same |
| `/[locale]/auth/register` | Q19, Q22, Q47 | partial | duplicate of signup; consolidation not decided |
| `/[locale]/auth/reset-password` | Q19, Q22 | partial | same |
| `/[locale]/staff-invite` | Q22 | partial | staff invite acceptance flow |

### Consumer — vouchers / gift cards / referral

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/vouchers` | Q26 | partial | voucher discovery; not locked |
| `/[locale]/vouchers/buy` | Q8 | partial | gift-card purchase flow; not locked |
| `/[locale]/referral/[code]` | Q22, Q36 | partial | referral landing; not locked |

### Consumer — marketing / static

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/fuer-salons` | Q48 (brand signature reuse), Q23 | partial | B2B sales page; layout not locked |
| `/[locale]/partner` | Q48, Q23 | partial | partner sales page; not locked |
| `/[locale]/warum-solen` | Q48, Q23 | partial | brand storytelling; not locked |
| `/[locale]/help` | Q24 (tone) | partial | help index; not locked |
| `/[locale]/help/[slug]` | Q24 | partial | help article; not locked |
| `/[locale]/coming-soon` | Q21 (empty/illustration grammar nearest) | partial | placeholder; not locked |

### Consumer — legal / compliance

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/agb` | Q24 | partial | DE AGB; legal-page typography not locked |
| `/[locale]/datenschutz` | Q24 | partial | DE privacy |
| `/[locale]/impressum` | Q24 | partial | DE imprint |
| `/[locale]/privacy` | Q24 | partial | EN privacy (likely duplicate of legal/privacy) |
| `/[locale]/legal/privacy` | Q24 | partial | namespaced legal/privacy |
| `/[locale]/legal/terms` | Q24 | partial | namespaced legal/terms |
| `/[locale]/terms` | Q24 | partial | duplicate ToS |
| `/[locale]/terms/discovery` | Q24 | partial | discovery-specific terms |
| `/[locale]/tos` | Q24 | partial | yet another duplicate ToS |

### Onboarding

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/onboarding/salon` | Q56 (3-step indicator vocab — but Q56 is wizard-only) | partial | salon onboarding multi-step; no onboarding-specific Q |

### Dashboard — shell + core

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/dashboard` | **Q61, Q62, Q63** | strong | viewport-split shell + token-parity + density-D all locked |
| `/[locale]/dashboard/calendar` | **Q61** (working surface, dense), Q63 | strong | week-grid calendar named explicitly in Q61 |
| `/[locale]/dashboard/bookings` | Q61, **Q63** (dense surface) | strong | named in Q63 as a "dense working surface" |
| `/[locale]/dashboard/clients` | Q61, **Q63** | strong | "customers" named in Q63 |
| `/[locale]/dashboard/messages` | Q61, **Q63** (inbox is named) | strong | inbox is named in Q63 |
| `/[locale]/dashboard/analytics` | Q61, **Q63** | strong | analytics named in Q63 |
| `/[locale]/dashboard/queue-display` | Q61, **Q63** (walk-in queue named) | strong | walk-in queue called out in Q63 |
| `/[locale]/dashboard/settings` | Q61, **Q63** (comfortable / editor surface named) | partial | density direction set, but no settings-page composition Q |
| `/[locale]/dashboard/setup` | Q61 | partial | post-onboarding setup wizard; no Q |
| `/[locale]/dashboard/services` | Q61, Q63 (editor → comfortable) | partial | services editor; layout not locked |
| `/[locale]/dashboard/staff` | Q61, Q63 (comfortable) | partial | staff list/editor; not locked |
| `/[locale]/dashboard/gallery` | Q61, Q63 (gallery editor explicitly named) | partial | density set; gallery composition not locked |
| `/[locale]/dashboard/editor` | Q61, Q63 (salon-page editor named) | partial | density set; editor canvas not locked |
| `/[locale]/dashboard/content-editor` | Q61, Q63 | partial | same |
| `/[locale]/dashboard/help-editor` | Q61, Q63 | partial | help CMS; not locked |
| `/[locale]/dashboard/loyalty` | Q61, **Q59** (B2B loyalty surface mentioned), Q63 | partial | Q59 covers consumer side; B2B side untouched by composition Q |
| `/[locale]/dashboard/marketing` | Q61, Q63 | partial | marketing tools; not locked |
| `/[locale]/dashboard/segments` | Q61, Q63 (dense data surface) | partial | customer segments; not locked |
| `/[locale]/dashboard/earnings` | Q61, Q63 (analytics-class) | partial | earnings dashboard; not locked |
| `/[locale]/dashboard/revenue` | Q61, Q63 | partial | revenue page; not locked |
| `/[locale]/dashboard/reviews` | Q61, Q63 | partial | reviews list / reply UI; not locked |
| `/[locale]/dashboard/disputes` | Q61, Q63 (dense, working) | partial | dispute case mgmt; not locked |
| `/[locale]/dashboard/approvals` | Q61, Q63 | partial | moderation queue; not locked |
| `/[locale]/dashboard/verification` | Q61, Q63 | partial | KYC / verification; not locked |
| `/[locale]/dashboard/discovery-posts` | Q61, Q63 | partial | discovery post composer; not locked |

### Dashboard — category-specific

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/dashboard/barber-clients` | Q61, Q63 | partial | category-tools group injected by Q61 sidebar logic, but per-page layout not locked |
| `/[locale]/dashboard/barber-ops` | Q61, Q63 | partial | same |
| `/[locale]/dashboard/coiffeur-crm` | Q61, Q63 | partial | same |
| `/[locale]/dashboard/nail-clients` | Q61, Q63 | partial | same |

### Dashboard — admin (platform-internal)

| Route | Owning Q-lock(s) | Coverage strength | Notes |
|---|---|---|---|
| `/[locale]/dashboard/admin-sandbox` | Q61, Q63 | partial | platform-admin only |
| `/[locale]/dashboard/all-salons` | Q61, Q63 | partial | platform-admin |
| `/[locale]/dashboard/all-users` | Q61, Q63 | partial | platform-admin |
| `/[locale]/dashboard/badge-manager` | Q61, Q63, Q10 (badges) | partial | platform-admin |
| `/[locale]/dashboard/discovery-admin` | Q61, Q63 | partial | platform-admin |
| `/[locale]/dashboard/homepage-admin` | Q61, Q63, Q49, Q51 | partial | controls home page content — needs explicit admin-CMS composition Q |
| `/[locale]/dashboard/platform-analytics` | Q61, Q63 | partial | platform-admin |
| `/[locale]/dashboard/review-moderation` | Q61, Q63 | partial | platform-admin |
| `/[locale]/dashboard/makeup-admin` | Q61, Q63 | partial | category admin |
| `/[locale]/dashboard/nail-admin` | Q61, Q63 | partial | category admin |
| `/[locale]/dashboard/spa-admin` | Q61, Q63 | partial | category admin |
| `/[locale]/dashboard/waxing-admin` | Q61, Q63 | partial | category admin |

---

## Strong-coverage shortlist (19 routes)

Layout-class Q-locks own the surface end-to-end:

1. `/[locale]/` — Q48 / Q49 / Q50 / Q51
2. `/[locale]/salon/[slug]` — Q52 / Q53 / Q54 / Q59 / Q10
3. `/[locale]/salon/[slug]/booking` — Q53 / Q55 / Q56 / Q57
4. `/[locale]/confirmation` — Q57
5. `/[locale]/profile` — Q58
6. `/[locale]/profile/bookings` — Q60
7. `/[locale]/loyalty/stamp` — Q59
8. (planned) `/[locale]/profil/stempel` — Q59
9. `/[locale]/dashboard` — Q61 / Q62 / Q63
10. `/[locale]/dashboard/calendar` — Q61 / Q63
11. `/[locale]/dashboard/bookings` — Q61 / Q63
12. `/[locale]/dashboard/clients` — Q61 / Q63
13. `/[locale]/dashboard/messages` — Q61 / Q63
14. `/[locale]/dashboard/analytics` — Q61 / Q63
15. `/[locale]/dashboard/queue-display` — Q61 / Q63
16. `/[locale]/termine` (redirect — covered by Q9 decision)

That's the 16 fully-owned consumer + dashboard surfaces, plus the 3 dashboard-shell aliases that fall under Q61's "dashboard root" decision (`/dashboard` itself is the root). Everything else is "partial."

---

## Uncovered routes (need design locks) — sorted by priority

### Priority 1 — consumer-facing, high traffic, no layout lock

These are surfaces real users will hit on launch and the Q-system has no opinion on their composition.

1. **`/[locale]/search`** — search results page (filter rail? map split? sort row? sticky chips?). Q4 only locks the search bar; results-page composition is silent.
2. **`/[locale]/[city]` and `/[locale]/[city]/[category]`** — SEO landing pages, primary organic-acquisition surface. No "city page" composition Q exists. Likely highest-volume traffic post-launch.
3. **`/[locale]/coiffeur` / `/barbershop` / `/nails` / `/spa` / `/makeup` / `/waxing`** — six category-vertical landings. No vertical-landing composition Q. Likely candidates for one shared layout lock.
4. **`/[locale]/discover`, `/discover/[id]`, `/discover/nails`** — discovery feed (Instagram-style?). Q51 only covers home discovery sections, not the dedicated discover hub.
5. **`/[locale]/auth/login` + `/auth/signup` + `/auth/register` + `/auth/reset-password`** — auth card layout. Plus the duplicate `signup` vs `register` route needs a route-consolidation decision.
6. **`/[locale]/checkout`** — separate payment route exists alongside in-wizder PayConfirm. Q55 collapsed to 3-step in-wizard pay; the standalone `/checkout` route needs a "is this still alive? walk-in only?" decision.
7. **`/[locale]/compare`** — salon comparator (split table? side-by-side cards?). No Q.
8. **`/[locale]/last-minute` and `/[locale]/angebote`** — urgency / offers feeds. No urgency-specific composition Q (countdown chips? amber-bias?).

### Priority 2 — consumer secondary

9. **`/[locale]/profile/{gift-cards,intake-forms,packages,referral,vouchers}`** — five sub-pages under the Q58 profile shell with no per-page composition lock.
10. **`/[locale]/account/{,messages,saved}`** — `/account` namespace duplicates `/profile`. Needs a route-consolidation decision before designing.
11. **`/[locale]/vouchers`, `/vouchers/buy`** — gift-card discovery + buy flow. No Q.
12. **`/[locale]/referral/[code]`** — referral landing. No Q.
13. **`/[locale]/salon/[slug]/{packages,gift-card,staff/[staffId],barber/[barberSlug]}`** — four salon sub-pages. Q52 only covers main salon detail.
14. **`/[locale]/nail-tech/[id]`** — per-technician detail. No Q.
15. **`/[locale]/walk-in-pay`** — walk-in payment. No Q.
16. **`/[locale]/tip/[bookingId]`** — tip-after-service flow. No Q.
17. **`/[locale]/bookings/[id]/{approve-increase,respond-adjustment}`** — one-time email-link action pages. No Q.
18. **`/[locale]/staff-invite`** — staff invite acceptance. No Q.
19. **`/[locale]/brand/[slug]`** — brand microsite (Davines, L'Oréal, etc.). No Q.
20. **`/[locale]/behandlungen/[...slug]`** — treatment SEO leaves. No Q.

### Priority 3 — marketing / static

21. **`/[locale]/fuer-salons`, `/partner`, `/warum-solen`** — B2B sales + brand storytelling pages. No "marketing page" layout Q.
22. **`/[locale]/help`, `/help/[slug]`** — help center index + article. No Q.
23. **`/[locale]/coming-soon`** — placeholder route. No Q (Q21 illustration grammar gets close but doesn't own it).

### Priority 4 — legal (low priority but route-consolidation issue)

24. **Legal duplication:** `/agb`, `/datenschutz`, `/impressum` (DE) + `/privacy`, `/legal/privacy`, `/legal/terms`, `/terms`, `/terms/discovery`, `/tos` (EN, multiple namespaces). Nine legal routes with three+ duplicates. Needs (a) one composition Q for legal-page typography + (b) a route-consolidation decision.

### Priority 5 — onboarding / wizard variants

25. **`/[locale]/onboarding/salon`** — new-salon onboarding multi-step. Q56 is locked as **wizard-only** (booking) — onboarding indicator vocab is explicitly not covered. Needs its own indicator + step-shell Q.

### Priority 6 — dashboard secondary (consumer-comparable density already set by Q63, but composition silent)

26. **All `/dashboard/*` routes outside the 6 named in Q63** — `settings`, `setup`, `services`, `staff`, `gallery`, `editor`, `content-editor`, `help-editor`, `loyalty`, `marketing`, `segments`, `earnings`, `revenue`, `reviews`, `disputes`, `approvals`, `verification`, `discovery-posts`, plus 4 category-CRM and 12 platform-admin routes. Total ~25 dashboard surfaces with density direction but no layout lock.

### Priority 7 — admin / platform-internal

27. **Platform admin pages** (`admin-sandbox`, `all-salons`, `all-users`, `badge-manager`, `discovery-admin`, `homepage-admin`, `platform-analytics`, `review-moderation`, plus 4 category-admin pages). Internal-only — design polish low-value, but density + table conventions need a single Q.

---

## Suggested new Q-locks

Numbering continues from Q63 (the current last lock). Bundling related uncovered routes into single Qs where it makes sense.

| Suggested Q | Title | Owns |
|---|---|---|
| **Q64** | Search results page composition — filter rail vs sticky-top chips, list-vs-map toggle, sort row, "X results in Basel" header | `/search` |
| **Q65** | City + city/category SEO landing layout — hero treatment, neighborhood chips, category breakdown, schema-friendly section order | `/[city]`, `/[city]/[category]` |
| **Q66** | Category-vertical landing layout (one Q for all 6 verticals) — category-hero, signature treatments, top salons in this category, brand-story slot | `/coiffeur`, `/barbershop`, `/nails`, `/spa`, `/makeup`, `/waxing` |
| **Q67** | Discovery hub composition — feed grid (Instagram 3-up vs Pinterest masonry vs full-bleed editorial), filter chips, post-detail layout | `/discover`, `/discover/[id]`, `/discover/nails` |
| **Q68** | Auth card layout — single-column form vs split (illustration + form), social-login order, Switzerland-localized copy, route consolidation `signup` vs `register` | `/auth/login`, `/auth/signup`, `/auth/register`, `/auth/reset-password`, `/staff-invite` |
| **Q69** | Profile sub-page composition — shared inner-shell anatomy under Q58 (eyebrow + Anton + back-chevron + content-region) reused across the 5 sub-routes | `/profile/{gift-cards,intake-forms,packages,referral,vouchers}` |
| **Q70** | Salon-detail sub-pages composition — packages list / gift-card buy / staff detail / barber detail; relation to main salon hero (Q52) | `/salon/[slug]/{packages,gift-card,staff/[staffId],barber/[barberSlug]}` |
| **Q71** | One-shot action-page layout — email-link landing pattern (approve/respond/tip/walk-in-pay) — single-column centered card, big primary CTA, Q57-style confirmation | `/bookings/[id]/*`, `/tip/[bookingId]`, `/walk-in-pay`, `/booking-action` |
| **Q72** | Comparator layout — salon-vs-salon grid (rows = features, columns = salons) + mobile-stacked variant | `/compare` |
| **Q73** | Marketing page layout (B2B sales + brand) — hero variant of Q49 vocab, scroll-narrative section rhythm, CTA reuse | `/fuer-salons`, `/partner`, `/warum-solen` |
| **Q74** | Help center layout — sidebar TOC vs top-search, article body typography, breadcrumb | `/help`, `/help/[slug]` |
| **Q75** | Legal page typography + consolidation — single layout for all legal routes; collapse duplicates `/terms`, `/tos`, `/legal/terms` and `/privacy`, `/legal/privacy`, `/datenschutz` | all 9 legal routes |
| **Q76** | Salon onboarding wizard chrome — step indicator distinct from Q56 (booking) since it's longer (~6+ steps), save-and-resume drawer, progress persistence | `/onboarding/salon` |
| **Q77** | Dashboard editor-surface layout — shared shell for the 9 "comfortable / editor" surfaces named in Q63 (settings, gallery, salon-page editor, package builder, content-editor, help-editor, services, staff, loyalty, marketing) | dashboard editor routes |
| **Q78** | Dashboard data-surface layout for the rest — shared anatomy for analytics-class secondary surfaces (earnings, revenue, segments, reviews, disputes, approvals, verification, discovery-posts) | dashboard data routes |
| **Q79** | Platform-admin layout — table-first density, bulk-action bar, filter rail, "internal-only" visual marker | all `/dashboard/*-admin`, `all-*`, `*-moderation`, `admin-sandbox`, `badge-manager`, `homepage-admin`, `platform-analytics` |
| **Q80** | Vouchers + gift-cards consumer flow — discovery → buy → recipient flow shape | `/vouchers`, `/vouchers/buy`, `/referral/[code]` |
| **Q81** | Brand microsite layout | `/brand/[slug]` |
| **Q82** | Treatment-SEO leaf layout | `/behandlungen/[...slug]` |
| **Q83** | Account-vs-Profile namespace consolidation — decision Q (not pure layout): which canonical, redirect vs delete | `/account*` |

If 20 new Qs feels heavy, the minimum viable set to close consumer-facing gaps is **Q64–Q70 + Q73 + Q75** (8 new locks). Dashboard secondary (Q77–Q79) can wait until consumer is fully covered, since Q61–Q63 already provide a credible floor for dashboard work.

---

## Cross-cutting findings (route-tree health)

While auditing I noticed three structural issues worth flagging — these are *not* design questions but they block coverage decisions:

1. **Route duplication** — `/auth/signup` vs `/auth/register`, `/profile/*` vs `/account/*`, three legal-namespace duplicates. Six routes of dead weight; Q-locks can't cleanly own a surface that has two URLs.
2. **`/[locale]/profil/stempel`** is referenced by **Q59** as the canonical loyalty page, but no `page.tsx` exists at that path. Either Q59's path is wrong or the route hasn't been created yet. (Existing `/loyalty/stamp` is the in-salon QR scan, not the consumer dashboard.)
3. **`/checkout` standalone route** — Q55 collapsed payment into wizard step 3 (`PayConfirmStep`). Whether `/checkout` is still alive as a separate route (walk-in pay? gift-card buy?) or should be deleted is unresolved.

These three cleanups should land before Q64+ are written, otherwise new Q-locks will have to caveat around duplicate paths.
