# Hair Discovery — Claude Code Roadmap v3 (Final)

> **Save to `_tasks/roadmap-hair-discovery.md` before executing.**
> Fully autonomous: build → verify → commit → push → check Vercel → next phase.

---

## Audit Fixes Applied (v3)

| # | Finding | Fix |
|---|---|---|
| 1 | Sparkles icon conflicts with Nails/Waxing | Use `Compass` instead |
| 2 | `validateQuery()` doesn't exist | Create it in `lib/validations.ts` |
| 3 | `FeatureKey` union missing `hair_discovery` | Extend union + insert DB row |
| 4 | BottomNav BEFORE/AFTER wrong line refs | Exact lines 63-83 from actual code |
| 5 | Profile page "doesn't exist" | Confirmed at `app/[locale]/profile/` |
| 6 | pnpm vs npm | All `pnpm`. Note to update CLAUDE.md §3.6 |
| 7 | Migration number | `067_hair_discovery.sql` |
| 8 | .gitignore missing `scripts/poc-results/` | Add entry |
| 9 | Dashboard sidebar vague | Exact `ADMIN_NAV` array position (line 34) |
| 10 | PostHog not server-side | Use `console.warn` + `audit.ts` logging |
| 11 | `toggle_hair_like` RPC stub | Full SQL in migration |
| 12 | No i18n translations | Translation keys per phase |
| 13 | Storage bucket lacks CORS/limits | Added to Manual Steps |
| 14 | Missing `hair_product_recommendations` table | Added join table |
| 15 | `collection_id` FK missing | Added FK constraint |
| 16-17 | RLS + index | ✅ Already fine |
| 18 | Zone tokens missing | Specify Zone 1 tokens for grid |
| 19 | SEO `generateMetadata` missing | Added per locale |
| 20 | RPC not in migration | Moved to Phase 1 SQL |
| 21 | Hardcoded CHF | Use `formatCurrency()` |
| 22 | Reuse automod.ts | No `automod.ts` exists — confirmed |
| 23 | `getSession()` enforcement | Note on all routes |
| 24 | `hair_interactions` admin SELECT | Added policy |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| 0 | 🟢 SAFE | Nothing | Script only, no prod changes |
| 1 | 🟢 SAFE | Nothing | New tables + helpers only |
| 2 | 🟡 MEDIUM | BottomNav, feature flags | Exact BEFORE/AFTER specified, test all tabs |
| 3 | 🟢 SAFE | Nothing | New page + components |
| 4 | 🟢 SAFE | Nothing | New API routes + components |
| 5 | 🟡 MEDIUM | Dashboard sidebar | Exact ADMIN_NAV position specified |
| 6 | 🟡 MEDIUM | Salon dashboard | Adding NAV item, test existing sidebar |
| 7 | 🟡 MEDIUM | Booking flow, profile | Modifying existing pages, read-first |
| 8 | 🟡 MEDIUM | CLAUDE.md | Append only |

---

## Phase 0 — PoC Script

#### [MODIFY] `.gitignore`
Add: `scripts/poc-results/`

#### [NEW] `scripts/hair-poc.ts`
- `pnpm add -D @fal-ai/client`
- Generate 5 hairstyles × 3 angles × 3 skin tones = 45 images
- Test 360° angle consistency
- Save to `scripts/poc-results/` (gitignored)
- Output `scripts/poc-results/cost-report.json`

```typescript
// ✅ DO
import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_KEY });

// ❌ DON'T
fal.config({ credentials: "fal_abc123..." }); // hardcoded key
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 0: fal.ai PoC script + gitignore"
# Do NOT push — local PoC only. User reviews scripts/poc-results/.
```

> ⚠️ **BE CAREFUL**:
> - `@fal-ai/client` must be devDependency: `pnpm add -D`
> - Never commit `FAL_KEY`
> - Verify `.gitignore` has `scripts/poc-results/` before committing

---

## Phase 1 — Database + Helpers

#### [NEW] `supabase/migrations/067_hair_discovery.sql`

Full migration with all tables, RLS policies, AND RPC functions:

