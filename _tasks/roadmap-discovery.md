# solen.ch Discovery Platform — Final Roadmap (Audit-Proof)

> **Fully autonomous Claude Code execution.**
> Build → `pnpm run build` → verify → commit → push → check Vercel → next phase.
> **User completes ALL manual steps BEFORE Claude Code starts Phase 0.**

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| Manual A-H | 🟢 SAFE | Nothing | External dashboards only |
| Phase 0 | 🟢 SAFE | Nothing | New tables, new type fields, new schemas |
| Phase 1 | 🟢 SAFE | Nothing | New lib files, new deps |
| Phase 2 | 🟡 MEDIUM | Dashboard sidebar | Modify `ADMIN_NAV` array literal (line 33, `as const`) — insert before `] as const;` |
| Phase 3 | 🟡 MEDIUM | BottomNav | Insert Discover at index 2, shift separator → 3, update all route indices |
| Phase 4 | 🟢 SAFE | Nothing | New API routes + components |
| Phase 5 | 🟢 SAFE | Nothing | New pages + components |
| Phase 6 | 🟡 MEDIUM | Salon dashboard | Modify `NAV` array literal (line 45, `as const`), add middleware path |
| Phase 7 | 🟡 MEDIUM | Booking flow, profile | Modifying existing pages — READ FIRST |
| Phase 8 | 🟢 SAFE | Nothing | New pages only |
| Phase 9 | 🟡 MEDIUM | CLAUDE.md, sitemap | APPEND only to CLAUDE.md. Fix LOCALES in sitemap. |

---

## Locked-In Decisions

| Decision | Value |
|---|---|
| Categories | Hair (beard = sub-filter), Nails, Makeup, Waxing |
| Theme | Light + dark mode, solen color palette |
| Grid | True masonry (JS column distribution, NOT CSS `column-count`), 2/3/4 cols |
| Loading | 20 items initial, infinite scroll |
| Videos | TikTok oEmbed iframe. One at a time. Hover/tap switches. Default muted 🔊 |
| Homepage | Curated mix, gender-aware (no beard if female), category pills |
| Image sources | Unsplash + Pexels + Pixabay + admin upload + salon posts + user posts |
| TikTok sources | Admin paste + salon paste + user paste URLs (oEmbed, free, no key) |
| AI Vision | Gemini 2.0 Flash — auto-categorize + descriptions in DE/EN/FR/IT |
| User posting | From Discover page (floating "+"), AI auto-fills, photos only, max 5MB |
| Auto-flagging | NOT flagged = instant publish. ONLY flagged → admin review |
| Legal | Full ToS page for UGC |
| Profile setup | At Discovery first visit if not at signup. GDPR: explain data purpose |
| Pricing | Range on card → Book Now → salon list → auto-select service |
| BottomNav icon | `Compass` (NOT `Sparkles` — used in 12+ files) |
| Package manager | `pnpm` (declared in `package.json`) |
| Auth | `getSession()` ONLY — never `getUser()` (CLAUDE.md Rule 25) |
| Gender types | `DiscoveryGender` = `male\|female\|unisex` (separate from existing `Gender` type) |

---

# PART 1: 🧑 MANUAL STEPS (Do These First)

### Step 1 — API Keys ✅ DONE
### Step 2 — Vercel Env Vars ✅ DONE

### Step 3 — Supabase Storage Bucket (Do This Now)

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) → select your solen project
2. In the left sidebar, click **Storage** (the bucket icon)
3. Click the green **"New bucket"** button (top right)
4. Bucket name: type `discovery-images`
5. Toggle **"Public bucket"** → **ON** (green)
6. Click **"Create bucket"**
7. Now click on the `discovery-images` bucket you just created
8. Click the **three dots ⋮** next to the bucket name → **"Edit bucket"**
9. Under **"Allowed MIME types"** → type these one by one (press Enter after each):
   - `image/jpeg`
   - `image/png`
   - `image/webp`
   - (This just means: only allow image files, no random stuff)
10. Under **"File size limit"** → set to `5` (this means 5MB max per file)
11. Click **"Save"**

**CORS (so the website can upload to the bucket):**
12. Still in Storage, click **"Policies"** in the left sidebar
13. On the `discovery-images` bucket, click **"New Policy"**
14. Select **"For full customization"**
15. Policy name: `discovery_public_read`
16. Allowed operation: **SELECT** only
17. Target roles: **anon, authenticated**
18. USING expression: `true`
19. Click **"Review"** → **"Save policy"**
20. Create another policy:
    - Policy name: `discovery_auth_upload`
    - Allowed operation: **INSERT**
    - Target roles: **authenticated**
    - WITH CHECK expression: `true`
    - Click **"Review"** → **"Save policy"**
21. Create one more:
    - Policy name: `discovery_admin_delete`
    - Allowed operation: **DELETE**
    - Target roles: **authenticated**
    - USING expression: `(EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))`
    - Click **"Review"** → **"Save policy"**

✅ Done — bucket is ready for Discovery images.

### Step 4 — Seed Content (Do This AFTER Claude Code Finishes Phase 2)

> Phase 2 creates the admin Discovery dashboard. Once it's deployed, come back here.

1. Go to `solen.ch/de/dashboard/discovery-admin`
2. You'll see 6 tabs at the top

**Tab 1: Stock Import — Fill up with free stock photos**
3. Click the **"Stock Import"** tab
4. In the search box, type a style (e.g. `curly hair women`)
5. Select category: **Hair**
6. Click **"Search"** — you'll see photos from Unsplash/Pexels/Pixabay
7. Click the checkboxes on photos you like
8. Click **"Import Selected"** → they go to the Staging tab
9. Repeat for other searches: `short hair men`, `nail art`, `makeup look`, `balayage`, `fade haircut`, `braids`, `coffin nails`, etc.
10. Do this for each category (Hair, Nails, Makeup, Waxing) — aim for ~20-50 per category

