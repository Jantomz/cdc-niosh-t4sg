import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {}

  /**
   * Query the RAG system with user input
   */
  @Post('query')
  async queryRag(
    @Body()
    queryDto: {
      query: string;
      conversationId?: string;
      conversationContext?: any[];
    },
  ) {
    this.logger.log(`Received RAG query: ${queryDto.query}`);

    return this.ragService.queryRag(
      queryDto.query,
      queryDto.conversationId,
      queryDto.conversationContext,
    );
  }

  /**
   * Get a specific source reference by ID
   */
  @Get('sources/:id')
  getSourceReference(@Param('id') id: string) {
    this.logger.log(`Fetching source reference: ${id}`);

    return this.ragService.getSourceReference(id);
  }

  /**
   * Get all source references for a response
   */
  @Get('sources/response/:responseId')
  getSourceReferencesForResponse(@Param('responseId') responseId: string) {
    this.logger.log(`Fetching sources for response: ${responseId}`);

    return this.ragService.getSourceReferencesForResponse(responseId);
  }
}
