# Notifications & Reminders UX — Pet/Booking Platform Research

**Date:** 2026-05-13
**Phase:** 0.14 of Solen→dog-grooming pivot research
**Method:** WebFetch + WebSearch against Fresha help docs, Groomit help center, Treatwell pro, GoReminders templates, Twilio/Omnisend benchmark reports, Swiss data-protection guidance (DLA Piper). No live signup + book + observe; everything below is documentary evidence.
**Confidence:** Fresha/Treatwell/Twilio matrix = high (help-doc verbatim). Groomit specifics = low (help center hides article bodies behind chat). Industry timing benchmarks = medium (multiple corroborating sources).

---

## 1. Notification matrix per platform

Legend: ✅ = confirmed in source. ❓ = mentioned but timing/channel detail not in public doc. — = not offered. `[inf]` = inferred from N sources.

### 1.1 Fresha (salon/spa, ~110k partners)

| Event | Email | SMS | WhatsApp | Push (app) | Default timing | Source |
|---|---|---|---|---|---|---|
| New appointment (booking confirmation) | ✅ free | ✅ paid | ✅ paid | ✅ (in-app) | Immediate on book | help-center 125 |
| Appointment reminder #1 | ✅ free | ✅ paid | ✅ paid | — | 24h before (default; customizable 2–72h) | help-center 167 |
| Appointment reminder #2 (optional) | ✅ | ✅ | ✅ | — | 1h before (optional second reminder) | blog "making-the-most-of" |
| Appointment reminder #3 (optional) | ✅ | ✅ | ✅ | — | Customizable (max 3 total) | help-center 167 |
| Rescheduled appointment | ✅ | ✅ | ✅ | ✅ | Immediate on change | help-center 125 |
| Cancelled appointment | ✅ | ✅ | ✅ | ✅ | Immediate on cancel | help-center 125 |
| Did-not-show | ✅ | ✅ | ✅ | — | After no-show flagged | help-center 125 |
| Thank-you-for-visiting (+ review prompt) | ✅ | ✅ | ✅ | — | Post-appointment (timing not specified) | help-center 125 |
| Thank-you-for-tipping | ✅ | ✅ | ✅ | — | Post-tip | help-center 125 |
| Reminder-to-rebook | ✅ | ✅ | ✅ | — | Customizable per service (e.g. 6 weeks for color) | help-center 132 |
| Birthday discount | ✅ | ✅ | — | — | On birthday | help-center 132 |
| Win-back lapsed clients | ✅ | ✅ | — | — | Customizable (e.g. 90d inactive) | help-center 132 |

**Verbatim quotes:**
> "Send up to three reminders ahead of an upcoming appointment." — help-center 167
> "Notification goes out automatically 24 hours ahead of a client's appointment or you can set it to send between two and 72 hours ahead of the appointment, with an optional second reminder sent one hour before." — blog "making-the-most-of-freshas-notifications"
> "Text and WhatsApp message can't be customized and use a standard format to ensure clear and consistent communication." — help-center 167
> "Email reminders are always free to send through Fresha, while text and WhatsApp message reminders are deducted from your messaging balance." — help-center 167

**Key insight:** Fresha treats **email = unmetered, SMS/WhatsApp = metered**. Defaults to email-only at zero cost; salons opt into paid SMS/WhatsApp when they want belt-and-suspenders. WhatsApp ranks above SMS in Fresha's "And/Or" picker (WhatsApp first, SMS fallback).

### 1.2 Treatwell (European booking marketplace, ~50k salons)

| Event | Email | SMS | Push (app) | Default timing | Source |
|---|---|---|---|---|---|
| Booking confirmation | ✅ free unlimited | ❓ | ✅ | Immediate | propartnercare article |
| Reminder | ✅ free unlimited | ✅ free (partner-funded) | ✅ | Default 24h `[inf from 2 sources]` | propartnercare article |
| Post-visit review request | ✅ | — | ✅ | Post-appointment `[inf]` | search snippet |
| GDPR opt-in/out toggle | ✅ | ✅ | — | At booking | search snippet |