```sql
-- === HAIRSTYLE CATALOG ===
CREATE TABLE hairstyles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_de TEXT, name_en TEXT, name_fr TEXT, name_it TEXT,
  description TEXT, description_de TEXT, description_en TEXT,
  gender TEXT CHECK (gender IN ('male','female','unisex')) DEFAULT 'unisex',
  tags TEXT[] DEFAULT '{}',
  texture TEXT CHECK (texture IN ('straight','wavy','curly','coily')),
  length_category TEXT CHECK (length_category IN ('short','medium','long')),
  vibe TEXT, occasion TEXT, maintenance TEXT,
  face_shapes TEXT[] DEFAULT '{}',
  prompt_template TEXT,
  salon_script TEXT, salon_script_de TEXT, cut_guide TEXT,
  cover_image_url TEXT,
  price_min INT, price_max INT,
  like_count INT DEFAULT 0, save_count INT DEFAULT 0, view_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === 360° ANGLE IMAGES ===
CREATE TABLE hair_angle_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hairstyle_id UUID REFERENCES hairstyles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  angle_degrees INT NOT NULL CHECK (angle_degrees >= 0 AND angle_degrees < 360),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hairstyle_id, angle_degrees)
);

-- === PRODUCT RECOMMENDATIONS (join table) ===
CREATE TABLE hair_product_recommendations (
  hairstyle_id UUID REFERENCES hairstyles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES hair_products(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (hairstyle_id, product_id)
);

-- === PRODUCTS ===
CREATE TABLE hair_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, category TEXT, description TEXT,
  application_guide TEXT, texture_match TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0
);

-- === SALON POSTS (instant publish) ===
CREATE TABLE hair_salon_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id),
  image_url TEXT NOT NULL, title TEXT, description TEXT,
  gender TEXT CHECK (gender IN ('male','female','unisex')) DEFAULT 'unisex',
  texture TEXT, length_category TEXT, tags TEXT[] DEFAULT '{}',
  service_id UUID REFERENCES services(id), price INT,
  like_count INT DEFAULT 0, save_count INT DEFAULT 0, view_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === USER POSTS (admin approval required) ===
CREATE TABLE hair_user_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, caption TEXT,
  hairstyle_id UUID REFERENCES hairstyles(id),
  salon_id UUID REFERENCES salons(id),
  gender TEXT CHECK (gender IN ('male','female','unisex')),
  texture TEXT, length_category TEXT,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  reject_reason TEXT,
  like_count INT DEFAULT 0, save_count INT DEFAULT 0, view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === LIKES (public) ===
CREATE TABLE hair_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('ai','salon','user')) NOT NULL,
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, content_type, content_id)
);

-- === SAVES (private) ===
CREATE TABLE hair_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('ai','salon','user')) NOT NULL,
  content_id UUID NOT NULL,
  collection_id UUID REFERENCES hair_collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- === COLLECTIONS ===
CREATE TABLE hair_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === COMMENTS ===
CREATE TABLE hair_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('ai','salon','user')) NOT NULL,
  content_id UUID NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  is_flagged BOOLEAN DEFAULT false, flag_reason TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === AI GENERATION CACHE ===
CREATE TABLE hair_generated (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  hairstyle_id UUID REFERENCES hairstyles(id),
  angle_degrees INT,
  fal_model TEXT, generation_ms INT, cost DECIMAL(6,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === INTERACTION SIGNALS ===
CREATE TABLE hair_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, content_id UUID NOT NULL,
  action TEXT CHECK (action IN ('view','tap','dwell','save','like','book')) NOT NULL,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === USER HAIR PROFILE (extends profiles) ===
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_texture TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hair_length TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_shape TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_hairstyle_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_hairstyle_updated_at TIMESTAMPTZ;

-- === RLS ===
ALTER TABLE hairstyles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_angle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_salon_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_interactions ENABLE ROW LEVEL SECURITY;

-- Public reads
CREATE POLICY "hairstyles_read" ON hairstyles FOR SELECT USING (is_active = true);
CREATE POLICY "angles_read" ON hair_angle_images FOR SELECT USING (true);
CREATE POLICY "product_recs_read" ON hair_product_recommendations FOR SELECT USING (true);
CREATE POLICY "products_read" ON hair_products FOR SELECT USING (true);
CREATE POLICY "salon_posts_read" ON hair_salon_posts FOR SELECT USING (is_active = true);
CREATE POLICY "user_posts_read" ON hair_user_posts FOR SELECT USING (status = 'approved');
CREATE POLICY "comments_read" ON hair_comments FOR SELECT USING (is_hidden = false);

-- User scoped
CREATE POLICY "likes_own" ON hair_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "saves_own" ON hair_saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "collections_own" ON hair_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "comments_insert" ON hair_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON hair_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "interactions_insert" ON hair_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "interactions_admin_read" ON hair_interactions FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "user_posts_own" ON hair_user_posts FOR ALL USING (auth.uid() = user_id);

-- Salon owner scoped
CREATE POLICY "salon_posts_owner" ON hair_salon_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM salons WHERE id = salon_id AND owner_id = auth.uid()));

-- Admin full access
CREATE POLICY "admin_hairstyles" ON hairstyles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_angles" ON hair_angle_images FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_salon_posts" ON hair_salon_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_user_posts" ON hair_user_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_comments" ON hair_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_products" ON hair_products FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- === RPC: Atomic like toggle ===
CREATE OR REPLACE FUNCTION toggle_hair_like(
  p_content_type TEXT, p_content_id UUID, p_user_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existed BOOLEAN;
  v_table TEXT;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM hair_likes
    WHERE user_id = p_user_id AND content_type = p_content_type AND content_id = p_content_id
  ) INTO v_existed;

  IF v_existed THEN
    DELETE FROM hair_likes
    WHERE user_id = p_user_id AND content_type = p_content_type AND content_id = p_content_id;
  ELSE
    INSERT INTO hair_likes (user_id, content_type, content_id)
    VALUES (p_user_id, p_content_type, p_content_id);
  END IF;

  -- Update count on the correct table
  IF p_content_type = 'ai' THEN v_table := 'hairstyles';
  ELSIF p_content_type = 'salon' THEN v_table := 'hair_salon_posts';
  ELSIF p_content_type = 'user' THEN v_table := 'hair_user_posts';
  END IF;

  EXECUTE format(
    'UPDATE %I SET like_count = (SELECT COUNT(*) FROM hair_likes WHERE content_type = $1 AND content_id = $2) WHERE id = $2',
    v_table
  ) USING p_content_type, p_content_id;

  RETURN NOT v_existed; -- true = liked, false = unliked
END;
$$;

-- === Feature flag row ===
INSERT INTO feature_flags (key, enabled, description)
VALUES ('hair_discovery', false, 'Hair Discovery feature')
ON CONFLICT (key) DO NOTHING;
```

