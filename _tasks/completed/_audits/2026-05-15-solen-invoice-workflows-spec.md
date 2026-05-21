# Solen Invoice Workflows — Spec

> **Date**: 2026-05-15
> **Scope**: KEY_FEATURES.md entries #62 (Invoice Generator) + #63 (Invoice Chaser)
> **Status**: Spec — not yet built
> **Inspiration**: Anthropic *Claude for Small Business* launch (2026-05-13); TikTok ref `vm.tiktok.com/ZNRGpn55F` — *"Invoice Chaser is the cleanest workflow to walk into any local business > 200k/year."*

---

## 1 · Problem statement

Solen currently treats every transaction as a **booking**. There's no separate `invoice` concept. That works for the 80% of salon revenue that flows through point-of-sale (booking → pays at chair via Stripe / cash). But the 20% high-margin revenue lives outside bookings entirely:

- Chair / booth rental → salon → freelance stylists (weekly / monthly recurring)
- Bridal / wedding packages → multi-installment, 4-figure tickets
- Corporate accounts → companies buying recurring employee perks
- Bulk gift cards B2B → companies buying employee Christmas gifts
- Subscription clients → monthly unlimited blow-dry, etc.
- Supplier invoices coming IN → salon owes wholesalers; needs visibility

Today salons leave Solen → open Bexio / FastBill → copy-paste data → make invoice → send it → manually chase late ones via email. The 11 PM chase email never gets sent — that's lost revenue.

**Competitive context**: Fresha / Treatwell / Booksy punt on this entirely. They tell salons "use external invoicing." That's our wedge.

---

## 2 · Two-feature scope

### #62 Invoice Generator (prerequisite primitive)

Create + send standalone (non-booking) invoices. PDF output. Swiss-VAT-ready. Stripe Connect pay-link embedded for one-click online payment.

### #63 Invoice Chaser (TikTok-named hero feature)

AI-personalized auto-escalating reminders on unpaid invoices. Day 3 / day 7 / day 14 / day 21 cadence, each message rewritten by Claude in the salon's tone of voice.

The two ship together. Generator is useless without chase; chase has nothing to chase without generator.

---

## 3 · User stories

### Salon owner (B2B billing)

- *As a salon owner, I want to create a one-off invoice for a chair-rental tenant so I can stop using Bexio for this.*
- *As a salon owner, I want a recurring invoice template for monthly chair rent so I don't have to make a new invoice every month. (→ feature #79 Recurring Invoices builds on this primitive — out of v1 scope.)*
- *As a salon owner, I want to send an invoice for a 4-stop bridal package with installments so I capture the deposit and milestone payments before the wedding.*
- *As a salon owner, I want unpaid invoices to chase themselves so I stop losing revenue at 11 PM.*
- *As a salon owner, I want the chase messages to sound like ME not a robot, because my clients are my friends.*

### Salon's customer (invoice recipient)

- *As a chair-rental tenant, I want a clean PDF invoice with the salon's branding so my accountant accepts it.*
- *As a corporate HR manager, I want one consolidated invoice for all my employees' November grooming, not 22 individual ones.*
- *As a bride, I want to see my deposit, milestone payments, and balance clearly with reminders before each is due.*

---

## 4 · Schema additions

New tables:

