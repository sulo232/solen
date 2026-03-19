# Roadmap: Admin Visual Editor

> **Goal**: Build a full-page admin-only visual editor at `/dashboard/editor` where admins preview the entire solen.ch site (UI-only, no working APIs), click on any element, describe desired changes, and auto-generate Claude Code-compatible roadmaps. Includes revert-to-live, request queue, and Antigravity integration.

---

## Breakage Risk Assessment (R1)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Manual A | 🟡 MEDIUM | Runtime crash if `ANTHROPIC_API_KEY` missing | Set env var before Phase 4 |
| Phase 1 | 🟢 SAFE | Nothing | New migration, new table only |
| Phase 2 | 🟢 SAFE | Nothing | New API routes only, no existing code touched |
| Phase 3 | 🟢 SAFE | Nothing | New components in `components/editor/`, no existing components modified |
| Phase 4 | 🟡 MEDIUM | API 500 if API key missing | Check env var exists before calling Anthropic |
| Phase 5 | 🟢 SAFE | Nothing | New injection script in `public/`, zero impact on non-editor visitors |
| Phase 6 | 🟡 MEDIUM | Sidebar layout shift | Add entry to ADMIN_NAV array — must match existing pattern exactly |
| Phase 7 | 🟢 SAFE | Nothing | CLAUDE.md + `.env.example` documentation only |

---

## 🧑 MANUAL PHASES

### Manual A — Set Anthropic API Key in Vercel + `.env.local`

**Why**: Phase 4 calls the Claude API to generate roadmaps. This key must exist in ALL environments.