> **Note**: Create `hair_products` table BEFORE `hair_product_recommendations` (references it).

#### [MODIFY] `lib/feature-flags.ts`
**BEFORE** (line 4):
```typescript
type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor";
```
**AFTER**:
```typescript
type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor" | "hair_discovery";
```

#### [NEW] `lib/validateQuery.ts`
```typescript
import { z, ZodSchema } from "zod";

export function validateQuery<T>(schema: ZodSchema<T>, params: URLSearchParams) {
  const raw: Record<string, string> = {};
  params.forEach((val, key) => { raw[key] = val; });
  const result = schema.safeParse(raw);
  if (!result.success) return { data: null, error: result.error };
  return { data: result.data, error: null };
}
```

#### [MODIFY] `lib/ratelimit.ts`
Add after line 64 (before `type RateLimitIdentifier`):
```typescript
export const hairGenerateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "rl:hair-generate",
});
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 1: hair discovery schema (067) + helpers + feature flag"
git push origin main
sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
```

> ⚠️ **BE CAREFUL**:
> - Migration MUST be `067_hair_discovery.sql` (after `066_feature_requests.sql`)
> - `hair_products` must be created BEFORE `hair_product_recommendations` (FK dependency)
> - `hair_collections` must be created BEFORE `hair_saves` (FK on `collection_id`)
> - `ALTER TABLE profiles` uses `IF NOT EXISTS` — idempotent
> - Do NOT modify existing columns on `profiles`, `salons`, `services`, `staff_members`
> - `FeatureKey` change: verify no other code pattern-matches on this union
> - All API routes in later phases MUST use `auth.getSession()` never `auth.getUser()` (CLAUDE.md Rule 25)

---

## Phase 2 — Discovery Grid + BottomNav

