# Roadmap: Admin Visual Editor (v3 — Final)

> **Goal**: Build a full-page admin-only visual editor at `/dashboard/editor` where admins preview the entire solen.ch site (UI-only, no working APIs), click on any element, describe desired changes, and auto-generate Claude Code-compatible roadmaps via the Anthropic Claude API. Includes revert-to-live, request queue, and Antigravity integration.
>
> **v3 Note**: Incorporates all fixes from both gap analyses (v1→v2: 23 issues, v2→v3: 8 issues). All critical and medium issues resolved. Ready for execution.

## ⚡ Execution Instructions

**This roadmap is designed for fully autonomous execution by Claude Code.** No manual intervention required — all manual steps have been completed or automated.

- ✅ `ANTHROPIC_API_KEY` is set in Vercel + `.env.local` (completed by admin)
- ✅ Supabase CLI is linked (project ref: `tocfnsmxmdxkrcmjzzdw`)
- 🤖 Migration will be applied automatically via `supabase db push`

**Execute phases 1→7 sequentially. Commit after each phase. Run `npm run build` to verify each phase compiles.**

Read `CLAUDE.md` before starting — it contains all project rules, security patterns, banned tokens, and design system tokens that MUST be followed.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Manual A | 🟡 MEDIUM | Runtime crash if `ANTHROPIC_API_KEY` missing | Set env var in ALL Vercel environments before Phase 4 |
| Phase 1 | 🟢 SAFE | Nothing | New migration (066), new table only |
| Phase 2 | 🟢 SAFE | Nothing | New API routes only, no existing code touched |
| Phase 3 | 🟢 SAFE | Nothing | New components in `components/editor/`, no existing components modified |
| Phase 4 | 🟡 MEDIUM | API 500 if API key missing; cost overrun | Check env var + dedicated rate limiter (5/min) |
| Phase 5 | 🟡 MEDIUM | Safari may block iframe session cookies | Add `allow-same-origin` + troubleshooting fallback |
| Phase 6 | 🟡 MEDIUM | Sidebar layout shift if pattern not matched | Add entry to ADMIN_NAV array — must match existing pattern exactly |
| Phase 7 | 🟢 SAFE | Nothing | CLAUDE.md + `.env.example` documentation only |

---

## 🤖 CLAUDE CODE PHASES

All phases are fully automated. Execute sequentially, commit after each.

---

### Phase 1 — Database: `feature_requests` Table

#### [NEW] `supabase/migrations/066_feature_requests.sql`

Creates the `feature_requests` table with full RLS (admin-only for ALL operations including DELETE).

```sql
-- Feature requests from admin visual editor
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  element_selector text,
  element_tag text,
  element_text text,
  component_hint text,
  page_url text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'roadmap_generated', 'in_progress', 'done', 'reverted')),
  generated_roadmap text,
  roadmap_version integer NOT NULL DEFAULT 1,
  claude_prompt text,
  token_usage jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin-only (ALL operations)
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_requests_admin_select" ON public.feature_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feature_requests_admin_insert" ON public.feature_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feature_requests_admin_update" ON public.feature_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feature_requests_admin_delete" ON public.feature_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_feature_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION update_feature_requests_updated_at();

-- Seed the visual_editor feature flag (required for checkFeatureEnabled)
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('visual_editor', true, 'Admin visual editor at /dashboard/editor')
ON CONFLICT (key) DO NOTHING;
```

