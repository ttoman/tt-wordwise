console.log('🔄 ReadabilityScore: Module loaded');

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
 */
export function calculateFleschKincaidGrade(text: string): number {
  console.log('🔄 ReadabilityScore: Calculating Flesch-Kincaid grade');

  if (!text || text.trim().length === 0) {
    return 0;
  }

  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countSyllables(text);

  if (words === 0 || sentences === 0) {
    return 0;
  }

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  console.log(`📊 ReadabilityScore: Grade ${grade.toFixed(1)} (${words} words, ${sentences} sentences, ${syllables} syllables)`);

  return Math.max(0, Math.round(grade * 10) / 10); // Round to 1 decimal place, minimum 0
}

/**
 * Calculate Flesch Reading Ease Score
 * Formula: 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
 */
export function calculateFleschReadingEase(text: string): number {
  console.log('🔄 ReadabilityScore: Calculating Flesch Reading Ease');

  if (!text || text.trim().length === 0) {
    return 0;
  }

  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countSyllables(text);

  if (words === 0 || sentences === 0) {
    return 0;
  }

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  console.log(`📊 ReadabilityScore: Reading Ease ${score.toFixed(1)}`);

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10)); // Round to 1 decimal, clamp 0-100
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  // Split by sentence endings, filter out empty strings
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  return Math.max(1, sentences.length); // Minimum 1 sentence to avoid division by zero
}

/**
 * Count syllables in text (approximate)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);

  let totalSyllables = 0;

  for (const word of words) {
    totalSyllables += countSyllablesInWord(word);
  }

  return Math.max(totalSyllables, words.length); // Minimum 1 syllable per word
}

/**
 * Count syllables in a single word (approximate algorithm)
 */
function countSyllablesInWord(word: string): number {
  // Remove punctuation and convert to lowercase
  const cleanWord = word.replace(/[^a-z]/gi, '').toLowerCase();

  if (cleanWord.length === 0) return 0;
  if (cleanWord.length <= 3) return 1;

  // Count vowel groups
  let syllables = 0;
  let previousWasVowel = false;
  const vowels = 'aeiouy';

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);

    if (isVowel && !previousWasVowel) {
      syllables++;
    }

    previousWasVowel = isVowel;
  }

  // Handle silent 'e' at the end
  if (cleanWord.endsWith('e') && syllables > 1) {
    syllables--;
  }

  // Special cases for common endings
  if (cleanWord.endsWith('le') && cleanWord.length > 2 && !vowels.includes(cleanWord[cleanWord.length - 3])) {
    syllables++;
  }

  return Math.max(1, syllables); // Minimum 1 syllable per word
}

/**
 * Get readability interpretation
 */
export function getReadabilityInterpretation(grade: number): {
  level: string;
  description: string;
  color: 'green' | 'yellow' | 'red';
} {
  if (grade <= 8) {
    return {
      level: 'Easy',
      description: 'Easy to read (8th grade and below)',
      color: 'green'
    };
  } else if (grade <= 12) {
    return {
      level: 'Moderate',
      description: 'Moderate difficulty (9th-12th grade)',
      color: 'yellow'
    };
  } else {
    return {
      level: 'Difficult',
      description: 'Difficult to read (college level and above)',
      color: 'red'
    };
  }
}

/**
 * Calculate comprehensive readability metrics
 */
export interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  interpretation: ReturnType<typeof getReadabilityInterpretation>;
  wordCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
}

export function calculateReadabilityMetrics(text: string): ReadabilityMetrics {
  console.log('🔄 ReadabilityScore: Calculating comprehensive metrics');

  const fleschKincaidGrade = calculateFleschKincaidGrade(text);
  const fleschReadingEase = calculateFleschReadingEase(text);
  const interpretation = getReadabilityInterpretation(fleschKincaidGrade);

  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const averageWordsPerSentence = sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;

  const metrics = {
    fleschKincaidGrade,
    fleschReadingEase,
    interpretation,
    wordCount,
    sentenceCount,
    averageWordsPerSentence
  };

  console.log('📊 ReadabilityScore: Metrics calculated', metrics);

  return metrics;
}