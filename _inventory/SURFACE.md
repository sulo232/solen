# Solen Surface Map — what EXISTS

> 🤖 **AUTO-GENERATED — do not edit by hand.** Run `npm run inventory` to regenerate.
>
> This is the source of truth for *what exists*. **Before building any new page / endpoint /
> component / table, check here or run `npm run exists <keyword>`.** When the map is silent,
> the thing genuinely does not exist — build it. When it has a hit, REUSE or EXTEND.
>
> For *status* (partial · deprecated · don't-reuse-for) see `_inventory/STATUS.md` (hand-kept).

**Totals:** 134 routes · 352 API endpoints · 407 components · 106 lib/hooks modules · 34 DB functions · 74 DB tables · 883 columns indexed

## Routes (pages)

| URL | File |
|---|---|
| `/[locale]` | `app/[locale]/page.tsx` |
| `/[locale]/[city]` | `app/[locale]/[city]/page.tsx` |
| `/[locale]/[city]/[category]` | `app/[locale]/[city]/[category]/page.tsx` |
| `/[locale]/account` | `app/[locale]/account/page.tsx` |
| `/[locale]/account/messages` | `app/[locale]/account/messages/page.tsx` |
| `/[locale]/agb` | `app/[locale]/agb/page.tsx` |
| `/[locale]/angebote` | `app/[locale]/angebote/page.tsx` |
| `/[locale]/auth/login` | `app/[locale]/auth/login/page.tsx` |
| `/[locale]/auth/register` | `app/[locale]/auth/register/page.tsx` |
| `/[locale]/auth/reset-password` | `app/[locale]/auth/reset-password/page.tsx` |
| `/[locale]/auth/signup` | `app/[locale]/auth/signup/page.tsx` |
| `/[locale]/barbershop` | `app/[locale]/barbershop/page.tsx` |
| `/[locale]/behandlungen/[...slug]` | `app/[locale]/behandlungen/[...slug]/page.tsx` |
| `/[locale]/blog` | `app/[locale]/blog/page.tsx` |
| `/[locale]/booking-action` | `app/[locale]/booking-action/page.tsx` |
| `/[locale]/booking/lookup` | `app/[locale]/booking/lookup/page.tsx` |
| `/[locale]/booking/resend-link` | `app/[locale]/booking/resend-link/page.tsx` |
| `/[locale]/bookings/[id]/refund` | `app/[locale]/bookings/[id]/refund/page.tsx` |
| `/[locale]/bookings/[id]/report` | `app/[locale]/bookings/[id]/report/page.tsx` |
| `/[locale]/bookings/[id]/upcharge` | `app/[locale]/bookings/[id]/upcharge/page.tsx` |
| `/[locale]/brand/[slug]` | `app/[locale]/brand/[slug]/page.tsx` |
| `/[locale]/business` | `app/[locale]/business/page.tsx` |
| `/[locale]/checkout` | `app/[locale]/checkout/page.tsx` |
| `/[locale]/coiffeur` | `app/[locale]/coiffeur/page.tsx` |
| `/[locale]/coming-soon` | `app/[locale]/coming-soon/page.tsx` |
| `/[locale]/confirmation` | `app/[locale]/confirmation/page.tsx` |
| `/[locale]/dashboard` | `app/[locale]/dashboard/page.tsx` |
| `/[locale]/dashboard/admin-sandbox` | `app/[locale]/dashboard/admin-sandbox/page.tsx` |
| `/[locale]/dashboard/all-salons` | `app/[locale]/dashboard/all-salons/page.tsx` |
| `/[locale]/dashboard/all-users` | `app/[locale]/dashboard/all-users/page.tsx` |
| `/[locale]/dashboard/analytics` | `app/[locale]/dashboard/analytics/page.tsx` |
| `/[locale]/dashboard/approvals` | `app/[locale]/dashboard/approvals/page.tsx` |
| `/[locale]/dashboard/badge-manager` | `app/[locale]/dashboard/badge-manager/page.tsx` |
| `/[locale]/dashboard/barber-clients` | `app/[locale]/dashboard/barber-clients/page.tsx` |
| `/[locale]/dashboard/barber-ops` | `app/[locale]/dashboard/barber-ops/page.tsx` |
| `/[locale]/dashboard/bookings` | `app/[locale]/dashboard/bookings/page.tsx` |
| `/[locale]/dashboard/calendar` | `app/[locale]/dashboard/calendar/page.tsx` |
| `/[locale]/dashboard/cases` | `app/[locale]/dashboard/cases/page.tsx` |
| `/[locale]/dashboard/clients` | `app/[locale]/dashboard/clients/page.tsx` |
| `/[locale]/dashboard/coiffeur-crm` | `app/[locale]/dashboard/coiffeur-crm/page.tsx` |
| `/[locale]/dashboard/commission-admin` | `app/[locale]/dashboard/commission-admin/page.tsx` |
| `/[locale]/dashboard/content-editor` | `app/[locale]/dashboard/content-editor/page.tsx` |
| `/[locale]/dashboard/discovery-admin` | `app/[locale]/dashboard/discovery-admin/page.tsx` |
| `/[locale]/dashboard/discovery-posts` | `app/[locale]/dashboard/discovery-posts/page.tsx` |
| `/[locale]/dashboard/earnings` | `app/[locale]/dashboard/earnings/page.tsx` |
| `/[locale]/dashboard/editor` | `app/[locale]/dashboard/editor/page.tsx` |
| `/[locale]/dashboard/gallery` | `app/[locale]/dashboard/gallery/page.tsx` |
| `/[locale]/dashboard/help-editor` | `app/[locale]/dashboard/help-editor/page.tsx` |
| `/[locale]/dashboard/homepage-admin` | `app/[locale]/dashboard/homepage-admin/page.tsx` |
| `/[locale]/dashboard/loyalty` | `app/[locale]/dashboard/loyalty/page.tsx` |
| `/[locale]/dashboard/marketing` | `app/[locale]/dashboard/marketing/page.tsx` |
| `/[locale]/dashboard/messages` | `app/[locale]/dashboard/messages/page.tsx` |
| `/[locale]/dashboard/nail-admin` | `app/[locale]/dashboard/nail-admin/page.tsx` |
| `/[locale]/dashboard/nail-clients` | `app/[locale]/dashboard/nail-clients/page.tsx` |
| `/[locale]/dashboard/platform-analytics` | `app/[locale]/dashboard/platform-analytics/page.tsx` |
| `/[locale]/dashboard/queue-display` | `app/[locale]/dashboard/queue-display/page.tsx` |
| `/[locale]/dashboard/refunds` | `app/[locale]/dashboard/refunds/page.tsx` |
| `/[locale]/dashboard/revenue` | `app/[locale]/dashboard/revenue/page.tsx` |
| `/[locale]/dashboard/review-moderation` | `app/[locale]/dashboard/review-moderation/page.tsx` |
| `/[locale]/dashboard/reviews` | `app/[locale]/dashboard/reviews/page.tsx` |
| `/[locale]/dashboard/segments` | `app/[locale]/dashboard/segments/page.tsx` |
| `/[locale]/dashboard/services` | `app/[locale]/dashboard/services/page.tsx` |
| `/[locale]/dashboard/settings` | `app/[locale]/dashboard/settings/page.tsx` |
| `/[locale]/dashboard/setup` | `app/[locale]/dashboard/setup/page.tsx` |
| `/[locale]/dashboard/spa-admin` | `app/[locale]/dashboard/spa-admin/page.tsx` |
| `/[locale]/dashboard/staff` | `app/[locale]/dashboard/staff/page.tsx` |
| `/[locale]/dashboard/upcharge` | `app/[locale]/dashboard/upcharge/page.tsx` |
| `/[locale]/dashboard/verification` | `app/[locale]/dashboard/verification/page.tsx` |
| `/[locale]/datenschutz` | `app/[locale]/datenschutz/page.tsx` |
| `/[locale]/dev/confirm-preview` | `app/[locale]/dev/confirm-preview/page.tsx` |
| `/[locale]/dev/new-primitives` | `app/[locale]/dev/new-primitives/page.tsx` |
| `/[locale]/dev/primitives` | `app/[locale]/dev/primitives/page.tsx` |
| `/[locale]/fuer-salons` | `app/[locale]/fuer-salons/page.tsx` |
| `/[locale]/help` | `app/[locale]/help/page.tsx` |
| `/[locale]/help/[slug]` | `app/[locale]/help/[slug]/page.tsx` |
| `/[locale]/impressum` | `app/[locale]/impressum/page.tsx` |
| `/[locale]/inspo` | `app/[locale]/inspo/page.tsx` |
| `/[locale]/inspo/[id]` | `app/[locale]/inspo/[id]/page.tsx` |
| `/[locale]/inspo/board/[id]` | `app/[locale]/inspo/board/[id]/page.tsx` |
| `/[locale]/inspo/nails` | `app/[locale]/inspo/nails/page.tsx` |
| `/[locale]/inspo/saved` | `app/[locale]/inspo/saved/page.tsx` |
| `/[locale]/inspo/saved/[id]` | `app/[locale]/inspo/saved/[id]/page.tsx` |
| `/[locale]/karriere` | `app/[locale]/karriere/page.tsx` |
| `/[locale]/kontakt` | `app/[locale]/kontakt/page.tsx` |
| `/[locale]/last-minute` | `app/[locale]/last-minute/page.tsx` |
| `/[locale]/legal/privacy` | `app/[locale]/legal/privacy/page.tsx` |
| `/[locale]/legal/terms` | `app/[locale]/legal/terms/page.tsx` |
| `/[locale]/loyalty/stamp` | `app/[locale]/loyalty/stamp/page.tsx` |
| `/[locale]/nail-tech/[id]` | `app/[locale]/nail-tech/[id]/page.tsx` |
| `/[locale]/nails` | `app/[locale]/nails/page.tsx` |
| `/[locale]/notifications` | `app/[locale]/notifications/page.tsx` |
| `/[locale]/onboarding` | `app/[locale]/onboarding/page.tsx` |
| `/[locale]/onboarding/salon` | `app/[locale]/onboarding/salon/page.tsx` |
| `/[locale]/partner` | `app/[locale]/partner/page.tsx` |
| `/[locale]/presse` | `app/[locale]/presse/page.tsx` |
| `/[locale]/privacy` | `app/[locale]/privacy/page.tsx` |
| `/[locale]/profile` | `app/[locale]/profile/page.tsx` |
| `/[locale]/profile/bookings` | `app/[locale]/profile/bookings/page.tsx` |
| `/[locale]/profile/favorites` | `app/[locale]/profile/favorites/page.tsx` |
| `/[locale]/profile/gift-cards` | `app/[locale]/profile/gift-cards/page.tsx` |
| `/[locale]/profile/haarprofil` | `app/[locale]/profile/haarprofil/page.tsx` |
| `/[locale]/profile/intake-forms` | `app/[locale]/profile/intake-forms/page.tsx` |
| `/[locale]/profile/looks` | `app/[locale]/profile/looks/page.tsx` |
| `/[locale]/profile/referral` | `app/[locale]/profile/referral/page.tsx` |
| `/[locale]/profile/settings` | `app/[locale]/profile/settings/page.tsx` |
| `/[locale]/profile/stamps` | `app/[locale]/profile/stamps/page.tsx` |
| `/[locale]/profile/vouchers` | `app/[locale]/profile/vouchers/page.tsx` |
| `/[locale]/queue/[token]` | `app/[locale]/queue/[token]/page.tsx` |
| `/[locale]/recently-viewed` | `app/[locale]/recently-viewed/page.tsx` |
| `/[locale]/referral/[code]` | `app/[locale]/referral/[code]/page.tsx` |
| `/[locale]/reviews` | `app/[locale]/reviews/page.tsx` |
| `/[locale]/rewards` | `app/[locale]/rewards/page.tsx` |
| `/[locale]/salon/[slug]` | `app/[locale]/salon/[slug]/page.tsx` |
| `/[locale]/salon/[slug]/barber/[barberSlug]` | `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx` |
| `/[locale]/salon/[slug]/booking` | `app/[locale]/salon/[slug]/booking/page.tsx` |
| `/[locale]/salon/[slug]/gift-card` | `app/[locale]/salon/[slug]/gift-card/page.tsx` |
| `/[locale]/salon/[slug]/reviews` | `app/[locale]/salon/[slug]/reviews/page.tsx` |
| `/[locale]/salon/[slug]/staff/[staffId]` | `app/[locale]/salon/[slug]/staff/[staffId]/page.tsx` |
| `/[locale]/search` | `app/[locale]/search/page.tsx` |
| `/[locale]/sicherheit` | `app/[locale]/sicherheit/page.tsx` |
| `/[locale]/spa` | `app/[locale]/spa/page.tsx` |
| `/[locale]/staff-invite` | `app/[locale]/staff-invite/page.tsx` |
| `/[locale]/termine` | `app/[locale]/termine/page.tsx` |
| `/[locale]/terms` | `app/[locale]/terms/page.tsx` |
| `/[locale]/terms/discovery` | `app/[locale]/terms/discovery/page.tsx` |
| `/[locale]/tip/[bookingId]` | `app/[locale]/tip/[bookingId]/page.tsx` |
| `/[locale]/tos` | `app/[locale]/tos/page.tsx` |
| `/[locale]/ueber-uns` | `app/[locale]/ueber-uns/page.tsx` |
| `/[locale]/vouchers` | `app/[locale]/vouchers/page.tsx` |
| `/[locale]/vouchers/buy` | `app/[locale]/vouchers/buy/page.tsx` |
| `/[locale]/walk-in-join` | `app/[locale]/walk-in-join/page.tsx` |
| `/[locale]/walk-in-pay` | `app/[locale]/walk-in-pay/page.tsx` |
| `/[locale]/walk-in-tip/[token]` | `app/[locale]/walk-in-tip/[token]/page.tsx` |
| `/[locale]/warum-solen` | `app/[locale]/warum-solen/page.tsx` |

## API endpoints

| Endpoint | Methods | File |
|---|---|---|
| `/api/admin/badges` | GET, POST | `app/api/admin/badges/route.ts` |
| `/api/admin/badges/[id]` | PATCH, DELETE | `app/api/admin/badges/[id]/route.ts` |
| `/api/admin/badges/assign` | POST | `app/api/admin/badges/assign/route.ts` |
| `/api/admin/badges/auto-assign` | POST | `app/api/admin/badges/auto-assign/route.ts` |
| `/api/admin/booking-disputes` | GET | `app/api/admin/booking-disputes/route.ts` |
| `/api/admin/booking-disputes/[id]` | GET | `app/api/admin/booking-disputes/[id]/route.ts` |
| `/api/admin/booking-disputes/[id]/action` | POST | `app/api/admin/booking-disputes/[id]/action/route.ts` |
| `/api/admin/commission` | GET, PUT | `app/api/admin/commission/route.ts` |
| `/api/admin/content-list` | GET | `app/api/admin/content-list/route.ts` |
| `/api/admin/content/[key]` | PUT | `app/api/admin/content/[key]/route.ts` |
| `/api/admin/discovery` | GET, PATCH, DELETE | `app/api/admin/discovery/route.ts` |
| `/api/admin/discovery/analyze` | POST | `app/api/admin/discovery/analyze/route.ts` |
| `/api/admin/discovery/backfill` | POST | `app/api/admin/discovery/backfill/route.ts` |
| `/api/admin/discovery/bulk-import` | POST | `app/api/admin/discovery/bulk-import/route.ts` |
| `/api/admin/discovery/check-ai` | GET | `app/api/admin/discovery/check-ai/route.ts` |
| `/api/admin/discovery/import-tiktok` | POST | `app/api/admin/discovery/import-tiktok/route.ts` |
| `/api/admin/discovery/moderation` | GET, PUT | `app/api/admin/discovery/moderation/route.ts` |
| `/api/admin/discovery/search-stock` | POST | `app/api/admin/discovery/search-stock/route.ts` |
| `/api/admin/discovery/smart-import` | POST | `app/api/admin/discovery/smart-import/route.ts` |
| `/api/admin/discovery/staging` | GET, PUT | `app/api/admin/discovery/staging/route.ts` |
| `/api/admin/discovery/upload` | POST | `app/api/admin/discovery/upload/route.ts` |
| `/api/admin/feature-flags` | GET, PATCH | `app/api/admin/feature-flags/route.ts` |
| `/api/admin/feature-requests` | GET, POST | `app/api/admin/feature-requests/route.ts` |
| `/api/admin/feature-requests/[id]` | PATCH, DELETE | `app/api/admin/feature-requests/[id]/route.ts` |
| `/api/admin/generate-roadmap` | POST | `app/api/admin/generate-roadmap/route.ts` |
| `/api/admin/help` | GET, POST, PATCH, DELETE | `app/api/admin/help/route.ts` |
| `/api/admin/homepage-sections` | GET, PUT | `app/api/admin/homepage-sections/route.ts` |
| `/api/admin/nail/generate` | POST, GET | `app/api/admin/nail/generate/route.ts` |
| `/api/admin/notify-new-salon` | POST | `app/api/admin/notify-new-salon/route.ts` |
| `/api/admin/preview-salon` | POST, DELETE | `app/api/admin/preview-salon/route.ts` |
| `/api/admin/purchase-refund` | POST | `app/api/admin/purchase-refund/route.ts` |
| `/api/admin/revenue` | GET | `app/api/admin/revenue/route.ts` |
| `/api/admin/reviews` | GET | `app/api/admin/reviews/route.ts` |
| `/api/admin/reviews/[id]` | PATCH, DELETE | `app/api/admin/reviews/[id]/route.ts` |
| `/api/admin/salon-of-month` | GET, POST | `app/api/admin/salon-of-month/route.ts` |
| `/api/admin/salons` | GET | `app/api/admin/salons/route.ts` |
| `/api/admin/salons/[id]/approve` | PATCH | `app/api/admin/salons/[id]/approve/route.ts` |
| `/api/admin/salons/[id]/freeze` | POST | `app/api/admin/salons/[id]/freeze/route.ts` |
| `/api/admin/salons/[id]/reject` | PATCH | `app/api/admin/salons/[id]/reject/route.ts` |
| `/api/admin/salons/[id]/warn` | POST | `app/api/admin/salons/[id]/warn/route.ts` |
| `/api/admin/search/generate-embeddings` | POST | `app/api/admin/search/generate-embeddings/route.ts` |
| `/api/admin/seed-test-salons` | POST, DELETE, GET | `app/api/admin/seed-test-salons/route.ts` |
| `/api/admin/segments` | GET | `app/api/admin/segments/route.ts` |
| `/api/admin/segments/[id]/members` | GET | `app/api/admin/segments/[id]/members/route.ts` |
| `/api/admin/solen-score/recalculate` | POST | `app/api/admin/solen-score/recalculate/route.ts` |
| `/api/admin/test-salon` | GET, POST, DELETE | `app/api/admin/test-salon/route.ts` |
| `/api/admin/test-salon/seed` | POST | `app/api/admin/test-salon/seed/route.ts` |
| `/api/admin/tos/notify` | POST | `app/api/admin/tos/notify/route.ts` |
| `/api/admin/users` | GET, PATCH | `app/api/admin/users/route.ts` |
| `/api/ai/intake-recommendation` | POST | `app/api/ai/intake-recommendation/route.ts` |
| `/api/ai/recommend` | POST | `app/api/ai/recommend/route.ts` |
| `/api/ai/suggest-service` | POST | `app/api/ai/suggest-service/route.ts` |
| `/api/analytics/benchmarks` | GET | `app/api/analytics/benchmarks/route.ts` |
| `/api/analytics/gift-card-revenue` | GET | `app/api/analytics/gift-card-revenue/route.ts` |
| `/api/analytics/platform` | GET | `app/api/analytics/platform/route.ts` |
| `/api/analytics/referrals` | GET | `app/api/analytics/referrals/route.ts` |
| `/api/analytics/salon/[id]` | GET | `app/api/analytics/salon/[id]/route.ts` |
| `/api/analytics/staff-comparison` | GET | `app/api/analytics/staff-comparison/route.ts` |
| `/api/analytics/staff/[id]` | GET | `app/api/analytics/staff/[id]/route.ts` |
| `/api/analytics/track-view` | POST | `app/api/analytics/track-view/route.ts` |
| `/api/auth/callback` | GET | `app/api/auth/callback/route.ts` |
| `/api/auth/login` | POST | `app/api/auth/login/route.ts` |
| `/api/auth/logout` | POST | `app/api/auth/logout/route.ts` |
| `/api/auth/signup` | POST | `app/api/auth/signup/route.ts` |
| `/api/auth/verify-otp` | POST | `app/api/auth/verify-otp/route.ts` |
| `/api/auth/verify-phone/check` | POST | `app/api/auth/verify-phone/check/route.ts` |
| `/api/auth/verify-phone/send` | POST | `app/api/auth/verify-phone/send/route.ts` |
| `/api/availability/[salon_id]` | GET | `app/api/availability/[salon_id]/route.ts` |
| `/api/availability/manage` | POST | `app/api/availability/manage/route.ts` |
| `/api/availability/manage/[slot_id]` | DELETE | `app/api/availability/manage/[slot_id]/route.ts` |
| `/api/availability/time-slots` | GET | `app/api/availability/time-slots/route.ts` |
| `/api/availability/unavailable-dates` | GET | `app/api/availability/unavailable-dates/route.ts` |
| `/api/barber/[slug]` | GET | `app/api/barber/[slug]/route.ts` |
| `/api/barber/[slug]/portfolio` | GET | `app/api/barber/[slug]/portfolio/route.ts` |
| `/api/bookings` | GET, POST | `app/api/bookings/route.ts` |
| `/api/bookings/[id]` | GET, PATCH | `app/api/bookings/[id]/route.ts` |
| `/api/bookings/[id]/cancel` | GET, POST | `app/api/bookings/[id]/cancel/route.ts` |
| `/api/bookings/[id]/confirm` | POST | `app/api/bookings/[id]/confirm/route.ts` |
| `/api/bookings/[id]/dispute` | GET, POST, PATCH | `app/api/bookings/[id]/dispute/route.ts` |
| `/api/bookings/[id]/escalate` | POST | `app/api/bookings/[id]/escalate/route.ts` |
| `/api/bookings/[id]/inspo` | GET, POST | `app/api/bookings/[id]/inspo/route.ts` |
| `/api/bookings/[id]/quick-action` | GET | `app/api/bookings/[id]/quick-action/route.ts` |
| `/api/bookings/[id]/refund` | POST | `app/api/bookings/[id]/refund/route.ts` |
| `/api/bookings/[id]/report` | GET, POST, PATCH | `app/api/bookings/[id]/report/route.ts` |
| `/api/bookings/[id]/reschedule` | POST | `app/api/bookings/[id]/reschedule/route.ts` |
| `/api/bookings/express-rebook` | POST | `app/api/bookings/express-rebook/route.ts` |
| `/api/bookings/express-rebook/confirm` | POST | `app/api/bookings/express-rebook/confirm/route.ts` |
| `/api/bookings/group` | POST | `app/api/bookings/group/route.ts` |
| `/api/bookings/guest-lookup` | GET | `app/api/bookings/guest-lookup/route.ts` |
| `/api/bookings/recurring` | POST | `app/api/bookings/recurring/route.ts` |
| `/api/bookings/recurring/[id]` | DELETE | `app/api/bookings/recurring/[id]/route.ts` |
| `/api/bookings/resend-access` | POST | `app/api/bookings/resend-access/route.ts` |
| `/api/bookings/user` | GET | `app/api/bookings/user/route.ts` |
| `/api/bookings/waitlist` | POST | `app/api/bookings/waitlist/route.ts` |
| `/api/bookings/walk-in` | POST | `app/api/bookings/walk-in/route.ts` |
| `/api/bookings/walk-in-verify` | GET | `app/api/bookings/walk-in-verify/route.ts` |
| `/api/brand/[slug]` | GET | `app/api/brand/[slug]/route.ts` |
| `/api/categories` | GET | `app/api/categories/route.ts` |
| `/api/chat-templates` | GET, POST, DELETE | `app/api/chat-templates/route.ts` |
| `/api/chat/suggest` | POST | `app/api/chat/suggest/route.ts` |
| `/api/cities` | GET | `app/api/cities/route.ts` |
| `/api/client-notes` | GET, POST | `app/api/client-notes/route.ts` |
| `/api/clients/[id]/cut-history` | GET, POST | `app/api/clients/[id]/cut-history/route.ts` |
| `/api/clients/[id]/formulas` | GET, POST | `app/api/clients/[id]/formulas/route.ts` |
| `/api/clients/[id]/intake` | GET, POST | `app/api/clients/[id]/intake/route.ts` |
| `/api/clients/[id]/nail-allergies` | GET | `app/api/clients/[id]/nail-allergies/route.ts` |
| `/api/clients/[id]/nail-history` | GET, POST | `app/api/clients/[id]/nail-history/route.ts` |
| `/api/clients/[id]/nail-preferences` | GET, PUT | `app/api/clients/[id]/nail-preferences/route.ts` |
| `/api/clients/[id]/photos` | GET, POST | `app/api/clients/[id]/photos/route.ts` |
| `/api/clients/[id]/repeat-last` | GET | `app/api/clients/[id]/repeat-last/route.ts` |
| `/api/clients/[id]/repeat-last-cut` | GET | `app/api/clients/[id]/repeat-last-cut/route.ts` |
| `/api/coming-soon-notify` | POST | `app/api/coming-soon-notify/route.ts` |
| `/api/content` | GET | `app/api/content/route.ts` |
| `/api/conversations` | GET, POST | `app/api/conversations/route.ts` |
| `/api/conversations/[id]/messages` | GET, POST | `app/api/conversations/[id]/messages/route.ts` |
| `/api/conversations/[id]/price-offer` | POST, PATCH | `app/api/conversations/[id]/price-offer/route.ts` |
| `/api/cron/abandon-sweep` | GET | `app/api/cron/abandon-sweep/route.ts` |
| `/api/cron/auto-complete` | GET | `app/api/cron/auto-complete/route.ts` |
| `/api/cron/barber-smart-reminders` | GET | `app/api/cron/barber-smart-reminders/route.ts` |
| `/api/cron/birthday-messages` | GET | `app/api/cron/birthday-messages/route.ts` |
| `/api/cron/discovery-deadcheck` | GET | `app/api/cron/discovery-deadcheck/route.ts` |
| `/api/cron/generate-slots` | GET | `app/api/cron/generate-slots/route.ts` |
| `/api/cron/late-cancel` | GET | `app/api/cron/late-cancel/route.ts` |
| `/api/cron/loyalty-recompute` | GET | `app/api/cron/loyalty-recompute/route.ts` |
| `/api/cron/nail-infill-reminders` | GET | `app/api/cron/nail-infill-reminders/route.ts` |
| `/api/cron/no-show` | GET | `app/api/cron/no-show/route.ts` |
| `/api/cron/pending-timeout` | GET | `app/api/cron/pending-timeout/route.ts` |
| `/api/cron/pre-charge` | GET | `app/api/cron/pre-charge/route.ts` |
| `/api/cron/process-deletions` | GET | `app/api/cron/process-deletions/route.ts` |
| `/api/cron/rebooking-nudge` | GET | `app/api/cron/rebooking-nudge/route.ts` |
| `/api/cron/reconcile` | GET | `app/api/cron/reconcile/route.ts` |
| `/api/cron/release-deposits` | GET | `app/api/cron/release-deposits/route.ts` |
| `/api/cron/release-payments` | GET | `app/api/cron/release-payments/route.ts` |
| `/api/cron/reminders` | GET | `app/api/cron/reminders/route.ts` |
| `/api/cron/review-prompt` | GET | `app/api/cron/review-prompt/route.ts` |
| `/api/cron/salon-onboarding` | GET | `app/api/cron/salon-onboarding/route.ts` |
| `/api/cron/sms-reminders` | GET | `app/api/cron/sms-reminders/route.ts` |
| `/api/cron/welcome-series` | GET | `app/api/cron/welcome-series/route.ts` |
| `/api/dashboard/activity-feed` | GET | `app/api/dashboard/activity-feed/route.ts` |
| `/api/dashboard/barber-leaderboard` | GET | `app/api/dashboard/barber-leaderboard/route.ts` |
| `/api/dashboard/barber-reminders` | GET | `app/api/dashboard/barber-reminders/route.ts` |
| `/api/dashboard/barber-reminders/send` | POST | `app/api/dashboard/barber-reminders/send/route.ts` |
| `/api/dashboard/barber/pl-comparison` | GET | `app/api/dashboard/barber/pl-comparison/route.ts` |
| `/api/dashboard/batch` | POST | `app/api/dashboard/batch/route.ts` |
| `/api/dashboard/clients` | GET | `app/api/dashboard/clients/route.ts` |
| `/api/dashboard/clients/[id]/notes` | GET, POST, DELETE | `app/api/dashboard/clients/[id]/notes/route.ts` |
| `/api/dashboard/clients/[id]/tags` | GET, POST, DELETE | `app/api/dashboard/clients/[id]/tags/route.ts` |
| `/api/dashboard/coiffeur/consultations` | GET, POST | `app/api/dashboard/coiffeur/consultations/route.ts` |
| `/api/dashboard/coiffeur/cycle-metrics` | GET | `app/api/dashboard/coiffeur/cycle-metrics/route.ts` |
| `/api/dashboard/coiffeur/formula-photo` | POST | `app/api/dashboard/coiffeur/formula-photo/route.ts` |
| `/api/dashboard/disputes` | GET | `app/api/dashboard/disputes/route.ts` |
| `/api/dashboard/fade-blueprints` | GET, POST | `app/api/dashboard/fade-blueprints/route.ts` |
| `/api/dashboard/nail/ai-history` | GET, PATCH | `app/api/dashboard/nail/ai-history/route.ts` |
| `/api/dashboard/nail/infill-due` | GET | `app/api/dashboard/nail/infill-due/route.ts` |
| `/api/dashboard/nail/reminder-metrics` | GET | `app/api/dashboard/nail/reminder-metrics/route.ts` |
| `/api/dashboard/nail/retail-sales` | GET | `app/api/dashboard/nail/retail-sales/route.ts` |
| `/api/dashboard/nail/stations/utilization` | GET | `app/api/dashboard/nail/stations/utilization/route.ts` |
| `/api/dashboard/spa/rooms` | GET, POST, PUT, DELETE | `app/api/dashboard/spa/rooms/route.ts` |
| `/api/dashboard/spa/treatment-outcomes` | GET, POST | `app/api/dashboard/spa/treatment-outcomes/route.ts` |
| `/api/dashboard/spa/wellness-journal` | GET, POST | `app/api/dashboard/spa/wellness-journal/route.ts` |
| `/api/dashboard/today` | GET | `app/api/dashboard/today/route.ts` |
| `/api/dashboard/walkin-analytics` | GET | `app/api/dashboard/walkin-analytics/route.ts` |
| `/api/dev/login` | GET | `app/api/dev/login/route.ts` |
| `/api/directory` | GET | `app/api/directory/route.ts` |
| `/api/directory/[id]/claim` | POST | `app/api/directory/[id]/claim/route.ts` |
| `/api/discover/nails` | GET, POST | `app/api/discover/nails/route.ts` |
| `/api/discovery/boards` | GET | `app/api/discovery/boards/route.ts` |
| `/api/discovery/boards/[id]` | GET | `app/api/discovery/boards/[id]/route.ts` |
| `/api/discovery/chip-terms` | GET | `app/api/discovery/chip-terms/route.ts` |
| `/api/discovery/collections` | GET, POST | `app/api/discovery/collections/route.ts` |
| `/api/discovery/collections/[id]` | GET, PATCH, DELETE | `app/api/discovery/collections/[id]/route.ts` |
| `/api/discovery/collections/[id]/items` | POST, DELETE | `app/api/discovery/collections/[id]/items/route.ts` |
| `/api/discovery/comments` | GET, POST | `app/api/discovery/comments/route.ts` |
| `/api/discovery/feed` | GET | `app/api/discovery/feed/route.ts` |
| `/api/discovery/generate-description` | POST | `app/api/discovery/generate-description/route.ts` |
| `/api/discovery/interactions` | POST | `app/api/discovery/interactions/route.ts` |
| `/api/discovery/like` | POST | `app/api/discovery/like/route.ts` |
| `/api/discovery/post` | POST | `app/api/discovery/post/route.ts` |
| `/api/discovery/recent-searches` | GET, DELETE | `app/api/discovery/recent-searches/route.ts` |
| `/api/discovery/salons-for-style` | GET | `app/api/discovery/salons-for-style/route.ts` |
| `/api/discovery/save` | POST | `app/api/discovery/save/route.ts` |
| `/api/discovery/save/sync` | POST | `app/api/discovery/save/sync/route.ts` |
| `/api/discovery/saves` | GET | `app/api/discovery/saves/route.ts` |
| `/api/discovery/similar` | GET | `app/api/discovery/similar/route.ts` |
| `/api/discovery/style-names` | GET | `app/api/discovery/style-names/route.ts` |
| `/api/discovery/style-suggest` | GET | `app/api/discovery/style-suggest/route.ts` |
| `/api/discovery/thumb/[id]` | GET | `app/api/discovery/thumb/[id]/route.ts` |
| `/api/discovery/trending` | GET | `app/api/discovery/trending/route.ts` |
| `/api/earnings/staff` | GET | `app/api/earnings/staff/route.ts` |
| `/api/favorites/toggle` | POST | `app/api/favorites/toggle/route.ts` |
| `/api/gift-cards/balance` | GET | `app/api/gift-cards/balance/route.ts` |
| `/api/gift-cards/purchase` | POST | `app/api/gift-cards/purchase/route.ts` |
| `/api/gift-cards/redeem` | POST | `app/api/gift-cards/redeem/route.ts` |
| `/api/health` | GET | `app/api/health/route.ts` |
| `/api/help` | GET | `app/api/help/route.ts` |
| `/api/help/[slug]` | GET | `app/api/help/[slug]/route.ts` |
| `/api/homepage-sections` | GET | `app/api/homepage-sections/route.ts` |
| `/api/intake/templates` | GET | `app/api/intake/templates/route.ts` |
| `/api/loyalty` | GET | `app/api/loyalty/route.ts` |
| `/api/loyalty/award` | POST | `app/api/loyalty/award/route.ts` |
| `/api/loyalty/cards` | GET | `app/api/loyalty/cards/route.ts` |
| `/api/loyalty/cards/[cardId]` | GET | `app/api/loyalty/cards/[cardId]/route.ts` |
| `/api/loyalty/qr/[cardId]` | GET | `app/api/loyalty/qr/[cardId]/route.ts` |
| `/api/loyalty/redeem` | POST | `app/api/loyalty/redeem/route.ts` |
| `/api/loyalty/stamp` | POST | `app/api/loyalty/stamp/route.ts` |
| `/api/loyalty/status` | GET | `app/api/loyalty/status/route.ts` |
| `/api/me` | GET | `app/api/me/route.ts` |
| `/api/metrics/global` | GET | `app/api/metrics/global/route.ts` |
| `/api/nail-discovery/publish` | POST | `app/api/nail-discovery/publish/route.ts` |
| `/api/nail-inspo/boards` | GET, POST, DELETE | `app/api/nail-inspo/boards/route.ts` |
| `/api/nail-inspo/images` | GET, POST, DELETE | `app/api/nail-inspo/images/route.ts` |
| `/api/nail-tech/[id]/portfolio` | GET | `app/api/nail-tech/[id]/portfolio/route.ts` |
| `/api/nail/hand-chart` | GET, POST | `app/api/nail/hand-chart/route.ts` |
| `/api/nail/pricing` | GET, POST | `app/api/nail/pricing/route.ts` |
| `/api/nail/pricing/[id]` | DELETE | `app/api/nail/pricing/[id]/route.ts` |
| `/api/nail/retail` | GET, POST, PATCH | `app/api/nail/retail/route.ts` |
| `/api/nail/retail/checkout` | POST | `app/api/nail/retail/checkout/route.ts` |
| `/api/newsletter` | POST | `app/api/newsletter/route.ts` |
| `/api/notifications` | GET, PATCH | `app/api/notifications/route.ts` |
| `/api/notifications/off-peak` | POST | `app/api/notifications/off-peak/route.ts` |
| `/api/notify/review-posted` | POST | `app/api/notify/review-posted/route.ts` |
| `/api/notify/review-replied` | POST | `app/api/notify/review-replied/route.ts` |
| `/api/off-peak` | GET, POST, DELETE | `app/api/off-peak/route.ts` |
| `/api/partner/leads` | POST | `app/api/partner/leads/route.ts` |
| `/api/profile` | GET, PATCH | `app/api/profile/route.ts` |
| `/api/profile/accept-tos` | POST | `app/api/profile/accept-tos/route.ts` |
| `/api/profile/delete` | DELETE | `app/api/profile/delete/route.ts` |
| `/api/profile/export` | GET | `app/api/profile/export/route.ts` |
| `/api/profile/favorites` | GET, POST, DELETE | `app/api/profile/favorites/route.ts` |
| `/api/profile/live-state` | GET | `app/api/profile/live-state/route.ts` |
| `/api/profile/notifications` | GET, PATCH | `app/api/profile/notifications/route.ts` |
| `/api/profile/preferences` | GET | `app/api/profile/preferences/route.ts` |
| `/api/profile/request-deletion` | POST | `app/api/profile/request-deletion/route.ts` |
| `/api/profile/vouchers` | GET | `app/api/profile/vouchers/route.ts` |
| `/api/promo` | GET, POST | `app/api/promo/route.ts` |
| `/api/promo/validate` | POST | `app/api/promo/validate/route.ts` |
| `/api/quartier/subscribe` | POST | `app/api/quartier/subscribe/route.ts` |
| `/api/recommendations` | GET | `app/api/recommendations/route.ts` |
| `/api/recommendations/chips` | GET | `app/api/recommendations/chips/route.ts` |
| `/api/referral` | GET | `app/api/referral/route.ts` |
| `/api/referral/complete` | POST | `app/api/referral/complete/route.ts` |
| `/api/referral/validate` | GET | `app/api/referral/validate/route.ts` |
| `/api/reports` | POST | `app/api/reports/route.ts` |
| `/api/reviews` | POST | `app/api/reviews/route.ts` |
| `/api/reviews/[id]/flag` | POST | `app/api/reviews/[id]/flag/route.ts` |
| `/api/reviews/[id]/photos` | POST | `app/api/reviews/[id]/photos/route.ts` |
| `/api/reviews/[id]/respond` | PATCH | `app/api/reviews/[id]/respond/route.ts` |
| `/api/reviews/eligibility` | GET | `app/api/reviews/eligibility/route.ts` |
| `/api/reviews/featured` | GET | `app/api/reviews/featured/route.ts` |
| `/api/reviews/homepage` | GET | `app/api/reviews/homepage/route.ts` |
| `/api/reviews/my-booking` | GET | `app/api/reviews/my-booking/route.ts` |
| `/api/reviews/reply` | POST | `app/api/reviews/reply/route.ts` |
| `/api/reviews/salon/[salon_id]` | GET | `app/api/reviews/salon/[salon_id]/route.ts` |
| `/api/salon-draft` | GET, PUT, DELETE | `app/api/salon-draft/route.ts` |
| `/api/salon/chairs` | GET, PUT | `app/api/salon/chairs/route.ts` |
| `/api/salon/clients` | GET | `app/api/salon/clients/route.ts` |
| `/api/salon/closures` | GET, POST, DELETE | `app/api/salon/closures/route.ts` |
| `/api/salon/closures/[id]` | DELETE | `app/api/salon/closures/[id]/route.ts` |
| `/api/salon/documents` | GET, POST, DELETE | `app/api/salon/documents/route.ts` |
| `/api/salon/dynamic-pricing` | GET, POST, DELETE | `app/api/salon/dynamic-pricing/route.ts` |
| `/api/salon/earnings` | GET | `app/api/salon/earnings/route.ts` |
| `/api/salon/go-live` | GET, POST | `app/api/salon/go-live/route.ts` |
| `/api/salon/invoices/[payoutId]` | GET | `app/api/salon/invoices/[payoutId]/route.ts` |
| `/api/salon/last-minute-settings` | GET, POST | `app/api/salon/last-minute-settings/route.ts` |
| `/api/salon/loyalty` | GET, POST | `app/api/salon/loyalty/route.ts` |
| `/api/salon/retail` | GET, POST, PUT, DELETE | `app/api/salon/retail/route.ts` |
| `/api/salon/retail/[id]/refund` | POST | `app/api/salon/retail/[id]/refund/route.ts` |
| `/api/salon/retail/purchase` | POST | `app/api/salon/retail/purchase/route.ts` |
| `/api/salon/services` | GET | `app/api/salon/services/route.ts` |
| `/api/salon/setup-progress` | GET | `app/api/salon/setup-progress/route.ts` |
| `/api/salon/stations` | GET, PUT | `app/api/salon/stations/route.ts` |
| `/api/salons` | GET, POST | `app/api/salons/route.ts` |
| `/api/salons/[slug]` | GET, PATCH | `app/api/salons/[slug]/route.ts` |
| `/api/salons/[slug]/ai-info` | POST | `app/api/salons/[slug]/ai-info/route.ts` |
| `/api/salons/[slug]/badges` | GET | `app/api/salons/[slug]/badges/route.ts` |
| `/api/salons/[slug]/client-tags` | GET, POST, DELETE | `app/api/salons/[slug]/client-tags/route.ts` |
| `/api/salons/[slug]/gallery` | POST, DELETE, PATCH | `app/api/salons/[slug]/gallery/route.ts` |
| `/api/salons/[slug]/nearby` | GET | `app/api/salons/[slug]/nearby/route.ts` |
| `/api/salons/[slug]/off-peak-today` | GET | `app/api/salons/[slug]/off-peak-today/route.ts` |
| `/api/salons/[slug]/score` | GET | `app/api/salons/[slug]/score/route.ts` |
| `/api/salons/active` | POST | `app/api/salons/active/route.ts` |
| `/api/salons/by-category` | GET | `app/api/salons/by-category/route.ts` |
| `/api/salons/by-slug/[slug]` | GET | `app/api/salons/by-slug/[slug]/route.ts` |
| `/api/salons/by-slugs` | GET | `app/api/salons/by-slugs/route.ts` |
| `/api/salons/last-minute` | GET | `app/api/salons/last-minute/route.ts` |
| `/api/salons/mine` | GET, PATCH | `app/api/salons/mine/route.ts` |
| `/api/salons/nearby` | GET | `app/api/salons/nearby/route.ts` |
| `/api/salons/quartier-counts` | GET | `app/api/salons/quartier-counts/route.ts` |
| `/api/salons/quartier-featured` | GET | `app/api/salons/quartier-featured/route.ts` |
| `/api/salons/recommendations` | GET | `app/api/salons/recommendations/route.ts` |
| `/api/salons/search` | GET | `app/api/salons/search/route.ts` |
| `/api/salons/similar` | GET | `app/api/salons/similar/route.ts` |
| `/api/salons/trending` | GET | `app/api/salons/trending/route.ts` |
| `/api/salons/verify` | GET | `app/api/salons/verify/route.ts` |
| `/api/search/detect-category` | GET | `app/api/search/detect-category/route.ts` |
| `/api/search/event` | POST | `app/api/search/event/route.ts` |
| `/api/search/smart` | GET | `app/api/search/smart/route.ts` |
| `/api/search/suggest` | GET | `app/api/search/suggest/route.ts` |
| `/api/search/treatments` | GET | `app/api/search/treatments/route.ts` |
| `/api/services` | GET, POST | `app/api/services/route.ts` |
| `/api/services/[id]` | GET, PATCH, DELETE | `app/api/services/[id]/route.ts` |
| `/api/services/[id]/photos` | POST | `app/api/services/[id]/photos/route.ts` |
| `/api/services/import` | POST | `app/api/services/import/route.ts` |
| `/api/services/reorder` | PATCH | `app/api/services/reorder/route.ts` |
| `/api/services/suggest` | GET | `app/api/services/suggest/route.ts` |
| `/api/slots` | GET, POST | `app/api/slots/route.ts` |
| `/api/slots/[id]` | DELETE, PATCH | `app/api/slots/[id]/route.ts` |
| `/api/slots/bulk` | POST | `app/api/slots/bulk/route.ts` |
| `/api/slots/last-minute` | GET | `app/api/slots/last-minute/route.ts` |
| `/api/slots/next-available` | GET | `app/api/slots/next-available/route.ts` |
| `/api/staff` | GET | `app/api/staff/route.ts` |
| `/api/staff/[id]` | PATCH, DELETE | `app/api/staff/[id]/route.ts` |
| `/api/staff/[id]/availability` | GET | `app/api/staff/[id]/availability/route.ts` |
| `/api/staff/[id]/profile` | GET | `app/api/staff/[id]/profile/route.ts` |
| `/api/staff/[id]/slug` | PUT | `app/api/staff/[id]/slug/route.ts` |
| `/api/staff/accept-invite` | POST | `app/api/staff/accept-invite/route.ts` |
| `/api/staff/breaks` | GET, POST, DELETE | `app/api/staff/breaks/route.ts` |
| `/api/staff/featured` | GET | `app/api/staff/featured/route.ts` |
| `/api/staff/invite` | GET, POST | `app/api/staff/invite/route.ts` |
| `/api/staff/my-schedule` | GET, PUT | `app/api/staff/my-schedule/route.ts` |
| `/api/staff/portfolio` | POST | `app/api/staff/portfolio/route.ts` |
| `/api/staff/schedule/auto-apply` | POST | `app/api/staff/schedule/auto-apply/route.ts` |
| `/api/staff/services` | GET, POST | `app/api/staff/services/route.ts` |
| `/api/staff/time-off` | GET, POST, DELETE | `app/api/staff/time-off/route.ts` |
| `/api/stripe/booking-pay-intent` | POST | `app/api/stripe/booking-pay-intent/route.ts` |
| `/api/stripe/connect/create-account` | POST | `app/api/stripe/connect/create-account/route.ts` |
| `/api/stripe/connect/status` | GET | `app/api/stripe/connect/status/route.ts` |
| `/api/stripe/create-customer` | POST | `app/api/stripe/create-customer/route.ts` |
| `/api/stripe/create-payment-intent` | POST | `app/api/stripe/create-payment-intent/route.ts` |
| `/api/stripe/payment-methods` | GET, POST | `app/api/stripe/payment-methods/route.ts` |
| `/api/stripe/save-card` | POST | `app/api/stripe/save-card/route.ts` |
| `/api/stripe/webhook` | POST | `app/api/stripe/webhook/route.ts` |
| `/api/tips` | POST | `app/api/tips/route.ts` |
| `/api/tos/accept` | POST | `app/api/tos/accept/route.ts` |
| `/api/translate` | POST | `app/api/translate/route.ts` |
| `/api/vouchers` | POST | `app/api/vouchers/route.ts` |
| `/api/vouchers/confirm` | POST | `app/api/vouchers/confirm/route.ts` |
| `/api/vouchers/create` | POST | `app/api/vouchers/create/route.ts` |
| `/api/vouchers/validate` | POST | `app/api/vouchers/validate/route.ts` |
| `/api/waitlist` | POST, GET | `app/api/waitlist/route.ts` |
| `/api/walkin/availability` | GET | `app/api/walkin/availability/route.ts` |
| `/api/walkin/confirm` | POST | `app/api/walkin/confirm/route.ts` |
| `/api/walkin/nearby` | GET | `app/api/walkin/nearby/route.ts` |
| `/api/walkin/pay-intent` | POST | `app/api/walkin/pay-intent/route.ts` |
| `/api/walkin/queue` | GET, POST | `app/api/walkin/queue/route.ts` |
| `/api/walkin/queue-stats` | GET | `app/api/walkin/queue-stats/route.ts` |
| `/api/walkin/queue/[id]` | PATCH, DELETE | `app/api/walkin/queue/[id]/route.ts` |
| `/api/walkin/queue/remote-join` | POST | `app/api/walkin/queue/remote-join/route.ts` |
| `/api/walkin/queue/status` | GET | `app/api/walkin/queue/status/route.ts` |
| `/api/walkin/review` | POST | `app/api/walkin/review/route.ts` |
| `/api/walkin/salon-info` | GET | `app/api/walkin/salon-info/route.ts` |
| `/api/walkin/tip` | POST | `app/api/walkin/tip/route.ts` |

## DB tables (live snapshot)

_Snapshot 2026-06-02 · schema `public` · via live Supabase introspection (NOT migration files, which drift)._

| Table | Rows | RLS |
|---|---|---|
| `account_actions` | 0 | on |
| `account_warnings` | 0 | on |
| `audit_log` | 19 | on |
| `availability_slots` | 921 | on |
| `barber_chairs` | 0 | on |
| `barber_cut_history` | 0 | on |
| `barber_loyalty_cards` | 0 | on |
| `barber_loyalty_history` | 0 | on |
| `barber_loyalty_programs` | 0 | on |
| `barber_walkin_queue` | 0 | on |
| `booking_disputes` | 4 | on |
| `bookings` | 6 | on |
| `calendar_tokens` | 0 | on |
| `case_events` | 7 | on |
| `cities` | 3 | on |
| `content_reports` | 0 | on |
| `conversations` | 0 | on |
| `customer_segment_members` | 0 | **OFF** |
| `customer_segments` | 5 | **OFF** |
| `data_deletion_log` | 0 | on |
| `discovery_board_pins` | 0 | **OFF** |
| `discovery_boards` | 3 | **OFF** |
| `discovery_collections` | 0 | **OFF** |
| `discovery_comments` | 0 | **OFF** |
| `discovery_interactions` | 0 | **OFF** |
| `discovery_items` | 18 | **OFF** |
| `discovery_likes` | 0 | **OFF** |
| `discovery_product_recommendations` | 0 | **OFF** |
| `discovery_products` | 0 | **OFF** |
| `discovery_saves` | 0 | **OFF** |
| `discovery_search_events` | 24 | on |
| `discovery_staging` | 3 | **OFF** |
| `feature_flags` | 12 | on |
| `feature_requests` | 4 | on |
| `messages` | 0 | on |
| `notifications` | 0 | on |
| `partner_leads` | 0 | on |
| `platform_settings` | 1 | on |
| `platform_stats` | 0 | **OFF** |
| `processed_webhook_events` | 0 | on |
| `profiles` | 6 | on |
| `recurring_booking_rules` | 0 | on |
| `review_photos` | 0 | on |
| `reviews` | 14 | on |
| `sale_line_items` | 1 | on |
| `sales` | 1 | on |
| `salon_badge_assignments` | 0 | on |
| `salon_badges` | 4 | on |
| `salon_clients` | 1 | on |
| `salon_closures` | 0 | on |
| `salon_directory` | 48 | on |
| `salon_documents` | 0 | on |
| `salon_pace` | 0 | on |
| `salon_page_views` | 55 | on |
| `salon_payouts` | 0 | on |
| `salons` | 23 | on |
| `search_embeddings` | 0 | on |
| `service_addons` | 10 | on |
| `service_options` | 6 | on |
| `services` | 83 | on |
| `site_content` | 7 | on |
| `staff_breaks` | 0 | on |
| `staff_invites` | 0 | on |
| `staff_members` | 71 | on |
| `staff_portfolio_images` | 0 | on |
| `staff_schedules` | 19 | on |
| `staff_services` | 40 | on |
| `staff_time_off` | 0 | on |
| `test_table` | 0 | **OFF** |
| `tips` | 0 | on |
| `user_preferences` | 0 | on |
| `waitlist` | 0 | **OFF** |
| `warnings` | 0 | on |
| `waxing_zone_packages` | 0 | on |

> ⚠️ **16 tables have RLS OFF** (anon key can read/write): `customer_segment_members`, `customer_segments`, `discovery_board_pins`, `discovery_boards`, `discovery_collections`, `discovery_comments`, `discovery_interactions`, `discovery_items`, `discovery_likes`, `discovery_product_recommendations`, `discovery_products`, `discovery_saves`, `discovery_staging`, `platform_stats`, `test_table`, `waitlist`.

_Columns are indexed in `_inventory/_db-columns.json` and searchable: `npm run exists <column>`._

## DB functions / RPCs

_Defined in `supabase/migrations/`. Call from app code via `supabase.rpc('<name>')`._

| Function | First defined in |
|---|---|
| `anonymize_financial_rows_on_profile_delete` | `supabase/migrations/20260602083300_financial_retention_on_delete.sql` |
| `create_group_booking` | `supabase/migrations/071_megabuild_booking_crm_payments.sql` |
| `current_user_tier` | `supabase/migrations/20260614010000_solen_plus_phase1_perks.sql` |
| `discovery_chip_terms` | `supabase/migrations/20260531_discovery_chip_terms.sql` |
| `discovery_feed` | `supabase/migrations/20260531_discovery_feed_personalized.sql` |
| `discovery_fts_doc` | `supabase/migrations/20260531_discovery_search_rpc.sql` |
| `discovery_recent_searches` | `supabase/migrations/20260531_discovery_recent_and_style_suggest.sql` |
| `discovery_resolve_thumb` | `supabase/migrations/20260531_discovery_recent_and_style_suggest.sql` |
| `discovery_style_suggest` | `supabase/migrations/20260531_discovery_recent_and_style_suggest.sql` |
| `discovery_trending_terms` | `supabase/migrations/20260531_discovery_trending.sql` |
| `f_unaccent` | `supabase/migrations/20260606185659_search_phase0_fts_extensions.sql` |
| `generate_referral_code` | `supabase/migrations/049_referrals.sql` |
| `get_last_minute_slots` | `supabase/migrations/014_new_schema.sql` |
| `get_nearby_salon_ids` | `supabase/migrations/077_geospatial_search.sql` |
| `handle_new_user` | `supabase/migrations/014_new_schema.sql` |
| `increment_view_count` | `supabase/migrations/067_discovery.sql` |
| `match_search_embeddings` | `supabase/migrations/074_search_embeddings.sql` |
| `next_walkin_ticket_seq` | `supabase/migrations/20260602150000_walkin_ticket_seq.sql` |
| `recompute_loyalty_status` | `supabase/migrations/20260614000000_loyalty_status_rank_phase2.sql` |
| `refresh_salon_min_prices` | `supabase/migrations/20260401_salon_min_prices.sql` |
| `resequence_walkin_queue` | `supabase/migrations/20260531_walkin_resequence_fn.sql` |
| `salon_search_doc` | `supabase/migrations/20260606190256_search_phase1_fts_schema.sql` |
| `salons_with_slot_in_hours` | `supabase/migrations/20260607182403_add_salons_with_slot_in_hours_rpc.sql` |
| `search_discovery` | `supabase/migrations/20260531_discovery_search_rpc.sql` |
| `search_salons_ranked` | `supabase/migrations/20260606190706_search_phase1_rpcs.sql` |
| `search_suggest` | `supabase/migrations/20260606190706_search_phase1_rpcs.sql` |
| `service_search_doc` | `supabase/migrations/20260606190256_search_phase1_fts_schema.sql` |
| `set_updated_at` | `supabase/migrations/067_discovery.sql` |
| `toggle_discovery_like` | `supabase/migrations/067_discovery.sql` |
| `toggle_discovery_save` | `supabase/migrations/067_discovery.sql` |
| `update_booking_disputes_updated_at` | `supabase/migrations/075_booking_disputes.sql` |
| `update_pricing_rules_updated_at` | `supabase/migrations/082_pricing_rules.sql` |
| `update_salon_rating` | `supabase/migrations/014_new_schema.sql` |
| `update_updated_at` | `supabase/migrations/014_new_schema.sql` |

## Components

<details><summary>407 components — click to expand</summary>

| Component | File |
|---|---|
| ActivityFeed | `components-legacy/dashboard/ActivityFeed.tsx` |
| AddressAutocomplete | `components-legacy/ui/AddressAutocomplete.tsx` |
| AiArtGallery | `components-legacy/dashboard/nail/AiArtGallery.tsx` |
| AiArtGenerator | `components-legacy/dashboard/nail/AiArtGenerator.tsx` |
| AiMatcherModal | `components-legacy/coiffeur/AiMatcherModal.tsx` |
| AIProcessingIndicator | `components-legacy/discovery/AIProcessingIndicator.tsx` |
| AISuggestion | `components-legacy/chat/AISuggestion.tsx` |
| AISuggestionPills | `components-legacy/discovery/AISuggestionPills.tsx` |
| AllergyAlert | `components-legacy/dashboard/coiffeur/AllergyAlert.tsx` |
| AllergyWarning | `components-legacy/nail/AllergyWarning.tsx` |
| animated-testimonials | `components/ui/animated-testimonials.tsx` |
| ArtistOfTheMonth | `app/[locale]/_components/homepage/ArtistOfTheMonth.tsx` |
| AtmosphereBlobs | `app/[locale]/_components/homepage/AtmosphereBlobs.tsx` |
| AtmosphereGrain | `app/[locale]/_components/homepage/AtmosphereGrain.tsx` |
| Avatar | `app/[locale]/_components/primitives/Avatar.tsx` |
| BackButton | `app/[locale]/_components/primitives/BackButton.tsx` |
| BackgroundBlobs | `components/ui/BackgroundBlobs.tsx` |
| BackToTopButton | `app/[locale]/terms/components/BackToTopButton.tsx` |
| BarberIcon | `components-legacy/icons/category/BarberIcon.tsx` |
| BarberLeaderboard | `components-legacy/dashboard/barber/BarberLeaderboard.tsx` |
| BarbershopSections | `components-legacy/barber/BarbershopSections.tsx` |
| beauty-icons | `components-legacy/ui/beauty-icons.tsx` |
| beautyFields | `app/[locale]/onboarding/beautyFields.tsx` |
| BeautyProfileCard | `components-legacy/profile/BeautyProfileCard.tsx` |
| BeautyProfileEditModal | `components-legacy/profile/BeautyProfileEditModal.tsx` |
| BeautyProfileForm | `app/[locale]/profile/settings/BeautyProfileForm.tsx` |
| BellIcon | `app/[locale]/_components/layout/BellIcon.tsx` |
| BentoBusiness | `app/[locale]/_components/homepage/BentoBusiness.tsx` |
| BentoCard | `app/[locale]/_components/business/BentoCard.tsx` |
| BlobBackground | `components/ui/BlobBackground.tsx` |
| BodyDiagram | `components-legacy/shared/BodyDiagram.tsx` |
| BookCTA | `components-legacy/discovery/BookCTA.tsx` |
| BookingBubble | `components-legacy/chat/BookingBubble.tsx` |
| BookingCard | `components-legacy/booking/BookingCard.tsx` |
| BookingConfirmation | `components-legacy/booking/BookingConfirmation.tsx` |
| BookingDisputePanel | `components-legacy/admin/BookingDisputePanel.tsx` |
| BookingExitButton | `components-legacy/booking/BookingExitButton.tsx` |
| BookingPaymentForm | `components-legacy/booking/BookingPaymentForm.tsx` |
| BookingsList | `components-legacy/booking/BookingsList.tsx` |
| BookingSuccess | `components-legacy/BookingSuccess.tsx` |
| BookingWizard | `components-legacy/booking/BookingWizard.tsx` |
| BottomTabBar | `components-legacy/layout/BottomTabBar.tsx` |
| breadcrumb | `components/ui/breadcrumb.tsx` |
| Breadcrumb | `components-legacy/ui/Breadcrumb.tsx` |
| BrowseByCitySection | `components-legacy/BrowseByCitySection.tsx` |
| BusinessTeaser | `app/[locale]/_components/homepage/BusinessTeaser.tsx` |
| CancelBookingSheet | `components-legacy/booking/CancelBookingSheet.tsx` |
| card | `components/ui/card.tsx` |
| CardFilterRow | `components-legacy/home/CardFilterRow.tsx` |
| CardSignals | `components-legacy/discovery/CardSignals.tsx` |
| CardText | `app/[locale]/_components/primitives/CardText.tsx` |
| CategoriesGrid | `components-legacy/home/CategoriesGrid.tsx` |
| CategoryBrowseRails | `app/[locale]/_components/search/CategoryBrowseRails.tsx` |
| CategoryHero | `app/[locale]/_components/landings/CategoryHero.tsx` |
| CategoryHeroCarousel | `app/[locale]/_components/search/CategoryHeroCarousel.tsx` |
| CategoryPage | `components-legacy/CategoryPage.tsx` |
| CategoryPills | `components-legacy/discovery/CategoryPills.tsx` |
| CategoryPromos | `app/[locale]/_components/homepage/CategoryPromos.tsx` |
| CategoryStack | `app/[locale]/_components/homepage/CategoryStack.tsx` |
| CategoryTabBar | `components-legacy/discovery/CategoryTabBar.tsx` |
| CategoryTabs | `app/[locale]/_components/homepage/CategoryTabs.tsx` |
| CategoryTree | `components-legacy/ui/CategoryTree.tsx` |
| CelebrationRing | `components-legacy/ui/CelebrationRing.tsx` |
| ChatWindow | `components-legacy/ChatWindow.tsx` |
| Checkbox | `app/[locale]/_components/primitives/Checkbox.tsx` |
| CityPage | `components-legacy/CityPage.tsx` |
| CityTopBar | `app/[locale]/_components/layout/CityTopBar.tsx` |
| ClientPhotosTab | `components-legacy/dashboard/ClientPhotosTab.tsx` |
| ClientSelectorDropdown | `components-legacy/shared/ClientSelectorDropdown.tsx` |
| ClientTags | `components-legacy/chat/ClientTags.tsx` |
| Coiffeur | `app/[locale]/_components/homepage/Coiffeur.tsx` |
| CoiffeurIcon | `components-legacy/icons/category/CoiffeurIcon.tsx` |
| CoiffeurSections | `components-legacy/coiffeur/CoiffeurSections.tsx` |
| ColourCycleConfig | `components-legacy/dashboard/coiffeur/ColourCycleConfig.tsx` |
| ComingSoon | `app/[locale]/_components/primitives/ComingSoon.tsx` |
| CommandPalette | `components-legacy/dashboard/CommandPalette.tsx` |
| CommentSection | `components-legacy/discovery/CommentSection.tsx` |
| ConsultationNotes | `components-legacy/dashboard/coiffeur/ConsultationNotes.tsx` |
| ContraindicationAlert | `components-legacy/dashboard/spa/ContraindicationAlert.tsx` |
| CookieConsent | `app/[locale]/_components/primitives/CookieConsent.tsx` |
| DashboardHeaderStrip | `components-legacy/dashboard/DashboardHeaderStrip.tsx` |
| DashboardLayout | `components-legacy/dashboard/DashboardLayout.tsx` |
| DashboardUI | `app/[locale]/_components/dashboard/DashboardUI.tsx` |
| date-picker | `components-legacy/ui/date-picker.tsx` |
| DateRangePicker | `components-legacy/ui/DateRangePicker.tsx` |
| DateTimePicker | `app/[locale]/_components/primitives/DateTimePicker.tsx` |
| DateTimeStep | `components-legacy/booking/DateTimeStep.tsx` |
| DeleteAccountModal | `components-legacy/profile/DeleteAccountModal.tsx` |
| DescriptionCard | `components-legacy/discovery/DescriptionCard.tsx` |
| DesignHistoryTimeline | `components-legacy/nail/DesignHistoryTimeline.tsx` |
| DesktopCitySelector | `app/[locale]/_components/layout/DesktopCitySelector.tsx` |
| DetailPage | `components-legacy/discovery/DetailPage.tsx` |
| DeviceFrame | `components-legacy/editor/DeviceFrame.tsx` |
| DiscoverSection | `components-legacy/home/DiscoverSection.tsx` |
| DiscoveryAdmin | `components-legacy/discovery/DiscoveryAdmin.tsx` |
| DiscoveryEmptyState | `components-legacy/discovery/DiscoveryEmptyState.tsx` |
| DiscoveryErrorState | `components-legacy/discovery/DiscoveryErrorState.tsx` |
| DiscoveryGridSkeleton | `components-legacy/discovery/DiscoveryGridSkeleton.tsx` |
| DynamicPricingConfig | `components-legacy/dashboard/nail/DynamicPricingConfig.tsx` |
| EditorPage | `components-legacy/editor/EditorPage.tsx` |
| EditPanel | `components-legacy/editor/EditPanel.tsx` |
| EmptyServicesState | `components-legacy/booking/EmptyServicesState.tsx` |
| EmptyState | `components-legacy/ui/EmptyState.tsx` |
| EmptyStateDiscovery | `app/[locale]/_components/profile/EmptyStateDiscovery.tsx` |
| EmptyStateFTU | `components-legacy/ui/EmptyStateFTU.tsx` |
| Entdecken | `app/[locale]/_components/homepage/Entdecken.tsx` |
| ErrorFallback | `components-legacy/ui/ErrorFallback.tsx` |
| ErrorState | `components-legacy/ui/ErrorState.tsx` |
| ExpandableTabs | `components-legacy/ui/ExpandableTabs.tsx` |
| ExportButton | `components-legacy/ui/ExportButton.tsx` |
| ExpressMenu | `components-legacy/dashboard/barber/ExpressMenu.tsx` |
| ExpressRebook | `components-legacy/barber/ExpressRebook.tsx` |
| FadeBlueprint | `components-legacy/dashboard/barber/FadeBlueprint.tsx` |
| FAQItem | `app/[locale]/_components/business/FAQItem.tsx` |
| FavoritesList | `app/[locale]/_components/profile/FavoritesList.tsx` |
| FeatureBento | `app/[locale]/_components/homepage/FeatureBento.tsx` |
| FeaturedBoards | `components-legacy/discovery/FeaturedBoards.tsx` |
| FeaturedSalonCarousel | `components-legacy/ui/FeaturedSalonCarousel.tsx` |
| FeaturedStylists | `app/[locale]/_components/homepage/FeaturedStylists.tsx` |
| FieldHelper | `app/[locale]/_components/primitives/FieldHelper.tsx` |
| FieldLabel | `app/[locale]/_components/primitives/FieldLabel.tsx` |
| FilterBar | `components-legacy/ui/FilterBar.tsx` |
| FilterBottomSheet | `components-legacy/ui/FilterBottomSheet.tsx` |
| FilterDrawer | `components-legacy/discovery/FilterDrawer.tsx` |
| FilterDrawer | `components-legacy/ui/FilterDrawer.tsx` |
| FilterSheet | `app/[locale]/_components/search/FilterSheet.tsx` |
| Footer | `app/[locale]/_components/layout/Footer.tsx` |
| Footer | `components-legacy/layout/Footer.tsx` |
| FooterGate | `app/[locale]/_components/layout/FooterGate.tsx` |
| ForecastWidget | `components-legacy/dashboard/ForecastWidget.tsx` |
| FormulaBook | `components-legacy/dashboard/coiffeur/FormulaBook.tsx` |
| FormulaPhotoUpload | `components-legacy/dashboard/coiffeur/FormulaPhotoUpload.tsx` |
| FormulaTab | `components-legacy/dashboard/FormulaTab.tsx` |
| ForYouGreeting | `app/[locale]/_components/homepage/ForYouGreeting.tsx` |
| ForYouSalonRows | `app/[locale]/_components/homepage/ForYouSalonRows.tsx` |
| ForYouSection | `components-legacy/discovery/ForYouSection.tsx` |
| GalleryManager | `components-legacy/dashboard/GalleryManager.tsx` |
| GenderToggle | `components-legacy/discovery/GenderToggle.tsx` |
| GiftCardManager | `components-legacy/dashboard/GiftCardManager.tsx` |
| GlassModal | `components-legacy/ui/GlassModal.tsx` |
| GoLiveStep | `components-legacy/onboarding/steps/GoLiveStep.tsx` |
| GuestBookingForm | `components-legacy/booking/GuestBookingForm.tsx` |
| GuidedSearch | `components-legacy/ui/GuidedSearch.tsx` |
| HaarprofilForm | `app/[locale]/profile/haarprofil/HaarprofilForm.tsx` |
| HairStep | `components-legacy/booking/HairStep.tsx` |
| HandChart | `components-legacy/nail/HandChart.tsx` |
| HeadDiagram | `components-legacy/dashboard/barber/HeadDiagram.tsx` |
| Header | `app/[locale]/_components/layout/Header.tsx` |
| HeartButton | `app/[locale]/_components/homepage/HeartButton.tsx` |
| HeatmapChart | `components-legacy/dashboard/HeatmapChart.tsx` |
| Hero | `app/[locale]/_components/homepage/Hero.tsx` |
| HeroAboveFold | `components-legacy/home/HeroAboveFold.tsx` |
| HeroDuo | `app/[locale]/_components/homepage/HeroDuo.tsx` |
| HeroHeadline | `app/[locale]/_components/homepage/HeroHeadline.tsx` |
| HeroSpotlight | `app/[locale]/_components/homepage/HeroSpotlight.tsx` |
| HeroStampCard | `components-legacy/loyalty/HeroStampCard.tsx` |
| HideInBooking | `app/[locale]/_components/layout/HideInBooking.tsx` |
| ImageFallback | `components-legacy/ui/ImageFallback.tsx` |
| ImageUpload | `components-legacy/ui/ImageUpload.tsx` |
| ImageUploader | `components-legacy/ui/ImageUploader.tsx` |
| ImportProgressBar | `components-legacy/discovery/ImportProgressBar.tsx` |
| InfillReminderConfig | `components-legacy/dashboard/nail/InfillReminderConfig.tsx` |
| InlinePrefsPanel | `components-legacy/discovery/InlinePrefsPanel.tsx` |
| InspoBoard | `components-legacy/nail/InspoBoard.tsx` |
| InspoUploader | `components-legacy/nail/InspoUploader.tsx` |
| IntakeFormTab | `components-legacy/dashboard/IntakeFormTab.tsx` |
| interactive-hover-button | `components-legacy/ui/interactive-hover-button.tsx` |
| InteractiveZoneDiagram | `components-legacy/shared/InteractiveZoneDiagram.tsx` |
| ItemCard | `components-legacy/discovery/ItemCard.tsx` |
| LanguageSwitcher | `components-legacy/ui/LanguageSwitcher.tsx` |
| LastMinuteCard | `components-legacy/LastMinuteCard.tsx` |
| LastMinuteManager | `components-legacy/dashboard/LastMinuteManager.tsx` |
| LikeButton | `components-legacy/discovery/LikeButton.tsx` |
| LiveActivityCard | `components-legacy/profile/LiveActivityCard.tsx` |
| LiveQueuePanel | `components-legacy/dashboard/barber/LiveQueuePanel.tsx` |
| Logo | `app/[locale]/_components/primitives/Logo.tsx` |
| LoyaltyConfig | `components-legacy/dashboard/barber/LoyaltyConfig.tsx` |
| MapView | `components-legacy/MapView.tsx` |
| MarketplaceReviewsList | `app/[locale]/reviews/_components/MarketplaceReviewsList.tsx` |
| MarketplaceVisual | `app/[locale]/_components/business/MarketplaceVisual.tsx` |
| MasonryGrid | `components-legacy/discovery/MasonryGrid.tsx` |
| MaterialSelector | `components-legacy/nail/MaterialSelector.tsx` |
| MetaDot | `app/[locale]/_components/salon/MetaDot.tsx` |
| MiniSparkline | `components-legacy/dashboard/MiniSparkline.tsx` |
| MobileCategoriesRow | `app/[locale]/_components/homepage/MobileCategoriesRow.tsx` |
| MobileMenu | `app/[locale]/_components/layout/MobileMenu.tsx` |
| MobileViewToggle | `components-legacy/search/MobileViewToggle.tsx` |
| Modal | `app/[locale]/_components/primitives/Modal.tsx` |
| morphing-dialog | `components/core/morphing-dialog.tsx` |
| MotionProvider | `components-legacy/layout/MotionProvider.tsx` |
| NailBookingSteps | `components-legacy/nail/NailBookingSteps.tsx` |
| NailClientTab | `components-legacy/dashboard/nail/NailClientTab.tsx` |
| NailDesignCard | `components-legacy/nail/NailDesignCard.tsx` |
| NailPreferencesForm | `components-legacy/dashboard/nail/NailPreferencesForm.tsx` |
| NailsIcon | `components-legacy/icons/category/NailsIcon.tsx` |
| NailsSections | `components-legacy/nail/NailsSections.tsx` |
| Nearby | `app/[locale]/_components/homepage/Nearby.tsx` |
| NearbySection | `components-legacy/home/NearbySection.tsx` |
| NotificationBell | `app/[locale]/_components/layout/NotificationBell.tsx` |
| NotificationCenter | `components-legacy/dashboard/NotificationCenter.tsx` |
| NotificationItem | `components-legacy/notifications/NotificationItem.tsx` |
| NotificationsClient | `app/[locale]/notifications/NotificationsClient.tsx` |
| OfflineBanner | `app/[locale]/_components/layout/OfflineBanner.tsx` |
| OffPeakManager | `components-legacy/dashboard/OffPeakManager.tsx` |
| OnboardingFlow | `app/[locale]/onboarding/OnboardingFlow.tsx` |
| OpeningHoursStep | `components-legacy/onboarding/steps/OpeningHoursStep.tsx` |
| PageTransition | `components-legacy/layout/PageTransition.tsx` |
| PageTransitionWrapper | `components-legacy/layout/PageTransitionWrapper.tsx` |
| PartnerBlock | `components-legacy/home/PartnerBlock.tsx` |
| PartnerSignupForm | `components-legacy/partner/PartnerSignupForm.tsx` |
| PatternSelector | `components-legacy/discovery/PatternSelector.tsx` |
| PayConfirmStep | `components-legacy/booking/PayConfirmStep.tsx` |
| PaymentMethodsSection | `components-legacy/profile/PaymentMethodsSection.tsx` |
| PaymentsStep | `components-legacy/onboarding/steps/PaymentsStep.tsx` |
| PhotoGallery | `components-legacy/chat/PhotoGallery.tsx` |
| PhotoLightbox | `components-legacy/ui/PhotoLightbox.tsx` |
| PickStylistFlow | `components-legacy/discovery/PickStylistFlow.tsx` |
| PillToggle | `app/[locale]/_components/primitives/PillToggle.tsx` |
| PLComparison | `components-legacy/dashboard/barber/PLComparison.tsx` |
| PostFromDiscover | `components-legacy/discovery/PostFromDiscover.tsx` |
| PostHogProvider | `components-legacy/PostHogProvider.tsx` |
| PriceFrom | `app/[locale]/_components/primitives/PriceFrom.tsx` |
| PriceOfferModal | `components-legacy/ui/PriceOfferModal.tsx` |
| PriceRangeBadge | `components/discovery/PriceRangeBadge.tsx` |
| PrivacyContent | `app/[locale]/privacy/components/PrivacyContent.tsx` |
| PrivacySidebar | `app/[locale]/privacy/components/PrivacySidebar.tsx` |
| ProductRecommendations | `components-legacy/discovery/ProductRecommendations.tsx` |
| ProfileDiscoverySections | `components-legacy/discovery/ProfileDiscoverySections.tsx` |
| ProfileGroupedLists | `components-legacy/profile/ProfileGroupedLists.tsx` |
| ProfileHero | `components-legacy/profile/ProfileHero.tsx` |
| ProfilePage | `components-legacy/ProfilePage.tsx` |
| ProfileSetupModal | `components-legacy/discovery/ProfileSetupModal.tsx` |
| PromoManager | `components-legacy/dashboard/PromoManager.tsx` |
| PWAInstallPrompt | `components-legacy/ui/PWAInstallPrompt.tsx` |
| QuartiersGrid | `components-legacy/home/QuartiersGrid.tsx` |
| QuartierTile | `components/QuartierTile.tsx` |
| QuickPreviewSheet | `components-legacy/ui/QuickPreviewSheet.tsx` |
| QuickReplyChips | `components-legacy/chat/QuickReplyChips.tsx` |
| Radio | `app/[locale]/_components/primitives/Radio.tsx` |
| RatingStars | `app/[locale]/_components/primitives/RatingStars.tsx` |
| RecentlyViewed | `app/[locale]/_components/homepage/RecentlyViewed.tsx` |
| RecentlyViewed | `components-legacy/RecentlyViewed.tsx` |
| RecentlyViewedClient | `app/[locale]/recently-viewed/RecentlyViewedClient.tsx` |
| RecentSearches | `components-legacy/discovery/RecentSearches.tsx` |
| ReferralDashboard | `components-legacy/dashboard/ReferralDashboard.tsx` |
| RefundCaseView | `components-legacy/refund/RefundCaseView.tsx` |
| RelatedTikToks | `components-legacy/discovery/RelatedTikToks.tsx` |
| RemoteQueueJoin | `components-legacy/barber/RemoteQueueJoin.tsx` |
| ReportButton | `components-legacy/discovery/ReportButton.tsx` |
| ReportContentButton | `components-legacy/ui/ReportContentButton.tsx` |
| ReportRefundEntry | `components-legacy/refund/ReportRefundEntry.tsx` |
| RequestList | `components-legacy/editor/RequestList.tsx` |
| RetailManager | `components-legacy/dashboard/nail/RetailManager.tsx` |
| RetailSalesDashboard | `components-legacy/dashboard/nail/RetailSalesDashboard.tsx` |
| ReviewBreakdown | `components-legacy/ReviewBreakdown.tsx` |
| ReviewForm | `components-legacy/ReviewForm.tsx` |
| Reviews | `app/[locale]/_components/homepage/Reviews.tsx` |
| RewardsView | `app/[locale]/rewards/RewardsView.tsx` |
| RoomManager | `components-legacy/dashboard/spa/RoomManager.tsx` |
| SalonAbout | `app/[locale]/_components/salon/SalonAbout.tsx` |
| SalonAboutEditor | `components-legacy/dashboard/SalonAboutEditor.tsx` |
| SalonAdditionalInfo | `app/[locale]/_components/salon/SalonAdditionalInfo.tsx` |
| SalonAppCta | `app/[locale]/_components/salon/SalonAppCta.tsx` |
| SalonBadge | `components-legacy/ui/SalonBadge.tsx` |
| SalonBreadcrumb | `app/[locale]/_components/salon/SalonBreadcrumb.tsx` |
| SalonBuy | `app/[locale]/_components/salon/SalonBuy.tsx` |
| SalonCard | `app/[locale]/_components/homepage/SalonCard.tsx` |
| SalonCard | `components-legacy/SalonCard.tsx` |
| SalonContact | `app/[locale]/_components/salon/SalonContact.tsx` |
| SalonDetailV3 | `app/[locale]/_components/salon/SalonDetailV3.tsx` |
| SalonHeader | `app/[locale]/_components/salon/SalonHeader.tsx` |
| SalonHero | `app/[locale]/_components/salon/SalonHero.tsx` |
| SalonHero | `components-legacy/salon/SalonHero.tsx` |
| SalonImageGallery | `app/[locale]/_components/salon/SalonImageGallery.tsx` |
| SalonLightbox | `app/[locale]/_components/salon/SalonLightbox.tsx` |
| SalonLocation | `app/[locale]/_components/salon/SalonLocation.tsx` |
| SalonLoyalty | `app/[locale]/_components/salon/SalonLoyalty.tsx` |
| SalonMobileBookBar | `app/[locale]/_components/salon/SalonMobileBookBar.tsx` |
| SalonMobileCTA | `components-legacy/salon/SalonMobileCTA.tsx` |
| SalonModeToggle | `components-legacy/salon/SalonModeToggle.tsx` |
| SalonOpeningHours | `components-legacy/salon/SalonOpeningHours.tsx` |
| SalonOpeningTimes | `app/[locale]/_components/salon/SalonOpeningTimes.tsx` |
| SalonOtherLocations | `app/[locale]/_components/salon/SalonOtherLocations.tsx` |
| SalonPageSkeleton | `components-legacy/salon/SalonPageSkeleton.tsx` |
| SalonPortfolio | `app/[locale]/_components/salon/SalonPortfolio.tsx` |
| SalonProfileStep | `components-legacy/onboarding/steps/SalonProfileStep.tsx` |
| SalonResultCard | `app/[locale]/_components/search/SalonResultCard.tsx` |
| SalonReviews | `app/[locale]/_components/salon/SalonReviews.tsx` |
| SalonReviews | `components-legacy/salon/SalonReviews.tsx` |
| SalonReviewsSummary | `components-legacy/salon/SalonReviewsSummary.tsx` |
| SalonScript | `components-legacy/discovery/SalonScript.tsx` |
| SalonSectionNav | `components-legacy/salon/SalonSectionNav.tsx` |
| SalonServices | `app/[locale]/_components/salon/SalonServices.tsx` |
| SalonServices | `components-legacy/salon/SalonServices.tsx` |
| SalonServicesSheet | `app/[locale]/_components/salon/SalonServicesSheet.tsx` |
| SalonSidebar | `app/[locale]/_components/salon/SalonSidebar.tsx` |
| SalonSidebar | `components-legacy/salon/SalonSidebar.tsx` |
| SalonStickyTabNav | `app/[locale]/_components/salon/SalonStickyTabNav.tsx` |
| SalonSwitcher | `components-legacy/dashboard/SalonSwitcher.tsx` |
| SalonTeam | `app/[locale]/_components/salon/SalonTeam.tsx` |
| SalonVenuesNearby | `app/[locale]/_components/salon/SalonVenuesNearby.tsx` |
| SalonWalkInPanel | `components-legacy/salon/SalonWalkInPanel.tsx` |
| SaveButton | `components-legacy/discovery/SaveButton.tsx` |
| SaveToBoardSheet | `components-legacy/discovery/SaveToBoardSheet.tsx` |
| ScheduleStep | `components-legacy/onboarding/steps/ScheduleStep.tsx` |
| ScrollableFilterRow | `components-legacy/ui/ScrollableFilterRow.tsx` |
| SearchAutocomplete | `components-legacy/discovery/SearchAutocomplete.tsx` |
| SearchAutocomplete | `components-legacy/ui/SearchAutocomplete.tsx` |
| SearchBar | `app/[locale]/_components/homepage/SearchBar.tsx` |
| SearchBar | `components-legacy/discovery/SearchBar.tsx` |
| SearchCriteriaChips | `components-legacy/search/SearchCriteriaChips.tsx` |
| SearchOverlay | `app/[locale]/_components/search/SearchOverlay.tsx` |
| SearchResultGrid | `components-legacy/search/SearchResultGrid.tsx` |
| SearchResults | `app/[locale]/_components/search/SearchResults.tsx` |
| SearchTemplate | `app/[locale]/_components/search/SearchTemplate.tsx` |
| SectionCarousel | `components-legacy/home/SectionCarousel.tsx` |
| SectionHeader | `app/[locale]/_components/homepage/SectionHeader.tsx` |
| Select | `app/[locale]/_components/primitives/Select.tsx` |
| SelectedCheckBadge | `components-legacy/ui/SelectedCheckBadge.tsx` |
| ServiceAutosuggest | `components-legacy/ui/ServiceAutosuggest.tsx` |
| ServiceCategoryFilter | `components-legacy/salon/ServiceCategoryFilter.tsx` |
| ServiceDetailSheet | `components-legacy/booking/ServiceDetailSheet.tsx` |
| ServicesStaffStep | `components-legacy/booking/ServicesStaffStep.tsx` |
| ServicesStep | `components-legacy/onboarding/steps/ServicesStep.tsx` |
| SettingsForm | `app/[locale]/profile/settings/SettingsForm.tsx` |
| SetupBanner | `components-legacy/dashboard/SetupBanner.tsx` |
| SetupWizard | `components-legacy/onboarding/SetupWizard.tsx` |
| ShapeLengthPicker | `components-legacy/nail/ShapeLengthPicker.tsx` |
| ShareButton | `components-legacy/discovery/ShareButton.tsx` |
| Sheet | `app/[locale]/_components/primitives/Sheet.tsx` |
| sidebar | `components-legacy/ui/sidebar.tsx` |
| SignatureLockup | `components-legacy/ui/SignatureLockup.tsx` |
| SignIn | `components-legacy/auth/SignIn.tsx` |
| SimilarSalons | `components-legacy/salon/SimilarSalons.tsx` |
| SimilarStyles | `components-legacy/discovery/SimilarStyles.tsx` |
| Skeleton | `app/[locale]/_components/primitives/Skeleton.tsx` |
| Skeleton | `components-legacy/ui/Skeleton.tsx` |
| SkeletonCard | `app/[locale]/_components/primitives/SkeletonCard.tsx` |
| SkipLink | `app/[locale]/_components/primitives/SkipLink.tsx` |
| SmartReminderConfig | `components-legacy/dashboard/barber/SmartReminderConfig.tsx` |
| SolenExclusiveBadge | `components-legacy/ui/SolenExclusiveBadge.tsx` |
| SolenStory | `app/[locale]/_components/homepage/SolenStory.tsx` |
| SortDropdown | `components-legacy/ui/SortDropdown.tsx` |
| SourceBadge | `components-legacy/discovery/SourceBadge.tsx` |
| SpaIcon | `components-legacy/icons/category/SpaIcon.tsx` |
| SpaIntake | `components-legacy/dashboard/spa/SpaIntake.tsx` |
| SpaSections | `components-legacy/spa/SpaSections.tsx` |
| Spinner | `components-legacy/ui/Spinner.tsx` |
| SplitView | `components-legacy/search/SplitView.tsx` |
| StaffAvailability | `components-legacy/staff/StaffAvailability.tsx` |
| StaffComparison | `components-legacy/dashboard/StaffComparison.tsx` |
| StaffListSheet | `components-legacy/booking/StaffListSheet.tsx` |
| StaffPicker | `components-legacy/booking/StaffPicker.tsx` |
| StaffPortfolio | `components-legacy/StaffPortfolio.tsx` |
| StaffPortfolio | `components-legacy/discovery/StaffPortfolio.tsx` |
| StaffProfilePage | `components-legacy/staff/StaffProfilePage.tsx` |
| StaffReviewsSheet | `components-legacy/staff/StaffReviewsSheet.tsx` |
| StaffSection | `components-legacy/salon/StaffSection.tsx` |
| StaffStep | `components-legacy/booking/StaffStep.tsx` |
| StampCard | `components-legacy/loyalty/StampCard.tsx` |
| StatCard | `components-legacy/dashboard/StatCard.tsx` |
| StationManager | `components-legacy/dashboard/nail/StationManager.tsx` |
| StatusInline | `app/[locale]/_components/salon/StatusInline.tsx` |
| StatusPill | `app/[locale]/_components/salon/StatusPill.tsx` |
| Step | `app/[locale]/_components/business/Step.tsx` |
| StyleNamePills | `components-legacy/discovery/StyleNamePills.tsx` |
| SubCategoryChips | `components-legacy/ui/SubCategoryChips.tsx` |
| SuccessMark | `app/[locale]/_components/primitives/SuccessMark.tsx` |
| Switch | `app/[locale]/_components/primitives/Switch.tsx` |
| TabPill | `app/[locale]/_components/primitives/TabPill.tsx` |
| TeamStep | `components-legacy/onboarding/steps/TeamStep.tsx` |
| TechPortfolio | `components-legacy/nail/TechPortfolio.tsx` |
| TermsContent | `app/[locale]/terms/components/TermsContent.tsx` |
| TermsSidebar | `app/[locale]/terms/components/TermsSidebar.tsx` |
| TestimonialCarousel | `components-legacy/TestimonialCarousel.tsx` |
| Textarea | `app/[locale]/_components/primitives/Textarea.tsx` |
| TextInput | `app/[locale]/_components/primitives/TextInput.tsx` |
| TikTokPlayer | `components-legacy/discovery/TikTokPlayer.tsx` |
| TipFlow | `app/[locale]/_components/tips/TipFlow.tsx` |
| TipSheet | `app/[locale]/_components/tips/TipSheet.tsx` |
| Toast | `app/[locale]/_components/primitives/Toast.tsx` |
| Toast | `components-legacy/ui/Toast.tsx` |
| TodayLiveCard | `components-legacy/dashboard/TodayLiveCard.tsx` |
| ToggleCircle | `components-legacy/booking/ToggleCircle.tsx` |
| ToSCheckbox | `components-legacy/discovery/ToSCheckbox.tsx` |
| TosPrompt | `components-legacy/auth/TosPrompt.tsx` |
| TOSUpdateBanner | `components-legacy/global/TOSUpdateBanner.tsx` |
| TreatmentOutcome | `components-legacy/dashboard/spa/TreatmentOutcome.tsx` |
| TreatmentsClient | `app/[locale]/behandlungen/[...slug]/TreatmentsClient.tsx` |
| TrustStatsBanner | `components-legacy/home/TrustStatsBanner.tsx` |
| TutorialTour | `components-legacy/TutorialTour.tsx` |
| typewriter | `components/ui/typewriter.tsx` |
| TypingIndicator | `components-legacy/ui/TypingIndicator.tsx` |
| UpchargeApproveView | `components-legacy/refund/UpchargeApproveView.tsx` |
| UserPostsSection | `components-legacy/discovery/UserPostsSection.tsx` |
| VideoCard | `components-legacy/discovery/VideoCard.tsx` |
| WaitlistModal | `components-legacy/booking/WaitlistModal.tsx` |
| WaitTimeDisplay | `components-legacy/barber/WaitTimeDisplay.tsx` |
| WalkinAnalytics | `components-legacy/dashboard/barber/WalkinAnalytics.tsx` |
| WalkInBand | `app/[locale]/_components/homepage/WalkInBand.tsx` |
| WalkinHourlyChart | `components-legacy/dashboard/barber/WalkinHourlyChart.tsx` |
| WalkInModal | `components-legacy/dashboard/WalkInModal.tsx` |
| WalkInPaymentForm | `components-legacy/barber/WalkInPaymentForm.tsx` |
| WeatherBanner | `components/WeatherBanner.tsx` |
| WelcomeToast | `app/[locale]/_components/primitives/WelcomeToast.tsx` |
| WellnessJournal | `components-legacy/dashboard/spa/WellnessJournal.tsx` |
| WhySolen | `app/[locale]/_components/homepage/WhySolen.tsx` |

</details>

## lib/ modules

<details><summary>106 modules — click to expand</summary>

| Module | File |
|---|---|
| useAnalytics | `hooks/useAnalytics.ts` |
| useCityDetection | `hooks/useCityDetection.ts` |
| useExportCSV | `hooks/useExportCSV.ts` |
| useRecentVisits | `hooks/useRecentVisits.ts` |
| useSalonProfile | `hooks/useSalonProfile.ts` |
| useScrollReveal | `hooks/useScrollReveal.ts` |
| useSectionObserver | `hooks/useSectionObserver.ts` |
| active-salon | `lib/active-salon.ts` |
| ai-vision | `lib/ai-vision.ts` |
| recommendations | `lib/ai/recommendations.ts` |
| translate | `lib/ai/translate.ts` |
| alert-admin | `lib/alert-admin.ts` |
| animations | `lib/animations.ts` |
| audit | `lib/audit.ts` |
| index | `lib/auth/index.ts` |
| require | `lib/auth/require.ts` |
| automod | `lib/automod.ts` |
| chair-availability | `lib/barber/chair-availability.ts` |
| loyalty-qr | `lib/barber/loyalty-qr.ts` |
| visit-cycle-algorithm | `lib/barber/visit-cycle-algorithm.ts` |
| wait-time-calculator | `lib/barber/wait-time-calculator.ts` |
| walkin-availability | `lib/barber/walkin-availability.ts` |
| walkin-ticket | `lib/barber/walkin-ticket.ts` |
| basel-neighborhoods | `lib/basel-neighborhoods.ts` |
| booking-context | `lib/booking-context.tsx` |
| booking-email | `lib/booking-email.ts` |
| booking-state | `lib/booking-state.ts` |
| authorize | `lib/bookings/authorize.ts` |
| auto-assign | `lib/bookings/auto-assign.ts` |
| charge-fee | `lib/bookings/charge-fee.ts` |
| dispute-engine | `lib/bookings/dispute-engine.ts` |
| guest-access | `lib/bookings/guest-access.ts` |
| issue-refund | `lib/bookings/issue-refund.ts` |
| notify-no-show-fee | `lib/bookings/notify-no-show-fee.ts` |
| notify-refund | `lib/bookings/notify-refund.ts` |
| notify-upcharge | `lib/bookings/notify-upcharge.ts` |
| off-session-charge | `lib/bookings/off-session-charge.ts` |
| reference | `lib/bookings/reference.ts` |
| refund-config | `lib/bookings/refund-config.ts` |
| cancellation-policy | `lib/cancellation-policy.ts` |
| category-photos | `lib/category-photos.ts` |
| cities | `lib/cities.ts` |
| city-cookie | `lib/city-cookie.ts` |
| commission-calculator | `lib/commission-calculator.ts` |
| billing | `lib/constants/billing.ts` |
| categories | `lib/constants/categories.ts` |
| content-flags | `lib/content-flags.ts` |
| category-nav | `lib/dashboard/category-nav.ts` |
| database.types | `lib/database.types.ts` |
| demo-data | `lib/demo-data.ts` |
| interactive-zone | `lib/diagrams/interactive-zone.ts` |
| discovery-algorithm | `lib/discovery-algorithm.ts` |
| discovery-moderation | `lib/discovery-moderation.ts` |
| editor-prompts | `lib/editor-prompts.ts` |
| audit-notifications | `lib/email-templates/audit-notifications.ts` |
| booking-notifications | `lib/email-templates/booking-notifications.ts` |
| off-peak | `lib/email-templates/off-peak.ts` |
| salon-onboarding | `lib/email-templates/salon-onboarding.ts` |
| welcome-series | `lib/email-templates/welcome-series.ts` |
| email | `lib/email.ts` |
| env | `lib/env.ts` |
| feature-flags | `lib/feature-flags.ts` |
| format-currency | `lib/format-currency.ts` |
| format-phone | `lib/format-phone.ts` |
| format | `lib/format.ts` |
| frost-glass | `lib/frost-glass.ts` |
| anonymize-guest | `lib/gdpr/anonymize-guest.ts` |
| guest-saves | `lib/guest-saves.ts` |
| guided-search-data | `lib/guided-search-data.ts` |
| ics-generator | `lib/ics-generator.ts` |
| intake-templates | `lib/intake-templates.ts` |
| perks | `lib/loyalty/perks.ts` |
| status | `lib/loyalty/status.ts` |
| motion | `lib/motion.ts` |
| ai-budget | `lib/nail/ai-budget.ts` |
| ai-prompts | `lib/nail/ai-prompts.ts` |
| infill-calculator | `lib/nail/infill-calculator.ts` |
| station-availability | `lib/nail/station-availability.ts` |
| notifications | `lib/notifications.ts` |
| posthog-api | `lib/posthog-api.ts` |
| posthog-server | `lib/posthog-server.ts` |
| issue-purchase-refund | `lib/purchases/issue-purchase-refund.ts` |
| notify-purchase-refund | `lib/purchases/notify-purchase-refund.ts` |
| ratelimit | `lib/ratelimit.ts` |
| registration-validation | `lib/registration-validation.ts` |
| salon-hours | `lib/salon-hours.ts` |
| search-filter-pills | `lib/search-filter-pills.ts` |
| category-detect | `lib/search/category-detect.ts` |
| embeddings | `lib/search/embeddings.ts` |
| seo | `lib/seo.ts` |
| service-templates | `lib/service-templates.ts` |
| sms | `lib/sms.ts` |
| stock-photos | `lib/stock-photos.ts` |
| strikes | `lib/strikes.ts` |
| stripe | `lib/stripe.ts` |
| supabase-browser | `lib/supabase-browser.ts` |
| supabase | `lib/supabase.ts` |
| tiktok-embed | `lib/tiktok-embed.ts` |
| tos-version | `lib/tos-version.ts` |
| types | `lib/types.ts` |
| utils | `lib/utils.ts` |
| validations | `lib/validations.ts` |
| vat | `lib/vat.ts` |
| validate | `lib/vouchers/validate.ts` |
| authz | `lib/walkin/authz.ts` |
| join | `lib/walkin/join.ts` |

</details>

