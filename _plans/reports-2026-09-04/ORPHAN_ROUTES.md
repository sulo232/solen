# Orphan pages: static scan

Script: `orphan-routes.mjs` (this directory, no dependencies, reuses and extends the route-table
and link-extraction logic from `dead-links.mjs`, built for the earlier dead-links pass). Run from
the project root: `node orphan-routes.mjs .` (`DUMP_ALL=1` dumps every link + match too).

Question asked: every `page.tsx` under `app/[locale]` (excluding `app/[locale]/dev` and API
routes) that NO link, redirect, `router.push`/`replace`, or middleware/next.config rewrite
anywhere in the tree points at, treating `lib/email*`, `lib/notifications*`, `lib/sms*`, and every
other `.ts` under `lib/` as valid inbound-link sources.

## Known-answer control

`/{locale}/confirmation` must NOT appear as an orphan. **Passes**, but only after two real bugs in
the matcher were found and fixed while chasing it down (see "Bugs found" below) — the control
caught a genuine problem, not a formality. Final resolution: real evidence at
`app/[locale]/bookings/[id]/refund/page.tsx:48` and `.../upcharge/page.tsx:52`, both
`const receiptHref = isGuest ? undefined : \`/${locale}/confirmation?booking_id=${id}\`;` — a
ternary-assigned, `Href`-suffixed variable, which needed a second, looser trigger pattern
(any `...Url`/`...Href`/`...Link`/`...Path`-suffixed variable or object property) beyond the
strict `href=`/`router.push(`/etc. trigger set carried over from `dead-links.mjs`.

## Counts

| metric | count |
|---|---|
| files scanned (app/, components/, components-legacy/, lib/) | 1,064 |
| trigger call sites with a parseable literal/template argument | 1,175 |
| internal-path candidates checked (after dropping external/mailto/hash/empty) | 1,011 |
| of those, page-shaped (non-`/api/`) links | 570 |
| page routes known (`app/[locale]/**/page.tsx`, excluding `/dev`) | 140 |
| redirect/rewrite destinations counted as inbound links (middleware.ts + next.config.mjs) | 15 |
| **raw orphans reported by the script** | **32** |
| of those, confirmed **false positives** by manual follow-up (real link exists, tool missed it) | 10 |
| of those, confirmed **real** (leftover, intentional stub, gap, or bug) | 22 |

## Bugs found and fixed while building this (each re-verified against a self-test before trusting the real run)

1. **Namespace bug** (inherited starting point, same fix as the dead-links pass): `/api/` links
   could match page-route wildcard patterns. Fixed by namespacing candidates the matcher checks.
2. **Wildcard-direction bug (new to this pass).** The original bidirectional matching (a link
   wildcard satisfies ANY route segment, including a route's fixed literal) produced a **false
   "not orphan"**: `CategoryTabs.tsx`'s `href={\`/de/${slug}\`}` (a homepage category nav,
   `slug` ∈ {coiffeur, nails, barbershop, spa}) was matching the completely unrelated
   `/*/confirmation` route, because both sides carry exactly one wildcard, just in different
   positions. Fixed: a link-side wildcard now only satisfies a route's OWN dynamic segment, never
   a route's fixed literal name. Re-checked against the self-test after the fix; still passed, and
   the false confirmation-match was gone.
3. **Missed trigger: object-literal `href:` (colon), not just JSX `href=` (equals) — the single
   highest-value fix.** `components-legacy/dashboard/DashboardLayout.tsx` defines ~50 sidebar nav
   entries as plain data objects: `{ key: "approvals", href: "/dashboard/approvals", icon: ... }`.
   The trigger regex only matched `href\s*=`, so it silently missed every single one — this alone
   accounted for 45 of a first pass's 77 false "orphans" (nearly the entire `/dashboard/**`
   surface, obviously reachable from its own sidebar). **This same bug is present in the original
   `dead-links.mjs`, meaning the earlier DEAD_LINKS.md report never actually checked any of these
   ~50 literal hrefs either** — worth a note there too, addressed below.
