'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeSpellChecker,
  isWordCorrect,
  getSpellingSuggestions,
  tokenizeForSpellCheck,
  isSpellCheckerReady,
  SpellCheckPerformanceTracker
} from '@/lib/spellcheck';

console.log('🔄 useSpellCheck: Hook module loaded');

export interface SpellCheckError {
  word: string;
  start: number;
  end: number;
  suggestions: string[];
}

export interface UseSpellCheckReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  errors: SpellCheckError[];
  checkText: (text: string) => void;
  applySuggestion: (errorIndex: number, suggestion: string) => string;
  initError: string | null;
}

/**
 * Custom hook for integrating spell checking into text editors
 * Handles spell checker initialization and provides real-time spell checking
 */
export function useSpellCheck(): UseSpellCheckReturn {
  console.log('🔄 useSpellCheck: Hook initialized');

  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [errors, setErrors] = useState<SpellCheckError[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  // Performance tracking
  const performanceTracker = useRef(new SpellCheckPerformanceTracker());

  // Initialize spell checker on mount
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized || isInitializing) {
        console.log('🔄 useSpellCheck: Already initialized or initializing');
        return;
      }

      console.log('🔄 useSpellCheck: Starting initialization');
      setIsInitializing(true);
      setInitError(null);

      try {
        await initializeSpellChecker();
        console.log('✅ useSpellCheck: Spell checker initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ useSpellCheck: Failed to initialize spell checker:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize spell checker');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isInitialized, isInitializing]);

  // Check text for spelling errors
  const checkText = useCallback((text: string) => {
    if (!isSpellCheckerReady()) {
      console.warn('⚠️ useSpellCheck: Spell checker not ready, skipping check');
      return;
    }

    console.log('🔄 useSpellCheck: Checking text for spelling errors');
    performanceTracker.current.startOperation();

    try {
      const words = tokenizeForSpellCheck(text);
      const newErrors: SpellCheckError[] = [];

      for (const wordInfo of words) {
        if (!isWordCorrect(wordInfo.word)) {
          console.log(`❌ useSpellCheck: Found misspelled word: "${wordInfo.word}"`);

          const suggestions = getSpellingSuggestions(wordInfo.word, 5);

          newErrors.push({
            word: wordInfo.word,
            start: wordInfo.start,
            end: wordInfo.end,
            suggestions
          });
        }
      }

      console.log(`📊 useSpellCheck: Found ${newErrors.length} spelling errors`);
      setErrors(newErrors);
    } catch (error) {
      console.error('❌ useSpellCheck: Error during spell checking:', error);
    } finally {
      performanceTracker.current.endOperation();
    }
  }, []);

  // Apply a spelling suggestion
  const applySuggestion = useCallback((errorIndex: number, suggestion: string): string => {
    console.log(`🔄 useSpellCheck: Applying suggestion "${suggestion}" for error ${errorIndex}`);

    if (errorIndex < 0 || errorIndex >= errors.length) {
      console.warn('⚠️ useSpellCheck: Invalid error index');
      return '';
    }

    const error = errors[errorIndex];
    console.log(`✅ useSpellCheck: Applied suggestion "${suggestion}" for word "${error.word}"`);

    // Remove the corrected error from the list
    setErrors(current => current.filter((_, index) => index !== errorIndex));

    return suggestion;
  }, [errors]);

  console.log('📊 useSpellCheck: Current state', {
    isInitialized,
    isInitializing,
    errorsCount: errors.length,
    hasInitError: !!initError
  });

  return {
    isInitialized,
    isInitializing,
    errors,
    checkText,
    applySuggestion,
    initError
  };
}

/**
 * Hook for spell checking on spacebar press
 * Implements the requirement to check spelling when spacebar is pressed
 */
export function useSpellCheckOnSpace(
  onSpellCheck: (text: string) => void,
  getText: () => string
) {
  console.log('🔄 useSpellCheckOnSpace: Hook initialized');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for spacebar press
      if (event.code === 'Space' || event.key === ' ') {
        console.log('⌨️ useSpellCheckOnSpace: Spacebar pressed, triggering spell check');

        // Get current text and trigger spell check
        const currentText = getText();
        onSpellCheck(currentText);
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      console.log('🔄 useSpellCheckOnSpace: Cleaning up event listener');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSpellCheck, getText]);
}

console.log('✅ useSpellCheck: Hook module exported');