**Tab 2: TikTok Import — Add TikTok videos**
11. Click the **"TikTok Import"** tab
12. Go to TikTok, find hairstyle/nail/makeup videos you like
13. Copy the video URL (e.g. `https://www.tiktok.com/@username/video/1234567890`)
14. Paste one URL per line in the text box
15. Click **"Import"** → AI auto-categorizes each one → they go to Staging

**Tab 3: Manual Upload — Add your own photos**
16. Click **"Manual Upload"** tab
17. Drag and drop photos (or click to browse)
18. AI auto-fills the category, style name, description
19. Review and edit if needed → click **"Upload"**

**Tab 4: Staging — Review & Publish everything**
20. Click the **"Staging"** tab — you'll see all imported content
21. AI has auto-filled category, gender, texture, style name for each
22. Review each item — edit if the AI got something wrong
23. Select items → click **"Approve"** to publish them live
24. Or click **"Reject"** to remove bad ones

**Tab 5: Published — See what's live**
25. Click **"Published"** — see everything that's live on the Discover page
26. You can drag to reorder, edit details, or archive items

**After you've published ~50-100 items across categories, the Discover page is ready for users.**

### Step 5 — TikTok Login Kit (Optional — For v2 Features)

> This is for future features like "Continue with TikTok" login, creator badges, etc. It's **free** but TikTok takes 2-4 weeks to review. Start it now so it's ready when you need it.

