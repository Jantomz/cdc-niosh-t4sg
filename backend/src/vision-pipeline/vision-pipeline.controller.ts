import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { VisionPipelineService } from './vision-pipeline.service';

@Controller('vision-pipeline')
export class VisionPipelineController {
  private readonly logger = new Logger(VisionPipelineController.name);

  constructor(private readonly visionPipelineService: VisionPipelineService) {}

  /**
   * Process a page with images from Notion
   */
  @Post('process-page')
  async processPage(
    @Body()
    data: {
      pageId: string;
      pageContent: string;
      imageUrls: string[];
    },
  ) {
    this.logger.log(
      `Received request to process page ${data.pageId} with ${data.imageUrls.length} images`,
    );
    const result = await this.visionPipelineService.processPageWithImages(
      data.pageId,
      data.pageContent,
      data.imageUrls,
    );
    return {
      success: true,
      pageId: data.pageId,
      processedContent: result.processed_content,
      imageCount: result.image_references.length,
    };
  }

  /**
   * Reconstruct content with images for display
   */
  @Post('reconstruct-content')
  async reconstructContent(@Body() data: { processedContent: string }) {
    this.logger.log('Received request to reconstruct content with images');
    const restoredContent =
      await this.visionPipelineService.reconstructContentWithImages(
        data.processedContent,
      );
    return {
      success: true,
      restoredContent,
    };
  }

  /**
   * Search for images by content description
   */
  @Get('search-images')
  async searchImages(
    @Query('query') query: string,
    @Query('limit') limit: number = 5,
  ) {
    this.logger.log(`Searching for images with query: ${query}`);
    const results = await this.visionPipelineService.searchImagesByContent(
      query,
      limit,
    );
    return {
      success: true,
      query,
      results,
      count: results.length,
    };
  }
}
