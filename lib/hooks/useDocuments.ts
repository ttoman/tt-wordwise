'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, CreateDocumentData, UpdateDocumentData } from '@/lib/documentService';

console.log('🔄 useDocuments hooks loaded');

// Query keys for cache management
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: string) => [...documentKeys.lists(), { filters }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Fetch functions
async function fetchDocuments(): Promise<Document[]> {
  console.log('🔄 fetchDocuments: Making API call...');

  const response = await fetch('/api/documents');

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ fetchDocuments: API error:', error);
    throw new Error(error.error || 'Failed to fetch documents');
  }

  const result: ApiResponse<Document[]> = await response.json();
  console.log('✅ fetchDocuments: Retrieved', result.data.length, 'documents');
  return result.data;
}

async function fetchDocument(id: string): Promise<Document> {
  console.log('🔄 fetchDocument: Making API call for ID:', id);

  const response = await fetch(`/api/documents/${id}`);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ fetchDocument: API error:', error);
    throw new Error(error.error || 'Failed to fetch document');
  }

  const result: ApiResponse<Document> = await response.json();
  console.log('✅ fetchDocument: Retrieved document:', result.data.id);
  return result.data;
}

async function createDocument(data: CreateDocumentData): Promise<Document> {
  console.log('🔄 createDocument: Making API call...', data);

  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ createDocument: API error:', error);
    throw new Error(error.error || 'Failed to create document');
  }

  const result: ApiResponse<Document> = await response.json();
  console.log('✅ createDocument: Created document:', result.data.id);
  return result.data;
}

async function updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
  console.log('🔄 updateDocument: Making API call for ID:', id, data);

  const response = await fetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ updateDocument: API error:', error);
    throw new Error(error.error || 'Failed to update document');
  }

  const result: ApiResponse<Document> = await response.json();
  console.log('✅ updateDocument: Updated document:', result.data.id);
  return result.data;
}

async function deleteDocument(id: string): Promise<void> {
  console.log('🔄 deleteDocument: Making API call for ID:', id);

  const response = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ deleteDocument: API error:', error);
    throw new Error(error.error || 'Failed to delete document');
  }

  console.log('✅ deleteDocument: Document deleted:', id);
}

// Hook to fetch all documents
export function useDocuments() {
  console.log('🔄 useDocuments: Hook called');

  return useQuery({
    queryKey: documentKeys.lists(),
    queryFn: fetchDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch a single document
export function useDocument(id: string) {
  console.log('🔄 useDocument: Hook called for ID:', id);

  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => fetchDocument(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to create a document
export function useCreateDocument() {
  console.log('🔄 useCreateDocument: Hook initialized');

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: (newDocument) => {
      console.log('✅ useCreateDocument: Success, updating cache');

      // Add to documents list
      queryClient.setQueryData<Document[]>(documentKeys.lists(), (old) => {
        if (!old) return [newDocument];
        return [newDocument, ...old];
      });

      // Add to individual document cache
      queryClient.setQueryData(documentKeys.detail(newDocument.id), newDocument);
    },
    onError: (error) => {
      console.error('❌ useCreateDocument: Error:', error);
    },
  });
}

// Hook to update a document
export function useUpdateDocument() {
  console.log('🔄 useUpdateDocument: Hook initialized');

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      updateDocument(id, data),
    onSuccess: (updatedDocument) => {
      console.log('✅ useUpdateDocument: Success, updating cache');

      // Update in documents list
      queryClient.setQueryData<Document[]>(documentKeys.lists(), (old) => {
        if (!old) return [updatedDocument];
        return old.map((doc) =>
          doc.id === updatedDocument.id ? updatedDocument : doc
        );
      });

      // Update individual document cache
      queryClient.setQueryData(documentKeys.detail(updatedDocument.id), updatedDocument);
    },
    onError: (error) => {
      console.error('❌ useUpdateDocument: Error:', error);
    },
  });
}

// Hook to delete a document
export function useDeleteDocument() {
  console.log('🔄 useDeleteDocument: Hook initialized');

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, deletedId) => {
      console.log('✅ useDeleteDocument: Success, updating cache');

      // Remove from documents list
      queryClient.setQueryData<Document[]>(documentKeys.lists(), (old) => {
        if (!old) return [];
        return old.filter((doc) => doc.id !== deletedId);
      });

      // Remove individual document cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
    },
    onError: (error) => {
      console.error('❌ useDeleteDocument: Error:', error);
    },
  });
}

console.log('✅ useDocuments: All hooks exported');