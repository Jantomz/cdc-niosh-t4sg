import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios, { AxiosResponse } from 'axios';

/**
 * Interface for image analysis result
 */
interface ImageAnalysisResult {
  id: string;
  source_page_id: string;
  image_url: string;
  content_description: string;
  embedding: number[];
  created_at: string;
}

/**
 * Interface for a processed page with image references
 */
interface ProcessedPage {
  page_id: string;
  original_content: string;
  processed_content: string;
  image_references: {
    image_id: string;
    marker: string;
    position: number;
  }[];
}

@Injectable()
export class VisionPipelineService {
  private readonly logger = new Logger(VisionPipelineService.name);
  // The ID marker prefix/suffix used to mark image locations in text
  private readonly IMAGE_MARKER_PREFIX = '[[IMG:';
  private readonly IMAGE_MARKER_SUFFIX = ']]';

  // Open source vision model configuration
  private readonly VISION_MODEL = 'llava'; // or another open source vision model

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Process a page with images and prepare it for RAG
   *
   * This method will:
   * 1. Extract image URLs from the Notion page
   * 2. Download and analyze each image
   * 3. Replace image references with text descriptions
   * 4. Store image data and embeddings in Supabase
   * 5. Return the processed text with image markers
   *
   * @param pageId The Notion page ID
   * @param pageContent The raw content of the page (HTML or Markdown)
   * @param imageUrls Array of image URLs found in the page
   * @returns Processed page with image descriptions integrated
   */
  async processPageWithImages(
    pageId: string,
    pageContent: string,
    imageUrls: string[],
  ): Promise<ProcessedPage> {
    this.logger.log(
      `Processing page ${pageId} with ${imageUrls.length} images`,
    );

    try {
      // Track the images and their positions
      const imageReferences: {
        image_id: string;
        marker: string;
        position: number;
      }[] = [];
      let processedContent = pageContent;

      // Process each image URL
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        try {
          // Generate a unique ID for this image
          const imageId = `img_${pageId}_${i}_${Date.now()}`;

          // Analyze the image and get description
          const analysisResult = await this.analyzeImage(
            imageId,
            pageId,
            imageUrl,
          );

          // Create marker for the image placement
          const imageMarker = `${this.IMAGE_MARKER_PREFIX}${imageId}${this.IMAGE_MARKER_SUFFIX}`;

          // TODO: Find the actual position of the image in the content
          // This requires parsing the HTML/Markdown and finding image tags
          // For now, we'll add markers at the end of the content with position -1
          const position = -1;

          // Replace the image with the marker and description
          // In a real implementation, you'd find the actual image tag and replace it
          // For this scaffold, we'll append to the content
          processedContent += `\n\n${imageMarker}\n${analysisResult.content_description}\n`;

          // Track the image reference for later use
          imageReferences.push({
            image_id: imageId,
            marker: imageMarker,
            position,
          });

          // Store the image data and embedding in Supabase
          await this.storeImageData(analysisResult);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Failed to process image ${imageUrl}: ${errorMessage}`,
            errorStack,
          );
        }
      }

      return {
        page_id: pageId,
        original_content: pageContent,
        processed_content: processedContent,
        image_references: imageReferences,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process page ${pageId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Download and analyze an image using a vision model
   *
   * @param imageId Unique ID for the image
   * @param pageId The source page ID
   * @param imageUrl URL of the image to analyze
   * @returns Analysis result with description and embedding
   */
  private async analyzeImage(
    imageId: string,
    pageId: string,
    imageUrl: string,
  ): Promise<ImageAnalysisResult> {
    this.logger.log(`Analyzing image: ${imageUrl}`);

    try {
      // Download the image to a temporary file
      const imagePath = await this.downloadImage(imageUrl);

      // TODO: Call the vision model to analyze the image
      // This is where you'd integrate with an open source vision model
      // like LLAVA, LLaVA-NeXT, CogVLM, or other similar models

      // For scaffold purposes, we'll use a placeholder
      const contentDescription = await this.generateImageDescription(imagePath);

      // TODO: Generate an embedding for the description
      // This would typically use a text embedding model
      // For scaffold purposes, we'll use a placeholder
      const embedding = await this.generateEmbedding(contentDescription);

      // Clean up the temporary file
      fs.unlinkSync(imagePath);

      return {
        id: imageId,
        source_page_id: pageId,
        image_url: imageUrl,
        content_description: contentDescription,
        embedding,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing image ${imageUrl}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Download an image from URL to a local temporary file
   *
   * @param imageUrl URL of the image to download
   * @returns Path to the downloaded temporary file
   */
  private async downloadImage(imageUrl: string): Promise<string> {
    try {
      const response: AxiosResponse<ReadableStream> = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
      });

      const tempDir = os.tmpdir();
      const imagePath = path.join(tempDir, `image_${Date.now()}.jpg`);

      const writer = fs.createWriteStream(imagePath);

      return new Promise((resolve, reject) => {
        (response.data as unknown as NodeJS.ReadableStream).pipe(writer);

        writer.on('finish', () => {
          resolve(imagePath);
        });

        writer.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to download image ${imageUrl}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Generate a text description of an image using an open source vision model
   *
   * @param imagePath Path to the image file
   * @returns Text description of the image content
   */
  private generateImageDescription(imagePath: string): Promise<string> {
    try {
      // TODO: Implement integration with an open-source vision model
      // Options include:
      // - LLaVA: https://github.com/haotian-liu/LLaVA
      // - CogVLM: https://github.com/THUDM/CogVLM
      // - MiniGPT-4: https://github.com/Vision-CAIR/MiniGPT-4
      // - OpenFlamingo: https://github.com/mlfoundations/open_flamingo

      // For scaffold purposes, we'll use a placeholder
      return Promise.resolve(
        `This is a placeholder description for the image at ${imagePath}. In the actual implementation, this would be generated by an open-source vision model like LLaVA, CogVLM, MiniGPT-4, or OpenFlamingo.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate image description: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Generate an embedding for the image description
   *
   * @param text Text to generate embedding for
   * @returns Vector embedding of the text
   */
  private generateEmbedding(text: string): Promise<number[]> {
    try {
      // TODO: Implement embedding generation
      // This could use an open-source embedding model like:
      // - all-MiniLM-L6-v2 (via sentence-transformers)
      // - BGE embeddings
      // - Universal Sentence Encoder

      // For scaffold purposes, we'll use a placeholder
      this.logger.log(`Generating embedding for text: ${text}`);
      return Promise.resolve(
        Array(128)
          .fill(0)
          .map(() => Math.random()),
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Store image analysis data in Supabase
   *
   * @param imageData The image analysis data to store
   */
  private async storeImageData(imageData: ImageAnalysisResult): Promise<void> {
    try {
      // Example Supabase upload code (to be implemented)
      const { error } = await this.supabaseService.supabase
        .from('notion_images')
        .insert([
          {
            id: imageData.id,
            source_page_id: imageData.source_page_id,
            image_url: imageData.image_url,
            content_description: imageData.content_description,
            created_at: imageData.created_at,
          },
        ]);
      if (error) throw new Error(`Supabase insert error: ${error.message}`);

      // Store the embedding separately
      const { error: embeddingError } = await this.supabaseService.supabase
        .from('notion_image_embeddings')
        .insert([
          {
            image_id: imageData.id,
            embedding: imageData.embedding,
          },
        ]);
      if (embeddingError)
        throw new Error(`Embedding insert error: ${embeddingError.message}`);
    } catch (error) {
      this.logger.error(
        `Failed to store image data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Retrieve and reconstruct original content with images
   *
   * @param processedContent Processed content with image markers
   * @returns Original content with image URLs restored
   */
  async reconstructContentWithImages(
    processedContent: string,
  ): Promise<string> {
    try {
      // Find all image markers in the content
      const markerRegex = new RegExp(
        `${this.IMAGE_MARKER_PREFIX}(.+?)${this.IMAGE_MARKER_SUFFIX}`,
        'g',
      );

      // Replace each marker with the original image or a link to it
      let restoredContent = processedContent;
      let match: RegExpExecArray | null;

      while ((match = markerRegex.exec(processedContent)) !== null) {
        const fullMarker = match !== null ? match[0] : '';
        const imageId = match[1];

        try {
          // Retrieve the image data from Supabase
          // TODO: Implement the actual retrieval
          // For scaffold purposes, we'll use a placeholder
          const imageUrl = await this.getImageUrlById(imageId);

          // Replace the marker with an image tag
          restoredContent = restoredContent.replace(
            fullMarker,
            `<img src="${imageUrl}" alt="Image from Notion" />`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to retrieve image ${imageId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            error instanceof Error ? error.stack : undefined,
          );
          // Keep the marker in place if we can't retrieve the image
        }
      }

      return restoredContent;
    } catch (error) {
      this.logger.error(
        `Failed to reconstruct content: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      return processedContent; // Return the processed content unchanged
    }
  }

  /**
   * Get the URL for an image by its ID
   *
   * @param imageId The ID of the image to retrieve
   * @returns The URL of the image
   */
  private getImageUrlById(imageId: string): Promise<string> {
    try {
      // TODO: Implement actual retrieval from Supabase
      // For scaffold purposes, we'll use a placeholder
      return Promise.resolve(`https://placeholder.com/image/${imageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to get image URL: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Search for images by content description similarity
   *
   * @param query The search query
   * @param limit Maximum number of results to return
   * @returns Image matches with similarity scores
   */
  searchImagesByContent(query: string, limit: number = 5): Promise<any[]> {
    try {
      // TODO: Implement vector search for images
      // 1. Generate embedding for the query
      // 2. Perform vector similarity search against stored embeddings
      // 3. Return matching images with scores

      console.log(limit);

      // For scaffold purposes, we'll use a placeholder
      return Promise.resolve([
        {
          id: 'img_example_1',
          image_url: 'https://placeholder.com/image/1',
          content_description: 'Example image description 1',
          similarity_score: 0.92,
        },
        {
          id: 'img_example_2',
          image_url: 'https://placeholder.com/image/2',
          content_description: 'Example image description 2',
          similarity_score: 0.85,
        },
      ]);
    } catch (error) {
      this.logger.error(
        `Failed to search images by content: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      return Promise.resolve([]);
    }
  }
}
