'use client';

console.log('🔄 Document Service loaded');

// Types for document operations
export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  updatedAt: Date;
}

export interface CreateDocumentData {
  title?: string;
  content?: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
}

export interface DocumentServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

class DocumentService {
  /**
   * Create a new document
   */
  async createDoc(data: CreateDocumentData = {}): Promise<DocumentServiceResponse<Document>> {
    console.log('🔄 DocumentService: Creating new document...', data);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ DocumentService: Create API error:', error);
        return {
          data: null,
          error: error.error || 'Failed to create document',
          success: false
        };
      }

      const result = await response.json();
      console.log('✅ DocumentService: Document created:', result.data);

      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ DocumentService: Create error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create document',
        success: false
      };
    }
  }

  /**
   * Get all documents for the current user
   */
  async getDocuments(): Promise<DocumentServiceResponse<Document[]>> {
    console.log('🔄 DocumentService: Fetching all documents...');

    try {
      const response = await fetch('/api/documents');

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ DocumentService: Get documents API error:', error);
        return {
          data: null,
          error: error.error || 'Failed to fetch documents',
          success: false
        };
      }

      const result = await response.json();
      console.log('✅ DocumentService: Retrieved', result.data.length, 'documents');

      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ DocumentService: Get documents error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
        success: false
      };
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: string): Promise<DocumentServiceResponse<Document>> {
    console.log('🔄 DocumentService: Fetching document:', documentId);

    try {
      const response = await fetch(`/api/documents/${documentId}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ DocumentService: Get document API error:', error);
        return {
          data: null,
          error: error.error || 'Failed to fetch document',
          success: false
        };
      }

      const result = await response.json();
      console.log('✅ DocumentService: Document retrieved:', result.data.id);

      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ DocumentService: Get document error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch document',
        success: false
      };
    }
  }

  /**
   * Update a document (rename or save content)
   */
  async saveDoc(documentId: string, data: UpdateDocumentData): Promise<DocumentServiceResponse<Document>> {
    console.log('🔄 DocumentService: Saving document:', documentId, data);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ DocumentService: Save API error:', error);
        return {
          data: null,
          error: error.error || 'Failed to save document',
          success: false
        };
      }

      const result = await response.json();
      console.log('✅ DocumentService: Document saved:', result.data.id);

      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ DocumentService: Save error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to save document',
        success: false
      };
    }
  }

  /**
   * Rename a document (convenience method)
   */
  async renameDoc(documentId: string, title: string): Promise<DocumentServiceResponse<Document>> {
    console.log('🔄 DocumentService: Renaming document:', documentId, 'to:', title);
    return this.saveDoc(documentId, { title });
  }

  /**
   * Delete a document
   */
  async deleteDoc(documentId: string): Promise<DocumentServiceResponse<boolean>> {
    console.log('🔄 DocumentService: Deleting document:', documentId);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ DocumentService: Delete API error:', error);
        return {
          data: null,
          error: error.error || 'Failed to delete document',
          success: false
        };
      }

      console.log('✅ DocumentService: Document deleted:', documentId);

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ DocumentService: Delete error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete document',
        success: false
      };
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();

// Export convenience functions
export const createDoc = (data?: CreateDocumentData) => documentService.createDoc(data);
export const getDocuments = () => documentService.getDocuments();
export const getDocument = (id: string) => documentService.getDocument(id);
export const saveDoc = (id: string, data: UpdateDocumentData) => documentService.saveDoc(id, data);
export const renameDoc = (id: string, title: string) => documentService.renameDoc(id, title);
export const deleteDoc = (id: string) => documentService.deleteDoc(id);

console.log('✅ Document Service exported');