'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAutosave } from '@/lib/hooks/useAutosave';
import { SaveStatus } from '@/components/save-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Save, Keyboard } from 'lucide-react';
import { useUpdateDocument } from '@/lib/hooks/useDocuments';
import { Document } from '@/lib/documentService';

console.log('🔄 SimpleDocumentEditor component loaded');

export interface SimpleDocumentEditorProps {
  document: Document;
  onSaved?: () => void;
  onError?: (error: string) => void;
  onContentChange?: (content: string) => void;
}

/**
 * Simplified document editor without inline feedback - feedback is handled in separate panel
 */
export function SimpleDocumentEditor({ document, onSaved, onError, onContentChange }: SimpleDocumentEditorProps) {
  console.log('🔄 SimpleDocumentEditor: Rendering for document', document.id);

  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content || '');
  const [lastManualSave, setLastManualSave] = useState<Date | null>(null);

  const updateMutation = useUpdateDocument();
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Autosave hook
  const autosave = useAutosave({
    documentId: document.id,
    initialContent: document.content || '',
    onSaved: (docId) => {
      console.log('✅ SimpleDocumentEditor: Autosave completed for', docId);
      onSaved?.();
    },
    onError: (docId, error) => {
      console.error('❌ SimpleDocumentEditor: Autosave error for', docId, error);
      onError?.(error);
    },
  });

  // Update local state when document prop changes
  useEffect(() => {
    console.log('🔄 SimpleDocumentEditor: Document prop changed, updating local state');
    setTitle(document.title);
    setContent(document.content || '');
  }, [document.id, document.title, document.content]);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    console.log('📝 SimpleDocumentEditor: Title changed to:', newTitle);
    setTitle(newTitle);

    // Schedule autosave for title change
    autosave.scheduleAutosave({ title: newTitle });
  }, [autosave]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    console.log('📝 SimpleDocumentEditor: Content changed, length:', newContent.length);
    setContent(newContent);

    // Schedule autosave for content change
    autosave.scheduleAutosave({ content: newContent });

    // Notify parent component of content change for feedback processing
    onContentChange?.(newContent);
  }, [autosave, onContentChange]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    console.log('⚡ SimpleDocumentEditor: Manual save triggered');

    const success = await autosave.forceSave({
      title,
      content,
    });

    if (success) {
      console.log('✅ SimpleDocumentEditor: Manual save successful');
      setLastManualSave(new Date());
      onSaved?.();
    } else {
      console.error('❌ SimpleDocumentEditor: Manual save failed');
      onError?.('Manual save failed');
    }
  }, [autosave, title, content, onSaved, onError]);

  // Keyboard shortcut for manual save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('⌨️ SimpleDocumentEditor: Keyboard shortcut save triggered');
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleManualSave]);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = title !== document.title || content !== (document.content || '');

  console.log('📊 SimpleDocumentEditor: Current state', {
    documentId: document.id,
    titleLength: title.length,
    contentLength: content.length,
    hasUnsavedChanges,
    autosaveState: autosave.state.status,
    isDirty: autosave.state.isDirty
  });

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="space-y-4">
        {/* Title Editor */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Document title..."
            className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          />
        </div>

        {/* Save Controls & Status */}
        <div className="flex items-center justify-between">
          <SaveStatus state={autosave.state} />

          <div className="flex items-center gap-2">
            {lastManualSave && (
              <span className="text-xs text-muted-foreground">
                Manual save: {lastManualSave.toLocaleTimeString()}
              </span>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSave}
              disabled={autosave.state.status === 'saving' || updateMutation.isPending}
              className="gap-1.5"
            >
              <Save size={14} />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6 relative">
        {/* Content Editor - Clean, distraction-free experience */}
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={(e) => {
            const newContent = e.currentTarget.textContent || '';
            console.log('📝 SimpleDocumentEditor: Contenteditable input, length:', newContent.length);
            handleContentChange(newContent);
          }}
          onBlur={(e) => {
            // Ensure content is synced on blur
            const newContent = e.currentTarget.textContent || '';
            if (newContent !== content) {
              console.log('📝 SimpleDocumentEditor: Content sync on blur');
              handleContentChange(newContent);
            }
          }}
          className="w-full h-full outline-none bg-transparent text-sm leading-relaxed focus:outline-none"
          style={{
            minHeight: '400px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
          data-placeholder="Start writing..."
        />
      </CardContent>

      <CardFooter className="justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{content.length} characters</span>
          <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
          {hasUnsavedChanges && (
            <span className="text-orange-500 dark:text-orange-400">Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Keyboard size={12} />
            <span>Ctrl+S to save</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

console.log('✅ SimpleDocumentEditor: Component exported');