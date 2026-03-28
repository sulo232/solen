# Roadmap: Compliance & Security Audit Remediation

> Source audit: `brain/9b28c43d-5746-4b59-8177-836afc81cc2e/solen_audit.md`  
> Executed fixes already: CRIT-01, CRIT-01b, CRIT-02, HIGH-02, HIGH-03b (footer), LOW-03  
> This roadmap covers the REMAINING open items.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Translation-only changes, no logic |
| Phase 2 | 🟡 MEDIUM | Impressum page rendering | Fill all placeholders; don't leave `[PLATZHALTER]` in JSX |
| Phase 3 | 🟡 MEDIUM | Auth flow on all 4 locales | Test magic link, Google OAuth, and password reset in `/de`, `/en`, `/fr`, `/it` after |
| Phase 4 | 🟢 SAFE | Nothing | Feature flag + sitemap change only |

---

## Status of Already-Fixed Items

These were applied in the previous session and are **complete** — do not re-apply:

| Item | Status | Files Touched |
|---|---|---|
| CRIT-01: Open redirect in SignIn.tsx | ✅ Done | `components/auth/SignIn.tsx` |
| CRIT-01b: Open redirect in auth callback | ✅ Done | `app/api/auth/callback/route.ts` |
| CRIT-02: `getSession()` → `getUser()` in middleware | ✅ Done | `middleware.ts` |
| HIGH-02: Remove hardcoded fallback category counts | ✅ Done | `components/HomePage.tsx` |
| HIGH-03b: Footer hardcoded German strings | ✅ Done | `components/layout/Footer.tsx`, all 4 locale JSONs |
| LOW-03: Webhook date locale | ✅ Done | `app/api/stripe/webhook/route.ts` |

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1 — Migrate Remaining Hardcoded German in `SignIn.tsx`

**Risk: 🟢 SAFE** — Translation keys only, no logic change.

**Affected file:** `components/auth/SignIn.tsx`  

**Existing namespace:** `auth` (already used in this file via `const t = useTranslations("auth")`)

#### Files to change

| Tag | File |
|---|---|
| `[MODIFY]` | `components/auth/SignIn.tsx` |
| `[MODIFY]` | `messages/de.json` |
| `[MODIFY]` | `messages/en.json` |
| `[MODIFY]` | `messages/fr.json` |
| `[MODIFY]` | `messages/it.json` |

#### Strings to migrate

| Hardcoded DE string | New key | DE value | EN | FR | IT |
|---|---|---|---|---|---|
| `"E-Mail gesendet"` | `auth.emailSent` | E-Mail gesendet | Email sent | E-mail envoyé | Email inviato |
| `"Link gesendet"` | `auth.linkSent` | Link gesendet | Link sent | Lien envoyé | Link inviato |
| `"Schau in deinem Postfach..."` | `auth.checkInbox` | Schau in deinem Postfach nach dem Magic Link. | Check your inbox for the magic link. | Vérifiez votre boîte mail pour le lien magique. | Controlla la tua casella mail per il link magico. |
| `"Konto-Wiederherstellung"` | `auth.accountRecovery` | Konto-Wiederherstellung | Account Recovery | Récupération de compte | Recupero account |
| `"Passwort vergessen?"` | `auth.forgotPassword` | Passwort vergessen? | Forgot password? | Mot de passe oublié? | Password dimenticata? |
| `"Reset-Link senden"` | `auth.sendResetLink` | Reset-Link senden | Send reset link | Envoyer le lien de réinitialisation | Invia link di reset |
| `placeholder="Passwort"` | `auth.passwordPlaceholder` | Passwort | Password | Mot de passe | Password |
| `"Anmelden"` (button) | `auth.signIn` | Anmelden | Sign in | Se connecter | Accedi |
| `"Zurück"` (back link) | `auth.back` | Zurück | Back | Retour | Indietro |

#### ✅ DO

```tsx
// In SignIn.tsx — use t() for all user-visible strings
const t = useTranslations("auth");

// State labels
{t("emailSent")}
{t("checkInbox")}

// Recovery section heading
<h2>{t("accountRecovery")}</h2>
<p>{t("forgotPassword")}</p>

// Button
<button>{t("sendResetLink")}</button>

// Input placeholder
<input placeholder={t("passwordPlaceholder")} />

// Sign in button
<button>{t("signIn")}</button>
```

#### ❌ DON'T

```tsx
// Never hardcode German strings in JSX — they show in English/French/Italian routes too
{mode === "magic" && "E-Mail gesendet"}
<input placeholder="Passwort" />
<button>Anmelden</button>
```

