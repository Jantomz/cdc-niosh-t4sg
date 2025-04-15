-- Schema for the Vision Pipeline Supabase tables

-- Table to store image metadata and descriptions
CREATE TABLE IF NOT EXISTS notion_images (
  id TEXT PRIMARY KEY,
  source_page_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  content_description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add a reference to the page it belongs to
  CONSTRAINT fk_source_page
    FOREIGN KEY (source_page_id)
    REFERENCES notion_pages(id)
    ON DELETE CASCADE
);

-- Index for faster querying by page ID
CREATE INDEX IF NOT EXISTS idx_notion_images_source_page_id ON notion_images(source_page_id);

-- Enable vector extension if not already enabled
-- Uncomment if you need to enable it
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store image embeddings for vector search
CREATE TABLE IF NOT EXISTS notion_image_embeddings (
  id SERIAL PRIMARY KEY,
  image_id TEXT NOT NULL,
  embedding vector(384), -- Adjust dimension according to your embedding model
  
  -- Reference the image this embedding belongs to
  CONSTRAINT fk_image
    FOREIGN KEY (image_id)
    REFERENCES notion_images(id)
    ON DELETE CASCADE
);

-- Add vector index for similarity search
CREATE INDEX IF NOT EXISTS notion_image_embeddings_embedding_idx ON notion_image_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust based on your dataset size

-- Table to store processed pages with image references
CREATE TABLE IF NOT EXISTS notion_processed_pages (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL UNIQUE,
  original_content TEXT NOT NULL,
  processed_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster page lookups
CREATE INDEX IF NOT EXISTS idx_notion_processed_pages_page_id ON notion_processed_pages(page_id);

-- Table to track image references within pages
CREATE TABLE IF NOT EXISTS notion_image_references (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  marker TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Reference both the page and image
  CONSTRAINT fk_page
    FOREIGN KEY (page_id)
    REFERENCES notion_processed_pages(page_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_image
    FOREIGN KEY (image_id)
    REFERENCES notion_images(id)
    ON DELETE CASCADE,
    
  -- Ensure each image reference is unique per page
  UNIQUE(page_id, image_id)
);

-- Create index for faster lookups by page ID
CREATE INDEX IF NOT EXISTS idx_notion_image_references_page_id ON notion_image_references(page_id);

-- Function to update timestamp for processed pages
CREATE OR REPLACE FUNCTION update_notion_processed_pages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamps
CREATE TRIGGER update_notion_processed_pages_timestamp
BEFORE UPDATE ON notion_processed_pages
FOR EACH ROW
EXECUTE FUNCTION update_notion_processed_pages_timestamp();
