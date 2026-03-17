# 🔧 Manual Fixes Checklist — Things We Fix Together

> These are items that CANNOT be solved by Claude Code alone.
> Work through these with the user one by one.
> Mark [x] when done.

---

## 🟡 Stripe

- [x] **Register Stripe Webhook endpoint** — User says this is already done
- [ ] **Get `STRIPE_WEBHOOK_SECRET`** — Copy signing secret from Stripe Dashboard → Webhooks → click the endpoint → Signing secret → Reveal → Copy → Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
- [ ] **Stripe Connect Express approval** — Check Stripe Dashboard → Connect → Status. Until approved, salon payouts stay on main account.
- [ ] **Apple Pay domain verification**
  - Go to Stripe Dashboard → Settings → Payment methods → Apple Pay → Add domain `solen.ch`
  - Download the verification file
  - Claude Code will then place it at `public/.well-known/apple-developer-merchantid-domain-association`

## 🟡 Supabase

- [x] **Fix `profiles.locale` CHECK** — Done
- [x] **Verify migrations 016-019 exist in DB** — Done (user confirmed tables exist)
- [x] **Verify admin role** — Done (account explicitly granted admin)

## 🔴 Cloudflare — SITE IS DOWN

- [x] **Cloudflare IS active** — Confirmed via 521 error (Ray ID: `9dd632730e280d25`, Zurich)
- [ ] **⚠️ URGENT: Vercel deployment is paused!**
  - `solen-ch.vercel.app` → 404 DEPLOYMENT_NOT_FOUND
  - `solen.vercel.app` → unrelated site (meme coin)
  - `solen-app.vercel.app` → **"This deployment is temporarily paused"** ← this is likely the origin!
  - **FIX:** Go to Vercel Dashboard → find the solen.ch project → unpause the deployment
  - Then verify Cloudflare DNS → CNAME record points to the correct Vercel domain
- [ ] **After unpausing:** Configure SSL Full (Strict), Auto Minify ON, Cache TTL 4h, Bot Fight Mode ON

## 🟡 Vercel Env Vars

- [ ] **Verify all env vars** — Check Vercel → Settings → Environment Variables → Production:
  - `NEXT_PUBLIC_SUPABASE_URL` ✅
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
  - `SUPABASE_SERVICE_ROLE_KEY` ✅
  - `RESEND_API_KEY` ✅
  - `SENTRY_DSN` + `SENTRY_AUTH_TOKEN`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` ← this one is pending

## 🟢 Decisions Made (No Action Needed)

- ~~SMS via Seven.io~~ → **REMOVED** — costs money, not using
- ~~Calendar sync (Google/Outlook)~~ → **REMOVED** — costs money
- ~~Outreach emails~~ → **DO NOT RUN** — site not ready
- ~~Dark mode~~ → **LIGHT MODE ONLY**
- ~~Tattoo category~~ → **SKIP FOR NOW** — focus on existing 6 categories

## 🔴 Code Cleanups (Claude Code Can Do)

These should be done as part of the roadmap to remove dead features:

- [ ] Remove Seven.io SMS code and `SEVEN_API_KEY` from `.env.example`
- [ ] Remove calendar sync routes (`api/gcal-auth.js`, `api/outlook-auth.js`, `api/gcal-sync.js`, `api/outlook-sync.js`)
- [ ] Remove calendar-related env vars from `.env.example` (`GOOGLE_CLIENT_ID`, etc.)
- [ ] Remove SMS toggle from account notification settings (since we're not using SMS)
- [ ] Remove `calendar_tokens` table reference if not needed
