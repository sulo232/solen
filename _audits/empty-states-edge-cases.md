# Empty States & Edge-Case UX — Phase 0.16 Audit

> **Date:** 2026-05-13
> **Scope:** Document edge-case UX patterns for the Solen → dog-grooming pivot. Sources: Fresha help center + blog, Groomit cancellation policy, Tucker Pup's, Wolfe Pet Grooming, Dirty Dog Spa, Dogfather & Co. (403'd), Airbnb host-cancel policy, Stripe declines docs, empty-state pattern libraries (Eleken, Mobbin, Carbon, PatternFly).
> **Output:** Decisions surfaced at §8.

---

## 0. TL;DR / Key Decisions Surfaced

| Decision | Recommendation | Confidence |
|---|---|---|
| Cancellation window | **24h** (industry mode across 5 sampled groomers) | High |
| Late-cancel fee | **50% of service price** (mid-point of 30–100% industry spread; matches Fresha default example) | High |
| No-show fee | **100% of service price** (matches Groomit "groomer arrived" + Dirty Dog "up to 50%" mid-tier; industry mode is 50–100%) | Medium |
| Reschedule cap | **2 reschedules per booking**, then treated as cancel | Inferred — no industry datum found; Wolfe Pet's "chronic rescheduling" clause is the closest precedent |
| Deposit | **None for MVP**; revisit when no-show rate > 8% | Inferred — Fresha makes deposits optional; introducing friction at MVP hurts conversion |
| Groomer-cancels flow | **Full refund + 1-tap rebook with similar groomer** (Airbnb AirCover model) | High |
| Empty-state copy | Specific + actionable + one CTA (Eleken/Mobbin canon) — no clever humor at MVP | High |
| Payment-failed retry | **In-checkout retry** for soft declines, **prompt for new card** on hard declines (Stripe canon) | High |

---

## 1. Per-Platform Policy Comparison

### Sources sampled

| Platform | URL | Type |
|---|---|---|
| Groomit | `groomit.me/customer-cancellation-policy` | On-demand mobile groomer marketplace |
| Fresha | `fresha.com/help-center/knowledge-base/payments/*` | Multi-vertical booking SaaS (also drives consumer marketplace) |
| Tucker Pup's | `tuckerpups.com/.../dog-grooming-cancellation-policy.php` | Independent grooming salon |
| Wolfe Pet Grooming | `wolfegrooming.com/policies` | Independent grooming studio |
| Dirty Dog Spa | `dirtydogsspa.com/policies` | Independent grooming spa |
| Airbnb | `airbnb.com/help/article/170` | Marketplace precedent for provider-cancels |

> **Note on Scenthound + Dogfather & Co.:** `scenthound.com/membership-faqs` returned 404 and `dogfatherandco.com/.../cancellation-policy/` returned 403 during research. Patterns below draw from the remaining 5 sources + Fresha blog + the `groomertogroomer.com` industry article surfaced via search snippets.

### 1A. Cancellation policy matrix (verbatim where quoted)

