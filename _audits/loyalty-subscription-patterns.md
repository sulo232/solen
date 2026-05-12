# Loyalty & Subscription Patterns — Solen Abo v2 Prep

**Phase 0.20 — Pivot research (Solen → dog-grooming)**
**Date:** 2026-05-13
**Author:** Claude (Opus 4.7)
**Scope:** Scenthound (subscription wellness), Groomit (recurring booking), Fresha (gift cards + loyalty), Chewy Autoship (pet-retail recurring), industry benchmarks
**Status:** Research input — feeds Solen Abo v2 schema design + Phase 3 customer surfaces.

> All `quoted text` is a verbatim extract from the source. Anything labeled `[inferred]` is the author's synthesis, not a quote. Anything labeled `[gap]` means the public surface didn't expose that detail and it needs a salesperson call / sandbox account to confirm.

---

## 1. Per-platform inventory

| Platform | Model | Recurring revenue % | Cadence | Discount mechanic | Cancellation friction | Referral |
|---|---|---|---|---|---|---|
| **Scenthound** | Tiered monthly membership (3 tiers, $39 / $49 / $65) | `[inferred]` 60-80% of revenue — `subscription-first model creates stickier unit economics than transactional grooming` | Once-per-month visits + à la carte add-ons (Unlimited tier allows multiple visits) | Member pays flat fee; non-member pays per-visit; members get **`25% discount on additional services`** | `no long-term contract and can be canceled anytime` | Care Club Members invite **`up to three friends`**; referee gets **`free Basic Hygiene package`**; referrer gets `[gap — not disclosed]` |
| **Groomit** (mobile US grooming) | Pay-as-you-go recurring OR Prepaid recurring | `[gap]` not disclosed | `weekly, bi-weekly, or monthly` (FAQ); Gold tier shows `$114 → $97` | **`Save up to 30%`** with recurring; **`Save up to 20%`** (FAQ); Prepaid = `Price locked, Pay upfront & save, Unused visits refundable` | `Free cancellation or rescheduling 24+ hours before service time` | `[gap]` |
| **Fresha** (marketplace SaaS) | No platform-wide subscription; merchants run own loyalty/referrals/gift cards | n/a (Fresha sells *tools* not memberships) | Merchant-configured (points-per-booking, points-per-spend) | Loyalty points = `100 points = $1 off` example sliding-scale; up to 5 tiers | n/a | Referrer earns `once the referred friend has completed their first appointment`; referee earns `as soon as they book`; can cap referrals (e.g. `5 per month`); `Marketplace New Client Fees are not applied when a new client books their first appointment using a referral link` |
| **Chewy Autoship** (pet retail) | Recurring product shipments | **`83.3% of net sales`** fiscal 2025 (`$10.4971 billion`); `84% in Q3 2025` | `every 2 weeks to every 24 weeks` | First Autoship order: **`35% off, max $20`**; recurring: **`5% off`** standard, **`10% off`** premium brands; **free ship over $49**; **stacks with sales** | `Pause, modify, or cancel anytime from your account dashboard or the Chewy app — no cancellation fees or retention calls`; change up to `48 hours before next order` | `[gap]` not core to Autoship product |

**Read of the table:**

1. **Chewy is the retention gold standard** — 83% of net sales on recurring, frictionless modification, no retention calls. The "no phone call to cancel" is itself a retention mechanic because it builds the trust to *enroll* in the first place.
2. **Scenthound is the closest analog to Solen** (services not products, tiered pricing, franchise-distributed) but their membership data is mostly franchise FDD redacted. AUV of `$452,732` per location (2024) means a single Scenthound averages 7-15 Swiss-equivalent CHF·MRR streams' worth of customers — a useful sizing anchor.
3. **Fresha doesn't sell its own subscription** — its loyalty/referral/gift-card tools are *configured by the salon*. This means Solen Abo, if shipped, would parallel a *Scenthound model on a Fresha-style marketplace*, which is a category nobody currently occupies.
4. **Groomit's prepaid model** (`Pay upfront & save, Unused visits refundable`) is the most consumer-friendly variant — refundability removes the lock-in objection.

---

## 2. Subscription tier structures (deep dive)

### 2.1 Scenthound — three-tier wellness ladder

Verbatim from search synthesis (quotes are platform-pulled but condensed across pages):