1. Go to [developers.tiktok.com](https://developers.tiktok.com/)
2. Click **"Log in"** (top right) → log in with your TikTok account
3. If you don't have a TikTok account, create one first at [tiktok.com](https://www.tiktok.com/)
4. After logging in, click **"Manage apps"** in the top nav
5. Click **"Connect an app"**
6. Fill in the form:
   - App name: `solen-ch`
   - App icon: upload the solen logo
   - App description: `Beauty & wellness booking platform for Basel, Switzerland. Users discover hairstyles, nails, and makeup inspiration.`
   - Category: **Lifestyle**
   - Platform: **Web**
   - Website URL: `https://solen.ch`
7. Click **"Save"** → your app is created
8. In the app dashboard, click **"Add products"** on the left sidebar
9. Find **"Login Kit"** → click **"Add"**
10. Under Login Kit settings:
    - Redirect URI: `https://solen.ch/api/auth/tiktok/callback`
    - Redirect URI (dev): `http://localhost:3000/api/auth/tiktok/callback`
    - Terms of Service URL: `https://solen.ch/de/agb`
    - Privacy Policy URL: `https://solen.ch/de/datenschutz`
11. Scopes to request: check **user.info.basic** and **user.info.profile**
12. Click **"Save"** → then click **"Submit for review"**
13. TikTok will email you when it's approved (usually 2-4 weeks)
14. Once approved, copy **Client Key** and **Client Secret** from the app dashboard
15. Add to Vercel env vars:
    - `TIKTOK_CLIENT_KEY` = (your Client Key)
    - `TIKTOK_CLIENT_SECRET` = (your Client Secret)

> You don't need to wait for this — v1 works without it. This is just so it's ready for v2.

---

# PART 2: 🤖 CLAUDE CODE PHASES (Autonomous Execution)

> Execute in order: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9**
> Phase 4 and 5 were reordered from original (social before detail page).

---

## Phase 0 — Database + TypeScript Foundation

### [NEW] `supabase/migrations/067_discovery.sql`

```sql
-- ============================================================
-- DISCOVERY PLATFORM — 067
-- Categories: hair, beard, nails, makeup, waxing
-- ============================================================

-- === CONTENT CATALOG ===
CREATE TABLE discovery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('hair','beard','nails','makeup','waxing')),
  content_type TEXT NOT NULL CHECK (content_type IN ('curated','tiktok','salon','user')),
  name TEXT,
  name_de TEXT, name_en TEXT, name_fr TEXT, name_it TEXT,
  description TEXT, description_de TEXT, description_en TEXT, description_fr TEXT, description_it TEXT,
  image_url TEXT,
  tiktok_url TEXT,
  tiktok_embed_html TEXT,
  tiktok_thumbnail_url TEXT,
  media_type TEXT CHECK (media_type IN ('photo','tiktok')) DEFAULT 'photo',
  source TEXT CHECK (source IN ('unsplash','pexels','pixabay','admin','salon','user','tiktok')),
  source_id TEXT, source_url TEXT, author_name TEXT, author_url TEXT,
  alt_text TEXT,
  gender TEXT CHECK (gender IN ('male','female','unisex')) DEFAULT 'unisex',
  texture TEXT CHECK (texture IN ('straight','wavy','curly','coily','protective','bald')),
  length_category TEXT CHECK (length_category IN ('short','medium','long')),
  style_name TEXT,
  nail_shape TEXT CHECK (nail_shape IN ('square','round','almond','coffin','stiletto')),
  nail_style TEXT, makeup_style TEXT, skin_tone TEXT, wax_area TEXT,
  tags TEXT[] DEFAULT '{}', vibe TEXT, occasion TEXT, maintenance TEXT,
  face_shapes TEXT[] DEFAULT '{}',
  salon_script TEXT, salon_script_de TEXT, salon_script_fr TEXT, salon_script_it TEXT,
  cut_guide TEXT,
  price_min INT, price_max INT,
  like_count INT DEFAULT 0, save_count INT DEFAULT 0, view_count INT DEFAULT 0,
  status TEXT CHECK (status IN ('staging','published','flagged','archived')) DEFAULT 'staging',
  flag_reason TEXT, is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_salon_id UUID REFERENCES salons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

-- === STAGING QUEUE ===
CREATE TABLE discovery_staging (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT CHECK (category IN ('hair','beard','nails','makeup','waxing')),
  image_url TEXT,  -- nullable for TikTok items
  thumbnail_url TEXT,
  tiktok_url TEXT, tiktok_embed_html TEXT,
  media_type TEXT CHECK (media_type IN ('photo','tiktok')) DEFAULT 'photo',
  source TEXT CHECK (source IN ('unsplash','pexels','pixabay','tiktok')) NOT NULL,
  source_id TEXT NOT NULL, source_url TEXT, author_name TEXT, author_url TEXT,
  alt_text TEXT,
  auto_gender TEXT, auto_texture TEXT, auto_style TEXT, auto_category TEXT,
  auto_tags TEXT[] DEFAULT '{}', api_tags TEXT[] DEFAULT '{}', ai_description TEXT,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id), rejected_reason TEXT,
  batch_id UUID, created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

-- === FEATURED BOARDS ===
CREATE TABLE discovery_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, name_de TEXT, name_en TEXT, name_fr TEXT, name_it TEXT,
  slug TEXT UNIQUE NOT NULL, description TEXT,
  category TEXT, texture TEXT, style_name TEXT, gender TEXT,
  cover_images TEXT[] DEFAULT '{}',
  pin_count INT DEFAULT 0, is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discovery_board_pins (
  board_id UUID REFERENCES discovery_boards(id) ON DELETE CASCADE,
  item_id UUID REFERENCES discovery_items(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0, PRIMARY KEY (board_id, item_id)
);

-- === PRODUCTS (before recommendations for FK) ===
CREATE TABLE discovery_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, category TEXT, description TEXT,
  application_guide TEXT, texture_match TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true, sort_order INT DEFAULT 0
);

CREATE TABLE discovery_product_recommendations (
  item_id UUID REFERENCES discovery_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES discovery_products(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0, PRIMARY KEY (item_id, product_id)
);

-- === COLLECTIONS (before saves for FK) ===
CREATE TABLE discovery_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, created_at TIMESTAMPTZ DEFAULT now()
);

-- === LIKES ===
CREATE TABLE discovery_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES discovery_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (user_id, item_id)
);

-- === SAVES ===
CREATE TABLE discovery_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES discovery_items(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES discovery_collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, item_id)
);

-- === COMMENTS ===
CREATE TABLE discovery_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES discovery_items(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  is_flagged BOOLEAN DEFAULT false, flag_reason TEXT,
  is_hidden BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);

-- === INTERACTIONS ===
CREATE TABLE discovery_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES discovery_items(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('view','tap','dwell','save','like','book')) NOT NULL,
  duration_ms INT, created_at TIMESTAMPTZ DEFAULT now()
);

-- === PROFILE COLUMNS ===
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_hair_texture TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_hair_length TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_face_shape TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_nail_shape TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_skin_tone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disc_profile_set BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_style_id UUID REFERENCES discovery_items(id) ON DELETE SET NULL;

-- === RLS ===
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

-- Public reads
CREATE POLICY "items_read" ON discovery_items FOR SELECT USING (status = 'published' AND is_active = true);
CREATE POLICY "boards_read" ON discovery_boards FOR SELECT USING (is_active = true);
CREATE POLICY "board_pins_read" ON discovery_board_pins FOR SELECT USING (true);
CREATE POLICY "products_read" ON discovery_products FOR SELECT USING (true);
CREATE POLICY "product_recs_read" ON discovery_product_recommendations FOR SELECT USING (true);
CREATE POLICY "comments_read" ON discovery_comments FOR SELECT USING (is_hidden = false);

-- User scoped (per-operation — NOT FOR ALL)
CREATE POLICY "likes_own" ON discovery_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "saves_own" ON discovery_saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "collections_own" ON discovery_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "comments_insert" ON discovery_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON discovery_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "interactions_insert" ON discovery_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Salon/user content: split per-operation (NOT FOR ALL)
CREATE POLICY "items_insert_own" ON discovery_items FOR INSERT
  WITH CHECK (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()));
CREATE POLICY "items_update_own" ON discovery_items FOR UPDATE
  USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()))
  WITH CHECK (status IN ('staging', 'flagged', 'archived'));
CREATE POLICY "items_delete_own" ON discovery_items FOR DELETE
  USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()));

-- Admin (per-operation)
CREATE POLICY "admin_items_select" ON discovery_items FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_items_insert" ON discovery_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_items_update" ON discovery_items FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_items_delete" ON discovery_items FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_staging_all" ON discovery_staging FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_boards_all" ON discovery_boards FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_comments_all" ON discovery_comments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_products_all" ON discovery_products FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RPC: Atomic like toggle (with auth check)
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

-- RPC: Atomic save toggle (with auth check)
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

CREATE TRIGGER trg_discovery_items_updated BEFORE UPDATE ON discovery_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: auto-increment view_count from interactions
CREATE OR REPLACE FUNCTION increment_view_count() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'view' THEN
    UPDATE discovery_items SET view_count = view_count + 1 WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_view_count AFTER INSERT ON discovery_interactions
  FOR EACH ROW EXECUTE FUNCTION increment_view_count();

-- Full-text search index
CREATE INDEX idx_discovery_fts ON discovery_items
  USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(author_name, '') || ' ' || coalesce(style_name, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(tags, ' ')));

-- Feature flag
INSERT INTO feature_flags (key, enabled, description)
VALUES ('discovery', false, 'Discovery platform') ON CONFLICT (key) DO NOTHING;
```

### [MODIFY] `lib/feature-flags.ts` (line 4)
```typescript
// BEFORE:
type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor";

// AFTER:
type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode" | "visual_editor" | "discovery";
```

### [MODIFY] `lib/types.ts`

Add to `Profile` interface (after line 66 `updated_at`):
```typescript
  disc_gender: string | null;
  disc_hair_texture: string | null;
  disc_hair_length: string | null;
  disc_face_shape: string | null;
  disc_nail_shape: string | null;
  disc_skin_tone: string | null;
  disc_profile_set: boolean;
  current_style_id: string | null;
```

Add at end of file — all Discovery types:
```typescript
export type DiscoveryCategory = "hair" | "beard" | "nails" | "makeup" | "waxing";
export type DiscoveryContentType = "curated" | "tiktok" | "salon" | "user";
export type DiscoveryMediaType = "photo" | "tiktok";
export type DiscoveryStatus = "staging" | "published" | "flagged" | "archived";
export type DiscoverySource = "unsplash" | "pexels" | "pixabay" | "admin" | "salon" | "user" | "tiktok";
export type DiscoveryTexture = "straight" | "wavy" | "curly" | "coily" | "protective" | "bald";
export type DiscoveryGender = "male" | "female" | "unisex";

export interface DiscoveryItem { /* all fields matching DB schema */ }
export interface DiscoveryBoard { id: string; name: string; slug: string; /* ... */ }
export interface DiscoveryStagingItem { /* ... */ }
export interface DiscoveryComment { /* ... */ }
export interface DiscoveryCollection { /* ... */ }
export interface DiscoveryFeedResponse { items: DiscoveryItem[]; total: number; page: number; limit: number; has_more: boolean; }
export interface DiscoveryFilters { category?: DiscoveryCategory; gender?: DiscoveryGender; texture?: DiscoveryTexture; style?: string; search?: string; creator?: string; }
export interface AIVisionResult { category: DiscoveryCategory; gender: DiscoveryGender; texture: DiscoveryTexture | null; style_name: string | null; tags: string[]; description_de: string; description_en: string; description_fr: string; description_it: string; salon_script_de: string | null; cut_guide: string | null; }
```

### [MODIFY] `lib/validations.ts`

**Line 47** — add fr/it to locale enum:
```typescript
// BEFORE: locale: z.enum(["de", "en"]).optional(),
// AFTER:
locale: z.enum(["de", "en", "fr", "it"]).optional(),
```

**Line 52** — add `disc_*` fields BEFORE `.strict()`:
```typescript
  disc_gender: z.string().max(20).optional().nullable(),
  disc_hair_texture: z.string().max(30).optional().nullable(),
  disc_hair_length: z.string().max(20).optional().nullable(),
  disc_face_shape: z.string().max(30).optional().nullable(),
  disc_nail_shape: z.string().max(30).optional().nullable(),
  disc_skin_tone: z.string().max(30).optional().nullable(),
  disc_profile_set: z.boolean().optional(),
}).strict();
```

**Add at end of file** — all Discovery Zod schemas:
```typescript
// ─── Discovery ───
export const discoveryFeedSchema = z.object({
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
  gender: z.enum(["male", "female", "unisex"]).optional(),
  texture: z.enum(["straight", "wavy", "curly", "coily", "protective", "bald"]).optional(),
  style: z.string().max(50).optional(),
  search: z.string().max(100).optional(),
  creator: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const discoveryPostSchema = z.object({
  tiktok_url: z.string().url().optional(),
  category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional(),
  gender: z.enum(["male", "female", "unisex"]).optional(),
  texture: z.string().max(30).optional().nullable(),
  style_name: z.string().max(100).optional().nullable(),
  name: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  terms_accepted: z.boolean().refine(v => v === true, { message: "Terms must be accepted" }),
});

export const discoveryCommentSchema = z.object({ item_id: z.string().uuid(), text: z.string().min(1).max(500) });
export const discoveryLikeSchema = z.object({ item_id: z.string().uuid() });
export const discoverySaveSchema = z.object({ item_id: z.string().uuid(), collection_id: z.string().uuid().optional() });
export const discoverySearchStockSchema = z.object({ query: z.string().min(1).max(100), category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]), source: z.enum(["unsplash", "pexels", "pixabay", "all"]).default("all"), page: z.coerce.number().int().positive().default(1) });
export const discoveryStagingSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50), action: z.enum(["approve", "reject"]), reject_reason: z.string().max(500).optional() });
export const discoveryTikTokImportSchema = z.object({ urls: z.array(z.string().url()).min(1).max(20), category: z.enum(["hair", "beard", "nails", "makeup", "waxing"]).optional() });

export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams) {
  return validateBody(schema, Object.fromEntries(params.entries()));
}
```

### [MODIFY] `lib/ratelimit.ts` (after line 64)
```typescript
export const discoveryFeedLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), analytics: true, prefix: "rl:disc:feed" });
export const discoveryPostLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 d"), analytics: true, prefix: "rl:disc:post" });
export const discoveryCommentLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true, prefix: "rl:disc:comment" });
export const discoveryLikeLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), analytics: true, prefix: "rl:disc:like" });
export const discoveryAdminLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true, prefix: "rl:disc:admin" });
```

### [MODIFY] `lib/audit.ts` (line 5)
Add to `AuditAction` union:
```typescript
  | "discovery.publish" | "discovery.archive" | "discovery.reject"
  | "discovery.import" | "discovery.moderate" | "discovery.flag_remove";
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 0: discovery schema (067) + types + schemas + limiters"
git push origin main
# Verify Vercel deployment
```

> ⚠️ **BE CAREFUL**:
> - Migration `067` AFTER `066_feature_requests.sql` — run `ls supabase/migrations/067*` to verify no collision
> - `discovery_collections` BEFORE `discovery_saves` (FK dependency)
> - `discovery_products` BEFORE `discovery_product_recommendations` (FK dependency)
> - RLS: split `FOR ALL` into per-operation for owner content — prevents status bypass
> - Both RPCs have `auth.uid()` check to prevent impersonation
> - `image_url` in staging is NULLABLE (TikTok items have no image)
> - Keep existing `Gender` type unchanged — use `DiscoveryGender` for discovery columns

---

## Phase 1 — API Libraries

### [NEW] `lib/stock-photos.ts`
Unified Unsplash + Pexels + Pixabay client. `searchStockPhotos(query, category, source, page)` → merged + deduped results. Portrait orientation filter. Returns `{ id, url, thumbnail, author, source, tags, alt_text }`.

```typescript
// ✅ DO — Return alt_text from API response for WCAG
return { alt_text: unsplashPhoto.alt_description ?? unsplashPhoto.description ?? "" };

// ❌ DON'T — Ignore alt text
return { alt_text: "" };  // inaccessible
```

### [NEW] `lib/tiktok-embed.ts`
```typescript
// ✅ DO — Server-side only (CORS blocks browser calls)
export async function fetchTikTokEmbed(url: string) {
  const res = await fetchWithRetry(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  return res.json(); // { html, thumbnail_url, author_name, title }
}

// Retry with backoff for rate limits (~100 req/min undocumented)
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url);
    if (res.status === 429) { await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000)); continue; }
    return res;
  }
  throw new Error("TikTok oEmbed rate limited");
}

// ❌ DON'T — Call from browser (CORS blocked)
// ❌ DON'T — Scrape TikTok pages
```

### [NEW] `lib/ai-vision.ts`
Gemini 2.0 Flash. `analyzeDiscoveryImage(imageUrl)` → `AIVisionResult`. Cache results. Fallback: if Gemini fails, return `null` (keep in staging with `auto_category = null`, show "AI unavailable" in admin UI).

```typescript
// ✅ DO — Cache results, fail gracefully
try {
  const result = await model.generateContent([...]);
  return JSON.parse(result.response.text()) as AIVisionResult;
} catch (err) {
  console.error("[ai-vision] Gemini failed:", err);
  return null;  // admin categorizes manually
}

// ❌ DON'T — Skip error handling (crashes bulk import)
```

### [NEW] `lib/content-flags.ts`
Auto-flag: image < 200px, blocked words (DE+EN+FR), missing gender, rate > 3/day. NOT flagged = `status: 'published'`. Flagged = `status: 'flagged'`.

**Install dependencies:**
```bash
pnpm add sharp @google/generative-ai
```

### [MODIFY] `next.config.mjs`
```javascript
// BEFORE:
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }] },
};

// AFTER:
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "pixabay.com" },
      { protocol: "https", hostname: "p16-sign-sg.tiktokcdn.com" },
    ],
  },
};
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 1: stock photos + tiktok embed + gemini vision + content flags"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `GEMINI_API_KEY` = server-only env var. Never expose.
> - `sharp` has native binaries → `serverExternalPackages` in next.config prevents bundling issues
> - TikTok oEmbed: free, no key, but undocumented ~100 req/min limit → retry with backoff
> - All oEmbed calls MUST go through server API routes (CORS)
> - AI Vision: cache results → don't re-analyze same image
> - Batch TikTok imports: max 10 concurrent, 500ms delay between

---

## Phase 2 — Admin Content Studio

### [NEW] API routes (all under `app/api/admin/discovery/`):
- `search-stock/route.ts` — POST: Search 3 APIs. Uses `discoverySearchStockSchema`. 6 security layers. `logAuditEvent("discovery.import")`.
- `bulk-import/route.ts` — POST: Auto-import ~100 per category → staging.
- `import-tiktok/route.ts` — POST: Paste URLs. Uses `discoveryTikTokImportSchema`. oEmbed → AI → staging. Branch by `media_type`: photo → WebP → Storage, tiktok → copy metadata.
- `staging/route.ts` — GET: List pending. PUT: Approve/reject. Uses `discoveryStagingSchema`. **CRITICAL**: Branch approval by `media_type`:
  ```typescript
  // ✅ DO — Branch by media_type on approval
  if (item.media_type === 'photo') {
    const buffer = await fetch(item.image_url).then(r => r.arrayBuffer());
    const webp = await sharp(Buffer.from(buffer)).webp({ quality: 85 }).toBuffer();
    await supabase.storage.from("discovery-images").upload(`curated/${id}.webp`, webp);
  } else if (item.media_type === 'tiktok') {
    // Copy tiktok_url + tiktok_embed_html + tiktok_thumbnail_url — NO image download
  }
  // ❌ DON'T — Try to WebP-convert a TikTok (no image to download)
  ```
- `upload/route.ts` — POST: Admin manual upload → WebP → Storage.
- `analyze/route.ts` — POST: Run Gemini Vision on staging item.
- `route.ts` — CRUD published items.
- `moderation/route.ts` — GET: Flagged only. PUT: Approve/reject. `logAuditEvent("discovery.moderate")`.

### [NEW] `app/[locale]/dashboard/discovery-admin/page.tsx`
6-tab Content Studio:

| Tab | What |
|---|---|
| 1 Stock Import | Search APIs by category. Bulk select. "🚀 Auto-Import" button |
| 2 TikTok Import | Paste URLs (batch, one per line). Preview embeds. AI auto-categorize |
| 3 Manual Upload | Drag-and-drop. Category selector. AI auto-fills |
| 4 Staging | Review pending. Filter by category/source. Approve/reject/edit. Bulk actions |
| 5 Published | Live grid. Edit, archive, reorder (drag via `@dnd-kit/core`). Stats |
| 6 Flagged | Auto-flagged posts. Approve or remove |

### [NEW] `components/discovery/AIProcessingIndicator.tsx`
Pulsing animation: "Analyzing your image..."

### [NEW] `components/discovery/ImportProgressBar.tsx`
"Importing 42/100 images..."

### [MODIFY] `components/dashboard/DashboardLayout.tsx` (line 33)
Insert in ADMIN_NAV array literal BEFORE `] as const;`:
```typescript
// BEFORE (lines 9-14, add Compass import):
import { ..., Compass } from "lucide-react";

