# 🧑 Solen.ch Feature Mega-Build — MANUAL STEPS (Detailed)

> **Complete ALL manual steps before starting the Claude Code roadmap.**
> Each step has screenshots-worth of detail. Check off each box when done.

---

## Manual Step A: Stripe Connect Setup (Sandbox/Test Mode)

> You're currently in a Stripe Sandbox. That's correct — sandbox is the right place to build and test Connect before going live. Here's exactly what to do next.

---

### A.1 — Get Your Sandbox API Keys

- [ ] **A.1.1** You should already be in your Sandbox at [dashboard.stripe.com](https://dashboard.stripe.com). You'll see a banner or label saying "Sandbox" or "Test mode" at the top.
- [ ] **A.1.2** Go to **Developers** (left sidebar) → **API keys**
- [ ] **A.1.3** You'll see two keys:
  - **Publishable key**: Starts with `pk_test_...` — this goes in your frontend
  - **Secret key**: Starts with `sk_test_...` — this goes in your `.env.local` and Vercel
- [ ] **A.1.4** Click "Reveal test key" on the Secret key and copy both. Save them somewhere safe temporarily.
- [ ] **A.1.5** Add them to your project's `.env.local`:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXX
  STRIPE_SECRET_KEY=sk_test_XXXXXXX
  ```

---

### A.2 — Enable Stripe Connect

> Connect is what lets Solen act as a platform — collect payments from customers and split the money to salons.

- [ ] **A.2.1** Go to **Connect** in the left sidebar. If you don't see it:
  - Click the **⚙️ Settings** gear icon (bottom-left)
  - Scroll to **"Product settings"** → **Connect**
  - Click **"Get started with Connect"**
- [ ] **A.2.2** Stripe will ask "What best describes your platform?" → Select **Marketplace** or **Platform**
- [ ] **A.2.3** You'll be asked for your platform's country → Select **Switzerland** 🇨🇭
- [ ] **A.2.4** Now you're in the Connect dashboard. Go to **Connect → Settings** (top of the Connect page)

---

### A.3 — Configure Connect Settings

- [ ] **A.3.1** Under **"Branding"** tab:
  - Business name: `solen.ch`
  - Icon: Upload the Solen logo (the one from the favicon/header)
  - Brand color: `#E8624A`
  - This is what salons see when they connect their Stripe account
- [ ] **A.3.2** Under **"Connected account types"**:
  - Enable **Standard** accounts
  - Standard means: Salons have their own Stripe dashboard, handle their own disputes, and you (Solen) just send them money. This is the simplest model.
  - Do NOT enable Custom or Express unless you want to manage everything for them (you don't)
- [ ] **A.3.3** Under **"Payments"**:
  - Enable **Destination charges**
  - This means: Customer pays Solen → Solen takes 1% fee → rest goes to salon's connected account
  - Under "Transfer schedule": Set to **Automatic** (Stripe handles when salons get paid)

---

### A.4 — Create a Webhook Endpoint

> Webhooks are how Stripe tells your app "hey, a payment just succeeded" or "a refund happened".

- [ ] **A.4.1** Go to **Developers** → **Webhooks**
- [ ] **A.4.2** Click **"Add endpoint"**
- [ ] **A.4.3** Endpoint URL: `https://www.solen.ch/api/stripe/webhook`
  - ⚠️ For local development, you'll use `stripe listen --forward-to localhost:3000/api/stripe/webhook` instead (see A.7)
- [ ] **A.4.4** Click **"Select events"** and add these events:
  ```
  payment_intent.succeeded
  payment_intent.payment_failed
  payment_intent.canceled
  charge.refunded
  charge.dispute.created
  charge.dispute.closed
  account.updated
  transfer.created
  transfer.failed
  ```
- [ ] **A.4.5** Click **"Add endpoint"**
- [ ] **A.4.6** On the webhook detail page, find **"Signing secret"** → Click **"Reveal"** → Copy it
- [ ] **A.4.7** Save it as:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_XXXXXXX
  ```

---

### A.5 — Create a Test Connected Account (Simulating a Salon)

> To test the full flow, you need a fake "salon" Stripe account connected to your platform.

- [ ] **A.5.1** Go to **Connect → Accounts**
- [ ] **A.5.2** Click **"Create connected account"** (or you can do this via API later)
- [ ] **A.5.3** Choose **Standard** account type
- [ ] **A.5.4** Use these test details:
  - Country: Switzerland
  - Email: `testsalon@solen.ch` (or any email you control)
  - Fill in dummy business details
  - When asked for SMS code, use: `000-000`
  - For bank account: use test IBAN `CH93 0076 2011 6238 5295 7` (Swiss test IBAN)
- [ ] **A.5.5** After creation, you'll get an **Account ID** starting with `acct_...`. Copy it.
- [ ] **A.5.6** This `acct_...` ID is what goes in the `salons.stripe_account_id` column in Supabase for the test salon.

---

### A.6 — Test a Payment Flow (Verify It Works)

> Before writing any code, verify that the Stripe sandbox can create a payment and split it.

- [ ] **A.6.1** Go to **Developers → API keys** → Note your `sk_test_...` key
- [ ] **A.6.2** Open your terminal and run this curl command (replace YOUR_KEY and CONNECTED_ACCOUNT_ID):

```bash
curl https://api.stripe.com/v1/payment_intents \
  -u "sk_test_YOUR_SECRET_KEY:" \
  -d "amount=5000" \
  -d "currency=chf" \
  -d "payment_method_types[]=card" \
  -d "application_fee_amount=50" \
  -d "transfer_data[destination]=acct_YOUR_CONNECTED_ACCOUNT_ID" \
  -d "capture_method=manual"
```

- [ ] **A.6.3** You should get a response with a PaymentIntent ID (`pi_...`) and `status: "requires_payment_method"`. This means:
  - ✅ Connect is working
  - ✅ 1% fee (`50` cents out of `5000` = CHF 50.00) is applied
  - ✅ Manual capture mode (hold, don't charge yet) is working
  - ✅ Destination charge to connected account is set up
- [ ] **A.6.4** If you get an error: Check that the connected account is active and that your secret key is correct

---

### A.7 — Local Development Webhook Testing

> When developing locally, Stripe can't reach `localhost:3000`. Use the Stripe CLI to forward webhooks.

- [ ] **A.7.1** Install the Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

- [ ] **A.7.2** Login to your Stripe account:
```bash
stripe login
```

- [ ] **A.7.3** Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

- [ ] **A.7.4** The CLI will print a **webhook signing secret** (starts with `whsec_...`). Use THIS one in your `.env.local` instead of the dashboard one:
```
STRIPE_WEBHOOK_SECRET=whsec_LOCAL_SECRET_HERE
```

- [ ] **A.7.5** Keep this terminal running while developing. You'll see webhook events logged in real time.

---

### A.8 — Summary of All Stripe Values for Your `.env.local`

After completing steps A.1-A.7, you should have:

```env
# Stripe Keys (Sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX

# Stripe Webhook (use the CLI one for local dev)
STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# Platform Config
PLATFORM_FEE_PERCENT=1
```

---

## Manual Step B: Supabase Storage Buckets

> Create storage buckets for photos that users and salon owners will upload.

---

### B.1 — Navigate to Storage

- [ ] **B.1.1** Go to your Supabase dashboard: [supabase.com/dashboard/project/tocfnsmxmdxkrcmjzzdw](https://supabase.com/dashboard/project/tocfnsmxmdxkrcmjzzdw)
- [ ] **B.1.2** Click **Storage** in the left sidebar (the folder icon)
- [ ] **B.1.3** You'll see existing buckets (if any). We need to create 3 new ones.

### B.2 — Create `client-photos` Bucket

- [ ] **B.2.1** Click **"New bucket"**
- [ ] **B.2.2** Name: `client-photos`
- [ ] **B.2.3** Public bucket: **OFF** (toggle to private) — these are sensitive client before/after photos
- [ ] **B.2.4** File size limit: `5242880` bytes (5MB)
- [ ] **B.2.5** Allowed MIME types: `image/jpeg, image/png, image/webp`
- [ ] **B.2.6** Click **"Save"**

### B.3 — Create `service-photos` Bucket

- [ ] **B.3.1** Click **"New bucket"**
- [ ] **B.3.2** Name: `service-photos`
- [ ] **B.3.3** Public bucket: **ON** — these are displayed publicly on salon profiles
- [ ] **B.3.4** File size limit: `5242880` bytes (5MB)
- [ ] **B.3.5** Allowed MIME types: `image/jpeg, image/png, image/webp`
- [ ] **B.3.6** Click **"Save"**

### B.4 — Create `gift-card-assets` Bucket

- [ ] **B.4.1** Click **"New bucket"**
- [ ] **B.4.2** Name: `gift-card-assets`
- [ ] **B.4.3** Public bucket: **ON** — QR codes are accessed via emailed links
- [ ] **B.4.4** File size limit: `1048576` bytes (1MB)
- [ ] **B.4.5** Allowed MIME types: `image/png, image/svg+xml`
- [ ] **B.4.6** Click **"Save"**

### B.5 — Storage RLS Policies

> You need to set up access rules so only authorized users can upload/read.

- [ ] **B.5.1** Click on `client-photos` bucket → **Policies** tab → **"New Policy"**
- [ ] **B.5.2** Add these policies using the SQL editor (**SQL Editor** → **New Query**):

```sql
-- client-photos: salon owners can upload to their salon's folder
CREATE POLICY "salon_owners_upload_client_photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM salons WHERE owner_id = auth.uid()
  )
);

