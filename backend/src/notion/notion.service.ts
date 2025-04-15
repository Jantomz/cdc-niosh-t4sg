// NotionService: Provides interaction with Notion API and embedding functionality
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@notionhq/client';
import {
  BlockObjectResponse,
  PageObjectResponse,
  TextRichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { OpenAI } from 'openai';
import { SupabaseService } from '../supabase/supabase.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Type guard to check if an object is a TextRichTextItemResponse
function isTextRichTextItem(obj: unknown): obj is TextRichTextItemResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    obj.type === 'text' &&
    'plain_text' in obj
  );
}

interface NotionBlock {
  id: string;
  pageId: string;
  content: string;
  type: string;
  path: string;
  url?: string;
  createdTime: string;
  lastEditedTime: string;
}

interface NotionPage {
  id: string;
  title: string;
  url: string;
  parentId?: string;
  createdTime: string;
  lastEditedTime: string;
}

interface NotionBlockWithEmbedding {
  block_id: string;
  page_id: string;
  content: string;
  embedding: number[];
}

interface SearchResult {
  block_id: string;
  page_id: string;
  content: string;
  similarity: number;
}

@Injectable()
export class NotionService {
  private notion: Client;
  private openai: OpenAI;
  private readonly logger = new Logger(NotionService.name);

  constructor(
    private configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    // Initialize Notion client
    const notionToken = this.configService.get<string>('NOTION_TOKEN');

    if (!notionToken) {
      this.logger.error('Notion token is missing from environment variables');
      throw new Error('Notion configuration is incomplete');
    }

    // Creating a validated token variable to help TypeScript understand the type
    const validatedToken: string = notionToken;
    this.notion = new Client({
      auth: validatedToken,
    });

    // Initialize OpenAI client
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiApiKey) {
      const errorMessage =
        'OpenAI API key is missing from environment variables';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
      // Using type-safe error construction with a known string literal
      const safeErrorMessage = 'OpenAI configuration is incomplete';
      throw new Error(safeErrorMessage);
    }

