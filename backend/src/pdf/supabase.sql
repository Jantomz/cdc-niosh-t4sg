create or replace function match_pdf_chunks(
  query_embedding vector,
  match_count int,
  similarity_threshold float
)
returns table (
  pdf_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    pdf_id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from pdf_embeddings
  where (embedding <=> query_embedding) < similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