-- client-photos: salon owners can read their salon's photos
CREATE POLICY "salon_owners_read_client_photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM salons WHERE owner_id = auth.uid()
  )
);

-- service-photos: salon owners upload, everyone can read
CREATE POLICY "salon_owners_upload_service_photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM salons WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "public_read_service_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-photos');

-- gift-card-assets: service role only upload, public read
CREATE POLICY "service_upload_gc_assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gift-card-assets' AND auth.role() = 'service_role');

CREATE POLICY "public_read_gc_assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-card-assets');
```

- [ ] **B.5.3** Run the SQL → verify no errors

---

## Manual Step C: seven.io SMS Configuration

> You already use seven.io for SMS reminders. Just verify capacity.

- [ ] **C.1** Log into [app.seven.io](https://app.seven.io/)
- [ ] **C.2** Check **Dashboard** → Current balance and credits
- [ ] **C.3** Estimate additional SMS volume:
  | Feature | Est. SMS/day |
  |---|---|
  | Walk-in payment links | 5-20 per salon |
  | Birthday messages | 1-5 total |
  | Tip prompt (optional) | 0-10 per salon |
  | **Total additional** | **~15-35 per salon** |
- [ ] **C.4** If your balance can handle ~1,000 SMS/month per active salon, you're fine
- [ ] **C.5** If low, top up your credits
- [ ] **C.6** Verify your sender ID is `solen.ch` or `Solen` (check under **Settings → Sender**)

---

## Manual Step D: Vercel Environment Variables

> Set the new env vars so the deployed app can use them.

- [ ] **D.1** Go to [Vercel Dashboard](https://vercel.com/) → Select **solen** project
- [ ] **D.2** Go to **Settings** → **Environment Variables**
- [ ] **D.3** Add these for **ALL environments** (Production, Preview, Development):

| Variable | Value | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Step A.1.4 |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Step A.1.4 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Step A.4.6 |
| `PLATFORM_FEE_PERCENT` | `1` | Your business decision |
| `BOOKING_HMAC_SECRET` | (generate below) | For tokenized links |
| `GIFT_CARD_HMAC_SECRET` | (generate below) | For gift card QR codes |

- [ ] **D.4** Generate the HMAC secrets. Run in your terminal:
```bash
# Generate two random secrets
echo "BOOKING_HMAC_SECRET=$(openssl rand -hex 32)"
echo "GIFT_CARD_HMAC_SECRET=$(openssl rand -hex 32)"
```
Copy the output values and paste them into Vercel.

- [ ] **D.5** Also add all these to your local `.env.local` file. Your complete `.env.local` should now include:
```env
# --- Existing ---
NEXT_PUBLIC_SUPABASE_URL=https://tocfnsmxmdxkrcmjzzdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# --- Stripe (New/Updated) ---
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
STRIPE_SECRET_KEY=sk_test_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# --- Platform (New) ---
PLATFORM_FEE_PERCENT=1
BOOKING_HMAC_SECRET=your-generated-secret
GIFT_CARD_HMAC_SECRET=your-generated-secret

