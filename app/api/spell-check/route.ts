import { NextRequest, NextResponse } from 'next/server';
import nspell from 'nspell';

console.log('🔄 SpellCheck API: Route loaded');

// Global spell checker instance for performance
let spellChecker: nspell.Nspell | null = null;
let isInitializing = false;

/**
 * Initialize spell checker on the server side
 */
async function initializeSpellChecker(): Promise<nspell.Nspell> {
  if (spellChecker) {
    return spellChecker;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return spellChecker!;
  }

  isInitializing = true;

  try {
    console.log('📦 SpellCheck API: Loading dictionary files (server-side)');

    const dictionaryEn = await import('dictionary-en');
    spellChecker = nspell(dictionaryEn.default);

    console.log('✅ SpellCheck API: Spell checker initialized successfully');
    return spellChecker;
  } catch (error) {
    console.error('❌ SpellCheck API: Failed to initialize spell checker:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Clean a word for spell checking
 */
function cleanWord(word: string): string {
  return word.replace(/[^\w'-]/g, '');
}

/**
 * POST /api/spell-check
 * Check words for spelling and return suggestions
 */
export async function POST(request: NextRequest) {
  console.log('🔄 SpellCheck API: POST request received');

  try {
    const { words }: { words: string[] } = await request.json();

    if (!Array.isArray(words)) {
      console.error('❌ SpellCheck API: Invalid request - words must be an array');
      return NextResponse.json(
        { error: 'Invalid request - words must be an array' },
        { status: 400 }
      );
    }

    // Initialize spell checker
    const checker = await initializeSpellChecker();

    const results = words.map(word => {
      const cleanedWord = cleanWord(word);

      if (!cleanedWord) {
        return {
          word,
          isCorrect: true,
          suggestions: []
        };
      }

      const isCorrect = checker.correct(cleanedWord);
      const suggestions = isCorrect ? [] : checker.suggest(cleanedWord).slice(0, 5);

      console.log(`📝 SpellCheck API: Word "${cleanedWord}" is ${isCorrect ? 'correct' : 'incorrect'}`);
      if (!isCorrect) {
        console.log(`💡 SpellCheck API: Suggestions for "${cleanedWord}":`, suggestions);
      }

      return {
        word,
        isCorrect,
        suggestions
      };
    });

    console.log(`✅ SpellCheck API: Processed ${words.length} words`);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ SpellCheck API: Error:', error);
    return NextResponse.json(
      { error: 'Failed to check spelling' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/spell-check/health
 * Health check endpoint
 */
export async function GET() {
  console.log('🔄 SpellCheck API: Health check');

  try {
    await initializeSpellChecker();

    return NextResponse.json({
      success: true,
      message: 'Spell checker is ready',
      ready: spellChecker !== null
    });
  } catch (error) {
    console.error('❌ SpellCheck API: Health check failed:', error);
    return NextResponse.json(
      { error: 'Spell checker initialization failed' },
      { status: 500 }
    );
  }
}

console.log('✅ SpellCheck API: Route exported');