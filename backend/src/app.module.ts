import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { LlamaModule } from './llama/llama.module';
import { PdfModule } from './pdf/pdf.module';
import { DocsModule } from './docs/docs.module';
import { DocumentationScraperModule } from './documentation-scraper/documentation-scraper.module';

@Module({
  imports: [SupabaseModule, LlamaModule, PdfModule, DocsModule, DocumentationScraperModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