#### [NEW] `app/[locale]/discover/page.tsx`
Server component. SEO metadata with `generateMetadata()`:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "hair" });
  return {
    title: t("meta.title"), // "Hair Discovery | solen.ch"
    description: t("meta.description"),
    openGraph: { title: t("meta.title"), description: t("meta.description") },
  };
}
```

#### [NEW] `components/hair/DiscoveryGrid.tsx`
Masonry grid. CSS `columns`: 2 mobile, 3 tablet, 4 desktop. Uses **Zone 1** design tokens:
- Cards use `rounded-blob-d` resting, `rounded-blob-b` on hover
- Staggered fade-up (framer-motion, 60ms)
- `break-inside: avoid` on each card
- Three sections: "hair.sections.for_you" / "hair.sections.from_salons" / "hair.sections.community"

#### [NEW] `components/hair/HairCard.tsx`
- ✨ "Style Preview" on AI cards (NOT "AI GENERATED")
- 📸 Salon name on salon posts
- 👤 Username on user posts
- ♥ like count + 🔖 save
- Price range: uses `formatCurrency()` (never hardcode CHF)
- "Trending" / "Neu" badges
- Zone 1 tokens: `rounded-blob-d`, `bg-s-cream`, `shadow-card`

#### [NEW] `components/hair/GenderToggle.tsx`
**All | Women | Men | Unisex**

#### [NEW] `components/hair/FilterPills.tsx`
Length, Texture, Vibe, Occasion, Maintenance, Face Shape, Sort. AND logic.

#### [NEW] `components/hair/SearchBar.tsx`
Debounced 300ms.

#### [NEW] `app/api/hair/feed/route.ts`
GET: Paginated feed. All security layers:
```typescript
// ✅ DO — Full security for public GET
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("hair_discovery"); // 1
  if (disabled) return disabled;
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) }); // 2
  if (rateLimited) return rateLimited;
  const { data: params, error } = validateQuery(hairFeedSchema, req.nextUrl.searchParams); // 3
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  // 4. Query all 3 content types, apply filters...
}

// ❌ DON'T
export async function GET() {
  const { data } = await supabase.from("hairstyles").select("*"); // no security
  return NextResponse.json(data);
}
```

#### [MODIFY] `components/layout/BottomNav.tsx`

**BEFORE** (exact lines 6, 63-77):
```typescript
import { House, Search, Calendar, User, LayoutDashboard } from "lucide-react";
// ... (lines 7-62 unchanged)
  const tabs: ExpandableTabsItem[] = [
    { title: "Home", icon: House },
    { title: "Suche", icon: Search },
    { type: "separator" as const },
    { title: "Termine", icon: Calendar },
    { title: "Profil", icon: User },
  ];

  const routes: (string | null)[] = [
    `/${locale}`,
    `/${locale}/coiffeur`,
    null, // separator
    `/${locale}/termine`,
    profileRoute,
  ];
```

**AFTER**:
```typescript
import { House, Search, Compass, Calendar, User, LayoutDashboard } from "lucide-react";
// ... (lines 7-62 unchanged)
  const tabs: ExpandableTabsItem[] = [
    { title: "Home", icon: House },       // 0
    { title: "Suche", icon: Search },     // 1
    { title: "Discover", icon: Compass }, // 2 ← NEW (Compass, NOT Sparkles)
    { type: "separator" as const },       // 3
    { title: "Termine", icon: Calendar }, // 4
    { title: "Profil", icon: User },      // 5
  ];

  const routes: (string | null)[] = [
    `/${locale}`,            // 0
    `/${locale}/coiffeur`,   // 1
    `/${locale}/discover`,   // 2 ← NEW
    null,                    // 3: separator
    `/${locale}/termine`,    // 4
    profileRoute,            // 5
  ];
```

`handleTabChange` at line 85: `index === 1` Suche special-case **stays unchanged** (index still 1).
`isDashboardUser` block at line 80: `tabs.push(Dashboard)` still appends to end → index 6 → **no conflict**.

```typescript
// ✅ DO — Use Compass (distinct from Sparkles used for Nails/Waxing)
import { Compass } from "lucide-react";

