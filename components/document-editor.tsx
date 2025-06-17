'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAutosave } from '@/lib/hooks/useAutosave';
import { SaveStatus } from '@/components/save-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Save, Keyboard, CheckCircle } from 'lucide-react';
import { useUpdateDocument } from '@/lib/hooks/useDocuments';
import { Document } from '@/lib/documentService';
import { useSpellCheck, useSpellCheckOnSpace } from '@/lib/hooks/useSpellCheck';
import { SpellCheckMenu, useSpellCheckMenu } from '@/components/spell-check-menu';
import { useGrammarCheck, useGrammarCheckOnIdle } from '@/lib/hooks/useGrammarCheck';
import { GrammarSuggestions, GrammarSummary } from '@/components/grammar-suggestions';
import { ReadabilityScore } from '@/components/readability-score';
import { CostWarningBanner, CostIndicator } from '@/components/cost-warning-banner';

console.log('🔄 DocumentEditor component loaded');

export interface DocumentEditorProps {
  document: Document;
  onSaved?: () => void;
  onError?: (error: string) => void;
  onContentChange?: (content: string) => void;
  contentEditableRef?: React.RefObject<HTMLDivElement>;
  showInlineFeedback?: boolean;
}

/**
 * Document editor with autosave functionality
 */
export function DocumentEditor({
  document,
  onSaved,
  onError,
  onContentChange,
  contentEditableRef: externalRef,
  showInlineFeedback = true
}: DocumentEditorProps) {
  console.log('🔄 DocumentEditor: Rendering for document', document.id);

  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content || '');
  const [lastManualSave, setLastManualSave] = useState<Date | null>(null);
  const [contentChangeCount, setContentChangeCount] = useState(0);

  const updateMutation = useUpdateDocument();
  const internalRef = useRef<HTMLDivElement>(null);
  const contentEditableRef = externalRef || internalRef;
  const lastContentRef = useRef(document.content || '');
  const lastTitleRef = useRef(document.title);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spell check functionality
  const spellCheck = useSpellCheck();
  const spellCheckMenu = useSpellCheckMenu();

  // Grammar check functionality
  const grammarCheck = useGrammarCheck();

  // Get cursor position helper
  const getCursorPosition = useCallback(() => {
    if (!contentEditableRef.current) return 0;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(contentEditableRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  }, []);

  // Grammar check on idle (2 second debounce)
  const scheduleGrammarCheck = useGrammarCheckOnIdle(
    grammarCheck.checkGrammar,
    () => contentEditableRef.current?.textContent || '',
    getCursorPosition
  );

  // Autosave hook
  const autosave = useAutosave({
    documentId: document.id,
    initialContent: document.content || '',
    onSaved: (docId) => {
      console.log('✅ DocumentEditor: Autosave completed for', docId);
      onSaved?.();
    },
    onError: (docId, error) => {
      console.error('❌ DocumentEditor: Autosave error for', docId, error);
      onError?.(error);
    },
  });

  // Effect to schedule autosave when title or content changes
  useEffect(() => {
    // Prevent saving initial content on mount
    if (content === lastContentRef.current && title === lastTitleRef.current) {
      return;
    }

    console.log('📝 DocumentEditor: Change detected, scheduling autosave');
    autosave.scheduleAutosave({ title, content });

    // Update refs to current state
    lastContentRef.current = content;
    lastTitleRef.current = title;
  }, [title, content, autosave]);

  // Update local state when document prop changes
  useEffect(() => {
    console.log('🔄 DocumentEditor: Document prop changed, updating local state');

    // Only update if document ID changes or content actually differs
    if (document.id !== lastContentRef.current ||
        document.title !== lastTitleRef.current ||
        document.content !== lastContentRef.current) {

      setTitle(document.title);
      setContent(document.content || '');

      // Update refs
      lastContentRef.current = document.content || '';
      lastTitleRef.current = document.title;
    }
  }, [document.id, document.title, document.content]);

  // Sync contentEditable with content state, but only if they differ.
  // This prevents the cursor from jumping to the start on every keystroke.
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.textContent !== content) {
      console.log('🔄 DocumentEditor: Syncing contentEditable with state from external change.');
      contentEditableRef.current.textContent = content;
    }
  }, [content]);

  // Debounced title change handler
  const handleTitleChange = useCallback((newTitle: string) => {
    console.log('📝 DocumentEditor: Title changed to:', newTitle);
    setTitle(newTitle);
  }, []);

  // Debounced content change handler
  const handleContentChange = useCallback((newContent: string) => {
    if (newContent === lastContentRef.current) return;

    console.log('📝 DocumentEditor: Content changed, length:', newContent.length);
    setContent(newContent);
    setContentChangeCount(prev => prev + 1);

    // Propagate content change if callback is provided
    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [onContentChange]);

  // Spell check on spacebar press
  useSpellCheckOnSpace(
    async (text: string) => {
      console.log('🔍 DocumentEditor: Triggering spell check on spacebar');
      await spellCheck.checkText(text);
    },
    () => contentEditableRef.current?.textContent || ''
  );

  // Handle spell check suggestion application
  const handleSuggestionApply = useCallback((suggestion: string) => {
    console.log('✅ DocumentEditor: Applying spell check suggestion:', suggestion);

    if (!contentEditableRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(window.document.createTextNode(suggestion));

    // Update content state
    const newContent = contentEditableRef.current.textContent || '';
    handleContentChange(newContent);

    spellCheckMenu.hideMenu();
  }, [handleContentChange, spellCheckMenu]);

  // Handle grammar suggestion application
  const handleGrammarSuggestionApply = useCallback((index: number, suggestion: string) => {
    console.log('✅ DocumentEditor: Applying grammar suggestion:', suggestion);

    if (!contentEditableRef.current) return;

    const currentContent = contentEditableRef.current.textContent || '';
    const grammarSuggestionData = grammarCheck.suggestions[index];

    if (!grammarSuggestionData) return;

    // Replace the original text with the suggestion
    const newContent = currentContent.replace(grammarSuggestionData.original, suggestion);

    // Update the content
    contentEditableRef.current.textContent = newContent;
    handleContentChange(newContent);

    // Apply the suggestion (removes it from the list)
    grammarCheck.applySuggestion(index, suggestion);
  }, [grammarCheck, handleContentChange]);

  // Handle grammar suggestion dismiss
  const handleGrammarSuggestionDismiss = useCallback((index: number) => {
    console.log('🚫 DocumentEditor: Dismissing grammar suggestion', index);
    grammarCheck.dismissSuggestion(index);
  }, [grammarCheck]);

  // Handle right-click on misspelled words
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const word = target.textContent;

    if (!word) return;

    // Find the error that matches this word
    const error = spellCheck.errors.find(err => err.word === word.trim());

    if (error) {
      console.log('🔍 DocumentEditor: Right-clicked on misspelled word:', error.word);
      spellCheckMenu.showMenu(error, event.nativeEvent);
    }
  }, [spellCheck.errors, spellCheckMenu]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    console.log('⚡ DocumentEditor: Manual save triggered');

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const success = await autosave.forceSave({
      title,
      content,
    });

    if (success) {
      console.log('✅ DocumentEditor: Manual save successful');
      setLastManualSave(new Date());
      onSaved?.();
    } else {
      console.error('❌ DocumentEditor: Manual save failed');
      onError?.('Manual save failed');
    }
  }, [autosave, title, content, onSaved, onError]);

  // Keyboard shortcut for manual save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('⌨️ DocumentEditor: Keyboard shortcut save triggered');
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleManualSave]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = title !== document.title || content !== (document.content || '');

  // Only log state changes when they actually happen
  useEffect(() => {
    console.log('📊 DocumentEditor: Current state', {
      documentId: document.id,
      titleLength: title.length,
      contentLength: content.length,
      contentChangeCount,
      hasUnsavedChanges,
      autosaveState: autosave.state.status,
      isDirty: autosave.state.isDirty
    });
  }, [document.id, title.length, contentChangeCount, hasUnsavedChanges, autosave.state.status, autosave.state.isDirty]);

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

      {/* Cost Warning Banner */}
      <div className="px-6">
        <CostWarningBanner costInfo={grammarCheck.costInfo} />
      </div>

      <CardContent className="flex-1 p-6 relative">
        {/* Content Editor - Contenteditable for distraction-free experience */}
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={(e) => {
            const newContent = e.currentTarget.textContent || '';
            console.log('📝 DocumentEditor: Contenteditable input, length:', newContent.length);
            handleContentChange(newContent);
          }}
          onBlur={(e) => {
            // Ensure content is synced on blur
            const newContent = e.currentTarget.textContent || '';
            if (newContent !== content) {
              console.log('📝 DocumentEditor: Content sync on blur');
              handleContentChange(newContent);
            }
          }}
          onContextMenu={handleContextMenu}
          className="w-full h-full outline-none bg-transparent text-sm leading-relaxed focus:outline-none"
          style={{
            minHeight: '400px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
          data-placeholder="Start writing..."
        />

        {/* Feedback has been moved to the dedicated feedback panel on the right */}
      </CardContent>

      <CardFooter className="justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{content.length} characters</span>
          <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
          {hasUnsavedChanges && (
            <span className="text-orange-500 dark:text-orange-400">Unsaved changes</span>
          )}
          {spellCheck.errors.length > 0 && (
            <span className="text-red-500 dark:text-red-400">
              {spellCheck.errors.length} spelling error{spellCheck.errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {spellCheck.isInitialized && spellCheck.errors.length === 0 && content.length > 0 && (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle size={12} />
              No spelling errors
            </span>
          )}

          {/* Grammar Summary */}
          <GrammarSummary
            score={grammarCheck.score}
            improvedScore={grammarCheck.improvedScore}
            suggestionsCount={grammarCheck.suggestions.length}
            isChecking={grammarCheck.isChecking}
            error={grammarCheck.error}
            costInfo={grammarCheck.costInfo}
          />

          {/* Readability Score */}
          <ReadabilityScore
            content={content}
            gptGrade={grammarCheck.readabilityGrade}
            className="hidden md:flex"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Cost Indicator */}
          <CostIndicator costInfo={grammarCheck.costInfo} />

          {spellCheck.isInitializing && (
            <span className="text-blue-500 dark:text-blue-400">Loading spell check...</span>
          )}
          {spellCheck.initError && (
            <span className="text-red-500 dark:text-red-400">Spell check unavailable</span>
          )}
          <div className="flex items-center gap-1">
            <Keyboard size={12} />
            <span>Ctrl+S to save</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

console.log('✅ DocumentEditor: Component exported');