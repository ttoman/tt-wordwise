console.log('🔄 GrammarCheck: Service module loaded');

// Types for grammar checking
export interface GrammarSuggestion {
  type: 'grammar' | 'style' | 'clarity';
  original: string;
  suggestion: string;
  reason: string;
}

export interface GrammarCheckResult {
  suggestions: GrammarSuggestion[];
  score: number;
  improved_score: number;
  flesch_kincaid_grade?: number | null;
  metadata?: {
    duration: number;
    estimatedCost: number;
    inputTokens: number;
    outputTokens: number;
    sentenceLength: number;
  };
}

export interface GrammarCheckError {
  error: string;
  details?: string;
  retryAfter?: number;
}

// Global state for throttling and cost tracking
let lastRequestTime = 0;
let totalCost = 0;
let requestCount = 0;

// Constants
const THROTTLE_INTERVAL = 2000; // 2 seconds minimum between requests
const DEBOUNCE_INTERVAL = 2000; // 2 seconds idle before checking
const MAX_COST_PER_HOUR = 0.10; // $0.10 per hour limit
const COST_TRACKING_KEY = 'grammarCheck_costTracking';
const CACHE_KEY = 'grammarCheck_cache';
const MAX_CACHE_SIZE = 100; // Maximum number of cached results

// Cache types
interface CachedGrammarResult {
  timestamp: number;
  suggestions: GrammarSuggestion[];
  score: number;
  improved_score: number;
  flesch_kincaid_grade?: number | null;
}

interface GrammarCache {
  [hash: string]: CachedGrammarResult;
}

/**
 * Get stored cost tracking data
 */
function getCostTrackingData(): { totalCost: number; resetTime: number } {
  if (typeof window === 'undefined') {
    return { totalCost: 0, resetTime: Date.now() + 3600000 };
  }

  try {
    const stored = localStorage.getItem(COST_TRACKING_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if more than an hour has passed
      if (Date.now() > data.resetTime) {
        return { totalCost: 0, resetTime: Date.now() + 3600000 };
      }
      return data;
    }
  } catch (error) {
    console.error('❌ GrammarCheck: Error reading cost tracking data:', error);
  }

  return { totalCost: 0, resetTime: Date.now() + 3600000 };
}

/**
 * Update stored cost tracking data
 */
function updateCostTrackingData(cost: number): void {
  if (typeof window === 'undefined') return;

  try {
    const currentData = getCostTrackingData();
    const newData = {
      totalCost: currentData.totalCost + cost,
      resetTime: currentData.resetTime
    };

    localStorage.setItem(COST_TRACKING_KEY, JSON.stringify(newData));
    totalCost = newData.totalCost;

    console.log(`💰 GrammarCheck: Updated total cost: $${totalCost.toFixed(6)}`);
  } catch (error) {
    console.error('❌ GrammarCheck: Error updating cost tracking:', error);
  }
}

/**
 * Check if cost limit has been exceeded
 */
function isCostLimitExceeded(): boolean {
  const data = getCostTrackingData();
  const exceeded = data.totalCost >= MAX_COST_PER_HOUR;

  if (exceeded) {
    console.warn(`⚠️ GrammarCheck: Cost limit exceeded: $${data.totalCost.toFixed(6)} >= $${MAX_COST_PER_HOUR}`);
  }

  return exceeded;
}

/**
 * Check if request should be throttled
 */
function isThrottled(): boolean {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < THROTTLE_INTERVAL) {
    console.log(`⏱️ GrammarCheck: Request throttled (${timeSinceLastRequest}ms since last request)`);
    return true;
  }

  return false;
}

/**
 * Simple hash function for sentence caching
 */