> ⚠️ **BE CAREFUL**:
> - The `auth` namespace already exists in all 4 locale JSONs — append keys inside the existing `"auth": { ... }` block, don't create a second `"auth"` block.
> - `SignIn.tsx` uses `const t = useTranslations("auth") as any` — the `as any` cast is intentional to suppress TS errors on dynamic keys; preserve it.
> - Do NOT touch the Google OAuth button label — it already uses `t("google_login")`.
> - Do NOT touch the magic link send logic, only the displayed text strings.
> - After changes, verify `/en/auth/login` shows English strings, `/fr/auth/login` shows French.

**Commit:** `git commit -m "i18n: migrate hardcoded German strings in SignIn.tsx to auth namespace"`

---

### Phase 2 — Impressum Page: Replace Placeholders with Real Data

**Risk: 🟡 MEDIUM** — Page will throw or look broken if any `[PLATZHALTER]` remains in JSX.

**File:** `app/[locale]/impressum/page.tsx`

Before starting, confirm the following data from the company:

| Field | Required |
|---|---|
| Company legal name | e.g. `Solen GmbH` |
| Street & number | e.g. `Musterstrasse 12` |
| Postcode & city | e.g. `4051 Basel` |
| Contact email | e.g. `hello@solen.ch` |
| Contact phone | e.g. `+41 61 000 00 00` |
| Legal representative | e.g. `Max Mustermann` |
| Handelsregister | e.g. `CHE-123.456.789` |
| UID (VAT) | e.g. `CHE-123.456.789 MWST` |
| Hosting provider | e.g. `Vercel Inc., San Francisco` |

#### Files to change

| Tag | File |
|---|---|
| `[MODIFY]` | `app/[locale]/impressum/page.tsx` |
| `[MODIFY]` | `messages/de.json` — add `impressum` namespace |
| `[MODIFY]` | `messages/en.json` |
| `[MODIFY]` | `messages/fr.json` |
| `[MODIFY]` | `messages/it.json` |

#### ✅ DO

```tsx
// Convert ImpressumPage to use useTranslations for all locale-variable strings
// Keep company data (address, phone) in a single source — either locale JSON or a config constant
// Example: use a shared COMPANY_INFO constant for data that doesn't translate
import { COMPANY_INFO } from "@/lib/company-info"; // [NEW] lib/company-info.ts

export default function ImpressumPage() {
  const t = useTranslations("impressum");
  return (
    <main>
      <h1>{t("title")}</h1>
      <address>
        <strong>{COMPANY_INFO.name}</strong><br />
        {COMPANY_INFO.street}<br />
        {COMPANY_INFO.city}
      </address>
      <p>{COMPANY_INFO.email}</p>
      <p>{COMPANY_INFO.uid}</p>
    </main>
  );
}
```

```ts
// [NEW] lib/company-info.ts
export const COMPANY_INFO = {
  name:          "Solen GmbH",
  street:        "Musterstrasse 12",
  city:          "4051 Basel",
  email:         "hello@solen.ch",
  phone:         "+41 61 000 00 00",
  representative:"Max Mustermann",
  handelsreg:    "CHE-123.456.789",
  uid:           "CHE-123.456.789 MWST",
  hosting:       "Vercel Inc., San Francisco, CA, USA",
} as const;
```

#### ❌ DON'T

```tsx
// Never leave placeholder text in the rendered page
<p>[PLATZHALTER — Bitte echten Text einsetzen]</p>
<p>CHE-XXX.XXX.XXX MWST</p>

// Don't hardcode in German only — the page renders at /en/impressum too
<h1>Impressum</h1>
```

> ⚠️ **BE CAREFUL**:
> - The back link `← Zurück zur Startseite` is currently hardcoded German — migrate it to `t("backToHome")` while you're here.
> - The `agb/page.tsx` and `datenschutz/page.tsx` are simple redirects — do NOT modify them; they correctly redirect to `/terms` and `/privacy`.
> - After deploy, verify all 4 locale routes: `/de/impressum`, `/en/impressum`, `/fr/impressum`, `/it/impressum`.
> - This page does NOT need `"use client"` — keep it a Server Component.
> - The legal text itself (liability disclaimers, link disclaimers) should be translated into the 4 locales in the locale JSONs.

**Commit:** `git commit -m "legal: replace Impressum placeholders with real company data, add company-info constant"`

---

### Phase 3 — Auth Hardening: Validate All Redirect Entry Points

