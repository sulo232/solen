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
