# Roadmap 00: Manual Prerequisites (COMPLETE BEFORE ANY CLAUDE CODE ROADMAP)

> **Owner**: Human (Sulo). These steps require personal action — API keys, service dashboards, provider setup. Claude Code cannot perform these.

---

## Step 1: seven.io SMS Setup
1. Create account at [seven.io](https://www.seven.io)
2. Get API key from dashboard
3. Add to Vercel env vars (**ALL environments**: Production + Preview + Development):
   - `SEVEN_IO_API_KEY=<your-key>`
4. **Verify**: Send a test SMS via API to your own phone

## Step 2: Resend Email Setup
1. Create account at [resend.com](https://resend.com)
2. Add `solen.ch` as verified domain (add DNS records: DKIM, SPF, DMARC)
3. Get API key
4. Add to Vercel env vars (**ALL environments**):
   - `RESEND_API_KEY=<your-key>`
   - `RESEND_FROM_EMAIL=noreply@solen.ch`
5. **Verify**: Send a test email via Resend dashboard

## Step 3: Stripe Connect Webhooks Verification
1. Go to [Stripe Developer Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Verify `account.updated` webhook → `https://www.solen.ch/api/stripe/webhook`
3. Verify `payment_intent.succeeded` webhook is active
4. If webhook secret changed → update `STRIPE_WEBHOOK_SECRET` in Vercel (all environments)

## Step 4: Vercel Cron Plan Check
1. Verify your Vercel plan supports cron jobs (Pro plan required)
2. Cron entries will be added to `vercel.json` by Claude Code in R10
3. Nothing to do now — just ensure you're on Pro plan

## Step 5: Map Provider API Key
1. Choose a map provider for the `/search` split-view page:
   - **Mapbox** (recommended — beautiful design, generous free tier)
   - **Google Maps** (reliable, expensive beyond free tier)
   - **Leaflet + OpenStreetMap** (free, no API key needed, less polished)
2. Create account and get API key
3. Add to Vercel env vars (**ALL environments**):
   - `NEXT_PUBLIC_MAPBOX_TOKEN=<your-key>` (if Mapbox)
   - or `NEXT_PUBLIC_GOOGLE_MAPS_KEY=<your-key>` (if Google)

## Step 6: Supabase Extension Check
1. Go to Supabase Dashboard → Database → Extensions
2. Verify `pgvector` is enabled (needed for AI-powered search embeddings)
3. Verify `pg_cron` is enabled (needed for automated reminder cron functions)
4. If not enabled, toggle them on

---

> ✅ **Once all 6 steps are done**, tell the agents which map provider you chose, then launch Wave 1 roadmaps (R01–R08).
