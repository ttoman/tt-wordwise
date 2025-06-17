'use client';

import { db } from '@/lib/db';
import { documents, profiles } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/client';
import { eq, desc, and } from 'drizzle-orm';

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
  private supabase = createClient();

  /**
   * Get current authenticated user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    console.log('🔄 DocumentService: Getting current user ID...');
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) {
        console.error('❌ DocumentService: Auth error:', error.message);
        return null;
      }
      console.log('✅ DocumentService: Current user ID:', user?.id || 'null');
      return user?.id || null;
    } catch (err) {
      console.error('❌ DocumentService: Unexpected auth error:', err);
      return null;
    }
  }

  /**
   * Create a new document
   */
  async createDoc(data: CreateDocumentData = {}): Promise<DocumentServiceResponse<Document>> {
    console.log('🔄 DocumentService: Creating new document...', data);

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ DocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 DocumentService: Inserting document for user:', userId);

      const newDoc = await db.insert(documents).values({
        userId,
        title: data.title || 'Untitled Document',
        content: data.content || '',
      }).returning();

      console.log('✅ DocumentService: Document created:', newDoc[0]);

      return {
        data: newDoc[0] as Document,
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
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ DocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 DocumentService: Querying documents for user:', userId);

      const userDocs = await db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.updatedAt));

      console.log('✅ DocumentService: Retrieved', userDocs.length, 'documents');

      return {
        data: userDocs as Document[],
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
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ DocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 DocumentService: Querying document for user:', userId);

      const doc = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        ));

      if (doc.length === 0) {
        console.warn('⚠️ DocumentService: Document not found or access denied');
        return {
          data: null,
          error: 'Document not found or access denied',
          success: false
        };
      }

      console.log('✅ DocumentService: Document retrieved:', doc[0].id);

      return {
        data: doc[0] as Document,
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
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ DocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 DocumentService: Updating document for user:', userId);

      const updatedDoc = await db
        .update(documents)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        ))
        .returning();

      if (updatedDoc.length === 0) {
        console.warn('⚠️ DocumentService: Document not found or access denied for update');
        return {
          data: null,
          error: 'Document not found or access denied',
          success: false
        };
      }

      console.log('✅ DocumentService: Document saved:', updatedDoc[0].id);

      return {
        data: updatedDoc[0] as Document,
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
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ DocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 DocumentService: Deleting document for user:', userId);

      const deletedDoc = await db
        .delete(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        ))
        .returning();

      if (deletedDoc.length === 0) {
        console.warn('⚠️ DocumentService: Document not found or access denied for deletion');
        return {
          data: null,
          error: 'Document not found or access denied',
          success: false
        };
      }

      console.log('✅ DocumentService: Document deleted:', deletedDoc[0].id);

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

console.log('✅ DocumentService: Service initialized and exported');