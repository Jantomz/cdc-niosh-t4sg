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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from './supabase.service';

@Controller('supabase')
export class SupabaseController {
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
  async getAllPdfs() {
    return this.supabaseService.getAllPdfs();
  }

  /**
   * Get a single PDF by ID
   *
   * GET /supabase/pdf/:id
   */
  @Get('pdf/:id')
  async getPdfById(@Param('id') id: string) {
    return this.supabaseService.getPdfById(id);
  }
}