// ❌ DON'T — Sparkles is already used for Nails category in HomePage, ServiceTile, Header
import { Sparkles } from "lucide-react";
```

#### [MODIFY] `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`
Add `hair` namespace:
```json
"hair": {
  "meta": { "title": "Hair Discovery | solen.ch", "description": "..." },
  "sections": { "for_you": "Für dich", "from_salons": "Von Salons", "community": "Community" },
  "filters": { "all": "Alle", "women": "Frauen", "men": "Männer", "unisex": "Unisex" },
  "search": { "placeholder": "Frisuren suchen..." },
  "badges": { "trending": "Trending", "new": "Neu", "style_preview": "Style Preview" },
  "actions": { "show_more": "Mehr anzeigen", "clear_all": "Alle löschen" }
}
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 2: discovery grid + filters + bottom nav (Compass icon)"
git push origin main
sleep 60
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/discover
# Test: ALL 6 bottom nav tabs (Home, Suche, Discover, Termine, Profil + Dashboard if admin)
```

> ⚠️ **BE CAREFUL**:
> - Icon: `Compass` NOT `Sparkles` — verify: `grep -r "Compass" node_modules/lucide-react/dist/`
> - `handleTabChange` index===1 Suche must NOT break
> - Dashboard tab `tabs.push()` at line 81 still appends to end → fine
> - Translations: all 4 locale files must have the `hair` namespace
> - Zone 1 tokens: use `rounded-blob-d` not `rounded-lg` for cards
> - Do NOT use `formatCurrency()` for CHF display if it doesn't exist yet — check first

---

## Phase 3 — Detail Page + 360° Scrubber

#### [NEW] `app/[locale]/discover/[type]/[id]/page.tsx`
`type` = `style` | `salon` | `community`. Server-side data fetch. `generateMetadata()` with og:image.

#### [NEW] `components/hair/DetailPage.tsx`
Full detail view. 360° scrubber for AI styles, static image for salon/user posts.

#### [NEW] `components/hair/AngleScrubber.tsx`
Touch-to-rotate 360° viewer:
- Fetches `hair_angle_images` sorted by `angle_degrees`
- Pointer events (touch + mouse) for drag rotation
- Dot indicators below
- Auto-rotate on mount (5s, stops on touch)
- Fallback: if ≤1 image, render static `<Image>` (no scrubber)
- Lazy load: only current + adjacent images loaded initially
- `aria-label="360° Ansicht, ziehen zum Drehen"` for accessibility
- Keyboard: Left/Right arrows cycle angles

```typescript
// ✅ DO — PointerEvent for cross-device support
onPointerDown, onPointerMove, onPointerUp

// ❌ DON'T — MouseEvent only (breaks mobile)
onMouseDown, onMouseMove, onMouseUp
```

#### [NEW] `components/hair/InfoTabs.tsx`
Tabs: `hair.tabs.products` | `hair.tabs.salon_script` | `hair.tabs.cut_guide` (translated)

#### [NEW] `components/hair/ProductPills.tsx`
Uses `hair_product_recommendations` join table.

#### [NEW] `components/hair/SalonScript.tsx`
Copy button + WhatsApp deep link: `https://wa.me/?text=${encodeURIComponent(script)}`

#### [NEW] `components/hair/CutGuide.tsx`
"Für Profis" warning badge.

#### [NEW] `components/hair/BookCTA.tsx`
Full-width coral button → `/coiffeur?style=[slug]`

#### [NEW] `components/hair/ShareButton.tsx`
WhatsApp, Copy Link, Download.

#### [MODIFY] `messages/{de,en,fr,it}.json`
Add: `hair.tabs.*`, `hair.detail.*`, `hair.cta.*` translation keys.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 3: detail page + 360° scrubber + info tabs + i18n"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - AngleScrubber: use `PointerEvent`, add keyboard Left/Right support
> - If `hair_angle_images` returns 0 rows, show `cover_image_url` as static fallback
> - Images: use `next/image` with `sizes` prop for responsive optimization
> - Comments: paginate (20 per page), NOT fetch all at once
> - WhatsApp: `https://wa.me/?text=` deep links — no API approval needed

---

## Phase 4 — Social Features

#### [NEW] `app/api/hair/like/route.ts`
POST: Calls `toggle_hair_like` RPC. All 6 security layers. Uses `getSession()`.

#### [NEW] `app/api/hair/save/route.ts`
POST: Toggle save. All 6 layers.

#### [NEW] `app/api/hair/comments/route.ts`
GET: Paginated (20/page), IP rate limited. POST: Auth + auto-moderation.

#### [NEW] `lib/hair-moderation.ts`
Block list (DE + EN + FR), max 500 chars, spam (same user, same text < 1 min), flags for admin.

```typescript
// ✅ DO — Moderate then insert
const mod = moderateComment(data.text);
if (mod.blocked) return NextResponse.json({ error: mod.reason }, { status: 400 });
await supabase.from("hair_comments").insert({ ...data, is_flagged: mod.flagged, flag_reason: mod.reason });

// ❌ DON'T — Raw insert
await supabase.from("hair_comments").insert({ text: body.text });
```

