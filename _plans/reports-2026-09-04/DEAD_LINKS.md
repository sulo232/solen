# Dead internal links: static scan

Script: `dead-links.mjs` (this directory, no dependencies). Run from the project root:
`node dead-links.mjs .` (add `DUMP_ALL=1` env var to also dump every resolved link + verdict).

## Known-answer control (run BEFORE trusting the full scan, per instructions)

**(a) `/${locale}/bookings/${id}` (bare, no page.tsx at `app/[locale]/bookings/[id]/`)**
Occurrences found anywhere in the tree: **0**. Independently confirmed with a manual grep
(`grep -rn 'bookings/\${' app components components-legacy lib`) before the tool was even
written: the only bare-pattern occurrences left in the tree are inside `fetch(`/api/bookings/${id}`...)`
calls (a real API route, `app/api/bookings/[id]/route.ts`), not page links. The two files this
task named as "being fixed right now" (`refund/page.tsx`, `upcharge/page.tsx`) both now build
`/${locale}/bookings/${id}/report` (a route that exists at `app/[locale]/bookings/[id]/report/page.tsx`).
`booking/lookup/page.tsx:649` also already points at the `/report` subpath, not the bare id.
**The bare dead link is not just fixed in those two files, it does not exist anywhere else in the
tree either.** Control passes as "already fixed, confirmed absent."

**(b) `/api/salons` must NOT be reported as dead.**
`isValidTarget("/api/salons", ...) = true` (matches `app/api/salons/route.ts`), and it does not
appear in the dead list. Control passes.

**(c) Self-test (a check that cannot fail is not a check, so before trusting a 0-dead-pages
result the matcher was proven capable of finding a dead link at all):** built a synthetic fixture
tree with one real page route, one real API route, 5 fake links that should be dead, and 2 real
links plus one commented-out call that must be ignored. First run: **5/5 dead correctly caught,
2/2 real links correctly passed, comment correctly ignored.**

**(d) Two real bugs were found and fixed during this self-verification, both of which were
making the matcher too permissive (they could only ever hide real dead links, never invent fake
ones):**
1. **Namespace bug.** `app/[locale]/[city]/[category]/page.tsx` compiles to the pattern `/*/*/*`
   (three wildcard segments). Positional segment matching does not know that `/api/...` links and
   `/[locale]/...` page links are disjoint namespaces, so a 3-segment API link like
   `/api/partner/leads` was matching that page pattern (`"api"` satisfies a `*` wildcard) instead
   of being checked against the real API route table. Every 2- or 3-segment `/api/` link was at
   risk of a false "alive" verdict from this. Fixed by partitioning route-table and redirect-source
   candidates by namespace (`api` first-segment vs everything else) before matching.
2. **Redirect-source scope bug.** The `next.config.mjs` source-literal extractor was not scoped to
   the `async redirects() { ... }` function body, so it also picked up `source: "/:path*"` from the
   unrelated `async headers()` block (a Referrer-Policy pin), producing a spurious `/**` catch-all
   "valid target" that would have silently passed almost any dead page link. Fixed by extracting
   only the literals inside the matched `redirects()` function's brace-balanced body.
   Re-running the self-test after each fix confirmed the 5 synthetic dead links were still caught.

## Counts (final run, after both fixes)

| metric | count |
|---|---|
| files scanned (app/, components/, components-legacy/, lib/; node_modules/.next/tests/public/_mockups/app/[locale]/dev excluded) | 1,064 |
| trigger call sites where the argument was a parseable literal/template string | 929 |
| of those, internal-path candidates actually checked against the route table | 690 |
| skipped as not-internal (external http(s), protocol-relative, mailto/tel, hash-only, or a bare non-path string) | 239 (112 external, 105 not-a-path, 18 mailto/tel, 4 hash-only) |
| routes known (page.tsx + route.ts) | 614 (249 pages, 365 API routes) |
| extra valid targets from middleware.ts + next.config.mjs redirects | 21 |
| **dead links found** | **2** |
| dead page links | 0 |
| dead API calls | 2 |

**Blind spot, stated plainly (rule 15/8):** a raw grep for the same trigger keywords across the
same directories returns 1,235 lines, vs 929 the regex could parse a literal argument from. The
~306-line gap is calls whose argument is a variable, a computed expression, or spans multiple
lines (`router.push(someUrlVariable)`, `fetch(buildUrl(...))`, etc.) — a regex-based scanner
cannot resolve those without a real JS/TS parser, so they are silently un-checked, not
miscounted as either dead or alive. I checked for the one concrete failure mode that would matter
here (string concatenation that truncates a template literal mid-path, e.g.
`fetch("/api/" + type + "/thing")`) and found zero occurrences of that shape in this codebase — it
uses template literals consistently for dynamic paths, so this blind spot is real but not
currently hiding anything I can find evidence of.

