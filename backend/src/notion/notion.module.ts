import { Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}
