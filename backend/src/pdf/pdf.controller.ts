import { Controller, Post } from '@nestjs/common';

@Controller('pdf')
export class PdfController {
  // TODO: In the future, we will secure these endpoints and pre-process any input

  @Post()
  embedPdf() {
    return {
      message: 'This is a response either confirming success or failure',
    };
  }

  @Post('query')
  queryResponse() {
    // TODO: Implement this by taking in a string of query and returning a response of top PDFs that match/answer the query
    return {
      message: 'This is a response either confirming success or failure',
    };
  }
}
