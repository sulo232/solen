-- V3-D346 (2026-05-29) Move 1 — seed starter "collections" for the discovery FeaturedBoards row.
--
-- Reality at seed time: the discovery library is 18 items, all `hair`. So we seed only
-- hair collections that actually have content. Add more boards (other categories) as the
-- library grows — the FeaturedBoards UI renders whatever is_active rows exist.
--
-- Mechanics:
--   • `style_name` holds a SEARCH KEYWORD (not an exact style). Tapping a board sets the
--     feed search to this keyword; the feed API ORs it across name/style_name/description.
--   • `cover_images` are `/api/discovery/thumb/<id>` proxy paths (same-origin). The proxy
--     re-fetches a fresh thumbnail per request, so covers survive the TikTok signed-URL
--     expiry that kills raw image_url/tiktok_thumbnail_url over time. The proxy 502s for
--     items whose TikTok source is gone — FeaturedBoards hides those onError (grey cell),
--     so the row degrades gracefully. NOTE: durable covers ultimately need discovery
--     imagery re-hosted on Supabase Storage (tracked separately, see INCOMPLETE_FEATURES).
--   • Idempotent: deletes the three seeded slugs first, then re-inserts.
--
-- Translations are first-pass (style terms are common loanwords in DACH/FR/IT salon use);
-- refine name_fr / name_it later if desired.

DELETE FROM discovery_boards WHERE slug IN ('textured-crops', 'fades', 'shags');

INSERT INTO discovery_boards
  (name, name_de, name_en, name_fr, name_it, slug, description, category, style_name, cover_images, pin_count, is_active, sort_order)
VALUES
  (
    'Textured Crops', 'Textured Crops', 'Textured Crops', 'Crops texturés', 'Crop testurizzati',
    'textured-crops', 'Moderne texturierte Crops', 'hair', 'Crop',
    ARRAY(
      SELECT '/api/discovery/thumb/' || id::text
      FROM discovery_items
      WHERE category = 'hair' AND style_name ILIKE '%Crop%' AND status = 'published' AND is_active
      ORDER BY like_count DESC NULLS LAST
      LIMIT 3
    ),
    (SELECT count(*) FROM discovery_items WHERE category = 'hair' AND style_name ILIKE '%Crop%' AND status = 'published' AND is_active),
    true, 1
  ),
  (
    'Fades', 'Fades', 'Fades', 'Dégradés', 'Sfumature',
    'fades', 'Taper & Skin Fades', 'hair', 'Fade',
    ARRAY(
      SELECT '/api/discovery/thumb/' || id::text
      FROM discovery_items
      WHERE category = 'hair' AND style_name ILIKE '%Fade%' AND status = 'published' AND is_active
      ORDER BY like_count DESC NULLS LAST
      LIMIT 3
    ),
    (SELECT count(*) FROM discovery_items WHERE category = 'hair' AND style_name ILIKE '%Fade%' AND status = 'published' AND is_active),
    true, 2
  ),
  (
    'Shags', 'Shags', 'Shags', 'Shags', 'Shag',
    'shags', 'Messy Shags & Wolf Cuts', 'hair', 'Shag',
    ARRAY(
      SELECT '/api/discovery/thumb/' || id::text
      FROM discovery_items
      WHERE category = 'hair' AND style_name ILIKE '%Shag%' AND status = 'published' AND is_active
      ORDER BY like_count DESC NULLS LAST
      LIMIT 3
    ),
    (SELECT count(*) FROM discovery_items WHERE category = 'hair' AND style_name ILIKE '%Shag%' AND status = 'published' AND is_active),
    true, 3
  );