- **Escentials** — `$39 a month` — `bath, nail trimming, ear cleaning, and teeth brushing`. 1 visit/month implicit.
- **Escentials Plus** — `$49 a month` — `bath, nail grinding, ear cleaning, teeth brushing, and 24/7 access to a virtual vet`. Nail *grinding* (premium) vs trimming; vet telehealth as a tier differentiator.
- **Unlimited** — `$65 a month` — `all of the services in the Escentials Plus membership, but the dog can come in as many times as the member wants each month`.

Plus universal:
- `Every membership includes the Basic Hygiene Package, a wellness check, and 25% off any additional services`
- `Pricing and available tiers may differ depending on your local Scenthound location` (franchise-flex)

**Key design moves:**

1. **The $39 → $49 jump (+25%) buys a service upgrade (grinding) + a digital add-on (telehealth).** The $49 → $65 jump (+33%) buys *frequency*. This is textbook: low tier = entry, mid = "I want the best version of the service," top = "I want as much as I can use."
2. **No "annual" pricing** — month-to-month only. They're trading off some retention for the marketing line `no long-term contract and can be canceled anytime`.
3. **25% off à la carte across all tiers** is a soft non-member surcharge. A non-member pays 100%; a member pays 75% for the same add-on. The `[gap — surcharge amount on the bath itself]` is unpublished and likely franchise-variable.
4. **No published "annual prepay" or "lifetime"** — the model is pure MRR.
5. **Tier upgrade/downgrade rules:** `[gap]` — no public docs. Inferred: likely free anytime, since cancellation is free.

### 2.2 Industry tier-count consensus

From `dog grooming membership pricing strategy` search:

- `Some businesses offer unlimited grooming memberships for $45 per month`
- `Memberships may cover unlimited Bath & Care visits while Mini Grooming and Full Grooming are charged separately, with members receiving 20% off additional services`
- `Hybrid approach... pay a flat fee on top of unlimited bathing for monthly grooming or get a discount on grooming`

The pattern across 5+ US grooming-membership operators (Groom & Goods, Barksuds, DogHeartGrooming, Dingo, etc.): **2-3 tiers is the sweet spot.** 4+ tiers introduce decision paralysis; 1 tier doesn't capture the high-frequency willingness-to-pay.

---

## 3. Cadence patterns

### 3.1 Real-world cadence offered

| Cadence | Who offers | Use case |
|---|---|---|
| Weekly | Groomit (FAQ mentions `weekly`); Chewy (food refill) | Dogs with heavy shedding / commercial kennels |
| Every 2 weeks | Chewy default-low | High-consumption foods / treats |
| Every 4 weeks ("monthly") | Scenthound (de facto), Groomit, most US grooming subs | **Industry default for grooming** |
| Every 6 weeks | DogHeart, Barksuds tier options | Medium-coat breeds |
| Every 8 weeks | Scenthound `[inferred — Escentials with stretched intervals]`; Groomit | Light-coat / low-maintenance |
| Every 12 weeks | Groomit (FAQ); some Fresha-merchant configs | Wash-only / nail-trim cadence |
| Every 16-24 weeks | Chewy (slow-consumption products) | Not relevant for grooming |

### 3.2 Industry benchmark

From `dog grooming subscription churn` search:
> `The average time between repeat grooming visits ranges from 4 to 8 weeks, depending heavily on the pet's breed, coat type, and the services provided.`

**Therefore for Solen v2:** the default cadence offer must be **4-8 weeks** with per-pet override. A "monthly" framing is misleading for non-shedding breeds — better framing is "every 4 weeks" / "every 6 weeks" / "every 8 weeks" as picker options.

### 3.3 Cadence change UX (Chewy gold standard)

Verbatim:
> `Set deliveries anywhere from every 2 weeks to every 24 weeks, with easy skips, accelerations, or pauses when life changes — no phone calls required.`
> `To change how often your Autoship arrives, click the "Change" link in the Frequency section. Choose your preferred frequency from the dropdown menu. Updating your frequency will not affect the date of your next order.`

Three-action surface for any recurring item:
1. **Skip Order** — one-tap delay (rolls to next date)
2. **Change frequency** — dropdown, takes effect *after next order* (no surprise reschedule)
3. **Change next order date** — pick new date up to `48 hours before` current scheduled

This is the pattern Solen Abo v2 should copy verbatim.

---

## 4. Pricing strategy — % discount vs included-services vs flat-with-add-on