4. **Missed the "middleware auto-locale-prefixes a bare path" case for reverse matching.** Once #3
   recovered the literal `"/dashboard/all-salons"` values, the dashboard `<Link>` components still
   render them as `href={\`/${locale}${href}\`}` — two back-to-back interpolations with no literal
   `/` between them, which a per-segment text splitter can't separate into "locale" + "the rest".
   `dead-links.mjs` already had a fallback for this shape (bare non-`/api` link, try again with a
   locale wildcard prepended); this pass had not ported it over. Added it — dropped the orphan
   count from 77 to 32.

## What the tool still cannot see (found and individually verified by hand, not automated)

Two more classes of real link the static matcher cannot resolve, each confirmed by opening the
actual source rather than trusted blind:

- **A local per-file `p = (path) => \`/${locale}${path}\`` helper**, called as `p("/literal")`.
  Exists in exactly two files (`app/[locale]/_components/profile/AccountHub.tsx:110` and
  `app/[locale]/profile/settings/page.tsx:80`, the second with a `/profile/settings`-relative
  variant). Too bespoke/local a naming convention to safely generalize into the regex without
  false-positive risk elsewhere, so left as a documented blind spot and resolved by hand instead
  — this clears 8 of the 32 raw orphans (see the profile/settings cluster below).
- **A trigger call whose literal argument sits on a different LINE than the trigger keyword**, e.g.
  `components-legacy/salon/SalonWalkInPanel.tsx:155-156`:
  ```
  const joinHref = (serviceId: string) =>
    \`/${locale}/walk-in-pay?salon_id=${salonId}&service_id=${serviceId}...\`;
  ```
  A line-based regex scanner cannot see across that line break. Clears `/walk-in-pay`.
- **Supabase's own `resetPasswordForEmail` `redirectTo` parameter**
  (`app/api/auth/login/route.ts:52`, `redirectTo: \`${origin}/${locale}/auth/reset-password\``) —
  a real inbound link, sent in Supabase's own transactional email, that my `Url`/`Href`/`Link`/
  `Path` naming-convention trigger doesn't cover (`redirectTo` doesn't end in any of those).
  Clears `/auth/reset-password`.

## The 22 real orphans, classified (customer-facing first, then salon-owner/admin)

### Real bugs worth fixing (2, customer-facing, high confidence)

1. **`app/[locale]/staff-invite/page.tsx`** — genuinely unreachable, and here's why it matters: the
   staff-invite EMAIL (`app/api/staff/invite/route.ts:96`) sends
   `` `https://www.solen.ch/${inviteLocale}/staff/accept?token=${token}` `` — but
   `app/[locale]/staff/accept/` **does not exist anywhere in the tree** (confirmed by directory
   listing). The real, working page that reads `?token=` and calls
   `POST /api/staff/accept-invite` lives at `/staff-invite`, not `/staff/accept`. This is a rename
   that didn't propagate: the page was built/renamed at `/staff-invite`, the email link generator
   was never updated to match. If an invite is ever sent, the recipient's link 404s. (This also
   means the earlier `middleware.ts` comment about "zero invites ever sent" is not just a low-usage
   fact — the invite link has apparently never worked, and no one hit it.) **Not part of the
   original dead-links pass's scope** (that scan's `https://` literals were classified external and
   skipped) — found only through this orphan follow-up.
2. **`app/[locale]/booking-action/page.tsx`** — a real, fully-built landing page: reads a `token`
   query param and calls `POST /api/bookings/[id]/quick-action` (which exists), clearly designed as
   a one-tap SMS/email "confirm or cancel" action link (per `lib/bookings/customer-cancel-money.ts:7`,
   "HMAC quick-action link"). But nothing anywhere in `app/`, `components/`, `components-legacy/`,
   or `lib/` constructs a `/booking-action?...` URL to actually send. Backend and landing page are
   both built; the "send the customer the link" step is missing. Half-landed, matches this
   project's own named failure pattern.

### Confirmed real leftover (1, self-documented)