#### [NEW] `components/hair/LikeButton.tsx`
♥ + count. Coral fill. Scale animation. Optimistic UI.

#### [NEW] `components/hair/SaveButton.tsx`
🔖 private. Guest: `localStorage` key `hair_saves_guest` + login prompt with `?redirect=discover&save={id}`.

#### [NEW] `components/hair/CommentSection.tsx`
Paginated, newest first. Report button.

#### [MODIFY] `messages/{de,en,fr,it}.json`
Add: `hair.comments.*`, `hair.actions.like`, `hair.actions.save`, `hair.actions.report`

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 4: likes, saves, comments + auto-moderation + i18n"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Like toggle uses RPC (`toggle_hair_like`) — atomic, no read-then-write
> - Block list must include German profanity (Basel market)
> - Use existing `generalLimiter` — do NOT create new limiters for social actions
> - Guest save sync: after login redirect, read `localStorage`, POST each to `/api/hair/save`, clear

---

## Phase 5 — Admin Content Studio + fal.ai

#### [NEW] `lib/fal.ts`
Server-side fal.ai. Download → WebP (via Sharp or fal output format) → upload to Supabase Storage `hair-images` → return public URL.

#### [NEW] `lib/hair-budget.ts`
Redis monthly cap with TTL. At 80%: `console.warn("[hair-budget] 80% threshold reached")`. At 100%: block non-admin generation.

#### [NEW] `app/api/admin/hair/route.ts`
CRUD. Admin DB check (profiles.role). All 6 layers.

#### [NEW] `app/api/admin/hair/generate/route.ts`
POST: Generate single image. Admin only (DB check). Unlimited but tracks cost.

#### [NEW] `app/api/admin/hair/generate-360/route.ts`
POST: Generate 12 angles. Admin only. Returns progress.

#### [NEW] `app/api/admin/hair/moderation/route.ts`
GET: Pending user posts. PUT: Approve/reject with reason.

#### [NEW] `app/[locale]/dashboard/hair-admin/page.tsx`
Content Studio with Generate, Styles, and Moderation tabs. Spending: `formatCurrency(totalSpend)`.

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`
**BEFORE** (line 34):
```typescript
  { label: "Visual Editor",       href: "/dashboard/editor",             icon: Paintbrush },
] as const;
```
**AFTER** (add as second-to-last item before `as const`):
```typescript
  { label: "Visual Editor",       href: "/dashboard/editor",             icon: Paintbrush },
  { label: "Hair Admin",          href: "/dashboard/hair-admin",         icon: Scissors },
] as const;
```
Note: `Scissors` is already imported on line 10.

```typescript
// ✅ DO — Admin check from DB
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// ❌ DON'T — Trust client headers
if (req.headers.get("x-role") !== "admin") return;
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 5: admin content studio + fal.ai + 360° gen + moderation"
git push origin main
sleep 60
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/dashboard/hair-admin
```

> ⚠️ **BE CAREFUL**:
> - `FAL_KEY` must exist: `if (!process.env.FAL_KEY) throw new Error("FAL_KEY not set")`
> - Download from fal.ai → upload to Supabase Storage. NEVER return fal.ai CDN URLs
> - `Scissors` is already imported on line 10 of `DashboardLayout.tsx` — no new import needed
> - Admin spending: use `formatCurrency()` for display, store raw USD cost in Redis
> - Do NOT use `posthog-js` server-side (client-only) — use `console.warn` for budget alerts
> - Test existing dashboard sidebar still renders correctly after adding Hair Admin

---

## Phase 6 — Salon + User Posting

#### [NEW] `app/[locale]/dashboard/hair-posts/page.tsx`
Upload photo → gender required, rest optional → auto-describe → edit → instant publish.

#### [NEW] `app/api/hair/salon-post/route.ts`
POST: Auth + salon ownership check. Image upload to `hair-images`.

#### [NEW] `app/[locale]/discover/submit/page.tsx`
User upload + caption + optional links. Status = pending.

#### [NEW] `app/api/hair/user-post/route.ts`
POST: Auth. Rate limit: 3/day. Status defaults to `pending`.

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`
Add to NAV array (line 45, before Settings):
```typescript
  { label: "Hair Posts",    href: "/dashboard/hair-posts",   icon: Camera },
```
Add `Camera` to imports on line 9.

