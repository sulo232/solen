-- ============================================================
-- 20260602140000_smart_search_marketplace_filter
-- Add the marketplace-visibility filter INSIDE the semantic-search RPC (the one
-- discovery path that bypasses the route-level listed_on_marketplace filters):
-- a salon/service whose salon opted OUT of the marketplace (walk-in-only) must
-- not surface in smart search. discovery_item is content (not salon-gated).
-- IS NOT FALSE → NULL/true stays visible (fail-open; the column defaults true).
-- CREATE OR REPLACE — preserves the existing signature + behaviour, adds one AND-clause.
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_search_embeddings(
  query_embedding vector,
  match_category text DEFAULT NULL::text,
  match_city_id uuid DEFAULT NULL::uuid,
  match_threshold double precision DEFAULT 0.5,
  match_count integer DEFAULT 10
)
RETURNS TABLE(entity_type text, entity_id uuid, category text, text_content text, similarity double precision)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    se.entity_type,
    se.entity_id,
    se.category,
    se.text_content,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM public.search_embeddings se
  WHERE
    (match_category IS NULL OR se.category = match_category)
    AND 1 - (se.embedding <=> query_embedding) > match_threshold
    AND (
      match_city_id IS NULL OR
      (se.entity_type = 'salon' AND EXISTS (SELECT 1 FROM public.salons s WHERE s.id = se.entity_id AND s.city_id = match_city_id)) OR
      (se.entity_type = 'service' AND EXISTS (SELECT 1 FROM public.services svc JOIN public.salons s ON svc.salon_id = s.id WHERE svc.id = se.entity_id AND s.city_id = match_city_id)) OR
      (se.entity_type = 'discovery_item')
    )
    -- Marketplace visibility (walk-in-only shops opt out of discovery).
    AND (
      se.entity_type = 'discovery_item' OR
      (se.entity_type = 'salon' AND EXISTS (SELECT 1 FROM public.salons s WHERE s.id = se.entity_id AND s.listed_on_marketplace IS NOT FALSE)) OR
      (se.entity_type = 'service' AND EXISTS (SELECT 1 FROM public.services svc JOIN public.salons s ON svc.salon_id = s.id WHERE svc.id = se.entity_id AND s.listed_on_marketplace IS NOT FALSE))
    )
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
