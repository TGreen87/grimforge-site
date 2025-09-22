-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Analytics events table for first-party instrumentation
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  pathname TEXT NOT NULL,
  search TEXT,
  referrer TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address INET,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_pathname_idx ON public.analytics_events (pathname);
CREATE INDEX IF NOT EXISTS analytics_events_occurred_at_idx ON public.analytics_events (occurred_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read analytics events" ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Inserts are handled via service role in API routes; no public/anon insert policy required.

-- Assistant knowledge base storing embedded document chunks
CREATE TABLE IF NOT EXISTS public.assistant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  token_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS assistant_documents_source_chunk_idx
  ON public.assistant_documents (source_path, chunk_index);

CREATE INDEX IF NOT EXISTS assistant_documents_title_idx
  ON public.assistant_documents USING GIN (to_tsvector('english', coalesce(title, '')));

-- Vector similarity search index (requires ANALYZE after large upserts)
CREATE INDEX IF NOT EXISTS assistant_documents_embedding_idx
  ON public.assistant_documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.assistant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read assistant documents" ON public.assistant_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Helper function for semantic search
CREATE OR REPLACE FUNCTION public.match_assistant_documents(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  match_threshold double precision DEFAULT 0.2
)
RETURNS TABLE (
  id UUID,
  source_path TEXT,
  chunk_index INTEGER,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    doc.id,
    doc.source_path,
    doc.chunk_index,
    doc.title,
    doc.content,
    doc.metadata,
    1 - (doc.embedding <=> query_embedding) AS similarity
  FROM public.assistant_documents AS doc
  WHERE doc.embedding IS NOT NULL
    AND 1 - (doc.embedding <=> query_embedding) >= match_threshold
  ORDER BY doc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Helper view for daily counts (non-materialized to avoid permission issues)
CREATE OR REPLACE VIEW public.analytics_events_7d AS
SELECT
  date_trunc('day', occurred_at) AS event_day,
  event_type,
  COUNT(*) AS event_count
FROM public.analytics_events
WHERE occurred_at >= NOW() - INTERVAL '7 days'
GROUP BY 1, 2;

GRANT SELECT ON public.analytics_events_7d TO authenticated;
