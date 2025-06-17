'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DocumentSidebar } from './document-sidebar';
import { DocumentEditorWithFeedback } from '@/components/document-editor-with-feedback';
import { useDocuments, useDocument } from '@/lib/hooks/useDocuments';
import { Document } from '@/lib/documentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Menu, X, FileText, AlertTriangle } from 'lucide-react';

console.log('🔄 WorkspaceLayout component loaded');

/**
 * Main workspace layout with sidebar and editor
 * Handles document selection and responsive mobile drawer
 */
export function WorkspaceLayout() {
  console.log('🔄 WorkspaceLayout: Rendering');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Document state
  const { data: documents, isLoading: documentsLoading, error: documentsError } = useDocuments();
  const { data: selectedDocument, isLoading: documentLoading, error: documentError } = useDocument(selectedDocumentId);

  // Only log when values actually change to reduce console spam
  const documentState = useMemo(() => ({
    selectedDocumentId,
    selectedDocument: !!selectedDocument ? selectedDocument.id : null,
    documentsCount: documents?.length,
    documentLoading,
    documentsLoading,
  }), [selectedDocumentId, selectedDocument, documents?.length, documentLoading, documentsLoading]);

  useEffect(() => {
    console.log('📊 WorkspaceLayout: State snapshot', documentState);
  }, [documentState]);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // On mobile, close sidebar by default
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      // On desktop, open sidebar by default
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    checkMobile();

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [sidebarOpen]);

  // Handle document selection
  const handleDocumentSelect = useCallback((document: Document) => {
    console.log('📄 WorkspaceLayout: Document selected:', document.id);
    setSelectedDocumentId(document.id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Handle document creation
  const handleDocumentCreate = useCallback((document: Document) => {
    console.log('📄 WorkspaceLayout: Document created:', document.id);
    setSelectedDocumentId(document.id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    console.log('🔄 WorkspaceLayout: Toggling sidebar');
    setSidebarOpen(prev => !prev);
  }, []);

  // Loading state
  if (documentsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText size={48} className="mx-auto text-muted-foreground animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-24 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'z-50' : 'z-10'}
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'h-full' : 'h-screen'}
      `}>
        <div className="h-full bg-background border-r">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Documents</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <X size={18} />
              </Button>
            </div>
          )}

          <DocumentSidebar
            selectedDocumentId={selectedDocumentId || undefined}
            onDocumentSelect={handleDocumentSelect}
            onDocumentCreate={handleDocumentCreate}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0">
        {/* Document Editor Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <Menu size={18} />
              </Button>
              <h1 className="font-semibold truncate">
                {selectedDocument?.title || 'Wordwise'}
              </h1>
              <div className="w-10" /> {/* Spacer for balance */}
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 p-4 overflow-hidden">
            {documentError ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center space-y-4">
                  <AlertTriangle size={48} className="mx-auto text-destructive" />
                  <div>
                    <h3 className="font-semibold text-destructive">Error Loading Document</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documentError.message || 'Failed to load the selected document'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !selectedDocument && !documentLoading ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center space-y-4">
                  <FileText size={48} className="mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">No Document Selected</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documents?.length === 0
                        ? 'Create your first document to get started'
                        : 'Select a document from the sidebar to begin editing'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : documentLoading ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center space-y-4">
                  <FileText size={48} className="mx-auto text-muted-foreground animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-24 mx-auto animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ) : selectedDocument ? (
              <DocumentEditorWithFeedback
                document={selectedDocument}
                onSaved={() => {
                  console.log('📝 WorkspaceLayout: Document saved');
                }}
                onError={(error) => {
                  console.error('❌ WorkspaceLayout: Document error:', error);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

console.log('✅ WorkspaceLayout: Component exported');