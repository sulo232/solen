# Key Features Reference

> **V5 HOMEPAGE HERO**: The homepage hero uses a **cinematic warm gradient background** (cream → coral blush → plum shadow) — NOT a flat white background. The search bar is ALWAYS visible as a floating glass pill (not hidden until hover). A photo/video background may be swapped in later once licensed assets are available.

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
11. **Dark Mode**: System/manual toggle via `ThemeToggle` in Header. `darkMode: 'class'` in Tailwind.
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
