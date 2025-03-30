import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PdfService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * DELIVERABLE 4: PDF Embedding Functionality
   *
   * This method should:
   * 1. Take a PDF ID as input
   * 2. Retrieve the PDF text content from Supabase
   * 3. Generate embeddings for the content using an embedding model
   * 4. Store the embeddings back in Supabase for later querying
   * 5. Return status information
   *
   * @param pdfId The ID of the PDF to embed
   * @returns Object containing embedding status
   */
  async embedPdf(pdfId: string) {
    // TODO: Implement PDF embedding
    // 1. Retrieve PDF content
    // 2. Generate embeddings (could use OpenAI, Hugging Face, etc.)
    // 3. Store embeddings in Supabase

    return {
      success: true,
      pdfId,
      embeddingCount: 150, // Example: number of chunks embedded
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELIVERABLE 5: PDF Query Functionality
   *
   * This method should:
   * 1. Take a query string
   * 2. Generate an embedding for the query
   * 3. Perform a similarity search against stored PDF embeddings
   * 4. Return the most relevant PDFs with similarity scores
   *
   * @param query The search query
   * @param limit Optional limit on number of results
   * @returns Array of PDF matches with relevance scores
   */
  async queryPdfs(query: string, limit: number = 5) {
    // TODO: Implement query embedding and similarity search
    // 1. Generate embedding for query

    let query_embedding = await this.supabaseService.getEmbedding(query)

    function Normalize( Embed_vector: number[]): number[] {

      const mag = Math.sqrt(Embed_vector.reduce((accum_value, curr_value) => accum_value + curr_value**2, 0 ));
      if (mag == 0) return Embed_vector;
      return Embed_vector.map(val => val / mag);

    }

    query_embedding = Normalize(query_embedding);

    // 2. Perform vector similarity search in Supabase

    const { data: matches, error } = await this.supabaseService.client.rpc('match_pdf_chunks', { 
      query_embedding,
      match_count: limit,
      similarity_threshold: 0.7
    });

    if (error) {
      console.error('Error in vector similarity search:', error);
      throw new Error('Vector similarity search failed');
    }


    // 3. Retrieve and rank results
    
    const enrichedResults = await Promise.all(
      matches.map(async (match) => {
        
        const { data: pdfMeta, error: metaErr } = await this.supabaseService.client
          .from('pdfs').select('title, author').eq('id', match.pdf_id).single();

        if (metaErr) {
          console.warn(`Metadata not found for PDF ID ${match.pdf_id}`);
        }
        

        const filePath = `${match.pdf_id}.pdf`;
        const { data: signedUrlData } = await this.supabaseService.client
          .storage.from('pdfs').createSignedUrl(filePath, 60 * 60);

        return {
          pdfId: match.pdf_id,
          title: pdfMeta?.title || 'Untitled PDF',
          similarityScore: match.similarity,
          matchedText: match.content,
          url: signedUrlData?.signedUrl || pdfMeta?.url || ''
        };
      })
    );

    enrichedResults.sort((a, b) => b.similarityScore - a.similarityScore);


    return {
      results: enrichedResults,
      query,
      processedAt: new Date().toISOString(),
    };
  }
}