Three archetypes:

### 4.1 % discount on services (Chewy, Groomit prepaid)
- Customer pays per service; recurring earns 5-10% (Chewy) or up to 30% (Groomit prepaid).
- **Pro:** Easy to explain, lets customer self-select services per visit.
- **Con:** Doesn't lock in MRR — customer can skip indefinitely. Lower predictability for operator.
- **Best for:** Retail (Chewy) where consumption is steady. Less ideal for services.

### 4.2 Flat monthly with services included (Scenthound, most US grooming memberships)
- Customer pays $X/mo, gets pre-defined service bundle.
- **Pro:** Predictable MRR. Operator can plan capacity. Customer feels "value locked in."
- **Con:** Customer either over-uses (Unlimited tier risk) or under-uses (`unused visits` problem). Need rollover policy or "use it or lose it."
- **Best for:** Services with predictable cadence. **The Solen Abo v2 fit.**

### 4.3 Lower monthly + paid add-ons (Scenthound Escentials)
- Customer pays $39/mo for basic hygiene only; full grooming is extra (at 25% member discount).
- **Pro:** Lowest entry price → highest funnel conversion. Operator captures upsell.
- **Con:** Customer can feel nickel-and-dimed if add-ons are constantly upsold.
- **Best for:** Entry tier of a multi-tier ladder.

**Recommendation for Solen v2 — hybrid of 4.2 + 4.3:**
- Entry tier: flat-monthly with low-friction service (bath + nails + ears).
- Premium tier: flat-monthly with full grooming included (every 4-8 weeks).
- Both: 20-25% discount on à la carte add-ons (cologne, paw treatment, breed-specific styling).

---

## 5. Churn-prevention UX

### 5.1 The hierarchy of friction (industry consensus)

Per `subscription churn prevention pause vs cancel UX dark patterns retention`:
> `58% of people have paused a subscription instead of canceling in the past year. 79% of consumers say they want the option to pause a subscription when deciding whether to sign up`
> `The sweet spot sits between 35-60% pause-to-reactivation rates, which is where pause functionality pays for itself in retained LTV.`

Cancellation flow in retention-priority order:
1. **Skip this period** (one-tap, no questions)
2. **Change cadence** (e.g. monthly → every 8 weeks)
3. **Downgrade tier** (Plus → Basic)
4. **Pause** (define resume date; auto-resume in 30/60/90 days)
5. **Cancel** (final)

Each step should be a peer (radio-button) — not progressive disclosure that hides cancel behind 5 screens. The FTC `Click-to-Cancel rule... mandates symmetry between signup and cancellation processes` — Uber was sued for 23-screen cancel flows. Solen Abo must match this in Switzerland (no equivalent rule yet, but FINMA/SECO consumer protection trending similar; **Swiss UWG Art. 8 already forbids unfair contract terms**).

### 5.2 Chewy's explicit no-retention-call promise
> `Pause, modify, or cancel anytime from your account dashboard or the Chewy app — no cancellation fees or retention calls.`

This *itself* is a marketing line. Saying "easy to cancel" up-front lowers enrollment friction.

### 5.3 Groomit's refundability angle
> Prepaid: `Auto-scheduled, Price locked, Pay upfront & save, Unused visits refundable`

Refundable prepaid = annual prepay without the lock-in. Strong consumer-friendliness signal. **Consider for a Solen "Jahresabo" tier with prorated refund.**

### 5.4 Scenthound's contract-free framing
> `no long-term contract and can be canceled anytime`

Month-to-month is the floor. Anything stricter (12-month contracts) is anti-pattern for Swiss B2C in 2026.

---

## 6. Referral programs

### 6.1 Scenthound — invite-3-friends model

> `Care Club Members to use the Scenthound app to invite up to three friends to try the Basic Hygiene package for free.`
> Referee receives `a complimentary Basic Hygiene package, which includes a bath, ear cleaning, nail trim, and teeth brushing, completely free of charge`
> Referrer reward = `[gap]` (not publicly disclosed — possibly nothing, or perks visible only in-app)

**Critique:** One-sided incentive (referee-only). This is unusual — most modern programs are dual-sided. `[inferred]` Scenthound treats the referral as a marketing channel where the referrer's "reward" is intrinsic ("share something you love"). Risky bet — Dropbox-style dual-sided (`give X get X`) consistently outperforms.

