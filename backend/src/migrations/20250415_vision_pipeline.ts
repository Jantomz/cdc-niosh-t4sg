import { SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run the migration to set up vision pipeline tables
 * @param supabase The Supabase client
 */
export async function runVisionPipelineMigration(supabase: SupabaseClient): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Running vision pipeline migration...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../vision-pipeline/vision-pipeline-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      console.error('Migration error:', error);
      return { 
        success: false, 
        message: `Failed to run vision pipeline migration: ${error.message}` 
      };
    }
    
    console.log('Vision pipeline migration completed successfully');
    return { 
      success: true, 
      message: 'Vision pipeline migration completed successfully' 
    };
  } catch (error) {
    console.error('Unexpected error in vision pipeline migration:', error);
    return { 
      success: false, 
      message: `Unexpected error in vision pipeline migration: ${error.message}` 
    };
  }
}
