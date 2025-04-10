import { Request, Response } from 'express';
import { uploadPDF, GetURL, OCRProcessing, storePDFMetadata } from './supabase.service.js';

export async function handlePDFUpload(req: Request, res: Response) {
  try {
    // Step 1: Upload PDF
    const fileBuffer = req.file?.buffer;
    if (!fileBuffer) throw new Error('No PDF file uploaded');

    const uploadResult = await uploadPDF(fileBuffer, {});
    if (uploadResult.error) throw uploadResult.error;

    // Step 2: Generate Signed URL
    const signedUrlResult = await GetURL(uploadResult.filePath);
    if (signedUrlResult.error) throw signedUrlResult.error;

    // Step 3: Process OCR
    const ocrText = await OCRProcessing(uploadResult.filePath);
    if (typeof ocrText !== 'string') throw new Error('OCR failed');

    // Step 4: Store Metadata
    const metadata = req.body;
    const userId = metadata.userId || 'default-user-id'; // Replace with actual user ID logic
    const storeResult = await storePDFMetadata(
      userId,
      uploadResult.filePath,
      metadata,
      ocrText
    );

    if (storeResult.error) throw storeResult.error;

    // Return formatted response
    res.status(200).json({
      success: true,
      fileId: storeResult.fileId,
      metadata: storeResult.metadata
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
