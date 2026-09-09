# Solen.ch Security Rules

> Re-reviewed 2026-07-07, content verified against live code.

## 11. 🔒 SECURITY RULES FOR API CONTRACTS

> **CONTEXT**: A full security audit on 2026-03-17 found zero rate limiting, zero input validation, exposed credentials in git, and disabled RLS on critical tables. These rules exist to prevent security regressions.
>
> **NOTE**: The shared security utilities are implemented in `lib/ratelimit.ts`, `lib/feature-flags.ts`, `lib/validations.ts`, and `lib/audit.ts`. Each route must preserve and verify the security behavior applicable to its existing protected, public, or internal contract. Do not add authentication to an existing public route or import unused layers merely to satisfy a universal stack.

### Rule S1: APPLY THE ROUTE'S REQUIRED SECURITY LAYERS

> **UPDATED 2026-07-10**: `getSession()` is BANNED for any server-side identity/authz decision , it reads the client-supplied cookie WITHOUT verifying the JWT signature, so a forged cookie can set any `user.id`. Use the shared helpers: `requireAuth()` / `requireAdmin()` / `requireSalonOwner()` / `requireRole()` in `lib/auth/require.ts`, or `getSessionUser()` in `lib/supabase.ts`. Both call `supabase.auth.getUser()` under the hood (verifies the JWT against the Supabase Auth server, fails CLOSED with `user: null` on any failure). There is no edit-time hook that proves this rule. For a changed backend source, use `fable-backend`, run the explicitly targeted report-only `security-static` check, and verify the real authorization path; its `S4_SERVER_SESSION` finding is a candidate for review, not proof of authorization safety.

When creating or modifying a route in `app/api/`, inspect its existing method, callers, actor,
data, and protected, public, or internal contract. Preserve the applicable authentication and role,
verified identity, feature or ban, rate-limit, input-validation, ownership, and audit behavior. A
protected mutation commonly uses the following order; omit only a layer that does not belong to
that route's contract. Do not weaken a protected route or turn an internal route public.

```typescript
// ✅ CORRECT — Protected mutation stack
export async function POST(req: NextRequest) {
  // 1. Feature flag check (is this feature enabled?)
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  // 2. Auth check, use the shared helper (verifies the JWT, fails closed)
  const auth = await requireAuth(); // lib/auth/require.ts
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Rate limit check
  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 5. Input validation (zod)
  const body = await req.json();
  const { data, error } = validateBody(createBookingSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 6. Business logic...
}
```

```typescript
// ❌ WRONG — No security layers
export async function POST(req: NextRequest) {
  const body = await req.json();  // No auth, no rate limit, no validation
  const { data } = await supabase.from("bookings").insert(body);
  return NextResponse.json({ data });
}

// ❌ ALSO WRONG, getSession() for an authz decision (forgeable cookie). Never do this server-side:
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null; // an attacker can forge this
```

**For public (unauthenticated) GET routes**, use IP-based rate limiting:

```typescript
// ✅ CORRECT — Public route with IP rate limit
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;
  // ... query logic
}
```

### Rule S2: NEVER EXPOSE SECRETS

- **NEVER** hardcode API keys, tokens, or secrets in source code
- **NEVER** use `SUPABASE_SERVICE_ROLE_KEY` in client-side code or `NEXT_PUBLIC_` variables
- **NEVER** commit `.env`, `.env.local`, or files containing tokens to git
- **ALWAYS** use `process.env.VARIABLE_NAME` server-side only
- **ALWAYS** use `createAdminSupabaseClient()` (service role) ONLY in API routes, never in components

```typescript
// ✅ CORRECT — Server-side only, from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ❌ WRONG — Hardcoded secret
const stripe = new Stripe("sk_live_abc123...");

// ❌ WRONG — Service role key in a client component
const admin = createAdminSupabaseClient(); // This bypasses RLS!
```

### Rule S3: RLS IS NON-NEGOTIABLE

When creating new Supabase tables or modifying migrations:
- **ALWAYS** enable RLS: `ALTER TABLE public.tablename ENABLE ROW LEVEL SECURITY;`
- **ALWAYS** add explicit SELECT/INSERT/UPDATE/DELETE policies
- **NEVER** use `USING (true)` for write operations (INSERT/UPDATE/DELETE)
- **NEVER** grant `DELETE` or `TRUNCATE` to the `anon` role
- `USING (true)` for SELECT is acceptable ONLY for genuinely public read data (salons, reviews)
- For an API-exposed view over RLS-protected data, use `security_invoker = true` unless a written, reviewed exception establishes a different safe access model. Views otherwise run with the owner's permissions and can bypass the base-table policy.

```sql
-- ✅ CORRECT — Scoped policies
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

-- ❌ WRONG — Anyone can read/write anything
CREATE POLICY "bookings_yolo" ON public.bookings
  FOR ALL USING (true);
```

### Rule S4: VALIDATE ALL USER INPUT

