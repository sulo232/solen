# Competitor Analysis: Fresha vs Treatwell-Pro

> For Solen Pro (B2B salon SaaS) v1 positioning. Dated 2026-05-26.
> All claims cited inline. "Unverified" tag where source was thin.

---

## TL;DR — what Solen should learn / beat

1. **The "Fresha is free" mythology is OUT-OF-DATE.** In 2025 Fresha shifted to paid subscription: **CHF 18.95/mo Independent or CHF 12.95/team member/mo Team** (Fresha CH pricing page). Plus **20% commission with CHF 5 minimum on new marketplace clients**. Plus **1.29% + CHF 0.21 per card transaction**. Solen should not position against a "free" Fresha — that's no longer the real competitive set.

2. **Treatwell is structurally MORE EXPENSIVE than Fresha** in Switzerland: **CHF 49/mo Starter + CHF 199 one-time setup fee + 35% commission on new clients + 2.5% online prepayment fee**. Their pitch is marketplace volume (half a million daily searchers EU-wide). Solen can win on price/transparency.

3. **Neither has a native desktop app.** Both are web-app + mobile-iOS/Android. Fresha is web-only on desktop with no Mac/Windows installer; users emulate via Bluestacks or wrap with WebCatalog (Source: webcatalog.io). Treatwell explicitly says "no matter which plan you choose you won't need to install any software on your computer" (treatwell.nl). This is a **major opening** if Solen ships even a thin Electron wrapper.

4. **Fresha's web admin is the polished benchmark.** Left vertical sidebar (12 icons: Home/Calendar/Sales/Reviews/Catalogue/Clients/Marketing/Payments/Team/Reports/Apps/Settings), purple accent, dark sidebar on white canvas, day/week calendar that occupies 90% of screen real estate, persistent "Complete Setup %" CTA in top nav. Onboarding-first design.

