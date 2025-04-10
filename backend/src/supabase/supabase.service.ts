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
    try {
      this.logger.log(`Retrieving PDFs with filters: ${JSON.stringify(filters || {})}`);
      
      let query = this.supabase
        .from('pdfs')
        .select('*');
      
      if (filters) {
        if (filters.dateFrom && filters.dateTo) {
          query = query.gte('uploadedAt', filters.dateFrom)
                       .lte('uploadedAt', filters.dateTo);
        } else if (filters.dateFrom) {
          query = query.gte('uploadedAt', filters.dateFrom);
        } else if (filters.dateTo) {
          query = query.lte('uploadedAt', filters.dateTo);
        }
        
        if (filters.author) {
          query = query.eq('author', filters.author);
        }
        
        if (filters.textExtracted !== undefined) {
          query = query.eq('textExtracted', filters.textExtracted);
        }
        
        if (filters.title) {
          query = query.ilike('title', `%${filters.title}%`);
        }
        
        if (filters.id) {
          query = query.eq('id', filters.id);
        }
      }
      const { data, error } = await query.order('uploadedAt', { ascending: false });
      
      if (error) {
        this.logger.error(`Error fetching PDFs: ${error.message}`, error.stack);
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // generate signed URLs for each PDF
      const pdfResults = await Promise.all(
        data.map(async (pdf) => {
          const signedUrl = await this.generateSignedUrl(pdf.path);
          return {
            id: pdf.id,
            title: pdf.title,
            author: pdf.author || null,
            uploadedAt: pdf.uploadedAt,
            fileSize: pdf.fileSize,
            textExtracted: pdf.textExtracted,
            url: signedUrl
          };
        })
      );
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
        pdfResults
      ];
    } catch (error) {
      this.logger.error(`Failed to retrieve PDFs: ${error.message}`, error.stack);
    }
  }

  /**
   * Retrieves a single PDF by ID
   */
  async getPdfById(id: string) {
    // TODO: Implement single PDF retrieval
    try {
      this.logger.log(`Retrieving PDF with ID: ${id}`);
      
      const pdfs = await this.getAllPdfs({ id });
      
      if (!pdfs || pdfs.length === 0) {
        throw new NotFoundException(`PDF with ID ${id} not found`);
      }
      
      const pdf = pdfs[0];
      
      // get text content for this PDF
      const { data: textData, error: textError } = await this.supabase
        .from('pdf_text')
        .select('text_content')
        .eq('pdf_id', id)
        .single();
      
      if (textError && textError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which just means empty
        this.logger.error(`Error fetching PDF text: ${textError.message}`, textError.stack);
      }
      
      return {
        ...pdf,
        textContent: textData?.text_content || null
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve PDF by ID: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
    }
    // return {
    //   id,
    //   title: 'Example PDF',
    //   uploadedAt: '2023-01-01T00:00:00Z',
    //   fileSize: 1024000,
    //   textExtracted: true,
    //   textContent: 'The extracted text content would be here...',
    //   url: 'https://example.com/pdf',
    // };
  }

  /**
   * Generate a signed URL for accessing a file from Supabase Storage
   * @param filePath Path to the file in storage
   * @returns String containing the signed URL
   */
  private async generateSignedUrl(filePath: string): Promise<string | undefined> {
    try {
      // Get bucket and path from the filepath, assuming the format is 'bucket/path_to_file.pdf'
      const [bucket, ...pathParts] = filePath.split('/');
      const path = pathParts.join('/');
      
      // signed URL with 1 hour expiration (3600 seconds)
      const { data, error } = await this.supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      
      if (error) {
        this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
        return undefined;
      }
      
      if (!data || !data.signedUrl) {
        throw new NotFoundException('File not found or inaccessible');
      }
      
      return data.signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      return undefined;
    }
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
