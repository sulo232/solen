# Claude Code Prompt — Feature Expansion v2

## Your Task

Execute the roadmap at `_tasks/roadmap-features-v2.md` **phase by phase**. Before starting each phase, VERIFY the current state of all files/routes/tables mentioned. After each phase, run `npm run build` and commit.

## MANDATORY Pre-Work (Read These COMPLETELY First)

1. **Read `CLAUDE.md`** — follow ALL rules. Sections 4, 5, 9, 10, and 11 are critical.
2. **Read `UI_RULES.md`** — every UI component must match. Light mode only, glassmorphism, Syne/DM Sans/Space Grotesk, lucide-react only, no emoji.
3. **Read `_tasks/roadmap-features-v2.md`** — the full spec for all 11 phases.
4. **Read `_tasks/completed/`** — scan files in the completed folder so you don't redo work or ask about things already decided (CLAUDE.md Rule 5.8).

## Multi-Agent Coordination (CLAUDE.md Section 4)

Before editing ANY file:
1. Check `.agent-lock.json` — if a file is locked by another agent, DO NOT EDIT IT
2. Post your intent in `.agent-comms.md` before starting work
3. Claim your files in `.agent-lock.json`
4. When done, release locks and post summary in `.agent-comms.md`

## Phase-by-Phase Execution Protocol

**For EVERY phase, before writing any code:**

1. **VERIFY existing files** — Open and read every file the roadmap says "EXISTS" or "ALREADY EXISTS." Confirm the API returns the expected data shape. Do NOT assume — actually check. (`CLAUDE.md` Rule 10.1/10.2)
2. **VERIFY existing API response format** — Read the route handler to confirm what fields it returns. If the roadmap says "it returns `{ salons: [...] }`" — verify that's true.
3. **VERIFY migration numbering** — Last existing migration is `017_salon_analytics.sql`. New ones start at `018`. Before creating a migration, `ls supabase/migrations/` to see what exists.
4. **VERIFY npm packages** — Before importing any package, check `package.json` to confirm it's installed. If not, `npm install` it first.
5. **VERIFY DashboardLayout nav arrays** — Before adding nav items, read `components/dashboard/DashboardLayout.tsx` to find the exact `NAV` and `ADMIN_NAV` array structures and add items in the correct format.

## Security Rules (CLAUDE.md Section 11 — MANDATORY)

**Every new API route you create MUST follow this pattern:**

```typescript
export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Rate limit check (if lib/ratelimit.ts exists)
  // const rateLimited = await applyRateLimit(limiter, { userId: user.id });
  // if (rateLimited) return rateLimited;
  // TODO: add rate limiting after security roadmap Phase 3

  // 3. Input validation (if lib/validations.ts exists)
  // const { data, error } = validateBody(schema, body);
  // TODO: add validation after security roadmap Phase 4

  // 4. For admin routes: ALWAYS verify role from DB, not from client
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Business logic...
}
```

**If `lib/ratelimit.ts`, `lib/feature-flags.ts`, or `lib/validations.ts` don't exist yet**, skip those layers but add a `// TODO:` comment so they can be added later. Do NOT skip auth or admin role checks.

