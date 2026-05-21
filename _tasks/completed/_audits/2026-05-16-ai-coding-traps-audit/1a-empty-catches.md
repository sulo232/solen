# Topic 1A — Empty Catches & Silent .catch Audit
Date: 2026-05-16

## Summary
- Total findings: 145 (CRITICAL: 13 · HIGH: 24 · MEDIUM: 65 · LOW: 43)
- Files scanned: 940 (.ts/.tsx/.js/.jsx under `app/`, `lib/`, `components-legacy/`, `supabase/functions/`)
- Pattern breakdown:
  - `.catch(() => {})` / `.catch(() => null)` arrow handlers returning falsy: **14**
  - Single-line `try { ... } catch {}` with empty body: **9**
  - Multi-line `try { ... } catch { }` with empty body: **9**
  - Catch blocks containing ONLY a comment (`/* ignore */`, `// silent`, etc.): **113**
  - Catch blocks containing only `console.warn` (no error escalation): **1**

Classification: A handler is "silent" if it suppresses the thrown error without any of: `console.error`, `Sentry.captureException`, `throw`, or a user-visible state update that signals failure. Setting a loading flag to `false` without surfacing the error does NOT count as user-surfacing — the UI just looks like "no data" indistinguishable from an empty result. Pure `setLoading(false)` is therefore still classified.

## CRITICAL
Auth / payment / audit / data-loss class — silent failure here means money, access, or security trail loss.

- [app/api/cron/pending-timeout/route.ts:69] `try { ... stripe.paymentIntents.cancel(...) } catch { /* ignore */ }` — Stripe payment-intent cancellation on an auto-timed-out booking is double-swallowed (both the `.catch(err => console.error)` on the call AND an outer `try/catch { /* ignore */ }`). If cancel fails, the customer is charged for a booking the system already cancelled. Fix: `console.error("[CronPendingTimeout] payment-intent cancel failed", { intent_id, booking_id, err })` AND insert into an `admin_alerts` / `payment_recovery_queue` row so finance can sweep up orphaned holds.
- [app/api/cron/no-show/route.ts:60] `try { logAuditEvent(...) } catch { /* ignore */ }` — Audit-log write for "customer_excessive_no_shows" (3+ no-shows) silently dropped. This is the trail that backs ToS §4.4 suspension decisions; missing entries break the disciplinary record. Fix: `console.error(...)` + dead-letter audit queue.
- [lib/strikes.ts:57] `try { admin.from("audit_log").insert(...) } catch { /* fire-and-forget */ }` — Audit trail for "salon_cancelled_booking" used to count 30-day cancellation strikes (ToS §3.3). Silently swallowing means a salon that should have struck out doesn't, AND subsequent rounds query `audit_log` for prior incidents so the count drifts. Fix: `console.error` + immediate fallback persistence to `audit_failures` / Sentry. Never `/* fire-and-forget */` for compliance writes.
- [app/[locale]/dashboard/all-users/page.tsx:124] `catch { // silently fail }` — Admin user suspension PATCH `/api/admin/users`. If the call fails, the admin clicks "suspend", the modal closes, the table updates client-side, but the server never suspended the user. Admin believes user is banned; user is fully active. Fix: surface a toast ("Suspendierung fehlgeschlagen"), do NOT mutate local state on failure, log to console.error.
- [app/[locale]/dashboard/all-salons/page.tsx:128] `catch { // silently fail }` — Admin salon freeze/approve PATCH (`/api/admin/salons/:id/approve` or `/reject`). Same: admin thinks they froze the salon, the salon stays active. Fix: toast + don't clear `confirmTarget` until success.
- [app/[locale]/dashboard/services/page.tsx:357] `catch { /* ignore */ } finally { setDeleteLoading(false); }` — Service deletion. Optimistic UI removes the service. If the DELETE fails server-side, the service is gone from the salon's UI but still bookable customer-side until refresh — customers book a deleted service. Fix: don't optimistically remove; only filter after `res.ok`.
- [app/[locale]/dashboard/staff/page.tsx:327] `try { fetch(`/api/staff/${member.id}`, { method: "DELETE" }) } catch { /* ignore */ }` — Same pattern for staff. UI removes member, server keeps them; bookings continue to assign. Fix: branch on `res.ok` before local mutation.
- [app/[locale]/dashboard/staff/page.tsx:129] `catch { /* ignore */ }` — Staff↔services assignment save. If PATCH/POST fails, UI claims saved, server has stale mapping. Fix: error toast.
- [app/[locale]/dashboard/services/page.tsx:78] `catch { /* ignore */ }` — Service create/update. If save fails, modal closes, customer-facing salon page has stale/old service. Fix: error toast + keep modal open.
- [app/[locale]/dashboard/services/page.tsx:265] `catch { /* ignore */ }` — Service template add. Silently fails; owner clicks "add template", nothing persists, no feedback. Fix: error toast.
- [app/[locale]/dashboard/services/page.tsx:374] `catch { /* revert on error */ loadServices(); }` — Drag-reorder. Does revert via re-fetch but doesn't tell the user the reorder failed; they re-drag forever. Fix: `console.error` + brief toast.
- [app/[locale]/dashboard/bookings/page.tsx:68] `catch { /* ignore */ }` — Salon-side booking cancellation. Closing the modal on a silent failure makes the salon think the booking is cancelled; customer still gets reminders, stylist still shows up. Fix: keep modal open, show error.
- [app/[locale]/onboarding/salon/page.tsx:421] `catch { /* storage full */ }` — `sessionStorage.setItem('solen_wizard', ...)` during onboarding. If quota is hit, step transitions silently drop state restoration. Owner reopens wizard, 4 steps of data are gone with no explanation. Fix: `console.warn` AND fall back to `/api/salon-draft` (the route already exists).

