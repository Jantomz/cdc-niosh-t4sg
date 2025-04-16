import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { DocumentationScraperService } from './documentation-scraper.service';

@Controller('documentation-scraper')
export class DocumentationScraperController {
  private readonly logger = new Logger(DocumentationScraperController.name);
  
  constructor(
    private readonly docScraperService: DocumentationScraperService,
  ) {}

  /**
   * Trigger the scraping of all configured documentation sources
   */
  @Post('scrape')
  async scrapeDocumentation() {
    this.logger.log('Received request to scrape documentation');
    return this.docScraperService.scrapeAllDocumentation();
  }

  /**
   * Add a new documentation source to be scraped
   */
  @Post('sources')
  async addDocumentationSource(@Body() source: any) {
    this.logger.log(
      `Received request to add documentation source: ${source.name}`,
    );
    await this.docScraperService.addDocumentationSource(source);
    return {
      success: true,
      message: 'Documentation source added successfully',
    };
  }

  /**
   * Schedule regular scraping of documentation
   */
  @Post('schedule')
  async scheduleDocumentationScraping(
    @Body() config: { intervalHours: number },
  ) {
    this.logger.log(
      `Received request to schedule documentation scraping every ${config.intervalHours} hours`,
    );
    await this.docScraperService.scheduleDocumentationScraping(
      config.intervalHours,
    );
    return {
      success: true,
      message: `Documentation scraping scheduled every ${config.intervalHours} hours`,
    };
  }
}
