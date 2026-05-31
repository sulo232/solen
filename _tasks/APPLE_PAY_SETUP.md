# Apple Pay / Google Pay — final setup step (deploy-time)

**Status:** Code is wired ✅ — `app/api/walkin/pay-intent/route.ts` now creates the hold with
`automatic_payment_methods: { enabled: true, allow_redirects: "never" }`, and the checkout uses the
Stripe **Payment Element** (`components-legacy/barber/WalkInPaymentForm.tsx`), which renders the
Apple Pay / Google Pay buttons automatically when eligible.

## What's left (can't be done from code / localhost)

Apple Pay only appears when **all** of these are true:
1. **HTTPS domain** — never works on `localhost`. Test on the Netlify deploy.
2. **Supported device/browser** — Apple Pay = Safari on iPhone/Mac with a card in Wallet; Google Pay = Chrome.
3. **Domain registered with Apple, via Stripe** ← the only manual step.

### Register the domain (one time, per domain)
Stripe Dashboard → **Settings → Payment methods → Apple Pay → Add new domain** → enter the live
domain (e.g. `solen.ch` and any preview domain you want it on). Stripe hosts the
`/.well-known/apple-developer-merchantid-domain-association` file for you and verifies automatically.

(Or via API with the secret key: `stripe.applePayDomains.create({ domain_name: 'solen.ch' })`.)

- **Google Pay** needs no domain registration — it shows once the above (HTTPS + Chrome) is met.
- Enable **Apple Pay / Google Pay** as payment methods in Dashboard → Payment methods (card wallets
  are usually on by default).

## How to verify after deploy
Open the walk-in pay page on an iPhone (Safari) on the live domain → the **Apple Pay button** appears
above the card fields in the Payment Element. Tapping it authorizes the same manual-capture hold
(`requires_capture`), so the rest of the queue flow is unchanged.

## Note on the "logo"
We intentionally do **not** paint a static Apple Pay logo. The real Apple Pay button (rendered by
Stripe) is the legitimate, Apple-guideline-compliant mark — and it only shows when payment will
actually work. A static logo on an unsupported device/domain would advertise something that fails.
