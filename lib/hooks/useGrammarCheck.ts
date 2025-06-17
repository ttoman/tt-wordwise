'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GrammarCheckResult,
  GrammarSuggestion,
  DebouncedGrammarChecker,
  extractCurrentSentence
} from '@/lib/grammarCheck';

console.log('🔄 useGrammarCheck: Hook module loaded');

export interface UseGrammarCheckReturn {
  suggestions: GrammarSuggestion[];
  isChecking: boolean;
  error: string | null;
  score: number;
  improvedScore: number;
  readabilityGrade: number | null;
  costInfo: {
    totalCost: number;
    remainingBudget: number;
    resetTime: number;
  } | null;
  checkGrammar: (text: string, cursorPosition?: number) => void;
  applySuggestion: (suggestionIndex: number, newText: string) => void;
  dismissSuggestion: (suggestionIndex: number) => void;
  clearSuggestions: () => void;
}

/**
 * Custom hook for grammar and style checking
 * Provides debounced grammar checking with suggestion management
 */
export function useGrammarCheck(): UseGrammarCheckReturn {
  console.log('🔄 useGrammarCheck: Hook initialized');

  const [suggestions, setSuggestions] = useState<GrammarSuggestion[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [improvedScore, setImprovedScore] = useState(0);
  const [readabilityGrade, setReadabilityGrade] = useState<number | null>(null);
  const [costInfo, setCostInfo] = useState<{
    totalCost: number;
    remainingBudget: number;
    resetTime: number;
  } | null>(null);

  const grammarCheckerRef = useRef<DebouncedGrammarChecker | null>(null);

  // Initialize debounced grammar checker
  useEffect(() => {
    console.log('🔄 useGrammarCheck: Initializing debounced grammar checker');

    const handleResult = (result: GrammarCheckResult) => {
      console.log(`✅ useGrammarCheck: Received ${result.suggestions.length} grammar suggestions`);
      setSuggestions(result.suggestions);
      setScore(result.score);
      setImprovedScore(result.improved_score);
      setReadabilityGrade(result.flesch_kincaid_grade || null);
      setIsChecking(false);
      setError(null);

      // Log suggestions for debugging
      result.suggestions.forEach((suggestion, index) => {
        console.log(`💡 useGrammarCheck: Suggestion ${index + 1}: "${suggestion.original}" → "${suggestion.suggestion}" (${suggestion.type})`);
      });

      // Log readability grade
      if (result.flesch_kincaid_grade) {
        console.log(`📊 useGrammarCheck: Readability grade from GPT: ${result.flesch_kincaid_grade}`);
      }
    };

    const handleError = (errorMessage: string) => {
      console.error('❌ useGrammarCheck: Grammar check error:', errorMessage);
      setError(errorMessage);
      setIsChecking(false);
    };

    grammarCheckerRef.current = new DebouncedGrammarChecker(handleResult, handleError);

    // Update cost info initially
    setCostInfo(grammarCheckerRef.current.getCostInfo());

    return () => {
      console.log('🔄 useGrammarCheck: Cleaning up grammar checker');
      grammarCheckerRef.current?.destroy();
    };
  }, []);

  // Check grammar for given text
  const checkGrammar = useCallback((text: string, cursorPosition: number = text.length) => {
    if (!grammarCheckerRef.current) {
      console.warn('⚠️ useGrammarCheck: Grammar checker not initialized');
      return;
    }

    if (!text || text.trim().length === 0) {
      console.log('🔄 useGrammarCheck: Empty text, clearing suggestions');
      setSuggestions([]);
      setScore(0);
      setImprovedScore(0);
      return;
    }

    console.log(`🔍 useGrammarCheck: Checking grammar for text (${text.length} chars, cursor at ${cursorPosition})`);

    // Extract current sentence based on cursor position
    const sentence = extractCurrentSentence(text, cursorPosition);

    if (!sentence || sentence.trim().length < 10) {
      console.log('🔄 useGrammarCheck: Sentence too short, skipping check');
      return;
    }

    setIsChecking(true);
    setError(null);

    // Update cost info
    setCostInfo(grammarCheckerRef.current.getCostInfo());

    // Schedule the grammar check
    grammarCheckerRef.current.scheduleCheck(sentence, text);
  }, []);

  // Apply a grammar suggestion
  const applySuggestion = useCallback((suggestionIndex: number, newText: string) => {
    console.log(`✅ useGrammarCheck: Applying suggestion ${suggestionIndex}: "${newText}"`);

    if (suggestionIndex < 0 || suggestionIndex >= suggestions.length) {
      console.warn('⚠️ useGrammarCheck: Invalid suggestion index');
      return;
    }

    const suggestion = suggestions[suggestionIndex];
    console.log(`✅ useGrammarCheck: Applied "${suggestion.original}" → "${suggestion.suggestion}"`);

    // Remove the applied suggestion
    setSuggestions(current => current.filter((_, index) => index !== suggestionIndex));
  }, [suggestions]);

  // Dismiss a suggestion without applying it
  const dismissSuggestion = useCallback((suggestionIndex: number) => {
    console.log(`🚫 useGrammarCheck: Dismissing suggestion ${suggestionIndex}`);

    if (suggestionIndex < 0 || suggestionIndex >= suggestions.length) {
      console.warn('⚠️ useGrammarCheck: Invalid suggestion index');
      return;
    }

    setSuggestions(current => current.filter((_, index) => index !== suggestionIndex));
  }, [suggestions]);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    console.log('🔄 useGrammarCheck: Clearing all suggestions');
    setSuggestions([]);
    setScore(0);
    setImprovedScore(0);
    setReadabilityGrade(null);
    setError(null);

    // Cancel any pending checks
    grammarCheckerRef.current?.cancel();
  }, []);

  console.log('📊 useGrammarCheck: Current state', {
    suggestionsCount: suggestions.length,
    isChecking,
    hasError: !!error,
    score,
    improvedScore,
    totalCost: costInfo?.totalCost || 0
  });

  return {
    suggestions,
    isChecking,
    error,
    score,
    improvedScore,
    readabilityGrade,
    costInfo,
    checkGrammar,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions
  };
}

/**
 * Hook for triggering grammar checks on idle (2 second debounce)
 * Implements the requirement to check grammar after 2 seconds of idle time
 */
export function useGrammarCheckOnIdle(
  onGrammarCheck: (text: string, cursorPosition: number) => void,
  getText: () => string,
  getCursorPosition: () => number
) {
  console.log('🔄 useGrammarCheckOnIdle: Hook initialized');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef<string>('');

  const scheduleGrammarCheck = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new check after 2 seconds of idle
    timeoutRef.current = setTimeout(() => {
      const currentText = getText();
      const cursorPosition = getCursorPosition();

      // Only check if text has changed
      if (currentText !== lastTextRef.current) {
        console.log('⏰ useGrammarCheckOnIdle: Triggering grammar check after idle period');
        lastTextRef.current = currentText;
        onGrammarCheck(currentText, cursorPosition);
      }
    }, 2000); // 2 second debounce as per requirements
  }, [onGrammarCheck, getText, getCursorPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        console.log('🔄 useGrammarCheckOnIdle: Cleaning up timeout');
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return scheduleGrammarCheck;
}

console.log('✅ useGrammarCheck: Hook module exported');