<!-- exists-check: net-new AS A FILE, but explicitly NOT net-new as research: `airbnb--profile-list.md`
     (268 lines) already did a deep PIL pixel-measurement pass on the Profile tab root and the
     "Account settings" sub-page from five owner-supplied screenshots, and `airbnb--profile-1to1-diff.md`
     did a 1:1 structural diff of that same profile chrome against Solen's own `/profile`. Neither
     file opens the PAYMENT-METHODS screen, which this wave's task explicitly asks for. Rather than
     re-measuring what those two files already nailed down at real device resolution (which this
     pass, sourced from Mobbin thumbnails, cannot beat), this file CITES their numbers directly for
     the profile half and adds new Mobbin-sourced material only for the payment-methods half. -->

# Airbnb, profile / account hub and payment methods (mobile)

REF: airbnb / ios / profile-tab + payment-methods / mixed sources, see per-section notes

## Identity

- **Brand / platform / surface:** Airbnb, iOS app. Two surfaces: (1) the Profile tab root and its
  Account settings sub-page, and (2) the payment-methods screen reached from account settings.
- **Sources:**
  - Profile tab root + Account settings: `airbnb--profile-list.md` (this repo, captured
    2026-08-02 from five owner-supplied iPhone screenshots at confirmed 1206x2622px / 3.0x scale,
    PIL pixel-sampled). Cited, not re-measured, in the "Measured, profile (cited)" section below.
  - Payment methods, "Add a payment method" flow: Mobbin MCP, iOS platform, this pass
    (2026-09-05). `https://www.airbnb.com/account-settings/payment-methods` and equivalent iOS
    screens require a signed-in session, so this half is Mobbin-only, exactly as this task's own
    instructions anticipated for a login-gated surface.
  - Checkout payment-method ROW (as it appears mid-flow, for comparison to the dedicated
    payment-methods screen): Mobbin, same pass.
