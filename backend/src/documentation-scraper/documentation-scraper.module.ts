import { Module } from '@nestjs/common';
import { DocumentationScraperService } from './documentation-scraper.service';
import { DocumentationScraperController } from './documentation-scraper.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DocumentationScraperController],
  providers: [DocumentationScraperService],
  exports: [DocumentationScraperService],
})
export class DocumentationScraperModule {}
