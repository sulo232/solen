# AccountHub

<!-- exists-check: npm run exists AccountHub ran this turn, 1 hit (a graveyard/REMOVED entry
about an EARLIER account-hub iteration's redundant "Profile" page-title text, not this
component). This doc replaces the ProfileTabs.md doc (renamed 2026-08-02, see git history for
the prior tabbed-content-hub version of this file). -->

**File:** [app/[locale]/_components/profile/AccountHub.tsx](../../app/[locale]/_components/profile/AccountHub.tsx)
**Layer:** 1 (chrome: header, grouped row-list) with no interactive state of its own.
**Locked since:** renamed from ProfileTabs 2026-08-02, owner-approved account-hub mockup ("konto hub better", `public/_mockups/restraint/account-hub.html`).
**Registry row:** [COMPONENT_REGISTRY.md](../COMPONENT_REGISTRY.md).

---

## Purpose

The client half of the `/profile` account hub. `app/[locale]/profile/page.tsx` stays a server component: auth guard plus ALL data fetching (profile identity, next upcoming booking, favorites count, saved Stripe payment methods, active vouchers, loyalty-stamp progress), passed down as plain props. `AccountHub` owns rendering + translation only, no client-side fetch, no interactive state (no tabs, no search, no sort).

Replaces the 2026-07-21 Pinterest-tabs hub (`ProfileTabs`, tab bar / search field / Sortieren pill / 3-photo collage grid / "Neu für dich" rail): FLOORS LAW 10 (every element must belong to the screen's job) killed the search bar, nobody searches their own saved list from the account hub. See `_design-system/REMOVED.md` for that removal's record.

---

## Public API

```ts
export interface AccountHubWalletCard {
  brand: string;
  last4: string;
}

export interface AccountHubProps {
  locale: string;
  avatarUrl: string | null;
  displayName: string;
  nextAppointment: { dateLabel: string; timeLabel: string } | null; // Buchungen subline, null = no upcoming booking
  favoritesCount: number;                 // Gespeichert subline
  wallet: AccountHubWalletCard[];          // Wallet subline, [] = no saved card
  activeVouchersCount: number;             // Gutscheine subline
  stamps: { collected: number; needed: number } | null; // Stempel subline + right-value badge
}
```

All translated strings are resolved inside this component via `useTranslations("profileHub")` (and `useTranslations("Profile")` for the shared `salonsCount` "{count} Store/Stores" ICU-plural string). The server only sends raw data (numbers, dates, brand/last4 strings).

---

## Anatomy (top to bottom)

1. **Header**: sentence-case eyebrow ("Konto") + 60px `Avatar` + the user's display name at 28px/700 (the screen's one FLOORS-LAW-6 display anchor).
2. **Buchungen group**: one row, links to `/profile/bookings`. Subline is the pre-formatted next-appointment date/time when one exists, else a real "view your bookings" fallback (never a fabricated date).
3. **Wallet group**: two rows. "Wallet" links to `/profile/settings/payment`, subline reuses `PaymentMethods.tsx`'s own "Endet auf {last4}" phrasing for one saved card, a count for 2+, or an "add a card" empty state. "Gutscheine" links to `/profile/vouchers`, subline is a real active-voucher count (mirrors `/api/profile/vouchers`'s own active filter) or an honest zero-state.
4. **Persönlich group**: three rows, Haarprofil (static descriptive subline, same pattern as `/profile/settings`'s "hubPersonalSub"), Gespeichert (real favorites count via the shared `Profile.salonsCount` "{count} Store/Stores" string), Stempel (real closest-to-reward progress, same selection rule as `/profile/stamps/page.tsx`'s heroCard, with a right-aligned "{collected}/{needed}" badge).
5. **Einstellungen group**: one row, no group eyebrow above it (matches the mockup), links to `/profile/settings`.
6. **Abmelden**: centered text link, `<form action="/api/auth/logout" method="post">` so it works without client JS (same pattern as `/profile/settings/page.tsx`'s own sign-out row).

Each row group is a bordered `rounded-[24px]` white card with `divide-y divide-s-border` between rows (the mockup's `card-flat` treatment), not `shadow-whisper` — the approved mockup uses a hairline border with no shadow, which is what is built here.

---

## Rows intentionally NOT wired (and why)

- **Meine Stylist:innen** (the mockup's "rebook with a past stylist" row): no real per-customer browse page exists for this in the current app (`npm run exists stylist` / `"favorite staff"` both came back empty except the unrelated homepage `FeaturedStylists` and a `/dev` route). Per this build's own rule ("a destination that doesn't exist doesn't get a row"), omitted rather than pointed at an invented page.
- **Nachrichten**: the customer messaging surface has been off since 2026-06-13 (owner); both routes that mention it (`/account/messages`, `/dashboard/messages`) are dead redirects back to `/profile` itself, not a real destination. Omitted.
- **Coupons → recomposed as Gutscheine**: the mockup's literal "Coupons"/`ticket-percent` row has no backing per-customer feature (`/api/promo` is salon-owner/admin facing, not a customer's-own-coupons list). The real existing feature in the same "wallet-adjacent spendable value" slot is Gutscheine/vouchers (`/profile/vouchers`, `Profile.vouchers` namespace, `GET /api/profile/vouchers`'s own "active" count), which is what this row links to and counts, keeping the `TicketPercent` icon since it still reads correctly for a discount/voucher concept.
- **Version footer** ("Solen v3.4.1" in the mockup): no real customer-facing app-version source exists (`package.json` is an internal dev version, `"0.1.0"`). Omitted rather than hardcoded.

---

## Do / Don't

### Do
- Keep every row's data real: a count, a date, a saved-card summary, all server-fetched. A row with no real data source loses its subline (falls back to an honest empty-state string) or is omitted entirely, never a fabricated value.
- Keep the `card-flat` grouping (bordered `rounded-[24px]`, `divide-y` rows) as the one grouped-row visual language on this screen.
- Route a NEW account-management link through this same grouped-row pattern, don't invent a second list style on this page.

### Don't
- Don't reintroduce a tab bar, search field, or photo-collage grid on `/profile` — that job now belongs entirely to `/profile/favorites` and `/profile/bookings`, which already compose the real `SalonCard`/`BookingsList` for their content (FLOORS LAW 8/9).
- Don't add a row whose destination doesn't exist yet (check via `npm run exists <keyword>` before wiring).
- Don't put a card's brand+last4 behind a decorative middot mask ("Visa ••4242") — this repo's no-separator gate bans it; reuse `PaymentMethods.tsx`'s own "Endet auf {last4}" phrasing instead.
- Don't use `text-transform:uppercase` + letter-spacing on the eyebrows — the no-caps gate and this project's own copy-economy rule both ban tracked-uppercase labels; sentence-case only (matches `/profile/settings`'s `SectionLabel`).

---

## Related

- **/profile/settings** (`SettingsForm.tsx`'s sibling `Row`/`SectionLabel`/`Hairline` pattern in `app/[locale]/profile/settings/page.tsx`): the closest existing sibling row-list, this component's eyebrow/sentence-case/`s-ink-2` conventions were composed from it rather than invented fresh.
- **PaymentMethods** (`profile/PaymentMethods.tsx`): the full saved-card list at `/profile/settings/payment`; this hub's Wallet row is a one-line summary of the same real data, using the shared `lib/payment-brand.ts` brand-name lookup.
- **/profile/favorites**, **/profile/bookings**, **/profile/stamps**, **/profile/haarprofil**, **/profile/vouchers**: the real destinations every row links to; none of this hub's content is duplicated there, each sub-page owns its own full detail view.
- **Avatar** ([Avatar.md](Avatar.md)): the 60px header identity avatar.