**For new database tables**, ALWAYS:
- `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Add explicit RLS policies (SELECT/INSERT/UPDATE/DELETE)
- NEVER use `USING (true)` for write operations
- `USING (true)` for SELECT is OK only for genuinely public data

## Known Issues to Watch For

### Things the roadmap says exist — VERIFY these:
- `payment_status` column on `bookings` table — may or may not exist from a previous migration. Check the actual DB schema or migration files.
- `app/[locale]/checkout/page.tsx` — was reportedly already built with Stripe PaymentElement. Read the file before rewriting — enhance what's there, don't start from scratch.
- `user_preferences` table — Phase 7 adds columns to it. Verify the table exists first.
- `salon_page_views` table — Phase 6 queries it. Verify it exists (created in `017_salon_analytics.sql`).

### Things the roadmap does NOT mention but you MUST do:
- **Add nav items to `DashboardLayout.tsx`** for every new admin page:
  - Phase 2.3: `{ label: "Badges", href: "/dashboard/badge-manager", icon: Award }` → `ADMIN_NAV`
  - Phase 3.3: `{ label: "Inhalte", href: "/dashboard/content-editor", icon: FileEdit }` → `ADMIN_NAV`
  - Phase 4.5: `{ label: "Bewertungen", href: "/dashboard/review-moderation", icon: MessageSquareWarning }` → `ADMIN_NAV`
  - Phase 4.7: `{ label: "Bewertungen", href: "/dashboard/reviews", icon: Star }` → `NAV` (salon owner, NOT admin)
  - Phase 11.2: `{ label: "Segmente", href: "/dashboard/segments", icon: PieChart }` → `ADMIN_NAV`
- **Import all lucide-react icons** you use at the top of DashboardLayout — don't forget the imports.
- **Apply migrations** — after creating each `.sql` file, note that it needs `supabase db push` or manual application.
- **RLS policies** — for ALL new tables (badges, waitlist, segments, customer_segment_members), add RLS policies. The roadmap includes RLS for `site_content` but not all tables.
- **Never expose secrets** — use `process.env.VARIABLE` server-side only. Never use `SUPABASE_SERVICE_ROLE_KEY` in client components. Use `createAdminSupabaseClient()` only in API routes.

### `admin/users` route needs PATCH method:
The existing route at `app/api/admin/users/route.ts` only has GET. Phase 1.2 requires adding a PATCH handler for:
- Changing user role (`{ role: "customer" | "salon_owner" | "admin" }`)
- Suspending/unsuspending (`{ is_suspended: true | false }`)

### `admin/revenue` route may need updating:
Read `app/api/admin/revenue/route.ts` and check if it returns GMV, platform fee, and transaction count. If not, update it to query the `bookings` table for those values.

## UI Styling Rules (Non-Negotiable)

- **Wrap every dashboard page in `<DashboardLayout>`** — same pattern as `dashboard/page.tsx`
- **Card style:** `bg-white rounded-card border border-gray-100 shadow-card`
- **Heading:** `font-heading font-bold text-2xl text-dark` (Syne)
- **Body text:** `font-body` (DM Sans)
- **Numbers/data:** `font-data` (Space Grotesk)
- **Teal accent:** `#4ECDC4` / `bg-teal` / `text-teal`
- **Coral accent:** `#FF6B6B` / `bg-coral` / `text-coral`
- **Active pill:** `bg-teal text-white`
- **Inactive pill:** `bg-white border border-gray-200 text-dark/60`
- **Status pills:** active=teal, frozen=coral, pending=amber
- **Buttons:** `rounded-button` with `bg-teal text-white` or outlined variants
- **Inputs:** `px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal`
- **Icons:** `lucide-react` ONLY — no emoji, no other icon libraries
- **Animations:** Use `containerVariants`/`itemVariants` from `lib/animations` for staggered loading
- **Loading state:** `<Spinner size="lg" />` centered
- **Count-up animations:** Reuse `useCountUp` from `dashboard/page.tsx`

## Spec Fidelity (CLAUDE.md Section 9)

- Build EXACTLY what the roadmap specifies — no more, no less
- If the roadmap says "use existing `<SalonCard>` component" → import the existing one, do NOT create a new one
- If the roadmap says "use lucide-react `Star` icon" → use that exact icon
- NEVER ad-lib features, components, or API calls not in the roadmap
- Preserve every pixel/size spec, every conditional, every API endpoint verbatim
- If a step is ambiguous → STOP and ask. Don't guess. (`CLAUDE.md` Rule 10.7)

## Incomplete Features Protocol (CLAUDE.md Section 8.3)

If you CANNOT finish a feature (missing API route, missing dependency, missing context):
1. DO NOT delete the feature from the roadmap
2. APPEND an entry to `_tasks/INCOMPLETE_FEATURES.md` with:
   - **Feature**: What you were trying to build
   - **File/Line**: Where you stopped
   - **Blocker**: Why you couldn't finish
   - **Next Steps**: What's needed to unblock

## Commit Protocol (CLAUDE.md Section 10.3/10.4)

```bash
# This exact sequence. Every time. No exceptions.
npm run build           # Step 1: MUST pass
git add -A              # Step 2: only after build passes
git commit -m "Phase X.Y: [description]"  # Step 3
# After all sub-phases in a phase:
git push origin main    # Step 4
# Step 5: Verify Vercel deployment
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Must return 200 or 307
```

If `npm run build` fails → **DO NOT commit. DO NOT push. Fix the error first.**

## Danger Zones (CLAUDE.md Section 4.5)

- **index.html / public/home.html** — 🔴 CRITICAL. Lock before editing. Always `cp index.html public/home.html` after editing.
- **NEVER replace the iframe** in `app/[locale]/page.tsx` that serves `public/home.html` — that's the live production homepage.
- **supabase/migrations/** — 🔴 Conflicting migrations break DB. Check before creating.
- **package.json** — 🟡 Lock before editing.

## Supabase Schema Reminder (CLAUDE.md Section 6)

- Table is called `salons` NOT `stores` (migration 013 dropped old table)
- `is_active` is the field, NOT `status`
- Use `createServerSupabaseClient()` for authenticated requests
- Use `createAdminSupabaseClient()` ONLY in API routes (bypasses RLS)

## Start Here

Begin with **Phase 1.1** (All Salons page). Read the roadmap section for 1.1, verify the existing file and API route, then build.