// BEFORE (line 33):
  { label: "Visual Editor",       href: "/dashboard/editor",             icon: Paintbrush },
] as const;

// AFTER (line 33-34):
  { label: "Visual Editor",       href: "/dashboard/editor",             icon: Paintbrush },
  { label: "Discovery",           href: "/dashboard/discovery-admin",    icon: Compass },
] as const;
```

### [MODIFY] `middleware.ts` (line 163)
```typescript
// BEFORE:
  "/editor",
];

// AFTER:
  "/editor",
  "/discovery-admin",
];
```

**Install drag library:**
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 2: admin content studio (6 tabs + TikTok + AI)"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `ADMIN_NAV` is `as const` — modify ARRAY LITERAL, do NOT `.push()`
> - Middleware: add `/discovery-admin` to `adminOnlyPaths` — SECURITY (salon_owner must NOT access)
> - Stock photos: download → `sharp` → WebP → Supabase Storage. NEVER hotlink.
> - TikTok: cache `tiktok_embed_html` in DB — don't re-fetch oEmbed per page load
> - Admin check: `profiles.role === 'admin'` from DB (CLAUDE.md Rule S6)
> - All admin routes: call `logAuditEvent()` on mutations

---

## Phase 3 — Discovery Grid + Filters + BottomNav

### [NEW] `app/[locale]/discover/page.tsx`
Server component. `generateMetadata()`. If `disc_profile_set = false` → show ProfileSetupModal.

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "discovery" });
  return {
    title: t("meta.title"),  // "Discover Styles | solen.ch"
    description: t("meta.description"),
    openGraph: { title: t("meta.title"), description: t("meta.description"), images: [{ url: "/og/discovery.jpg", width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image" },
  };
}
```

