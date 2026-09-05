# Fresha customer profile / account hub

Exists-check: net-new. No `fresha--profile.md` exists under `_design-system/references/`. The
closest existing files are Airbnb-side (`airbnb--profile-list.md`, `airbnb--profile-1to1-diff.md`),
neither is a Fresha capture. On the Solen side, `app/[locale]/profile/page.tsx` (175 lines) and
`app/[locale]/_components/profile/AccountHub.tsx` (325 lines) are the live implementation this
file feeds; both were read in full before writing this spec. Both already carry extensive
file-header comments describing the 2026-08-02 rebuild ("owner-approved grouped-row model"), which
this file cites directly rather than re-deriving from scratch.

## Identity

- Brand: Fresha. Surface: iOS customer app, "Profile" tab (bottom nav).
- Method: Mobbin MCP only, iOS platform. No live fresha.com capture attempted this pass. Every
  value below is a screen I looked at directly, tagged verified, expect, or assume.
- Capture date: 2026-09-05.
- Primary sources:
  - Profile hub root: https://mobbin.com/screens/146e83c9-c5a9-4e56-9e65-995766e57e9b (verified)
  - "My Profile" sub-page (addresses + terms + delete account):
    https://mobbin.com/screens/903d54e8-6a89-4528-9163-7f1612ce9946 (verified)
  - "My Profile" identity detail (name/mobile/email/DOB/gender, view mode):
    https://mobbin.com/screens/019436f5-91b2-4004-95e3-b377d96d6175 (verified)
  - "Edit profile details" sheet: https://mobbin.com/screens/060095f8-93c5-498e-b299-aa211a2a4eb6
    (verified)
  - Home screen (for the Favourites surfacing pattern, not the Profile tab itself):
    https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691 (verified)
  - "My Profile" with a save-toast: https://mobbin.com/screens/e67981b1-fe48-4bf8-b4f6-68d09f8883c6
    (verified)
  - "Settings" sub-page: https://mobbin.com/screens/f884d9eb-5adb-4d51-ad7e-22c6542ce7a1 (verified)

## Philosophy

Fresha's profile hub is a directory, not a dashboard: one identity card up top, then a flat,
ungrouped list of destinations, each a noun (Favourites, Vouchers, Gift cards, Memberships, Forms,
Orders, Payment methods, Settings), each leading to its own full page. Nothing on this screen
computes or summarizes anything (no counts, no next-appointment preview, no balances) except what
its own row's icon+label already implies. Language and Support sit apart from the main list, below
a gap, because they are not account data, they are escape hatches.

## Measured (ordered element list, iOS, top to bottom)

1. Top chrome: back arrow (left), "Profile" as a large bold headline directly under it, no title
   in the nav bar itself (verified).
2. Identity card: bordered rounded container, avatar circle (initials "JS" on a pale lavender
   fill) + name ("John Smith", bold) + a grey "Edit profile" subline directly under the name, the
   whole card reads as one tappable unit (no separate chevron drawn) (verified).
3. Below the identity card, a flat list of eight rows, each icon + label + trailing chevron, no
   group headers or dividers-with-labels between them, only a plain hairline between each row:
   Favourites (heart icon), Vouchers (ticket icon), Gift cards (gift-box icon), Memberships
   (repeat/loop icon), Forms (clipboard icon), Orders (bag icon), Payment methods (card icon),
   Settings (gear icon) (verified, this exact order and icon set).
4. Below the list, separated by a visible gap (not a hairline), two inline items on one row:
   "English" (globe icon) and "Support" (life-ring icon), both in the accent purple/blue used for
   links elsewhere in the app, i.e. these read as TEXT LINKS, not list rows with chevrons
   (verified).
5. Sub-page "Settings" (reached from the Settings row): Social logins, Notifications, Language,
   Privacy policy, Terms of service, Terms of use (external-link arrow icons on the last three,
   plain chevrons on the first three), then two centred buttons, "Sign out" (outline) and "Delete
   account" (red text, no fill), then a small grey "App version 3.8.2 (43)" footer line (verified).
6. Sub-page "My Profile" (a SEPARATE screen from the hub root, reached some other way, tag: assume
   from the "Payment methods" or an "Account" affordance not directly captured this pass): a "My
   addresses" section (Home/Work rows, each its own bordered card with a house/briefcase icon +
   "Add a ... address" placeholder text, plus a standalone "+ Add" pill button), then "Terms and
   policies" (Privacy policy / Terms of service / Terms of use, each with an external-link arrow),
   then "Delete account" (headline + one-line subline + a red-bordered "Delete my account" button)
   (verified, content only; how a customer navigates TO this screen from the hub root above was
   not traced this pass).
7. Identity detail screen (also reached from "My Profile" or the identity card, tag: assume):
   large avatar with a small edit-pencil badge, name, then a plain field list, First name / Last
   name / Mobile number / Email / Date of birth / Gender, each showing its current value in grey
   under a bold label, "Edit" as a single top-right link rather than per-field edit icons
   (verified). Tapping Edit opens a bottom sheet with the same fields as real inputs plus a full-
   width "Save" button (verified, `060095f8`).
