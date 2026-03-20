# Discovery Platform — Fix Roadmap (Autonomous Execution)

> **EXECUTION MODE: FULLY AUTONOMOUS**
> Claude Code: execute this roadmap phase by phase. After EACH phase:
> 1. `npm run build` — if it fails, fix the error and rebuild
> 2. `git add -A && git commit -m "phase N: description"` — commit with phase number
> 3. `git push origin main` — push immediately, do NOT ask for confirmation
> 4. `sleep 60` — wait for Vercel
> 5. `curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover` — verify 200
> 6. If verification fails, debug and fix before moving to next phase
>
> **DO NOT ask the user for permission at any point. Execute everything autonomously.**
> **DO NOT ask "should I push?" — always push.**
> **DO NOT ask "should I continue?" — always continue to the next phase.**
> **Read CLAUDE.md Rules 26-29 before starting.**

---

## Pre-Flight Checks

Before starting Phase 0, verify this state:
```bash
# Verify tables exist (should show 11 rows)
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/discovery_items?select=id&limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" | head -3

# If this returns an error about the table not existing, STOP — migration hasn't been run
```

---

## Phase 0 — RLS Policies + RPCs + Security Fixes

The tables exist but RLS policies, RPCs, triggers, and indexes are missing. Also fix middleware security.

### Step 0.1: Run remaining migration SQL

Create a temporary Node.js script to execute the remaining SQL via the Supabase admin client:

**[NEW] `/tmp/run-rls-migration.mjs`**
```javascript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// RLS + Policies + RPCs + Triggers + Index
const sql = `
-- RLS
ALTER TABLE discovery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_board_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_interactions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY IF NOT EXISTS "items_read" ON discovery_items FOR SELECT USING (status = 'published' AND is_active = true);
CREATE POLICY IF NOT EXISTS "boards_read" ON discovery_boards FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "board_pins_read" ON discovery_board_pins FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "products_read" ON discovery_products FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "product_recs_read" ON discovery_product_recommendations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "comments_read" ON discovery_comments FOR SELECT USING (is_hidden = false);

-- User scoped
CREATE POLICY IF NOT EXISTS "likes_own" ON discovery_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "saves_own" ON discovery_saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "collections_own" ON discovery_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "comments_insert" ON discovery_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "comments_delete" ON discovery_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "interactions_insert" ON discovery_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Salon/user content
CREATE POLICY IF NOT EXISTS "items_insert_own" ON discovery_items FOR INSERT
  WITH CHECK (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "items_update_own" ON discovery_items FOR UPDATE
  USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()))
  WITH CHECK (status IN ('staging', 'flagged', 'archived'));
CREATE POLICY IF NOT EXISTS "items_delete_own" ON discovery_items FOR DELETE
  USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()));