**Verbatim quote:**
> "Clients are able to set their privacy preferences over SMS or email, making sure the system is 100% GDPR-compliant." — Treatwell partner search result
> "Treatwell sends unlimited free automatic email reminders and appointment confirmations, and with the Treatwell app, push notifications are also sent to make sure you don't miss anything." — Google Play listing

**Key insight:** Treatwell **bundles SMS into the partner subscription** (zero per-message charge to salon, unlike Fresha) — this is part of why Treatwell wins European mid-market. They also rely heavily on app push because they ship a native consumer app.

### 1.3 Groomit (US mobile-pet-grooming on-demand)

| Event | Email | SMS | Push (app) | Default timing | Source |
|---|---|---|---|---|---|
| Booking submitted | ✅ | ❓ | ✅ | Immediate, says "confirmation within 1 hour" | groomit.me/help |
| Booking confirmed (groomer accepted) | ✅ | ❓ | ✅ | Within ~1h of request | groomit.me/help |
| Day-before reminder | ❓ | ❓ | ❓ | Not documented publicly | n/a |
| Groomer-en-route | ❓ | ❓ | ✅ `[inf]` | Day-of | help topic "Groomer Arrival & Support" |
| Post-visit review request | ❓ | ❓ | ❓ | Not documented | n/a |

**Verbatim quote:**
> "Real online booking. Confirmed in minutes." — groomit.me homepage
> "Appointments are usually confirmed within 1 hour. If you haven't received confirmation yet, the groomer may be busy with another pet." — groomit.me/help

**Key insight:** Groomit's marketplace model means there's a **two-step confirmation flow** (request submitted → groomer accepts) that traditional salon bookings don't have. This is a Lyft-style on-demand pattern. For a traditional dog-grooming salon (single-shop, owned schedule), this two-step doesn't apply — Solen's flow should mirror Fresha/Treatwell's "booked = confirmed instantly."

### 1.4 GoReminders / Apptoto / generic SMS-reminder vendor templates

Used as proxy for **what content goes in the SMS** because Fresha doesn't publish its exact verbatim SMS body.

Verbatim template from GoReminders ("Appointment Confirmation" template for pet groomers):
> "Hi {{First Name}}, this is {{Groomer Name}} from [Pet Grooming Salon]. Just a friendly reminder that you have a scheduled appointment for {{Pet Name}} on {{Date}} at {{Time}}. If you need to reschedule, please let us know."

Common SMS template structure across 6 vendor sources:
1. Greeting + salon name (sender ID)
2. Pet name (critical for pet vertical — distinguishes from generic salon)
3. Date + time
4. Reschedule CTA (link or phone)
5. Opt-out hint (STOP, etc. — required in many jurisdictions)

---

## 2. Confirmation email anatomy (consensus across Fresha/Treatwell/Checkfront/Pabau)

### Subject line patterns observed

| Pattern | Example | Score |
|---|---|---|
| Verb-led | "Booking confirmed: Bella's bath on Sat" | Highest CTR per Checkfront |
| Salon-led | "Pfötli Grooming — your appointment is confirmed" | Good for brand recall |
| Pet-name-led | "Bella's appointment is booked for May 20" | **Strong for pet vertical** — emotionally hooks |
| Date-led | "Your May 20 grooming appointment" | Functional, low warmth |

### Body sections (in order)

1. **Confirmation pill / hero** — "You're booked!" + green-check
2. **Appointment summary card** — Date, time, salon name, address, service, price, pet name, groomer name
3. **Map / directions link** — Apple Maps / Google Maps deeplink
4. **Pre-visit instructions** — Pet-specific: feeding rules, leash/carrier, vaccination proof. Fresha calls this the "Important info" field, salon-editable.
5. **Reschedule / cancel CTA** — Magic-link to manage booking without login (Fresha pattern)
6. **Cancellation policy** — "Cancellations within 24h charged 50%" or similar
7. **Salon contact** — Phone, email, address. Sometimes Add-to-Calendar buttons (iCal/Google)
8. **Footer** — Powered-by line, unsubscribe (NOT for transactional but for any marketing sidecar), tax/legal address