3. **`app/[locale]/profile/settings/personal/page.tsx`** — genuinely orphaned, and the codebase
   already knows it: `SettingsForm.tsx:330` says *"'personal' (/profile/settings/personal): kept
   unreferenced (2026-07-21, merged into ..."* — merged into `/profile/edit`. Dead code that should
   probably be deleted, not a bug (nothing points at it on purpose).

### Superseded by a different mechanism (1)

4. **`app/[locale]/referral/[code]/page.tsx`** — built as a landing page (per
   `lib/referral/storage.ts`'s comment, it stashes the code client-side), but the ACTUAL "copy your
   referral link" button (`app/[locale]/profile/referral/page.tsx:31`) generates
   `` `${origin}/${locale}?ref=${code}` `` — the home page plus a query param, not this route. The
   two mechanisms coexist; only the query-param one is wired to anything a customer can copy.

### Deliberate deep-link / QR entry point, generation site not found (1)

5. **`app/[locale]/walk-in-tip/[token]/page.tsx`** — self-documented in its own header comment as
   a "QR / shared link target", a deliberate standalone entry point (the in-app tip flow opens the
   same sheet without navigating here). I could not find the code that actually generates or prints
   this URL anywhere in the scanned tree (unlike the loyalty QR, which has an explicit
   `lib/barber/loyalty-qr.ts` generator) — worth a follow-up check for whether that generation step
   exists outside this scan's scope (e.g. a printed in-salon QR asset) or was never built.

### Unclear purpose / possibly abandoned, zero inbound evidence found (3)

6. **`app/[locale]/brand/[slug]/page.tsx`** — calls a real API (`/api/brand/${slug}`), but nothing
   in the customer, dashboard, or admin UI links to it anywhere I can find. Purpose not evident
   from the code alone (a stylist/salon "personal brand" page, never wired to any listing?).
7. **`app/[locale]/inspo/board/[id]/page.tsx`** — `components-legacy/nail/InspoBoard.tsx` manages
   boards via `/api/nail-inspo/boards` (list/create/delete) but has no click-through to a board's
   own detail page; nothing else references `inspo/board/`. Looks half-built the same way as #2.
8. **`app/[locale]/inspo/saved/[id]/page.tsx`** — confirmed NOT how the saved list actually
   navigates: `app/[locale]/inspo/saved/page.tsx:43` sends an item click to
   `` `/${locale}/inspo/${item.id}` `` (the general item view), never to
   `inspo/saved/${item.id}`. A built but unused duplicate route.

### Intentional redirect/alias stubs — working as designed, not bugs (6)

9. `app/[locale]/account/messages/page.tsx` — self-documented: customer messaging turned OFF
   (owner, 2026-06-13); this page exists only to bounce a bookmarked URL back to `/profile`.
10. `app/[locale]/auth/signup/page.tsx` — a one-line `redirect()` to `/auth/register` (compat alias
    for anyone who types or links `/signup`).
11. `app/[locale]/inspo/nails/page.tsx` — `permanentRedirect()` alias to `/inspo?category=nails`.
12. `app/[locale]/termine/page.tsx` — self-documented "Q9 lock 2026-04-22: /termine → canonical
    /profile/bookings" alias (German word for "appointments", kept for old links/bookmarks).
13. `app/[locale]/tos/page.tsx` — one-line `redirect()` to `/terms` (compat alias; the real,
    linked terms page is `/agb`, confirmed reachable via `profile/settings/page.tsx:123` and
    `sitemap.ts`).
14. `app/[locale]/walk-in-join/page.tsx` — the standout: its own header comment literally says
    **"Orphaned route (audit #12): nothing links here"**, explaining the walk-in flow moved to
    salon page → `/walk-in-pay` → `/queue/[token]` and the old screen even rendered broken. Already
    known, already handled (redirects to home). Strong independent confirmation this scan is
    finding real things, not noise.

### Intentional feature-pause / hide (owner decision, dated) (2)

15. `app/[locale]/profile/gift-cards/page.tsx` — self-documented: "Gift cards HIDDEN from
    customers (owner, 2026-06-14)", reversible via git history, backend + `/api/gift-cards/*` left
    intact on purpose.
16. `app/[locale]/vouchers/buy/page.tsx` — self-documented: "HIDDEN from customers (owner,
    2026-06-14)" — same day as gift-cards, same pattern.

### Intentional feature stub, waiting on backend (1)

17. `app/[locale]/profile/looks/page.tsx` — self-documented: "Looks data model is TBD per
    BACKEND_NEEDS_UI"; renders only the empty state until the looks table exists. Not linked
    anywhere on purpose (nothing to link to yet).

### Salon-owner / admin: real pages, no nav entry found (3)

18. `app/[locale]/dashboard/earnings/page.tsx` — a real, fully-built payouts view (uses the
    standard `DashboardLayout` shell). Not present in any of `ADMIN_NAV`, `OWNER_NAV_GROUPS`,
    `STAFF_NAV`, or `RAIL_NAV` in `components-legacy/dashboard/DashboardLayout.tsx`, nor anywhere
    else I found. Navigation gap on an otherwise-finished page.
19. `app/[locale]/dashboard/help-editor/page.tsx` — same situation: a real, built help-article
    editor with no nav entry anywhere in the sidebar config.
20. `app/[locale]/dashboard/products/page.tsx` — same situation, and its own header comment
    ("exists-check: net-new page... `npm run exists products` found NO general dashboard
    products/inventory route") confirms it was recently, deliberately built as new — reads like the
    nav-wiring step just hasn't happened yet.

### Salon-owner: deliberately bypasses the nav shell (1)

21. `app/[locale]/dashboard/queue-display/page.tsx` — `DashboardLayout.tsx:476`'s own comment
    names it as one of "5 [pages that] bypass the shell entirely (editor, messages, gallery, setup,
    queue-display)". Reads as a kiosk/TV screen meant to be opened directly on a dedicated
    in-salon display, not navigated to from the sidebar — consistent with the task's "entry point
    reached only by direct URL" category, though I could not confirm who actually opens it (no
    generation/bookmark code found, same caveat as walk-in-tip above).