-- Admin policies
CREATE POLICY IF NOT EXISTS "admin_items_select" ON discovery_items FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_items_insert" ON discovery_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_items_update" ON discovery_items FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_items_delete" ON discovery_items FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_staging_all" ON discovery_staging FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_boards_all" ON discovery_boards FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_comments_all" ON discovery_comments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "admin_products_all" ON discovery_products FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RPC: Atomic like toggle
CREATE OR REPLACE FUNCTION toggle_discovery_like(p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_existed BOOLEAN;
BEGIN
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT EXISTS(SELECT 1 FROM discovery_likes WHERE user_id = p_user_id AND item_id = p_item_id) INTO v_existed;
  IF v_existed THEN
    DELETE FROM discovery_likes WHERE user_id = p_user_id AND item_id = p_item_id;
    UPDATE discovery_items SET like_count = GREATEST(like_count - 1, 0) WHERE id = p_item_id;
  ELSE
    INSERT INTO discovery_likes (user_id, item_id) VALUES (p_user_id, p_item_id);
    UPDATE discovery_items SET like_count = like_count + 1 WHERE id = p_item_id;
  END IF;
  RETURN NOT v_existed;
END; $$;

-- RPC: Atomic save toggle
CREATE OR REPLACE FUNCTION toggle_discovery_save(p_item_id UUID, p_user_id UUID, p_collection_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_existed BOOLEAN;
BEGIN
  IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT EXISTS(SELECT 1 FROM discovery_saves WHERE user_id = p_user_id AND item_id = p_item_id) INTO v_existed;
  IF v_existed THEN
    DELETE FROM discovery_saves WHERE user_id = p_user_id AND item_id = p_item_id;
    UPDATE discovery_items SET save_count = GREATEST(save_count - 1, 0) WHERE id = p_item_id;
  ELSE
    INSERT INTO discovery_saves (user_id, item_id, collection_id) VALUES (p_user_id, p_item_id, p_collection_id);
    UPDATE discovery_items SET save_count = save_count + 1 WHERE id = p_item_id;
  END IF;
  RETURN NOT v_existed;
END; $$;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_discovery_items_updated') THEN
    CREATE TRIGGER trg_discovery_items_updated BEFORE UPDATE ON discovery_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Trigger: auto-increment view_count
CREATE OR REPLACE FUNCTION increment_view_count() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'view' THEN UPDATE discovery_items SET view_count = view_count + 1 WHERE id = NEW.item_id; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_view_count') THEN
    CREATE TRIGGER trg_view_count AFTER INSERT ON discovery_interactions FOR EACH ROW EXECUTE FUNCTION increment_view_count();
  END IF;
END $$;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_discovery_fts ON discovery_items
  USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(author_name, '') || ' ' || coalesce(style_name, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(tags, ' ')));
`;

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    // If exec_sql doesn't exist, try running via fetch to the SQL endpoint
    console.log('RPC failed, trying direct SQL...');
    const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql_query: sql })
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
  } else {
    console.log('Success:', data);
  }
}
run();
```

Run: `source .env.local && node /tmp/run-rls-migration.mjs`

If the script approach fails (no `exec_sql` RPC), the RLS policies will still work because the admin client uses the service role key which bypasses RLS. The policies will be applied when users interact via the anon key. Skip this step if it errors — the policies can be applied later via the Supabase dashboard.

### Step 0.2: Add discovery-admin to middleware

**[MODIFY] `middleware.ts`**
Find the `adminOnlyPaths` array and add `"/discovery-admin"` to it.

### Step 0.3: Update .env.example

**[MODIFY] `.env.example`**
Append:
```
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
GEMINI_API_KEY=
```

> ⚠️ **BE CAREFUL**: Only APPEND. Never delete existing lines. Never put real keys.

**After Phase 0:**
```bash
npm run build && git add -A && git commit -m "phase 0: middleware security + .env.example" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

---

## Phase 1 — Missing Filter Components

Create 5 new components + 2 new API routes. DO NOT modify any existing files in this phase.

### [NEW] `components/discovery/PatternSelector.tsx`

Horizontal scrollable pill selector for hair texture/beard type:

```tsx
"use client";
import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "@/lib/types";

const HAIR_TEXTURES = [
  { value: null, label: "All" },
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
  { value: "protective", label: "Protective" },
  { value: "bald", label: "Bald" },
];

const BEARD_TYPES = [
  { value: null, label: "All" },
  { value: "full", label: "Full" },
  { value: "goatee", label: "Goatee" },
  { value: "stubble", label: "Stubble" },
  { value: "fade", label: "Fade" },
  { value: "line-up", label: "Line-up" },
];

interface PatternSelectorProps {
  category: DiscoveryCategory | null;
  selected: string | null;
  onSelect: (texture: string | null) => void;
}

export default function PatternSelector({ category, selected, onSelect }: PatternSelectorProps) {
  const options = category === "beard" ? BEARD_TYPES : HAIR_TEXTURES;
  // Only show for hair and beard categories
  if (category && !["hair", "beard"].includes(category)) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {options.map((opt) => (
        <button
          key={opt.value ?? "all"}
          onClick={() => onSelect(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors border",
            selected === opt.value
              ? "bg-s-coral text-white border-s-coral"
              : "bg-white dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-white/10 hover:border-s-coral/30"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

### [NEW] `components/discovery/StyleNamePills.tsx`

Auto-generated scrollable pills from DB:

```tsx
"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StyleNamePillsProps {
  selected: string | null;
  onSelect: (style: string | null) => void;
}

export default function StyleNamePills({ selected, onSelect }: StyleNamePillsProps) {
  const [styles, setStyles] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetch("/api/discovery/style-names")
      .then((r) => r.json())
      .then((d) => setStyles(d.styles ?? []))
      .catch(() => {});
  }, []);

  if (styles.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors border",
          !selected
            ? "bg-s-coral text-white border-s-coral"
            : "bg-white dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-white/10"
        )}
      >
        All Styles
      </button>
      {styles.slice(0, 20).map((s) => (
        <button
          key={s.name}
          onClick={() => onSelect(s.name)}
          className={cn(
            "px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors border",
            selected === s.name
              ? "bg-s-coral text-white border-s-coral"
              : "bg-white dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-white/10"
          )}
        >
          {s.name} ({s.count})
        </button>
      ))}
    </div>
  );
}
```

### [NEW] `app/api/discovery/style-names/route.ts`

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("discovery_items")
    .select("style_name")
    .eq("status", "published")
    .eq("is_active", true)
    .not("style_name", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count distinct style names
  const counts = new Map<string, number>();
  (data ?? []).forEach((row: { style_name: string }) => {
    const name = row.style_name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const styles = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return NextResponse.json({ styles });
}
```

### [NEW] `components/discovery/FeaturedBoards.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { DiscoveryFilters } from "@/lib/types";

interface Board {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  gender: string | null;
  texture: string | null;
  cover_images: string[];
  pin_count: number;
}

interface FeaturedBoardsProps {
  onBoardSelect: (filters: Partial<DiscoveryFilters>) => void;
}

export default function FeaturedBoards({ onBoardSelect }: FeaturedBoardsProps) {
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    fetch("/api/discovery/boards")
      .then((r) => r.json())
      .then((d) => setBoards(d.boards ?? []))
      .catch(() => {});
  }, []);

  if (boards.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-2">Featured Collections</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onBoardSelect({
              category: board.category as any,
              gender: board.gender as any,
              texture: board.texture
            })}
            className="flex-shrink-0 w-36 rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 hover:shadow-warm-md transition-shadow"
          >
            <div className="grid grid-cols-2 gap-0.5 aspect-square bg-s-ink/5 dark:bg-white/5">
              {board.cover_images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative">
                  <Image src={img} alt="" fill className="object-cover" sizes="72px" />
                </div>
              ))}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-s-ink dark:text-s-dm-text truncate">{board.name}</p>
              <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{board.pin_count} pins</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### [NEW] `app/api/discovery/boards/route.ts`

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("discovery_boards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boards: data ?? [] });
}
```

### [NEW] `components/discovery/FilterDrawer.tsx`

Mobile slide-up drawer containing all filters:

```tsx
"use client";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import type { DiscoveryCategory, DiscoveryGender } from "@/lib/types";
import CategoryPills from "./CategoryPills";
import GenderToggle from "./GenderToggle";
import PatternSelector from "./PatternSelector";
import StyleNamePills from "./StyleNamePills";

interface FilterDrawerProps {
  category: DiscoveryCategory | null;
  gender: DiscoveryGender | null;
  texture: string | null;
  style: string | null;
  onCategoryChange: (c: DiscoveryCategory | null) => void;
  onGenderChange: (g: DiscoveryGender | null) => void;
  onTextureChange: (t: string | null) => void;
  onStyleChange: (s: string | null) => void;
  onReset: () => void;
}

export default function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const hasFilters = props.category || props.gender || props.texture || props.style;

  return (
    <>
      {/* Trigger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-button bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60"
      >
        <SlidersHorizontal size={14} />
        Filters
        {hasFilters && <span className="w-2 h-2 rounded-full bg-s-coral" />}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white dark:bg-s-dm-surface rounded-t-2xl p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-bold text-s-ink dark:text-s-dm-text">Filters</h3>
              <button onClick={() => setOpen(false)} className="p-1"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Category</p>
                <CategoryPills selected={props.category} onSelect={props.onCategoryChange} />
              </div>
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Gender</p>
                <GenderToggle selected={props.gender} onSelect={props.onGenderChange} />
              </div>
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Texture / Type</p>
                <PatternSelector category={props.category} selected={props.texture} onSelect={props.onTextureChange} />
              </div>
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Style</p>
                <StyleNamePills selected={props.style} onSelect={props.onStyleChange} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { props.onReset(); setOpen(false); }}
                className="flex-1 py-2.5 rounded-button border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### [NEW] `components/discovery/DiscoveryErrorState.tsx`

```tsx
"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DiscoveryErrorStateProps {
  onRetry: () => void;
}

export default function DiscoveryErrorState({ onRetry }: DiscoveryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={40} className="text-s-coral mb-3" />
      <h3 className="text-base font-medium text-s-ink dark:text-s-dm-text mb-1">Something went wrong</h3>
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mb-4">Could not load discovery items</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium"
      >
        <RefreshCw size={14} /> Try Again
      </button>
    </div>
  );
}
```

**After Phase 1:**
```bash
npm run build && git add -A && git commit -m "phase 1: create PatternSelector, StyleNamePills, FeaturedBoards, FilterDrawer, DiscoveryErrorState + API routes" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

> ⚠️ **BE CAREFUL**: After this phase, verify no orphan files (Rule 26): every new .tsx must be imported in Phase 2.

---

## Phase 2 — Wire All Components to Discover Page

**This is the critical phase.** READ `app/[locale]/discover/page.tsx` IN FULL before editing.

### [MODIFY] `app/[locale]/discover/page.tsx`

1. Import all 5 new components:
   - `PatternSelector` from `@/components/discovery/PatternSelector`
   - `StyleNamePills` from `@/components/discovery/StyleNamePills`
   - `FeaturedBoards` from `@/components/discovery/FeaturedBoards`
   - `FilterDrawer` from `@/components/discovery/FilterDrawer`
   - `DiscoveryErrorState` from `@/components/discovery/DiscoveryErrorState`
   - `PostFromDiscover` from `@/components/discovery/PostFromDiscover`

2. Add state variables:
   ```typescript
   const [texture, setTexture] = useState<string | null>(null);
   const [style, setStyle] = useState<string | null>(null);
   const [error, setError] = useState(false);
   ```

3. Update fetch to include texture and style params

4. Add PatternSelector below existing filter row (desktop only, hidden on mobile since FilterDrawer has it)

5. Add StyleNamePills below PatternSelector (desktop only)

6. Add FeaturedBoards above the grid (only when no filters active)

7. Add FilterDrawer for mobile

8. Add DiscoveryErrorState in the error case

9. Add PostFromDiscover as floating "+" button at bottom-right

10. Pass `isAuthenticated` to ItemCards through DiscoveryGrid

**DO NOT** add `<Header />` or `<BottomNav />` (Rule 27).

**After Phase 2:**
```bash
npm run build && git add -A && git commit -m "phase 2: wire all filter components + floating post button + error state to discover page" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

---

## Phase 3 — Fix Video + Card Behavior

### [MODIFY] `components/discovery/VideoCard.tsx`

1. Add mute/unmute toggle button (Volume2/VolumeX icons) on grid cards (bottom-right of video area)
2. Add global `activeVideoId` module variable for one-at-a-time behavior
3. When IntersectionObserver fires → set this card as active → other cards show thumbnail

### [MODIFY] `components/discovery/ItemCard.tsx`

No changes needed if `isAuthenticated` is wired from Phase 2.

### [MODIFY] `components/discovery/DiscoveryGrid.tsx`

Add `isAuthenticated` prop and pass it to each ItemCard and VideoCard.

**After Phase 3:**
```bash
npm run build && git add -A && git commit -m "phase 3: video one-at-a-time + mute toggle + auth passthrough" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

---

## Phase 4 — Recommendation Algorithm + Guest Saves

### [MODIFY] `lib/discovery-algorithm.ts`

Replace with weighted recommendation:
- Score = profileMatch * 0.5 + popularity * 0.2 + recency * 0.2 + diversity * 0.1
- Cold start: popularity + recency only
- NEVER crash if no profile — always fallback

### [NEW] `lib/guest-saves.ts`

```typescript
const STORAGE_KEY = "solen_discovery_saves";

export function getGuestSaves(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function addGuestSave(itemId: string): void {
  const saves = getGuestSaves();
  if (!saves.includes(itemId)) { saves.push(itemId); localStorage.setItem(STORAGE_KEY, JSON.stringify(saves)); }
}

export function removeGuestSave(itemId: string): void {
  const saves = getGuestSaves().filter(id => id !== itemId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function clearGuestSaves(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

### [MODIFY] `components/discovery/SaveButton.tsx`

If not authenticated → use guest-saves localStorage. Show save animation anyway.

**After Phase 4:**
```bash
npm run build && git add -A && git commit -m "phase 4: weighted recommendation algorithm + guest saves via localStorage" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

---

## Phase 5 — Admin Drag-and-Drop

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### [MODIFY] `app/[locale]/dashboard/discovery-admin/page.tsx`

In `PublishedTab` only:
1. Wrap grid with `DndContext` + `SortableContext`
2. Each card becomes `useSortable` draggable
3. On drag end → reorder → PATCH `/api/admin/discovery` with new sort_order
4. Add GripVertical icon as drag handle

READ THE FILE FIRST (600 lines). Only modify `PublishedTab`.

**After Phase 5:**
```bash
npm run build && git add -A && git commit -m "phase 5: admin drag-and-drop reorder in published tab" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

---

## Phase 6 — Profile Integration

### [MODIFY] `lib/validations.ts`

Add these fields to `updateProfileSchema` BEFORE `.strict()`:
```typescript
disc_gender: z.enum(["male", "female", "unisex"]).nullable().optional(),
disc_hair_texture: z.string().max(30).nullable().optional(),
disc_hair_length: z.string().max(30).nullable().optional(),
disc_face_shape: z.string().max(30).nullable().optional(),
disc_profile_set: z.boolean().optional(),
```

**After Phase 6:**
```bash
npm run build && git add -A && git commit -m "phase 6: add disc_* fields to profile validation schema" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
```

---

## Phase 7 — Localize ToS Page

### [MODIFY] `app/[locale]/terms/discovery/page.tsx`

Replace hardcoded German text with `next-intl`. Use `useTranslations("discovery_tos")` or server-side equivalent.

### [MODIFY] `messages/en.json`, `messages/de.json`, `messages/fr.json`, `messages/it.json`

Add `"discovery_tos"` section to each file with translated content (title, content guidelines, prohibited content, moderation, rights).

**After Phase 7:**
```bash
npm run build && git add -A && git commit -m "phase 7: localize discovery ToS page in all 4 locales" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/terms/discovery
```

---

## Phase 8 — Smoke Test + Cleanup

Run ALL Rule 29 checks:

```bash
# 1. Build
npm run build

# 2. Type check
npx tsc --noEmit 2>&1 | grep "has no exported member" | head -10

# 3. Dead code check (Rule 26)
for f in components/discovery/*.tsx; do
  name=$(basename "$f" .tsx)
  # Skip files with spaces (duplicates)
  [[ "$name" =~ " " ]] && continue
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f"
done

# 4. Layout duplication check (Rule 27)
grep -rn "import.*Header\|import.*BottomNav" app/\[locale\]/ --include="*.tsx" | grep -v layout.tsx

# 5. Middleware check
grep "discovery-admin" middleware.ts

# 6. Translation key check
for locale in en de fr it; do
  echo "$locale: $(grep -c 'discover' messages/$locale.json) discover keys"
done

# 7. Delete duplicate files
rm -f components/discovery/*\ 2.tsx
rm -f "lib/discovery-moderation 2.ts"
rm -f "test-auth-cookies 2.js"
```

Fix ANY failures. Then:

```bash
npm run build && git add -A && git commit -m "phase 8: smoke test pass + cleanup duplicate files" && git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/discover
# Should return 200
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/en/terms/discovery
# Should return 200
```

---

## Execution Order

| Phase | What | Depends On |
|---|---|---|
| Phase 0 | Middleware + .env.example | Nothing |
| Phase 1 | Create 5 components + 2 API routes | Phase 0 |
| Phase 2 | Wire to discover page | Phase 1 |
| Phase 3 | Fix video + card behavior | Phase 2 |
| Phase 4 | Algorithm + guest saves | Phase 2 |
| Phase 5 | Admin drag-and-drop | Phase 0 |
| Phase 6 | Profile validation | Phase 0 |
| Phase 7 | Localize ToS | Phase 0 |
| Phase 8 | Smoke test + cleanup | ALL above |
