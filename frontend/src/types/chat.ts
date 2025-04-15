/**
 * Types for the Chat Bot interface
 */

/**
 * Source reference type for RAG results
 */
export interface SourceReference {
  id: string;
  title: string;
  content: string;
  url?: string;
  type: 'text' | 'image' | 'chart' | 'code';
  confidence: number;
  // For image/chart content
  imageUrl?: string;
  // For text content
  textContent?: string;
  // For code content
  language?: string;
  // Metadata
  pagePath?: string;
  pageTitle?: string;
  // Reference ID from the backend (for breadcrumb tracking)
  referenceId?: string;
  // Position in the original document
  position?: {
    startLine?: number;
    endLine?: number;
    blockId?: string;
  };
}

/**
 * Message type for chat history
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sourceReferences?: SourceReference[];
}

/**
 * Response from the RAG API
 */
export interface RagResponse {
  response: string;
  sourceReferences: SourceReference[];
  query: string;
  processedAt: string;
}

/**
 * Request to the RAG API
 */
export interface RagRequest {
  query: string;
  conversationId?: string;
  conversationContext?: Message[];
}