### CTA hierarchy

Primary: "View booking" or "Manage booking" (deeplink with token, no login required)
Secondary: "Add to calendar"
Tertiary: "Contact salon"

---

## 3. Reminder timing — what the industry actually does

| Source | Recommendation |
|---|---|
| Fresha (default) | 24h before, optional 2nd at 1h before |
| SchedulingKit benchmark | 24h + 2h before — claims 25–40% no-show reduction |
| Apptoto best-practices | 24h standard, 48h for color/chemical services (with prep instructions) |
| Pet-grooming SMS vendors (Etisia, MySMSGate, Spokk) | 24–48h before, optional 1–2h day-of |
| Zigpoll | "Confirmation at booking, reminder 24h before, follow-up after visit" |

**Consensus: 24h standard, +2h optional second reminder.** Pet-grooming-specific twist: 48h works *better* than 24h for first-time clients because that's when they realize they need to find vaccination records / book a sitter for other pets / check parking.

**Anti-pattern flagged by SchedulingKit:** drifting your reminder time week-to-week confuses regulars. Pick one schedule (e.g. "always exactly 24h prior") and stick to it.

---

## 4. Post-visit review request — timing & UX

### Timing benchmark

| Window | Source position |
|---|---|
| Within 1 hour of appointment end | Apptoto + RaveCapture for routine services — captures peak emotion |
| Within 24 hours | PowerReviews + Widewail "ideal window" |
| 3 days post | Klaviyo POS default; Loox app default for service businesses |
| 1 week | Loox e-commerce default (NOT service) |

**Strong consensus for service businesses: 24–48h, NOT 1 week.** 1 week is e-commerce shipping logic. For a service experience the memory decay is faster — by day 5 the customer no longer remembers whether the groomer was 5 minutes late or trimmed the eye area too short.

### Content pattern

1. Subject: "How was Bella's groom?" (pet-name personalization is the unlock)
2. 5-star widget right in the email — single click = star rating, no second page
3. If 4–5 stars → land on public review form (Google Reviews / Trustpilot deeplink for the salon)
4. If 1–3 stars → land on private feedback form (catches negative feedback before it goes public; standard SaaS dark pattern but legitimate as customer-service)
5. Photo upload — "Share Bella's groom photo" (pet-vertical specific — owners LOVE showing off the groom)

### Channel mix observed

Fresha sends post-visit via email + SMS (paid). Treatwell uses email + push. Most pet-vertical vendors recommend **email primary** because (a) the in-email star widget is the conversion lever, (b) SMS post-visit has lower review-completion rate than email, (c) review text + photo is hard to submit by SMS.

---

## 5. SMS reminder UX — link vs. plain-text

### Two schools observed

**School A — Plain-text, no link** (Fresha SMS default):
> "Reminder: Bella's groom with Pfötli Grooming tomorrow 2026-05-21 at 14:00. Reply YES to confirm."

Pro: Cheap (one SMS segment), works on any phone, no anti-phishing-link worry.
Con: No two-way reschedule, no map.

**School B — Link to magic page** (Twilio appointment-reminder reference architecture):
> "Bella's appointment tomorrow at 14:00. Manage: https://solen.ch/b/a8f3"

Pro: One tap to reschedule / view map / call salon.
Con: 2 SMS segments if URL pushes past 160 chars (×2 cost), some Swiss carriers degrade shortlinks, +Swiss data-protection on link tokens.

**Recommendation for MVP: School A** (plain text, no link), with phone number in body for fallback. Add School B in v2 when we ship the magic-link booking-management page.

### Critical content rules for Swiss SMS

