# Security Manual Steps — Completion Tracker

## ✅ Completed
- [x] **Phase A** — Upstash Redis created (Frankfurt, EU-Central-1), env vars set in Vercel (2026-03-17)
- [x] **Phase B** — Sentry org token rotated, new token in Vercel + local `.env.sentry-build-plugin` (2026-03-17)
- [x] **Phase C1** — Supabase spend cap enabled (2026-03-17)
- [x] **Phase D** — Cloudflare WAF configured: Bot Fight Mode, Security Level Medium, Managed Ruleset (2026-03-17)

## ⏳ Remaining (non-blocking — do anytime)
- [ ] **Phase C2** — Google Places API quota (skipped — free tier + $200 credit, 48 salons = low risk)
- [ ] **Phase C3** — Stripe billing alerts (CHF 50/200/500) + enable Radar
- [ ] **Phase E** — Verify Netlify env var Production vs Deploy Preview separation (especially Stripe test vs live keys). Phase A/B above were originally on Vercel; env vars have since been migrated to Netlify (2026-05-09).
- [ ] **Phase F** — Post-deployment verification (after Claude Code finishes all code phases)
