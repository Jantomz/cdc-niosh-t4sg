import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { LlamaModule } from './llama/llama.module';
import { DocsModule } from './docs/docs.module';
import { VisionPipelineModule } from './vision-pipeline/vision-pipeline.module';
import { ConfigModule } from '@nestjs/config';
import { NotionModule } from './notion/notion.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes config available everywhere
    }),
    SupabaseModule,
    RagModule,
    LlamaModule,
    DocsModule,
    VisionPipelineModule,
    NotionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