### 6.2 Fresha — dual-sided + configurable

> `Clients can earn multiple rewards for referring friends, while each referred friend receives a single reward on their first booking`
> Referrer earns `once the referred friend has completed their first appointment`
> Referee earns `as soon as they book`
> Caps: `set a limit (For example, 5 per month)`
> `Marketplace New Client Fees are not applied when a new client books their first appointment using a referral link`

**This is the model to copy.** Notable details:
- **Asymmetric timing:** referee gets reward at *booking* (instant gratification, drives conversion); referrer gets reward at *completion* (filters out no-show/cancellation gaming).
- **Cap = abuse prevention.** 5/month is sane.
- **Fee-waiver for marketplace** is the Fresha-specific killer feature — they don't charge the salon the new-client fee on a referral. Solen analog: waive the platform commission on first-booking-via-referral, share the savings as a referrer/referee discount.

### 6.3 Solen v2 referral recommendation

**CHF 10 off both sides, referee triggers at booking, referrer triggers at completion of referee's first visit.**

Rationale:
- CHF 10 is the price-point sweet spot — enough to matter on a CHF 90-130 grooming visit (~8-11% off) but not enough to game.
- Asymmetric trigger prevents fraud (book + cancel + collect = no payout).
- Both-sides incentive aligns with Fresha pattern and global B2C norm.
- **Cap at 5/month per referrer** matches Fresha default — write into the schema from day 1.

---

## 7. Gift card UX (Fresha pattern)

### 7.1 Configuration model
> `If you're signed up to Fresha, it takes just minutes to create and offer a range of gift cards, all with customisation options that let clients add a personal touch.`
> `When setting up gift cards on Fresha, you have the option to enter the monetary value of the gift card`
> `Offer them at plenty of different price points so clients can buy one that best fits their budget` → **custom denominations, not preset tiers.**

### 7.2 Sales channels
> `You can sell gift cards online or in-store, with easy set up, management, and redemption tracking. Clients can choose to buy gift cards without booking a service.`

Key: **gift cards are a standalone purchase**, not bundled with a booking. This means:
- The buyer doesn't need to commit to a date or service.
- It's a pure gifting / TPV-padding feature.
- Redemption is a payment method at checkout (treated like a credit balance).

### 7.3 Detail surface

`[gap — Fresha sandbox required to fully reverse-engineer]`. Inferred from search and standard SaaS:
- Buyer enters: amount, recipient name, recipient email, optional message, optional delivery date.
- Recipient gets: email with a code or PDF voucher.
- Recipient applies code at checkout or in-cart, balance decrements per visit.
- Operator sees: gift card revenue (deferred liability until redemption).

### 7.4 Solen v2 gift card recommendation