## HIGH
Deploy-broken / data-integrity-degraded / user-confused-without-error class.

- [app/api/bookings/route.ts:123] `try { sendEmail(bookingConfirmation(...)) } catch { /* email failure shouldn't break booking */ }` — Customer booking-confirmation email. OK to not break the booking response, but the failure should be logged + surfaced for retry. Currently invisible. Fix: log + retry queue.
- [app/api/bookings/route.ts:153] `try { sendEmail(salonNewBooking(...)) } catch { /* owner notification failure must not break booking */ }` — Salon owner doesn't get notified about new booking. Owner finds out only when the customer walks in. Fix: log + retry queue.
- [app/api/bookings/route.ts:226] `try { ... credit referrer + referee ... } catch { /* referral failure must not break booking */ }` — The whole referral-reward block (credits both users) is in one giant silent catch. If audit insert/update fails halfway, one side gets credit and the other doesn't (or neither does), no log. Fix: log + push to `referral_failures` reconciliation table.
- [app/api/bookings/walk-in/route.ts:99] `try { sendSms(...) } catch { /* SMS failure non-fatal */ }` — Walk-in SMS. Customer expects confirmation; silent failure means they show up at the wrong time. Fix: log + flip `smsSent` to "failed" tri-state so the UI shows "SMS konnte nicht gesendet werden".
- [app/api/bookings/[id]/cancel/route.ts:137] `try { sendEmail(...waitlist...) } catch { /* non-fatal */ }` — Waitlist "slot freed" notification. The whole point of waitlist is "tell people when a slot opens"; silently dropping defeats the feature. Fix: log + retry queue.
- [app/api/bookings/[id]/cancel/route.ts:192] `try { Promise.allSettled(promises) } catch { /* non-fatal */ }` — Already using `allSettled` (never rejects) AND wrapping in a try/catch. The settled results contain actual rejection reasons but they're never inspected. Fix: iterate results, log rejected entries with reason.
- [app/api/bookings/recurring/route.ts:92] `try { sendEmail(recurringConfirmation(...)) } catch { /* non-fatal */ }` — Recurring booking confirmation. Customer doesn't get the confirmation. Fix: log.
- [app/api/availability/manage/[slot_id]/route.ts:45] `try { sendEmail(bookingCancellation(...)) } catch { /* non-fatal */ }` — Email to customer whose slot was deleted by salon. Customer arrives at deleted slot. Fix: log + retry.
- [app/api/slots/[id]/route.ts:23] `try { sendEmail(bookingCancellation(...)) } catch {}` — Same (DELETE slot path).
- [app/api/slots/[id]/route.ts:79] `try { sendEmail(bookingReschedule(...)) } catch {}` — Reschedule email on slot PATCH. Customer doesn't know the appointment moved.
- [app/api/conversations/[id]/messages/route.ts:137] `try { sendEmail(newMessageNotification(...)) } catch { /* notification failure must not break the message send */ }` — Chat notification email. Silently fails → users never know they have a message until they open the app.
- [app/api/cron/birthday-messages/route.ts:54] `try { sendEmail(birthday...) } catch { /* non-fatal */ }` — Birthday loop sends N, M fail silently. Fix: aggregate failed recipients, return count + failure list from the route so the cron monitor sees "sent 47/50".
- [app/api/off-peak/route.ts:149] `} catch(e) { /* ignore single user error */ }` — Per-user off-peak alert email. Same pattern as birthday. Fix: aggregate.
- [app/api/dashboard/waxing/rebook-alerts/route.ts:92] `try { admin.from("reminder_log").insert(...) } catch { /* ignore */ }` — `reminder_log` row. This table powers the "already reminded N times" guard. If the insert fails, the system spams the client. Fix: log + return non-200.
- [app/api/referral/route.ts:41] `catch { // Ignore if referrals table doesn't have these columns }` — Querying referral stats. Comment says "schema-driven" but a real network/DB error gets swallowed. Fix: log unexpected; only swallow `PostgrestError.code === '42703'`.
- [app/[locale]/dashboard/calendar/page.tsx:88] `catch { /* ignore */ }` — Single-slot create POST. Modal closes, no slot created.
- [app/[locale]/dashboard/calendar/page.tsx:164] `catch { /* ignore */ }` — Bulk slot create POST. Owner thinks they created a week of slots, none exist.
- [app/[locale]/dashboard/calendar/page.tsx:384] `catch { /* ignore */ }` — Slot list fetch. Empty calendar indistinguishable from fetch failure.
- [app/[locale]/dashboard/discovery-admin/page.tsx:117] `catch { /* continue */ }` — Bulk Pexels import loop. If one fails, counter doesn't increment but loop continues. Admin sees inflated/incorrect import count.
- [app/[locale]/dashboard/homepage-admin/page.tsx:67] `catch { // ignore }` — Homepage sections PUT. Admin presses Save, no `saved` toast appears, no failure feedback.
- [app/[locale]/dashboard/settings/page.tsx:553] `catch { /* ignore */ }` — Salon verification POST. One-shot trigger silently failing means salon thinks they kicked off verification when they didn't.
- [components-legacy/profile/PaymentMethodsSection.tsx:90] `catch {} finally { setLoading(false) }` — `/api/stripe/payment-methods` GET. If the call fails, the list is empty and the user sees "no payment methods" — they re-add their card, get double-billed on next cycle.
- [components-legacy/onboarding/steps/PaymentsStep.tsx:54] `catch { /* ignore */ }` — Payment-mode PATCH. Owner clicks save, UI advances, server didn't persist.
- [components-legacy/onboarding/steps/SalonProfileStep.tsx:63] `catch { /* ignore */ }` — Salon profile PATCH. Same pattern.
- [components-legacy/onboarding/steps/OpeningHoursStep.tsx:75] `catch { /* ignore */ }` — Opening hours PATCH. Owner customizes hours, none save.
- [components-legacy/onboarding/steps/ScheduleStep.tsx:50] `catch { /* ignore */ }` — Staff schedule auto-apply POST. Step appears complete, schedule not applied.