```typescript
// ✅ DO — Verify salon ownership
const { data: salon } = await supabase.from("salons")
  .select("id").eq("owner_id", user.id).eq("id", body.salonId).single();
if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// ❌ DON'T — Trust body
await supabase.from("hair_salon_posts").insert({ salon_id: body.salonId });
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 6: salon posting + user submissions"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - User posts: `status = 'pending'` ALWAYS — never auto-approve
> - Image upload: validate type (jpg/png/webp), max 5MB
> - `Camera` icon: verify exists in lucide-react
> - Adding to NAV: this shows for ALL dashboard users (salon_owner + admin)

---

## Phase 7 — Algorithm + Prices + Booking + Profile

#### [NEW] `lib/hair-algorithm.ts`
Scoring: profile match (50%) + popularity (20%) + collaborative (20%) + implicit (10%) + recency. Cold start → trending.

#### [MODIFY] `app/api/hair/feed/route.ts`
Use algorithm for authed users, trending for guests.

#### [NEW] `app/api/hair/interactions/route.ts`
POST: Log interaction. Fire-and-forget on client.

#### [NEW] `app/api/hair/salons-for-style/route.ts`
GET: Match hairstyle → salon services → prices.

#### [MODIFY] booking flow — accept optional `?hairstyleId=` + `?serviceId=`

#### [MODIFY] booking completion handler
After 24h (no dispute/no-show): `profiles.current_hairstyle_id = hairstyleId`

#### [MODIFY] `app/[locale]/profile/page.tsx`
Add "Current Look" section + "Hair Profile" preferences. Uses `useTranslations("hair")`.

#### [MODIFY] onboarding flow — optional hair preferences step (skippable)

```typescript
// ✅ DO — Fire-and-forget interaction tracking
fetch('/api/hair/interactions', { method: 'POST', body: JSON.stringify(data) });
// No await — don't block UI

// ❌ DON'T — Await interaction tracking
await fetch('/api/hair/interactions', ...); // UI freezes
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 7: algorithm + prices + booking bridge + hair profile"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `?hairstyleId=` must be optional — existing booking flow must work without it
> - Auto-profile update: only after 24h AND no dispute — check `bookings.status`
> - Profile page: READ existing code first, ADD sections — do NOT rebuild (Rule 8)
> - Onboarding hair step: SKIPPABLE
> - Algorithm cold start: no interactions → fallback to popular/trending

---

## Phase 8 — Documentation (R8)

#### [MODIFY] `CLAUDE.md`
Append to §3.5: "24. Hair Discovery: Pinterest-style grid with 360° scrubber, 3-tier content, recommendation algorithm, admin Content Studio with fal.ai"
Append to §6: all 13 new tables
Append to §11: `hairGenerateLimiter`
Update §3.6: `pnpm` commands (was `npm`)

#### [MODIFY] `UI_RULES.md`
Add: masonry grid spec, 360° scrubber, card tokens, Zone 1 patterns

#### [MODIFY] `.env.example`
Add: `FAL_KEY`, `FAL_MODEL`, `HAIR_MONTHLY_BUDGET_CAP`

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 8: CLAUDE.md + UI_RULES.md + .env.example docs"
git push origin main
```

> ⚠️ **BE CAREFUL**: APPEND only — never overwrite existing sections.

---

## R6: DEPENDENCY ORDER

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | fal.ai account | Nothing |
| Manual B | 🧑 | Supabase Storage bucket | Nothing |
| Manual C | 🧑 | Vercel env vars | A |
| Phase 0 | 🤖 | PoC script | A |
| Manual D | 🧑 | Review PoC | Phase 0 |
| Phase 1 | 🤖 | DB + helpers | B |
| Phase 2 | 🤖 | Grid + BottomNav | 1 |
| Phase 3 | 🤖 | Detail + 360° | 1 |
| Phase 4 | 🤖 | Social | 1 |
| Phase 5 | 🤖 | Admin studio | C + 1 |
| Phase 6 | 🤖 | Salon + user posting | 2 + 5 |
| Phase 7 | 🤖 | Algorithm + booking | 2 + 4 |
| Phase 8 | 🤖 | Documentation | All |
| Manual E | 🧑 | Seed content | Phase 5 |
