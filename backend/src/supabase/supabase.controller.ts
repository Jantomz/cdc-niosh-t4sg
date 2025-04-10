/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from './supabase.service';

@Controller('supabase')
export class SupabaseController {
  private readonly logger = new Logger(SupabaseController.name); // to log errors
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * DELIVERABLE 1: PDF Upload Endpoint
   *
   * POST /supabase/pdf
   *
   * Request:
   * - PDF file in multipart/form-data
   * - Metadata as JSON in form field
   *
   * Response:
   * - Object with upload status and metadata
   */
  @Post('pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata: Record<string, any>,
  ) {
    // Convert file buffer to Buffer type
    const fileBuffer = Buffer.from(file.buffer);

    // Process metadata if it's a string
    const parsedMetadata =
      typeof metadata === 'string' ? JSON.parse(metadata) : metadata || {};

    // Call service to handle PDF upload and OCR
    return this.supabaseService.uploadPdf(fileBuffer, {
      ...parsedMetadata,
      filename: file.originalname,
      mimetype: file.mimetype,
    });
  }

  /**
   * Added by Chris on Thur. Apr. 3, 2025
   * DELIVERABLE 4: PDF Embeddings Upload Endpoint
   *
   * POST /supabase/embeddings
   *
   * Request:
   * - JSON body with an array of embedding objects, each with pdf_id, text, and embedding fields.
   *
   * Response:
   * - Object with upload status and optional error message.
   */
  @Post('pdf_embeddings')
  async uploadEmbeddings(
    @Body('embeddings')
    embeddings: { pdf_id: string; text: string; embedding: number[] }[],
  ) {
    return this.supabaseService.uploadEmbeddings(embeddings);
  }

  /**
   * DELIVERABLE 2: PDF Retrieval Endpoint
   *
   * GET /supabase/pdf
   *
   * Query Parameters (optional):
   * - Various filters like date ranges, author, etc.
   *
   * Response:
   * - Array of PDF metadata objects
   */
  @Get('pdf')
  async getAllPdfs(@Query() filters?: Record<string, any>) {
    try {
      this.logger.log(`Retrieving PDFs with filters: ${JSON.stringify(filters)}`);
      
      const processedFilters: Record<string, any> = {};
      
      if (filters?.dateFrom) {
        processedFilters.dateFrom = new Date(filters.dateFrom).toISOString();
      }
      if (filters?.dateTo) {
        processedFilters.dateTo = new Date(filters.dateTo).toISOString();
      }
      
      if (filters?.author) {
        processedFilters.author = filters.author;
      }
      
      if (filters?.textExtracted !== undefined) {
        processedFilters.textExtracted = filters.textExtracted === 'true';
      }
      
      if (filters?.title) {
        processedFilters.title = filters.title;
      }
      
      const pdfs = await this.supabaseService.getAllPdfs(
        Object.keys(processedFilters).length > 0 ? processedFilters : undefined
      );
      
      return {
        success: true,
        count: (pdfs ?? []).length,
        data: pdfs
      };
    } catch (error) {
      this.logger.error(`Error retrieving PDFs: ${error.message}`, error.stack);
    }
  }

  /**
   * Get a single PDF by ID
   *
   * GET /supabase/pdf/:id
   */
  @Get('pdf/:id')
  async getPdfById(@Param('id') id: string) {
    try {
      this.logger.log(`Retrieving PDF with ID: ${id}`);
      
      const pdf = await this.supabaseService.getPdfById(id);
      
      return {
        success: true,
        data: pdf
      };
    } catch (error) {
      this.logger.error(`Error retrieving PDF: ${error.message}`, error.stack);
    }
  }
}