5. **Onboarding split: Fresha = self-serve + KYC, Treatwell = sales-led demo.** Treatwell explicitly offers "a free consultation and demo that has a maximum duration of 25 minutes with no obligation" and salespeople "own the full sales journey from generating, pitching and closing deals to onboarding new partners" ([Built In job posting](https://builtin.com/job/sales-manager/3180904)). Fresha lets you create the account online and complete KYC asynchronously ([Fresha help center](https://www.fresha.com/help-center/academy/launch-your-workspace/getting-started/lessons/8)). Solen should pick a lane consciously.

---

## Fresha

### Pricing model

Per [Fresha CH pricing page](https://www.fresha.com/pricing) (extracted 2026-05-26):

| Tier | Price |
|---|---|
| Independent (single bookable person) | **CHF 18.95/mo** |
| Team (multi-person) | **CHF 12.95/team member/mo** |
| Enterprise (20+ team members) | Custom |

**Payment processing:** "1.29% + CHF 0.21 per transaction" (online + in-person). Manual entry "2.20% + CHF 0.20". Tap-to-pay "+ CHF 0.10 per authorization". Terminal device: CHF 119.

**Marketplace commission:** "20% one-time commission" on new clients from Fresha marketplace, "Minimum fee of CHF 5 per client". **"No fee ever applies to your returning clients."**

**Messaging:** "20 free messages per team member" monthly then pay-as-you-go. Marketing email: "50 free monthly then CHF 0.02 per email."

**Add-ons (extra cost):** Client Loyalty, Google Rating Boost, Team Connect, Insights, Xero integration, Data Connector — "CHF 3.40–CHF 295 per location."

Pricing **changed in 2025** from fully free → paid base. [The Salon Business review (2026)](https://thesalonbusiness.com/fresha-review/) confirms the shift; [Pabau blog comparison](https://pabau.com/blog/fresha-pricing/) confirms 2026.

### Web admin — IA + key screens

From Mobbin screenshots (curated 2024-2025):

- **Left vertical sidebar, ~64px wide, dark indigo near-black, with white logo "fresha" at top.** Icons (top→bottom): Home, Calendar, Sales tag, Smile/Reviews, Book/Catalogue, Person/Clients, Megaphone/Marketing, Card/Payments, Team-group, Trending/Reports, Grid/Apps, Settings cog.
- **Top bar (white, ~56px):** workspace selector dropdown (left), staff filter dropdown, date navigator (`< Today >  Tuesday 13 Aug 2024`), display settings cog, "Waitlist" pill, "Day/Week" toggle, **dark "Add" button (top-right, primary CTA)**.
- **Calendar:** dominates ~85% of the canvas. Staff columns with circular avatar + name at column header. Time grid with 15-min slots. Booked slots = light blue rectangles with `time · client · service`. Walk-ins styled differently. Red "now" line. Appointment-click opens right-hand panel: client info + services + Total + **black Checkout button** as primary action.
- **Persistent purple pill in top-right "Complete Setup ↑%"** — gamified onboarding visible from day 1. Stays until 100%.
- **Home dashboard:** 4-tile grid — "Recent sales" (line+bar chart, last 7 days), "Upcoming appointments" (bar chart), "Appointments activity" (list with prices), "Today's next appointments" (list with prices). Plus "Top services" / "Top team member" tables below.
- **Reports module:** dedicated section with 52 reports, organized by Sales/Finance/Appointments/Team/Clients/Inventory. Premium-locked reports gated behind add-on.

Design language: **Bright purple/indigo accent (#7C5CFC-ish), generous whitespace, large iconography, no animations, density: medium-low.** Aesthetic = SaaS-clean, not Linear-dark.

Sources: Mobbin curated Fresha web screens — [Calendar empty state](https://mobbin.com/screens/1b3c5a4b-5f4e-4825-a1c1-a3534bdeeec8), [Calendar with bookings](https://mobbin.com/screens/f8925220-1238-43a1-ac64-1b45d649ee86), [Appointment detail panel](https://mobbin.com/screens/d3db698e-97e8-4d4d-9b73-455649ae15df), [Week view](https://mobbin.com/screens/9f7ecd8c-0ed4-46bf-b8dc-cad3b4f7ddf6), [Home/dashboard](https://mobbin.com/screens/654fa2f5-948e-4d69-aeed-32725e8102bd), [Reports module](https://mobbin.com/screens/c0cab3b4-b8c6-4e05-ae1d-1db826ac86a7).

### Mobile merchant app — "Fresha for business"

iOS + Android. Per [App Store listing](https://apps.apple.com/us/app/fresha-for-business/id1455346253): **v2.8.7659, updated within last 24h (frequent updates), 4.8★ on 3.5K ratings, free.**

Description verbatim: "Join Fresha (formerly Shedul), the world's top-rated booking platform for beauty and wellness. Trusted by 120,000 businesses like yours worldwide, with over 18 million appointments booked every month."

Priorities (in order): **appointment calendar → payment processing (tap-to-pay on phone) → client communication → marketing/marketplace**. Same features as web, smaller density, mobile-optimized calendar.

### Desktop app

**No native desktop app. Browser-only.** Confirmed via [Fresha download page](https://www.fresha.com/download-app) which only lists iOS + Android. Users wanting "an app feel" install via:
- [WebCatalog wrapper](https://webcatalog.io/en/apps/fresha-for-business) (third-party Chromium wrapper for Mac/Windows)
- Android emulators (Bluestacks etc) — community workarounds

**This is the gap.** No first-party Electron/native. Desktop = browser.

### Onboarding

**Self-serve, KYC-deferred.** Per [Fresha academy getting-started lesson](https://www.fresha.com/help-center/academy/launch-your-workspace/getting-started/lessons/8): account creation is online, then setup checklist (gamified — "Complete Setup 60%" pill in top nav) walks owner through: business profile → services → team members → working hours → online booking → payments KYC (Veriff identity verification with passport + address) → marketplace listing.

Time-to-first-booking: typically **same day** for non-payment features; payments KYC adds 1–3 days. No sales rep required. Free 14-day trial referenced in third-party reviews; exact mechanics unverified.

### Marketplace vs SaaS framing

**Marketplace and SaaS pitched equally — but marketplace is the monetization wedge.** The marketing site ([fresha.com/for-business](https://www.fresha.com/for-business)) leads with "Salon Software / Spa Software / Scheduling Software" SEO. The marketplace is the moat (consumer side has 18M monthly bookings per their own claim) but only **20% one-time on new clients** — incumbent rate. The shift to paid subscription in 2025 means Fresha is no longer monetizing purely on consumer card processing + commission; they now extract from both sides.

### Screenshots (Mobbin URLs)

- [Calendar day view](https://mobbin.com/screens/1b3c5a4b-5f4e-4825-a1c1-a3534bdeeec8)
- [Calendar with bookings](https://mobbin.com/screens/f8925220-1238-43a1-ac64-1b45d649ee86)
- [Week view](https://mobbin.com/screens/9f7ecd8c-0ed4-46bf-b8dc-cad3b4f7ddf6)
- [Add appointment + checkout panel](https://mobbin.com/screens/d3db698e-97e8-4d4d-9b73-455649ae15df)
- [Client profile + service select](https://mobbin.com/screens/b3031d03-35a8-43cc-8850-8aad4c98854d)
- [Home dashboard](https://mobbin.com/screens/654fa2f5-948e-4d69-aeed-32725e8102bd)
- [Reports & analytics module](https://mobbin.com/screens/c0cab3b4-b8c6-4e05-ae1d-1db826ac86a7)
- [News/welcome panel](https://mobbin.com/screens/4dd88077-6536-4fca-9c01-827f78c056ef)
- [Cancellation flow](https://mobbin.com/screens/ca75f186-bfd1-4368-bf23-82b3e0fba834)
- [Set-as-no-show flow](https://mobbin.com/screens/14d65e9e-4469-46a0-a483-8e95091c397b)

---

## Treatwell-Pro (Treatwell Connect)

### Pricing model

**Two product lines:**
- **Treatwell Connect** = native salon software (calendar/POS/CRM) bundled with marketplace listing
- **Treatwell Pro** = same marketplace listing but allows salons to keep their existing salon software (integration) — per [Treatwell Pro integrated softwares page](https://www.treatwell.co.uk/partners/integrated-softwares/)

Names sometimes used interchangeably in marketing.

**Switzerland pricing** ([treatwell.ch/partners/preise](https://www.treatwell.ch/partners/preise/)):

| Tier | Price |
|---|---|
| Connect **Starter** | **CHF 49/mo** (monthly) |
| Connect **Advanced** | Higher (price not surfaced on partial page extract — unverified exact CHF) |
| **One-time setup fee** | **CHF 199** when paying monthly |
| Annual billing | Discounted (mechanics unverified) |

**Commission:** "35% new client commission applies to clients introduced via the Treatwell marketplace" ([treatwell.nl pricing](https://www.treatwell.nl/en/partners/pricing/)). **"0% commission for repeat marketplace bookings"** ([treatwell.ch](https://www.treatwell.ch/partners/preise/)).

**Online prepayment fee:** "2.5% Gebühr für Online-Vorauszahlungen" (2.5% online prepayment fee). UK page says 2.5% ([treatwell.co.uk pricing](https://www.treatwell.co.uk/partners/pricing/)); NL page says 2%; CH page says 2.5% — **regional variance**.

**Effective cost on a CHF 100 new-client booking** ([DoTheBeauty calculator](https://www.dothebeauty.com/blog/treatwell-cost-hidden-fees)): 35% commission + 20% VAT-on-commission = **42% of gross**. Plus 2.5% prepayment if online. That's roughly CHF 44/100 booking gone — vs Fresha's CHF 5–20/100 on the equivalent new-client booking.

[Setora blog](https://www.setora.co.uk/blog/treatwell-vs-setora-commission-cost-breakdown) characterizes the all-in load: "the 35% commission becomes 42% of the booking value, and if the booking is prepaid online, the payment fee adds another 3%."

### Web admin — IA + key screens

**Cloud-based, browser-only.** Per Treatwell NL pricing page: **"Cloud-based software, so no matter which plan you choose you won't need to install any software on your computer"** — explicit anti-desktop positioning.

**Mobbin coverage is THIN.** I queried "Treatwell" both platforms and Mobbin returned zero direct Treatwell screens (search fell through to Fresha + unrelated apps). This is itself a finding: **Treatwell's UI doesn't have the design-community visibility Fresha's does**, suggesting either less recent UX investment or weaker marketing presence in design circles.

What's documented in software-review aggregators ([Capterra](https://www.capterra.com/p/181827/Treatwell/), [SoftwareAdvice](https://www.softwareadvice.com/retail/treatwell-connect-profile/reviews/), [GetApp](https://www.getapp.com/retail-consumer-services-software/a/treatwell/)):
- Standard SaaS calendar + CRM + POS + reports
- Less polished than Fresha per qualitative review notes — multiple "buggy" / "constant tech issues" complaints in [SoftwareAdvice reviews](https://www.softwareadvice.com/retail/treatwell-connect-profile/reviews/)
- Recent migration from Treatwell Connect → Treatwell Pro caused user frustration; "some users feel the newer Treatwell Pro app is more expensive than the original version and represents a step backward"

### Mobile merchant app — "Treatwell Pro (for Business)"

iOS + Android. Per [App Store listing](https://apps.apple.com/gb/app/treatwell-pro-for-business/id1582612088):
- **v2.22, last updated August 8, 2023** (note: ~2.5 years stale, vs Fresha which updates daily)
- **3.5★ on 70 ratings**

Description verbatim: "Specifically tailored for hair and beauty businesses, the Treatwell Pro app is a quick and efficient way to manage your business on the move."

Features per listing:
- "Quick appointment scheduling for new, existing, and walk-in customers"
- "Scan and redeem Treatwell eVouchers using your phone's camera"
- "Confirm bookings from Treatwell customers"
- "Update treatment menu and pricing (tablet only)"
- "Access end-of-day reports and previous booking lists (tablet only)"

**Tablet-only restrictions** on menu/pricing/reports = phone is browse + accept-booking primarily. Less capable than Fresha mobile.

### Desktop app

**No native desktop app.** Explicit positioning: "no matter which plan you choose you won't need to install any software on your computer" ([Treatwell NL pricing](https://www.treatwell.nl/en/partners/pricing/)). Same status as Fresha — both are browser-on-desktop.

### Onboarding

**Sales-led.** Per [Built In Treatwell Sales Manager job description](https://builtin.com/job/sales-manager/3180904): salespeople "own the full sales journey from generating, pitching and closing deals to onboarding new partners, including hosting digital sales demos with prospective partners."

The partner landing page CTA is **"Start for free"** which then routes to **"Select a time slot for a quick catch-up with our team"** (per [treatwell.co.uk/partners](https://www.treatwell.co.uk/partners/)) — i.e. self-serve sign-up exists but is funnelled into a sales demo. Compare with Fresha which lets you complete most of setup without ever speaking to a human.

Time-to-first-booking: **slower than Fresha** because demo + setup-call is the default path. The trade-off: salesperson-assisted onboarding has higher activation rates for less-technical salon owners.

### Marketplace vs SaaS framing

**Marketplace-led.** Treatwell positions itself first as "Europe's No.1 marketplace" with "150,000 salons across Europe" and "Half a million customers search for appointments on Treatwell every single day" ([treatwell.co.uk/partners](https://www.treatwell.co.uk/partners/)). Software (Connect) is the secondary pitch.

This is the inverse of Fresha — Fresha leads with "salon software" SEO, marketplace second. Treatwell leads with "marketplace audience," software second.

**Implication for the salon:** Treatwell's 35% commission is the price of marketplace acquisition. Fresha's 20% is cheaper per new client but Fresha's marketplace is less of a brand-recognized destination for European consumers than Treatwell.com is (especially UK, FR, BE, NL).

### Screenshots (Mobbin URLs)

**None available.** Mobbin does not index Treatwell's salon-facing UI as of 2026-05-26. This is itself a competitive datapoint — Treatwell's UX is less referenced by the design community.

---

## Side-by-side comparison

| Dimension | Fresha | Treatwell-Pro |
|---|---|---|
| **Base subscription (CH)** | CHF 18.95/mo Independent · CHF 12.95/mo per team member | CHF 49/mo Starter (Advanced higher, unverified exact) |
| **Setup fee** | None | **CHF 199 one-time** (when monthly billing) |
| **New-client commission** | **20%** (min CHF 5) | **35%** (+ VAT in EU markets) |
| **Repeat-client commission** | 0% | 0% |
| **Payment processing** | 1.29% + CHF 0.21 / tx | Not directly Treatwell's — depends on integration. 2.5% on Treatwell-collected online prepayments only. |
| **Native desktop app** | **No** (web + iOS + Android) | **No** (explicitly cloud-only) |
| **Mobile merchant app** | iOS + Android, 4.8★, daily updates, full feature parity | iOS + Android, 3.5★, last update Aug 2023 (stale), tablet-only for some features |
| **Onboarding** | Self-serve + async KYC | Sales-led demo (25-min call) before setup |
| **Marketplace size** | 18M monthly bookings globally, US-strong | 150K salons EU, 500K daily consumer searches, UK/EU-strong |
| **Marketplace vs SaaS lead** | SaaS first, marketplace second | Marketplace first, SaaS second |
| **Geographic strength** | Global, English-first | Europe — UK / NL / FR / DE / ES / IT / IE / **CH** |
| **Design polish** | High (Mobbin-curated, frequent updates, modern stack) | Lower (no Mobbin coverage, mixed reviews, slow mobile updates) |
| **Mobbin screen coverage** | 15+ curated screens | Zero |
| **Free trial** | Reportedly 14 days (unverified mechanics in 2025+) | "Start for free" but routes to sales demo |
| **Data ownership** | Standard SaaS terms | Explicit: "Die Daten sind und bleiben Ihr Eigentum" ([treatwell.ch](https://www.treatwell.ch/partners/preise/)) |

---

## Implications for Solen Pro

1. **Price under Treatwell, transparent under Fresha.** Treatwell at CHF 49/mo + CHF 199 setup + 35% commission is the high-cost ceiling Swiss salons grumble about. Fresha at CHF 18.95/mo + 20% commission is the new floor. Solen Pro can land at **CHF 0–29/mo + lower or no commission on direct bookings** and own the price story. The "transparent pricing — no setup fee, no commission on your own clients" angle writes itself.

2. **Desktop app is the unclaimed lane.** Both incumbents are browser-only on desktop. A salon owner running 8 hours/day on a fixed reception screen wants an icon in the dock, not a Chrome tab they accidentally close. **Even a thin Electron wrapper** with Solen branding, native notifications, and offline-capable calendar caching would be the only "desktop app for your salon" pitch in the market. This is concrete differentiation, not a feature war.

3. **Mobile parity is table stakes, not edge.** Fresha's app gets daily updates and 4.8★; Treatwell's is 2.5 years stale. Solen needs a credible mobile merchant app, but it doesn't need to out-feature Fresha — it needs to **match feature parity + leverage native iOS/Android features Fresha skips** (e.g. iOS widgets for next appointment, Apple Watch glance, deep iPad pencil annotation on consultation forms — none of these are in Fresha's app per Mobbin coverage).

4. **Self-serve onboarding is the right default for Solen.** Fresha proves it works; Treatwell proves sales-led has friction. Solen's existing 40+ dashboard pages are an asset — design the gamified-setup-progress meter (like Fresha's purple pill) on top of those pages, instrument the activation funnel. Sales-led can be reserved for chains / multi-location accounts.

5. **Sidebar IA is convergent — copy the pattern, win on the contents.** Both incumbents use left-vertical sidebar + top contextual bar + dominant calendar canvas. Solen should NOT invent a novel IA — that's wasted differentiation budget. The win is in the contents: **fewer screens (12+ in Fresha is a lot for a small salon owner), faster load, clearer copy.** Solen's 40+ dashboard pages should be audited for collapsing into a Fresha-sized 10–12 nav slots.

6. **Marketplace is a longer-game lever Solen can defer.** Both Fresha and Treatwell took ~10 years to build their consumer-side audience. Solen Pro v1 should pitch as **"the software, your direct bookings, your domain"** — the marketplace pitch can come later when there's salon density.

---

## Appendix — primary sources

- **Fresha CH pricing:** [fresha.com/pricing](https://www.fresha.com/pricing) (extracted 2026-05-26)
- **Fresha features:** [fresha.com/for-business/features](https://www.fresha.com/for-business/features)
- **Fresha download:** [fresha.com/download-app](https://www.fresha.com/download-app)
- **Fresha for business app:** [App Store](https://apps.apple.com/us/app/fresha-for-business/id1455346253)
- **Fresha getting started:** [help-center academy lesson 8](https://www.fresha.com/help-center/academy/launch-your-workspace/getting-started/lessons/8)
- **Treatwell CH pricing:** [treatwell.ch/partners/preise](https://www.treatwell.ch/partners/preise/)
- **Treatwell NL pricing:** [treatwell.nl/en/partners/pricing](https://www.treatwell.nl/en/partners/pricing/)
- **Treatwell UK pricing:** [treatwell.co.uk/partners/pricing](https://www.treatwell.co.uk/partners/pricing/)
- **Treatwell UK partners landing:** [treatwell.co.uk/partners](https://www.treatwell.co.uk/partners/)
- **Treatwell Pro app:** [App Store UK](https://apps.apple.com/gb/app/treatwell-pro-for-business/id1582612088)
- **Treatwell business app info:** [treatwell.co.uk/business-info/treatwell-app](https://www.treatwell.co.uk/business-info/treatwell-app/)
- **Treatwell sales-led onboarding evidence:** [Built In Sales Manager job](https://builtin.com/job/sales-manager/3180904)
- **Third-party Fresha review:** [The Salon Business 2026 review](https://thesalonbusiness.com/fresha-review/), [Pabau 2026 comparison](https://pabau.com/blog/fresha-pricing/)
- **Third-party Treatwell cost analysis:** [DoTheBeauty 2026 blog](https://www.dothebeauty.com/blog/treatwell-cost-hidden-fees), [Setora comparison](https://www.setora.co.uk/blog/treatwell-vs-setora-commission-cost-breakdown)
- **Fresha web admin screens:** [Mobbin Fresha web index](https://mobbin.com/) — 15+ screens curated 2024-2025
- **Fresha mobile merchant screens:** [Mobbin Fresha iOS index](https://mobbin.com/) — 10+ screens curated 2024-2025
