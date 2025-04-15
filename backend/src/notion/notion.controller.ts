import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NotionService } from './notion.service';

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Get('pages')
  async listPages() {
    return this.notionService.listAvailablePages();
  }

  @Get('page/:pageId')
  async getPage(@Param('pageId') pageId: string) {
    return this.notionService.getNotionPage(pageId);
  }

  @Post('embed/:pageId')
  async embedPage(@Param('pageId') pageId: string) {
    return this.notionService.embedNotionPage(pageId);
  }

  @Get('query')
  async queryPages(
    @Query('q') query: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.notionService.queryNotionPages(query, limit);
  }
}