```sql
-- Core invoice object
create table invoices (
  id              uuid primary key default gen_random_uuid(),
  salon_id        uuid not null references salons(id) on delete cascade,
  invoice_number  text not null,           -- per-salon sequential: 2026-001, 2026-002…
  client_id       uuid references profiles(id), -- nullable: non-Solen client (raw recipient_*)
  recipient_name  text not null,
  recipient_email text not null,
  recipient_address jsonb,                  -- {street, city, postcode, country}
  status          invoice_status not null default 'draft',
  currency        text not null default 'CHF',
  subtotal_chf    numeric(10,2) not null,
  vat_rate        numeric(5,4) not null default 0.077, -- Swiss standard VAT 7.7%
  vat_amount_chf  numeric(10,2) not null,
  total_chf       numeric(10,2) not null,
  issue_date      date not null default current_date,
  due_date        date not null,
  paid_at         timestamptz,
  notes           text,
  pdf_url         text,                    -- generated on first send
  stripe_payment_link text,                -- nullable: only if pay-online enabled
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (salon_id, invoice_number)
);

create type invoice_status as enum (
  'draft',
  'sent',           -- emailed to recipient, no pay yet
  'viewed',         -- recipient opened the PDF link (tracked via email pixel)
  'partial',        -- multi-installment: some installments paid
  'paid',           -- fully paid (manually marked OR Stripe webhook)
  'overdue',        -- past due_date, unpaid
  'cancelled',
  'written_off'     -- abandoned after chase exhausted
);

-- Line items
create table invoice_line_items (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  position        int not null,             -- ordering (1, 2, 3…)
  description     text not null,
  quantity        numeric(8,2) not null default 1,
  unit_price_chf  numeric(10,2) not null,
  line_total_chf  numeric(10,2) not null,    -- quantity × unit_price
  vat_rate        numeric(5,4) not null     -- per-line for mixed-rate invoices
);

-- Chase events (audit trail for the Invoice Chaser workflow)
create table invoice_chase_events (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  step            int not null,             -- 1 (day-3) / 2 (day-7) / 3 (day-14) / 4 (day-21)
  sent_at         timestamptz not null default now(),
  channel         text not null,            -- 'email' / 'sms' / 'whatsapp'
  message_body    text not null,            -- the AI-generated message sent
  ai_personalization_context jsonb,         -- {salon_voice, client_history, …} for audit
  responded_at    timestamptz,
  outcome         text                      -- 'paid' / 'promise-to-pay' / 'dispute' / 'no-response'
);

-- Per-salon chase configuration
create table salon_invoice_settings (
  salon_id              uuid primary key references salons(id) on delete cascade,
  chase_enabled         boolean not null default true,
  chase_cadence_days    int[] not null default array[3, 7, 14, 21],
  chase_channel         text not null default 'email',  -- 'email' / 'sms' / 'whatsapp'
  chase_voice_sample    text,                            -- 1-2 paragraphs of owner's writing for AI tone-match
  vat_number            text,                            -- e.g. CHE-123.456.789 MWST
  invoice_footer        text,                            -- bank details, payment terms, etc.
  invoice_brand_color   text default '#1A8F5C',
  invoice_logo_url      text,
  default_due_days      int not null default 30,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
```

Indexes:

```sql
create index idx_invoices_salon_status on invoices(salon_id, status);
create index idx_invoices_due_date on invoices(due_date) where status in ('sent', 'viewed', 'overdue');
create index idx_chase_events_invoice on invoice_chase_events(invoice_id, step);
```

RLS:

```sql
-- Salons see only their own invoices
alter table invoices enable row level security;
create policy "salon owns invoices" on invoices
  for all using (salon_id in (select salon_id from staff_memberships where user_id = auth.uid()));

-- Recipients can view via signed magic-link URL (no auth required for clients)
-- Handled at API layer, not RLS — see §6 endpoints.
```

---

## 5 · UI surfaces

### Dashboard tab: `Rechnungen` (Invoices)

**Route**: `/dashboard/invoices`

**Tabs / filter chips**:
- Alle / Entwürfe / Versendet / Bezahlt / Überfällig
- Date range picker
- Search by recipient name or invoice number

**List view** (table):
| # | Empfänger | Betrag | Fällig | Status | Aktion |
|---|---|---|---|---|---|
| 2026-014 | Anna Müller | CHF 1'200 | 18.05.2026 | Versendet | View / Edit / Chase now |
| 2026-013 | Bank XYZ | CHF 660 | 30.04.2026 | **Überfällig 15 Tg** | Send chase / Mark paid |
| 2026-012 | Sarah Bridal | CHF 800 | — | Teilzahlung 1/3 | Send next reminder |

Overdue row has terracotta accent left-border (V3 palette).

**Bulk actions**: select multiple → "Send chase to all" / "Mark all paid" / "Export to CSV."

### Invoice detail page

**Route**: `/dashboard/invoices/[id]`

Layout:
- Header: invoice number, status pill, recipient
- Editable line items (CRUD on `invoice_line_items`)
- VAT auto-calc footer
- Right rail: chase history timeline (each `invoice_chase_events` row as a card)
- Actions: Send / Resend / Mark paid / Cancel / Edit chase config

### Public invoice view (recipient-facing)

