'use client';

import { useEffect, useState, useCallback } from 'react';
import { autosaveEngine, AutosaveState, AUTOSAVE_EVENTS } from '@/lib/autosave';
import { UpdateDocumentData } from '@/lib/documentService';

console.log('🔄 useAutosave hook loaded');

export interface UseAutosaveOptions {
  documentId: string;
  initialContent?: string;
  onSaved?: (documentId: string) => void;
  onError?: (documentId: string, error: string) => void;
}

export interface UseAutosaveReturn {
  state: AutosaveState;
  scheduleAutosave: (data: UpdateDocumentData) => void;
  forceSave: (data: UpdateDocumentData) => Promise<boolean>;
  cancelAutosave: () => void;
}

/**
 * React hook for document autosave functionality
 */
export function useAutosave({
  documentId,
  initialContent = '',
  onSaved,
  onError,
}: UseAutosaveOptions): UseAutosaveReturn {
  console.log('🔄 useAutosave: Hook initialized for document', documentId);

  const [state, setState] = useState<AutosaveState>(() =>
    autosaveEngine.getState(documentId)
  );

  // Initialize document on mount
  useEffect(() => {
    console.log('🎯 useAutosave: Initializing document', documentId);
    autosaveEngine.initializeDocument(documentId, initialContent);
    setState(autosaveEngine.getState(documentId));

    return () => {
      console.log('🧹 useAutosave: Cleaning up document', documentId);
      autosaveEngine.cleanup(documentId);
    };
  }, [documentId, initialContent]);

  // Listen for autosave events
  useEffect(() => {
    console.log('👂 useAutosave: Setting up event listeners for', documentId);

    const handleStatusChange = (event: CustomEvent) => {
      const { documentId: eventDocId, state: newState } = event.detail;
      if (eventDocId === documentId) {
        console.log('📊 useAutosave: Status changed for', documentId, newState);
        setState(newState);
      }
    };

    const handleDocSaved = (event: CustomEvent) => {
      const { documentId: eventDocId } = event.detail;
      if (eventDocId === documentId) {
        console.log('✅ useAutosave: Document saved event for', documentId);
        onSaved?.(documentId);
      }
    };

    const handleSaveError = (event: CustomEvent) => {
      const { documentId: eventDocId, error } = event.detail;
      if (eventDocId === documentId) {
        console.log('❌ useAutosave: Save error event for', documentId, error);
        onError?.(documentId, error);
      }
    };

    // Add event listeners
    window.addEventListener(AUTOSAVE_EVENTS.STATUS_CHANGED, handleStatusChange as EventListener);
    window.addEventListener(AUTOSAVE_EVENTS.DOC_SAVED, handleDocSaved as EventListener);
    window.addEventListener(AUTOSAVE_EVENTS.SAVE_ERROR, handleSaveError as EventListener);

    return () => {
      console.log('🧹 useAutosave: Removing event listeners for', documentId);
      window.removeEventListener(AUTOSAVE_EVENTS.STATUS_CHANGED, handleStatusChange as EventListener);
      window.removeEventListener(AUTOSAVE_EVENTS.DOC_SAVED, handleDocSaved as EventListener);
      window.removeEventListener(AUTOSAVE_EVENTS.SAVE_ERROR, handleSaveError as EventListener);
    };
  }, [documentId, onSaved, onError]);

  // Memoized functions
  const scheduleAutosave = useCallback((data: UpdateDocumentData) => {
    console.log('⏰ useAutosave: Scheduling autosave for', documentId);
    autosaveEngine.scheduleAutosave(documentId, data);
  }, [documentId]);

  const forceSave = useCallback(async (data: UpdateDocumentData): Promise<boolean> => {
    console.log('⚡ useAutosave: Force saving for', documentId);
    return autosaveEngine.forceSave(documentId, data);
  }, [documentId]);

  const cancelAutosave = useCallback(() => {
    console.log('🚫 useAutosave: Canceling autosave for', documentId);
    autosaveEngine.cancelAutosave(documentId);
  }, [documentId]);

  console.log('📊 useAutosave: Current state for', documentId, state);

  return {
    state,
    scheduleAutosave,
    forceSave,
    cancelAutosave,
  };
}

console.log('✅ useAutosave: Hook exported');