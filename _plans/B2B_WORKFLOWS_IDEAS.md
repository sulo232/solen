# B2B Workflows Ideas

> Origin: moved out of `_rules/KEY_FEATURES.md` (2026-07-07), where a mis-archive had it mixed in as if it were a shipped-feature entry. This is an unbuilt brainstorm, not a shipped feature. Full pre-split archived copy: `_rules/archive/KEY_FEATURES.md`.

## Solen Workflows: B2B Automation Hub *(brainstormed 2026-05-15)*

> **Concept**: a new dashboard tab where salon owners toggle on AI-powered, set-and-forget workflows. Each workflow automates a specific "11 PM problem" (the operational stuff that keeps owners up at night). Inspired by Anthropic's *Claude for Small Business* pattern (TikTok ref: `vm.tiktok.com/ZNRGpn55F`), but salon-vertical-specific, leveraging the booking + client + payment + photo data Solen already collects. Each entry below is a single toggleable workflow.

### Phase 1: Invoice core (TikTok-validated hero pair)

1. **Invoice Generator**: Create non-booking invoices (chair rental, bridal deposits, corporate accounts, bulk gift card B2B). Swiss-VAT-ready PDF with salon branding. Stripe Connect pay-link embedded. Prerequisite primitive that everything else in Phase 6 (extended invoicing) depends on. Spec: [`_audits/2026-05-15-solen-invoice-workflows-spec.md`](../_audits/2026-05-15-solen-invoice-workflows-spec.md). Effort: ~24-32 hrs.
2. **Invoice Chaser**: AI-personalized auto-escalating payment reminders on unpaid invoices: day 3 gentle, day 7 firm, day 14 final-notice, day 21 flag for handoff. Each message rewritten in salon's tone via Claude. The TikTok's explicit pick: "the cleanest workflow to install in any local business >200k/year." Spec: same doc as item 1. Effort: ~16-20 hrs.

### Phase 2: Other workflows named verbally in the TikTok

3. **Month-End Close**: Auto-reconciliation of cash + Stripe + walk-ins + tips at end of month. Generates Z-report + month-end statement PDF. (Daily cash close = same engine, smaller window.) Effort: ~16-24 hrs.
4. **Staff Commission Calc / Payroll Planning**: Weekly + monthly auto-calc of commissions + tips per staff. Direct CSV export for payroll providers (or Bexio integration). Builds on Staff Accounts + Tip System (shipped features, see `_rules/KEY_FEATURES.md` items 26 and 31). Effort: ~12-16 hrs.
5. **Campaign Attribution**: Tie marketing spend (Instagram boost, Google Ads, referral codes) to bookings to revenue. Enhances Advanced Analytics (shipped, item 35) acquisition-source tracking. Effort: ~16-20 hrs.

### Phase 3: Client retention workflows

6. **Win-Back Campaigns**: Auto-detect 90-day-inactive clients, then send an AI-personalized message referencing their last service ("3 months since your balayage, your roots are probably ready"). One-tap rebook. AI personalization is the differentiator vs Fresha/Treatwell templates. Effort: ~16 hrs.
7. **Birthday Surprises**: Auto-send personalized birthday offer with their favorite service pre-selected. Existing platforms send template "happy birthday" messages; nobody auto-attaches the right service. Effort: ~6-8 hrs.
8. **Anniversary Check-Ins**: "1 year since your first visit at Salon X" + personalized thank-you with offer. Effort: ~6-8 hrs.
9. **Churn Risk Alerts**: Predict which top-20% spenders are about to churn (signal: skipped usual rebook cycle, declining booking frequency). Surfaces in dashboard before they leave. Effort: ~20-24 hrs.

### Phase 4: Marketing and growth workflows

10. **Social Post Generator**: Turn before/after photos from Client CRM (shipped, item 33) into ready-to-post Instagram/TikTok content. AI generates caption + hashtag set in salon's voice. One-tap export to image library or direct-post via Meta API. Effort: ~24-32 hrs.
11. **VIP Surfacing**: Auto-identify top 20% by spend / frequency. Salon-side card surfaces VIPs with "send personalized message" / "comp a service" / "invite to private event" actions. Effort: ~10-12 hrs.
12. **Lead-to-Booking Chase**: When DM chat starts but no booking happens within 24h, auto-send personalized follow-up with availability. Builds on Direct Messaging + Chat Intelligence (shipped, items 2 and 21). Effort: ~12-16 hrs.
13. **Competitor Pulse**: Quarterly auto-emailed report comparing your pricing vs nearby salons in Basel / Zurich, category-matched. Localization moat, nobody benchmarks at city level. Effort: ~24 hrs (requires scraper + matching algo).

### Phase 5: Operations workflows

14. **Stock Predict**: Predict inventory needs from booking patterns. "You'll run out of foils in ~9 days based on next week's bookings." Beyond Nail Retail POS (shipped, item 45) which is sales-only. Effort: ~24-32 hrs.
15. **No-Show Follow-Up**: Auto-message no-shows with empathetic message + one-tap rebook. Track no-show patterns per client (frequent no-show = future deposit required). Effort: ~10-12 hrs.
16. **Auto-FAQ Responder**: Common DM questions ("Do you do balayage on dark hair?", "What's parking like?", "Can I bring kids?") answered instantly via AI in salon's voice. Enhances Chat Intelligence (shipped, item 21). Effort: ~16-20 hrs.
17. **Photo Quote Auto-Send**: Customer sends inspo photo, AI generates quote + service suggestion, sent to client for one-tap confirm. Enhances Chat Intelligence (shipped, item 21) photo-pricing. Effort: ~16 hrs.

### Phase 6: Extended invoicing (salon-specific scenarios)