function hashSentence(sentence: string): string {
  let hash = 0;
  const cleanSentence = sentence.trim().toLowerCase();

  for (let i = 0; i < cleanSentence.length; i++) {
    const char = cleanSentence.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Get cached grammar check result
 */
function getCachedResult(sentence: string): GrammarCheckResult | null {
  if (typeof window === 'undefined') return null;

  try {
    const cacheData = localStorage.getItem(CACHE_KEY);
    if (!cacheData) return null;

    const cache: GrammarCache = JSON.parse(cacheData);
    const hash = hashSentence(sentence);
    const cached = cache[hash];

    if (cached && cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 hour cache
      console.log(`✅ GrammarCheck: Using cached result for sentence hash ${hash}`);
      return {
        suggestions: cached.suggestions,
        score: cached.score,
        improved_score: cached.improved_score,
        flesch_kincaid_grade: cached.flesch_kincaid_grade
      };
    }
  } catch (error) {
    console.error('❌ GrammarCheck: Error reading cache:', error);
  }

  return null;
}

/**
 * Cache grammar check result
 */
function cacheResult(sentence: string, result: GrammarCheckResult): void {
  if (typeof window === 'undefined') return;

    try {
    let cache: GrammarCache = {};
    const cacheData = localStorage.getItem(CACHE_KEY);

    if (cacheData) {
      cache = JSON.parse(cacheData) as GrammarCache;
    }

    const hash = hashSentence(sentence);

    // Add new result to cache
    cache[hash] = {
      timestamp: Date.now(),
      suggestions: result.suggestions,
      score: result.score,
      improved_score: result.improved_score,
      flesch_kincaid_grade: result.flesch_kincaid_grade
    };

    // Limit cache size
    const cacheKeys = Object.keys(cache);
    if (cacheKeys.length > MAX_CACHE_SIZE) {
      // Remove oldest entries
      const sortedEntries = cacheKeys
        .map(key => ({ key, timestamp: cache[key].timestamp }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Keep only the most recent MAX_CACHE_SIZE entries
      const toKeep = sortedEntries.slice(-MAX_CACHE_SIZE);
      const newCache: GrammarCache = {};
      toKeep.forEach(entry => {
        newCache[entry.key] = cache[entry.key];
      });
      cache = newCache;
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`💾 GrammarCheck: Cached result for sentence hash ${hash}`);
  } catch (error) {
    console.error('❌ GrammarCheck: Error writing cache:', error);
  }
}

/**
 * Extract sentence containing the cursor position
 */
export function extractCurrentSentence(text: string, cursorPosition: number): string {
  if (!text || cursorPosition < 0) return '';

  // Find sentence boundaries (., !, ?, or line breaks)
  const sentenceEnders = /[.!?\n]/g;
  const sentences: { start: number; end: number; text: string }[] = [];

  let lastEnd = 0;
  let match;

  while ((match = sentenceEnders.exec(text)) !== null) {
    const sentenceText = text.substring(lastEnd, match.index + 1).trim();
    if (sentenceText.length > 0) {
      sentences.push({
        start: lastEnd,
        end: match.index + 1,
        text: sentenceText
      });
    }
    lastEnd = match.index + 1;
  }

  // Add final sentence if text doesn't end with punctuation
  if (lastEnd < text.length) {
    const finalText = text.substring(lastEnd).trim();
    if (finalText.length > 0) {
      sentences.push({
        start: lastEnd,
        end: text.length,
        text: finalText
      });
    }
  }

  // Find sentence containing cursor position
  for (const sentence of sentences) {
    if (cursorPosition >= sentence.start && cursorPosition <= sentence.end) {
      console.log(`📝 GrammarCheck: Extracted sentence: "${sentence.text}" (${sentence.text.length} chars)`);
      return sentence.text;
    }
  }

  // If no sentence found, return a reasonable chunk around cursor
  const start = Math.max(0, cursorPosition - 100);
  const end = Math.min(text.length, cursorPosition + 100);
  const chunk = text.substring(start, end).trim();

  console.log(`📝 GrammarCheck: No sentence found, extracted chunk: "${chunk}" (${chunk.length} chars)`);
  return chunk;
}

/**
 * Check grammar and style for a given sentence
 */
export async function checkGrammar(
  sentence: string,
  fullText?: string
): Promise<GrammarCheckResult> {
  console.log('🔄 GrammarCheck: Starting grammar check');

  if (!sentence || sentence.trim().length === 0) {
    throw new Error('No sentence provided for grammar checking');
  }

  // Check cache first
  const cachedResult = getCachedResult(sentence);
  if (cachedResult) {
    console.log('✅ GrammarCheck: Using cached result, skipping API call');
    return cachedResult;
  }

  // Check cost limit
  if (isCostLimitExceeded()) {
    throw new Error('Hourly cost limit exceeded. Please wait before making more requests.');
  }

  // Check throttling
  if (isThrottled()) {
    const waitTime = THROTTLE_INTERVAL - (Date.now() - lastRequestTime);
    throw new Error(`Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`);
  }

  try {
    const startTime = Date.now();
    lastRequestTime = startTime;
    requestCount++;

    console.log(`📡 GrammarCheck: Making API request #${requestCount}`);

    const response = await fetch('/api/grammar-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentence: sentence.trim(),
        text: fullText
      }),
    });

    const endTime = Date.now();
    const requestDuration = endTime - startTime;

    console.log(`📡 GrammarCheck: API request completed in ${requestDuration}ms`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      if (response.status === 429) {
        throw new Error(`Rate limited: ${errorData.error}`);
      }

      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: GrammarCheckResult = await response.json();

    // Track cost
    if (result.metadata?.estimatedCost) {
      updateCostTrackingData(result.metadata.estimatedCost);
    }

    // Cache the result
    cacheResult(sentence, result);

    console.log(`✅ GrammarCheck: Received ${result.suggestions.length} suggestions`);
    console.log(`📊 GrammarCheck: Score: ${result.score} → ${result.improved_score}`);

    return result;

  } catch (error) {
    console.error('❌ GrammarCheck: Error during grammar check:', error);
    throw error;
  }
}

/**
 * Debounced grammar checker
 */
export class DebouncedGrammarChecker {
  private timeoutId: NodeJS.Timeout | null = null;
  private isChecking = false;
  private lastCheckedText = '';

  constructor(
    private onResult: (result: GrammarCheckResult) => void,
    private onError: (error: string) => void
  ) {
    console.log('🔄 DebouncedGrammarChecker: Instance created');
  }

  /**
   * Schedule a grammar check after the debounce interval
   */
  scheduleCheck(sentence: string, fullText?: string): void {
    // Don't check the same text again
    if (sentence === this.lastCheckedText) {
      console.log('🔄 DebouncedGrammarChecker: Skipping duplicate text');
      return;
    }

    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    console.log(`⏰ DebouncedGrammarChecker: Scheduling check for "${sentence.substring(0, 50)}..."`);

    this.timeoutId = setTimeout(async () => {
      if (this.isChecking) {
        console.log('🔄 DebouncedGrammarChecker: Already checking, skipping');
        return;
      }

      this.isChecking = true;
      this.lastCheckedText = sentence;

      try {
        console.log('🔍 DebouncedGrammarChecker: Starting grammar check');
        const result = await checkGrammar(sentence, fullText);
        this.onResult(result);
      } catch (error) {
        console.error('❌ DebouncedGrammarChecker: Error during check:', error);
        this.onError(error instanceof Error ? error.message : 'Grammar check failed');
      } finally {
        this.isChecking = false;
      }
    }, DEBOUNCE_INTERVAL);
  }

  /**
   * Cancel any pending grammar check
   */
  cancel(): void {
    if (this.timeoutId) {
      console.log('🚫 DebouncedGrammarChecker: Cancelling pending check');
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Get current cost tracking info
   */
  getCostInfo(): { totalCost: number; remainingBudget: number; resetTime: number } {
    const data = getCostTrackingData();
    return {
      totalCost: data.totalCost,
      remainingBudget: Math.max(0, MAX_COST_PER_HOUR - data.totalCost),
      resetTime: data.resetTime
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancel();
    console.log('🔄 DebouncedGrammarChecker: Instance destroyed');
  }
}

console.log('✅ GrammarCheck: Service module exported');