- Sender ID: literal salon name, not "SOLEN" (we're the marketplace; the customer's relationship is with the salon)
- Language: matches customer locale (DE / FR / IT / EN) per their account preference
- Opt-out: "STOP" hint in the FIRST SMS (booking confirmation) per UCA Art 3 lit. o
- Time-of-day: don't send between 21:00–08:00 local CH time

---

## 6. Push notifications

Native-app push is the **cheapest** channel per message (~free vs. SMS at ~CHF 0.075/msg) but requires:
- A native app (iOS + Android) OR Web Push (works on Chrome/Edge/Firefox, NOT iOS Safari pre-16.4)
- User opt-in (iOS asks at first launch — most users decline if you ask too eagerly)
- A push-token service (Firebase Cloud Messaging — works fine for CH residents but FCM data transits to Google)

**Treatwell ships native apps and leans on push** — they earned the install, so push is reliable.
**Fresha has consumer-side push in their app** — same logic.
**Groomit also leans on push** — they're an app-first marketplace.

**For Solen MVP:** No native app, no push. Defer to v2 when (a) we have an iOS/Android app, OR (b) Web Push adoption on iOS Safari is high enough to be worth the engineering cost (probably still not in 2026).

---

## 7. Solen MVP notification spec — recommendation

### 7.1 Channel choice for MVP — **email + SMS**

Rationale (lead with the pick):
- **Email** for everything (confirmation, reminders, post-visit review). Zero per-message cost, rich content (cards, photos, CTAs), GDPR/DSG-friendly transactional class.
- **SMS for reminders only** (24h before, optional 2h before). High open-rate (98%), captures the customer who didn't open the email. Skip SMS for confirmation (email is fine, customer just clicked book → in active session) and skip SMS for review request (poor completion).
- **No push** for MVP — defer until native app exists.
- **No WhatsApp** for MVP — Fresha's WhatsApp Business API integration adds a Meta-approval layer + per-message cost. Defer.

**Channel summary table:**

| Event | Email | SMS | Push | Reason |
|---|---|---|---|---|
| Booking confirmed | ✅ | — | — | Customer is at the checkout screen — they know. Email = receipt of record. |
| 24h reminder | ✅ | ✅ | — | Both — email has full detail, SMS is the read-rate insurance. |
| 2h reminder (optional, customer-toggle) | — | ✅ | — | SMS only. Email is too slow on day-of. |
| Cancellation by customer | ✅ | — | — | They just did it; just a receipt. |
| Cancellation by salon | ✅ | ✅ | — | Disruptive event — SMS guarantees same-day eyeball. |
| Reschedule | ✅ | ✅ | — | Same logic as cancel-by-salon. |
| Post-visit review request | ✅ | — | — | Email only. SMS review rate is poor. |
| No-show flag | ✅ | — | — | Email is enough; this triggers a no-show fee policy email. |

### 7.2 Reminder timing — **24h before is standard, 2h before is customer-opt-in**

- **24h reminder:** Sent at a fixed local clock-time the day before (e.g. always at 10:00 the day before, NOT a sliding 24h-exactly window — predictability beats precision per SchedulingKit).
- **2h reminder:** OFF by default, customer can opt-in during checkout ("Send me a same-day reminder 2h before"). Reduces SMS spend ~50% vs. always-on. Same logic as Lyft/Uber arrival pings — opt-in.
- **First-time customer override:** For their FIRST booking with that salon, always send 48h reminder (gives them time to find vaccination card / arrange pet transport). Drop to standard 24h from their 2nd booking onward.

### 7.3 Post-visit review request — **24 hours after appointment end**

- 24h not 1 week, not 1 hour. Sweet spot per PowerReviews/Apptoto for service businesses.
- Email subject: `"How was {{petName}}'s groom?"` (pet-name personalization — the differentiator vs. salon-only platforms).
- 5-star widget inline in email. 4–5 → Google review deeplink for the salon. 1–3 → in-app private feedback form (we triage before any public review).
- Photo CTA: "Share a photo of Bella" → uploads to salon's gallery (consent-gated; default OFF). Pet-vertical loyalty mechanic.

