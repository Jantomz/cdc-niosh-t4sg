import { Controller, Post, Body } from '@nestjs/common';
import { LlamaService } from './llama.service';

@Controller('llama')
export class LlamaController {
  constructor(private readonly llamaService: LlamaService) {}

  // TODO: In the future, we will secure these endpoints and pre-process any input

  /**
   * DELIVERABLE 3: LLAMA Completion Endpoint
   *
   * POST /llama/completion
   *
   * Request:
   * {
   *   "prompt": "The text prompt to complete",
   *   "maxTokens": 100,  // Optional: maximum tokens to generate
   *   "temperature": 0.7 // Optional: randomness parameter
   * }
   *
   * Response:
   * {
   *   "text": "The generated completion text",
   *   "usage": {
   *     "promptTokens": 10,
   *     "completionTokens": 50,
   *     "totalTokens": 60
   *   }
   * }
   */
  @Post('completion')
  getCompletion(
    @Body()
    completionDto: {
      prompt: string;
      maxTokens?: number;
      temperature?: number;
    },
  ) {
    return this.llamaService.getCompletion(completionDto.prompt);
  }
}