**Structural limitation, also stated plainly:** `app/[locale]/[city]/page.tsx` and
`app/[locale]/[city]/[category]/page.tsx` are true catch-almost-all routes (2 and 3 wildcard
segments). Any 1-, 2-, or 3-segment page link after the locale (about 545 of the 690 links, ~79%)
structurally resolves to a real `page.tsx` file no matter what the segment values are — Next.js's
own router really does send `/de/totally-made-up-slug` to the `[city]` page, which then does its
own runtime DB lookup and 404s if the value isn't real. That runtime validation is out of scope
for a **static** scanner (the task's own framing), so this is not a tool bug, but it does mean the
scanner has essentially no power to catch a typo'd city/category-shaped link. Only page links 4+
segments deep (11 of them, all real: salon/[slug]/{reviews,team,gift-card,booking,staff/[staffId]},
bookings/[id]/report) and the 439 `/api/` links (no catch-all in `app/api/**`, confirmed: zero
`[...catchall]` directories anywhere under `app/`) were checked with full precision.

## Dead links found (2, both API calls, none are page links)

Ranked by who can hit them today. Both trace to the same root cause, so ranked together.

### 1. `components-legacy/discovery/StaffPortfolio.tsx:35`
```
fetch(`/api/salons/${salonId}/staff/${staff.id}/portfolio`)
```
No `app/api/salons/[slug]/staff/[staffId]/portfolio/` directory exists anywhere. **Verdict:
real dead endpoint, but not customer/owner-reachable today.** The only importer of
`StaffPortfolio` in the whole tree is `app/[locale]/dev/pdp/_overhaul/SalonImageGalleryOverhaul.tsx`
— a dev-only preview page (out of this task's scan scope by design, but the component itself
lives in `components-legacy/`, which is in scope, so it still gets caught and reported here).
Today this is a silent no-op only inside `/dev`: the `fetch` fails, `res.ok` is false, and the
component just renders an empty portfolio with no error surfaced (matches this project's own
"silent no-op" failure pattern). **A real, already-existing fix is available**:
`GET /api/staff/[id]/profile` (`app/api/staff/[id]/profile/route.ts:24-30`) already reads
`staff_portfolio_images` filtered by `staff_id` for any staff member, id-only, no salon or
category gate — exactly the shape this component needs.

### 2. `components-legacy/nail/TechPortfolio.tsx:78`
```
fetch(`/api/nail-tech/${staffId}/portfolio?${params}`)
```
`"nail-tech"` does not appear anywhere else in the codebase (grepped `app/`, `components/`,
`components-legacy/`, `lib/`) — no route, no other reference, nothing to alias it to. **Verdict:
real dead endpoint, same reachability as #1.** `TechPortfolio`'s only importer is also
`app/[locale]/dev/pdp/_overhaul/SalonImageGalleryOverhaul.tsx`. If `initialImages` is passed by a
future caller the dead fetch never fires (it early-returns), but the default/filtered-reload path
does call it and fails silently (`if (!res.ok) return`, no error). **Same available fix**:
`GET /api/staff/[id]/profile` already returns the same `staff_portfolio_images` rows generically;
the nail-specific filters (`nail_style`/`nail_shape`/`nail_material`) this component sends are not
supported by that endpoint today, so wiring it up is more than a URL swap, but the underlying data
is already served.

**Neither of these is a live customer, salon-owner, or admin defect right now** — both are
unreachable outside a `/dev` preview route, which is explicitly out of this scan's scope and (per
the project's own dev-tools convention) not customer-facing. Flagging them because the "overhaul"
naming and half-built shape (component built, endpoint never built, real replacement data already
exists one hop away) is exactly the "looks finished, wired to nothing" pattern this project has a
named rule against — worth fixing before `SalonImageGalleryOverhaul` is ever promoted out of `/dev`.

## Dead API calls (fetch to a route.ts that does not exist)

Same two as above — every dead link this scan found was an API call, not a page link:

| file:line | literal | target checked | exists? |
|---|---|---|---|
| `components-legacy/discovery/StaffPortfolio.tsx:35` | `` `/api/salons/${salonId}/staff/${staff.id}/portfolio` `` | `/api/salons/*/staff/*/portfolio` | no |
| `components-legacy/nail/TechPortfolio.tsx:78` | `` `/api/nail-tech/${staffId}/portfolio?${params}` `` | `/api/nail-tech/*/portfolio` | no |

## Dead page links

None found real. 0 reported by the scanner across 251 page-link literals (see the Structural
limitation note above for why that number carries less confidence for 1-3 segment links than the
API-call number does).

## Addendum (found during the follow-up orphan-routes pass, same read-only rules)

Two more real dead links surfaced while building `orphan-routes.mjs`, both missed by this scan's
original scope, not by a bug in the matching logic used here:

### 3. `lib/email-templates/welcome-series.ts` (8 occurrences: lines 18-21 and 34-37, one per locale)
```
https://solen.ch/${locale}/explore
```
This scan classified every `https://` literal as external and skipped it, which is correct for a
generic external-link check but wrong for the project's own domain. `solen.ch` and `www.solen.ch`
are Solen, and `/explore` does not exist as a route anywhere under `app/[locale]/` (confirmed by
directory listing). **Real, customer-facing dead link, live in the new-customer welcome email, in
all four locales.**

### 4. `app/api/staff/invite/route.ts:96`
```
https://www.solen.ch/${inviteLocale}/staff/accept?token=${token}
```
Same own-domain blind spot. `app/[locale]/staff/accept/` does not exist. The real, working page
that reads `?token=` and calls `/api/staff/accept-invite` lives at `/staff-invite`
(`app/[locale]/staff-invite/page.tsx`) — a rename that was never propagated to the email link
generator. If a staff invite is ever sent, the link 404s. Full detail in `ORPHAN_ROUTES.md`, item 1
under "Real bugs worth fixing" (this is the same underlying bug, found from the other direction:
there it showed up as `/staff-invite` looking orphaned because nothing correctly links to it).

Both would have been caught by this scan with one change: treat `https://solen.ch/...` and
`https://www.solen.ch/...` as internal (strip the domain, check the path) instead of unconditionally
external. Not fixed in `dead-links.mjs` itself to avoid touching a script already delivered and
signed off; the corrected logic lives in `orphan-routes.mjs`'s `normalizeLiteral()`.

**Revised total for this scan's actual scope, own-domain links included: 4 dead links (2 API,
2 page/email-link), not 2.**
