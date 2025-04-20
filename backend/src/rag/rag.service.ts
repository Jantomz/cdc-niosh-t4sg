/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LlamaService } from '../llama/llama.service';
import { VisionPipelineService } from '../vision-pipeline/vision-pipeline.service';

import { NotionService } from '../notion/notion.service'; // Adjust the path as needed

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly llamaService: LlamaService,
    private readonly visionPipelineService: VisionPipelineService,
    private readonly notionService: NotionService,
  ) {}

  /**
   * Query the RAG system with user input
   *
   * @param query The user's query
   * @param conversationId Optional ID for tracking conversation context
   * @param conversationContext Optional previous messages for context
   * @returns RAG response with answer and source references
   */
  async queryRag(
    query: string,
    conversationId?: string,
    conversationContext?: any[],
  ) {
    this.logger.log(`Processing RAG query: ${query}`);
    console.log(
      `Processing RAG query: ${query} with conversationId: ${conversationId}`,
    );
    console.log(`Conversation context: ${JSON.stringify(conversationContext)}`);

    try {
      // TODO: Implement RAG query pipeline
      // 1. Extract keywords from query
      // 2. Retrieve relevant documents from Supabase (could be from different sources)
      // 3. Combine documents with query into a prompt
      // 4. Generate response using LLM
      // 5. Track source references for context

      // Generate tracking ID for this response
      const responseId = `resp_${Date.now()}`;

      // Step 1: Extract keywords from query
      const keywords = this.extractKeywords(query);
      this.logger.log(`Extracted keywords: ${keywords.join(', ')}`);

      // Step 2: Retrieve relevant documents
      // TODO: Implement retrieval from Supabase
      // This should include:
      // - Text content from Notion pages
      // - Code blocks
      // - Image descriptions (from vision pipeline)
      // - Chart descriptions

      // For scaffolding purposes, we'll use placeholder data
      const retrievedDocuments = await this.retrieveRelevantDocuments(keywords);

      // Step 3: Build prompt with context
      const prompt = this.buildPromptWithContext(
        query,
        retrievedDocuments,
        conversationContext,
      );

      console.log(`Prompt for LLM: ${prompt}`);

      // Step 4: Generate response using LLM
      // TODO: Implement actual LLM call
      const response = await this.llamaService.getCompletion(prompt);

      console.log(`Generated response: ${JSON.stringify(response, null, 2)}`);

      // Step 5: Track source references
      const sourceReferences = this.prepareSourceReferences(
        retrievedDocuments,
        responseId,
      );

      // TODO: Store the query, response, and source references in Supabase for history

      console.log(sourceReferences);

      return {
        response: response.text,
        sourceReferences,
        query,
        responseId,
        processedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error processing RAG query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Extract keywords from a query
   */
  private extractKeywords(query: string): string[] {
    // TODO: Implement keyword extraction
    // This could use NLP techniques or simply filter common words

    // For scaffolding purposes, we'll just split and filter
    const stopWords = [
      'the',
      'a',
      'an',
      'in',
      'on',
      'at',
      'to',
      'for',
      'with',
      'by',
    ];
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Retrieve relevant documents for the given keywords
   */
  private retrieveRelevantDocuments(keywords: string[]): Promise<any[]> {
    // TODO: Implement document retrieval from Supabase
    // This should include vector search for semantic similarity

    console.log(`Retrieving documents for keywords: ${keywords.join(', ')}`);

    return this.notionService.queryDocuments(keywords.join(' '), 0.2, 5);
    // For scaffolding purposes, we'll return placeholder data
    return Promise.resolve([
      {
        id: 'doc1',
        type: 'text',
        content:
          'This is example text content from a Notion page about React components and state management.',
        title: 'React Components',
        source: 'notion',
        pageId: 'page1',
        pageTitle: 'React State Management',
        pagePath: '/Engineering/Frontend/React',
        relevanceScore: 0.92,
      },
      {
        id: 'doc2',
        type: 'code',
        content:
          'function ExampleComponent() {\n  const [state, setState] = useState(null);\n  return <div>{state}</div>;\n}',
        language: 'javascript',
        title: 'React useState Example',
        source: 'notion',
        pageId: 'page1',
        pageTitle: 'React State Management',
        pagePath: '/Engineering/Frontend/React',
        relevanceScore: 0.87,
      },
      {
        id: 'doc3',
        type: 'image',
        imageUrl: 'https://placekitten.com/800/400', // Placeholder image
        content:
          'Architecture diagram showing data flow in a React application with Redux.',
        title: 'React Redux Diagram',
        source: 'notion',
        pageId: 'page2',
        pageTitle: 'Redux Architecture',
        pagePath: '/Engineering/Frontend/Redux',
        relevanceScore: 0.78,
      },
    ]);
  }

  /**
   * Build a prompt with context for the LLM
   */
  private buildPromptWithContext(
    query: string,
    documents: {
      id: number;
      content: string;
      metadata: {
        type: string;
        urls: string[];
        source: string;
        page_id: string;
      };
      similarity: number;
    }[],
    conversationContext?: any[],
  ): string {
    let contextText = '';

    // Add document context
    if (documents.length > 0) {
      contextText += 'Relevant information from our sources:\n\n';

      documents.forEach((doc, index) => {
        contextText += `[${index + 1}] Source: ${doc.metadata.source} (Page ID: ${doc.metadata.page_id}):\n`;
        contextText += `${doc.content}\n\n`;
      });
    }

    // Add conversation history if available
    if (conversationContext && conversationContext.length > 0) {
      contextText += '\nPrevious conversation:\n';

      conversationContext.forEach((msg) => {
        const role =
          (msg as { role: string }).role === 'user' ? 'User' : 'Assistant';
        contextText += `${role}: ${(msg as { content: string }).content}\n`;
      });

      contextText += '\n';
    }

    // Construct the full prompt
    return `
You are an Engineering Wiki Assistant that helps answer questions based on the provided context.
Your goal is to provide accurate, helpful responses based only on the information given.
If the context doesn't contain relevant information, acknowledge that you don't have enough information.

${contextText}

User question: ${query}

Please provide a helpful response based on the above context. Include references to the source numbers [1], [2], etc. when appropriate.
    `.trim();
  }

  /**
   * Prepare source references for the frontend
   */
  private prepareSourceReferences(
    documents: {
      id: number;
      content: string;
      metadata: {
        type: string;
        urls: string[];
        source: string;
        page_id: string;
      };
      similarity: number;
    }[],
    responseId: string,
  ): any[] {
    // Convert the documents to the format expected by the frontend
    return documents.map((doc, index) => {
      // Generate a reference ID that includes the response ID for tracking
      const referenceId = `${responseId}_src${index}`;

      return {
        id: referenceId,
        title: `[${index + 1}] Document ${doc.id}`,
        content: doc.content,
        type: doc.metadata.type,
        confidence: doc.similarity,
        pageTitle: `Page ID: ${doc.metadata.page_id}`,
        pagePath: '', // Page path is not provided in the interface
        imageUrl:
          doc.metadata.type === 'image' ? doc.metadata.urls[0] : undefined,
        referenceId,
        url:
          doc.metadata.source === 'notion'
            ? `https://notion.so/${doc.metadata.page_id}`
            : undefined,
        position: {
          blockId: undefined, // Block ID is not provided in the interface
        },
      };
    });
  }

  // TODO: Fix these below
  /**
   * Get a specific source reference by ID
   */
  getSourceReference(referenceId: string) {
    this.logger.log(`Fetching source reference: ${referenceId}`);

    try {
      // TODO: Implement retrieval from Supabase
      // The referenceId should contain enough information to locate the source

      // For scaffolding purposes, we'll return a placeholder
      // In a real implementation, you would query Supabase for the reference

      if (!referenceId.includes('_src')) {
        throw new NotFoundException(
          `Source reference not found: ${referenceId}`,
        );
      }

      const [responseId, sourceIndex] = referenceId.split('_src');
      const index = parseInt(sourceIndex, 10);

      // Placeholder data
      const sources = [
        {
          id: `${responseId}_src0`,
          title: 'React Components',
          content:
            'This is example text content from a Notion page about React components and state management.',
          type: 'text',
          confidence: 0.92,
          pageTitle: 'React State Management',
          pagePath: '/Engineering/Frontend/React',
          url: 'https://notion.so/page1',
        },
        {
          id: `${responseId}_src1`,
          title: 'React useState Example',
          content:
            'function ExampleComponent() {\n  const [state, setState] = useState(null);\n  return <div>{state}</div>;\n}',
          type: 'code',
          language: 'javascript',
          confidence: 0.87,
          pageTitle: 'React State Management',
          pagePath: '/Engineering/Frontend/React',
          url: 'https://notion.so/page1',
        },
        {
          id: `${responseId}_src2`,
          title: 'React Redux Diagram',
          imageUrl: 'https://placekitten.com/800/400',
          content:
            'Architecture diagram showing data flow in a React application with Redux.',
          type: 'image',
          confidence: 0.78,
          pageTitle: 'Redux Architecture',
          pagePath: '/Engineering/Frontend/Redux',
          url: 'https://notion.so/page2',
        },
      ];

      if (index >= 0 && index < sources.length) {
        return sources[index];
      }

      throw new NotFoundException(`Source reference not found: ${referenceId}`);
    } catch (error) {
      this.logger.error(
        `Error fetching source reference: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Get all source references for a response
   */
  getSourceReferencesForResponse(responseId: string) {
    this.logger.log(`Fetching sources for response: ${responseId}`);

    try {
      // TODO: Implement retrieval from Supabase
      // The responseId should be used to find all associated source references

      // For scaffolding purposes, we'll return placeholder data
      return [
        {
          id: `${responseId}_src0`,
          title: 'React Components',
          content:
            'This is example text content from a Notion page about React components and state management.',
          type: 'text',
          confidence: 0.92,
          pageTitle: 'React State Management',
          pagePath: '/Engineering/Frontend/React',
          url: 'https://notion.so/page1',
        },
        {
          id: `${responseId}_src1`,
          title: 'React useState Example',
          content:
            'function ExampleComponent() {\n  const [state, setState] = useState(null);\n  return <div>{state}</div>;\n}',
          type: 'code',
          language: 'javascript',
          confidence: 0.87,
          pageTitle: 'React State Management',
          pagePath: '/Engineering/Frontend/React',
          url: 'https://notion.so/page1',
        },
        {
          id: `${responseId}_src2`,
          title: 'React Redux Diagram',
          imageUrl: 'https://placekitten.com/800/400',
          content:
            'Architecture diagram showing data flow in a React application with Redux.',
          type: 'image',
          confidence: 0.78,
          pageTitle: 'Redux Architecture',
          pagePath: '/Engineering/Frontend/Redux',
          url: 'https://notion.so/page2',
        },
      ];
    } catch (error) {
      this.logger.error(
        `Error fetching sources for response: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
