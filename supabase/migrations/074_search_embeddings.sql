-- Enable pgvector extension (Supabase supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table for semantic search
CREATE TABLE public.search_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service', 'salon', 'discovery_item')),
  entity_id UUID NOT NULL,
  category TEXT NOT NULL,
  text_content TEXT NOT NULL,
  embedding vector(768),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast vector similarity search
-- Using hnsw (not ivfflat) because ivfflat needs 1000+ rows to be effective.
-- hnsw works well even with < 100 rows.
CREATE INDEX search_embeddings_embedding_idx
  ON public.search_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Unique constraint: one embedding per entity
CREATE UNIQUE INDEX search_embeddings_entity_uniq
  ON public.search_embeddings (entity_type, entity_id);

-- Category index for scoped searches
CREATE INDEX search_embeddings_category_idx
  ON public.search_embeddings (category);

-- Index for fast date-based availability queries (used by Phase 5)
CREATE INDEX idx_slots_date_status
  ON public.availability_slots (status, starts_at);

-- RLS
ALTER TABLE public.search_embeddings ENABLE ROW LEVEL SECURITY;

-- Public read (embeddings are not sensitive)
CREATE POLICY "search_embeddings_select_public"
  ON public.search_embeddings FOR SELECT USING (true);

-- Admin-only writes (populated by cron/backfill)
CREATE POLICY "search_embeddings_insert_admin"
  ON public.search_embeddings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "search_embeddings_update_admin"
  ON public.search_embeddings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_search_embeddings(
  query_embedding vector(768),
  match_category TEXT DEFAULT NULL,
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
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