### [NEW] `app/api/discovery/feed/route.ts`
GET: Paginated feed. 6 security layers (feature flag, optional auth, IP rate limit for guests, Zod `discoveryFeedSchema`, RLS, pagination cap). Gender-aware: female → suppress beard.

```typescript
// ✅ DO — Full security on public GET
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;
  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;
  const { data: filters, error } = validateQuery(discoveryFeedSchema, req.nextUrl.searchParams);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  // ... query with filters
}

// ❌ DON'T — No rate limit on public GET
```

### [NEW] `components/discovery/` — Grid components:

| Component | What | Dark mode |
|---|---|---|
| `DiscoveryGrid.tsx` | JS column distribution masonry (NOT CSS `column-count`). Zone 1 tokens. Staggered fade-up. | `dark:bg-s-dm-bg` |
| `VideoCard.tsx` | TikTok embed. IntersectionObserver → autoplay ONE muted. Hover/tap switch. 🔊 toggle. Cleanup on unmount. | `dark:bg-s-dm-surface` |
| `ItemCard.tsx` | Photo card. Price range `formatCurrency()`. Source badge. `rounded-card`. | `dark:bg-s-dm-surface dark:border-white/5` |
| `CategoryPills.tsx` | `All · Hair · Nails · Makeup · Waxing`. Pre-loaded, instant client-side filter. | `dark:bg-white/10` active: `bg-s-coral text-white` |
| `PatternSelector.tsx` | Hair only: Protective/Coily/Curly/Wavy/Straight/Bald + beard subs. Auto from profile. | — |
| `StyleNamePills.tsx` | Auto-generated from distinct `style_name` per category. Scrollable. | — |
| `FeaturedBoards.tsx` | Collage thumbnail, name, pin count. | — |
| `GenderToggle.tsx` | All / Women / Men / Unisex | — |
| `SearchBar.tsx` | Debounced 300ms. Creator name search. | `dark:bg-s-dm-surface` |
| `ProfileSetupModal.tsx` | First visit: gender, hair texture, length, face shape, nail shape. GDPR text in 4 locales. Optional/skippable. Sets `disc_profile_set = true`. | — |
| `DiscoveryGridSkeleton.tsx` | 8 shimmer cards in masonry. `<Skeleton variant="card" />`. | — |
| `DiscoveryEmptyState.tsx` | "No styles match. Try adjusting filters." Uses `<EmptyState />`. | — |
| `DiscoveryErrorState.tsx` | "Something went wrong." + retry button. | — |
| `FilterDrawer.tsx` | Mobile: full filter panel (pills alone don't fit small screens). | — |

```typescript
// ✅ DO — JS column distribution for correct reading order
function distributeItems(items, colCount) {
  const columns = Array.from({ length: colCount }, () => []);
  const heights = new Array(colCount).fill(0);
  items.forEach(item => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(item);
    heights[shortest] += item.aspectRatio > 1 ? 200 : 300;
  });
  return columns;
}

// ❌ DON'T — CSS column-count (fills top→bottom, wrong order)
```

```typescript
// ✅ DO — IntersectionObserver with cleanup
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) playVideo();
    else pauseVideo();
  }, { threshold: 0.6 });
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();  // CLEANUP
}, []);

// ❌ DON'T — No cleanup (memory leak)
// ❌ DON'T — Autoplay all videos at once
```

### [MODIFY] `components/layout/BottomNav.tsx`
```typescript
// BEFORE (line 6):
import { House, Search, Calendar, User, LayoutDashboard } from "lucide-react";
// AFTER:
import { House, Search, Compass, Calendar, User, LayoutDashboard } from "lucide-react";

// BEFORE (lines 63-77):
  const tabs: ExpandableTabsItem[] = [
    { title: "Home", icon: House },        // 0
    { title: "Suche", icon: Search },       // 1
    { type: "separator" as const },         // 2
    { title: "Termine", icon: Calendar },   // 3
    { title: "Profil", icon: User },        // 4
  ];
  const routes: (string | null)[] = [
    `/${locale}`,
    `/${locale}/coiffeur`,
    null,
    `/${locale}/termine`,
    profileRoute,
  ];

// AFTER:
  const tabs: ExpandableTabsItem[] = [
    { title: "Home", icon: House },        // 0
    { title: "Suche", icon: Search },       // 1
    { title: "Discover", icon: Compass },   // 2  ← NEW
    { type: "separator" as const },         // 3  ← shifted
    { title: "Termine", icon: Calendar },   // 4  ← shifted
    { title: "Profil", icon: User },        // 5  ← shifted
  ];
  const routes: (string | null)[] = [
    `/${locale}`,
    `/${locale}/coiffeur`,
    `/${locale}/discover`,    // ← NEW
    null,                      // ← separator shifted
    `/${locale}/termine`,      // ← shifted
    profileRoute,              // ← shifted
  ];
```
Note: `handleTabChange` line 89 `if (index === 1)` stays unchanged — Search is still index 1.

### [MODIFY] `messages/{de,en,fr,it}.json`
Add `discovery` namespace (~150 keys per locale): categories, filters, actions, admin, posting, detail, gdpr, errors, empty, profile, moderation.

### Light + dark mode for ALL Discovery components
Every component uses token pairs: `bg-white dark:bg-s-dm-surface`, `text-s-ink dark:text-s-dm-text`, `border-s-ink/5 dark:border-white/5`, pills active `bg-s-coral text-white`.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 3: discovery grid + filters + TikTok autoplay + dark mode"
git push origin main
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/discover
```

> ⚠️ **BE CAREFUL**:
> - `Compass` NOT `Sparkles` (used in 12+ files for nails/waxing)
> - BottomNav: Discover at index 2, separator → 3. `handleTabChange` index 1 check UNCHANGED.
> - IntersectionObserver: cleanup in useEffect return. ONE video at a time.
> - Pre-load all category data client-side for instant pill switching
> - ProfileSetupModal: clearly explain WHY data is collected (GDPR)
> - Dark mode: test ALL components in both modes. Run Rule 21 validation.
> - `<EmptyState>` and `<Skeleton variant="card" />` per CLAUDE.md

---

## Phase 4 — Social Features

> **REORDERED: Social before Detail Page** — LikeButton/SaveButton needed in Phase 5's DetailPage.

### [NEW] `app/api/discovery/like/route.ts`
Uses `toggle_discovery_like` RPC. Auth required. `discoveryLikeLimiter`. `discoveryLikeSchema`.

### [NEW] `app/api/discovery/save/route.ts`
Uses `toggle_discovery_save` RPC. Auth required.

### [NEW] `app/api/discovery/save/sync/route.ts`
POST: Auth required. Bulk sync guest localStorage saves → DB. Deduplicate.

### [NEW] `app/api/discovery/comments/route.ts`
GET: Paginated (20/page). POST: Auth required. `discoveryCommentSchema`. `discoveryCommentLimiter`.

### [NEW] `lib/discovery-moderation.ts`
Block list (DE + EN + FR). Max 500 chars. Spam detection. Flags for admin.

### [NEW] Components:
- `LikeButton.tsx` — ♥ + count. `text-s-coral` fill. Optimistic UI. Scale animation.
- `SaveButton.tsx` — 🔖 Private. Guest: `localStorage` key `disc_saves_guest`. Login prompt. After login: call `/api/discovery/save/sync`.
- `CommentSection.tsx` — Paginated, newest first. Report button.
- `ReportButton.tsx` — Report content/comment mechanism.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 4: likes, saves (with guest sync), comments + moderation"
git push origin main
```

> ⚠️ **BE CAREFUL**: Atomic likes/saves via RPC. German profanity in block list. Guest save sync on login callback. Both RPCs have `auth.uid()` check.

---

## Phase 5 — Detail Page + AI Descriptions

### [NEW] `app/[locale]/discover/[id]/page.tsx`
Server fetch. `generateMetadata()` with `og:image` = `image_url` or `tiktok_thumbnail_url`.

### [NEW] Components:
- `DetailPage.tsx` — Large image (photo) or TikTok embed (video, autoplay muted, 🔊). AI description (locale-aware). Tags. LikeButton + SaveButton (from Phase 4).
- `DescriptionCard.tsx` — AI description in user's locale. Fallback: "Keine Beschreibung verfügbar."
- `TutorialSection.tsx` — 2-3 related TikTok embeds: "How to style this"
- `InfoTabs.tsx`, `ProductPills.tsx`, `SalonScript.tsx`, `CutGuide.tsx`
- `BookCTA.tsx` — Price range → "Book Now" → `/coiffeur?style=[slug]&category=[cat]`
- `ShareButton.tsx` — WhatsApp, Copy Link, Download (photos only)

### [NEW] `app/api/discovery/generate-description/route.ts`
Admin triggers Gemini to generate descriptions in 4 locales for an item.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 5: detail page + AI descriptions + tutorials + booking CTA"
git push origin main
```

> ⚠️ **BE CAREFUL**: Use cached `tiktok_embed_html` — don't re-fetch oEmbed. AI descriptions: generate once, store, serve from DB. Comments paginated 20/page.

---

## Phase 6 — Salon + User Posting (Auto-Flagging)

### [NEW] `app/api/discovery/post/route.ts`
Auth required. Photo upload OR TikTok URL. `discoveryPostSchema`. `discoveryPostLimiter` (3/day). Auto-flag → clean = `published` / flagged = `flagged`. Gemini auto-fills.

### [NEW] Components:
- `PostFromDiscover.tsx` — Floating "+" button (bottom-right). Uses `GlassModal` with bottom position for mobile. Upload photo or paste TikTok → AI auto-fills category/gender/texture/style/description → user reviews + edits → "Post". ToS checkbox mandatory.
- `UserPostsSection.tsx` — On user profile page: their posts with edit/delete.
- `ToSCheckbox.tsx` — Terms of Service agreement with link to `/terms/discovery`.

### [NEW] `app/[locale]/dashboard/discovery-posts/page.tsx`
Salon posting (mobile-optimized). Upload + AI auto-fill. History tab with stats.

### [NEW] `app/[locale]/terms/discovery/page.tsx`
Full ToS: copyright, license grant, content removal, prohibited content, GDPR compliance. 4 locales.

### [MODIFY] `components/dashboard/DashboardLayout.tsx` (line 45)
Insert in NAV array literal BEFORE Settings BEFORE `] as const;`:
```typescript
// BEFORE (lines 9-14, add Camera import):
import { ..., Camera } from "lucide-react";