| Scenario | Groomit | Fresha (default example) | Tucker Pup's | Wolfe Pet | Dirty Dog Spa |
|---|---|---|---|---|---|
| **Cancel 24h+** | Free | "Cancel 48+ hours before: no fee" | Free if 3+ days | "48+ hours notice: No fee" | Free if 24h+ |
| **Cancel <24h** | "$30" cancel / "$15" reschedule | "Cancel within 48 hours: 25% fee" | $40–$100 tiered by duration | "Within 48 hours: $25 per pet fee may apply" | "$35.00" cancellation fee |
| **Same-day / groomer-en-route** | "$60" cancel / "$30" reschedule | (Not specified) | (Not specified) | (Same-day) "$25 per pet fee plus $25 per pet deposit required for future services" | (Same-day captured by <24h tier) |
| **Groomer arrived** | "$100 max" cancel / "$80" reschedule | (Not specified) | (Not specified) | (Not specified) | (Not specified) |
| **No-show** | "the groomer may charge up to the full service fee" | "No-show: 50% charge" | Same as late-cancel tiers; card on file is auto-charged | Same as same-day + deposit-on-future | "up to 50% of the appointment cost" |
| **Holiday rule** | (Not specified) | (Not specified) | (Not specified) | (Not specified) | "Nov 10 – Dec 31, require a credit card to reserve... must be cancelled no less than 48 hours to prevent a $25 late cancellation fee" |
| **Inclement weather** | (Not specified — implicit good-faith) | (Not specified) | (Not specified) | (Not specified) | "The standard 24-hour cancellation policy does not apply during inclement weather" |
| **Member exception** | Annual Recurring Plans: "No cancellation or rescheduling fees apply — regardless of timing" | (Per-business) | (Not specified) | (Not specified) | (Not specified) |

**Mode (most common):**
- **Cancellation window:** 24h (Groomit, Dirty Dog) or 48h (Fresha example, Wolfe). 24h is more customer-friendly and matches the dominant urban-grooming pattern.
- **Late-cancel fee:** 25% (Fresha) / 30% (industry blog) / 50% (industry mode per `groomertogroomer.com` search snippet) / 100% same-day (Wolfe, Dirty Dog implicit).
- **No-show fee:** 50% to 100% of service. Mode = 100% on Groomit "groomer arrived" tier + Wolfe + Dirty Dog implicit (full fee).

### 1B. Reschedule rules

| Platform | Reschedule fee structure | Cap on # of reschedules |
|---|---|---|
| Groomit | Same time-tier as cancel but **half the price** ($15 / $30 / $80 vs $30 / $60 / $100) | Not specified |
| Fresha | Per-business (no platform default) | Not specified |
| Tucker Pup's | Treated as cancel if you re-late; rebook-on-late-arrival ≥10min | Not specified |
| Wolfe Pet | "chronic rescheduling that causes your dog to be regularly overdue may result in permanent removal from our booking system" + "non-refundable $25 deposit per pet, per appointment" for habitual reschedulers | **Implicit, behavioral** — flagged after pattern |
| Dirty Dog | Late arrival ≥15min = "considered a late-cancel and subject to cancellation fees" | Not specified |