**Steps**:
1. Go to [Anthropic Console](https://console.anthropic.com/) → API Keys → Create key
2. Copy the key (starts with `sk-ant-`)
3. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
4. Go to [Vercel Dashboard](https://vercel.com/sulo232s-projects/solen/settings/environment-variables):
   - Variable name: `ANTHROPIC_API_KEY`
   - Value: paste key
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Redeploy after adding

### Manual B — Verify Supabase Migration

After Phase 1 is pushed:
1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM feature_requests LIMIT 1;`
3. Should return empty results (no error)

---

## 🤖 CLAUDE CODE PHASES

---

### Phase 1 — Database: `feature_requests` Table

#### [NEW] `supabase/migrations/XXX_create_feature_requests.sql`

> Pick the next sequential migration number from `supabase/migrations/`.

Creates the `feature_requests` table with full RLS (admin-only).

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
  claude_prompt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin-only
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
```

✅ DO:
```sql
-- Correct: admin-only policies with subquery check
CREATE POLICY "feature_requests_admin_select" ON public.feature_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

❌ DON'T:
```sql
-- Wrong: public access
CREATE POLICY "feature_requests_yolo" ON public.feature_requests
  FOR ALL USING (true);
```

**Verification (R7)**:
```bash
git add supabase/migrations/
git commit -m "phase 1: create feature_requests table with admin-only RLS"
npm run build
```
Then apply via Supabase Dashboard or `supabase db push`.

> ⚠️ **BE CAREFUL**: Check the next migration number in `supabase/migrations/` — do NOT create a migration number that already exists. If you're unsure, run `ls supabase/migrations/ | tail -5` first. Do NOT touch any other tables.

---

### Phase 2 — API Routes: Feature Requests CRUD + Roadmap Generation

#### [NEW] `app/api/admin/feature-requests/route.ts`

**GET** — List all feature requests with pagination.
**POST** — Create a new feature request.

Must follow the existing admin API security pattern exactly (see `app/api/admin/salons/route.ts` for reference):

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  // 1. Auth + role check (MANDATORY)
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 2. Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 3. Query
  const admin = createAdminSupabaseClient();
  const status = req.nextUrl.searchParams.get("status");
  let query = admin.from("feature_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data });
}

export async function POST(req: NextRequest) {
  // ... same auth/role pattern ...
  // Validate body with zod, insert into feature_requests
}
```

#### [NEW] `app/api/admin/feature-requests/[id]/route.ts`

**PATCH** — Update status (e.g., mark as `in_progress`, `done`, `reverted`).
**DELETE** — Remove a feature request.

Same security pattern as above.

#### [NEW] `app/api/admin/generate-roadmap/route.ts`

Calls Claude API (Anthropic) to generate a roadmap from a feature request.

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  // Auth + admin role check (same pattern)
  // ...

  const { requestId } = await req.json();
  const admin = createAdminSupabaseClient();

  // Fetch the feature request
  const { data: featureReq } = await admin
    .from("feature_requests").select("*").eq("id", requestId).single();
  if (!featureReq) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build Claude prompt
  const systemPrompt = `You are a senior full-stack engineer working on solen.ch...
  [Include CLAUDE.md Section 12 roadmap standards here]
  [Include component context, file paths, design system tokens]`;

  const userPrompt = `Generate a roadmap for this change:
  - Page: ${featureReq.page_url}
  - Element: <${featureReq.element_tag}> with selector "${featureReq.element_selector}"
  - Component: ${featureReq.component_hint || "unknown"}
  - Text content: "${featureReq.element_text}"
  - Admin's description: "${featureReq.description}"
  - Priority: ${featureReq.priority}`;

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const result = await response.json();
  const roadmapMarkdown = result.content?.[0]?.text ?? "";

  // Save generated roadmap back to feature request
  await admin.from("feature_requests")
    .update({ generated_roadmap: roadmapMarkdown, status: "roadmap_generated" })
    .eq("id", requestId);

  return NextResponse.json({ roadmap: roadmapMarkdown });
}
```

✅ DO:
```typescript
// Correct: check API key exists before calling
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
```

❌ DON'T:
```typescript
// Wrong: no env var check — will crash with undefined
const response = await fetch("https://api.anthropic.com/v1/messages", {
  headers: { "x-api-key": process.env.ANTHROPIC_API_KEY },
  // ...
});
```

#### [NEW] `lib/validations.ts` — append new schemas

Add zod schemas for feature request creation and update:

```typescript
export const createFeatureRequestSchema = z.object({
  element_selector: z.string().max(500).optional(),
  element_tag: z.string().max(50).optional(),
  element_text: z.string().max(500).optional(),
  component_hint: z.string().max(100).optional(),
  page_url: z.string().url().max(500),
  description: z.string().min(5).max(2000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const updateFeatureRequestSchema = z.object({
  status: z.enum(["pending", "roadmap_generated", "in_progress", "done", "reverted"]).optional(),
  description: z.string().min(5).max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});
```

**Verification (R7)**:
```bash
npm run build
git add app/api/admin/feature-requests/ app/api/admin/generate-roadmap/ lib/validations.ts
git commit -m "phase 2: feature request API routes + Claude roadmap generation"
```

> ⚠️ **BE CAREFUL**: Do NOT modify existing zod schemas in `lib/validations.ts` — only APPEND new ones at the bottom. Do NOT use `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_` context. The `generate-roadmap` route MUST check for `ANTHROPIC_API_KEY` existence before calling. Do NOT import any component that doesn't exist yet.

---

### Phase 3 — Editor UI: Core Components

All new files, no existing files modified.

#### [NEW] `components/editor/EditorPage.tsx`

The main editor layout with three zones:

```
┌─────────────────────────────────────────────────────────┐
│  Toolbar: [← Back] [URL: /de/___________] [📱 💻 🖥️] [↺ Revert]  │
├────────────────────────────────────┬────────────────────┤
│                                    │  Edit Panel        │
│   Site Preview (iframe)            │  (slides in on     │
│   - Full width when panel closed   │   element select)  │
│   - Element highlight on hover     │                    │
│   - Blue outline on click-select   │  • Element info    │
│   - All pages navigable            │  • Description     │
│   - UI-only (APIs intercepted)     │  • Priority        │
│   - Scrollable                     │  • Generate Roadmap│
│                                    │  • Request History │
│                                    │                    │
├────────────────────────────────────┴────────────────────┤
│  Status bar: "Selected: <button.cta> on /de/coiffeur"   │
└─────────────────────────────────────────────────────────┘
```

**Key features**:
- **URL bar**: Type any path (e.g. `/de/dashboard/bookings`) to navigate the iframe there
- **Device presets**: Desktop (1440px), Tablet (768px), Mobile (375px) — resizes the iframe container
- **Revert button**: Reloads the iframe to the current URL, discarding any visual state. If multiple requests have been submitted, shows a "Revert to Live" option that reloads the iframe fresh from the origin
- **Edit mode toggle**: When ON, hovering highlights elements, clicking selects. When OFF, normal iframe browsing
- **Iframe sandbox**: Loads with `sandbox="allow-same-origin allow-scripts allow-popups allow-forms"` to keep it functional but sandboxed. Injects `editor-bridge.js` via postMessage

#### [NEW] `components/editor/EditPanel.tsx`

**Side panel (360px wide, slides from right)**:
- **Element Info Section**: Shows selected element's tag, CSS path, visible text, guessed component name
- **Change Description**: Multi-line textarea — "What do you want changed?"
- **Priority Picker**: Three-button toggle (Low / Medium / High) with coral highlight
- **"Save Request" button**: Saves to `POST /api/admin/feature-requests`
- **"Generate Roadmap" button**: Calls `POST /api/admin/generate-roadmap` → shows generated markdown in a code block
- **"Copy Roadmap" button**: Copies the generated markdown to clipboard (for pasting into `_tasks/` or Antigravity)
- **"View in Antigravity" link**: Opens the Antigravity artifact directory path — `file:///Users/sulo/.gemini/antigravity/brain/` (deep-link, OS will open Finder/Cursor)
- **Request History List**: Collapsible list of past requests for the current page URL, with status badges

#### [NEW] `components/editor/RequestList.tsx`

Full list view of all feature requests with:
- Filter by status (pending / roadmap_generated / in_progress / done)
- Each card shows: page URL, description preview, priority badge, status badge, timestamp
- Expand to see full generated roadmap
- Status update buttons (Mark in progress / Mark done / Revert)
- "Copy Roadmap to Clipboard" per request
- "Download as .md" per request — downloads as `roadmap-editor-{id}.md`

#### [NEW] `components/editor/DeviceFrame.tsx`

Responsive iframe container that resizes based on selected device:
- Desktop: `width: 100%` (fills available space)
- Tablet: `width: 768px`, centered with shadow
- Mobile: `width: 375px`, centered with phone-style rounded frame

Uses Solen design tokens: `rounded-card`, `shadow-warm-md`, `bg-s-bg-surface`.

✅ DO:
```tsx
// Correct: use Solen design tokens
<div className="bg-white rounded-card border border-s-ink/5 shadow-card p-4">
  <textarea className="w-full bg-s-bg-sunken rounded-button border border-s-ink/10 p-3 text-sm text-s-ink" />
  <button className="bg-s-coral text-white rounded-button px-4 py-2 text-sm font-medium">
    Save Request
  </button>
</div>
```

❌ DON'T:
```tsx
// Wrong: generic Tailwind, no design tokens
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

npm run build
git add components/editor/
git commit -m "phase 3: editor UI components — EditorPage, EditPanel, RequestList, DeviceFrame"
```

> ⚠️ **BE CAREFUL**: ALL components MUST use Solen design tokens (`s-coral`, `s-ink`, `rounded-card`, `shadow-card`, etc.) — see CLAUDE.md Section 3.3 and UI_RULES.md. Do NOT use `rounded-lg`, `bg-gray-*`, `text-gray-*`, or any banned tokens from CLAUDE.md Rule 20. Every `bg-white` must have a `dark:bg-s-dm-*` pair. Icons must be from `lucide-react`. Do NOT import components that don't exist yet — only use components that exist in `components/ui/` and `components/dashboard/`.

---

### Phase 4 — Claude API Integration & Roadmap Generation System

This phase wires up the Claude API call and the roadmap generation logic.

#### [NEW] `lib/editor-prompts.ts`

Contains the system prompt template for Claude, built from CLAUDE.md Section 12 roadmap standards:

```typescript
export function buildRoadmapSystemPrompt(): string {
  return `You are a senior full-stack engineer working on solen.ch, a Next.js beauty booking platform.
  
You MUST follow these roadmap creation standards (from CLAUDE.md Section 12):
- R1: Start with a breakage risk assessment table
- R2: Separate manual vs code phases
- R3: End every phase with a "BE CAREFUL" block
- R4: Include DO/DON'T code examples for every code phase
- R5: Use [NEW]/[MODIFY]/[DELETE] tags with full file paths
- R6: End with a dependency ordering table
- R7: Include verification steps per phase (git commit + build + test)
- R8: Final phase updates CLAUDE.md if introducing new patterns/tables/env vars

Tech stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Stripe, lucide-react icons.
Design tokens: coral #E8624A (primary), amber #D4870A, blue #6BA3C8, ink #1A1209 (text).
Components are in components/, pages in app/[locale]/, API routes in app/api/.

Generate a complete, actionable roadmap that Claude Code can execute.`;
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
**Element**: <${request.element_tag || 'unknown'}> at "${request.element_selector || 'unknown'}"
**Component (best guess)**: ${request.component_hint || 'unknown — check file system'}
**Visible text**: "${request.element_text || 'N/A'}"
**Admin's request**: "${request.description}"
**Priority**: ${request.priority}

Generate a complete roadmap in markdown format following all CLAUDE.md R1-R10 standards.`;
}
```

#### [MODIFY] `app/api/admin/generate-roadmap/route.ts` (created in Phase 2)

Wire up the prompt templates from `lib/editor-prompts.ts`. The route:
1. Fetches the feature request from DB
2. Builds the prompt using `buildRoadmapSystemPrompt()` + `buildRoadmapUserPrompt()`
3. Calls Claude API (`claude-sonnet-4-20250514`)
4. Saves generated roadmap markdown to `feature_requests.generated_roadmap`
5. Also builds a `claude_prompt` field — the exact prompt to paste into Claude Code CLI
6. Returns both the roadmap and the prompt

The Claude Code prompt format:
```
Read _tasks/roadmap-editor-{id}.md and execute it phase by phase.
Follow CLAUDE.md rules strictly. Commit after each sub-phase.
```

✅ DO:
```typescript
// Correct: graceful API key check + error handling
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  return NextResponse.json(
    { error: "ANTHROPIC_API_KEY not configured. Ask admin to set it in Vercel." },
    { status: 500 }
  );
}

const response = await fetch("https://api.anthropic.com/v1/messages", { ... });
if (!response.ok) {
  const errBody = await response.text();
  console.error("[generate-roadmap] Claude API error:", errBody);
  return NextResponse.json({ error: "Roadmap generation failed" }, { status: 502 });
}
```

❌ DON'T:
```typescript
// Wrong: no error handling, will crash if key missing or API down
const response = await fetch("https://api.anthropic.com/v1/messages", {
  headers: { "x-api-key": process.env.ANTHROPIC_API_KEY! }, // crashes if undefined
  body: JSON.stringify({ ... }),
});
const result = await response.json(); // crashes if non-JSON error response
```

**Verification (R7)**:
```bash
npm run build
git add lib/editor-prompts.ts app/api/admin/generate-roadmap/
git commit -m "phase 4: Claude API integration for roadmap generation"
```

> ⚠️ **BE CAREFUL**: The Claude API key is a SECRET — never log it, never include it in responses, never expose it client-side. Use `process.env.ANTHROPIC_API_KEY` server-side only. The API call MUST include error handling for: missing key, rate limiting from Anthropic, malformed responses, and network timeouts. Set a `signal: AbortSignal.timeout(30000)` on the fetch to prevent hanging. Do NOT use `NEXT_PUBLIC_ANTHROPIC_API_KEY` — this is a server-only secret.

---

### Phase 5 — Editor Bridge: Iframe ↔ Editor Communication

#### [NEW] `public/editor-bridge.js`

Vanilla JS script loaded by the iframe when in editor mode. Communicates with the parent editor page via `postMessage`.

```javascript
// editor-bridge.js — Injected into iframe by the editor
// Only activates when receiving EDITOR_ACTIVATE from parent
(function() {
  'use strict';
  
  let active = false;
  let hoveredEl = null;
  const PARENT_ORIGIN = window.location.origin;
  
  // Listen for activation from parent editor
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
  
  // Build CSS selector path for element
  function getCssPath(el) {
    const parts = [];
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();
      if (el.id) selector += '#' + el.id;
      else if (el.className && typeof el.className === 'string') {
        const cls = el.className.split(' ').filter(c => c && !c.startsWith('__')).slice(0, 2).join('.');
        if (cls) selector += '.' + cls;
      }
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }
  
  // Get guessed component name from data-component attr or class name
  function getComponentHint(el) {
    let current = el;
    while (current && current !== document.body) {
      if (current.dataset?.component) return current.dataset.component;
      current = current.parentElement;
    }
    return null;
  }
  
  // Highlight overlay
  const overlay = document.createElement('div');
  overlay.id = '__editor-highlight';
  overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #6BA3C8;background:rgba(107,163,200,0.08);z-index:99999;transition:all 0.15s ease;display:none;border-radius:4px;';
  document.body.appendChild(overlay);
  
  function showHighlight(rect) {
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }
  
  function removeHighlight() {
    overlay.style.display = 'none';
  }
  
  // Hover handler
  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === overlay || el === hoveredEl) return;
    hoveredEl = el;
    const rect = el.getBoundingClientRect();
    showHighlight(rect);
    
    // Tell parent about hovered element
    window.parent.postMessage({
      type: 'EDITOR_ELEMENT_HOVERED',
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 100),
    }, PARENT_ORIGIN);
  });
  
  // Click handler
  document.addEventListener('click', (e) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.target;
    const rect = el.getBoundingClientRect();
    
    // Change highlight to coral (selected state)
    overlay.style.borderColor = '#E8624A';
    overlay.style.background = 'rgba(232,98,74,0.08)';
    
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
  }, true); // capture phase to intercept before bubbling
  
  // Intercept all fetch calls to prevent API side effects in preview mode
  const originalFetch = window.fetch;
  window.fetch = function(url, opts) {
    // Allow GET requests (read-only) but block POST/PATCH/DELETE
    const method = (opts?.method || 'GET').toUpperCase();
    if (typeof url === 'string' && url.startsWith('/api/') && method !== 'GET') {
      console.log('[editor-bridge] Blocked mutating API call:', method, url);
      return Promise.resolve(new Response(JSON.stringify({ blocked: true, reason: 'editor-preview' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    return originalFetch.apply(this, arguments);
  };
  
  // Notify parent that bridge is ready
  window.parent.postMessage({ type: 'EDITOR_BRIDGE_READY' }, PARENT_ORIGIN);
})();
```

**Key behaviors**:
- **Highlight**: Blue (`#6BA3C8`) on hover, Coral (`#E8624A`) when selected
- **API interception**: All mutating API calls (`POST`, `PATCH`, `DELETE`) to `/api/*` are silently blocked and return a fake success response. `GET` calls still work so pages can load their data/UI
- **Element info**: Sends CSS selector path, tag name, text content, `data-component` hint
- **Navigation**: Parent can send `EDITOR_NAVIGATE` to navigate the iframe to a different URL
- **Activation**: Only activates when parent sends `EDITOR_ACTIVATE` — zero impact when not in editor

✅ DO:
```javascript
// Correct: only intercept when in editor mode
document.addEventListener('click', (e) => {
  if (!active) return; // Does nothing if editor not active
  e.preventDefault();
  // ...
}, true);
```

❌ DON'T:
```javascript
// Wrong: always intercepts clicks, breaks normal site usage
document.addEventListener('click', (e) => {
  e.preventDefault(); // Always prevents clicks!
  // ...
}, true);
```

**Verification (R7)**:
```bash
npm run build
git add public/editor-bridge.js
git commit -m "phase 5: editor-bridge.js — iframe postMessage communication + API interception"
```

> ⚠️ **BE CAREFUL**: This script is in `public/` which means it's publicly accessible. That's fine — it only activates when receiving `EDITOR_ACTIVATE` from the parent. Verify that the script does NOT automatically activate on page load. Verify `PARENT_ORIGIN` check is present on ALL `window.addEventListener('message')` handlers to prevent cross-origin attacks. Do NOT modify any existing files in `public/`. The fetch interception MUST preserve the original `window.fetch` and only intercept mutating calls.

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

Note: This page does NOT use `<DashboardLayout>` because the editor has its own full-screen layout with its own toolbar and sidebar. The editor fills the entire viewport.

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`

**BEFORE** (line 13-14):
```typescript
import {
  Home, Calendar, Clock, MessageCircle, Users, Scissors,
  BarChart, Settings, Menu, X, ChevronRight,
  ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
  MessageSquareWarning, Star, PieChart,
} from "lucide-react";
```

**AFTER**:
```typescript
import {
  Home, Calendar, Clock, MessageCircle, Users, Scissors,
  BarChart, Settings, Menu, X, ChevronRight,
  ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
  MessageSquareWarning, Star, PieChart, Paintbrush,
} from "lucide-react";
```

**BEFORE** (line 23-33, `ADMIN_NAV` array):
```typescript
const ADMIN_NAV = [
  { label: "Genehmigungen",       href: "/dashboard/approvals",           icon: ShieldCheck },
  // ... existing entries ...
  { label: "Segmente",            href: "/dashboard/segments",           icon: PieChart },
] as const;
```

**AFTER**:
```typescript
const ADMIN_NAV = [
  { label: "Genehmigungen",       href: "/dashboard/approvals",           icon: ShieldCheck },
  // ... existing entries (unchanged) ...
  { label: "Segmente",            href: "/dashboard/segments",           icon: PieChart },
  { label: "Visual Editor",       href: "/dashboard/editor",             icon: Paintbrush },
] as const;
```

Only two changes: import `Paintbrush`, add one entry to `ADMIN_NAV`. Touch NOTHING else.

#### [MODIFY] `middleware.ts`

**BEFORE** (line 159-163):
```typescript
const adminOnlyPaths = [
  "/all-salons", "/all-users", "/platform-analytics",
  "/badge-manager", "/content-editor", "/segments",
  "/revenue", "/review-moderation", "/approvals",
];
```

**AFTER**:
```typescript
const adminOnlyPaths = [
  "/all-salons", "/all-users", "/platform-analytics",
  "/badge-manager", "/content-editor", "/segments",
  "/revenue", "/review-moderation", "/approvals",
  "/editor",
];
```

One line added. Touch NOTHING else.

✅ DO:
```typescript
// Correct: add to existing array, match pattern
{ label: "Visual Editor", href: "/dashboard/editor", icon: Paintbrush },
```

❌ DON'T:
```typescript
// Wrong: creating a separate nav section, or using emoji instead of lucide icon
{ label: "🎨 Editor", href: "/editor", icon: null }, // Wrong path, emoji icon
```

**Verification (R7)**:
```bash
npm run build
npx tsc --noEmit

# Verify middleware works: non-admin should NOT access editor
# (manual test after deployment)

git add app/[locale]/dashboard/editor/ components/dashboard/DashboardLayout.tsx middleware.ts
git commit -m "phase 6: editor page, sidebar link, middleware guard"
```

> ⚠️ **BE CAREFUL**: When modifying `DashboardLayout.tsx`, ONLY add the `Paintbrush` import and the one `ADMIN_NAV` entry. Do NOT restructure the nav, do NOT change any styling, do NOT touch the mobile nav. When modifying `middleware.ts`, ONLY add `"/editor"` to the `adminOnlyPaths` array — do NOT change the auth logic, CORS handling, or any other middleware behavior. Verify that `npm run build` still passes after these changes.

---

### Phase 7 — CLAUDE.md + Docs Updates

#### [MODIFY] `CLAUDE.md`

1. **Section 3.2 (Key Directories)**: Add `components/editor/` to the directory tree
2. **Section 3.5 (Key Features)**: Add item 23: "Visual Editor: Admin-only element selector → feature request → Claude API roadmap generation."
3. **Section 6 (Schema)**: Add `feature_requests` table to the schema table
4. **Section 11 (Security)**: Add note that `ANTHROPIC_API_KEY` is server-only
5. **Middleware admin paths**: Note that `/editor` is admin-only

#### [MODIFY] `.env.example`

Append:
```
# --- AI — Anthropic Claude API (for Visual Editor roadmap generation) ---
# Get from: console.anthropic.com → API Keys → Create
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Verification (R7)**:
```bash
npm run build
git add CLAUDE.md .env.example
git commit -m "phase 7: update CLAUDE.md schema + .env.example with ANTHROPIC_API_KEY"
```

> ⚠️ **BE CAREFUL**: When editing `CLAUDE.md`, use the multi_replace tool to make surgical edits. Do NOT rewrite entire sections. Only append/insert new content. Verify the file still renders correctly in a markdown viewer after editing. Do NOT remove or modify any existing rules, tables, or sections.

---

## Dependency Ordering Table (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Set `ANTHROPIC_API_KEY` in Vercel + `.env.local` | Nothing |
| Phase 1 | 🤖 | Create `feature_requests` table migration | Nothing |
| Manual B | 🧑 | Apply migration to Supabase | Phase 1 |
| Phase 2 | 🤖 | API routes: CRUD + generate-roadmap | Phase 1, Manual A |
| Phase 3 | 🤖 | Editor UI components | Nothing (can run parallel with Phase 1-2) |
| Phase 4 | 🤖 | Claude API integration + prompt templates | Phase 2 |
| Phase 5 | 🤖 | `editor-bridge.js` iframe script | Nothing (can run parallel) |
| Phase 6 | 🤖 | Dashboard page + sidebar + middleware | Phases 3, 5 |
| Phase 7 | 🤖 | CLAUDE.md + `.env.example` updates | All phases complete |

**Parallel execution safe**: Phases 1+3+5 can run in parallel. Phase 2 needs Phase 1. Phase 4 needs Phase 2. Phase 6 needs 3+5. Phase 7 is always last.

---

## Post-Execution Notes

### Antigravity Integration

The generated roadmaps are stored in the `feature_requests.generated_roadmap` column in Supabase. To make them appear in Antigravity:

1. **Copy to clipboard** — The "Copy Roadmap" button in the editor copies the markdown. Paste it into a new file in `_tasks/roadmap-editor-{description}.md`
2. **Download as .md** — The "Download" button saves it directly as a `.md` file you can drop into `_tasks/`
3. **Antigravity auto-sync (future)** — A local script could watch the `feature_requests` table and auto-write new roadmaps to the artifacts directory at `~/.gemini/antigravity/brain/<conversation-id>/`

### Revert-to-Live

The "Revert" button in the editor toolbar:
- **Simple**: Reloads the iframe URL fresh — since the preview is just the live site in an iframe, revert = reload
- If the admin made many edit requests and wants to discard them all: the RequestList has a "Revert" status option that marks requests as `reverted`
- The actual live site is NEVER modified by the editor — all changes go through roadmaps executed by Claude Code

### Preview Copy

The iframe loads the live site directly. All pages work (including admin dashboard) because:
- The admin is logged in → session cookies pass through to the iframe (same origin)
- `editor-bridge.js` intercepts mutating API calls → no side effects
- GET calls still work → pages load real data for realistic preview
- No separate "copy" is needed — it IS the live site, just with mutations blocked
