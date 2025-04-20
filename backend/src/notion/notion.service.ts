/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

@Injectable()
export class NotionService {
  private readonly notion: Client;
  private readonly supabase;

  constructor() {
    const notionApiKey = process.env.NOTION_KEY;
    if (!notionApiKey) {
      throw new Error('NOTION_KEY is not defined in the environment variables');
    }
    this.notion = new Client({ auth: notionApiKey });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not defined');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ========== HUGGING FACE EMBEDDINGS ==========
  private async generateEmbedding(text: string): Promise<number[]> {
    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text },
        {
          headers: { Authorization: `Bearer ${HF_API_KEY}` },
        },
      );

      if (response.status !== 200) {
        throw new Error(`HF API error: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(
        `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ========== NOTION CONTENT PROCESSING ==========
  private extractTextFromNotionResponse(response) {
    const results = response.results || [];
    const textBlocks: Array<{
      type: string;
      text: string;
      urls?: string[];
      language?: string;
    }> = [];

    results.forEach((block) => {
      const blockType = block.type;
      const blockContent = block[blockType];

      if (!blockContent) return;

      if (blockContent.rich_text) {
        const text = blockContent.rich_text
          .map((rt) => rt.text?.content || '')
          .join('')
          .trim();

        if (text) {
          textBlocks.push({
            type: blockType as string,
            text: text,
            urls: blockContent.rich_text
              .map(
                (rt: { text?: { link?: { url?: string } } }) =>
                  rt.text?.link?.url,
              )
              .filter((url: string | undefined): url is string => !!url),
          });
        }
      } else if (blockType === 'code') {
        const code = blockContent.rich_text
          .map((rt) => rt.text?.content || '')
          .join('')
          .trim();

        if (code) {
          textBlocks.push({
            type: 'code',
            text: code,
            language: blockContent.language,
          });
        }
      } else if (blockType === 'image' && blockContent.caption) {
        const caption = blockContent.caption
          .map((cap) => cap.text?.content || '')
          .join('')
          .trim();

        if (caption) {
          textBlocks.push({
            type: 'image_caption',
            text: caption,
          });
        }
      }
    });

    return textBlocks;
  }
  private chunkNotionContent(
    notionResponse,
    chunkSize = 500,
    overlapSize = 100,
  ) {
    const blocks = this.extractTextFromNotionResponse(notionResponse);
    const chunks: Array<{
      text: string;
      type: string;
      urls: string[];
    }> = [];
    let currentChunk: string[] = [];

    for (const block of blocks) {
      const blockText = block.text;

      // Split block text into sentences or new lines
      const sentences = blockText.split(/(?<=\.)\s|\n/);

      for (const sentence of sentences) {
        const sentenceLength = sentence.trim().length;

        if (
          currentChunk.join(' ').length + sentenceLength > chunkSize &&
          currentChunk.length > 0
        ) {
          // Push the current chunk
          chunks.push({
            text: currentChunk.join(' ').trim(),
            type: 'composite',
            urls: [],
          });

          // Create overlap with full sentences
          const overlapSentences = currentChunk.slice(
            -Math.floor((overlapSize / chunkSize) * currentChunk.length),
          );
          currentChunk = [...overlapSentences];
        }

        currentChunk.push(sentence.trim());
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join(' ').trim(),
        type: 'composite',
        urls: [],
      });
    }

    return chunks;
  }

  // ========== DATABASE OPERATIONS ==========
  private async storeEmbedding(
    chunk: {
      text: string;
      type: string;
      urls?: string[];
    },
    pageId: string,
  ) {
    const embedding = await this.generateEmbedding(chunk.text);

    const { error } = await this.supabase.from('documents').insert({
      content: chunk.text,
      metadata: {
        type: chunk.type,
        source: 'notion',
        page_id: pageId,
        urls: chunk.urls || [],
      },
      embedding: embedding,
    });

    if (error) throw error;
  }

  public async queryDocuments(query: string, threshold = 0.2, count = 5) {
    const queryEmbedding = await this.generateEmbedding(query);

    console.log('Query embedding:', queryEmbedding);

    const { data, error } = await this.supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: count,
    });

    if (error) throw error;
    return data;
  }

  // ========== MAIN ENTRY POINT ==========
  public async processNotionPage(pageId: string) {
    try {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 50,
      });

      if (!response) {
        throw new Error('No response from Notion API');
      }

      const textChunks = this.chunkNotionContent(response);

      // Process chunks in parallel with rate limiting
      const BATCH_SIZE = 3; // To avoid hitting HF rate limits
      for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
        const batch = textChunks.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((chunk) => this.storeEmbedding(chunk, pageId)),
        );
      }

      return { success: true, chunksProcessed: textChunks.length };
    } catch (error) {
      console.error('Error processing Notion page:', error);
      throw error;
    }
  }
}