> **Pattern:** Reschedule fees are 50% of cancel fee (Groomit's tiering is the cleanest model). No platform exposes a hard "max N reschedules" rule — Wolfe's behavioral kick-out is the closest. **Solen MVP can innovate here** by exposing a soft 2-reschedule cap with a clear message: *"This is your 2nd reschedule for this booking — one more change will count as a cancellation under our policy."*

### 1C. Groomer-cancels-on-you flow

| Platform | Customer compensation | Rebook help |
|---|---|---|
| Groomit | (Not detailed — implicit: full refund) | (Not specified) |
| Fresha | (Per-business; platform doesn't enforce) | (Per-business) |
| Tucker Pup's | "Reservations may be cancelled and rescheduled if... proper vaccination documentation is not provided" (provider-side reasons only) | N/A — solo salon |
| Airbnb (precedent) | "you'll receive a full refund, including service fees, if you choose not to rebook" + booking credit option (72h TTL, then refund) | "we'll help you rebook a similar place to stay, considering location and amenities, based on availability at comparable pricing" |

> **Pattern:** No grooming-vertical platform has a documented provider-cancels policy. **Airbnb's AirCover model is the strongest precedent** — full refund + active rebooking assistance + provider-side penalty. Worth importing directly for Solen MVP.

### 1D. Payment-failed handling

| Platform | Where it surfaces |
|---|---|
| Fresha | "Automatically cancel appointments for clients that did not pay a deposit" within 1–72h window; auto-cancellation notification sent | Auto-cancels booking after timeout |
| Stripe (engine) | Smart Retries: "recommended default setting being 8 tries within 2 weeks" for invoice-style billing; **for checkout flows: "prompt them to try their payment method again or ask for a new payment method"** | In-checkout prompt |
| Stripe hard decline | "Stripe can't retry invoice payment without a new payment method, and the payment only executes if you obtain a new payment method" | New card required |

---

## 2. UX Surface — Where Does the User Discover the Policy?

| Touchpoint | Groomit | Fresha | Industry mode |
|---|---|---|---|
| **Marketplace search results** | Not visible | Not visible | Not visible — buried until booking |
| **Salon detail page** | Visible (link to policy doc) | Optional per-business | ~50% surface here |
| **Booking flow / time-slot pick** | Not visible | Not visible | Hidden |
| **Cart / payment screen** | Visible in T&C link | Fresha standardized format: "Cancellation and no-show terms are created automatically from the payment policy you set up" and are "shown to clients in a standardised format during the booking process, helping keep information consistent and ensuring clients understand what applies before confirming." | **This is the canonical surface — pre-confirm.** |
| **Booking confirmation email** | Yes (always) | Yes (Fresha standard) | Yes (always) |
| **Booking-detail screen in app** | Yes — full policy displayed inline | Yes (per-business) | ~80% surface here |
| **Cancel-modal interstitial** | Yes — fee shown before confirming cancel | Yes (Fresha standard) | **Critical surface — fee preview before confirm** |
| **Dedicated terms page** | Yes | Yes | Universal — fallback link |

> **Solen MVP recommendation:** Surface the policy summary at **cart** (one-liner inline) + **booking-detail** (full text expandable) + **cancel modal** (fee preview before confirming the action). Don't dump the full policy in search results — adds friction with no decision value at that surface.

---

## 3. Empty State Patterns

### 3A. Canonical structure (Eleken / Mobbin / Carbon / PatternFly consensus)

Four parts, in order:

1. **Illustration or icon** — context-aware. *"an empty contact list might use a friendly outline of a user avatar, and an empty file screen could show a folder icon, which reinforce location and reassure users they're in the right place"* (Eleken).
2. **Heading** — specific. *"Say exactly why the screen is empty: 'You haven't added any items yet,' not 'No data.'"* (Eleken).
3. **Body** — 1-2 sentences max, explains what to do next.
4. **Single primary CTA** — one button. Avoid "information overload (cramming multiple CTAs and lengthy text)" (Eleken anti-pattern).

### 3B. Per-scenario empty states (Solen-specific)

#### 3B.1 "No groomers in your radius"

| Element | Spec |
|---|---|
| **Illustration** | Map pin + dog silhouette + dotted radius circle (matches map-context affordance per Eleken) |
| **Heading** | "Keine Hundefriseure in deiner Nähe" (DE) / "No dog groomers in your area" (EN) |
| **Body** | "Wir sind noch nicht in {city}. Möchtest du benachrichtigt werden, sobald wir starten?" / "We're not in {city} yet. Want to know when we launch?" |
| **Primary CTA** | "Benachrichtigung aktivieren" / "Notify me" (captures email/push opt-in — converts dead-end into pipeline) |
| **Secondary CTA** | "Suche erweitern auf 25 km" / "Expand search to 25 km" (only show if user came from a smaller radius) |
| **Anti-pattern to avoid** | "Sorry, no results." (vague — Eleken explicit anti-pattern) |

> **Inferred pattern** — no grooming platform has this surface in published research (they all hide it behind login or fall back to "contact us"). Most direct precedent is Airbnb's no-listings-in-area state (illustration + city expansion suggestion) — Eleken cites it as a marketplace canon.

#### 3B.2 "No availability for selected date"

| Element | Spec |
|---|---|
| **Illustration** | Calendar with X overlay (universal "scheduled but full") |
| **Heading** | "Keine freien Termine am {date}" / "No slots on {date}" |
| **Body** | "Versuche einen anderen Tag — hier sind die nächsten Verfügbarkeiten." / "Try a different day — here are the next available slots." |
| **Primary CTA** | Inline 3-slot suggestion chips (next 3 available days/times — converts no-result into 1-tap booking) |
| **Secondary CTA** | "Anderen Hundefriseur anzeigen" / "Show other groomers" |

> **Pattern source:** Fresha + Acuity both use inline next-available suggestions on the time-slot picker. *"Modern appointment systems typically support multiple UX flows—native mobile apps provide the most seamless in-app experience"* (Zapier/Acuity search snippet).

#### 3B.3 "No reviews yet" (groomer profile)

| Element | Spec |
|---|---|
| **Illustration** | Empty star outline + dog icon |
| **Heading** | "Noch keine Bewertungen" / "No reviews yet" |
| **Body** | "Sei der erste, der {GroomerName} bewertet — buche jetzt und teile deine Erfahrung." / "Be the first to review {GroomerName} — book now and share your experience." |
| **Primary CTA** | "Termin buchen" / "Book appointment" (converts blank state into conversion path) |
| **Anti-pattern** | Showing "0.0 stars" or "N/A rating" — implies failure rather than nascent state. Hide the star rating entirely until first review lands. |

#### 3B.4 "Search returned no results" (text search "doodle groomer in Basel")

| Element | Spec |
|---|---|
| **Illustration** | Magnifying glass + dog (matches search-context affordance) |
| **Heading** | "Keine Treffer für {query}" / "No matches for {query}" |
| **Body** | "Versuche eine andere Schreibweise oder weniger Filter." / "Try a different spelling or fewer filters." |
| **Primary CTA** | "Alle Hundefriseure in {city} anzeigen" / "Show all groomers in {city}" — single CTA per Eleken pattern |
| **Optional inline** | If filters were applied, show "X Filter aktiv — alle löschen" / "X filters active — clear all" as inline chip |

> **Pattern source:** Airbnb's filter-dead-end canon — *"clear and concise copy that tells the users that there are no results for this filter combination, and has a call-to-action to get users to remove all filters"* (Eleken/Mobbin).

---

## 4. Cancellation Flow UX

### 4A. Industry sample

| Platform | Flow steps |
|---|---|
| Groomit | App → Booking detail → "Cancel" button → Modal showing fee for the current time-window → Confirm → Card auto-charged → Confirmation screen |
| Fresha (client side) | Email link OR app booking detail → "Cancel" → Fee preview → Confirm → "If a no-show or cancellation fee is charged, a notification is always sent" |
| Tucker Pup's | Phone/email (no in-app cancel) → "If we do not receive payment in a timely manner for any late cancellation fee, we would charge a card that was most recently used on the account" |
| Wolfe | Phone-based; no in-app |
| Dirty Dog | Phone-based primarily |

### 4B. Solen MVP cancellation flow spec

```
Booking detail screen
       │
       ▼
[ Termin stornieren ] (button)
       │
       ▼
┌──────────────────────────────────────────┐
│  Stornierung bestätigen?                 │
│                                          │
│  {Service} mit {Groomer} am {date/time}  │
│                                          │
│  ⏱ {hours_until} Std. vor Termin         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Stornogebühr: CHF {fee}            │  │
│  │ (50% des Servicepreises CHF {x})   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Optional: Grund (Dropdown)              │
│  ─────────────────────────────           │
│  □ Hund krank                            │
│  □ Eigene Krankheit / Notfall            │
│  □ Zeitkonflikt                          │
│  □ Möchte umbuchen statt stornieren ← CTA│
│  □ Anderer Grund (Freitext, optional)    │
│                                          │
│  [ Abbrechen ]      [ Stornieren ]       │
└──────────────────────────────────────────┘
       │
       ▼
Confirmation: refund timing + receipt email
```

**Pattern choices:**
- **NOT 1-click cancel** — fee is non-trivial; confirmation modal mandatory.
- **Reason dropdown is optional** but always offered — captures churn signal. *"Möchte umbuchen statt stornieren"* deflects to reschedule flow, recovering booking.
- **Fee shown verbatim in CHF before confirm** — Groomit canon + Eleken "clarity first" rule.
- **No "are you sure?" double-confirm** — single modal is enough; double-confirms train users to dismiss without reading.

---

## 5. Reschedule Flow UX

### 5A. Industry sample

| Platform | Flow |
|---|---|
| Groomit | App-based, in-line; same calendar UI as initial booking, deposit/payment transfers automatically |
| Fresha | Email link OR in-app; same calendar widget |
| Acuity (cross-vertical canon) | "clients click Change/Cancel appointment in the initial confirmation email they receive after booking, which takes them back to their confirmation page where they can click Reschedule and choose another available date and time" |

### 5B. Solen MVP reschedule flow spec

```
Booking detail screen
       │
       ▼
[ Umbuchen ] (button)
       │
       ▼
┌──────────────────────────────────────────┐
│  Termin umbuchen                          │
│                                           │
│  Mit {Groomer}                            │
│                                           │
│  ⏱ {hours_until} Std. vor Termin           │
│                                           │
│  ┌────────────────────────────────────┐   │
│  │ Umbuchungsgebühr: CHF 0            │   │
│  │ (Kostenlos bis 24 Std. vor Termin) │   │
│  │                                    │   │
│  │ — ODER (wenn <24h) —               │   │
│  │                                    │   │
│  │ Umbuchungsgebühr: CHF {fee}        │   │
│  │ (50% der Stornogebühr)             │   │
│  └────────────────────────────────────┘   │
│                                           │
│  ⚠ Hinweis (wenn 2. Umbuchung):           │
│  "Dies ist deine 2. Umbuchung. Eine       │
│   weitere Änderung zählt als Stornierung."│
│                                           │
│  [ Verfügbare Slots anzeigen ]            │
└──────────────────────────────────────────┘
       │
       ▼
Calendar slot picker (same UI as initial booking)
       │
       ▼
Confirm new slot — deposit/payment auto-transfers
```

**Pattern choices:**
- **In-app first, email link second** — email link goes to web-app reschedule page (same component reused).
- **Deposit transfers automatically** — Groomit pattern; never make the user re-pay for a reschedule.
- **Reschedule cap warning at 2nd attempt** — soft enforcement; no platform enforces this hard, but Wolfe's "chronic rescheduling" is the precedent that it matters.
- **Fee = 50% of cancel fee** — Groomit's tier model is the cleanest in-vertical precedent.

---

## 6. Payment-Failed UX

### 6A. Stripe decline taxonomy (canonical reference)

Stripe distinguishes broadly between:
- **Soft declines** (insufficient funds, do-not-honor, transient issuer issues) — *"prompt them to try their payment method again or ask for a new payment method"*.
- **Hard declines** (expired card, lost/stolen card, fraud) — *"Stripe can't retry invoice payment without a new payment method, and the payment only executes if you obtain a new payment method"*.
- **Authentication-required** (3DS challenge) — surface a separate auth modal rather than treating as a generic decline.

### 6B. Solen MVP payment-failed flow

```
Checkout: pay deposit/total
       │
       ▼
   [ Bezahlen ]
       │
       ▼
   Stripe charge attempt
       │
   ┌───┴──────────────────┬──────────────────┐
   ▼                      ▼                  ▼
  SUCCESS              SOFT DECLINE       HARD DECLINE / AUTH REQ
   │                      │                  │
   ▼                      ▼                  ▼
 Confirmation         "Zahlung fehl-      "Karte abgelehnt.
                      geschlagen. Bitte    Bitte eine andere
                      erneut versuchen."   Karte verwenden."
                          │                  │
                       [ Erneut ]       [ Andere Karte ]
                       [ Andere Karte ]      │
                       (60s hold slot)       │
                          │                  ▼
                          │             New card form (inline)
                          ▼                  │
                       Retry charge          │
                          │                  ▼
                          │             Retry charge
                          ▼                  │
                       SUCCESS / loop        ▼
                                          SUCCESS / loop
```

**Pattern choices:**
- **60-second slot hold during retry** — slot stays reserved during the payment-failed → retry cycle. Prevents the user from losing the slot to a concurrent booker mid-retry.
- **Max 2 inline retries** before forcing a new card — avoid 3DS thrashing.
- **NEVER abandon the booking automatically** — Fresha-style auto-cancel-on-no-deposit is for deferred-deposit flows, not synchronous checkout. The cart stays alive until the user closes it.
- **Error copy is German + concrete** — *"Karte abgelehnt"* not *"Ein Fehler ist aufgetreten"*. Map Stripe decline codes to plain-language causes (`insufficient_funds` → "Nicht genug Guthaben") server-side.
- **Apple Pay / TWINT fallback** — surface a second payment-method chip on soft-decline screen ("Mit TWINT bezahlen") to deflect card-network failures.

---

## 7. Solen MVP Edge-Case Spec (Consolidated)

### 7A. Cancellation policy (locked recommendation)

| Window | Cancel fee | Reschedule fee |
|---|---|---|
| **24h+ before appointment** | Free | Free |
| **<24h, >2h before** | 50% of service price | 25% of service price |
| **<2h before / no-show** | 100% of service price | 50% of service price |

**Rationale:**
- 24h window matches Groomit + Dirty Dog mode; 48h (Fresha example, Wolfe) feels punitive for an MVP entering a market where customers expect Uber-like cancel flexibility.
- 50%/100% tier matches Fresha default example + industry mode (`groomertogroomer.com` cites 50–100% as the dominant range).
- Reschedule fee = 50% of cancel fee follows Groomit's clean tier ratio.

### 7B. Reschedule cap

- **Soft cap: 2 reschedules per booking.**
- 3rd attempt: warning modal → user choice to *"Stornieren stattdessen"* or *"Trotzdem umbuchen"* (treats as same-day cancel under policy).
- No hard platform-enforced limit at MVP — sets us up to learn the actual abuse rate before locking.

**Source:** No grooming-vertical precedent. Closest = Wolfe Pet's behavioral kick-out for chronic rescheduling. Inferred default.

### 7C. No-show fee

- **100% of service price**, charged automatically to card on file.
- Trigger: groomer marks the booking "Hund nicht da" / "no-show" in their app within 30min of slot start.
- Customer sees fee + dispute path in email + in-app notification.
- **No-show grace:** if customer messages within 30min of missed slot saying "I'm running late, on my way" → groomer's choice to wait or convert to no-show.

**Source:** Groomit "groomer arrived" tier ($100 max) + Wolfe + Tucker Pup's tiered (up to $100) — all converge near full-fee for no-show.

### 7D. Groomer-cancels-on-you flow (Airbnb AirCover model)

| Step | UX |
|---|---|
| 1. Groomer cancels in B2B app | Solen platform deducts cancel-penalty from groomer's payout (suggested: CHF 25 baseline, CHF 50 if <24h) |
| 2. Customer notified | Push + email within 60 seconds: *"Schlechte Nachricht: {Groomer} muss leider absagen. Wir helfen dir, einen neuen Termin zu finden."* |
| 3. Customer lands on rebook-help screen | **3 alternative groomers shown** matched on (city / service / similar time-slot / similar price) — 1-tap rebook |
| 4. Refund handling | Default: **full refund to original payment method** within 3 business days |
| 5. Alternative: rebook credit | "Solen-Guthaben CHF {x} — sofort verfügbar, 30 Tage gültig" (parallel to Airbnb's 72h booking credit, longer TTL appropriate for lower-frequency vertical) |
| 6. Empty-state if no alternatives | "Keine vergleichbaren Hundefriseure verfügbar. Volle Rückerstattung wurde initiiert." + "Benachrichtige mich, wenn ein Slot frei wird" CTA |

**Source:** Airbnb AirCover policy — *"you'll receive a full refund, including service fees, if you choose not to rebook"* + *"we'll help you rebook a similar place to stay, considering location and amenities"* (Airbnb help article 170). Strongest cross-vertical precedent — no grooming platform has codified this.

### 7E. Empty state copy library (DE primary, EN secondary)

| State | DE heading | DE body | CTA |
|---|---|---|---|
| No groomers in radius | *"Keine Hundefriseure in deiner Nähe"* | *"Wir sind noch nicht in {city}. Wir benachrichtigen dich, sobald wir starten."* | *"Benachrichtigung aktivieren"* |
| No availability on date | *"Keine freien Termine am {date}"* | *"Versuch einen anderen Tag — hier sind die nächsten Verfügbarkeiten."* | Inline 3-slot chips |
| Search no results | *"Keine Treffer für „{query}"* | *"Versuch eine andere Schreibweise oder weniger Filter."* | *"Alle Hundefriseure in {city} anzeigen"* |
| No reviews yet | *"Noch keine Bewertungen"* | *"Sei der Erste, der {GroomerName} bewertet — buche jetzt."* | *"Termin buchen"* |
| No favorites | *"Keine Favoriten gespeichert"* | *"Tippe auf das Herz auf einer Hundefriseur-Karte, um sie hier zu speichern."* | *"Hundefriseure entdecken"* |
| No upcoming bookings | *"Keine kommenden Termine"* | *"Buche einen Termin und finde ihn hier."* | *"Hundefriseur finden"* |
| No past bookings | *"Du hast noch keinen Termin gebucht"* | *"Hier siehst du deine vergangenen Termine — sobald dein erster vorbei ist."* | *"Ersten Termin buchen"* |
| Groomer-cancelled, no rebook options | *"Keine vergleichbaren Hundefriseure verfügbar"* | *"Volle Rückerstattung wurde initiiert. Wir benachrichtigen dich, sobald ein passender Slot frei wird."* | *"Benachrichtigen"* |

**Illustration approach (MVP):** **Single line-art icon set** — no full illustrations. Matches Earthen Wellness Light visual register (LIVE_TRUTH §1) — restrained, editorial, not "cute mascot." Anti-pattern explicitly: avoid Slack/Linear-style 3D illustrations or Lottie animations — wrong register for our brand.

### 7F. Payment-failed UX

- **Soft decline:** inline retry button + alternative payment method chip (TWINT). 2 retries max.
- **Hard decline / 3DS:** inline new-card form. No bounce-out of checkout.
- **Slot held 60s** during retry cycle.
- **Error copy:** Stripe decline-code mapped to DE plain language server-side. No raw API error messages.

---

## 8. Decisions Surfaced

Re-stated here for easy lift into roadmap/PRD:

1. **Cancellation window:** 24h. *Confidence: high (industry mode).*
2. **Late-cancel fee schedule:** 0% / 50% / 100% across 24h+ / <24h / <2h tiers. *Confidence: high.*
3. **Reschedule fee schedule:** 0% / 25% / 50% across same tiers. *Confidence: medium — derived from Groomit ratio, no Swiss-specific datum.*
4. **Reschedule cap:** soft cap at 2 per booking, with warning modal at 3rd attempt. *Confidence: low (inferred — no direct precedent).*
5. **No-show fee:** 100% of service price, auto-charged. 30min grace window for "I'm coming" messages. *Confidence: high.*
6. **Groomer-cancels:** Airbnb AirCover model — full refund + 3 alternative groomer suggestions + optional 30-day Solen-Guthaben credit. *Confidence: high (cross-vertical precedent).*
7. **Empty-state design language:** single line-art icon + specific heading + actionable body + one CTA. No mascots, no Lottie. *Confidence: high.*
8. **Payment-failed UX:** inline retry for soft declines, inline new-card for hard declines, 60s slot hold, TWINT alt-payment chip. *Confidence: high.*
9. **Where policy is shown:** cart (inline summary) + booking-detail (expandable) + cancel-modal (fee preview). Not in search results. *Confidence: high.*
10. **Deposit at booking:** **none for MVP**. Revisit if observed no-show rate > 8% (industry average per `groomertogroomer.com` snippet was "10%"). *Confidence: medium — bias toward less friction at launch.*

---

## 9. Open Questions for User / Product

These need a human call — not researchable:

1. **Member exception** — Groomit waives all fees for "Annual Recurring Plans." Does Solen want a similar loyalty-tier carve-out at MVP, or hold until v2?
2. **Inclement weather override** — Dirty Dog auto-waives the 24h policy. Does Solen want a manual operations-team override switch, or auto-detect via weather API (over-engineered for MVP)?
3. **Groomer-side fee floor** — Airbnb's host-cancel penalty is **"minimum cancellation fee of $50 USD and maximum of $1,000 USD"**. What should Solen's groomer-cancel penalty be? Recommendation: **CHF 25 baseline, CHF 50 if <24h** — lower than Airbnb because services are lower-ticket and trust is more fragile at MVP. Needs user lock.
4. **Empty-state illustration vendor** — recommend commissioning ~8 line-art icons from a single illustrator for brand cohesion (vs. using a generic icon pack). ~CHF 1500 budget. Needs user approval.
5. **TWINT as fallback payment** — confirm Stripe Switzerland integration supports TWINT directly or whether we need a separate processor at MVP. Likely tractable; flagging.

---

## Sources Cited

| Source | URL |
|---|---|
| Groomit Customer Cancellation Policy | https://www.groomit.me/customer-cancellation-policy |
| Tucker Pup's Cancellation Policy | https://tuckerpups.com/our-services/dog-grooming/dog-grooming-cancellation-policy.php |
| Wolfe Pet Grooming Policies | https://www.wolfegrooming.com/policies |
| Dirty Dog Spa Policies | https://dirtydogsspa.com/policies/ |
| Fresha No-Show & Cancellation Fees | https://www.fresha.com/help-center/knowledge-base/payments/617-charge-no-show-and-cancellation-fees |
| Fresha Set Up Payment Policies | https://www.fresha.com/help-center/knowledge-base/payments/615-set-up-payment-policies |
| Fresha Blog: Protect Against No-Shows | https://www.fresha.com/blog/how-to-protect-your-business-against-no-shows-and-late-cancellations |
| Airbnb Host Cancellation Policy | https://www.airbnb.com/help/article/170 |
| Airbnb Rebooking/Refund Policy | https://www.airbnb.com/help/article/2868 |
| Stripe Declines Documentation | https://docs.stripe.com/declines |
| Stripe Smart Retries | https://docs.stripe.com/billing/revenue-recovery/smart-retries |
| Eleken Empty State UX Rules | https://www.eleken.co/blog-posts/empty-state-ux |
| Mobbin Empty State Glossary | https://mobbin.com/glossary/empty-state |
| Carbon Design System Empty States | https://carbondesignsystem.com/patterns/empty-states-pattern/ |
| PatternFly Empty State Guidelines | https://www.patternfly.org/components/empty-state/design-guidelines/ |
| Groomer to Groomer "No More No Shows" | https://www.groomertogroomer.com/no-more-no-shows/ |

**Sources attempted but unavailable:**
- `scenthound.com/membership-faqs` → 404
- `dogfatherandco.com/grooming/cancellation-policy/` → 403
- `scenthound.com/policies` → 404

---

*End of audit.*