## MEDIUM
Bug-hiding / hidden state loss / non-critical-but-confusing class. 65 findings; representative slice listed.

- [app/[locale]/salon/[slug]/page.tsx:129] `.catch(() => {})` — Off-peak countdown fetch.
- [app/[locale]/salon/[slug]/page.tsx:188] `.catch(() => {})` — Nail-tech portfolio preview fetch. Empty grid indistinguishable from no portfolio.
- [app/[locale]/salon/[slug]/page.tsx:287] `.catch(() => {})` — `/api/reviews/my-booking` fetch (used to surface "leave a review" CTA). Silent failure means CTA never appears, customer can't review.
- [app/[locale]/salon/[slug]/page.tsx:292] `.catch(() => {})` — `/api/salons/mine` fetch (owner detection for edit-button visibility). Silent failure means owner sees customer view of own salon.
- [app/[locale]/salon/[slug]/page.tsx:298] `.catch(() => {})` — `/api/slots/next-available` fetch (quick-book CTA). Silent failure → no quick-book button.
- [app/[locale]/salon/[slug]/page.tsx:308] `.catch(() => {})` — `/api/analytics/track-view` POST. Analytics losing data silently is acceptable but should `console.debug`.
- [app/[locale]/salon/[slug]/page.tsx:378] `.catch(() => {})` — Salon reload after action. Silent failure → stale page.
- [app/[locale]/help/[slug]/page.tsx:41] `.catch(() => { setNotFound(true); setLoading(false); })` — Treats every fetch failure as 404. Transient network errors look like missing docs.
- [app/[locale]/_components/salon/SalonHeader.tsx:109] `.catch(() => {})` on `navigator.share()`. Should narrow: `err.name === "AbortError"` is fine, other errors should `console.warn`.
- [app/[locale]/_components/salon/SalonHeader.tsx:111] `.catch(() => {})` on `navigator.clipboard.writeText`. Same.
- [app/[locale]/_components/salon/SalonHero.tsx:92] `.catch(() => {})` on `navigator.share()`. Same.
- [app/[locale]/salon/[slug]/page.tsx:367] `catch { /* user cancelled */ }` — Same narrowing issue.
- [app/[locale]/onboarding/salon/page.tsx:215] `catch { /* fail silently */ }` — `/api/ai/suggest-service` POST. AI breaks → empty hint, no indication.
- [app/[locale]/onboarding/salon/page.tsx:399] `catch { /* fall through to sessionStorage */ }` — Draft API failure. Fall-through is fine but `console.warn` should log API error.
- [app/[locale]/onboarding/salon/page.tsx:409] `catch { /* ignore corrupted data */ }` — `JSON.parse` of sessionStorage. Add `console.warn`.
- [app/[locale]/dashboard/clients/page.tsx:249] `catch { /* ignore */ }` — Client note add. Note added in UI, not persisted.
- [app/[locale]/dashboard/clients/page.tsx:267] `catch { /* ignore */ }` — Client tag add. Tag added in UI, not persisted.
- [app/[locale]/dashboard/disputes/page.tsx:64] `catch { // Not JSON — legacy plain text reason }` — Narrow to `SyntaxError`.
- [app/[locale]/dashboard/loyalty/page.tsx:32] `catch { // Error }` — Empty comment.
- [app/[locale]/dashboard/discovery-admin/page.tsx:580] `catch { /* best effort — UI already updated */ }` — Discovery reorder. UI shows new order until reload on failure.
- [app/[locale]/_components/salon/SalonDetailV3.tsx:104] `catch { // ignore }` — Spot-check.
- [app/[locale]/_components/homepage/useRecentSearches.ts:49, 57] localStorage parse + write. Add `console.warn`.
- [app/[locale]/_components/primitives/CookieConsent.tsx:92, 102, 142] Consent parse / write / withdrawal. Add `console.warn` for monitoring.
- [app/[locale]/dashboard/services/page.tsx:177] `try { fetch upload } catch {} finally { setUploading(false) }` — Service photo upload. Silently fails.
- [app/[locale]/brand/[slug]/page.tsx:37] `catch { // ignore }` — Brand metadata fetch.
- [app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:64] `catch { // Error loading }` — No action.
- [app/[locale]/spa/page.tsx:24] `catch { /* graceful degradation */ }` — Salon-count fetch on SEO metadata. SSR-safe but `console.warn` would catch silent-broken metadata.
- [app/[locale]/nails/page.tsx:25, 75] Same pattern.
- [app/[locale]/coiffeur/page.tsx:26] Same.
- [app/[locale]/coiffeur/page.tsx:76] `catch { /* graceful degradation — page renders without JSON-LD */ }` — JSON-LD silently degraded → SEO regressions invisible.
- [app/[locale]/barbershop/page.tsx:26, 76] Same.
- [app/[locale]/makeup/page.tsx:24] Same (note: makeup category is retired V2-D15-3, page may be dead code).
- [app/[locale]/waxing/page.tsx:24] Same.
- [app/api/gift-cards/purchase/route.ts:98] `catch { /* email non-fatal */ }` — Recipient gift-card email. Buyer paid, recipient never gets notified.
- [app/api/salon/clients/route.ts:82] `catch { /* view may not exist yet */ }` — Narrow to `code === '42P01'`.
- [components-legacy/BookingCalendar.tsx:291] `catch { // silent }` — Waitlist submit. UI says done, server didn't get it.
- [components-legacy/ProfilePage.tsx:87] `catch { /* ignore */ }` — Customer-side booking cancel.
- [components-legacy/ChatWindow.tsx:63] `catch { /* ignore */ }` — Message list fetch. Empty chat indistinguishable from fetch failure.
- [components-legacy/ChatWindow.tsx:261] `catch { /* ignore */ }` — Translation fetch.
- [components-legacy/chat/ClientTags.tsx:69, 82] Tag add + delete. Optimistic UI, no rollback.
- [components-legacy/chat/PhotoGallery.tsx:116] `catch {}` — Save nail inspo POST. UI marks "saved" optimistically.
- [components-legacy/dashboard/IntakeFormTab.tsx:71] `catch { /* ignore */ }` — Intake form save.
- [components-legacy/dashboard/FormulaTab.tsx:66] `catch { /* ignore */ }` — Hair-color formula save (gradient/developer/timing). Lost-formula data on silent fail.
- [components-legacy/dashboard/ClientPhotosTab.tsx:52] `catch { /* ignore */ }` — Client photo upload. Photo "vanishes" in UI.
- [components-legacy/dashboard/spa/RoomManager.tsx:106] `catch {}` — Room DELETE.
- [components-legacy/dashboard/spa/RoomManager.tsx:49] (multi-line) Rooms list GET. Empty list shown on fetch error.
- [components-legacy/dashboard/spa/WellnessJournal.tsx:54] (multi-line) Journal list GET.
- [components-legacy/dashboard/spa/TreatmentOutcome.tsx:52] `catch {}` — Treatment outcomes list GET.
- [components-legacy/dashboard/waxing/ZoneRevenueChart.tsx:33] (multi-line) Revenue data fetch.
- [components-legacy/dashboard/waxing/RebookAlerts.tsx:34] (multi-line) Rebook alerts fetch.
- [components-legacy/dashboard/waxing/SensitivityLog.tsx:59 + 100] Read + write empty catches. Severe-reaction data dropped silently is a safety issue (waxing skin reactions).
- [components-legacy/dashboard/waxing/BodyZoneSelector.tsx:90 + 126] Read + write empty catches.
- [components-legacy/dashboard/waxing/ZonePackages.tsx:58] Empty catch.
- [components-legacy/dashboard/waxing/RegrowthConfig.tsx:41 + 62] Read + write empty catches for regrowth scheduling.
- [components-legacy/onboarding/steps/ServicesStep.tsx:74 + 83] Service add + remove empty catches.
- [components-legacy/dashboard/nail/DynamicPricingConfig.tsx:97] `catch { // Request failed — keep rule in state }` — DELETE rule. Optimistic UI removes; need to re-add on failure.
- [components-legacy/nail/InspoBoard.tsx:91] `catch { // silent fail — board creation is non-critical }` — User clicks "create board", no toast.

