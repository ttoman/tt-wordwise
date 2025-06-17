console.log('🔄 SpellCheck: Module loaded');

// Cache for spell check results to avoid repeated API calls
const spellCheckCache = new Map<string, { isCorrect: boolean; suggestions: string[] }>();
const CACHE_MAX_SIZE = 1000;

/**
 * Initialize the spell checker - just a no-op for API version
 */
export async function initializeSpellChecker(): Promise<boolean> {
  console.log('🔄 SpellCheck: Using API-based spell checking');
  return true;
}

/**
 * Check if a word is spelled correctly using the API
 * @param word - The word to check
 * @returns true if the word is spelled correctly, false otherwise
 */
export async function isWordCorrect(word: string): Promise<boolean> {
  if (!word || word.trim().length === 0) {
    return true;
  }

  // Clean the word (remove punctuation, etc.)
  const cleanWord = word.replace(/[^\w'-]/g, '');

  if (cleanWord.length === 0) {
    return true;
  }

  // Check cache first
  if (spellCheckCache.has(cleanWord.toLowerCase())) {
    const cached = spellCheckCache.get(cleanWord.toLowerCase())!;
    console.log(`📝 SpellCheck: Word "${cleanWord}" found in cache: ${cached.isCorrect ? 'correct' : 'incorrect'}`);
    return cached.isCorrect;
  }

  try {
    const results = await checkWords([cleanWord]);
    const result = results[0];

    console.log(`📝 SpellCheck: Word "${cleanWord}" is ${result.isCorrect ? 'correct' : 'incorrect'}`);
    return result.isCorrect;
  } catch (error) {
    console.error('❌ SpellCheck: Error checking word:', error);
    // Return true on error to avoid marking all words as incorrect
    return true;
  }
}

/**
 * Get spelling suggestions for a misspelled word using the API
 * @param word - The misspelled word
 * @param maxSuggestions - Maximum number of suggestions to return (default: 5)
 * @returns Array of spelling suggestions
 */
export async function getSpellingSuggestions(word: string, maxSuggestions: number = 5): Promise<string[]> {
  if (!word || word.trim().length === 0) {
    return [];
  }

  // Clean the word
  const cleanWord = word.replace(/[^\w'-]/g, '');

  if (cleanWord.length === 0) {
    return [];
  }

  // Check cache first
  if (spellCheckCache.has(cleanWord.toLowerCase())) {
    const cached = spellCheckCache.get(cleanWord.toLowerCase())!;
    const suggestions = cached.suggestions.slice(0, maxSuggestions);
    console.log(`💡 SpellCheck: Suggestions for "${cleanWord}" from cache:`, suggestions);
    return suggestions;
  }

  try {
    const results = await checkWords([cleanWord]);
    const result = results[0];

    const suggestions = result.suggestions.slice(0, maxSuggestions);
    console.log(`💡 SpellCheck: Generated ${suggestions.length} suggestions for "${cleanWord}":`, suggestions);
    return suggestions;
  } catch (error) {
    console.error('❌ SpellCheck: Error getting suggestions:', error);
    return [];
  }
}

/**
 * Check multiple words at once for better performance
 * @param words - Array of words to check
 * @returns Array of results with word, isCorrect, and suggestions
 */
export async function checkWords(words: string[]): Promise<Array<{
  word: string;
  isCorrect: boolean;
  suggestions: string[];
}>> {
  if (words.length === 0) {
    return [];
  }

  console.log(`🔄 SpellCheck: Checking ${words.length} words via API`);

  try {
    const response = await fetch('/api/spell-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ SpellCheck: API error:', error);
      throw new Error(error.error || 'Failed to check spelling');
    }

    const result = await response.json();

    // Cache the results
    result.data.forEach((item: any) => {
      const cleanWord = item.word.replace(/[^\w'-]/g, '');
      if (cleanWord) {
        // Manage cache size
        if (spellCheckCache.size >= CACHE_MAX_SIZE) {
          const firstKey = spellCheckCache.keys().next().value;
          spellCheckCache.delete(firstKey);
        }

        spellCheckCache.set(cleanWord.toLowerCase(), {
          isCorrect: item.isCorrect,
          suggestions: item.suggestions
        });
      }
    });

    console.log(`✅ SpellCheck: Successfully checked ${result.data.length} words`);
    return result.data;
  } catch (error) {
    console.error('❌ SpellCheck: Failed to check words:', error);
    // Return safe defaults on error
    return words.map(word => ({
      word,
      isCorrect: true,
      suggestions: []
    }));
  }
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
 * @returns true since API-based spell checking is always ready
 */
export function isSpellCheckerReady(): boolean {
  console.log('🔍 SpellCheck: API-based checker is always ready');
  return true;
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