// BEFORE (line 44-46):
  { label: "Bewertungen", href: "/dashboard/reviews",    icon: Star },
  { label: "Einstellungen",href: "/dashboard/settings",   icon: Settings },
] as const;

// AFTER:
  { label: "Bewertungen", href: "/dashboard/reviews",    icon: Star },
  { label: "Meine Posts",  href: "/dashboard/discovery-posts", icon: Camera },
  { label: "Einstellungen",href: "/dashboard/settings",   icon: Settings },
] as const;
```

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 6: salon + user posting with auto-flagging + AI auto-fill + ToS"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `NAV` is `as const` — modify ARRAY LITERAL
> - NOT flagged = auto-publish. ONLY flagged → admin review.
> - Gemini runs on upload → auto-fills → user edits → then submits
> - Salon ownership: `salons.owner_id = auth.uid()`
> - ToS checkbox MUST be checked (legal)
> - Photos only for uploads. TikTok = paste URL only.
> - Rate: 3 posts/day via `discoveryPostLimiter`

---

## Phase 7 — Algorithm + Prices + Booking Bridge

### [NEW] `lib/discovery-algorithm.ts`
Profile match 50% + popularity 20% + collaborative 20% + implicit 10% + recency. Cold start → trending. Gender-aware. Category-weighted.

### [NEW] `app/api/discovery/interactions/route.ts` — Fire-and-forget logging.
### [NEW] `app/api/discovery/salons-for-style/route.ts` — Match style → services → prices.
### [MODIFY] `app/api/discovery/feed/route.ts` — Use algorithm for authed, trending for guest.
### [MODIFY] Booking flow — Optional `?styleId=` + `?serviceId=` + `?category=`. Pre-fill from profile.

### [MODIFY] `app/[locale]/profile/page.tsx`
READ file first. ADD sections (do NOT rebuild):
- **"Meine Looks"**: Grid of user's published posts. Each card: thumbnail, like count, status badge. Edit/delete buttons.
- **"Discovery Preferences"**: Edit `disc_gender`, `disc_hair_texture`, etc. Same fields as ProfileSetupModal. Save → PATCH `/api/profile`.

### [NEW] `components/discovery/ProfileDiscoverySections.tsx`
Self-contained component for both sections above. Data: `/api/profile` + `/api/discovery/my-posts`.

### [NEW] `components/discovery/PriceRangeBadge.tsx`
Uses existing `formatCurrency()`. "CHF 45–80" badge on grid cards.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 7: algorithm + prices + booking bridge + profile sections"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - `?styleId=` MUST be optional — existing booking works without it
> - Profile page: READ FIRST, ADD sections. Don't rebuild. (CLAUDE.md Rule 8)
> - Algorithm cold start: no data → trending
> - Fire-and-forget: `fetch()` without `await`
> - `formatCurrency()` from `lib/format-currency.ts` — no hardcoded "CHF"

---

## Phase 8 — Staff Profiles + Pick Your Stylist

### [NEW] `components/discovery/StaffPortfolio.tsx`
Mini-portfolio per staff member. Optional TikTok/Instagram link.

### [MODIFY] Salon detail page
READ first. ADD "Our Stylists" section with mini-portfolios. Fallback: existing `staff_members` data.

### [NEW] `components/discovery/PickStylistFlow.tsx`
Before booking: browse stylists → see posts → "Book with [Name]". If no content → bio + headshot only.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 8: staff profiles + pick your stylist flow"
git push origin main
```

