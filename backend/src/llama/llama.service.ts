/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class LlamaService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not defined in the environment variables.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  /**
   * DELIVERABLE 3: LLAMA Completion Implementation
   *
   * This method should:
   * 1. Take a text prompt
   * 2. Call the LLAMA open-source model for text completion
   * 3. Process the response and handle any errors
   * 4. Return the completion with usage statistics
   * @param prompt The text prompt to complete
   * @param options Optional parameters like max tokens and temperature
   * @returns The completion response with text and usage stats
   */
  async getCompletion(
    prompt: string,
    options: { maxTokens?: number; temperature?: number } = {},
  ) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.9,
      },
    });

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return {
        text,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens:
            result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      throw new Error(
        `Gemini error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
