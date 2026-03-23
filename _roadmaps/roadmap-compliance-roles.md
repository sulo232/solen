# Roadmap: Compliance & Roles

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | User roles, Login, RLS | Modify profiles `role` check constraint carefully. |
| Phase 2 | 🟡 MEDIUM | Auth & Signup | Age gate & global unique email handling on signup frontend. |
| Phase 3 | 🟡 MEDIUM | Salon Onboarding | Add phone verification (seven.io) to onboarding API. |
| Phase 4 | 🟢 SAFE | Staff System | Review & expose `staff_invites` via UI. |
| Phase 5 | 🔴 HIGH | Security & Login | Add `account_status`, check it on login/API via `feature-flags.ts`. |
| Phase 6 | 🟡 MEDIUM | Account Deletion | Refactor `/api/profile/delete` to 30-day delay, create anonymization cron. |
| Phase 7 | 🟢 SAFE | Data Export | Create `/api/profile/export` endpoint. |
| Phase 8 | 🟡 MEDIUM | Login Flow | Add `tos_version` to `profiles`, force accept on login if mismatched. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Database Migrations (Backend)
1. Create a new migration file `[NEW] supabase/migrations/075_compliance_roles_schema.sql`
2. Update `profiles.role` check constraint to include `'staff'`.
3. Add `account_status` column (text check: 'active', 'warned', 'suspended', 'banned') default 'active' to `profiles`.
4. Add `deletion_requested_at` (TIMESTAMPTZ) to `profiles`.
5. Add `tos_version` (TEXT) and `tos_accepted_at` (TIMESTAMPTZ) to `profiles`.
6. Add `phone_verified` (BOOLEAN) default false to `salons`.

✅ **DO:**
```sql
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'salon_owner', 'staff', 'admin'));
```

❌ **DON'T:**
```sql
-- Don't drop the column and recreate it, that destroys data!
```

> ⚠️ **BE CAREFUL**: Altering `profiles` can break RLS or existing users. Do NOT use `DROP COLUMN`. `npm run build` locally after adding API types if any.

**Verification (R7):**
- Commit message: `phase 1: database migrations for compliance and roles`
- Verify: `supabase db reset` locally if applicable, or check supabase dashboard after pushing to ensure schema was applied cleanly without breaking existing profiles.### Phase 2: Age Gate & Email Enforcement (Frontend)

1. Update signup flows in `app/[locale]/auth/register/` to collect `birthday` (DOB).
2. Validate `birthday` using Zod (`lib/validations.ts`) to ensure user is >= 16 years old.
3. Catch Supabase "user already registered" error on signup and show a specific UI: "You already have an account. Please log in."

✅ **DO:**
```typescript
const age = calculateAge(new Date(birthday));
if (age < 16) { return { error: "You must be at least 16 years old." }; }
```

❌ **DON'T:**
```typescript
// Don't just use a checkbox
const over16 = formData.get('over16') === 'on';
```

> ⚠️ **BE CAREFUL**: Ensure the age calculation is robust against timezones. Update the Zod schemas for `/api/auth/register` (if exists) or the client-side form logic.

### Phase 3: Salon Phone Verification (Backend & Frontend)

1. Create `/api/auth/verify-phone/send` and `/api/auth/verify-phone/check`.
2. Use `seven.io` (already in `CLAUDE.md`) to send a 6-digit SMS OTP.
3. Add a UI step in the salon onboarding flow to input the code.

✅ **DO:**
```typescript
// Send SMS using seven.io API and store OTP temporarily in a `verification_codes` table or Redis.
```

❌ **DON'T:**
```typescript
// Don't use Twilio if seven.io is our standard SMS provider.
```

> ⚠️ **BE CAREFUL**: Rate limit the SMS sending route aggressively to prevent toll fraud! Use the Upstash ratelimiter from `lib/ratelimit.ts`.

### Phase 4: Account Status & Deletion (Backend)

1. Modify `lib/feature-flags.ts` `checkUserBanned` to also check if `p.account_status` is 'suspended' or 'banned'.
2. Modify `app/api/profile/delete/route.ts` to NOT delete immediately. It should set `deletion_requested_at = NOW()` on `profiles`.
3. Create a cron job endpoint `/api/cron/process-deletions` that finds profiles with `deletion_requested_at < NOW() - INTERVAL '30 days'` and executes the actual data wiping (anonymizing bookings/reviews, logging to `data_deletion_log`, deleting auth user).

✅ **DO:**
```typescript
await admin.from('profiles').update({ deletion_requested_at: new Date().toISOString() }).eq('id', user.id);
```

❌ **DON'T:**
```typescript
// Don't keep the immediate deletion.
await admin.from('profiles').delete().eq('id', user.id);
```

> ⚠️ **BE CAREFUL**: Testing the cron job requires manually setting a fake timestamp in the database. Protect `/api/cron/process-deletions` with a secret cron key.

### Phase 5: Data Export & T&S Tracking (Backend & Frontend)

1. Create `app/api/profile/export/route.ts` that fetches user data (profile, bookings, reviews) and returns a JSON file.
2. In the Login flow or a global layout wrapper, check if `profile.tos_version !== CURRENT_TOS_VERSION` (store current version in a constant, e.g., '2026-03-23').
3. If mismatched, force a modal to accept the new Terms of Service, calling `/api/profile/accept-tos` to update `tos_version` and `tos_accepted_at`.

✅ **DO:**
```typescript
const CURRENT_TOS = '2026-03-23';
if (user.tos_version !== CURRENT_TOS) showModal();
```

> ⚠️ **BE CAREFUL**: Do not block API access globally for TOS, just block the UI interactions to avoid breaking background tasks.

### Phase 6: Document New Variables & Utilities

Update `CLAUDE.md` to reflect the new `account_status`, `tos_version`, etc., in the schema table.

---

## 🧑 MANUAL PHASES

1. Get `seven.io` API keys if not already available in `.env.local`.
2. Configure Vercel Cron to ping `/api/cron/process-deletions` daily.

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Database Migrations | Nothing |
| Phase 2 | 🤖 | Age Gate & Email Unique | Phase 1 |
| Phase 3 | 🤖 | SMS Verification | Phase 1, Manual keys |
| Phase 4 | 🤖 | Account Status & Deletion | Phase 1 |
| Phase 5 | 🤖 | Data Export & TOS | Phase 1 |
| Phase 6 | 🤖 | Update CLAUDE.md | Phase 1-5 |

