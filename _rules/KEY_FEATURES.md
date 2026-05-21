# Key Features Reference

> **HOMEPAGE LAYOUT (V3 — V2-D15-3, 2026-05-07)**: Per `_tasks/SOLEN_LIVE_TRUTH.md` §13 (Hero) + §15 (Section header pattern). Page bg white `#FFFFFF` + atmospheric wash (cyan core + navy framing). Above-fold: brand-teal eyebrow + **Cooper BT** mixed-case h1 + ONE accent word in brand teal `#043338` + Avant Garde body deck + brand-teal CTA pill (white text per pill rule) + stacked Fresha-flow search card + quick-action chips. NO hero photo, NO gradient hero, NO floating glass-pill search bar. Per-section scroll-snap carousels per LIVE_TRUTH §17. Live preview: `public/solen-v2-republik-teal.html`. (V1 Q48 signature lockup with coral eyebrow + Anton uppercase headline retired — Anton + coral both retired V2-D15-3.)

1. **Discovery & Booking**: Salon cards + multi-step booking wizard with multi-service, add-ons, guest checkout.
2. **Direct Messaging**: In-app chat with media upload, price offers, and dispute resolution.
3. **Authentication**: Supabase-powered (Google OAuth, Email magic link).
4. **Last Minute Offers**: Salon owners expose canceled slots with category filters and price range filtering.
5. **Favorites & Retention**: Heart button on SalonCards, "Wieder buchen?" widget, top-rated badge auto-assign.
6. **Loyalty System**: Stamp cards with per-salon rewards and progress tracking.
7. **Client Notes (CRM)**: Salon owners can add permanent/booking notes for clients.
8. **Review Replies**: Salon owners can reply to reviews (public or private).
9. **Off-Peak Discounts**: Salons set discounted hours for specific days of the week.
10. **Help Center**: Public help articles with admin CMS, search, and category sections.
11. **Reduced motion**: `prefers-reduced-motion` honored across the app — Q35 morphs and Q36 celebrations degrade to instant swap; toast fades in/out only. (Dark mode RETIRED 2026-04-20 / Q62 — single light theme.)
12. **Dashboard Calendar**: Weekly grid with staff colors, slot detail modal, reschedule, and day blocking.
13. **Review Photos**: Customers can upload photos with reviews; stored in Supabase Storage `review-photos` bucket.
14. **Recently Viewed**: Horizontal scroll of last 5 viewed salons from localStorage. Shows on HomePage and ProfilePage.
15. **SMS Reminders**: Cron-based 24h/1h SMS reminders via seven.io. Configurable per salon in dashboard settings.
16. **Review Prompts**: Daily cron sends review email 24h after completed bookings via Resend.
17. **Internationalization**: 4 locales (de, en, fr, it) via next-intl. LanguageSwitcher in Header.
18. **Multi-Location Chains**: `salon_groups` table, brand pages at `/brand/[slug]`, "Teil von [Brand]" badge on SalonCard.
19. **PWA Install Prompt**: Shows after first booking. iOS: manual share instructions. Chrome: `beforeinstallprompt`.
20. **Accessibility**: Global focus-visible rings, aria-labels on all interactive elements, semantic nav roles.
21. **Chat Intelligence**: Quick-reply template chips (salon-side), AI reply suggestions via Gemini, photo-based price quoting, photo gallery tab in chat.
22. **Client CRM Tags**: Color-coded tags (allergy, preference, note) on client profiles. Red allergy warnings on booking cards.
23. **Visual Editor**: Admin-only element selector at `/dashboard/editor`. Click any element → describe change → Claude API generates roadmap. Supports device preview, request queue, and cost tracking.
24. **Discovery Platform**: Pinterest-style content discovery at `/discover`. Masonry grid with photo/TikTok cards, category/gender/texture filters, infinite scroll, like/save/comment social features, AI-powered descriptions (Gemini), stock photo import, TikTok oEmbed import, admin content studio, user/salon posting with auto-flagging, recommendation algorithm, staff portfolio browsing, and booking bridge.
25. **Prepaid Booking**: Stripe Connect with configurable platform fee, hold-and-release payment flow, card-on-file save via SetupIntents.
26. **Staff Accounts**: Invite-based staff onboarding, role-limited dashboard (STAFF_NAV), per-staff service mapping, break/time-off management.
27. **Guest Booking**: No account required for booking. Email-only checkout with automatic profile creation on confirmation.
28. **Walk-in Mode**: SMS-based payment links for walk-in customers via seven.io. HMAC-signed tokenized payment pages.
29. **Service Packages**: Multi-session punch cards with bonus sessions. PackageManager in marketing dashboard. Purchase tracking.
30. **Digital Gift Cards**: Per-salon gift cards with custom amounts, recipient email delivery, code-based redemption, balance tracking.
31. **Tip System**: Post-service tipping via tokenized tip pages. Preset + custom amounts. Stripe PaymentIntents for tip processing.
32. **Group Bookings**: Multi-person bookings with shared `group_booking_id`. RPC function for atomic multi-slot booking.
33. **Client CRM**: Color formulas, intake forms (5 consultation types), before/after photos, AI-powered intake recommendations via Gemini.
34. **Referral Program**: Auto-generated referral codes, WhatsApp/SMS/copy sharing, reward tracking (CHF 10 per referral), salon-side referral dashboard.
35. **Advanced Analytics**: Booking heatmap (7x12 CSS grid), staff comparison (table/chart), acquisition source tracking, revenue commission breakdown, gift card + tip summaries.
36. **Nail Tech Portfolio**: Staff portfolio pages with masonry grid, filterable by style/shape/material. Tier badges (junior/senior/master). Public profile at `/nail-tech/[id]`.
37. **Nail Design History**: Per-client design timeline with photos, material/shape badges, color swatches, repeat-design action.
38. **Nail Inspo System**: Client image upload (drag-drop + camera), curated inspo boards, multi-select from boards during booking.
39. **Nail Material/Shape/Length Selector**: Visual shape picker (10 SVG icons), length bars, 7 material types with descriptions. Integrated in booking flow.
40. **Nail Station Management**: Configurable station count, UV lamp tracking, sterilization buffer. Utilization bar in dashboard.
41. **Nail Tier Pricing**: Staff-level pricing (junior/senior/master) displayed during booking. Dynamic pricing rules per day/time.
42. **Nail Infill Reminders**: Per-service reminder cycle (days). Cron sends email/SMS reminders when infill is due.
43. **Nail Discovery Feed**: Pinterest-style masonry grid at `/discover/nails`. Filter by style/shape/material. Infinite scroll.
44. **Nail Dynamic Pricing**: Rule-based price modifiers (peak/off-peak/weekend/last-minute/loyalty). Weekly heatmap visualization.
45. **Nail Retail POS**: In-salon product sales. RetailManager for inventory, RetailCheckout for POS cart + Stripe payment.
46. **Nail AI Art Generator**: Admin-only fal.ai image generation. Style/shape/color/skin tone selectors. Monthly budget tracking via Redis.
47. **Nail Allergy System**: Client allergy tracking with severity levels. Warning banners in booking flow. Alert emails to salon on booking.
48. **Walk-in Queue**: Real-time barbershop walk-in queue with Supabase Realtime. Remote join via name/phone/preferred barber. Status transitions (waiting→in_chair→completed/no_show). Public wait time display with 30s polling.
49. **Express Rebook**: 2-tap rebook flow for returning barber clients. Shows last cut specs, searches next available slot, confirms booking.
50. **Cut History Timeline**: Per-client chronological timeline of barbershop visits. Spec badges (fade, top, guard, beard, lineup), photos, "Wiederholen" repeat action.
51. **Barber Profiles**: Public barber profile pages at `/salon/[slug]/barber/[barberSlug]`. Portfolio grid with style filters, cover photo, share button, booking CTA.
52. **Barber Smart Reminders**: Visit-cycle detection via `barber_cut_history`. Cron identifies overdue clients. Dashboard shows due clients grouped by barber with send button.
53. **Barber Loyalty Cards**: HMAC-signed QR stamp cards. Configurable programs (name, stamps needed, reward type). Visual stamp grid, QR overlay, one-tap stamp verification at `/loyalty/stamp`.
54. **Barber Leaderboard**: Staff performance comparison table. Metrics: bookings, revenue, retention, avg tip, walk-in conversion, chair utilization. Week/month toggle + anonymize mode.
55. **Chair Management**: Configurable chair count and buffer minutes. Utilization bar in dashboard. Affects slot generation capacity.
56. **Walk-in Analytics**: Walk-in vs appointment ratio, avg wait time, conversion rate, abandonment rate, chair utilization. Week/month period toggle.
57. **Barber Discovery Signals**: Discovery algorithm barber branch — fade type, barber style, and hair texture scoring for barbershop category items.
58. **Barber Roster**: Salon page "Unsere Barber" grid section showing staff with portfolio links. Only visible for barbershop-category salons.
59. **Smart Search**: Unified search bar with date-based availability, category pills, and AI-powered embeddings search (pgvector). Category-scoped results with cross-category suggestions. Homepage 3-part search bar (date + category + AI search). Subpage FilterBar with date picker and availability badges.
60. **Admin Homepage Section Toggle**: Admin-controlled homepage section visibility via `platform_settings` key `homepage_sections`. Public GET at `/api/homepage-sections`, admin GET/PUT at `/api/admin/homepage-sections`. Sections default to all-visible on fetch failure.

