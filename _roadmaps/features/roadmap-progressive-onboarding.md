# Roadmap: Progressive Salon Onboarding & Dashboard "Go Live" Gate

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Existing salon registration | Ensure Twilio OTP flow and basic data schema in `salons` table remain functional when ripping out steps 4-7. |
| Phase 2 | 🟡 MEDIUM | Stripe Connect Flow | Do not modify the existing `/api/stripe/connect/create-account` logic. Only wrap it in the new Dashboard UI. |
| Phase 3 | 🟢 SAFE | Dashboard UI | Use existing Layout wrappers to inject the new SetupBanner checklist and "Go Live" gate safely without breaking mobile views. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Rebuild the Initial Wizard (3 Steps)
**Goal:** Tear down the 7-step wizard and replace it with a 3-step flow (Basics -> OTP -> AI Quick Win Service). 

**Files:**
- `[MODIFY] app/[locale]/onboarding/salon/page.tsx`
- `[MODIFY] app/api/salons/route.ts`
- `[MODIFY] lib/validations.ts`

**Tasks:**
1. Strip `page.tsx` down to Step 1 (Basics) and Step 2 (Phone Verification).
2. Create Step 3 (Quick Win): Add an input for a single popular service. Call a Next.js server action (or API) using `@google/generative-ai` to auto-suggest a service name based on their chosen category (e.g., Category "Hair" -> Suggests "Waschen, Schneiden, Föhnen").
3. Update `createSalonSchema` in `lib/validations.ts` to make staff, templates, and availability completely optional or removed for onboarding.
4. Redirect immediately to `/${locale}/dashboard` upon success. The salon is inherently created with `is_active: false`.

✅ **DO:**
```tsx
// Use UI_RULES.md typography and 8-pt spacing
<div className="flex flex-col gap-4 p-6 bg-white dark:bg-s-dm-surface rounded-card shadow-card">
  <InteractiveHoverButton text={t("nav.finish")} onClick={handleSubmit} />
</div>
```
❌ **DON'T:**
```tsx
// Do not use legacy colors, font weights, or broken grid spacing
<button className="bg-red-400 p-5 rounded-2xl font-bold">Go</button>
```

> ⚠️ **BE CAREFUL**:
> - Do NOT break the Twilio OTP validation process in Step 2.
> - Ensure `tos_accepted`, `tos_version`, and `tos_accepted_at` are still securely passed to to `/api/salons/route.ts`.
> - **Verify**: `npm run build && git commit -m "phase 1: tear down wizard and build 3-step ai flow"`

---

### Phase 2: The "Go Live" Gate & Stripe Enforcement
**Goal:** Salons arrive in the dashboard "Draft" mode. They must connect Stripe and upload a photo to "Publish" their salon.

**Files:**
- `[MODIFY] app/[locale]/dashboard/page.tsx`
- `[NEW] components/dashboard/GoLiveGate.tsx`
- `[MODIFY] components/dashboard/SetupBanner.tsx`

**Tasks:**
1. Upgrade `SetupBanner.tsx` into a gamified checklist side-panel showing completed vs missing tasks (Stripe, Hours, Staff).
2. Add a prominent `GoLiveGate.tsx` sticky header (or card) at the top of the dashboard.
3. If they press "Go Live" and `stripe_account_id` is null, block them and render the Stripe Connect CTA via our existing `/api/stripe/connect/create-account` endpoint.
4. Once Stripe is successfully linked and a cover photo exists, allow pushing `is_active: true` to the `/api/admin/salons/[id]/approve` or similar db-update method.

✅ **DO:**
```tsx
// Fail gracefully and use clear semantic statuses
{missingStripe ? (
  <Badge className="bg-s-error-bg text-s-error">Auszahlungen Fehlen</Badge>
) : (
  <Badge className="bg-s-success-bg text-s-success">Bereit für Go Live</Badge>
)}
```
❌ **DON'T:**
```tsx
// Do not build a new Stripe API route. Use the existing one.
fetch("/api/stripe/my-new-connect-route") // BAD
```

> ⚠️ **BE CAREFUL**:
> - Ensure you check `session.user` role to confirm they are indeed upgraded to `salon_owner`.
> - Do not expose the "Go Live" button to staff roles, only owners.
> - **Verify**: `npm run build && git commit -m "phase 2: dashboard go-live gate and stripe enforcement"`

---

### Phase 3: Dashboard Services & Competitor Import
**Goal:** Move the deep configuration (specifically Services) into the dashboard. Add the tiny "Treatwell Import" button safely tucked away.

**Files:**
- `[MODIFY] app/[locale]/dashboard/services/page.tsx`

**Tasks:**
1. Migrate the old "Service Templates" bulk-selector from the old `onboarding/` frontend code into the dashboard's service manager.
2. Add a subtle, secondary link under the service manager: "Import von Treatwell/Fresha (CSV)?".
3. Since we don't have a CSV parser built yet, just wire the modal UI and log a "Coming Soon" or email mailto link for concierge import.

✅ **DO:**
```tsx
// Tuck the competitor import away subtly as requested
<button className="text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral hover:underline mt-4 cursor-pointer transition-colors">
  Treatwell CSV importieren?
</button>
```
❌ **DON'T:**
```tsx
// Do not make the competitor import a massive top-level CTA
<InteractiveHoverButton text="IMPORT FROM COMPETITOR NOW" />
```

> ⚠️ **BE CAREFUL**:
> - Ensure bulk-inserting services adheres to the same `serviceRows` Supabase insert logic as the old onboarding setup.
> - **Verify**: `npm run build && git commit -m "phase 3: dashboard services importer config"`

---

## 🧑 MANUAL PHASES

### Manual A: Stripe Connect Webhooks
1. Log into the Stripe Developer Dashboard.
2. Ensure the Connect webhooks for `account.updated` are actively pointing to `https://www.solen.ch/api/stripe/webhook` to capture when a salon completes onboarding.
3. Update the environment variables in Vercel if the webhook secret changes. Keep them synchronized across Preview and Production.

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Rebuild 3-Step Wizard | Nothing |
| Phase 2 | 🤖 | Dashboard & Go-Live Stripe Gate | Phase 1 |
| Phase 3 | 🤖 | Dashboard Services Importer | Phase 2 |
| Manual A | 🧑 | Stripe Webhooks Verify | Phase 2 |
