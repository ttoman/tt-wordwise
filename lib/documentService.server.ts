import { db } from '@/lib/db';
import { documents, profiles } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, desc, and } from 'drizzle-orm';

console.log('🔄 Server Document Service loaded');

// Types for document operations (same as client)
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

class ServerDocumentService {
  /**
   * Get current authenticated user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    console.log('🔄 ServerDocumentService: Getting current user ID...');
    try {
      const supabase = await createClient();
      console.log('🔄 ServerDocumentService: Supabase client created');

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('❌ ServerDocumentService: Auth error:', error.message);
        return null;
      }
      console.log('✅ ServerDocumentService: Current user ID:', user?.id || 'null');
      return user?.id || null;
    } catch (err) {
      console.error('❌ ServerDocumentService: Unexpected auth error:', err);
      return null;
    }
  }

  /**
   * Create a new document
   */
  async createDoc(data: CreateDocumentData = {}): Promise<DocumentServiceResponse<Document>> {
    console.log('🔄 ServerDocumentService: Creating new document...', data);

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ ServerDocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 ServerDocumentService: Inserting document for user:', userId);

      const newDoc = await db.insert(documents).values({
        userId,
        title: data.title || 'Untitled Document',
        content: data.content || '',
      }).returning();

      console.log('✅ ServerDocumentService: Document created:', newDoc[0]);

      return {
        data: newDoc[0] as Document,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ ServerDocumentService: Create error:', error);
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
    console.log('🔄 ServerDocumentService: Fetching all documents...');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ ServerDocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 ServerDocumentService: Querying documents for user:', userId);

      const userDocs = await db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.updatedAt));

      console.log('✅ ServerDocumentService: Retrieved', userDocs.length, 'documents');

      return {
        data: userDocs as Document[],
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ ServerDocumentService: Get documents error:', error);
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
    console.log('🔄 ServerDocumentService: Fetching document:', documentId);

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ ServerDocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 ServerDocumentService: Querying document for user:', userId);

      const doc = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        ));

      if (doc.length === 0) {
        console.warn('⚠️ ServerDocumentService: Document not found or access denied');
        return {
          data: null,
          error: 'Document not found or access denied',
          success: false
        };
      }

      console.log('✅ ServerDocumentService: Document retrieved:', doc[0].id);

      return {
        data: doc[0] as Document,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ ServerDocumentService: Get document error:', error);
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
    console.log('🔄 ServerDocumentService: Saving document:', documentId, data);

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ ServerDocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 ServerDocumentService: Updating document for user:', userId);

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
        console.warn('⚠️ ServerDocumentService: Document not found or access denied for update');
        return {
          data: null,
          error: 'Document not found or access denied',
          success: false
        };
      }

      console.log('✅ ServerDocumentService: Document saved:', updatedDoc[0].id);

      return {
        data: updatedDoc[0] as Document,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ ServerDocumentService: Save error:', error);
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
    console.log('🔄 ServerDocumentService: Renaming document:', documentId, 'to:', title);
    return this.saveDoc(documentId, { title });
  }

  /**
   * Delete a document
   */
  async deleteDoc(documentId: string): Promise<DocumentServiceResponse<boolean>> {
    console.log('🔄 ServerDocumentService: Deleting document:', documentId);

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ ServerDocumentService: User not authenticated');
        return {
          data: null,
          error: 'User not authenticated',
          success: false
        };
      }

      console.log('🔄 ServerDocumentService: Deleting document for user:', userId);

      const deletedDoc = await db
        .delete(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        ))
        .returning();

      if (deletedDoc.length === 0) {
        console.warn('⚠️ ServerDocumentService: Document not found or access denied for deletion');
        return {
          data: null,
          error: 'Document not found or access denied',
          success: false
        };
      }

      console.log('✅ ServerDocumentService: Document deleted:', deletedDoc[0].id);

      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('❌ ServerDocumentService: Delete error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete document',
        success: false
      };
    }
  }
}

// Export singleton instance
export const serverDocumentService = new ServerDocumentService();

// Export convenience functions
export const createDoc = (data?: CreateDocumentData) => serverDocumentService.createDoc(data);
export const getDocuments = () => serverDocumentService.getDocuments();
export const getDocument = (id: string) => serverDocumentService.getDocument(id);
export const saveDoc = (id: string, data: UpdateDocumentData) => serverDocumentService.saveDoc(id, data);
export const renameDoc = (id: string, title: string) => serverDocumentService.renameDoc(id, title);
export const deleteDoc = (id: string) => serverDocumentService.deleteDoc(id);

console.log('✅ Server Document Service exported');