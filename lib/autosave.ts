'use client';

import { documentService, UpdateDocumentData } from '@/lib/documentService';

console.log('🔄 Autosave engine loaded');

// Autosave configuration
const AUTOSAVE_DELAY = 10 * 1000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const MIN_CONTENT_CHANGE_LENGTH = 5; // Minimum content change to trigger save

// Autosave status types
export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface AutosaveState {
  status: AutosaveStatus;
  lastSaved?: Date;
  error?: string;
  isDirty: boolean;
}

// Custom events for autosave
export const AUTOSAVE_EVENTS = {
  STATUS_CHANGED: 'autosave:status-changed',
  DOC_SAVED: 'doc:saved',
  SAVE_ERROR: 'autosave:error',
} as const;

class AutosaveEngine {
  private timers = new Map<string, NodeJS.Timeout>();
  private retryAttempts = new Map<string, number>();
  private states = new Map<string, AutosaveState>();
  private lastContent = new Map<string, string>();
  private lastTitle = new Map<string, string>();
  private pendingSaves = new Map<string, boolean>();

  constructor() {
    console.log('✅ AutosaveEngine: Initialized');
  }

  /**
   * Get current autosave state for a document
   */
  getState(documentId: string): AutosaveState {
    return this.states.get(documentId) || {
      status: 'idle',
      isDirty: false,
    };
  }