## LOW
Debug-quality / edge-case / cosmetic class. 43 findings; representative slice.

- [app/api/quartier/subscribe/route.ts:14] `await request.json().catch(() => null)` — Standard input-validation pattern. Add `console.warn` for invalid-JSON monitoring.
- [app/api/salon/documents/route.ts:41] `await req.formData().catch(() => null)` — Same.
- [app/api/admin/discovery/import-tiktok/route.ts:39] `await req.json().catch(() => null)` — Same.
- [lib/posthog-api.ts:31] `await res.text().catch(() => "")` — Reading error response body. Reasonable.
- [lib/supabase.ts:15] `catch { // Fall through — cookieStore stays null }` — Cookie parse. Reasonable but should log: `console.warn("[supabase] cookies() parse failed — falling back to anonymous", err)`.
- [lib/posthog-server.ts:75] `catch { // Ignore internal shutdown errors }` — `posthog.shutdown()` quirk. Harmless.
- [lib/ai/recommendations.ts:43] `catch { // ignore parse errors — fall through to legacy header }` — Edge-geo header parse. Fine.
- [components-legacy/RecentlyViewed.tsx:58] `catch { // localStorage full or unavailable — ignore }` — Storage write. Fine.
- [components-legacy/RecentlyViewed.tsx:72] `catch { // ignore }` — Storage read.
- [components-legacy/compare/CompareContext.tsx:60] `catch (err) { // ignore parse errors }` — `err` captured but unused. Add `console.warn`.
- [components-legacy/ui/GuidedSearch.tsx:84, 93, 100] Three localStorage catches. Fine; add `console.warn` for parity.
- [components-legacy/ui/HomeSearchBar.tsx:62] `catch { // Detection failed }` — Category-detection API. Fall-through is intended UX. Add `console.warn`.
- [components-legacy/ui/SearchAutocomplete.tsx:115] `catch { // Aborted or failed — ignore }` — Smart-search debounced fetch. Narrow to `err.name === "AbortError"`; warn on others.
- [components-legacy/discovery/SalonScript.tsx:37] `catch { /* fallback */ }` — clipboard write. No "copied" indicator on failure.
- [components-legacy/discovery/ShareButton.tsx:32] `catch { /* fallback */ }` — clipboard write.
- [components-legacy/discovery/ShareButton.tsx:61] `catch { /* silent */ }` — Image download. User clicks download, nothing happens, no feedback.
- [components-legacy/discovery/ReportButton.tsx:34] `catch { // Silent }` — Report POST. Should at least toast.
- [components-legacy/discovery/RelatedTikToks.tsx:31] `catch { /* silent */ }` — Related-tiktok fetch.
- [components-legacy/discovery/SimilarStyles.tsx:36] `catch { /* silent */ }` — Same.
- [components-legacy/discovery/ForYouSection.tsx:44] `catch { /* silent */ }` — Same.
- [components-legacy/barber/WaitTimeDisplay.tsx:37] `catch { // Silently fail for public display }` — Public display. Reasonable; add `console.warn` for monitoring.
- [components-legacy/barber/ExpressRebook.tsx:51] `catch { // No last cut available }` — Narrow to 404.
- [components-legacy/dashboard/barber/ExpressMenu.tsx:36] `catch { // Error }` — Services fetch.
- [components-legacy/dashboard/barber/WalkinAnalytics.tsx:47] `catch { // Error }` — Stats fetch.
- [components-legacy/dashboard/barber/SmartReminderConfig.tsx:46 + 66] Two catches: `// Error loading` / `// Error sending`. Add toast + console.error.
- [components-legacy/dashboard/barber/PLComparison.tsx:46] `catch { // }` — Empty comment.
- [components-legacy/dashboard/barber/LoyaltyConfig.tsx:42 + 62] `catch { // No program yet }` and `catch { // Error saving }`. First narrow to 404; second toast.
- [components-legacy/dashboard/barber/BarberLeaderboard.tsx:49] `catch { // Error loading }`.
- [components-legacy/dashboard/barber/HeadDiagram.tsx:55] `catch { // silent fail is ok for diagram }` — SVG fetch. Reasonable.
- [components-legacy/dashboard/barber/WalkinHourlyChart.tsx:46] `catch { // }` — Empty comment.
- [components-legacy/nail/HandChart.tsx:47] `catch { // silent — chart just starts empty }` — Reasonable.
- [components-legacy/nail/DesignHistoryTimeline.tsx:46] `catch { // silent fail — publish is non-critical }` — User clicks publish, no confirmation/failure. Add toast.
- [components-legacy/staff/StaffProfilePage.tsx:75] `catch { // silently fail }` — Public staff page fetch. Add 404 or error state.
- [components-legacy/editor/EditorPage.tsx:72, 126, 137] Three silent catches in admin editor for feature requests. Admin tools should be loud.
- [components-legacy/editor/DeviceFrame.tsx:89] `catch { // Cross-origin iframe }` — Reasonable.
- [components-legacy/CategoryPage.tsx:569] `.catch(() => { setFetchError(...); setLoading(false); })` — Already surfaces error. Good.
- [components-legacy/CategoryPage.tsx:270] `.catch((err) => { console.error(...); })` — Already logs. Good.
- [components-legacy/booking/PackageRedeemBanner.tsx:44] `catch { /* non-JSON */ }` — Inner parse fallback. Reasonable.
- [app/[locale]/dashboard/analytics/page.tsx:105] `.catch((err) => { console.error(...) })` — Already logs.
- [app/[locale]/angebote/page.tsx:100] `.catch(() => { if (!cancelled) setLoading(false) })`.
- [app/[locale]/discover/page.tsx:97] Same pattern.
- [components-legacy/NearbySalons.tsx:43] Same pattern.
- [components-legacy/ui/CategoryTree.tsx:48] Same pattern.