**Route**: `/invoice/[signed-token]`

What the customer opens from the email:
- Clean branded PDF preview (matches `salon_invoice_settings.invoice_brand_color` + `invoice_logo_url`)
- Download PDF button
- **Pay online** button (Stripe Checkout link via Stripe Connect)
- "Mark as paid via bank transfer" → triggers salon-side confirmation flow

No login required. Token is HMAC-signed, expires after `due_date + 60 days`.

### Settings: `/dashboard/invoices/settings`

Configure:
- VAT number
- Default due days (7 / 14 / 30 / 60)
- Chase cadence (custom array of days)
- Chase channel
- **Voice sample** — paste 1-2 paragraphs of how the owner writes to clients ("Hoi Anna, danke für dein Vertrauen…"). Claude uses this to match tone in chase messages.
- Brand color + logo upload
- Invoice footer text (bank details, payment terms)

---

## 6 · API endpoints

```
POST   /api/invoices                    # create draft
GET    /api/invoices                    # list (with filters)
GET    /api/invoices/[id]               # detail
PATCH  /api/invoices/[id]               # edit
DELETE /api/invoices/[id]               # cancel
POST   /api/invoices/[id]/send          # generate PDF + email recipient + flip status to 'sent'
POST   /api/invoices/[id]/mark-paid     # manual mark-paid (e.g. bank transfer confirmation)
POST   /api/invoices/[id]/chase         # manual fire-chase (skips cadence)
GET    /api/invoice-public/[token]      # signed-URL public view (no auth)
POST   /api/invoice-public/[token]/pay  # creates Stripe Checkout session, redirects

POST   /api/cron/chase-invoices         # daily cron: iterate overdue invoices, fire next scheduled chase

GET    /api/invoice-settings            # salon settings
PATCH  /api/invoice-settings            # update
```

---

## 7 · Invoice Chaser workflow logic

### Daily cron `/api/cron/chase-invoices` (3 AM CET)

```typescript
// Pseudocode
for (const invoice of overdueInvoices()) {
  if (!invoice.salon.settings.chase_enabled) continue;

  const daysOverdue = differenceInDays(today, invoice.due_date);
  const cadence = invoice.salon.settings.chase_cadence_days; // [3, 7, 14, 21]
  const eventsSent = invoice.chase_events.length;

  const nextStepDay = cadence[eventsSent];
  if (!nextStepDay) {
    // Exhausted all chase steps → flag for handoff
    if (daysOverdue >= cadence[cadence.length - 1]) {
      await flagForOwnerReview(invoice);
    }
    continue;
  }

  if (daysOverdue >= nextStepDay) {
    const message = await generateChaseMessage({
      step: eventsSent + 1,
      daysOverdue,
      invoice,
      voiceSample: invoice.salon.settings.chase_voice_sample,
      clientHistory: await getClientHistory(invoice.client_id),
    });

    await sendVia(invoice.salon.settings.chase_channel, message);
    await logChaseEvent(invoice, eventsSent + 1, message);
  }
}
```

### Message generation prompt template (Claude)

```
You are writing a payment reminder in the voice of a salon owner.

Salon: {salon.name}, located in {salon.city}.
Owner voice sample (match this tone):
"""
{salon.settings.chase_voice_sample}
"""

Invoice context:
- Recipient: {invoice.recipient_name}
- Amount: CHF {invoice.total_chf}
- Issued: {invoice.issue_date}
- Due: {invoice.due_date}
- Days overdue: {daysOverdue}
- This is chase step {step} of {cadence.length}.

Tone by step:
- Step 1 (~day 3 overdue): FRIENDLY nudge. Assume oversight. One short paragraph.
- Step 2 (~day 7): POLITE follow-up. Reference the previous nudge.
- Step 3 (~day 14): FIRM. State consequences (late fees, service hold).
- Step 4 (~day 21): FINAL NOTICE. Concrete deadline + handoff warning.

Client relationship context (if available):
{clientHistory}

Constraints:
- German (or {salon.locale}).
- Max 80 words.
- Include the pay-link: {invoice.stripe_payment_link}
- NEVER threaten legal action. Step-4 max consequence is "wir geben den Fall extern weiter."
- NEVER apologize for chasing — owners deserve to be paid.
- Mention salon name once, recipient name once.

Output the message body only. No subject line.
```