# --- Existing ---
SEVEN_API_KEY=your-seven-key
RESEND_API_KEY=your-resend-key
# ... other existing vars
```

- [ ] **D.6** Redeploy on Vercel to pick up the new env vars (or it'll auto-deploy on next push)

---

## Manual Step E: Google Reserve with Google (LATER)

> 🔵 Do this AFTER all code phases are complete. This is a Google application process that takes 2-4 weeks.

- [ ] **E.1** Go to [Reserve with Google Partner Portal](https://mapsbooking.google.com/reserve/)
- [ ] **E.2** Click **"Apply to be a partner"**
- [ ] **E.3** Fill in:
  - Company: solen.ch
  - Country: Switzerland
  - Integration type: Booking
  - Availability feed URL: `https://www.solen.ch/api/integrations/google-reserve/feed`
  - Booking action URL: `https://www.solen.ch/api/integrations/google-reserve/book`
- [ ] **E.4** Submit and wait for Google's team to review (typically 2-4 weeks)
- [ ] **E.5** Once approved, Google will provide you with a Partner ID and further onboarding instructions

---

## Manual Step F: End-to-End Testing Checklist

> Do this AFTER all Claude Code phases are complete. Use Stripe test mode.

### F.1 — Prepaid Booking Flow
- [ ] Book a service as a customer → see Stripe card form → pay with `4242 4242 4242 4242` (exp: any future date, CVC: any 3 digits) → verify booking confirmed
- [ ] Check Supabase: booking row has `payment_status: 'paid'`, `paid_amount: XXXX`, `platform_fee: XX`