## Notes

- **The dominant anti-pattern in this codebase is `try { fetch(...mutation...) } catch { /* ignore */ } finally { setLoading(false) }`** — every dashboard modal/form follows this template: services, staff, calendar, bookings, all-users, all-salons, clients, settings, gift cards, packages, off-peak, etc. This pattern violates project CLAUDE.md "Error handling" section verbatim: *"Never `.catch(() => {})`. Always `console.error("[Component] desc:", err)`. ... Payment flows → log + user-visible error with retry."* The fix is mechanical and high-impact: replace every `catch { /* ignore */ } finally { setLoading(false) }` with `catch (err) { console.error("[X] desc:", err); /* show toast */ } finally { setLoading(false) }`.

- **The cron + email-send pattern is broken-by-design**: every cron job and email-send branch silently drops failures with `/* non-fatal */` or `/* ignore */`. Email delivery for bookings, cancellations, reminders, birthdays, gift cards, waitlist, off-peak, and chat-notification ALL silently fail. This is the biggest single source of user-trust regressions — "I never got an email" complaints have no server-side trail. Need a single `enqueueEmailRetry(payload, err)` helper used uniformly.

- **Admin / dashboard CRUD is dangerously optimistic**: user suspension, salon freeze, service delete, staff delete, slot create/delete, calendar reorder — all update local state BEFORE server confirmation, with silent error handling. An admin can think they suspended a user when they didn't. Fix: branch on `res.ok` before mutating local state.