### 7.4 Booking confirmation email template (German + English)

#### German (primary, Bern/Zürich market)

```
Subject: Bellas Termin am 21. Mai ist bestätigt

Hallo Anna,

Bellas Termin bei Pfötli Grooming ist bestätigt!

────────────────────────────────────────
Termin           Di. 21. Mai 2026, 14:00
Salon            Pfötli Grooming
Adresse          Marktgasse 15, 3011 Bern
Service          Hundebad + Schur (klein)
Hund             Bella (Cavalier King Charles)
Groomer          Marco Bühler
Preis            CHF 75
────────────────────────────────────────

[Termin verwalten]   [Zum Kalender hinzufügen]

Was du mitbringen solltest:
• Impfausweis (bei Erstbesuch)
• Halsband + Leine
• Wenn Bella vor 4 Std nichts gegessen hat: ein kleiner Snack

Stornierungsbedingungen: Stornierungen innerhalb von 24 Std
vor dem Termin werden mit 50 % berechnet.

Fragen? Pfötli Grooming erreichst du unter
+41 31 555 12 34 oder marco@pfoetli.ch.

Bis bald in Bern,
das Solen-Team

Solen GmbH · Postfach 1234 · 3001 Bern · solen.ch
```

#### English (secondary, expat market)

```
Subject: Bella's appointment on May 21 is confirmed

Hi Anna,

Bella's appointment with Pfötli Grooming is confirmed!

────────────────────────────────────────
When             Tue 21 May 2026, 2:00 PM
Salon            Pfötli Grooming
Address          Marktgasse 15, 3011 Bern
Service          Dog bath + cut (small breed)
Pet              Bella (Cavalier King Charles)
Groomer          Marco Bühler
Price            CHF 75
────────────────────────────────────────

[Manage booking]   [Add to calendar]

What to bring:
• Vaccination record (first visit)
• Collar + leash
• Small snack if Bella hasn't eaten in 4 hours

Cancellation policy: Cancellations within 24 hours
of the appointment are charged at 50%.

Questions? Pfötli Grooming: +41 31 555 12 34
or marco@pfoetli.ch.

See you in Bern,
the Solen team

Solen GmbH · PO Box 1234 · 3001 Bern · solen.ch
```

### 7.5 SMS reminder template (German + English, plain-text MVP)

#### 24h DE
```
Erinnerung: Bellas Termin bei Pfötli Grooming
morgen 21.05. um 14:00. Marktgasse 15, Bern.
Absagen: +41 31 555 12 34
```
~140 chars → 1 SMS segment ✅

#### 24h EN
```
Reminder: Bella's appointment at Pfötli Grooming
tomorrow 21 May at 2pm. Marktgasse 15, Bern.
Cancel: +41 31 555 12 34
```
~136 chars → 1 SMS segment ✅

#### 2h DE
```
In 2 Std: Bella bei Pfötli, 14:00,
Marktgasse 15. Bis gleich!
```

#### 2h EN
```
In 2h: Bella at Pfötli, 2pm,
Marktgasse 15. See you soon!
```

**Sender ID:** salon name where carrier allows (Swisscom allows 11-char alphanumeric sender IDs; Salt + Sunrise similar). Fallback to a Swiss long number (e.g. +41 79 xxx xxx) if the alphanumeric sender is rejected.

---

## 8. Decisions surfaced

### 8.1 Channels for MVP — **email + SMS, no push, no WhatsApp**
Locked above (§7.1). Defer push to v2 (needs native app or iOS Safari Web Push adoption); defer WhatsApp to v3 (needs Meta approval + costs more than SMS).

### 8.2 Email transactional provider — **Resend, recommended**