  /**
   * Update state and emit event
   */
  private setState(documentId: string, updates: Partial<AutosaveState>) {
    const currentState = this.getState(documentId);
    const newState = { ...currentState, ...updates };
    this.states.set(documentId, newState);

    console.log('📊 AutosaveEngine: State updated for', documentId, newState);

    // Emit status change event
    const event = new CustomEvent(AUTOSAVE_EVENTS.STATUS_CHANGED, {
      detail: { documentId, state: newState }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit document saved event
   */
  private emitDocSaved(documentId: string) {
    console.log('✅ AutosaveEngine: Emitting doc:saved event for', documentId);

    const event = new CustomEvent(AUTOSAVE_EVENTS.DOC_SAVED, {
      detail: { documentId, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit save error event
   */
  private emitSaveError(documentId: string, error: string) {
    console.log('❌ AutosaveEngine: Emitting save error event for', documentId, error);

    const event = new CustomEvent(AUTOSAVE_EVENTS.SAVE_ERROR, {
      detail: { documentId, error, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if content has changed significantly (dirty state detection)
   */
  private isDirty(documentId: string, data: UpdateDocumentData): boolean {
    const lastSavedContent = this.lastContent.get(documentId) || '';
    const lastSavedTitle = this.lastTitle.get(documentId) || '';

    const currentContent = data.content !== undefined ? data.content : lastSavedContent;
    const currentTitle = data.title !== undefined ? data.title : lastSavedTitle;

    // Check if title has changed
    const titleChanged = currentTitle !== lastSavedTitle;

    // Check if content has changed significantly
    let contentChanged = false;
    if (data.content !== undefined) {
      const contentDiff = Math.abs(currentContent.length - lastSavedContent.length);
      contentChanged = currentContent !== lastSavedContent &&
                      (contentDiff >= MIN_CONTENT_CHANGE_LENGTH || currentTitle !== lastSavedTitle);
    }

    const isDirty = titleChanged || contentChanged;

    console.log('🔍 AutosaveEngine: Dirty check for', documentId, {
      isDirty,
      titleChanged,
      contentChanged,
      currentContentLength: currentContent.length,
      lastSavedContentLength: lastSavedContent.length
    });

    return isDirty;
  }

  /**
   * Schedule an autosave with debouncing
   */
  scheduleAutosave(documentId: string, data: UpdateDocumentData): void {
    console.log('🔄 AutosaveEngine: Scheduling autosave for', documentId);

    // Skip if there's already a pending save operation
    if (this.pendingSaves.get(documentId)) {
      console.log('⏭️ AutosaveEngine: Save already in progress, skipping for', documentId);
      return;
    }

    // Check if content is dirty
    const dirty = this.isDirty(documentId, data);

    if (!dirty) {
      console.log('⏭️ AutosaveEngine: Content unchanged, skipping autosave for', documentId);
      this.setState(documentId, { isDirty: false, status: 'idle' });
      return;
    }

    // Update dirty state
    this.setState(documentId, { isDirty: true, status: 'pending' });

    // Clear existing timer
    const existingTimer = this.timers.get(documentId);
    if (existingTimer) {
      console.log('⏰ AutosaveEngine: Clearing existing timer for', documentId);
      clearTimeout(existingTimer);
    }

    // Schedule new autosave
    console.log(`⏰ AutosaveEngine: Scheduling autosave in ${AUTOSAVE_DELAY}ms for`, documentId);
    const timer = setTimeout(() => {
      this.performAutosave(documentId, data);
    }, AUTOSAVE_DELAY);

    this.timers.set(documentId, timer);
  }

  /**
   * Perform the actual autosave with retry logic
   */
  private async performAutosave(documentId: string, data: UpdateDocumentData): Promise<void> {
    console.log('💾 AutosaveEngine: Performing autosave for', documentId);

    // Mark save as in progress
    this.pendingSaves.set(documentId, true);
    this.setState(documentId, { status: 'saving' });

    try {
      const result = await documentService.saveDoc(documentId, data);

      if (result.success && result.data) {
        console.log('✅ AutosaveEngine: Autosave successful for', documentId);

        // Update last saved content and title
        if (data.content !== undefined) {
          this.lastContent.set(documentId, data.content);
        }
        if (data.title !== undefined) {
          this.lastTitle.set(documentId, data.title);
        }

        // Reset retry attempts
        this.retryAttempts.delete(documentId);

        // Update state
        this.setState(documentId, {
          status: 'saved',
          lastSaved: new Date(),
          isDirty: false,
          error: undefined
        });

        // Emit success event
        this.emitDocSaved(documentId);

        // Auto-transition to idle after 3 seconds
        setTimeout(() => {
          const currentState = this.getState(documentId);
          if (currentState.status === 'saved') {
            this.setState(documentId, { status: 'idle' });
          }
        }, 3000);

      } else {
        throw new Error(result.error || 'Unknown autosave error');
      }

    } catch (error) {
      console.error('❌ AutosaveEngine: Autosave failed for', documentId, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const currentAttempts = this.retryAttempts.get(documentId) || 0;

      if (currentAttempts < MAX_RETRY_ATTEMPTS) {
        // Schedule retry with exponential backoff
        const retryDelay = RETRY_DELAY_BASE * Math.pow(2, currentAttempts);
        console.log(`🔄 AutosaveEngine: Scheduling retry ${currentAttempts + 1}/${MAX_RETRY_ATTEMPTS} in ${retryDelay}ms for`, documentId);

        this.retryAttempts.set(documentId, currentAttempts + 1);

        setTimeout(() => {
          this.performAutosave(documentId, data);
        }, retryDelay);

        this.setState(documentId, {
          status: 'pending',
          error: `Retrying... (${currentAttempts + 1}/${MAX_RETRY_ATTEMPTS})`
        });
      } else {
        // Max retries exceeded
        console.error('💥 AutosaveEngine: Max retries exceeded for', documentId);

        this.setState(documentId, {
          status: 'error',
          error: errorMessage,
          isDirty: true
        });

        this.emitSaveError(documentId, errorMessage);
        this.retryAttempts.delete(documentId);
        // Clear pending save flag to allow future save attempts
        this.pendingSaves.set(documentId, false);
      }
    } finally {
      // Clear pending save flag unless we're in retry mode
      const isRetrying = this.retryAttempts.get(documentId) || 0 > 0;
      if (!isRetrying) {
        this.pendingSaves.set(documentId, false);
      }
    }
  }

  /**
   * Force immediate save (manual save)
   */
  async forceSave(documentId: string, data: UpdateDocumentData): Promise<boolean> {
    console.log('⚡ AutosaveEngine: Force saving', documentId);

    // Clear any pending autosave
    this.cancelAutosave(documentId);

    // Perform immediate save
    this.setState(documentId, { status: 'saving' });

    try {
      await this.performAutosave(documentId, data);
      return true;
    } catch (error) {
      console.error('❌ AutosaveEngine: Force save failed for', documentId, error);
      return false;
    }
  }

  /**
   * Cancel pending autosave
   */
  cancelAutosave(documentId: string): void {
    console.log('🚫 AutosaveEngine: Canceling autosave for', documentId);

    const timer = this.timers.get(documentId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(documentId);
    }

    const currentState = this.getState(documentId);
    if (currentState.status === 'pending') {
      this.setState(documentId, { status: 'idle' });
    }
  }

  /**
   * Initialize document for autosave tracking
   */
  initializeDocument(documentId: string, initialContent: string = ''): void {
    console.log('🎯 AutosaveEngine: Initializing document', documentId);

    this.lastContent.set(documentId, initialContent);
    this.lastTitle.set(documentId, '');
    this.pendingSaves.set(documentId, false);
    this.setState(documentId, {
      status: 'idle',
      isDirty: false,
      lastSaved: new Date(),
    });
  }

  /**
   * Cleanup document resources
   */
  cleanup(documentId: string): void {
    console.log('🧹 AutosaveEngine: Cleaning up document', documentId);

    this.cancelAutosave(documentId);
    this.states.delete(documentId);
    this.lastContent.delete(documentId);
    this.lastTitle.delete(documentId);
    this.retryAttempts.delete(documentId);
    this.pendingSaves.delete(documentId);
  }

  /**
   * Get statistics for debugging
   */
  getStats(): {
    activeTimers: number;
    trackedDocuments: number;
    retryingDocuments: number;
    pendingSaves: number;
  } {
    return {
      activeTimers: this.timers.size,
      trackedDocuments: this.states.size,
      retryingDocuments: this.retryAttempts.size,
      pendingSaves: [...this.pendingSaves.values()].filter(Boolean).length
    };
  }
}

// Export singleton instance
export const autosaveEngine = new AutosaveEngine();

console.log('✅ AutosaveEngine: Singleton exported');