> ⚠️ **BE CAREFUL**: Staff profiles optional. Fallback to `staff_members` table. Don't break salon page.

---

## Phase 9 — Documentation

### [MODIFY] `CLAUDE.md` — APPEND only:
- Section 6 Schema: add all discovery tables
- Section 3.5 Key Features: add "24. Discovery Platform"
- Section 11: reference discovery limiters/schemas

### [MODIFY] `UI_RULES.md` — ADD section:
Masonry grid tokens, video autoplay, dark mode discovery tokens, category filters.

### [MODIFY] `.env.example`
```
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
GEMINI_API_KEY=
```

### [MODIFY] `app/sitemap.ts`
```typescript
// BEFORE (line 8):
const LOCALES = ["de", "en"] as const;
// AFTER:
const LOCALES = ["de", "en", "fr", "it"] as const;
```

Add discovery page + dynamic item entries to sitemap function.

**Verification:**
```bash
pnpm run build
git add -A && git commit -m "phase 9: documentation (CLAUDE.md + UI_RULES.md + sitemap + .env.example)"
git push origin main
# Final: curl all discovery URLs
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/discover
```

> ⚠️ **BE CAREFUL**: APPEND only to CLAUDE.md. Sitemap: add all 4 locales (pre-existing bug fix).

---

