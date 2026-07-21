# PaymentMethods

<!-- exists-check: net-new doc vs the components/*.md corpus (none named PaymentMethods). The
existing backend (app/api/stripe/payment-methods/route.ts, GET + POST) is reused as-is, not
touched by this doc or its component. This doc covers the new
app/[locale]/_components/profile/PaymentMethods.tsx, see its own exists-check comment. -->

**File:** [app/[locale]/_components/profile/PaymentMethods.tsx](../../app/[locale]/_components/profile/PaymentMethods.tsx)
**Layer:** 1 (chrome: card-row list, Skeleton loading state, Sheet host) hosting a Layer 2 accent (the sheet's ink `rounded-btn` confirm CTA is the one commit button, same treatment as every other primary CTA in the app).
**Locked since:** new, 2026-07-21, owner-approved `public/_mockups/sweep-payment-methods/index.html`.
**Registry row:** [COMPONENT_REGISTRY.md](../COMPONENT_REGISTRY.md) (Primitives section).

---

## Purpose

The account-level "Zahlungsmethoden" screen (`/profile/settings/payment`). The backend already existed (`GET /api/stripe/payment-methods` lists a customer's saved cards, `POST` creates a SetupIntent to add one) with no UI ever built against it. This component is that UI: it lists the real saved cards, and lets the user add a new one through the existing SetupIntent + Stripe Elements flow, no new backend, no new Stripe integration pattern.

`app/[locale]/profile/settings/payment/page.tsx` stays a server component: auth guard only (redirect to login if signed out), no profile-field fetch needed since the backend keys off the session. `PaymentMethods` owns all the interactivity: the list fetch, the loading/empty/populated states, and the add-card sheet.

---

## Public API

```ts
export default function PaymentMethods(): JSX.Element;
// No props. Client component, owns its own fetch + state via useTranslations("profileHub")
// and useTranslations("errors").
```

Internal shape (not exported):

```ts
interface PaymentMethod {
  id: string;
  brand: string;        // Stripe's raw brand string: "visa" | "mastercard" | "amex" | ...
  last4: string;
  exp_month?: number | null;
  exp_year?: number | null;
}
```

---

## Anatomy (top to bottom)

1. **Card list**: fetched from `GET /api/stripe/payment-methods` on mount. Each `PaymentMethod` renders as a `CardRow`: a 44x30px `rounded-[6px] bg-s-bg-sunken` badge (short brand code, e.g. "VISA" / "MC") + the full brand name (e.g. "Visa" / "Mastercard") + a meta line composed from the `payEndsIn` / `payValidUntil` i18n strings ("Endet auf 4242, gültig bis 08/28"). No set-default or remove control, the backend has no endpoint for either (same gap the mockup flagged).
2. **Empty state**: when the list is empty, renders the locked `EmptyState` (`components-legacy/ui/EmptyState.tsx`) with a `CreditCard` icon, `payEmpty` title, `payEmptySub` message.
3. **Loading state**: a `PaymentMethodsSkeleton` (two `CardRow`-shaped placeholders built from `<Skeleton>`), never a bare spinner, matching the loading-state law.
4. **Add-card CTA**: `payAddCard` ("Karte hinzufügen"), the one ink `rounded-btn` commit button on the screen. Tapping it POSTs `/api/stripe/payment-methods` for a fresh SetupIntent `client_secret`, then opens a `Sheet` (the locked bottom-sheet primitive, `height="auto"`).
5. **Add-card sheet**: mounts Stripe's `<Elements>` with the returned `client_secret` (ink `theme: "flat"` appearance, mirroring `WalkInPaymentForm.tsx`'s appearance object) and a `<PaymentElement>`. Its own confirm button (same `payAddCard` label, reused as the one commit phrasing) calls `elements.submit()` then `stripe.confirmSetup({ elements, redirect: "if_required" })`. On success the sheet closes and the list refetches so the new card appears immediately.

---

## States

| State | What renders |
|---|---|
| Loading (initial GET in flight) | `PaymentMethodsSkeleton`: two hairline rows, each a badge-shaped + two text-line `<Skeleton>` composite. |
| Has saved cards | `CardRow` list, one per method, `space-y-2.5`. |
| Genuinely empty (`methods.length === 0`) | `EmptyState` (`CreditCard` icon, `payEmpty` / `payEmptySub`). |
| Add-card sheet, intent not yet created | N/A, the sheet only opens once a `client_secret` exists (the POST + open happen together in `openAddCard`). |
| Add-card sheet, intent created, Stripe still loading | `<Spinner size="md" />` inside the sheet body (the Stripe iframe itself is loading, a transient action-state, not the page's list-loading state, so a spinner is correct here per the same convention as `TipFlow`/`WalkInPaymentForm`). |
| Add-card sheet, Elements mounted | `<PaymentElement>` + the ink confirm button. |
| Add-card sheet, confirm error | Inline `text-s-error` message below the `PaymentElement` (Stripe's own localized validation message, or the `errors.server_error` fallback). |
| SetupIntent create fails (POST error) | `text-s-error` message below the list, sheet never opens. |

---

## Do / Don't

### Do
- Reuse `GET`/`POST /api/stripe/payment-methods` exactly as they exist, this component is UI only, no backend change.
- Mirror the Stripe Elements setup already proven in `WalkInPaymentForm.tsx` (`components-legacy/barber/WalkInPaymentForm.tsx`) and `TipFlow.tsx` (`app/[locale]/_components/tips/TipFlow.tsx`): `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` as a module-level singleton, `<Elements>` keyed by `client_secret` so it never remounts mid-entry, `elements.submit()` before the confirm call.
- Refetch the list after a successful `confirmSetup()`, never locally append a fabricated row, the list must always reflect what Stripe actually returns.

### Don't
- Don't add a set-default or remove-card button, there is no backend endpoint for either yet. If that lands later, extend this component rather than forking a second payment-methods list.
- Don't build a second Stripe Elements add-card flow anywhere else in the app, extend this one or the `WalkInPaymentForm`/`TipFlow` pattern it mirrors.
- Don't invent card-brand display names beyond the fixed Stripe network set (visa/mastercard/amex/discover/diners/jcb/unionpay), that lookup is a presentation map of Stripe's own `brand` values, not user data.

---

## Related

- **Sheet** (`primitives/Sheet.tsx`, [Sheet.md](Sheet.md)): the add-card bottom sheet host.
- **EmptyState** (`components-legacy/ui/EmptyState.tsx`, undocumented primitive): the empty saved-cards state.
- **Skeleton** (`primitives/Skeleton.tsx`): the list-of-cards loading placeholder.
- **WalkInPaymentForm** (`components-legacy/barber/WalkInPaymentForm.tsx`): the confirm-payment sibling this file's confirm-setup pattern mirrors.
- **TipFlow** (`app/[locale]/_components/tips/TipFlow.tsx`): another Stripe Elements consumer with the same `loadStripe` singleton + keyed `<Elements>` pattern.