18. **Recurring Invoices**: Set-and-forget monthly billing for chair-rental tenants + subscription clients + corporate accounts. Auto-charges card on file OR sends pay-link. Effort: ~16-20 hrs.
19. **Supplier Bill Tracking**: Salon snaps photo of supplier invoice, AI extracts vendor / amount / due date / category, dashboard shows incoming bills sorted by due date. No payment processed, just visibility. Prevents late fees + strained vendor relationships. Effort: ~12-16 hrs.
20. **Corporate Accounts**: Configure a company as a billable client. Employees book individually all month, then ONE consolidated invoice goes to company HR at month end. Currently impossible in Solen. Effort: ~24 hrs.
21. **Bridal Package Plans**: Multi-installment payments for high-ticket weddings: deposit on book, milestone payments tracked, auto-reminders for each. Wedding tickets are 4-figure; losing one to a failed installment chase is brutal. Effort: ~20-24 hrs.
22. **Bulk Gift Card B2B**: Companies buy 50 gift cards as employee perks, one invoice for the bulk amount, salon delivers redemption codes via spreadsheet/email export. Extends Gift Cards (shipped, item 30) which is B2C only. Effort: ~12-16 hrs.

### Phase 7: Financial reporting

23. **Swiss VAT Monthly Report**: Auto-compile tax-ready PDF: income, VAT split, by-service breakdown, deductible expense summary. CH-localized format ready for Steueramt submission. Pure Swiss-market moat, Fresha/Treatwell/Booksy don't localize tax. Effort: ~24-32 hrs.

---

## Other B2B features (not workflow-style) *(brainstormed 2026-05-15)*

24. **Staff Performance Coaching**: Monthly AI-summarized staff performance + coaching suggestions ("Maria's rebook rate dropped 15%, could mean she needs scheduling support; here's how to bring it up"). Builds on Barber Leaderboard (shipped, item 54) but generalized + actionable. Effort: ~20 hrs.
25. **Smart Pricing Suggestions**: AI looks at competitor rates + your booking velocity + season, then suggests price changes per service. "Your balayage is booked 95%, consider +CHF 10." Effort: ~24 hrs.
26. **Booking Funnel Analytics**: Where customers drop off: salon-page-view, service-select, time-pick, checkout. With AI insights on why ("73% drop at service-select, your service names are too long / no English translations / no price visible"). Effort: ~16-20 hrs.
27. **AI Chat Triage**: Incoming DMs auto-classified (quote request / appointment change / complaint / spam / FAQ) + priority routing. Surfaces complaints to owner; routes FAQs to Auto-FAQ Responder (item 16 above). Effort: ~12-16 hrs.
28. **Salon Onboarding Wizard**: 5-min AI-assisted setup for new salons. Paste your Instagram/Google business URL, AI auto-extracts services, hours, photos, address. Owner just confirms + edits. Reduces signup friction from hours to minutes. Effort: ~32-40 hrs.
29. **Service Description Writer**: AI generates service descriptions in salon's voice from category + duration + price. "Balayage L, 90 min, CHF 180" becomes full marketing copy. Effort: ~8 hrs.
30. **Multi-Location Dashboard**: For salon chains (already supported via salon_groups, shipped item 18), a unified KPI view across all locations: bookings, revenue, staff utilization, comparative analytics. Effort: ~32 hrs.
31. **Auto-Translate Service Names**: DE base services auto-translate to FR/IT/EN for multilingual / tourist clients. One-time AI batch + manual review per service. Effort: ~12 hrs.
32. **Embeddable Booking Widget**: JS snippet salon pastes on their own website. "Book now" iframe with salon's services + Stripe checkout, all branded with salon colors. Effort: ~24-32 hrs.
33. **WhatsApp Business Booking**: Customers book via WhatsApp chat with the salon. Uses WhatsApp Business API + Solen's slot engine. Massive in CH for older clientele. Effort: ~40 hrs.
34. **AI Voice Booking (Phone Receptionist)**: AI answers the salon's phone, takes bookings, escalates to human for complex queries. Huge for older Swiss clientele who still call. Twilio + Claude voice. Effort: ~48-60 hrs.
35. **Mystery Shopper Service**: Solen-paid (premium tier) feature: real customer evaluates salon experience, sends detailed report on greeting / cleanliness / service quality / payment friction. Quarterly. Solen-side ops effort, not engineering, ~minimal build.

36. **B2B Showcase Section, Caption-Pill Pattern (homepage redesign)** *(brainstormed 2026-05-16, design direction locked, build deferred)*: Replace the current single-CTA "Fur Salons" homepage section with a 3-feature mini-showcase. Each card shows a real dashboard preview screenshot + a floating dark-ink caption pill bottom-left ("HEUTE FREI, -20%" / "AUTO-SMS" / "STRIPE PAYOUTS" style). Editorial-portfolio aesthetic, same family as current V3 (Peace Sans + cream + emerald), just adds the pill labeling pattern. **Blocker:** the 3 features shown need to actually exist + look polished in production before this can ship; promising features in the homepage UI that aren't built is a trust hit. **Build when:** Last-Minute discount engine, Auto-SMS reminders, and Stripe Connect payouts are all live + have screenshot-worthy dashboard UI. **Design ref:** test mockup was at `public/solen-topic2-test.html` (deleted post-decision); reference video was Instagram reel DYEtIuGo7CC, ux.aneta's AI design portfolio caption pills. **Pattern reuse plan:** if shipped, also apply caption pills to About / How-it-works / Stylist profile portfolio area for system consistency (the pattern only works if used in 2-3 places, otherwise reads random). Effort: ~12-16 hrs for the homepage section alone, +8-12 hrs per additional surface.