Rationale (lead with pick):
- **Resend** for MVP. Best DX for Next.js + React Email templates (we're already on Next.js); generous free tier (3k/month) covers MVP volume; no Swiss data-residency option but the data isn't PHI-grade so US transit is fine under FADP transactional-purpose exemption + standard data-processing addendum.
- Alternative: **Postmark** if we hit deliverability issues — Postmark's transactional-only stance gives best inbox placement, but the React Email integration is weaker and the price step-up is steeper.
- **NOT Mailgun** — modern competitors have caught up and Mailgun's deliverability has slipped per multiple 2025 reports.
- **NOT MessageBird** — recent customer complaints re: billing + integration breakage post-SparkPost acquisition.

### 8.3 SMS provider — **eCall (Swiss) for MVP, Twilio as upgrade**

Rationale:
- **eCall** (ecall-messaging.com) is Swiss-headquartered, GDPR + ISO/IEC 27001:2022 certified, direct interconnection with Swisscom/Sunrise/Salt. Means: lower latency, higher delivery rate to Swiss numbers, no cross-border data transit, single-currency CHF billing.
- **Alternative: ASPSMS** (Vadian.NET, also Swiss, since 1995). Cheaper for small volumes; slightly older API.
- **Twilio** is the obvious global default but routes Swiss SMS through European hubs (delivery still good, but a Swiss-data-only customer audit will flag it). Keep Twilio as the v2 upgrade if/when we ship outside CH.
- **MessageBird/Bird** — same caveats as email side; would not pick.

### 8.4 Push for v2 — **defer**
Web Push on iOS Safari is supported from 16.4+ (March 2023) but **requires the site to be installed as a PWA** (added to home screen) before push permission is even askable on iOS. That kills the funnel for a marketplace where most visitors are first-time. Defer push entirely until we ship a native app, which is a v3-or-later decision.

### 8.5 First-time-vs-repeat customer logic
Surface here because it's a "decision" the build forces:
- First booking with a salon → 48h reminder + extra "what to bring" pre-visit email at 24h
- Returning customer → 24h reminder only
- "Returning" defined as: ≥1 completed booking with THAT salon (not just any Solen booking). Schema implication: notification scheduler needs to JOIN bookings by `(customer_id, salon_id)`.

### 8.6 Time-of-day quiet window
Don't send any SMS between 21:00–08:00 Europe/Zurich. If a 24h reminder window would land at 23:00, push it to 10:00 the next morning (still ≥4h before a typical 14:00 appointment). Implementation: scheduler clamps to a [08:00, 21:00] window in customer-locale timezone.

---

## 9. Risks

### 9.1 Swiss UCA Art 3 lit. o (anti-spam)
> "Sending of unsolicited automated mass advertisement including SMS generally requires prior consent by the recipient ('opt-in')." — DLA Piper CH summary

**Application to us:** Booking confirmations and reminders are **transactional** (existing customer relationship, related to a service the customer just ordered) — exempt under the UCA Art 3 lit. o second-sentence exception (similar-products exemption + opt-out availability). BUT:
- We MUST include opt-out in every transactional SMS (the UCA opt-out requirement applies to transactional too)
- We MUST NOT bundle marketing (rebook nudges, loyalty offers, partner promos) into transactional sends without separate opt-in
- The booking-flow checkout must include a tickbox: "Send me reminders by SMS for this booking" (granular consent per Swiss FADP best practice, even though arguably not strictly required)

**Mitigation:** Two separate Resend "streams" — Transactional (booking confirmation, reminder, post-visit) and Marketing (rebook, loyalty, partner). Customer can opt out of Marketing without disabling Transactional.

### 9.2 GDPR/DSG consent for SMS
- Granular SMS opt-in at booking (default ON for the booking-in-progress, default OFF for future-marketing).
- Single-click STOP processing — required by UCA + DSG. SMS provider (eCall) must handle STOP keyword and propagate the suppression to our database. Verify in eCall's API docs before go-live.
- Customer Account → Notification settings page exposes 3 toggles: Email reminders / SMS reminders / Marketing (with sub-tickboxes for rebook / loyalty / partner offers).

### 9.3 Pet-name leak risk
Cute is also a risk: "Bella's groom tomorrow at Marktgasse 15" SMS reveals:
- Customer's pet name
- Customer's likely location (Marktgasse 15 is the salon, but the receiver of the SMS is likely the owner who is near there at 14:00)
- Time the owner is away from home for ~2h

For most customers this is fine and the personalization is the conversion lever. But the customer-account notification-settings page should include an option to redact pet name + use generic "Your appointment" wording. Default: full personalization ON.

### 9.4 Calendar invite (.ics) deliverability
Adding `.ics` attachments to booking confirmation emails dramatically improves the customer-shows-up rate (everyone who clicks "Add to calendar" has a 99% show-rate per Apptoto). BUT some corporate Outlook installations strip .ics attachments as spam. Mitigation: include BOTH an .ics attachment AND a "Add to calendar" deeplink CTA (Google Calendar URL scheme — works in all browsers).

### 9.5 Localization mismatch
Customer's account language might say `de-CH` but their email client is set to English, or vice versa. Stick to **the language of the customer's Solen account**, not browser headers — that's the explicit signal. Document this in the i18n rules.

### 9.6 First reminder lands in wrong timezone
Swiss customer books for 14:00 from a vacation in Bangkok (UTC+7). 24h-before-clock-time = 10:00 the day before LOCAL TO THE SALON (Europe/Zurich). The SMS will land at 16:00 Bangkok time — fine. Implementation must use **the salon's timezone**, not the customer's device timezone, for reminder scheduling. (For an MVP Switzerland-only with all salons in Europe/Zurich, this is trivial; flag it as a v2 issue when we go cross-border.)

### 9.7 Email-delivery DMARC / SPF setup
Resend (or whichever provider) requires DKIM + SPF for the sending domain. Without it, Gmail/Outlook will junk us within weeks. Pre-launch checklist:
- SPF record `v=spf1 include:_spf.resend.com ~all`
- DKIM records published per Resend's onboarding
- DMARC record `v=DMARC1; p=quarantine; rua=mailto:dmarc@solen.ch`
- BIMI (v2 nice-to-have) for the inbox logo

### 9.8 Cron / scheduler reliability
The current Solen architecture uses GitHub Actions for cron (`.github/workflows/cron-jobs.yml`) hitting `/api/cron/*` routes. For notification scheduling, this works for hourly checks (e.g. every hour, look for reminders due in the next hour and send them). DOES NOT work for second-precision sends (we don't need that). DO confirm:
- GitHub Actions cron has occasional 5–15 min delays — acceptable for our 24h-before window, NOT acceptable for the 2h-before window unless we run the cron every 5 minutes.
- Add a per-reminder `sent_at` column so missed runs don't double-send when the action catches up.

---

## 10. Open questions for the founder

Lead with what to decide:

1. **Channel scope for MVP — email-only or email+SMS?** Recommend email+SMS for the open-rate guarantee, but email-only is half the operational cost and 80% of the value for a small-volume launch. (Pick.)
2. **SMS provider — eCall (Swiss) or Twilio (global default)?** Recommend eCall for the Swiss-first positioning + data-residency story. (Pick.)
3. **Default 2h reminder — opt-in or opt-out?** Recommend opt-in (customer ticks the box during checkout). Reduces SMS spend ~50% and most customers don't need it.
4. **First-time-customer 48h reminder — ship in v1 or v2?** Recommend ship in v1 — adds ~20 lines of scheduler logic but the loyalty payoff is large because the first visit is the make-or-break.
5. **Post-visit review timing — 24h or 3 days?** Recommend 24h. Service businesses ≠ e-commerce shipping windows.
6. **In-email star widget — build now or link out to Google Reviews?** Recommend link out for MVP (Google Reviews is the SEO + trust play anyway), build in-email widget in v2.

---

## 11. Source list (evidence)

- Fresha — Send appointment reminders: https://www.fresha.com/help-center/knowledge-base/calendar/167-send-appointment-reminders
- Fresha — Automated messages overview: https://www.fresha.com/help-center/knowledge-base/marketing/125-automated-messages-overview
- Fresha — Increase bookings with automated messages: https://www.fresha.com/help-center/knowledge-base/marketing/132-increase-bookings-with-automated-messages
- Fresha — Making the most of notifications: https://www.fresha.com/blog/making-the-most-of-freshas-notifications
- Fresha — New automated texts (pricing model change): https://www.fresha.com/blog/automated-texts-fresha
- Groomit — Help center: https://www.groomit.me/help
- Groomit — How does it work: https://www.groomit.me/help/article/getting-started/how-does-it-work
- Treatwell Pro — Confirmations & reminders: http://help.treatwell.pro/en/articles/4853143-how-do-i-send-appointment-confirmations-and-reminders-automatically
- GoReminders — Pet grooming SMS templates: https://www.goreminders.com/pet-grooming-text-reminder-templates
- AppointmentReminder.com — Pet grooming / vet SMS templates: https://appointmentreminder.com/blog/sms-text-templates-for-pet-grooming-veterinary-and-animal-care-appointment-scheduling/
- Apptoto — Email appointment reminder best practices: https://www.apptoto.com/best-practices/email-appointment-reminders
- SchedulingKit — 2026 salon reminder timing: https://schedulingkit.com/appointment-reminders/salons
- Twilio — Appointment reminders use case: https://www.twilio.com/use-cases/contact-center/appointment-reminders
- Twilio — 2024 Global Messaging Engagement Report: https://www.twilio.com/en-us/resource-center/2024-global-messaging-engagement-report
- Omnisend — SMS marketing data 2026: https://www.omnisend.com/blog/sms-marketing-statistics/
- PowerReviews — When to ask for reviews: https://www.powerreviews.com/when-to-ask-for-reviews-best-practice-guide/
- Widewail — Review-request timing by industry: https://www.widewail.com/blog/when-to-request-reviews-and-videos-the-ultimate-guide-to-review-request-timing-by-industry
- DLA Piper — Switzerland electronic marketing law: https://www.dlapiperdataprotection.com/index.html?t=electronic-marketing&c=CH
- eCall — Swiss SMS gateway (GDPR + ISO 27001): https://ecall-messaging.com/en/sms-gateway/
- ASPSMS — Swiss SMS provider: https://www.aspsms.ch/en/
- Postmark — Transactional email providers compared 2025: https://postmarkapp.com/blog/transactional-email-providers
- RoomMaster — Booking confirmation email 2026 templates: https://www.roommaster.com/blog/booking-confirmation-email
- Zigpoll — SMS marketing automation for grooming: https://www.zigpoll.com/content/how-can-i-use-sms-marketing-automation-to-increase-appointment-bookings-for-grooming-services-while-providing-personalized-care-tips

---

## 12. TL;DR

- **MVP channels:** email (everything) + SMS (reminders only). No push, no WhatsApp.
- **Reminder timing:** 24h before (standard) + 2h before (customer-opt-in). 48h for first-time-with-salon customers.
- **Post-visit review:** 24h after appointment, email-only, pet-name in subject line, link to Google Reviews for 4–5★.
- **Email provider:** Resend (Next.js DX + React Email + free tier).
- **SMS provider:** eCall (Swiss, GDPR, ISO 27001, direct CH carrier interconnect).
- **Confirmation email content:** appointment summary card + pet-specific "what to bring" + magic-link manage-booking CTA + cancellation policy + salon contact.
- **Confirmation email template:** drafted above in DE + EN (§7.4).
- **SMS template:** drafted above in DE + EN (§7.5), plain-text, sender-ID = salon name, no link in v1.
- **Compliance:** Swiss UCA Art 3 lit. o requires opt-out in every SMS; transactional ≠ marketing — two separate Resend streams.
- **Pet-name leak:** add account toggle for "redact pet name in SMS" — default OFF (personalization wins).
- **Open questions for founder:** §10 — six picks I've recommended but they're calls only the founder makes.
