import { Module } from '@nestjs/common';
import { VisionPipelineService } from './vision-pipeline.service';
import { VisionPipelineController } from './vision-pipeline.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [VisionPipelineController],
  providers: [VisionPipelineService],
  exports: [VisionPipelineService],
})
export class VisionPipelineModule {}