8. Adjacent pattern worth noting (not part of the Profile tab itself): the Home screen surfaces a
   horizontally-scrolling "Favourites" rail (photo card + a filled heart badge top-right of the
   photo + rating + name + one category chip) directly under a "Book again" card, i.e. favourites
   are ALSO surfaced on Home, not only reachable via the Profile row (verified, `781cf27c`).

## Port map (Fresha element -> Solen file)

- Whole screen -> `app/[locale]/profile/page.tsx` (server component, auth-guarded, fetches profile
  identity + next booking + favorites count + Stripe payment methods + active vouchers + loyalty
  stamp progress in parallel) feeding `AccountHub.tsx` (client component, 325 lines).
- Fresha's identity card (avatar + name + "Edit profile" link) -> `AccountHub.tsx` already renders
  this exact anatomy at its own top (avatar, `displayName`, an edit link to `/profile/edit`,
  around line 158-164).
- Fresha's flat eight-row list -> `AccountHub.tsx` does NOT use a flat list; it groups rows under
  three labelled eyebrows read from the file's own header comment and confirmed by grep:
  **Buchungen** (`GroupLabel` + one row -> `/profile/bookings`, subline = the real next-appointment
  date or an empty-state string, never fabricated), **Wallet** (`/profile/settings/payment` for
  saved cards + `/profile/vouchers` for active voucher count), **Persönlich** (`/profile/haarprofil`
  hair profile, `/profile/favorites` saved salons, `/profile/stamps` loyalty progress), then a
  separate **Settings** row (`/profile/settings`) and a **Sign out** action. This is a genuine
  structural difference: Fresha's flat list vs. Solen's three labelled groups plus live data
  sublines (Fresha shows no sublines/counts on its rows at all, per the captures above).
- Fresha's "Gift cards" row -> Solen's `app/[locale]/profile/gift-cards/page.tsx` exists as a file
  but its entire body is a redirect back to `/profile`, with its own comment: "Gift cards HIDDEN
  from customers (owner, 2026-06-14)... Reversible... gift_cards backend + /api/gift-cards/* stay
  intact." This is a DELIBERATE kill, not a missing feature. See Conflicts.
- Fresha's "Vouchers" row -> Solen already has `/profile/vouchers` and surfaces an active-voucher
  count subline on its own "Wallet" group's second row (`AccountHub.tsx` line 180), so this one is
  already ported, just grouped differently than Fresha's flat list.
- Fresha's "Memberships" and "Orders" rows -> no direct Solen analog found in this pass; out of
  scope for this timebox to confirm whether either concept exists under another name.
- Fresha's "Forms" row -> Solen has `/profile/intake-forms` as a route (found via directory
  listing) but it was not traced into `AccountHub.tsx`'s current row set in this pass; tag: assume
  it may not yet be linked from the hub itself, worth a follow-up existence check before assuming
  it is wired.
- Fresha's bottom "English" + "Support" text-link row -> not present as a bottom-of-hub pattern in
  `AccountHub.tsx` from this pass; Solen's language switch and support entry points were not
  traced to a location on this specific screen.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [flat list vs. grouped rows]: Fresha's profile hub is one ungrouped list of eight
  destinations. Solen's `AccountHub.tsx` deliberately groups rows under three eyebrow labels
  (Buchungen/Wallet/Persönlich) plus a separate Settings row, a decision the file's own header
  comment ties to FLOORS LAW 10 ("every element belongs to the screen's job") and a measured
  type-budget pass (its own comment: "~65% of visible text at weight >=600" for name + 4 group
  labels). Un-grouping to match Fresha flat-for-flat would undo a dated, reasoned decision. Owner
  call, mockup first.
- CONFLICT [Gift cards]: Fresha shows Gift cards as a normal profile row. Solen's owner explicitly
  hid gift cards from customers on 2026-06-14 (`profile/gift-cards/page.tsx`'s own comment,
  reversible by design). Porting Fresha's row here would directly contradict a named, dated,
  reversible owner decision. Do not re-add without his yes by name, per the exists-check protocol's
  graveyard rule.
- CONFLICT [no sublines on Fresha's rows]: every Fresha row in this capture shows only an icon and
  a label, no live-data subline. Solen's Buchungen/Wallet/Vouchers rows already show real
  sublines (next appointment date, saved-card brand+last4, active voucher count), which is this
  repo's own no-fabrication-forward pattern (real data or an honest empty string, per
  `AccountHub.tsx`'s own comments on `favoritesCount`/`activeVouchersCount` never being fabricated).
  Removing these sublines to match Fresha's plainer look would be a regression against a rule
  already enforced here, not a neutral style choice. Keep the sublines; Fresha's plainness is not
  a floor this repo is missing.
- No conflict on "Edit profile" as a single link rather than per-field edit icons: Solen's
  `/profile/edit` route already matches this pattern (one edit entry point, not per-field icons),
  confirmed by the route existing in the profile directory listing, though its internal anatomy
  was not opened in this pass.
