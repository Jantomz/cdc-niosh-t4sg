import { Module } from '@nestjs/common';
import { LlamaController } from './llama.controller';
import { LlamaService } from './llama.service';

@Module({
  controllers: [LlamaController],
  providers: [LlamaService],
  exports: [LlamaService],
})
export class LlamaModule {}
