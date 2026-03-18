# 🛠️ Manual Steps — Roadmap v5

> These items require human intervention, API keys, or external service setup.
> Work through these TOGETHER with the user — not autonomous.

---

## 🔑 API Keys & Services Needed

### 1. seven.io (SMS Reminders) — Phase 7
- **What:** SMS gateway for booking reminders
- **Action:** Sign up at https://seven.io → get API key
- **Add to `.env.local`:**
  ```
  SEVEN_IO_API_KEY=your_key_here
  SEVEN_IO_SENDER=Solen
  ```
- **Cost:** ~CHF 0.07/SMS in Switzerland
- **Risk:** SMS costs add up. Track monthly spend. Consider max SMS budget.

### 2. Resend (Transactional Emails) — Phase 3, 7
- **What:** Email service for booking confirmations, review prompts, onboarding drip
- **Status:** Check if already in `.env.local` — may exist from previous roadmap
- **Action if missing:** Sign up at https://resend.com → get API key
  ```
  RESEND_API_KEY=re_xxxxx
  RESEND_FROM=noreply@solen.ch
  ```
- **Domain verification:** Must add DNS records for `solen.ch` to send from your domain

### 3. OpenAI or Google Gemini (AI Salon Info) — Phase 12
- **What:** Auto-generate salon descriptions from data
- **Action:** Add API key:
  ```
  OPENAI_API_KEY=sk-xxxxx
  # OR
  GEMINI_API_KEY=xxxxx
  ```
- **Risk:** AI costs per request. Cache results. Don't call on every page load.

---

## 📋 Legal Text Needed (Phase 4 + 11)

### 4. Impressum
You need to provide or we draft together:
- [ ] Company legal name (e.g., "Solen GmbH" or "Solen, Sulo Firstname Lastname")
- [ ] Registered address
- [ ] UID-Nummer (Unternehmens-Identifikationsnummer) — if registered
- [ ] Contact email
- [ ] Responsible person name
- [ ] Handelsregister entry (if applicable)

### 5. AGB (Allgemeine Geschäftsbedingungen)
Template structure I'll generate, but you need to decide:
- [ ] Cancellation policy (default: free cancel 24h before)
- [ ] Refund policy (when/how refunds work)
- [ ] Platform liability disclaimer
- [ ] Age restriction (18+? or 16+ with parental consent?)
- [ ] Dispute resolution mechanism
- **Recommendation:** Use a Swiss legal template service or consult a lawyer for final text

### 6. Datenschutzerklärung (Privacy Policy)
Need to specify:
- [ ] Data controller contact details
- [ ] Which data you collect (email, phone, booking history, location)
- [ ] Which third parties receive data (Stripe, Supabase, PostHog, seven.io, Resend)
- [ ] Data retention period
- [ ] Cookie list: which cookies, what for, how long
- **Recommendation:** generate via https://www.datenschutzgenerator.ch/ (free Swiss tool)

---

## 💳 Stripe Setup (Phase 9 + 14)

### 7. Stripe Connect — Deposits
- **Status:** Stripe Connect already configured
- **New:** Enable "auth + capture" for deposit mode:
  ```
  # In Stripe Dashboard → Settings → Payment intents
  # Enable: Separate auth and capture
  ```
- Test with test mode first!

### 8. Platform Commission — Stripe Application Fee
- **What:** Take 15% commission on each booking
- **How:** Use `application_fee_amount` on PaymentIntent or Transfer
- **Decision needed:** Commission percentage (default 15%)
- **Tax:** You may need to invoice salons for the commission (VAT)

---

## 🌐 Vercel Config (Phase 7)

### 9. Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" },
    { "path": "/api/cron/review-prompt", "schedule": "0 9 * * *" },
    { "path": "/api/cron/late-cancel", "schedule": "*/30 * * * *" }
  ]
}
```
- **Note:** Vercel Hobby plan = 1 cron job. Pro plan = unlimited. Check your plan.

---

## 🌍 Translation (Phase 8)

### 10. French + Italian Translations
- **Option A:** You provide translations (native speaker)
- **Option B:** Use DeepL/Google Translate for first draft, you review
- **Option C:** Hire a translator (recommended for legal pages)
- **Priority:** UI labels first (~200 strings), legal pages, then salon-facing text

---

## 📊 Service Category Seed Data (Phase 1)

### 11. Category Tree Content
Need to agree on the exact tree. Example:
```
Coiffeur
├── Damen
│   ├── Waschen & Schneiden
│   ├── Balayage
│   ├── Strähnen
│   ├── Coloration
│   ├── Föhnen & Styling
│   ├── Hochsteckfrisuren
│   └── Haarverlängerung
├── Herren
│   ├── Herrenhaarschnitt
│   ├── Fade
│   └── Bart trimmen
└── Kinder
    └── Kinderhaarschnitt

Nails
├── Maniküre
├── Pediküre
├── Gel Nägel
├── Acryl Nägel
└── Nail Art

Barbershop
├── Haarschnitt
├── Rasur
├── Bart Styling
└── Head Spa

Kosmetik
├── Gesichtsbehandlung
├── Microneedling
├── Chemical Peeling
├── HydraFacial
└── Wimpern & Brauen

Massage
├── Klassisch
├── Hot Stone
├── Thai
└── Sportmassage

Waxing
├── Ganzkörper
├── Beine
├── Bikini
└── Gesicht

Spa
├── Sauna
├── Dampfbad
└── Wellness-Paket
```
- **Action:** Review this tree, add/remove categories as needed
- **Must match:** Existing `services.category` values in DB

---

## 🔒 Supabase RLS Policies (All Phases)

### 12. New Table RLS
Every new table needs RLS policies. Claude Code should create them in migrations, but VERIFY:
- `service_categories` → public read, admin write
- `booking_waitlist` → user owns their own records
- `promo_codes` → public read (for validation), admin + salon owner write
- `referrals` → user owns their own records
- `user_credits` → user reads own, system writes
- `review_photos` → public read, review author writes
- `salon_groups` → public read, group owner writes
- `platform_settings` → admin only
- `salon_payouts` → salon owner reads own, system writes
