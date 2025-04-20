/**
 * API service for communicating with the backend
 */

import { RagRequest, RagResponse, SourceReference } from '../types/chat';

const API_BASE_URL = 'http://localhost:3000';

/**
 * API methods for the RAG bot
 */
export const RagApi = {
  /**
   * Send a query to the RAG system
   * @param query The user's query
   * @param conversationId Optional conversation ID for context
   * @param conversationContext Optional previous messages for context
   * @returns Promise with the RAG response
   */
  /** POST /rag/query */
  async queryRag(request: RagRequest): Promise<RagResponse> {
    const res = await fetch(`${API_BASE_URL}/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`RAG query failed: ${res.status}`);
    return res.json();
  },

  /** GET /rag/sources/:id */
  async getSourceById(id: string): Promise<SourceReference> {
    const res = await fetch(`${API_BASE_URL}/rag/sources/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Fetch source failed: ${res.status}`);
    return res.json();
  },

  /**
   * Get a specific source reference by ID
   * @param referenceId The ID of the source reference
   * @returns Promise with the source data
   */
  /** GET /rag/sources/response/:responseId */
  async getSourcesForResponse(responseId: string): Promise<SourceReference[]> {
    const res = await fetch(`${API_BASE_URL}/rag/sources/response/${responseId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Fetch sources failed: ${res.status}`);
    return res.json();
  },
};