### Salon-owner (dashboard): dead-end redirect stub (1)

22. `app/[locale]/dashboard/messages/page.tsx` — the salon-side twin of #9: self-documented,
    messaging OFF (owner, 2026-06-13), redirects any stray hit to `/dashboard`.

## The 10 false positives (real links exist; listed for completeness, not orphans)

`/*/profile/settings` (hub), `/*/profile/settings/payment`, `/*/profile/settings/password`,
`/*/profile/settings/beauty`, `/*/profile/settings/notifications`, `/*/profile/settings/language`,
`/*/profile/settings/delete`, `/*/profile/vouchers` — all reached via the two local `p()`
locale-prefix helpers in `AccountHub.tsx` and `profile/settings/page.tsx` (see above).
`/*/walk-in-pay` — reached via `SalonWalkInPanel.tsx:155-156`'s `joinHref`, split across two lines.
`/*/auth/reset-password` — reached via Supabase's own `redirectTo` email parameter.

## Addendum: this also found a gap in the earlier DEAD_LINKS.md deliverable

Two things turned up while building this that materially affect the accuracy of the prior
dead-links pass, worth flagging even though outside this task's direct ask:

- **The `href:` (colon) vs `href=` (equals) trigger gap (bug #3 above) exists in `dead-links.mjs`
  too**, unchanged since that pass. It means the ~50 dashboard nav literals were never actually
  checked for dead targets in the original report. I spot-checked all of them against the real
  `app/[locale]/dashboard/**` directory listing while investigating this pass and found no dead
  ones among them, but that was a manual check, not a re-run of the (unpatched) original tool.
- **`https://solen.ch/...` and `https://www.solen.ch/...` absolute links were classified
  "external" and skipped entirely** in the original dead-links scan, which is correct for a
  generic external-link check but wrong here: `lib/email-templates/welcome-series.ts` (lines
  18-21, 34-37, 50-53) sends the new-customer welcome email with a CTA linking to
  `` https://solen.ch/{locale}/explore `` in all four locales (8 occurrences). **`/explore` does
  not exist as a route anywhere under `app/[locale]/`** (confirmed by directory listing) — this is
  a real, customer-facing dead link in a live onboarding email, missed by the original pass's scope
  boundary, not by a bug in this task's ask.