### F.2 — Cancellation
- [ ] Cancel a booking >24h before → verify partial refund (70% back if 30% fee)
- [ ] Cancel a booking <24h before → verify no refund, full amount kept

### F.3 — Price Adjustment
- [ ] As salon: adjust price up on a completed booking → verify customer gets email
- [ ] As customer: accept the adjustment → verify new amount captured
- [ ] As customer: dispute the adjustment → verify hold extended, flagged in dashboard

### F.4 — Walk-in
- [ ] As salon: "Add walk-in" → enter customer details → verify SMS sent
- [ ] Open the SMS payment link → pay → verify booking marked as paid

### F.5 — Guest Booking
- [ ] Log out → book a service → fill in name + phone → pay → verify `guest_bookings` row created
- [ ] Verify confirmation email received with "Create account" link

### F.6 — Staff
- [ ] As salon owner: invite staff member → verify email sent
- [ ] As staff: click invite link → create account → verify limited dashboard (only My Calendar/Portfolio)
- [ ] As staff: set working hours → verify schedule saved

### F.7 — Gift Cards
- [ ] Purchase a gift card → verify email sent to recipient with QR code
- [ ] Redeem gift card at booking checkout → verify balance deducted

### F.8 — Tips
- [ ] Complete a booking → verify tip prompt email sent
- [ ] Click tip link → select amount → pay → verify tip recorded

### F.9 — Referrals
- [ ] Generate referral code → share with another account → book with code → verify discount applied + referrer credited

### F.10 — Crons
- [ ] Verify `auto-complete` cron marks past bookings as completed
- [ ] Verify `release-payments` cron captures Stripe payment 24h after completion
- [ ] Verify `birthday-messages` cron sends email on birthday

---

## Dependency Order

| Step | What | Depends On | Must Complete Before |
|---|---|---|---|
| **A** | Stripe Connect sandbox setup | Nothing | Code Phase 6 |
| **B** | Supabase storage buckets | Nothing | Code Phase 17 |
| **C** | seven.io verification | Nothing | Code Phase 9 |
| **D** | Vercel env vars | Step A (need keys) | Code Phase 6 |
| **E** | Google Reserve application | All code complete | Nothing |
| **F** | E2E testing | All code complete | Production launch |

---

## Quick Status: Where You Are Now

You said you switched to Sandbox mode. Here's what to do right now:

1. ✅ You're in Sandbox — that's correct
2. 👉 **Do step A.1** — Get your sandbox API keys
3. 👉 **Do step A.2** — Enable Connect (look for it in left sidebar or Settings)
4. 👉 **Do step A.3** — Configure Connect settings
5. 👉 **Do step A.4** — Create webhook
6. 👉 **Do step A.5** — Create a test connected account (fake salon)
7. 👉 **Do step A.6** — Test a payment with curl
8. Then come back and do B, C, D

> 💡 **Tip**: You can do steps B, C, D in parallel with A since they're independent.