## R6: DEPENDENCY ORDER

| Step | Type | What | Depends On |
|---|---|---|---|
| Step 1-2 | 🧑 | API Keys + Vercel env vars | Nothing |
| Step 3 | 🧑 | Supabase bucket | ✅ Done |
| Phase 0 | 🤖 | DB + types + schemas + limiters | Steps 1-3 |
| Phase 1 | 🤖 | API libraries + sharp + next.config | 0 |
| Phase 2 | 🤖 | Admin Content Studio | 0 + 1 |
| Phase 3 | 🤖 | Discovery Grid + BottomNav | 0 + 1 |
| Phase 4 | 🤖 | **Social** (likes/saves/comments) | 0 |
| Phase 5 | 🤖 | **Detail page** + AI descriptions | 0 + 1 + 4 |
| Phase 6 | 🤖 | Posting + auto-flagging + ToS | 1 + 3 |
| Phase 7 | 🤖 | Algorithm + booking bridge | 3 + 4 |
| Phase 8 | 🤖 | Staff profiles | 3 |
| Phase 9 | 🤖 | Documentation | All |
| Step 4 | 🧑 | Seed content via admin dashboard | Phase 2 |

---

## v2 Roadmap (TikTok Login Kit — Apply Whenever You Want)

> Register at [developers.tiktok.com](https://developers.tiktok.com/), create app `solen-ch`, request Login Kit. TikTok takes 2-4 weeks to approve. Start the process now if you want these features later — it's free, just slow.

| Feature | Needs |
|---|---|
| "Continue with TikTok" signup | Login Kit approval |
| Creator badge (≥10K followers) | Login Kit + follower scope |
| Social booking intel | Login Kit + follower scope |
| Friend activity ("3 mutuals") | Friends list scope (restricted) |

## v3 Roadmap (Future)

| Feature | Needs |
|---|---|
| Auto-sync salon TikTok | Content Posting API |
| Taste profile builder | Data Portability API |
| "You might like" AI recs | Data Portability API |

