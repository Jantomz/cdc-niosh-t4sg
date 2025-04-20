import { Controller, Get, Param } from '@nestjs/common';
import { NotionService } from './notion.service';

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Get(':id')
  processPage(@Param('id') id: string) {
    return this.notionService.processNotionPage(id);
  }

  // TODO: Delete this after testing
  @Get('search/:query')
  search(@Param('query') query: string) {
    return this.notionService.queryDocuments(query);
  }
}