**Risk: 🟡 MEDIUM** — Changes touch auth flow. Test on all locales after.

The open redirect in `middleware.ts` login redirect construction also needs hardening.

**Files to check and harden:**

| Tag | File | Issue |
|---|---|---|
| `[MODIFY]` | `middleware.ts` | `loginUrl.searchParams.set("redirect", pathname)` — pathname could be external if headers are spoofed |
| `[VERIFY]` | `components/auth/SignIn.tsx` | ✅ Already fixed |
| `[VERIFY]` | `app/api/auth/callback/route.ts` | ✅ Already fixed |

#### ✅ DO — Harden middleware redirect construction

```ts
// middleware.ts — when building the login redirect URL
// Ensure the pathname we pass as redirect param is from the *request* URL, not a header
const { pathname } = new URL(request.url);   // always from actual request

// Then validate it before embedding
const safeRedirect = pathname.startsWith("/") && !pathname.startsWith("//")
  ? pathname
  : `/${locale}`;

loginUrl.searchParams.set("redirect", safeRedirect);
```

#### ❌ DON'T

```ts
// Don't use request.headers.get("x-forwarded-uri") or similar — easily spoofed
const redirect = request.headers.get("referer") ?? "/";
loginUrl.searchParams.set("redirect", redirect); // ❌ open redirect vector
```

> ⚠️ **BE CAREFUL**:
> - `middleware.ts` runs on EVERY request edge — a runtime error here takes down the entire site.
> - After changing middleware, do a full local `npm run dev` and test: unauthenticated visit to `/de/dashboard` should redirect to `/de/auth/login?redirect=/de/dashboard`, and after login should return there.
> - Do NOT change the `updateSession` call structure at the top of middleware — it handles cookie refreshing.
> - Do NOT change the CORS block for `/api/` routes — it's intentional.
> - The `locales.find(...)` detection must remain intact; don't refactor it during this phase.

**Commit:** `git commit -m "security: harden redirect param in middleware login URL construction"`

---

### Phase 4 — Feature Flag & Sitemap Consistency

**Risk: 🟢 SAFE** — No user-facing functional change.

#### Problem

`CLIENT_FEATURE_FLAGS.isMassageSpaEnabled = false` only hides the Spa tile on the homepage grid. But:
1. `/spa` route is fully accessible and linked from the footer
2. Sitemap includes `/spa`, `/makeup`, `/waxing` with `priority: 0.8` even for gated categories

#### Files to change

| Tag | File |
|---|---|
| `[MODIFY]` | `lib/feature-flags.ts` |
| `[MODIFY]` | `app/sitemap.ts` |
| `[MODIFY]` | `components/layout/Footer.tsx` |

#### Step 4a — Make feature flags apply consistently

```ts
// lib/feature-flags.ts — export a function to check route availability
export const isRouteEnabled = (category: string): boolean => {
  switch (category) {
    case "spa":    return CLIENT_FEATURE_FLAGS.isMassageSpaEnabled;
    case "makeup": return CLIENT_FEATURE_FLAGS.isMakeupEnabled ?? true;
    case "waxing": return CLIENT_FEATURE_FLAGS.isWaxingEnabled ?? true;
    default:       return true;
  }
};
```

#### Step 4b — Exclude disabled categories from sitemap

```ts
// app/sitemap.ts — filter out disabled categories
import { isRouteEnabled } from "@/lib/feature-flags";

const STATIC_CATEGORIES = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];

// In the sitemap function:
const enabledCategories = STATIC_CATEGORIES.filter(isRouteEnabled);
// Use enabledCategories when generating category URLs
```

#### Step 4c — Gate footer category links by feature flag

```tsx
// components/layout/Footer.tsx — only link enabled categories
import { isRouteEnabled } from "@/lib/feature-flags";

// In the categories section:
{FOOTER_CATEGORIES.filter(c => isRouteEnabled(c.key)).map(c => (
  <Link key={c.key} href={`/${locale}/${c.key}`}>{c.label}</Link>
))}
```

#### ✅ DO

```tsx
// Consistent: if category is disabled, it's hidden everywhere
// homepage tile → disabled (already done via CLIENT_FEATURE_FLAGS.isMassageSpaEnabled)
// footer link  → hidden (Phase 4c)
// sitemap      → omitted (Phase 4b)
// /spa route   → returns 404 or redirects when disabled
```

#### ❌ DON'T

