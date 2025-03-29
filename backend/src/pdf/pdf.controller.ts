import { Controller, Post, Body } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  // TODO: In the future, we will secure these endpoints and pre-process any input

  /**
   * DELIVERABLE 4: PDF Embedding Endpoint
   *
   * POST /pdf
   *
   * Request:
   * {
   *   "pdfId": "id-of-pdf-to-embed"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "pdfId": "id-of-pdf-to-embed",
   *   "embeddingCount": 150,
   *   "timestamp": "2023-03-22T12:34:56Z"
   * }
   */
  @Post()
  embedPdf(@Body() body: { pdfId: string }) {
    return this.pdfService.embedPdf(body.pdfId);
  }

  /**
   * DELIVERABLE 5: PDF Query Endpoint
   *
   * POST /pdf/query
   *
   * Request:
   * {
   *   "query": "your search query here",
   *   "limit": 5  // Optional: max number of results
   * }
   *
   * Response:
   * {
   *   "results": [
   *     {
   *       "pdfId": "pdf-id-1",
   *       "title": "Most Relevant PDF",
   *       "similarityScore": 0.92,
   *       "matchedText": "The section that matched the query...",
   *       "url": "https://example.com/pdf1"
   *     },
   *     // More results...
   *   ],
   *   "query": "your search query here",
   *   "processedAt": "2023-03-22T12:34:56Z"
   * }
   */
  @Post('query')
  queryResponse(@Body() body: { query: string; limit?: number }) {
    return this.pdfService.queryPdfs(body.query, body.limit);
  }
}
