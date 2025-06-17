'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Document } from '@/lib/documentService';
import { useUpdateDocument } from '@/lib/hooks/useDocuments';

console.log('🔄 SimpleDocumentEditor component loaded');

export interface SimpleDocumentEditorProps {
  document: Document;
  onSaved?: () => void;
  onError?: (error: string) => void;
}

/**
 * A simplified document editor with basic functionality
 */
export function SimpleDocumentEditor({ document, onSaved, onError }: SimpleDocumentEditorProps) {
  console.log('🔄 SimpleDocumentEditor: Rendering for document', document.id);

  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const contentEditableRef = useRef<HTMLDivElement>(null);
  const updateMutation = useUpdateDocument();

  // Initialize contentEditable with document content
  useEffect(() => {
    console.log('🔄 SimpleDocumentEditor: Document prop changed, updating content');

    setTitle(document.title);
    setContent(document.content || '');

    if (contentEditableRef.current) {
      console.log('🔄 SimpleDocumentEditor: Setting contentEditable content:',
        (document.content || '').length, 'chars');
      contentEditableRef.current.textContent = document.content || '';
    }
  }, [document.id, document.title, document.content]);

  // Handle title changes
  const handleTitleChange = (newTitle: string) => {
    console.log('📝 SimpleDocumentEditor: Title changed to:', newTitle);
    setTitle(newTitle);
  };

  // Handle content changes
  const handleContentChange = () => {
    if (!contentEditableRef.current) return;

    const newContent = contentEditableRef.current.textContent || '';
    console.log('📝 SimpleDocumentEditor: Content changed, length:', newContent.length);
    setContent(newContent);
  };

  // Save document
  const handleSave = async () => {
    console.log('💾 SimpleDocumentEditor: Saving document');
    setIsSaving(true);

    try {
      await updateMutation.mutateAsync({
        id: document.id,
        data: { title, content }
      });

      console.log('✅ SimpleDocumentEditor: Document saved successfully');
      onSaved?.();
    } catch (error) {
      console.error('❌ SimpleDocumentEditor: Save error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Document title..."
          className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
        />
      </CardHeader>

      <CardContent className="flex-1 p-6 relative">
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
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
        <div>
          <span>{content.length} characters</span>
          <span className="ml-4">{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-1.5"
        >
          <Save size={14} />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}

console.log('✅ SimpleDocumentEditor: Component exported');