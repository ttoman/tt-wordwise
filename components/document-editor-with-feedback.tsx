'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentEditor } from '@/components/document-editor';
import { FeedbackPanel } from '@/components/feedback-panel';
import { Document } from '@/lib/documentService';
import { useSpellCheck, useSpellCheckOnSpace } from '@/lib/hooks/useSpellCheck';
import { SpellCheckMenu, useSpellCheckMenu } from '@/components/spell-check-menu';
import { useGrammarCheck, useGrammarCheckOnIdle } from '@/lib/hooks/useGrammarCheck';

console.log('🔄 DocumentEditorWithFeedback component loaded');

export interface DocumentEditorWithFeedbackProps {
  document: Document;
  onSaved?: () => void;
  onError?: (error: string) => void;
}

/**
 * Wrapper component that manages feedback state for both document editor and feedback panel
 * Separates the editing experience from the feedback UI
 */
export function DocumentEditorWithFeedback({
  document,
  onSaved,
  onError
}: DocumentEditorWithFeedbackProps) {
  console.log('🔄 DocumentEditorWithFeedback: Rendering for document', document.id);

  const [content, setContent] = useState(document.content || '');
  const contentEditableRef = useRef<HTMLDivElement>(null);

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
    () => content,
    getCursorPosition
  );

  // Update local state when document prop changes
  useEffect(() => {
    console.log('🔄 DocumentEditorWithFeedback: Document prop changed, updating local state');
    setContent(document.content || '');
  }, [document.id, document.content]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    console.log('📝 DocumentEditorWithFeedback: Content changed, length:', newContent.length);
    setContent(newContent);

    // Schedule grammar check on content change
    scheduleGrammarCheck();
  }, [scheduleGrammarCheck]);

  // Spell check on spacebar press
  useSpellCheckOnSpace(
    (text: string) => {
      console.log('🔍 DocumentEditorWithFeedback: Triggering spell check on spacebar');
      spellCheck.checkText(text);
    },
    () => content
  );

  // Handle spell check error click from feedback panel
  const handleSpellErrorClick = useCallback((error: typeof spellCheck.errors[0]) => {
    console.log('🔍 DocumentEditorWithFeedback: Spell error clicked from feedback panel:', error.word);

    // For now, we'll focus the editor - in a full implementation, we'd highlight the word
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  }, []);

  // Handle spell check error ignore from feedback panel
  const handleSpellErrorIgnore = useCallback((error: typeof spellCheck.errors[0]) => {
    console.log('🚫 DocumentEditorWithFeedback: Ignoring spell error from feedback panel:', error.word);
    // Remove this error from the spell check results
    // This would need to be implemented in the spell check hook
  }, []);

  // Handle grammar suggestion application
  const handleGrammarSuggestionApply = useCallback((index: number, suggestion: string) => {
    console.log('✅ DocumentEditorWithFeedback: Applying grammar suggestion:', suggestion);

    const grammarSuggestionData = grammarCheck.suggestions[index];
    if (!grammarSuggestionData) return;

    // Replace the original text with the suggestion
    const newContent = content.replace(grammarSuggestionData.original, suggestion);
    setContent(newContent);
    handleContentChange(newContent);

    // Apply the suggestion (removes it from the list)
    grammarCheck.applySuggestion(index, suggestion);
  }, [grammarCheck, content, handleContentChange]);

  // Handle grammar suggestion dismiss
  const handleGrammarSuggestionDismiss = useCallback((index: number) => {
    console.log('🚫 DocumentEditorWithFeedback: Dismissing grammar suggestion', index);
    grammarCheck.dismissSuggestion(index);
  }, [grammarCheck]);

  // Handle grammar recheck
  const handleGrammarRecheck = useCallback(() => {
    console.log('🔄 DocumentEditorWithFeedback: Manual grammar recheck triggered');
    if (content.trim().length > 0) {
      grammarCheck.checkGrammar(content, getCursorPosition());
    }
  }, [grammarCheck, content, getCursorPosition]);

  console.log('📊 DocumentEditorWithFeedback: Current state', {
    documentId: document.id,
    contentLength: content.length,
    spellErrorsCount: spellCheck.errors.length,
    grammarSuggestionsCount: grammarCheck.suggestions.length,
    isGrammarChecking: grammarCheck.isChecking
  });

  return (
    <div className="flex h-full">
      {/* Document Editor */}
      <div className="flex-1 min-w-0">
        <DocumentEditor
          document={document}
          onSaved={onSaved}
          onError={onError}
          onContentChange={handleContentChange}
          contentEditableRef={contentEditableRef}
          // Remove inline feedback components - they'll be in the feedback panel
          showInlineFeedback={false}
        />

        {/* Spell Check Menu - Still need this for right-click context menu */}
        <SpellCheckMenu
          error={spellCheckMenu.menuState.error}
          position={spellCheckMenu.menuState.position}
          onSuggestionSelect={(suggestion) => {
            // Handle suggestion application in editor
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
          }}
          onIgnore={() => {
            console.log('🔄 DocumentEditorWithFeedback: Ignoring spell check suggestion');
            spellCheckMenu.hideMenu();
          }}
          onClose={spellCheckMenu.hideMenu}
        />
      </div>

      {/* Feedback Panel */}
      <FeedbackPanel
        // Spell check data
        spellErrors={spellCheck.errors}
        isSpellCheckInitialized={spellCheck.isInitialized}
        isSpellCheckInitializing={spellCheck.isInitializing}
        spellCheckInitError={spellCheck.initError}
        onSpellErrorClick={handleSpellErrorClick}
        onSpellErrorIgnore={handleSpellErrorIgnore}

        // Grammar check data
        grammarSuggestions={grammarCheck.suggestions}
        isGrammarChecking={grammarCheck.isChecking}
        grammarError={grammarCheck.error}
        grammarScore={grammarCheck.score}
        grammarImprovedScore={grammarCheck.improvedScore}
        grammarReadabilityGrade={grammarCheck.readabilityGrade}
        grammarCostInfo={grammarCheck.costInfo}
        onGrammarSuggestionApply={handleGrammarSuggestionApply}
        onGrammarSuggestionDismiss={handleGrammarSuggestionDismiss}
        onGrammarRecheck={handleGrammarRecheck}

        // Document content for readability
        content={content}
      />
    </div>
  );
}

console.log('✅ DocumentEditorWithFeedback: Component exported');