- **ALWAYS** validate request bodies with zod schemas from `lib/validations.ts`
- **ALWAYS** validate UUID parameters (don't trust URL path params)
- **NEVER** pass raw user input directly into SQL or `.ilike()` without length limits
- **NEVER** trust `req.json()` without schema validation

### Rule S5: USE THE SECURITY UTILITIES THAT IMPLEMENT THE ROUTE CONTRACT

Use the shared utilities below when their behavior applies to the route:

| Utility | Import | Purpose |
|---|---|---|
| Rate limiting | `import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit"` | Prevent abuse |
| Feature flags | `import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags"` | Kill switch |
| Validation | `import { validateBody, schemaName } from "@/lib/validations"` | Input validation |
| Audit logging | `import { logAuditEvent } from "@/lib/audit"` | Admin action tracking |

Import only the utilities the route uses. External public GET routes retain their applicable
IP-keyed rate limit and input or parameter bounds without gaining authentication. Protected routes
retain verified identity, actor or ownership checks, and the applicable rate limit. Validate every
accepted body and untrusted parameter. Use feature and ban checks where the route's existing
feature or actor contract requires them, and audit admin or other privileged actions where the
existing audit contract requires it.

### Rule S6: ADMIN ROUTES MUST DOUBLE-CHECK ROLE

Every route under `app/api/admin/` MUST verify the user's role from the database. Never trust client-provided role claims.

```typescript
// ✅ CORRECT — Check role from DB
const { data: profile } = await supabase
  .from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// ❌ WRONG — Trusting client header or JWT claim alone
if (req.headers.get("x-role") !== "admin") return ...
```

### Rule S7: PUBLIC LOOKUP-BY-CODE ENDPOINTS (input-abuse-08, 2026-07-27)

Any endpoint that looks up a resource by a client-supplied code or token and is reachable
without authentication (gift voucher codes, loyalty/walk-in tokens, referral codes,
booking reference lookups) MUST:

1. **Exact-match only.** Use `.eq()`, never `.ilike()`/`.like()`. `.ilike()` treats `%`
   and `_` as wildcards, so an unvalidated code turns the lookup into a binary-search
   oracle over every real code in the table.
2. **One identical generic message for every failure branch.** Not found, expired,
   already redeemed, wrong owner all return the SAME message/status. Distinct messages
   per branch let an attacker tell "code doesn't exist" apart from "code exists but is
   unpaid/redeemed/expired" without ever seeing the code's real state.
3. **A tight IP-keyed rate limiter sized to the token's entropy**, not the general
   limiter. A 6-digit or short alphanumeric code is brute-forceable within a permissive
   window.

This pattern already exists correctly, independently re-derived with its own comment,
in `app/api/referral/validate/route.ts`, `app/api/referral/complete/route.ts`,
`app/api/bookings/guest-lookup/route.ts`, `app/api/search/event/route.ts`, and
`app/api/vouchers/validate/route.ts` (the `GENERIC_INVALID_MESSAGE` constant there names
the exact oracle it closes). Codified here so the next such endpoint (Solen's product
surface keeps adding vouchers/loyalty/walk-in/referral codes) inherits the rule by
reading it once, instead of an author re-deriving it from first principles or
copy-pasting a sibling route's comment. Not gate-able by grep (verifying "every failure
branch returns the identical message" needs semantic understanding, not a pattern
match) so this is a code-review checklist item, not an automated check.

### Rule S8: EVERY USER PHOTO/VIDEO UPLOAD ROUTE GOES THROUGH THE SHARED PROCESSOR (imagery-icons-01/06, 2026-07-27)

Any route accepting a user-supplied image file (salon gallery, review photo, service
photo, client progress photo, avatar, formula photo, salon document) MUST call
`verifyAndStripImage()` (`lib/upload-security.ts`) before `.storage.from(...).upload()`,
never write the raw uploaded bytes to Storage directly. One call does three things at
once: sniffs the REAL format from magic bytes (never trusts the client's `file.type` or
filename), strips EXIF/GPS/ICC metadata (sharp drops all metadata on re-encode unless
`.withMetadata()` is called, which this helper never does), and bounds the served weight
(resizes the longest edge to `maxDimension`, default 2000px, tighter for avatars, before
encoding). A phone photo carries GPS coordinates and device identifiers by default; a
salon owner or customer uploading from their own phone can otherwise unknowingly publish
their home address to a public bucket anyone can download and inspect. Every one of the
7 current upload routes calls this helper; a new one must too.

### Rule S9: A PUBLIC-READ PHOTO TABLE NEEDS A PRE-PUBLISH MODERATION GATE (imagery-icons-02, 2026-07-27)

`salon_portfolio_images` and `review_photos` currently have no `moderation_status` column
and no RLS predicate gating what's publicly visible: a POST to the gallery or review-photo
upload route inserts straight into a public-read table, live the instant it succeeds. This
is the same trust-and-safety shape Discovery content already solved
(`app/api/admin/discovery/moderation/route.ts`), just never extended to these two tables.
**Known, named launch-risk gap, not yet closed**: closing it needs a migration (a
`moderation_status` column + an RLS predicate on the public SELECT policy so an unmoderated
row cannot render even if application code forgets to filter it) plus extending the
Discovery moderation admin page to cover both tables. Full writeup:
`_design-system/PHOTO_STRATEGY.md` section 6.