---

## 8 · MVP scope (v1)

**In scope:**
- Manual invoice creation (one-off, single-installment)
- PDF generation (Swiss-VAT-ready)
- Email send via Resend
- Stripe Connect pay-link
- Auto-chase cron (4 steps, AI-personalized)
- Salon invoice settings (voice sample, cadence, brand)
- Public invoice view (recipient-facing, no-auth)
- Mark-as-paid (manual + Stripe webhook)
- Dashboard list + detail + settings pages

**Explicitly OUT of scope (v2+):**
- Recurring invoices (#79)
- Multi-installment bridal packages (#82)
- Supplier bill tracking (#80)
- Corporate consolidated billing (#81)
- Bulk gift card B2B (#83)
- Multi-currency
- Multi-language invoice templates (v1 = DE only)
- Custom VAT rates per line (v1 = single rate from settings)
- Quote-to-invoice conversion
- Invoice templates marketplace

---

## 9 · Implementation phases

| Phase | Scope | Effort | Blocker for next |
|---|---|---|---|
| **1A** | Schema migration + RLS | 4 hrs | Yes |
| **1B** | Invoice CRUD API endpoints | 8 hrs | Yes |
| **1C** | Dashboard list + detail UI | 12 hrs | No |
| **1D** | PDF generation (Puppeteer / @react-pdf) + branding | 6 hrs | Send step needs this |
| **1E** | Email send (Resend) + public view route | 6 hrs | Send step needs this |
| **1F** | Stripe Connect pay-link + webhook | 6 hrs | Pay-online needs this |
| **2A** | Settings page (voice sample, cadence) | 6 hrs | Chaser needs this |
| **2B** | Daily chase cron + AI message generation | 8 hrs | — |
| **2C** | Chase event log + dashboard timeline | 4 hrs | — |

**Total**: ~60 hrs (≈ 1.5 weeks solo focused work).

---

## 10 · Pricing thought (Solen monetization angle)

Per TikTok: freelancers install Invoice Chaser for $1500 install + $500/month retainer for SMBs. Solen's positioning is **the opposite** — built-in for every salon, NOT an upsell.

Options:
- **Free**: all salons get Invoice Generator + Chaser, no upsell. Differentiator vs Fresha/Treatwell that don't have it at all. Pricing pressure on competitors.
- **Tiered**: free up to 10 invoices/month, then CHF 19/mo Pro plan.
- **Per-invoice**: 1% of invoice amount, capped at CHF 5 per invoice. Aligns Solen revenue with salon revenue.

**Recommendation**: FREE in v1 to drive adoption + lock salons into Solen's ecosystem. Monetize via Phase 6+ extensions (Recurring / Corporate / Bridal) once habit is formed.

---

## 11 · Differentiator summary

| | Solen | Fresha | Treatwell | Bexio |
|---|---|---|---|---|
| Booking-tied invoices (point-of-sale) | ✓ | ✓ | ✓ | — |
| Non-booking invoices (chair rental, etc) | **✓** | — | — | ✓ |
| AI-personalized chase | **✓** | — | — | — |
| Swiss VAT-ready PDF | **✓** | — | — | ✓ |
| Stripe Connect online pay | **✓** | ✓ | ✓ | ✓ |
| Bound to salon's booking + client data | **✓** | partial | partial | — |
| Voice-matched chase messages | **✓** | — | — | — |

The first column is the v1 wedge: combining salon-native booking platform with first-class invoicing + AI chase. Nobody else does this end-to-end.

---

## 12 · Open decisions for build phase

1. **PDF library**: `@react-pdf/renderer` (React-native) vs Puppeteer (HTML → PDF). React-PDF gives better Swiss formatting control; Puppeteer is faster to iterate styling.
2. **Chase channel**: email-only v1 vs include SMS/WhatsApp from start? Recommend email-only v1, add SMS in v1.5.
3. **Voice sample**: how to coax salon owners into writing one? Onboarding modal? Auto-extract from their existing DM history if available?
4. **Mark-as-paid via bank transfer**: salon-side notification flow? Auto-detect from incoming Stripe → bank → Solen webhook?
5. **Invoice number format**: per-salon sequential `2026-001` vs global UUID-derived? Recommend per-salon for human-readability.
