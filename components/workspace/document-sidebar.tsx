'use client';

import { useState } from 'react';
import { useDocuments, useCreateDocument, useDeleteDocument, useUpdateDocument } from '@/lib/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  Trash2,
  Edit3,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Document } from '@/lib/documentService';
import { formatDistanceToNow } from 'date-fns';

console.log('🔄 DocumentSidebar component loaded');

export interface DocumentSidebarProps {
  selectedDocumentId?: string;
  onDocumentSelect: (document: Document) => void;
  onDocumentCreate?: (document: Document) => void;
}

/**
 * Sidebar component for document management
 * Displays list of documents with create, rename, delete functionality
 */
export function DocumentSidebar({
  selectedDocumentId,
  onDocumentSelect,
  onDocumentCreate,
}: DocumentSidebarProps) {
  console.log('🔄 DocumentSidebar: Rendering with selectedId:', selectedDocumentId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hooks for document operations
  const { data: documents = [], isLoading, error } = useDocuments();
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  // Sort documents by updated_at descending (most recent first)
  const sortedDocuments = [...documents].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  console.log('📊 DocumentSidebar: State', {
    documentsCount: documents.length,
    isLoading,
    hasError: !!error,
    editingId,
    deletingId,
    selectedDocumentId
  });

  // Handle creating a new document
  const handleCreateDocument = async () => {
    console.log('🔄 DocumentSidebar: Creating new document');

    try {
      const newDocument = await createMutation.mutateAsync({
        title: 'Untitled Document',
        content: '',
      });

      console.log('✅ DocumentSidebar: Document created:', newDocument.id);

      // Auto-select the new document
      onDocumentSelect(newDocument);
      onDocumentCreate?.(newDocument);

      // Start editing the title immediately
      setEditingId(newDocument.id);
      setEditingTitle(newDocument.title);
    } catch (error) {
      console.error('❌ DocumentSidebar: Failed to create document:', error);
    }
  };

  // Handle starting title edit
  const handleStartEdit = (document: Document) => {
    console.log('🔄 DocumentSidebar: Starting edit for:', document.id);
    setEditingId(document.id);
    setEditingTitle(document.title);
  };

  // Handle saving title edit
  const handleSaveEdit = async (documentId: string) => {
    if (!editingTitle.trim()) {
      console.warn('⚠️ DocumentSidebar: Empty title, cancelling edit');
      setEditingId(null);
      setEditingTitle('');
      return;
    }

    console.log('🔄 DocumentSidebar: Saving title edit:', documentId, editingTitle);

    try {
      await updateMutation.mutateAsync({
        id: documentId,
        data: { title: editingTitle.trim() }
      });

      console.log('✅ DocumentSidebar: Title updated successfully');
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('❌ DocumentSidebar: Failed to update title:', error);
    }
  };

  // Handle cancelling title edit
  const handleCancelEdit = () => {
    console.log('🔄 DocumentSidebar: Cancelling title edit');
    setEditingId(null);
    setEditingTitle('');
  };

  // Handle delete confirmation
  const handleDeleteClick = (documentId: string) => {
    console.log('🔄 DocumentSidebar: Delete confirmation for:', documentId);
    setDeletingId(documentId);
  };

  // Handle actual delete
  const handleConfirmDelete = async (documentId: string) => {
    console.log('🔄 DocumentSidebar: Confirming delete for:', documentId);

    try {
      await deleteMutation.mutateAsync(documentId);
      console.log('✅ DocumentSidebar: Document deleted successfully');

      // If the deleted document was selected, clear selection
      if (selectedDocumentId === documentId && documents.length > 1) {
        const otherDoc = documents.find(d => d.id !== documentId);
        if (otherDoc) {
          onDocumentSelect(otherDoc);
        }
      }
    } catch (error) {
      console.error('❌ DocumentSidebar: Failed to delete document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle cancelling delete
  const handleCancelDelete = () => {
    console.log('🔄 DocumentSidebar: Cancelling delete');
    setDeletingId(null);
  };

  // Format last updated time
  const formatLastUpdated = (updatedAt: string) => {
    try {
      return formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (error) {
    console.error('❌ DocumentSidebar: Error loading documents:', error);
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load documents. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} />
            Documents
          </CardTitle>
          <Button
            size="sm"
            onClick={handleCreateDocument}
            disabled={createMutation.isPending}
            className="gap-1.5"
          >
            {createMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            New
          </Button>
        </div>
        {documents.length > 0 && (
          <Badge variant="secondary" className="w-fit">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {/* Skeleton loaders */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents yet</p>
            <p className="text-xs">Click "New" to create your first document</p>
          </div>
        ) : (
          sortedDocuments.map((document) => (
            <div
              key={document.id}
              className={`
                group p-3 rounded-lg border transition-all cursor-pointer
                ${selectedDocumentId === document.id
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'hover:bg-muted/50 border-transparent'
                }
                ${deletingId === document.id ? 'bg-destructive/5 border-destructive' : ''}
              `}
              onClick={() => !editingId && !deletingId && onDocumentSelect(document)}
            >
              {/* Delete Confirmation */}
              {deletingId === document.id ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    Delete "{document.title}"?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmDelete(document.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="flex-1"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelDelete();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Document Title */}
                  <div className="flex items-start justify-between gap-2">
                    {editingId === document.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(document.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(document.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="text-sm font-medium p-1 h-auto border-none shadow-none focus-visible:ring-1"
                      />
                    ) : (
                      <h3
                        className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(document);
                        }}
                      >
                        {document.title}
                      </h3>
                    )}

                    {/* Action Buttons */}
                    {editingId !== document.id && deletingId !== document.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(document);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(document.id);
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock size={10} />
                    <span>{formatLastUpdated(document.updatedAt)}</span>
                  </div>

                  {/* Content Preview */}
                  {document.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {document.content.slice(0, 80)}
                      {document.content.length > 80 ? '...' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

console.log('✅ DocumentSidebar: Component exported');