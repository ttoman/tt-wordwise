import nspell from 'nspell';

console.log('🔄 SpellCheck: Module loaded');

// Global spell checker instance
let spellChecker: nspell.Nspell | null = null;
let isLoading = false;
let loadPromise: Promise<nspell.Nspell> | null = null;

/**
 * Load and initialize the spell checker with English dictionary
 * This is an async operation that should be called early in the app lifecycle
 */
export async function initializeSpellChecker(): Promise<nspell.Nspell> {
  console.log('🔄 SpellCheck: Initializing spell checker');

  // Return existing instance if already loaded
  if (spellChecker) {
    console.log('✅ SpellCheck: Already initialized, returning existing instance');
    return spellChecker;
  }

  // Return existing promise if currently loading
  if (isLoading && loadPromise) {
    console.log('🔄 SpellCheck: Already loading, waiting for existing promise');
    return loadPromise;
  }

  isLoading = true;

  // Create load promise
  loadPromise = (async () => {
    try {
      console.log('📦 SpellCheck: Loading dictionary files');

      // Dynamic imports to load dictionary files
      const [dictionaryEn] = await Promise.all([
        import('dictionary-en')
      ]);

      console.log('📖 SpellCheck: Dictionary loaded, creating spell checker');

      // Initialize spell checker with dictionary
      const checker = nspell(dictionaryEn.default);

      console.log('✅ SpellCheck: Spell checker initialized successfully');
      spellChecker = checker;

      return checker;
    } catch (error) {
      console.error('❌ SpellCheck: Failed to initialize spell checker:', error);
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Check if a word is spelled correctly
 * @param word - The word to check
 * @returns true if the word is spelled correctly, false otherwise
 */
export function isWordCorrect(word: string): boolean {
  if (!spellChecker) {
    console.warn('⚠️ SpellCheck: Spell checker not initialized, assuming word is correct');
    return true;
  }

  if (!word || word.trim().length === 0) {
    return true;
  }

  // Clean the word (remove punctuation, etc.)
  const cleanWord = word.replace(/[^\w'-]/g, '');

  if (cleanWord.length === 0) {
    return true;
  }

  const isCorrect = spellChecker.correct(cleanWord);
  console.log(`📝 SpellCheck: Word "${cleanWord}" is ${isCorrect ? 'correct' : 'incorrect'}`);

  return isCorrect;
}

/**
 * Get spelling suggestions for a misspelled word
 * @param word - The misspelled word
 * @param maxSuggestions - Maximum number of suggestions to return (default: 5)
 * @returns Array of spelling suggestions
 */
export function getSpellingSuggestions(word: string, maxSuggestions: number = 5): string[] {
  if (!spellChecker) {
    console.warn('⚠️ SpellCheck: Spell checker not initialized, returning empty suggestions');
    return [];
  }

  if (!word || word.trim().length === 0) {
    return [];
  }

  // Clean the word
  const cleanWord = word.replace(/[^\w'-]/g, '');

  if (cleanWord.length === 0) {
    return [];
  }

  const suggestions = spellChecker.suggest(cleanWord).slice(0, maxSuggestions);
  console.log(`💡 SpellCheck: Generated ${suggestions.length} suggestions for "${cleanWord}":`, suggestions);

  return suggestions;
}

/**
 * Tokenize text into words for spell checking
 * @param text - The text to tokenize
 * @returns Array of word objects with position information
 */
export function tokenizeForSpellCheck(text: string): Array<{
  word: string;
  start: number;
  end: number;
}> {
  const words: Array<{
    word: string;
    start: number;
    end: number;
  }> = [];

  // Regular expression to match words (including contractions)
  const wordRegex = /\b[\w'-]+\b/g;
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  console.log(`📝 SpellCheck: Tokenized ${words.length} words from text`);
  return words;
}

/**
 * Check if the spell checker is ready to use
 * @returns true if the spell checker is initialized and ready
 */
export function isSpellCheckerReady(): boolean {
  const ready = spellChecker !== null;
  console.log(`🔍 SpellCheck: Checker is ${ready ? 'ready' : 'not ready'}`);
  return ready;
}

/**
 * Performance tracking for spell checking operations
 */
export class SpellCheckPerformanceTracker {
  private startTime: number = 0;
  private operationCount: number = 0;

  startOperation(): void {
    this.startTime = performance.now();
  }

  endOperation(): number {
    const duration = performance.now() - this.startTime;
    this.operationCount++;

    console.log(`⏱️ SpellCheck: Operation ${this.operationCount} took ${duration.toFixed(2)}ms`);

    // Warn if operation takes longer than 100ms as per plan requirements
    if (duration > 100) {
      console.warn(`⚠️ SpellCheck: Operation took ${duration.toFixed(2)}ms (exceeds 100ms target)`);
    }

    return duration;
  }

  getAverageTime(): number {
    // This is a simplified version - in production you'd want to track multiple operations
    return this.startTime > 0 ? performance.now() - this.startTime : 0;
  }
}

console.log('✅ SpellCheck: Module exported');