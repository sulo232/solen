-- Update match_search_embeddings to support optional match_city_id
DROP FUNCTION IF EXISTS match_search_embeddings(vector(768), text, float, int);

CREATE OR REPLACE FUNCTION match_search_embeddings(
  query_embedding vector(768),
  match_category TEXT DEFAULT NULL,
  match_city_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  category TEXT,
  text_content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
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
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