- **Method for the new (payment) half:** Mobbin screens viewed directly, plus local PIL
  colour-sampling on the downloaded thumbnails (299x678px, scale-invariant colour only, see
  `airbnb--trips.md`'s own note on why absolute pt values are not claimed from these thumbnails).
- **Date:** 2026-09-05 (payment half); 2026-08-02 (profile half, cited).

## Philosophy

Airbnb keeps "who I am" (profile) and "how I pay" (payment methods) in entirely separate places,
and the payment-methods screen itself carries no brand personality at all: three plain radio rows
(PayPal, Credit or debit card, Bank Account), each just an icon, a label, and the card networks it
accepts, no marketing copy, no recommended option pre-selected beyond whatever was previously
chosen. The one place personality reappears is the COMMIT button at the bottom of this screen,
which changes colour to match whichever method is selected, PayPal blue for PayPal, otherwise
Airbnb's own black/ink "Next". Brand colour, on this screen, belongs to the payment NETWORK being
connected, not to Airbnb itself.

## Measured, profile tab + account settings (cited from `airbnb--profile-list.md`, not re-measured)

Full numbers live in that file; the load-bearing ones for a profile/payments spec, repeated here so
this file is self-contained:

| element | value | source tag |
|---|---|---|
| row pitch, within a group (chevron-top to chevron-top) | 168px measured = **56.0pt** exactly, zero variance across 19 rows spanning 2 screens | verified (PIL, `airbnb--profile-list.md`) |
| divider between groups | 1 divider, 3px = **1.0pt**, colour **#EBEBEB**, 24pt inset both sides | verified (PIL) |
| divider WITHIN a group | **zero**, no line between adjacent rows in the same group | verified (PIL) |
| icon tile / background behind a row icon | **none**, bare icon on white, no grey square | verified (PIL) |
| label left inset | 64.3-65.3pt from the screen edge, fixed regardless of icon glyph width | verified (PIL) |
| chevron | present on every navigating row, absent on "Log out" (an action, not a destination) | verified (PIL) |
| back-button circle | 39.7pt diameter (~40pt), bg **#F2F2F2** | verified (PIL) |
| banner card corner radius (e.g. "Confirm your email") | narrowed to 16-18pt, not pinned to one exact value | verified (PIL, approximate) |
| screen margin | 24.0pt, agrees across banner/divider/chevron-inset | verified (PIL) |
| row list on the Profile tab root, in order | Account settings, Get help, View profile, Privacy (group 1) / Refer a host, Find a co-host, Legal, Log out (group 2) | verified (PIL, visual) |
| "Payments" row (icon left-edge inset) | starts at 74px = 24.7pt, one of four icons sharing that inset (Payments/Translation/Booking/Travel), distinct from the other four icons (Personal info/Login&security/Privacy/Taxes) which start 79-80px | verified (PIL), this is the one existing measured fact in this repo naming a "Payments" ROW specifically, though not the payment-methods SCREEN it opens |
| exact font family / weight tokens | **not resolved**, PIL cannot read a font's weight axis; that file's own numbers are comparative stroke-width ratios, not confirmed weight values | stated as a gap in the source file, repeated here so it is not silently upgraded to "verified" by appearing in a new document |

## Measured, "Add a payment method" screen (new, Mobbin, this pass)

1. Top chrome: back arrow (left), an X close icon (right), same row; page title "Add a payment
   method" as a large bold headline directly under that row, not in the nav bar (verified,
   [099d265e](https://mobbin.com/screens/099d265e-972d-48e4-a440-6d2544972adf)).
2. Three rows inside ONE bordered card (not three separate cards): PayPal (its own blue "P" mark),
   "Credit or debit card" (a generic card-outline icon + a row of small network logos: Visa,
   Mastercard, Amex, Discover), "Bank Account" (a bank/institution icon). Each row ends in a
   circular radio control, right-aligned (verified, same screen).
3. Hairline dividers appear BETWEEN these three rows (unlike the Profile-tab list above, which has
   zero divider within a group); tag: assume this is because these three rows are mutually
   exclusive CHOICES (a radio group), not independent navigable destinations, so Airbnb draws a
   line between choices but not between destinations (verified for the divider's presence, assume
   for the reasoning).
4. Below the card, a segmented progress-bar (three equal segments, one filled) sits well below the
   card with a large gap, then a single full-width sticky button at the very bottom: "Next" when
   Credit/debit is selected (plain black fill), or "Connect to PayPal" (blue fill, matching the
   PayPal brand mark) when PayPal is selected (verified, both states,
   [099d265e](https://mobbin.com/screens/099d265e-972d-48e4-a440-6d2544972adf) and
   [a26b8f18](https://mobbin.com/screens/a26b8f18-74db-44a3-98d0-016467819b31)).
5. Selecting "Credit or debit card" and continuing opens a bottom sheet, "Add card details": card
   number field (with a small card-glyph icon, right-aligned) as the largest/topmost input,
   Expiration + CVV side by side below it, then Zip code, then Country/region (a dropdown showing
   the current value inline, not a placeholder), then "Cancel" (text, left) / "Done" (filled black
   pill, right) on one row, with the OS numeric keypad docked below (verified,
   [94c7d0f2](https://mobbin.com/screens/94c7d0f2-a7e0-42cb-b7b4-56a5d7f1b871)).

## Measured, payment method as it appears mid-checkout (comparison point, not the dedicated screen)

On both "Confirm and pay" (Experiences) and "Request to book" (Homes), the payment method the
guest already has on file renders as a single ROW, not the three-choice picker above: a small
brand-mark icon (Mastercard's two overlapping circles seen in both captures) + "Debit 4320" +
a trailing chevron, sitting inside the same bordered-card rhythm as the other summary rows on that
screen (Date, Guests, Total price, "When you'll pay") (verified,
[2b107f4d](https://mobbin.com/screens/2b107f4d-f7bd-445d-9af6-d219d5970119),
[529b27e1](https://mobbin.com/screens/529b27e1-bea3-4602-8c84-9365b9938d8b)). Tapping this row is
presumed (not directly captured) to be the entry point back into the three-choice picker above.

## Measured, interaction colour (PIL-sampled, thumbnails 299x678px, colour is scale-invariant)

| element | sampled RGB | hex | read |
|---|---|---|---|
| "Connect to PayPal" button, 3 x-positions | `(12,51,134)` / `(2,44,123)` / `(12,51,136)` | ~`#0C3386` | flat solid dark blue, no gradient detected across the button width |
| Radio dot, selected (Credit/debit row) | `(31,28,29)` | `#1F1C1D` | near-black fill, matches the plain-ink radio style used elsewhere in Airbnb's forms |
| Radio dot, unselected (PayPal row in the same capture) | `(255,253,254)` | `#FFFDFE` | plain white/unfilled outline circle, as expected |

## Not measured

- Exact px/pt sizes for the payment-methods screen's type, row height, radius, and padding. Only
  Mobbin's scaled thumbnails were available for this surface (a genuine login-gated page this pass
  was told to source from Mobbin rather than a live logged-in session), and their resolution does
  not map to a confirmed device-point scale the way the five owner-supplied screenshots behind
  `airbnb--profile-list.md` did. Where this screen likely shares a component with the
  already-measured Profile-tab list (e.g. the 56.0pt row pitch, the bare-icon-no-tile styling), that
  is flagged as expect, not claimed as freshly verified.
- Whether "Bank Account" as a payment method ties into a full flow beyond this one row; not
  explored further, out of scope for a profile/payments anatomy capture.
- The exact mechanism/asset for the little sliding colour change on the sticky button when the
  radio selection changes (an instant swap vs. an animated cross-fade); these are static images,
  no motion data available.

## Port map (Airbnb value -> Solen surface)

- Airbnb's Profile-tab root (identity block + grouped, chevron-driven destinations) -> Solen's
  `AccountHub.tsx`, already diffed 1:1 against this exact Airbnb chrome in
  `airbnb--profile-1to1-diff.md`; that file's findings are the authoritative port map for the
  profile HALF of this document and are not repeated here.
- Airbnb's dedicated "Add a payment method" screen (three-way radio choice: PayPal / Credit-debit /
  Bank account) -> Solen's `/profile/settings/payment` route (confirmed to exist and to be the
  target of `AccountHub.tsx`'s "Wallet" row, per `fresha--profile.md`'s port map); this file's
  internal anatomy was not opened in this pass to compare row-for-row.
- Airbnb's payment-method-as-a-row-inside-checkout (icon + "Debit 4320" + chevron) -> directly
  comparable to Fresha's own payment-method row inside "Review and confirm"
  (`fresha--payment-step.md`, item 10): both brands show the SAME shape (icon + current method +
  affordance to change) at the same moment in the flow, which is useful convergent evidence for
  whatever Solen's own `PayConfirmStep.tsx` payment-method selector should look like, independent
  of which single brand is being copied.
- PayPal's brand-blue CTA appearing only when PayPal is the selected method -> no Solen analog;
  Solen does not currently offer PayPal as a payment method (not confirmed searched this pass,
  named as an open question rather than assumed absent).

## Conflicts (Airbnb placement vs a Solen lock)

- **CONFLICT [radio dividers vs. Solen's own grouped-list convention]:** Airbnb draws a hairline
  between the three PAYMENT-METHOD radio rows but draws NONE between destination rows on the
  Profile tab (per the cited numbers above). Solen's LOCKED radius/card table (CLAUDE.md design
  contract, "radius" row) instead keys card treatment to whether rows are one CATEGORY-grouped list
  (radius 24, one card) or individual entity cards; it does not currently distinguish "a radio
  CHOICE group" from "a destination list" as Airbnb's divider behaviour implies it should. Not a
  hard conflict, a genuinely new distinction worth flagging before any payment-method screen work
  starts, since it is not obviously covered by the existing lock.
- **CONFLICT [brand-coloured CTA on PayPal selection]:** Airbnb's sticky button turns PayPal-blue
  when PayPal is selected. Solen's taste rule 3 locks the one commit CTA to ink, with the accent
  blue (`s-accent`) reserved for small clickable text/chips, never a big CTA, regardless of which
  payment network is chosen. If Solen ever adds PayPal (or a similarly branded method), porting
  Airbnb's colour-swap CTA directly would break this lock. Owner call if that day comes; not an
  action item today since PayPal is not confirmed to exist in Solen's payment stack.
- No conflict on the row anatomy itself (icon + label + trailing control, bare icon with no tile,
  hairline as the only real divider unit): this already matches Solen's own locked list-row grammar
  closely enough that `airbnb--profile-1to1-diff.md` found no anatomy-level gap worth flagging on
  the destination-list half of this screen family.
