/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  // Connection to Supabase would be initialized here
  // This would include auth credentials and other config

  // *CHRIS: Copied below from Michelle's deliverable
  // using Supabase client to connect to Supabase backend
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    // im initializing Supabase client with credentials from environment variables but i think this can also be hardcoded
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase URL or key is missing from environment variables',
      );
      throw new Error('Supabase configuration is incomplete');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * DELIVERABLE 1: PDF Upload Functionality
   *
   * This method should:
   * 1. Accept a PDF file as a binary blob
   * 2. Upload the PDF to Supabase storage
   * 3. Use an OCR API to extract text from the PDF
   * 4. Store the extracted text and metadata in Supabase
   * 5. Return success/failure status with metadata
   *
   * @param file The PDF file as binary data
   * @param metadata Additional metadata about the PDF (title, author, etc.)
   * @returns Object containing upload status and file metadata
   */
  async uploadPdf(file: Buffer, metadata: Record<string, any>) {
    // TODO: Implement PDF upload, OCR processing, and storage

    return {
      success: true,
      fileId: 'generated-file-id',
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        fileSize: file.length,
      },
    };
  }

  /**
   * DELIVERABLE 2: PDF Retrieval Functionality
   *
   * This method should:
   * 1. Retrieve all PDFs stored in Supabase
   * 2. Include metadata and access information
   * 3. Optionally filter by provided parameters
   *
   * @param filters Optional filters for the PDF list (by date, author, etc.)
   * @returns Array of PDF metadata objects
   */
  async getAllPdfs(filters?: Record<string, any>) {
    // TODO: Implement PDF retrieval with optional filtering

    return [
      {
        id: 'pdf-id-1',
        title: 'Example PDF 1',
        uploadedAt: '2023-01-01T00:00:00Z',
        fileSize: 1024000,
        textExtracted: true,
        url: 'https://example.com/pdf1',
      },
      // More PDFs would be returned here
    ];
  }

  /**
   * Retrieves a single PDF by ID
   */
  async getPdfById(id: string) {
    // TODO: Implement single PDF retrieval

    return {
      id,
      title: 'Example PDF',
      uploadedAt: '2023-01-01T00:00:00Z',
      fileSize: 1024000,
      textExtracted: true,
      textContent: 'The extracted text content would be here...',
      url: 'https://example.com/pdf',
    };
  }

  /**
   * Uploads a list of embeddings to Supabase.
   *
   * Each embedding object should have the following structure:
   * {
   *   pdfId: string,
   *   text: string,
   *   embedding: number[]
   * }
   *
   * @param embeddings Array of embedding objects
   * @returns An object indicating success or failure with an optional error message
   */
  async uploadEmbeddings(
    embeddings: { pdf_id: string; text: string; embedding: number[] }[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('pdf_embeddings')
        .insert(embeddings);

      if (error) {
        console.error('Error uploading embeddings:', error);
        return {
          success: false,
          error: error.message || 'Error uploading embeddings',
        };
      }
      return { success: true };
    } catch (err) {
      console.error('Unexpected error uploading embeddings:', err);
      return { success: false, error: err.message || 'Unexpected error' };
    }
  }
}
