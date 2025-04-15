import { Controller, Post, Body } from '@nestjs/common';
import { DocsService } from './docs.service';

@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  // TODO: We need an endpoint that can take in a query, with previous context (from Notion + previous queries) and index/rank the keywords used from a bank. Words that are used more frequently and recently will be then linked to a combination of documentation web endpoints that will return the correct URL for the frontend to append to the response.
  @Post('query')
  queryDocs(@Body() queryDto: { query: string; context: string }) {
    // The queryDto contains the query string and previous context
    return this.docsService.queryDocs(queryDto.query, queryDto.context);
  }
}