- **Audit-log writes (lib/strikes.ts, /api/cron/no-show)** silently swallowing failures is the most compliance-critical class. ToS §3.3 and §4.4 enforcement depends on `audit_log` being complete; strike-out decisions are made from this data.

- **Adjacent anti-pattern worth flagging in a follow-up slice**: many catches that DO log use only `console.error` without surfacing to a real observability layer (no Sentry/PostHog wiring around them). `instrumentation.ts` is minimal; integrating Sentry's `captureException` at catch sites converts these from "logged once on dev console" to "alertable in prod".

- **`navigator.share` / `navigator.clipboard` catches** swallow legitimate browser-feature errors alongside user-cancellation aborts. Standard idiom: narrow to `err.name === "AbortError"` (silent) vs everything else (warn). Currently the codebase universally swallows both — broken clipboard permissions in iframe contexts are invisible.

- **localStorage / sessionStorage catches** are mostly defensible (Safari private mode, quota errors) but should all `console.warn` for monitoring rather than silent. Quota errors in particular indicate underlying memory issues worth surfacing.

- **No catch block was found that contained ONLY `console.log`** (the spec asked about this). The codebase uses `console.error` consistently when it logs at all — the issue is whether it logs at all.

- **`.catch.bind` / `void promise()` patterns** were NOT searched in this slice but are worth a separate scan — another way to swallow rejections.
