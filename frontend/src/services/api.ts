/**
 * API service for communicating with the backend
 */

import { RagRequest, RagResponse } from '../types/chat';

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
  async queryRag(request: RagRequest): Promise<RagResponse> {
    try {
      // TODO: Replace with actual API endpoint for RAG query
      const response = await fetch(`${API_BASE_URL}/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error querying RAG system:', error);
      throw error;
    }
  },

  /**
   * Get a specific source reference by ID
   * @param referenceId The ID of the source reference
   * @returns Promise with the source data
   */
  async getSourceReference(referenceId: string): Promise<any> {
    try {
      // TODO: Replace with actual API endpoint for source references
      const response = await fetch(`${API_BASE_URL}/rag/sources/${referenceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching source reference:', error);
      throw error;
    }
  },
};