---

## Future feature ideas (not yet built)

61. **Hair History / Beauty Passport** *(spec'd 2026-05-14, not built)* — Each customer's profile tracks treatment history (bleach, color, cuts, perms, gloss). Onboarding capture via free-text + AI parser OR structured form. Auto-logs treatments when bookings confirm. Damage-warning engine (rule-based + LLM) prevents risky combinations before user confirms a booking (e.g. bleach over fresh color within 4 weeks → 🔴 hard warning). Stylist-side B2B surface shows customer's relevant history when they open the appointment. Cross-salon visibility toggled by customer. Includes AI service-classifier that tags every salon's services with chemical-treatment metadata (`is_bleach`, `is_color`, `damage_class`) — required so history is comparable across salons. Full spec: [`_audits/2026-05-14-hair-history-feature-spec.md`](../_audits/2026-05-14-hair-history-feature-spec.md). Effort: ~40-60 hrs. Phase 6 / post-launch retention feature. Differentiator vs Fresha/Treatwell/Booksy who only track bookings, not chemistry.

---

## Solen Workflows — B2B Automation Hub *(brainstormed 2026-05-15)*

> **Concept**: a new dashboard tab where salon owners toggle on AI-powered, set-and-forget workflows. Each workflow automates a specific "11 PM problem" — the operational stuff that keeps owners up at night. Inspired by Anthropic's *Claude for Small Business* pattern (TikTok ref: `vm.tiktok.com/ZNRGpn55F`) — but salon-vertical-specific, leveraging the booking + client + payment + photo data Solen already collects. Each entry below is a single toggleable workflow.

### Phase 1 · Invoice core (TikTok-validated hero pair)

62. **Invoice Generator** — Create non-booking invoices (chair rental, bridal deposits, corporate accounts, bulk gift card B2B). Swiss-VAT-ready PDF with salon branding. Stripe Connect pay-link embedded. Prerequisite primitive that everything else in Phase 6 (extended invoicing) depends on. Spec: [`_audits/2026-05-15-solen-invoice-workflows-spec.md`](../_audits/2026-05-15-solen-invoice-workflows-spec.md). Effort: ~24-32 hrs.
63. **Invoice Chaser** — AI-personalized auto-escalating payment reminders on unpaid invoices: day 3 gentle, day 7 firm, day 14 final-notice, day 21 flag for handoff. Each message rewritten in salon's tone via Claude. The TikTok's explicit pick — "the cleanest workflow to install in any local business >200k/year." Spec: same doc as #62. Effort: ~16-20 hrs.

### Phase 2 · Other workflows named verbally in the TikTok

64. **Month-End Close** — Auto-reconciliation of cash + Stripe + walk-ins + tips at end of month. Generates Z-report + month-end statement PDF. (Daily cash close = same engine, smaller window.) Effort: ~16-24 hrs.
65. **Staff Commission Calc / Payroll Planning** — Weekly + monthly auto-calc of commissions + tips per staff. Direct CSV export for payroll providers (or Bexio integration). Builds on Staff Accounts (#26) + Tip System (#31). Effort: ~12-16 hrs.
66. **Campaign Attribution** — Tie marketing spend (Instagram boost, Google Ads, referral codes) to bookings → revenue. Enhances Advanced Analytics (#35) acquisition-source tracking. Effort: ~16-20 hrs.

### Phase 3 · Client retention workflows

67. **Win-Back Campaigns** — Auto-detect 90-day-inactive clients → AI-personalized message referencing their last service ("3 months since your balayage — your roots are probably ready"). One-tap rebook. AI personalization is the differentiator vs Fresha/Treatwell templates. Effort: ~16 hrs.
68. **Birthday Surprises** — Auto-send personalized birthday offer with their favorite service pre-selected. Existing platforms send template "happy birthday" — nobody auto-attaches the right service. Effort: ~6-8 hrs.
69. **Anniversary Check-Ins** — "1 year since your first visit at Salon X" + personalized thank-you with offer. Effort: ~6-8 hrs.
70. **Churn Risk Alerts** — Predict which top-20% spenders are about to churn (signal: skipped usual rebook cycle, declining booking frequency). Surfaces in dashboard before they leave. Effort: ~20-24 hrs.

### Phase 4 · Marketing & growth workflows

71. **Social Post Generator** — Turn before/after photos from Client CRM (#33) into ready-to-post Instagram/TikTok content. AI generates caption + hashtag set in salon's voice. One-tap export to image library or direct-post via Meta API. Effort: ~24-32 hrs.
72. **VIP Surfacing** — Auto-identify top 20% by spend / frequency. Salon-side card surfaces VIPs with "send personalized message" / "comp a service" / "invite to private event" actions. Effort: ~10-12 hrs.
73. **Lead-to-Booking Chase** — When DM chat starts but no booking happens within 24h, auto-send personalized follow-up with availability. Builds on Direct Messaging (#2) + Chat Intelligence (#21). Effort: ~12-16 hrs.
74. **Competitor Pulse** — Quarterly auto-emailed report: your pricing vs nearby salons in Basel / Zürich, category-matched. Localization moat — nobody benchmarks at city level. Effort: ~24 hrs (requires scraper + matching algo).

### Phase 5 · Operations workflows

75. **Stock Predict** — Predict inventory needs from booking patterns. "You'll run out of foils in ~9 days based on next week's bookings." Beyond Nail Retail POS (#45) which is sales-only. Effort: ~24-32 hrs.
76. **No-Show Follow-Up** — Auto-message no-shows with empathetic message + one-tap rebook. Track no-show patterns per client (frequent no-show = future deposit required). Effort: ~10-12 hrs.
77. **Auto-FAQ Responder** — Common DM questions ("Do you do balayage on dark hair?", "What's parking like?", "Can I bring kids?") answered instantly via AI in salon's voice. Enhances Chat Intelligence (#21). Effort: ~16-20 hrs.
78. **Photo Quote Auto-Send** — Customer sends inspo photo → AI generates quote + service suggestion → sent to client for one-tap confirm. Enhances Chat Intelligence (#21) photo-pricing. Effort: ~16 hrs.

### Phase 6 · Extended invoicing (salon-specific scenarios)

79. **Recurring Invoices** — Set-and-forget monthly billing for chair-rental tenants + subscription clients + corporate accounts. Auto-charges card on file OR sends pay-link. Effort: ~16-20 hrs.
80. **Supplier Bill Tracking** — Salon snaps photo of supplier invoice → AI extracts vendor / amount / due date / category → dashboard shows incoming bills sorted by due date. No payment processed, just visibility. Prevents late fees + strained vendor relationships. Effort: ~12-16 hrs.
81. **Corporate Accounts** — Configure a company as a billable client. Employees book individually all month → ONE consolidated invoice to company HR at month end. Currently impossible in Solen. Effort: ~24 hrs.
82. **Bridal Package Plans** — Multi-installment payments for high-ticket weddings: deposit on book, milestone payments tracked, auto-reminders for each. Wedding tickets are 4-figure — losing one to a failed installment chase is brutal. Effort: ~20-24 hrs.
83. **Bulk Gift Card B2B** — Companies buy 50 gift cards as employee perks → one invoice for the bulk amount → salon delivers redemption codes via spreadsheet/email export. Extends Gift Cards (#30) which is B2C only. Effort: ~12-16 hrs.

### Phase 7 · Financial reporting

84. **Swiss VAT Monthly Report** — Auto-compile tax-ready PDF: income, VAT split, by-service breakdown, deductible expense summary. CH-localized format ready for Steueramt submission. Pure Swiss-market moat — Fresha/Treatwell/Booksy don't localize tax. Effort: ~24-32 hrs.

---

## Other B2B features (not workflow-style) *(brainstormed 2026-05-15)*

85. **Staff Performance Coaching** — Monthly AI-summarized staff performance + coaching suggestions ("Maria's rebook rate dropped 15% — could mean she needs scheduling support; here's how to bring it up"). Builds on Barber Leaderboard (#54) but generalized + actionable. Effort: ~20 hrs.
86. **Smart Pricing Suggestions** — AI looks at competitor rates + your booking velocity + season → suggests price changes per service. "Your balayage is booked 95% — consider +CHF 10." Effort: ~24 hrs.
87. **Booking Funnel Analytics** — Where customers drop off: salon-page-view → service-select → time-pick → checkout. With AI insights on why ("73% drop at service-select — your service names are too long / no English translations / no price visible"). Effort: ~16-20 hrs.
88. **AI Chat Triage** — Incoming DMs auto-classified (quote request / appointment change / complaint / spam / FAQ) + priority routing. Surfaces complaints to owner; routes FAQs to Auto-FAQ Responder (#77). Effort: ~12-16 hrs.
89. **Salon Onboarding Wizard** — 5-min AI-assisted setup for new salons. Paste your Instagram/Google business URL → AI auto-extracts services, hours, photos, address. Owner just confirms + edits. Reduces signup friction from hours to minutes. Effort: ~32-40 hrs.
90. **Service Description Writer** — AI generates service descriptions in salon's voice from category + duration + price. "Balayage L · 90 min · CHF 180" → full marketing copy. Effort: ~8 hrs.
91. **Multi-Location Dashboard** — For salon chains (already supported via salon_groups #18), a unified KPI view across all locations: bookings, revenue, staff utilization, comparative analytics. Effort: ~32 hrs.
92. **Auto-Translate Service Names** — DE base services auto-translate to FR/IT/EN for multilingual / tourist clients. One-time AI batch + manual review per service. Effort: ~12 hrs.
93. **Embeddable Booking Widget** — JS snippet salon pastes on their own website. "Book now" iframe with salon's services + Stripe checkout, all branded with salon colors. Effort: ~24-32 hrs.
94. **WhatsApp Business Booking** — Customers book via WhatsApp chat with the salon. Uses WhatsApp Business API + Solen's slot engine. Massive in CH for older clientele. Effort: ~40 hrs.
95. **AI Voice Booking (Phone Receptionist)** — AI answers the salon's phone, takes bookings, escalates to human for complex queries. Huge for older Swiss clientele who still call. Twilio + Claude voice. Effort: ~48-60 hrs.
96. **Mystery Shopper Service** — Solen-paid (premium tier) feature: real customer evaluates salon experience, sends detailed report on greeting / cleanliness / service quality / payment friction. Quarterly. Solen-side ops effort, not engineering — ~minimal build.

97. **B2B Showcase Section · Caption-Pill Pattern (homepage redesign)** *(brainstormed 2026-05-16, design direction locked, build deferred)* — Replace the current single-CTA "Für Salons" homepage section with a 3-feature mini-showcase. Each card shows a real dashboard preview screenshot + a floating dark-ink caption pill bottom-left ("HEUTE FREI · −20%" / "AUTO-SMS" / "STRIPE PAYOUTS" style). Editorial-portfolio aesthetic — same family as current V3 (Peace Sans + cream + emerald), just adds the pill labeling pattern. **Blocker:** the 3 features shown need to actually exist + look polished in production before this can ship; promising features in the homepage UI that aren't built = trust hit. **Build when:** Last-Minute discount engine, Auto-SMS reminders, and Stripe Connect payouts are all live + have screenshot-worthy dashboard UI. **Design ref:** test mockup was at `public/solen-topic2-test.html` (deleted post-decision); reference video was Instagram reel DYEtIuGo7CC — ux.aneta's AI design portfolio caption pills. **Pattern reuse plan:** if shipped, also apply caption pills to About / How-it-works / Stylist profile portfolio area for system consistency (the pattern only works if used in 2-3 places, otherwise reads random). Effort: ~12-16 hrs for the homepage section alone, +8-12 hrs per additional surface.