    try {
      // Initialize OpenAI client with proper error handling
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    } catch (error: unknown) {
      // Safe type checking for error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize OpenAI client: ${errorMessage}`);
      // Use a safe string literal first, then append dynamic content
      const baseErrorMessage = 'OpenAI client initialization failed: ';
      throw new Error(baseErrorMessage + errorMessage);
    }
  }

  /**
   * Retrieves a Notion page and all its content
   *
   * @param pageId The ID of the Notion page to retrieve
   * @returns Page metadata and content blocks
   */
  async getNotionPage(pageId: string): Promise<{
    page: NotionPage;
    blocks: NotionBlock[];
  }> {
    try {
      // Get page metadata
      let pageResponse: PageObjectResponse;

      try {
        // This explicit casting approach addresses the TypeScript 'unsafe assignment' error
        // by explicitly handling the typing of the API response
        const response = await this.notion.pages.retrieve({
          page_id: pageId,
        });

        // Ensure we're working with a PageObjectResponse
        if (!('properties' in response)) {
          throw new Error('Retrieved object is not a proper Notion page');
        }

        // Type assertion with type guard validation ensures this is safe
        if ('properties' in response) {
          pageResponse = response;
        } else {
          throw new Error('Retrieved object is not a proper Notion page');
        }
      } catch (apiError: unknown) {
        // Re-throw with a more descriptive message - using type-safe error handling
        const errorMessage =
          apiError instanceof Error ? apiError.message : String(apiError);
        throw new Error(`Failed to retrieve Notion page: ${errorMessage}`);
      }

      // Get page title
      let pageTitle = 'Untitled';

      // Extract title - using type-safe property access
      const properties = pageResponse.properties;

      // Case 1: Title property in standard format
      if (
        'title' in properties &&
        properties.title !== null &&
        'title' in properties.title &&
        Array.isArray(properties.title.title)
      ) {
        const titleItems = properties.title.title;
        pageTitle = titleItems
          .filter(isTextRichTextItem)
          .map((item) => item.plain_text)
          .join('');
      }
      // Case 2: Name property used as title
      else if (
        'Name' in properties &&
        properties.Name !== null &&
        'title' in properties.Name &&
        Array.isArray(properties.Name.title)
      ) {
        const titleItems = properties.Name.title;
        pageTitle = titleItems
          .filter(isTextRichTextItem)
          .map((item) => item.plain_text)
          .join('');
      }

      const page: NotionPage = {
        id: pageResponse.id,
        title: pageTitle,
        url: pageResponse.url,
        createdTime: pageResponse.created_time,
        lastEditedTime: pageResponse.last_edited_time,
      };

      // Get blocks
      const blocks = await this.getAllBlocksFromPage(pageId);

      return { page, blocks };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve Notion page: ${errorMessage}`);
      throw new Error(`Failed to retrieve Notion page: ${errorMessage}`);
    }
  }

  /**
   * Gets all blocks from a Notion page, including nested blocks
   */
  private async getAllBlocksFromPage(pageId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    await this.getBlocksRecursively(pageId, blocks);
    return blocks;
  }

  /**
   * Recursively gets blocks and their children
   */
  private async getBlocksRecursively(
    blockId: string,
    allBlocks: NotionBlock[],
    path = '',
  ): Promise<void> {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.notion.blocks.children.list({
          block_id: blockId,
          start_cursor: cursor,
          page_size: 100,
        });

        // Type cast the response to ensure proper typing
        const typedResponse = response as {
          results: BlockObjectResponse[];
          has_more: boolean;
          next_cursor: string | null;
        };

        const blockResults = typedResponse.results;
        hasMore = typedResponse.has_more;
        cursor = typedResponse.next_cursor || undefined;

        for (const block of blockResults) {
          // Skip unsupported blocks
          if ('type' in block && block.type === 'unsupported') {
            continue;
          }

          // Extract content based on block type
          const content = this.extractBlockContent(block);
          const currentPath = path ? `${path} > ${block.type}` : block.type;

          // Store block info
          const notionBlock: NotionBlock = {
            id: block.id,
            pageId: blockId,
            content,
            type: block.type,
            path: currentPath,
            createdTime: block.created_time,
            lastEditedTime: block.last_edited_time,
          };

          allBlocks.push(notionBlock);

          // Check if block has children
          if ('has_children' in block && block.has_children) {
            await this.getBlocksRecursively(block.id, allBlocks, currentPath);
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Error retrieving blocks for ${blockId}: ${errorMessage}`,
        );
        hasMore = false;
      }
    }
  }

  /**
   * Extracts text content from different block types
   * @param block The block to extract content from
   * @returns The extracted text content
   */
  private extractBlockContent(block: BlockObjectResponse): string {
    try {
      const blockType = block.type;
      // Add type assertion to help TypeScript understand this is a valid property access
      const blockContent = block[blockType] as Record<string, any>;

      if (!blockContent) {
        return '';
      }

      // Handle text-based blocks
      if (this.isTextBlock(blockType)) {
        if (blockContent.rich_text && Array.isArray(blockContent.rich_text)) {
          return blockContent.rich_text
            .map((text: { plain_text?: string }) => text.plain_text || '')
            .join('');
        }
        return ''; // Add fallback return for text blocks
      } else if (blockType === 'code') {
        if (blockContent.rich_text && Array.isArray(blockContent.rich_text)) {
          const codeText = blockContent.rich_text
            .map((text: { plain_text?: string }) => text.plain_text || '')
            .join('');
          const language = (blockContent.language as string) || '';
          return `Code (${language}): ${codeText}`;
        }
        return ''; // Add fallback return for code blocks
      } else if (blockType === 'image') {
        // For images, we can't include the actual image but can mention its existence
        return '[Image]';
      } else if (blockType === 'child_page') {
        // Reference to another page with safe property access
        return `[Subpage: ${block.child_page?.title || 'Untitled'}]`;
      } else if (blockType === 'child_database') {
        // Reference to a database with safe property access
        return `[Database: ${block.child_database?.title || 'Untitled'}]`;
      } else if (blockType === 'table') {
        return '[Table]'; // We'll need to get the table data separately
      }

      return '';
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error extracting block content: ${errorMessage}`);
      return '';
    }
  }

  /**
   * Helper method to check if a block type is text-based
   */
  private isTextBlock(blockType: string): boolean {
    const textBlockTypes = [
      'paragraph',
      'heading_1',
      'heading_2',
      'heading_3',
      'bulleted_list_item',
      'numbered_list_item',
      'toggle',
      'quote',
      'callout',
    ];
    return textBlockTypes.includes(blockType);
  }

  /**
   * Embeds Notion page content by generating embeddings for each block
   *
   * @param pageId The ID of the Notion page to embed
   * @returns Status of the embedding operation
   */
  async embedNotionPage(pageId: string): Promise<{
    success: boolean;
    pageId?: string;
    pageTitle?: string;
    embeddingCount?: number;
    timestamp?: string;
    error?: string;
  }> {
    try {
      // Get the page and its blocks
      const { page, blocks } = await this.getNotionPage(pageId);

      if (blocks.length === 0) {
        return {
          success: false,
          error: 'No content blocks found on the page',
        };
      }

      // Group blocks into meaningful chunks for embedding
      const chunks = await this.groupBlocksIntoChunks(blocks);

      // Generate embeddings for each chunk
      const embeddings: NotionBlockWithEmbedding[] = [];

      for (const chunk of chunks) {
        try {
          const embeddingVector = await this.generateEmbedding(chunk.content);
          embeddings.push({
            block_id: chunk.id,
            page_id: pageId,
            content: chunk.content,
            embedding: embeddingVector,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Error generating embedding for chunk: ${errorMessage}`,
          );
        }
      }

      if (embeddings.length === 0) {
        return {
          success: false,
          error: 'Embedding generation failed for all chunks',
        };
      }

      // Upload embeddings to Supabase
      const uploadResponse =
        await this.supabaseService.uploadNotionEmbeddings(embeddings);

      if (!uploadResponse.success) {
        return {
          success: false,
          error: 'Failed to store embeddings in Supabase',
        };
      }

      return {
        success: true,
        pageId,
        pageTitle: page.title,
        embeddingCount: embeddings.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error embedding Notion page: ${errorMessage}`);
      return {
        success: false,
        error: `Failed to embed Notion page: ${errorMessage}`,
      };
    }
  }

  /**
   * Groups blocks into meaningful chunks for embedding
   */
  private async groupBlocksIntoChunks(
    blocks: NotionBlock[],
  ): Promise<NotionBlock[]> {
    if (blocks.length <= 1) {
      return blocks;
    }

    // For more sophisticated chunking:
    // 1. Could group by hierarchy (headings and their content)
    // 2. Could merge small blocks together
    // 3. Could split very large blocks

    // For now, using a simple approach with text splitting for larger blocks
    const chunks: NotionBlock[] = [];
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 100,
    });

    // Use a regular for loop to handle async operations properly
    for (const block of blocks) {
      // If the block content is large, split it
      if (block.content && block.content.length > 600) {
        const splitTexts = await splitter.splitText(block.content);
        for (let index = 0; index < splitTexts.length; index++) {
          chunks.push({
            ...block,
            id: `${block.id}-chunk-${index}`,
            content: splitTexts[index],
          });
        }
      } else {
        chunks.push(block);
      }
    }

    return chunks;
  }

  /**
   * Generate embedding vectors for text content
   * @param input The text to generate embeddings for
   * @returns Array of embedding values
   */
  private async generateEmbedding(input: string): Promise<number[]> {
    try {
      // OpenAI API is properly typed through the SDK
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
        encoding_format: 'float',
      });

      // Validate response structure
      if (!embeddingResponse || !embeddingResponse.data) {
        throw new Error(
          'Failed to generate embedding: Invalid response structure',
        );
      }

      if (embeddingResponse.data.length === 0) {
        throw new Error('Failed to generate embedding: Empty response data');
      }

      // Store the first data item in a variable for type safety
      const firstData = embeddingResponse.data[0];

      // The embedding property should always exist on a successful response
      if (!firstData.embedding) {
        throw new Error('Failed to generate embedding: Missing embedding data');
      }

      return firstData.embedding;
    } catch (error: unknown) {
      // Type-safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate embedding: ${errorMessage}`);
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Query against embedded Notion pages
   *
   * @param query Search query
   * @param limit Maximum number of results
   * @returns Relevant Notion blocks with similarity scores
   */
  async queryNotionPages(
    query: string,
    limit = 5,
  ): Promise<{
    results: Array<{
      blockId: string;
      pageId: string;
      content: string;
      similarityScore: number;
    }>;
    query: string;
    processedAt: string;
  }> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Perform vector similarity search in Supabase
      const searchResults = await this.supabaseService.searchNotionEmbeddings(
        queryEmbedding,
        limit,
      );

      if (!searchResults || searchResults.length === 0) {
        return {
          results: [],
          query,
          processedAt: new Date().toISOString(),
        };
      }

      // Format results
      const formattedResults = searchResults.map((result: SearchResult) => ({
        blockId: result.block_id,
        pageId: result.page_id,
        content: result.content,
        similarityScore: result.similarity,
      }));

      return {
        results: formattedResults,
        query,
        processedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error querying Notion pages: ${errorMessage}`);
      throw new Error(`Failed to query Notion pages: ${errorMessage}`);
    }
  }

  /**
   * Retrieves a list of available pages from the user's Notion workspace
   *
   * @returns Array of available pages with basic metadata
   */
  async listAvailablePages(): Promise<
    Array<{
      id: string;
      title: string;
      url: string;
      createdTime: string;
      lastEditedTime: string;
    }>
  > {
    try {
      const response = await this.notion.search({
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      });

      // This type guard ensures we only work with valid PageObjectResponses
      const pageResults = response.results.filter(
        (page): page is PageObjectResponse => {
          return page.object === 'page' && 'properties' in page;
        },
      );

      const pages = pageResults.map((page) => {
        let title = 'Untitled';

        // Extract title based on the page properties structure
        const properties = page.properties;

        // Case 1: Title property in standard format
        if (
          'title' in properties &&
          properties.title !== null &&
          'title' in properties.title &&
          Array.isArray(properties.title.title)
        ) {
          const titleItems = properties.title.title;
          title = titleItems
            .filter(isTextRichTextItem)
            .map((item) => item.plain_text)
            .join('');
        }
        // Case 2: Name property used as title
        else if (
          'Name' in properties &&
          properties.Name !== null &&
          'title' in properties.Name &&
          Array.isArray(properties.Name.title)
        ) {
          const titleItems = properties.Name.title;
          title = titleItems
            .filter(isTextRichTextItem)
            .map((item) => item.plain_text)
            .join('');
        }

        return {
          id: page.id,
          title,
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
        };
      });

      return pages;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error listing Notion pages: ${errorMessage}`);
      throw new Error(`Failed to list Notion pages: ${errorMessage}`);
    }
  }
}
