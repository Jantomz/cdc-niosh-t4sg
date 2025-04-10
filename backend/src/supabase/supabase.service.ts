import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config(); 

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
}

const publicanonkey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient('https://pqqdhszlomhscdzrwxuw.supabase.co', publicanonkey)

export async function uploadPDF(fileBuffer: Buffer, metadata: Record <string, any>): Promise<{ filePath: string; error?: any }> {
    const fileId = uuidv4();
    const filePath = `pdfs/${fileId}.pdf`;

    const { error } = await supabase.storage
      .from('pdfs')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) return { filePath, error };
    return { filePath };
  }

export async function GetURL(filePath: string) {
    const { data, error } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(filePath, 60); // 60-second access
  
    if (error) {
      return { error };
    }
  
    return { signedUrl: data.signedUrl };
  }
  
export async function OCRProcessing(filePath: string) {
    const API_KEY = process.env.OCR_API_KEY?? ''; 
    const PDFurl = await GetURL(filePath);

    if (PDFurl.error) {
        return PDFurl.error;
    }

    const params = new URLSearchParams({
        apikey: API_KEY,
        url: PDFurl.signedUrl,
        language: 'eng',
        isOverlayRequired: 'true',
        filetype: 'PDF',

    
    });

    const response = await fetch(`https://api.ocr.space/parse/image?${params}`);
    const data = await response.json();

    const parsedText = data.ParsedResults?.[0]?.ParsedText || '';
    return parsedText;

} 

export async function storePDFMetadata(
    userId: string,
    filePath: string,
    metadata: Record<string, any>,
    text: string
  ) {
    // Extract and format metadata fields explicitly
    const formattedMetadata = {
      title: metadata.title || 'Untitled Document',
      author: metadata.author || 'Unknown Author',
      uploaded_at: new Date().toISOString(), // Matches timestamp format in schema
      file_size: metadata.fileSize || 0,     // Ensure numeric type
    };
  
    const { data, error } = await supabase
      .from('pdfs')
      .insert([{
        user_id: userId,
        file_path: filePath,
        extracted_text: text,
        status: 'processed',
        ...formattedMetadata  // Spread formatted metadata fields
      }])
      .select('id, title, author, uploaded_at, file_size');  // Explicitly return needed fields
  
    if (error) return { error };
    
    // Map to match expected output structure
    return {
      success: true,
      fileId: data[0].id,
      metadata: {
        title: data[0].title,
        author: data[0].author,
        uploadedAt: data[0].uploaded_at,
        fileSize: data[0].file_size
      }
    };
  }

export default {
    uploadPDF, GetURL, OCRProcessing, storePDFMetadata}
export{};

    
    