```tsx
// Don't leave the /spa page accessible when the feature flag is false
// Don't add "coming soon" copy to /spa/page.tsx — redirect instead:
// if (!isRouteEnabled("spa")) redirect(`/${locale}`)
```

> ⚠️ **BE CAREFUL**:
> - `CLIENT_FEATURE_FLAGS` is used client-side. `isRouteEnabled` in sitemap runs server-side — verify the flag resolves correctly in both contexts (it reads from a plain object constant, so it's fine).
> - Do NOT touch the `/dashboard/spa-admin` route during this phase — it should remain accessible for admin users regardless of the customer-facing flag.
> - Footer currently uses a hardcoded `categories` array — check if it differs from `CATEGORIES` in `HomePage.tsx`. If so, unify them.
> - After changes, verify sitemap at `/sitemap.xml` and confirm `/spa` is absent when flag is false.

**Commit:** `git commit -m "feat: unify feature flag enforcement across homepage, footer, and sitemap"`

---

## 🧑 MANUAL PHASES

---

### Manual A — Fill Impressum with Real Company Data

**Prerequisite for Phase 2.** Must be done by the business owner / legal contact.

**Steps:**
1. Retrieve from Swiss Handelsregister: https://www.zefix.ch
2. Look up UID at: https://www.uid.admin.ch
3. Collect: company name, registered address, representative, UID, contact email/phone
4. Provide this data to the developer to fill `lib/company-info.ts`
5. Verify the rendered page at `https://solen.ch/de/impressum` post-deploy

---

### Manual B — Stripe Webhook: Add `checkout.session.completed`

**Risk: 🟢 SAFE** — Additive only. Does not change existing handlers.

If Stripe Checkout sessions are used anywhere (not just direct PaymentIntents):

**Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks → your endpoint
2. Click **"Add events"**
3. Add `checkout.session.completed`
4. In `app/api/stripe/webhook/route.ts` add a new case:

```ts
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  // Retrieve the PaymentIntent from session and delegate to existing handler
  if (session.payment_intent) {
    // idempotency check already covers this via processed_webhook_events
    await handlePaymentIntentSucceeded(session.payment_intent as string);
  }
  break;
}
```

5. Test with Stripe CLI: `stripe trigger checkout.session.completed`

---

## Dependency Ordering Table (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Collect real company data | Nothing — do first |
| Phase 1 | 🤖 | Migrate SignIn.tsx hardcoded German | Nothing |
| Phase 2 | 🤖 | Fill Impressum placeholders | Manual A |
| Phase 3 | 🤖 | Harden middleware redirect | Nothing |
| Phase 4 | 🤖 | Feature flag consistency | Nothing |
| Manual B | 🧑 | Add `checkout.session.completed` to Stripe webhook | Phase 4 deploy |

**Suggested execution order:** Manual A → Phase 1 → Phase 3 → Phase 4 → Phase 2 → Manual B

---

## Phase 5 (Final) — Update CLAUDE.md (R8)

After all phases are complete:

| Tag | File | Update |
|---|---|---|
| `[MODIFY]` | `CLAUDE.md` Section 3.2 | Add `lib/company-info.ts` to directory tree |
| `[MODIFY]` | `CLAUDE.md` Section 11 | Add rule: "All redirect params must be validated with `startsWith('/') && !startsWith('//')` before use" |
| `[MODIFY]` | `CLAUDE.md` Section 11 | Add rule: "Use `supabase.auth.getUser()` not `getSession()` in any server/middleware auth decision" |
| `[MODIFY]` | `CLAUDE.md` Section 2 | Note that `lib/feature-flags.ts` is the single source of truth for category availability |

**Commit:** `git commit -m "docs: update CLAUDE.md with security patterns from compliance audit"`

---

## Verification Checklist

After all phases:

- [ ] `/de/auth/login?redirect=https://evil.com` → redirects to `/` after login, not to evil.com
- [ ] `/en/auth/login` → all strings in English (no German)
- [ ] `/fr/auth/login` → all strings in French
- [ ] `/de/impressum` → no `[PLATZHALTER]` text visible
- [ ] `/en/impressum` → English heading "Imprint", back link in English
- [ ] `/de/dashboard` (unauthenticated) → redirects to login, then back to `/de/dashboard` after login
- [ ] `/sitemap.xml` → `/spa` absent when `isMassageSpaEnabled = false`
- [ ] Footer on `/de` → Spa link absent (if feature flagged off)
- [ ] Booking confirmation email → date formatted in user's locale language
- [ ] Footer on `/en` → "Change language" and "FADP-compliant · Swiss data protection" (not German)