**Minimum viable v2:**
- CHF amount-entry (no preset denominations — match Fresha).
- Recipient email delivery; PDF voucher (printable for in-person gifting).
- Optional schedule send (e.g. send on recipient's birthday).
- Apply at booking checkout; persists as account credit if amount exceeds visit price.
- Operator dashboard shows outstanding gift card liability (CHF amount, count).

**Schema impact (next section):** `gift_cards` table with `code, denomination, balance, purchaser_user_id, recipient_email, salon_id (nullable — Solen-wide vs per-salon), expires_at`.

---

## 8. Solen Abo v2 spec draft

### 8.1 Tier proposal

**Recommendation: 2-tier launch, with a 3rd tier reserved for V3 if Phase 3 metrics support it.**

Two-tier rationale: matches industry consensus (3+ tiers = decision paralysis), simplifies Phase 3 schema, and lets the team learn before expanding the ladder.

| Tier | Price (CHF/mo) | Cadence | Included | Add-on discount |
|---|---|---|---|---|
| **Solen Basic** | CHF 39 | Every 4-8 weeks (configurable per pet) | Bad + Krallenkürzen + Ohrenreinigung | 20% off à la carte |
| **Solen Plus** | CHF 79 | Every 4-8 weeks (configurable per pet) | Bad + Krallenkürzen + Ohrenreinigung + Vollverwöhnpaket (Schur/Trimm + Pfotenpflege) every 2 months | 25% off à la carte |

`[inferred]` pricing anchored on Zurich market data: full grooming CHF 90-180. Solen Basic at CHF 39/mo positions as "the routine hygiene tier" (well below a single full visit). Solen Plus at CHF 79/mo undercuts a single full grooming + bath but bundles it monthly + recurring discount — easy LTV math for the customer.

**Per-visit floor for non-members:** keep visible per-salon pricing; member tier is a discount + bundle, not a paywall. (Matches Scenthound's open-to-non-members posture.)

### 8.2 Cadence config

Per `[pet]` (not per subscription — important for multi-dog households):
- Pet 1 → "every 4 weeks" (high-coat breed)
- Pet 2 → "every 8 weeks" (smooth-coat breed)
- Both billed under one Abo.

UI: dropdown on each pet card showing **4 / 6 / 8 weeks**. Default 6 weeks. Hidden options 10 / 12 weeks for very-low-maintenance breeds.

### 8.3 Churn-prevention surface

In account → "My Abo," radio-button choices (NOT progressive disclosure):
- **Skip this month** (one tap; rolls billing 1 cycle; service still bookable per-visit during skip)
- **Change cadence** (4 / 6 / 8 weeks)
- **Downgrade** (Plus → Basic, takes effect next billing)
- **Pause** (define resume month; auto-resume up to 90 days)
- **Cancel** (clear cancel button — `Click-to-Cancel`-compatible)

Modal copy on cancel: "You'll lose the 20-25% à la carte discount. Are you sure?" — soft persuasion only, never blocked. **No retention call. No hidden screens.**

### 8.4 Referral

- Both sides earn **CHF 10 credit**.
- Referee earns at booking confirmation; referrer earns when referee completes first visit.
- Cap: 5 successful referrals per referrer per calendar month.
- Code-based: share code or magic link (`solen.ch/r/MARIA42`).

### 8.5 First-month trial

**Recommendation: 50% off first month, NOT free.**

Free trials in service-businesses underperform (`[inferred]` from Chewy's choice of `35% off max $20` rather than free trial — they trust paid friction to filter intent). Free attracts gamers / no-shows. 50% off:
- Filters to people with real intent to pay.
- Still meaningfully cheaper than a single per-visit booking.
- Creates a CHF 19.50 (Basic) / CHF 39.50 (Plus) anchor — psychologically "I already paid, I should use it."

Show pricing as "Erster Monat CHF 19.50 (statt CHF 39)" with crossed-through original. Convert pricing display to standard from month 2.

### 8.6 Gift cards

Phase 3 — implement after Abo v2 ships. The Abo is a higher-MRR-leverage feature; gift cards are a TPV-padding feature.

When implemented, follow §7.4 above.

### 8.7 Schema requirements

```sql
-- subscriptions table
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  tier text check (tier in ('basic', 'plus')) not null,
  status text check (status in ('trial', 'active', 'paused', 'cancelled')) not null default 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at timestamptz, -- soft cancel at end of period
  paused_until timestamptz, -- auto-resume on this date
  stripe_subscription_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- per-pet cadence override
create table pet_subscription_config (
  pet_id uuid references pets(id),
  subscription_id uuid references subscriptions(id),
  cadence_weeks int check (cadence_weeks in (4, 6, 8, 10, 12)) not null default 6,
  next_scheduled_at timestamptz,
  primary key (pet_id, subscription_id)
);

-- bookings link to subscription
alter table bookings add column subscription_id uuid references subscriptions(id);
alter table bookings add column counts_toward_abo boolean default false;
-- counts_toward_abo distinguishes Abo-included visits from à la carte upsells

-- referrals
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references users(id),
  referee_user_id uuid references users(id), -- nullable until referee signs up
  referee_email text, -- pre-signup
  code text unique not null, -- e.g. MARIA42
  referee_first_booking_id uuid references bookings(id),
  referee_first_booking_completed_at timestamptz,
  referrer_credit_amount numeric(10,2),
  referee_credit_amount numeric(10,2),
  referrer_credited_at timestamptz,
  referee_credited_at timestamptz,
  created_at timestamptz default now()
);

-- gift cards (Phase 3, deferred)
create table gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  denomination_chf numeric(10,2) not null,
  balance_chf numeric(10,2) not null,
  purchaser_user_id uuid references users(id),
  recipient_email text,
  recipient_name text,
  message text,
  salon_id uuid references salons(id), -- nullable = Solen-wide
  expires_at timestamptz, -- recommend 5y to match Swiss law
  created_at timestamptz default now(),
  redeemed_at timestamptz
);

create table gift_card_redemptions (
  gift_card_id uuid references gift_cards(id),
  booking_id uuid references bookings(id),
  amount_chf numeric(10,2) not null,
  created_at timestamptz default now()
);
```

**RLS:** subscriptions readable only by owner + salon staff for upcoming-bookings views. Referrals readable only by referrer (referee sees their code but not the redemption record). Gift cards readable by holder + redeeming salon at checkout.

**Stripe:** use Stripe Subscriptions for `subscriptions` table; `pause_collection` API for the Pause action; `cancel_at_period_end` for soft cancel. Mirror state via webhook.

---

## 9. Decisions to surface (v2 lock items)

### 9.1 Tier count: 2 / 3 / 4?
- **Recommendation: 2** (Basic + Plus). 3rd tier (Unlimited / Premium) reserved for v3 once cadence data shows demand for "as many visits as possible" — currently no signal that demand exists at CHF price points (Swiss visits are CHF 90+, not Scenthound's $35-50 USD — capacity economics fundamentally different).
- **Counter:** 3 tiers gives more anchor-pricing flexibility (`good / better / best`). Acceptable if the team has bandwidth.

### 9.2 Pricing strategy: % off vs flat-included?
- **Recommendation: flat-included with à la carte discount stacked on top.** Customer mental model is "I'm paying CHF 39 for routine care, and anything extra is 20% off." Easier to market than pure-% which feels like a coupon book.

### 9.3 First-month trial: free / 50% / no-trial?
- **Recommendation: 50% off** (per §8.5). Free trial filters too low; no-trial loses the conversion lift.
- **Counter:** Free trial with a credit-card-on-file is the SaaS-standard. Swiss consumers more friction-averse to CC-required free trials. 50% feels fair and removes the trial-abuse pattern.

### 9.4 Schema-aware in Phase 3 (yes) vs schema-aware in v2 (defer entirely)?
- **Recommendation: schema-aware in Phase 3** — but ship the `subscriptions` and `pet_subscription_config` migrations early in Phase 3 (Tier 1 customer surfaces include `/profile/subscription`). Defer `gift_cards` to Phase 4.
- Rationale: subscriptions need to exist before bookings can link to them (`booking.subscription_id`). Referrals can ship in Phase 3 since they're independent. Gift cards are isolated and can wait.

### 9.5 Open questions that need user input
- **Does Solen want to allow the franchise/salon to set its own tier prices** (Scenthound franchise-flex model) or **enforce platform-wide pricing** (single-brand model)?
- **Annual prepay option (`Solen Jahresabo`, e.g. 11 months for 12) — yes / no for v2?** Recommendation: no in v2, add in v3 once monthly retention curve is measured.
- **Group plans (multiple dogs per household at a price break) — flat single-pet pricing or per-pet?** Recommendation: per-pet pricing with a 10% "second pet" discount on the same subscription. Schema supports this via `pet_subscription_config` joined to a single `subscription_id`.

---

## 10. Industry benchmarks worth landing in the spec

- **Service-grooming subscription churn target:** **3-5% monthly** (`Full-time membership churn sits at an estimated 3% monthly, while flexi pass holders show higher attrition near 7% monthly`).
- **First-time customer retention without subscription:** `60-70%` (`Pet grooming salons typically lose 30-40% of clients after just one appointment`).
- **Average inter-visit interval:** **4-8 weeks** (use as Solen default cadence range).
- **LTV:CAC target:** **3:1** minimum (`a 3:1 ratio is the standard benchmark for sustainable growth`).
- **Pet services market 2026:** `USD 32.13 billion, growing... 2031 projections USD 47.61 billion, growing at 8.18% CAGR`.
- **Recurring as % of revenue (gold standard):** Chewy's **83%** is the target ceiling. `[inferred]` realistic Solen Year-1 target: 30% of bookings tied to an Abo by month 12.
- **Pause-vs-cancel reactivation rate (target):** **35-60%** (`sweet spot... where pause functionality pays for itself in retained LTV`).
- **Consumer signal on pause:** **79%** want a pause option at signup — make the pause path *visible* in the signup flow (e.g. footnote: "Pause anytime — keep your spot, skip the bill").

---

## 11. Anti-patterns to avoid

| Anti-pattern | Source | Solen v2 rule |
|---|---|---|
| 23-screen cancellation flow (Uber case) | FTC suit April 2025 | Cancel = 2 taps max. One confirm modal. Done. |
| Hiding cancel behind "pause" promotion (FTC "infinite loop" complaint) | FTC | Pause and Cancel are peer options on the same screen. Not progressive disclosure. |
| Free trial requiring auto-renewing CC | General SaaS pattern | 50% off month 1, no auto-conversion to higher price until customer sees clear receipt. |
| One-sided referral (Scenthound) | Scenthound model | Both sides earn (Fresha model). |
| Tiered annual contracts with cancellation fees | Old gym-membership pattern | Month-to-month only. No cancellation fees. |
| Service "rollover" indefinitely | Gym membership | Unused Abo cycle = lost (Skip is the alternative). State this clearly. |
| Gift cards expire < 5 years | Swiss law (OR Art. 128 — 10-year claim limit; consumer-protection norm 5y) | Gift cards valid 5 years minimum. |
| Hiding tier price differences | Some grooming sites | Pricing transparent on `/abo` page. No "call for pricing." |

---

## 12. What this audit doesn't cover (deferred)

- **Stripe integration mechanics** (webhooks, dunning emails, failed-payment retry cadence) — separate audit in Phase 3.
- **Sandbox-level Fresha gift card flow** (exact merchant config screens) — needs Fresha account, deferred until Solen partners with a Fresha-using salon willing to demo.
- **Scenthound app referral mechanics** (in-app friend-search, link-share) — needs app install + screenshots, deferred.
- **Swiss-specific consumer protection requirements** (UWG Art. 8, OR Art. 128, FINMA cross-border-payment) — needs legal review before Abo launch.
- **Tax treatment of CHF 10 referral credit** (taxable income to referrer? VAT impact?) — needs Treuhänder review.
- **Group / multi-pet pricing math** (10% second-pet discount sustainability) — finance modeling task, not pattern research.

---

## 13. Source links

### Subscription / loyalty patterns
- [Why Join Scenthound's Monthly Membership](https://www.scenthound.com/why-membership)
- [Scenthound Stuart pricing and subscription details (Facebook)](https://www.facebook.com/groups/345946310109548/posts/1446666626704172/)
- [Wellness-Focused Dog Grooming FAQs | Scenthound](https://www.scenthound.com/faqs)
- [Scenthound Referral Program](https://www.scenthound.com/dogblog/referral-program-invite-friends-free-basic-hygiene)
- [Scenthound Pricing & Franchise Guide](https://www.franchiseba.com/meet-scenthound-a-nationwide-pet-franchise-that-is-rapidly-gaining-attention/)
- [Scenthound Round Rock — Community Impact](https://communityimpact.com/sponsored/sponsored/2024/01/07/scenthound-provides-affordable-routine-hygiene-and-wellness-care-for-happy-healthy-dogs-in-round-rock/)
- [Groomit recurring booking](https://groomit.me)
- [Fresha — Client Loyalty Overview](https://www.fresha.com/help-center/knowledge-base/clients/563-client-loyalty-overview)
- [Fresha — Set up and manage Client loyalty points](https://www.fresha.com/help-center/knowledge-base/clients/565-set-up-and-manage-client-loyalty-points)
- [Fresha — Loyalty Referrals](https://www.fresha.com/help-center/knowledge-base/clients/604-set-up-and-manage-client-loyalty-referrals)
- [Fresha — Set up gift cards](https://www.fresha.com/help-center/knowledge-base/gift-cards/72-set-up-gift-cards)
- [Fresha — How to create and sell salon gift cards](https://www.fresha.com/blog/how-to-sell-salon-gift-cards)
- [Fresha — Loyalty tiers](https://www.fresha.com/help-center/knowledge-base/clients/569-set-up-and-manage-loyalty-tiers)

### Chewy Autoship
- [Autoship & Save - Free shipping | Chewy](https://www.chewy.com/b/autoship-save-15682)
- [Autoship Terms (USA) | Chewy USA](https://www.chewy.com/app/content/ans-terms)
- [Chewy's Autoship Customer Sales Reached 83.3% of Net Sales in Fiscal 2025 — Subscription Insider](https://www.subscriptioninsider.com/article-type/news/chewys-autoship-customer-sales-reached-83-3-of-net-sales-in-fiscal-2025)
- [Is Autoship the Secret Behind Chewy's Customer Retention Success? — Yahoo](https://finance.yahoo.com/news/autoship-secret-behind-chewys-customer-131000800.html)
- [Chewy (CHWY) Q3 2025 Results — IndexBox](https://www.indexbox.io/blog/chewy-q3-2025-earnings-revenue-profit-beat-estimates-margins-expand/)
- [How to Cancel Autoship on Chewy — ResizeMyImg](https://resizemyimg.com/blog/how-to-cancel-autoship-on-chewy-step-by-step-guide-with-screenshots-and-tips/)
- [Is Chewy Autoship Worth It? Real Savings & Perks — Groupon](https://www.groupon.com/coupons/blog/chewy-autoship-review-savings-guide)

### Industry benchmarks
- [Pet Grooming Salon: Customer Retention Rate — BusinessDojo](https://dojobusiness.com/blogs/news/pet-grooming-salon-customer-retention)
- [mobile pet grooming KPIs and financial milestones — businessplansuite](https://businessplansuite.com/blogs/metrics/mobile-pet-grooming)
- [Grooming Client Retention: 8 Strategies — Teddy](https://tryteddy.com/blog/grooming-client-retention-8-strategies-that-actually-work)
- [Pet Grooming Membership App — Subport](https://subport.us/blog/pet-groomers-membership-and-subscription-mobile-app)
- [7 Dog Daycare KPIs — financialmodelslab](https://financialmodelslab.com/blogs/kpi-metrics/dog-daycare)
- [Pet Service Market Analysis — Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/pet-service-market)
- [Membership vs. One-on-One Pricing Models — Savvy Groomer](https://www.savvygroomer.com/blog/membership-vs-one-on-one-pricing-models)
- [How to Choose the Best Dog Grooming Membership — Bowie Barker](https://www.bowiebarker.com/blog/how-to-choose-the-best-dog-grooming-membership)
- [Pawfinity Subscriptions For Pet Service Business](https://www.pawfinity.com/features/subscriptions-and-memberships-for-pet-business/)

### Scenthound franchise / unit economics
- [Scenthound Franchise Analysis — Franzy](https://franzy.com/franchises/scenthound)
- [Scenthound Franchise Cost 2026 — FranchiseInvestorData](https://franchiseinvestordata.com/franchise/scenthound)
- [Scenthound Franchise Costs, Fees, Profit — 1851 Franchise](https://1851franchise.com/scenthound-franchise-costs-fees-profit-and-data-2730438)
- [Scenthound FDD Talk 2023 — Franchise Chatter](https://www.franchisechatter.com/2023/02/17/fdd-talk-scenthound-franchise-costs-fees-average-revenues-and-or-profits-2023-review/)
- [Scenthound Franchise Review 2025 — Franchise Chatter](https://www.franchisechatter.com/2025/06/27/scenthound-franchise-review-2025-costs-fees-news-average-revenues-and-or-profits/)
- [Scenthound Franchise FDD, Profits & Costs (2025) — SHARPSHEETS](https://sharpsheets.io/blog/scenthound-franchise-fdd-profits-costs/)

### Churn / pause UX
- [PAUSE vs CANCEL — RecRevOps](https://recrevops.com/p/pause-vs-cancel-the-decision-that-saves-churning-subscribers)
- [UX for Subscription Services — Rubyroid](https://rubyroidlabs.com/blog/2025/11/ux-for-subscription-services/)
- [How to Reduce Subscription Churn — SubWise](https://usesubwise.app/blog/reduce-subscription-churn-retention-tactics)
- [Subscription Cancellation Dark Patterns — Empire Stats](https://empirestats.net/2026/02/25/subscription-cancellation-dark-patterns/)
- [The Power Of Pause — Chargebee](https://www.chargebee.com/blog/power-of-pause-subscription-retention-strategy/)
- [Pause Subscription: A Powerful Retention Tactic — Recurly](https://recurly.com/blog/why-pausing-a-subscription-can-be-a-powerful-retention-tactic/)

### Swiss market reference
- [Dog grooming in Zurich — Amazing Zurich](https://www.amazingzurich.com/best-dog-grooming-in-zurich/)
- [Hot Dog Grooming GmbH Zurich](https://www.hotdoggrooming.ch/)
- [Hunde-Wellness Mobile Grooming](https://www.hunde-wellness.ch/en/)
- [Happy Dog Day Spa](https://happydogdayspa.ch/en/dog-and-cat-grooming/)
