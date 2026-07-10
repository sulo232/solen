// Public (anonymous-safe) discovery_items column allowlist. Mirrors
// app/api/discovery/boards/[id]/route.ts's ITEM_COLS (its select('*') predecessors leaked
// flag_reason, the moderation note, and owner_user_id, the uploader FK, to anonymous
// clients), extended with the attribute columns discovery/similar's similarity scoring reads
// (category, gender, texture, face_shapes) plus like_count (trending sort / most-liked
// tie-break). Shared by discover/nails and discovery/similar. Never add flag_reason,
// owner_user_id, owner_salon_id, status, is_active, sort_order, or the
// salon_script*/cut_guide/products* moderation-adjacent text here.
export const DISCOVERY_ITEM_PUBLIC_COLS =
  "id, category, source, content_type, media_type, image_url, tiktok_url, tiktok_thumbnail_url, tiktok_embed_html, author_name, style_name, alt_text, tags, face_shapes, texture, gender, price_min, like_count";
