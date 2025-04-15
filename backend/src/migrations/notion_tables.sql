-- Create extension for vector similarity search if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for notion pages
CREATE TABLE IF NOT EXISTS notion_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  parent_id TEXT,
  created_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_edited_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for notion blocks
CREATE TABLE IF NOT EXISTS notion_blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES notion_pages(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT NOT NULL,
  path TEXT,
  created_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_edited_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for notion embeddings
CREATE TABLE IF NOT EXISTS notion_embeddings (
  id SERIAL PRIMARY KEY,
  block_id TEXT NOT NULL,
  page_id TEXT NOT NULL REFERENCES notion_pages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for fast similarity search
CREATE INDEX IF NOT EXISTS notion_embeddings_idx ON notion_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to match notion embeddings using vector similarity
CREATE OR REPLACE FUNCTION match_notion_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id INT,
  block_id TEXT,
  page_id TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ne.id,
    ne.block_id,
    ne.page_id,
    ne.content,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM notion_embeddings ne
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to create the notion_embeddings table (used when table doesn't exist)
CREATE OR REPLACE FUNCTION create_notion_embeddings_table()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS notion_embeddings (
    id SERIAL PRIMARY KEY,
    block_id TEXT NOT NULL,
    page_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS notion_embeddings_idx ON notion_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
END;
$$;
