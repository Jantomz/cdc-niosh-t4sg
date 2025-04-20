import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { LlamaModule } from '../llama/llama.module';
import { VisionPipelineModule } from '../vision-pipeline/vision-pipeline.module';
import { NotionService } from 'src/notion/notion.service';

@Module({
  imports: [SupabaseModule, LlamaModule, VisionPipelineModule],
  controllers: [RagController],
  providers: [RagService, NotionService],
  exports: [RagService],
})
export class RagModule {}
