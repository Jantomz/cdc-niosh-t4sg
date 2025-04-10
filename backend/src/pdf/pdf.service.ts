/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import OpenAI from 'openai';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const openai = new OpenAI();
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
    async function generateEmbedding(input: string): Promise<number[]> {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
        encoding_format: 'float',
      });
      if (
        !embeddingResponse ||
        !embeddingResponse.data ||
        embeddingResponse.data.length === 0
      ) {
        throw new Error('Failed to generate embedding');
      }
      return embeddingResponse.data[0].embedding;
    }

    // Retrieve PDF text content
    const pdfRecord = await this.supabaseService.getPdfById(pdfId);
    if (!pdfRecord || !pdfRecord.textContent) {
      return {
        success: false,
        error: 'PDF text content is missing or not available',
      };
    }

    // Chunk the text for embedding
    // TODO: Use page break delinations for metadata
    const words = pdfRecord.textContent;
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 100,
    });

    // Modify to add more metadata (e.g. page number?)
    const chunks = await splitter.splitDocuments([
      new Document({ pageContent: words }),
    ]);

    if (chunks.length === 0) {
      return {
        success: false,
        error: 'Failed to chunk PDF text properly',
      };
    }

    // Generate embeddings
    // Page and position metadata? Dependent on above
    const embeddings: {
      pdf_id: string;
      text: string;
      embedding: any;
    }[] = [];

    for (const chunk of chunks) {
      try {
        const embeddingVector = await generateEmbedding(chunk.pageContent);
        embeddings.push({
          pdf_id: pdfId,
          // page: chunk.page || null,
          // position: chunk.position || null,
          text: chunk.pageContent,
          embedding: embeddingVector,
        });
      } catch (error) {
        // Log or handle individual chunk embedding errors
        console.error('Error generating embedding for a chunk:', error);
      }
    }

    if (embeddings.length === 0) {
      return {
        success: false,
        error: 'Embedding generation failed for all chunks',
      };
    }

    // Store embeddings in Supabase
    const uploadEmbeddings =
      await this.supabaseService.uploadEmbeddings(embeddings);
    if (!uploadEmbeddings.success) {
      return {
        success: false,
        error: 'Failed to store embeddings in Supabase',
      };
    }

    return {
      success: true,
      pdfId,
      embeddingCount: embeddings.length,
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
    // 2. Perform vector similarity search in Supabase
    // 3. Retrieve and rank results

    return {
      results: [
        {
          pdfId: 'pdf-id-1',
          title: 'Most Relevant PDF',
          similarityScore: 0.92,
          matchedText: 'The section of text that matched the query...',
          url: 'https://example.com/pdf1',
        },
        {
          pdfId: 'pdf-id-2',
          title: 'Second Relevant PDF',
          similarityScore: 0.85,
          matchedText: 'Another section that matched...',
          url: 'https://example.com/pdf2',
        },
        // More results would appear here
      ],
      query,
      processedAt: new Date().toISOString(),
    };
  }
}
