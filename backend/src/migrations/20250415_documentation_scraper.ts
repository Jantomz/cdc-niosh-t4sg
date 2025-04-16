import { SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run the migration to set up documentation scraper tables
 * @param supabase The Supabase client
 */
export async function runDocumentationScraperMigration(supabase: SupabaseClient): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Running documentation scraper migration...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../documentation-scraper/documentation-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      console.error('Migration error:', error);
      return { 
        success: false, 
        message: `Failed to run documentation scraper migration: ${error.message}` 
      };
    }
    
    // Insert initial documentation sources
    const initialSources = [
      {
        name: 'React',
        url: 'https://react.dev/reference/react',
        keywords: ['react', 'component', 'hooks', 'jsx', 'state', 'props'],
      },
      {
        name: 'React Native',
        url: 'https://reactnative.dev/docs/components-and-apis',
        keywords: ['react native', 'mobile', 'components', 'apis'],
      },
      {
        name: 'Supabase Auth',
        url: 'https://supabase.com/docs/reference/javascript/auth-signin',
        keywords: ['supabase', 'authentication', 'auth', 'signin', 'signup', 'login'],
      },
      {
        name: 'Supabase Database',
        url: 'https://supabase.com/docs/reference/javascript/select',
        keywords: ['supabase', 'database', 'query', 'select', 'insert', 'update', 'delete'],
      },
      {
        name: 'Next.js',
        url: 'https://nextjs.org/docs',
        keywords: ['nextjs', 'next.js', 'ssr', 'static site', 'pages', 'api routes'],
      },
    ];
    
    const { error: sourcesError } = await supabase
      .from('documentation_sources')
      .upsert(initialSources, { onConflict: 'url' });
    
    if (sourcesError) {
      console.error('Error inserting initial documentation sources:', sourcesError);
      return { 
        success: true, 
        message: 'Documentation scraper migration completed with schema, but failed to insert initial sources.' 
      };
    }
    
    return { 
      success: true, 
      message: 'Documentation scraper migration completed successfully' 
    };
  } catch (error) {
    console.error('Unexpected error in documentation scraper migration:', error);
    return { 
      success: false, 
      message: `Unexpected error in documentation scraper migration: ${error.message}` 
    };
  }
}