**Changes from v1**: Added `DELETE` RLS policy (gap #3), pinned migration number to `066` (gap #4), added `roadmap_version` column (improvement: versioning), added `token_usage` JSONB column (improvement: cost tracking). **v3**: Added `visual_editor` feature flag seed (v3 fix #4).

✅ DO:
```sql
-- Correct: separate policy per operation, admin-only
CREATE POLICY "feature_requests_admin_delete" ON public.feature_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

❌ DON'T:
```sql
-- Wrong: public access, or missing DELETE policy entirely
CREATE POLICY "feature_requests_yolo" ON public.feature_requests
  FOR ALL USING (true);
```

**Verification (R7)**:
```bash
ls supabase/migrations/ | tail -3  # Verify 066 is the next number
git add supabase/migrations/066_feature_requests.sql
git commit -m "phase 1: create feature_requests table with admin-only RLS (all 4 operations)"
npm run build

# Apply migration to live Supabase database
supabase db push
```

> ⚠️ **BE CAREFUL**: Verify `066` doesn't already exist: `ls supabase/migrations/066*`. If it does, increment to 067. Do NOT touch any other migrations. Do NOT create a generic trigger function if one already exists — this table-specific function is fine. After `supabase db push`, verify with: `supabase db execute 'SELECT count(*) FROM feature_requests'` — should return 0. If `supabase db push` fails, check if you need `--password` flag or if the migration has a syntax error. If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 2 — API Routes + Utility Updates

#### [MODIFY] `lib/feature-flags.ts` — update FeatureKey type

The `FeatureKey` type is a string union. Add `"visual_editor"` to it.

**BEFORE** (line 4):
```typescript
type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode";
```

**AFTER**:
```typescript
type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor";
```

Touch NOTHING else in this file.

#### [MODIFY] `lib/ratelimit.ts` — add `roadmapLimiter` export

Append AFTER the existing `referralLimiter` (after line 57, before the `type RateLimitIdentifier` line):

```typescript
export const roadmapLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "rl:roadmap",
});
```

Touch NOTHING else in this file. Do NOT re-export the `Ratelimit` class.

---

#### [MODIFY] `lib/validations.ts` — append new schemas

Add zod schemas at the BOTTOM of the file (do NOT modify existing schemas):

```typescript
// ─── Visual Editor ───
export const createFeatureRequestSchema = z.object({
  element_selector: z.string().max(500).optional(),
  element_tag: z.string().max(50).optional(),
  element_text: z.string().max(500).optional(),
  component_hint: z.string().max(100).optional(),
  page_url: z.string().max(500).refine((v) => v.startsWith("/"), { message: "page_url must start with /" }),
  description: z.string().min(5).max(2000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const updateFeatureRequestSchema = z.object({
  status: z.enum(["pending", "roadmap_generated", "in_progress", "done", "reverted"]).optional(),
  description: z.string().min(5).max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const generateRoadmapSchema = z.object({
  requestId: z.string().uuid(),
});
```

#### [NEW] `app/api/admin/feature-requests/route.ts`

**GET** — List all feature requests with cursor-based pagination.
**POST** — Create a new feature request.

Must include ALL 6 security layers from CLAUDE.md Rule S1:

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, createFeatureRequestSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  // 1. Feature flag check
  const disabled = await checkFeatureEnabled("visual_editor");
  if (disabled) return disabled;

  // 2. Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role check
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Query with cursor-based pagination
  const admin = createAdminSupabaseClient();
  const status = req.nextUrl.searchParams.get("status");
  const cursor = req.nextUrl.searchParams.get("cursor"); // ISO timestamp
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

  let query = admin.from("feature_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null;
  return NextResponse.json({ requests: data, nextCursor });
}

export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("visual_editor");
  if (disabled) return disabled;

  // 2. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role check
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Zod validation
  const body = await req.json();
  const { data: validated, error: valError } = validateBody(createFeatureRequestSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 7. Insert
  const admin = createAdminSupabaseClient();
  const { data: inserted, error } = await admin
    .from("feature_requests")
    .insert({ ...validated, admin_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: inserted }, { status: 201 });
}
```

> **Tech debt note (gap #2)**: Existing admin routes use `getSession()`. Ideally, API routes should use `getUser()` for JWT validation. This roadmap follows the existing pattern for consistency but this should be addressed in a future security sweep.

#### [NEW] `app/api/admin/feature-requests/[id]/route.ts`

**PATCH** — Update status, description, priority.
**DELETE** — Remove a feature request.

Same full 6-layer security stack. Uses `updateFeatureRequestSchema` for PATCH validation.

✅ DO:
```typescript
// Correct: all 6 security layers in exact order
const disabled = await checkFeatureEnabled("visual_editor");
if (disabled) return disabled;
// ... auth → ban check → role check → rate limit → validation → logic
```

❌ DON'T:
```typescript
// Wrong: raw req.json() with no security layers
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data } = await supabase.from("feature_requests").insert(body);
  return NextResponse.json({ data });
}
```

**Verification (R7)**:
```bash
npm run build
npx tsc --noEmit  # Verify FeatureKey type accepts "visual_editor"
git add app/api/admin/feature-requests/ lib/validations.ts lib/feature-flags.ts lib/ratelimit.ts
git commit -m "phase 2: feature request CRUD + roadmapLimiter + visual_editor flag type"
```

> ⚠️ **BE CAREFUL**: Every route MUST have ALL 6 layers: feature flag → auth → ban → role → rate limit → validation. Do NOT skip any layer. Do NOT use `req.json()` directly — always use `validateBody()`. The GET route must support cursor-based pagination (not offset). Do NOT modify existing schemas in `lib/validations.ts` — only APPEND. When modifying `lib/ratelimit.ts`, only APPEND the new `roadmapLimiter` — do NOT change any existing limiters. When modifying `lib/feature-flags.ts`, only add `"visual_editor"` to the `FeatureKey` union type — touch nothing else. If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 3 — Editor UI: Core Components

All new files. No existing files modified.

> **Mobile gate (gap #23)**: All editor components MUST show a "Use desktop for the Visual Editor" message at `< 1024px` viewport width. Use `usehooks-ts`'s `useWindowSize` (already in `package.json`).

#### [NEW] `components/editor/EditorPage.tsx`

The main editor layout with three zones:

```
┌─────────────────────────────────────────────────────────────┐
│  Toolbar: [← Back] [URL: /de/___________] [📱 💻 🖥️] [↺ Revert] [Edit Mode: ON/OFF]  │
├──────────────────────────────────────┬──────────────────────┤
│                                      │  Edit Panel          │
│   Site Preview (iframe)              │  (360px, slides in   │
│   via <DeviceFrame />                │   on element select) │
│   - Full-screen when panel closed    │                      │
│   - Element highlight on hover       │  • Element info      │
│   - Coral outline on click-select    │  • Description       │
│   - All pages navigable              │  • Priority          │
│   - Mutating APIs blocked            │  • Save Request      │
│   - Scrollable                       │  • Generate Roadmap  │
│                                      │  • View Prompt       │
│                                      │  • Error/loading     │
│                                      │  • Request History   │
├──────────────────────────────────────┴──────────────────────┤
│  Status bar: "Selected: <button.cta> on /de/coiffeur"       │
└─────────────────────────────────────────────────────────────┘
```

**Key features**:
- **URL bar**: Type any path (e.g., `/de/dashboard/bookings`) to navigate the iframe
- **Device presets**: Desktop (1440px), Tablet (768px), Mobile (375px) — resizes the iframe container
- **Revert button**: Reloads the iframe from origin — since preview IS the live site, revert = reload. If many requests submitted, RequestList has per-request "Revert" status
- **Edit mode toggle**: When ON, hovering highlights elements, clicking selects. When OFF, normal browsing
- **Keyboard shortcuts** (gap #20): `Esc` = deselect, `E` = toggle edit mode, `Cmd+Enter` = submit
- **Mobile gate** (gap #23): At `< 1024px` viewport, show fullscreen message: "Visual Editor requires a desktop browser (1024px+)"
- **Iframe loading**: Loads `window.location.origin + chosen path`. Injects `editor-bridge.js` via postMessage handshake. Does NOT use `sandbox` attribute initially (gap #5: prevents Safari cookie issues). Falls back to sandboxed mode only if explicitly toggled

#### [NEW] `components/editor/EditPanel.tsx`

**Side panel (360px wide, slides from right with framer-motion)**:

- **Element Info Section**: Shows tag, CSS path, visible text, guessed component name (may be null — show "Unknown component" with note to type manually)
- **Change Description**: Multi-line textarea — "What do you want changed?"
- **Priority Picker**: Three-button toggle (Low / Medium / High) with coral active state
- **"Save Request" button**: `POST /api/admin/feature-requests`
- **"Generate Roadmap" button**: `POST /api/admin/generate-roadmap`
  - Disabled while in-flight (gap #7)
  - Shows Spinner + "Generating roadmap… (10-30s)" text (gap #8)
  - Uses `AbortController` — new request cancels previous (gap #11)
  - On success: shows roadmap in syntax-highlighted markdown block
- **"Preview Prompt" collapsible**: Shows the full Claude system + user prompt before generating (improvement)
- **"Copy Roadmap" button**: Copies generated markdown to clipboard
- **"Download as .md"**: Downloads as `roadmap-editor-{slug}.md`
- **Error states (gap #10)**:
  - POST fails → inline red banner: "Failed to save request. Try again."
  - Generate fails → inline red banner: "Roadmap generation failed: {error}"
  - Malformed response → "Claude returned an unexpected format. Try regenerating."
- **Request History**: Collapsible list of past requests for current page URL, with status badges

#### [NEW] `components/editor/RequestList.tsx`

Full list view of all feature requests:
- Filter by status tabs (All / Pending / Roadmap Generated / In Progress / Done)
- **Cursor-based pagination**: "Load more" button using `nextCursor` from API (gap #13)
- Each card: page URL, description preview, priority badge, status badge, timestamp, token cost
- Expand to see full generated roadmap (with version number)
- Status update buttons (Mark in progress / Mark done / Revert)
- **Batch action** (improvement): Select multiple same-page requests → "Generate Combined Roadmap"
- "Copy Roadmap to Clipboard" per request
- "Download as .md" per request
- **Cumulative cost display**: Total tokens used across all requests (improvement)

#### [NEW] `components/editor/DeviceFrame.tsx`

Responsive iframe container:
- Desktop: `width: 100%` (fills available space)
- Tablet: `width: 768px`, centered with shadow
- Mobile: `width: 375px`, centered with phone-style rounded frame
- Uses Solen tokens: `rounded-card`, `shadow-warm-md`, `bg-s-bg-surface`
- Manages postMessage communication to/from iframe
- Handles `EDITOR_BRIDGE_READY` handshake

**Dark mode (gap #16)**: All editor components MUST include dark mode pairs:

✅ DO:
```tsx
// Correct: Solen design tokens + dark mode pairs
<div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-s-dm-text/10 shadow-card p-4">
  <h3 className="text-s-ink dark:text-s-dm-text font-heading font-bold">Element Info</h3>
  <textarea className="w-full bg-s-bg-sunken dark:bg-s-dm-bg rounded-button border border-s-ink/10 dark:border-s-dm-text/10 p-3 text-sm text-s-ink dark:text-s-dm-text" />
  <button className="bg-s-coral text-white rounded-button px-4 py-2 text-sm font-medium hover:bg-s-coral-hover transition-colors">
    Save Request
  </button>
</div>
```

❌ DON'T:
```tsx
// Wrong: generic Tailwind, no dark mode, no design tokens
<div className="bg-white rounded-lg shadow-md p-4">
  <textarea className="w-full bg-gray-100 rounded-lg border border-gray-200 p-3" />
  <button className="bg-red-500 text-white rounded-lg px-4 py-2">Save</button>
</div>
```

**Verification (R7)**:
```bash
# Check no banned tokens (Rule 20)
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-" components/editor/ --include="*.tsx" | head -5
# Should return 0 results

# Check all bg-white have dark mode pairs (Rule 21)
grep -rn "bg-white" components/editor/ --include="*.tsx" | grep -v "dark:" | wc -l
# Should return 0

npm run build
git add components/editor/
git commit -m "phase 3: editor UI components — EditorPage, EditPanel, RequestList, DeviceFrame"
```

> ⚠️ **BE CAREFUL**: ALL components MUST use Solen design tokens (`s-coral`, `s-ink`, `rounded-card`, `shadow-card`). EVERY `bg-white` MUST have a `dark:bg-s-dm-*` pair. EVERY `text-s-ink` MUST have a `dark:text-s-dm-text` pair. Icons MUST be from `lucide-react`. Do NOT use `rounded-lg`, `bg-gray-*`, `text-gray-*`, or any banned tokens from CLAUDE.md Rule 20. Do NOT import components that don't exist. The mobile gate MUST block the entire editor at `< 1024px`. Add loading spinners and error states for ALL API calls. Use `AbortController` for the roadmap generation call. If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 4 — Claude API Integration & Context-Enriched Prompts

#### [NEW] `lib/editor-prompts.ts`

Contains the system prompt template for Claude, built from CLAUDE.md Section 12 standards.

**Context approach (v3 fix #2)**: Uses **static strings** instead of `fs.readFileSync()` because Vercel serverless does NOT include non-imported files in the bundle — `CLAUDE.md` and `components/` directory listings are NOT available at `process.cwd()` on Vercel. The static strings contain the essential context extracted from CLAUDE.md sections 3, 6, 12, 13.

```typescript
// NO fs import — static strings only. Works on Vercel serverless.

// Component index — update this when adding/removing major components
// This is a static snapshot. To keep it current, regenerate via:
//   ls components/**/*.tsx | sed 's/^/components\//' | sort
const COMPONENT_INDEX = `Available components:
components/BookingCalendar.tsx
components/BookingSuccess.tsx
components/CategoryHero.tsx
components/CategoryPage.tsx
components/ChatWindow.tsx
components/CompareBar.tsx
components/CompareDrawer.tsx
components/FilterBar.tsx
components/HomePage.tsx
components/LastMinuteCard.tsx
components/MapView.tsx
components/NearbySalons.tsx
components/ProfilePage.tsx
components/QuartierTile.tsx
components/RecentlyViewed.tsx
components/RecommendedSalons.tsx
components/ReviewBreakdown.tsx
components/ReviewCarousel.tsx
components/SalonCard.tsx
components/ServiceTile.tsx
components/StaffPortfolio.tsx
components/TerminePage.tsx
components/TutorialTour.tsx
components/WaitlistModal.tsx
components/WeatherBanner.tsx
components/auth/
components/chat/
components/dashboard/DashboardLayout.tsx
components/dashboard/MiniSparkline.tsx
components/dashboard/PromoManager.tsx
components/dashboard/SolenScoreCard.tsx
components/editor/ (this feature)
components/layout/
components/loyalty/
components/ui/Spinner.tsx
components/ui/sidebar.tsx
components/ui/Skeleton.tsx
components/ui/SearchBar.tsx`;

// Key schema tables — extracted from CLAUDE.md Section 6
const SCHEMA_CONTEXT = `Key Supabase tables:
- salons: id, owner_id, name, slug, categories[], quartier, is_active, average_rating, solen_score
- services: id, salon_id, name_de, name_en, category, duration_minutes, price, is_active
- bookings: id, user_id, salon_id, service_id, starts_at, ends_at, price_paid, status
- profiles: id, display_name, avatar_url, role (customer/salon_owner/admin), onboarding_completed
- conversations/messages: DM chat system
- feature_requests: admin visual editor requests (this feature)

Pages:
- app/[locale]/page.tsx → HomePage.tsx (main landing)
- app/[locale]/coiffeur|barbershop|nagelstudio|... → CategoryPage.tsx
- app/[locale]/salon/[slug] → salon detail
- app/[locale]/dashboard/ → salon owner dashboard (DashboardLayout.tsx)
- app/[locale]/dashboard/editor/ → this visual editor (admin-only)`;

export function buildRoadmapSystemPrompt(): string {
  return `You are a senior full-stack engineer working on solen.ch, a Next.js App Router beauty & wellness booking platform for Basel, Switzerland.

## Tech Stack
Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), Stripe, lucide-react icons, framer-motion, next-intl (de/en/fr/it).

## ${SCHEMA_CONTEXT}

## ${COMPONENT_INDEX}

## Roadmap Creation Rules (MANDATORY — CLAUDE.md Section 12)
You MUST follow ALL these standards:
- R1: Start with a breakage risk assessment table
- R2: Separate manual (🧑) vs code (🤖) phases
- R3: End EVERY phase with a "⚠️ BE CAREFUL" block listing what could go wrong
- R4: Include ✅ DO / ❌ DON'T code examples for every code phase
- R5: Use [NEW]/[MODIFY]/[DELETE] tags with full relative file paths from project root
- R6: End with a dependency ordering table
- R7: Include verification steps per phase (exact git commit command + npm run build)
- R8: Final phase updates CLAUDE.md if introducing new patterns/tables/env vars

## Security Rules (MANDATORY — every API route)
Every API route MUST include ALL 6 layers in order:
1. Feature flag check: checkFeatureEnabled()
2. Auth: getSession()
3. Ban check: checkUserBanned()
4. Role check: profile.role check
5. Rate limit: applyRateLimit()
6. Input validation: validateBody() with zod schema

## Design System Tokens (NEVER deviate)
- Primary: coral #E8624A (class: s-coral)
- Accent: amber #D4870A (s-amber), blue #6BA3C8 (s-blue)
- Text: ink #1A1209 (s-ink), dark mode: #F5EEE4 (s-dm-text)
- Backgrounds: cream #FAF6EF (s-bg-base), white (cards), dark #151009 (s-dm-bg)
- Fonts: Bebas Neue (display ≥40px), Syne (headings), DM Sans (body)
- Radii: rounded-card (12px), rounded-pill (9999px), rounded-button (8px)
- Icons: lucide-react ONLY. No emoji in UI.

## Banned Tokens (NEVER use in any .tsx file)
text-dark, bg-dark, bg-black, bg-gray-*, text-gray-*, border-gray-*, rounded-lg/md/xl/2xl/3xl, dark:text-white (use dark:text-s-dm-text)

Generate a complete, actionable roadmap that Claude Code can execute without guesswork. Include exact file paths and code diffs.`;
}

export function buildRoadmapUserPrompt(request: {
  page_url: string;
  element_selector?: string;
  element_tag?: string;
  element_text?: string;
  component_hint?: string;
  description: string;
  priority: string;
}): string {
  return `Generate a roadmap for this change request:

**Page**: ${request.page_url}
**Element**: <${request.element_tag || 'unknown'}> at selector: "${request.element_selector || 'unknown'}"
**Component (best guess)**: ${request.component_hint || 'Unknown — check the component list above to identify the right file based on the page URL'}
**Visible text on element**: "${request.element_text || 'N/A'}"

**What the admin wants changed**:
"${request.description}"

**Priority**: ${request.priority}

Generate a complete roadmap in markdown format. Include exact file paths, code diffs, and verification steps.`;
}
```

**Why static strings instead of fs.readFileSync (v3 fix #2)**:
- `fs.readFileSync(process.cwd() + "/CLAUDE.md")` crashes on Vercel because `CLAUDE.md` is not in the serverless bundle
- `process.cwd()` on Vercel points to the build output directory, not the source root
- Static strings are reliable, fast, and work everywhere
- To update the component index: run `ls components/**/*.tsx` and paste the output
- A `scripts/update-editor-context.sh` could automate this (future improvement)

#### [NEW] `app/api/admin/generate-roadmap/route.ts`

Full security stack + Claude API call with error handling, cost tracking, and timeout.

**v3 fix #3**: Must declare `runtime = "nodejs"` because the route does NOT use `fs` anymore (static strings) but the Claude API call needs longer timeout than Edge allows (30s). This also prevents Edge runtime issues with `AbortSignal.timeout()`.

```typescript
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Required: 30s timeout exceeds Edge limits
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, roadmapLimiter } from "@/lib/ratelimit";
import { validateBody, generateRoadmapSchema } from "@/lib/validations";
import { buildRoadmapSystemPrompt, buildRoadmapUserPrompt } from "@/lib/editor-prompts";

export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled("visual_editor");
  if (disabled) return disabled;

  // 2. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Admin role
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 5. Strict rate limit (5/min to control costs)
  const rateLimited = await applyRateLimit(roadmapLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 6. Validation
  const body = await req.json();
  const { data: validated, error: valError } = validateBody(generateRoadmapSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 7. Fetch feature request
  const admin = createAdminSupabaseClient();
  const { data: featureReq } = await admin
    .from("feature_requests").select("*").eq("id", validated.requestId).single();
  if (!featureReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // 8. Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Set it in Vercel environment variables." },
      { status: 500 }
    );
  }

  // 9. Call Claude API with 30s timeout
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: buildRoadmapSystemPrompt(),
        messages: [{ role: "user", content: buildRoadmapUserPrompt(featureReq) }],
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-roadmap] Claude API error:", response.status, errBody);
      return NextResponse.json({ error: "Roadmap generation failed", details: response.status }, { status: 502 });
    }

    const result = await response.json();
    const roadmapMarkdown = result.content?.[0]?.text ?? "";

    // Track token usage for cost monitoring
    const tokenUsage = {
      input_tokens: result.usage?.input_tokens ?? 0,
      output_tokens: result.usage?.output_tokens ?? 0,
      model: "claude-sonnet-4-20250514",
      generated_at: new Date().toISOString(),
    };

    // Save roadmap + increment version + store tokens
    const newVersion = (featureReq.roadmap_version ?? 0) + 1;
    await admin.from("feature_requests")
      .update({
        generated_roadmap: roadmapMarkdown,
        status: "roadmap_generated",
        roadmap_version: newVersion,
        token_usage: tokenUsage,
        claude_prompt: buildRoadmapUserPrompt(featureReq),
      })
      .eq("id", validated.requestId);

    return NextResponse.json({
      roadmap: roadmapMarkdown,
      version: newVersion,
      tokenUsage,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Claude API timed out (30s). Try again." }, { status: 504 });
    }
    console.error("[generate-roadmap] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

✅ DO:
```typescript
// Correct: env var check + timeout + error handling + cost tracking
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

const response = await fetch("...", { signal: AbortSignal.timeout(30000) });
if (!response.ok) { /* handle error */ }
```

❌ DON'T:
```typescript
// Wrong: no env check, no timeout, no error handling
const response = await fetch("...", {
  headers: { "x-api-key": process.env.ANTHROPIC_API_KEY! }, // crashes if undefined
});
const result = await response.json(); // crashes on non-JSON error
```

**Verification (R7)**:
```bash
npm run build
git add lib/editor-prompts.ts app/api/admin/generate-roadmap/
git commit -m "phase 4: Claude API integration with static context prompts + cost tracking"
```

> ⚠️ **BE CAREFUL**: `ANTHROPIC_API_KEY` is a SECRET — never log it, never expose client-side, never include in responses. Use `process.env.ANTHROPIC_API_KEY` server-side only. The route MUST include `export const runtime = "nodejs"` — this is required for the 30s AbortSignal timeout (Edge has a lower limit). Do NOT use `fs.readFileSync` — the system prompt uses static strings (works on Vercel). The `max_tokens` is set to 8192 — at Sonnet pricing (~$0.003/1K input, ~$0.015/1K output) a typical 8K-output roadmap costs **~$0.12** (not $0.04). Import `roadmapLimiter` from `@/lib/ratelimit` — do NOT import the raw `Ratelimit` class or create a local instance. If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 5 — Editor Bridge: Iframe ↔ Editor Communication

#### [NEW] `public/editor-bridge.js`

Vanilla JS script loaded by the iframe when in editor mode. Communicates with parent via `postMessage`.

```javascript
// editor-bridge.js — Injected into iframe by the visual editor
// Only activates when receiving EDITOR_ACTIVATE from parent
// ZERO impact on normal site visitors
(function() {
  'use strict';

  let active = false;
  let hoveredEl = null;
  const PARENT_ORIGIN = window.location.origin;

  // ── Security: only accept messages from same origin ──
  window.addEventListener('message', (e) => {
    if (e.origin !== PARENT_ORIGIN) return;
    if (e.data?.type === 'EDITOR_ACTIVATE') {
      active = true;
      document.body.style.cursor = 'crosshair';
    }
    if (e.data?.type === 'EDITOR_DEACTIVATE') {
      active = false;
      document.body.style.cursor = '';
      removeHighlight();
    }
    if (e.data?.type === 'EDITOR_NAVIGATE') {
      window.location.href = e.data.url;
    }
  });

  // ── CSS selector path builder ──
  function getCssPath(el) {
    const parts = [];
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();
      if (el.id) selector += '#' + el.id;
      else if (el.className && typeof el.className === 'string') {
        const cls = el.className.split(' ')
          .filter(c => c && !c.startsWith('__') && !c.startsWith('css-'))
          .slice(0, 2).join('.');
        if (cls) selector += '.' + cls;
      }
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  // ── Component hint: walk up to find data-component attr ──
  function getComponentHint(el) {
    let current = el;
    while (current && current !== document.body) {
      if (current.dataset?.component) return current.dataset.component;
      current = current.parentElement;
    }
    // If no data-component found, return null
    // The admin can manually type the component name in the edit panel
    return null;
  }

  // ── Highlight overlay ──
  const overlay = document.createElement('div');
  overlay.id = '__editor-highlight';
  overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #6BA3C8;' +
    'background:rgba(107,163,200,0.08);z-index:99999;transition:all 0.15s ease;' +
    'display:none;border-radius:4px;';
  document.body.appendChild(overlay);

  // Label tooltip showing tag/class
  const label = document.createElement('div');
  label.id = '__editor-label';
  label.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;' +
    'background:#1A1209;color:#FAF6EF;font-size:11px;font-family:monospace;' +
    'padding:2px 6px;border-radius:3px;display:none;white-space:nowrap;';
  document.body.appendChild(label);

  function showHighlight(rect, el) {
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    // Show label above element
    const tagInfo = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
      ? '.' + el.className.split(' ').filter(c => c).slice(0, 1).join('')
      : '');
    label.textContent = tagInfo;
    label.style.display = 'block';
    label.style.left = rect.left + 'px';
    label.style.top = Math.max(0, rect.top - 22) + 'px';
  }

  function removeHighlight() {
    overlay.style.display = 'none';
    label.style.display = 'none';
  }

  // ── Hover ──
  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === overlay || el === label || el === hoveredEl) return;
    hoveredEl = el;
    const rect = el.getBoundingClientRect();
    showHighlight(rect, el);

    window.parent.postMessage({
      type: 'EDITOR_ELEMENT_HOVERED',
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 100),
    }, PARENT_ORIGIN);
  });

  // ── Click ──
  document.addEventListener('click', (e) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    const rect = el.getBoundingClientRect();

    // Switch highlight to coral (selected state)
    overlay.style.borderColor = '#E8624A';
    overlay.style.background = 'rgba(232,98,74,0.08)';
    label.style.background = '#E8624A';

    window.parent.postMessage({
      type: 'EDITOR_ELEMENT_SELECTED',
      selector: getCssPath(el),
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className || null,
      text: (el.textContent || '').trim().slice(0, 200),
      componentHint: getComponentHint(el),
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      pageUrl: window.location.pathname,
    }, PARENT_ORIGIN);
  }, true);

  // ── Intercept fetch() — block mutating API calls ──
  const originalFetch = window.fetch;
  window.fetch = function(url, opts) {
    const method = (opts?.method || 'GET').toUpperCase();
    if (typeof url === 'string' && url.startsWith('/api/') && method !== 'GET') {
      console.log('[editor-bridge] Blocked mutating fetch:', method, url);
      return Promise.resolve(new Response(
        JSON.stringify({ blocked: true, reason: 'editor-preview-mode' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));
    }
    return originalFetch.apply(this, arguments);
  };

  // ── Intercept XMLHttpRequest — block mutating XHR calls (gap #6) ──
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._editorMethod = method;
    this._editorUrl = url;
    return originalXhrOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    const method = (this._editorMethod || 'GET').toUpperCase();
    if (typeof this._editorUrl === 'string' && this._editorUrl.startsWith('/api/') && method !== 'GET') {
      console.log('[editor-bridge] Blocked mutating XHR:', method, this._editorUrl);
      // Simulate a successful empty response
      Object.defineProperty(this, 'status', { value: 200 });
      Object.defineProperty(this, 'responseText', { value: '{"blocked":true}' });
      if (this.onload) this.onload();
      return;
    }
    return originalXhrSend.apply(this, arguments);
  };

  // ── Notify parent that bridge is ready ──
  window.parent.postMessage({ type: 'EDITOR_BRIDGE_READY' }, PARENT_ORIGIN);
})();
```

**Key improvements from v1**:
- **XHR interception** (gap #6): Monkey-patches `XMLHttpRequest.prototype.open/send` in addition to `fetch()`
- **Element label tooltip**: Shows tag + class on hover, positioned above the element
- **Origin check**: All `postMessage` handlers verify `e.origin === PARENT_ORIGIN`
- **Activation guard**: Every handler checks `if (!active) return` — zero impact when not in editor

✅ DO:
```javascript
// Correct: check active state AND origin
window.addEventListener('message', (e) => {
  if (e.origin !== PARENT_ORIGIN) return; // Security check
  if (e.data?.type === 'EDITOR_ACTIVATE') { active = true; }
});

document.addEventListener('click', (e) => {
  if (!active) return; // Only when editor is active
  e.preventDefault();
});
```

❌ DON'T:
```javascript
// Wrong: no origin check, no active guard
window.addEventListener('message', (e) => {
  active = true; // Accepts from ANY origin!
});
document.addEventListener('click', (e) => {
  e.preventDefault(); // Always blocks clicks!
});
```

**Verification (R7)**:
```bash
npm run build
git add public/editor-bridge.js
git commit -m "phase 5: editor-bridge.js — postMessage + fetch/XHR interception + element labels"
```

> ⚠️ **BE CAREFUL**: This file is in `public/` and publicly accessible. It MUST NOT activate on page load — only on receiving `EDITOR_ACTIVATE`. Verify the `PARENT_ORIGIN` check exists on ALL event listeners. The fetch/XHR interception must ONLY block calls to `/api/` with mutating methods — do NOT block external requests (analytics, fonts, CDN). Do NOT modify any other files in `public/`. Test that the XHR interception doesn't break page loading (some Next.js data fetching might use XHR internally). If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 6 — Dashboard Integration: Page, Sidebar, Middleware

#### [NEW] `app/[locale]/dashboard/editor/page.tsx`

```tsx
"use client";
import EditorPage from "@/components/editor/EditorPage";

export default function EditorDashboardPage() {
  return <EditorPage />;
}
```

Note: This page does NOT use `<DashboardLayout>` because the editor has its own full-screen layout with toolbar and panels.

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`

Two surgical changes only:

**Change 1** — Add `Paintbrush` to lucide import (line 9-14):

```diff
 import {
   Home, Calendar, Clock, MessageCircle, Users, Scissors,
   BarChart, Settings, Menu, X, ChevronRight,
   ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
-  MessageSquareWarning, Star, PieChart,
+  MessageSquareWarning, Star, PieChart, Paintbrush,
 } from "lucide-react";
```

**Change 2** — Add editor entry to `ADMIN_NAV` array (after line 33, before `] as const`):

```diff
   { label: "Segmente",            href: "/dashboard/segments",           icon: PieChart },
+  { label: "Visual Editor",       href: "/dashboard/editor",             icon: Paintbrush },
 ] as const;
```

**Touch NOTHING else in this file.**

#### [MODIFY] `middleware.ts`

One surgical change — add `"/editor"` to `adminOnlyPaths` (line 159-163):

```diff
 const adminOnlyPaths = [
   "/all-salons", "/all-users", "/platform-analytics",
   "/badge-manager", "/content-editor", "/segments",
   "/revenue", "/review-moderation", "/approvals",
+  "/editor",
 ];
```

**Touch NOTHING else in this file.**

✅ DO:
```typescript
// Correct: match existing ADMIN_NAV pattern exactly
{ label: "Visual Editor", href: "/dashboard/editor", icon: Paintbrush },
```

❌ DON'T:
```typescript
// Wrong: different pattern, emoji icon, wrong path
{ label: "🎨 Editor", href: "/editor", icon: null },
```

**Verification (R7)**:
```bash
npm run build
npx tsc --noEmit

git add app/[locale]/dashboard/editor/ components/dashboard/DashboardLayout.tsx middleware.ts
git commit -m "phase 6: editor dashboard page + sidebar link (admin-only) + middleware guard"

# After deploy, verify:
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/dashboard/editor
# Should return 307 (redirect to login) for unauthenticated users
```

> ⚠️ **BE CAREFUL**: When modifying `DashboardLayout.tsx`, ONLY add `Paintbrush` to the import and ONE entry to `ADMIN_NAV`. Do NOT restructure nav, change styling, touch mobile nav, or modify any other component behavior. When modifying `middleware.ts`, ONLY add `"/editor"` to `adminOnlyPaths`. Do NOT change auth logic, CORS, or any other middleware behavior. Verify `npm run build` passes. If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

### Phase 7 — CLAUDE.md + Docs Updates (R8)

#### [MODIFY] `CLAUDE.md`

1. **Section 3.2 (Key Directories)**: Add `├── components/editor/      # Visual Editor (admin-only)`
2. **Section 3.5 (Key Features)**: Add item 23:
   ```
   23. **Visual Editor**: Admin-only element selector at `/dashboard/editor`. Click any element → describe change → Claude API generates roadmap in CLAUDE.md R1-R10 format. Supports device preview, request queue, and cost tracking.
   ```
3. **Section 6 (Schema)**: Add row:
   ```
   | `feature_requests` | `id`, `admin_id`, `element_selector`, `element_tag`, `element_text`, `component_hint`, `page_url`, `description`, `priority`, `status`, `generated_roadmap`, `roadmap_version`, `claude_prompt`, `token_usage` | Admin visual editor requests. RLS: admin-only all ops. |
   ```
4. **Section 4.6 (Admin Paths)**: Note that `/editor` is in `adminOnlyPaths`

#### [MODIFY] `.env.example`

Append at bottom:
```
# --- AI — Anthropic Claude API (for Visual Editor roadmap generation) ---
# Get from: console.anthropic.com → API Keys → Create
# Required for: /api/admin/generate-roadmap
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### [NEW] `components/editor/README.md`

Short README documenting:
- What the visual editor does
- How `editor-bridge.js` works
- How to add `data-component` attributes to components (for better component detection)
- Cost tracking notes

**Verification (R7)**:
```bash
npm run build
git add CLAUDE.md .env.example components/editor/README.md
git commit -m "phase 7: update CLAUDE.md schema + .env.example + editor README"
```

> ⚠️ **BE CAREFUL**: When editing `CLAUDE.md`, make surgical edits with `multi_replace_file_content`. Do NOT rewrite entire sections. Only INSERT new content at the right locations. Verify the file still renders correctly. Do NOT remove or modify any existing rules, tables, or sections. If you cannot complete this phase, append to `_tasks/INCOMPLETE_FEATURES.md`.

---

## Dependency Ordering Table (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Create `feature_requests` table (migration 066) + `supabase db push` | Nothing |
| Phase 2 | 🤖 | API routes: CRUD + utility updates (`ratelimit.ts`, `feature-flags.ts`, `validations.ts`) | Phase 1 |
| Phase 3 | 🤖 | Editor UI components | Nothing (can parallel with 1-2, but run sequentially for safety) |
| Phase 4 | 🤖 | Claude API integration + prompt templates | Phase 2 |
| Phase 5 | 🤖 | `editor-bridge.js` iframe script | Nothing |
| Phase 6 | 🤖 | Dashboard page + sidebar + middleware | Phases 3, 5 |
| Phase 7 | 🤖 | CLAUDE.md + docs | All phases complete |

**Execute sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7.** Commit after each phase.

---

## Known Limitations (v1)

| Limitation | Description | Planned For |
|---|---|---|
| `component_hint` often null | No `data-component` attrs exist yet. Admin must type component name manually. | v2: Add annotation utility or Babel plugin |
| Single element selection | Cannot select multiple elements for batch description | v2 |
| No screenshot/annotation | Cannot draw on or annotate the preview | v2: `html2canvas` + canvas overlay |
| No undo history | Individual request undo requires manual status change in RequestList | v2 |
| `getSession()` vs `getUser()` | Existing admin routes use `getSession()`. Should be `getUser()` for JWT validation. | Global security sweep |
| Safari iframe cookies | Safari may block cookies in iframes. Workaround: don't use `sandbox` attr | Monitor, add fallback if reported |

---

## Post-Execution Notes

### How the "Live Copy" Works
The iframe loads the actual live site (same origin). No separate copy. Benefits:
- ✅ Auto-updates with every Vercel deployment
- ✅ All pages accessible (including admin dashboard)
- ✅ Real data displayed (GET requests work)
- ✅ Safe (POST/PATCH/DELETE blocked by `editor-bridge.js`)
- ✅ Revert = reload iframe

### Antigravity Integration
Generated roadmaps live in `feature_requests.generated_roadmap` in Supabase. To use them:
1. **Copy to clipboard** → paste into `_tasks/roadmap-editor-{name}.md`
2. **Download as .md** → save directly into `_tasks/`
3. **Future**: Local sync script to auto-write to `~/.gemini/antigravity/brain/` (uses `$HOME`, not hardcoded path)

### Cost Tracking
Each Claude API call logs `input_tokens`, `output_tokens`, `model`, `generated_at` to `feature_requests.token_usage`. The RequestList page shows cumulative costs. Claude Sonnet at current pricing: ~$0.003/1K input, ~$0.015/1K output. A typical 8K-output-token roadmap with ~2K input tokens costs **~$0.13** per generation. Budget accordingly.
