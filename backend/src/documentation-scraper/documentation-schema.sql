-- Documentation table to store scraped documentation content
CREATE TABLE IF NOT EXISTS documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster searching
CREATE INDEX IF NOT EXISTS idx_documentation_source_name ON documentation(source_name);
CREATE INDEX IF NOT EXISTS idx_documentation_title ON documentation(title);

-- Documentation keywords mapping table
-- This table maps keywords to documentation entries for quick retrieval
CREATE TABLE IF NOT EXISTS documentation_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  documentation_id UUID NOT NULL REFERENCES documentation(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(keyword, documentation_id)
);

-- Index for faster keyword lookups
CREATE INDEX IF NOT EXISTS idx_documentation_keywords_keyword ON documentation_keywords(keyword);

-- Documentation sources table to store configuration for scraping
CREATE TABLE IF NOT EXISTS documentation_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  keywords TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_documentation_sources_updated_at
BEFORE UPDATE ON documentation_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Vector extension for similarity search (if not already enabled)
-- Uncomment if you want to enable vector extension
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to documentation table for semantic search (optional)
-- Uncomment if you want to add vector support
-- ALTER TABLE documentation ADD COLUMN IF NOT EXISTS content_embedding vector(1536);
