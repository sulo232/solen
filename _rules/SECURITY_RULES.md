# Solen.ch Security Rules

## 11. 🔒 SECURITY RULES (MANDATORY — ALL API ROUTES)

> **CONTEXT**: A full security audit on 2026-03-17 found zero rate limiting, zero input validation, exposed credentials in git, and disabled RLS on critical tables. These rules exist to prevent security regressions.
>
> **NOTE**: All security utility files are implemented and mandatory. See `lib/ratelimit.ts`, `lib/feature-flags.ts`, `lib/validations.ts`, `lib/audit.ts`. Every API route MUST include all security layers — no exceptions, no TODOs.

### Rule S1: EVERY NEW API ROUTE MUST HAVE THESE LAYERS

When creating or modifying ANY API route in `app/api/`, you MUST include these checks **in this exact order**:

```typescript
// ✅ CORRECT — Full security stack
export async function POST(req: NextRequest) {
  // 1. Feature flag check (is this feature enabled?)
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  // 2. Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

### Rule S5: SECURITY UTILITIES — MANDATORY IMPORTS

When writing API routes, these utilities MUST be available (created in the security roadmap):

| Utility | Import | Purpose |
|---|---|---|
| Rate limiting | `import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit"` | Prevent abuse |
| Feature flags | `import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags"` | Kill switch |
| Validation | `import { validateBody, schemaName } from "@/lib/validations"` | Input validation |
| Audit logging | `import { logAuditEvent } from "@/lib/audit"` | Admin action tracking |

All four utility files exist and are mandatory in every API route. There are no exceptions.

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

