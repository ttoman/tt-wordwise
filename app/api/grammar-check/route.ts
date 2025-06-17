import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

console.log('🔄 GrammarCheck API: Route loaded');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting and cost tracking
const THROTTLE_INTERVAL = 2000; // 2 seconds between calls
const MAX_REQUESTS_PER_MINUTE = 20; // Conservative limit
const lastRequestTimes = new Map<string, number>();
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

/**
 * Check if request should be throttled
 */
function isThrottled(clientId: string): boolean {
  const now = Date.now();
  const lastRequest = lastRequestTimes.get(clientId);

  if (lastRequest && (now - lastRequest) < THROTTLE_INTERVAL) {
    console.log(`⏱️ GrammarCheck API: Request from ${clientId} throttled (${now - lastRequest}ms ago)`);
    return true;
  }

  // Check rate limit
  const requestData = requestCounts.get(clientId);
  if (requestData) {
    if (now > requestData.resetTime) {
      // Reset counter
      requestCounts.set(clientId, { count: 0, resetTime: now + 60000 });
    } else if (requestData.count >= MAX_REQUESTS_PER_MINUTE) {
      console.log(`🚫 GrammarCheck API: Rate limit exceeded for ${clientId}`);
      return true;
    }
  } else {
    requestCounts.set(clientId, { count: 0, resetTime: now + 60000 });
  }

  return false;
}

/**
 * Update request tracking
 */
function updateRequestTracking(clientId: string): void {
  const now = Date.now();
  lastRequestTimes.set(clientId, now);

  const requestData = requestCounts.get(clientId);
  if (requestData) {
    requestData.count++;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 GrammarCheck API: Processing grammar check request');

  try {
    const clientId = getClientId(request);

    // Check throttling
    if (isThrottled(clientId)) {
      return NextResponse.json(
        {
          error: 'Rate limited. Please wait before making another request.',
          retryAfter: THROTTLE_INTERVAL
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { text, sentence } = body;

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      console.warn('⚠️ GrammarCheck API: Invalid sentence provided');
      return NextResponse.json(
        { error: 'Valid sentence is required' },
        { status: 400 }
      );
    }

    // Limit sentence length to control costs
    if (sentence.length > 500) {
      console.warn('⚠️ GrammarCheck API: Sentence too long, truncating');
      // Truncate but try to keep complete words
      const truncated = sentence.substring(0, 497) + '...';
      return NextResponse.json(
        {
          error: 'Sentence too long. Please check shorter segments.',
          truncated
        },
        { status: 400 }
      );
    }

    console.log(`📝 GrammarCheck API: Analyzing sentence (${sentence.length} chars)`);

    updateRequestTracking(clientId);

    // Call GPT-4o mini for grammar and style analysis
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional writing assistant. Analyze the given sentence for grammar, style, and clarity improvements.

IMPORTANT: Never use hyphens in your suggestions or explanations.

Return a JSON response with this exact structure:
{
  "suggestions": [
    {
      "type": "grammar" | "style" | "clarity",
      "original": "exact text to replace",
      "suggestion": "improved text",
      "reason": "brief explanation without hyphens"
    }
  ],
  "score": number from 0-100 (current quality),
  "improved_score": number from 0-100 (after improvements),
  "flesch_kincaid_grade": number (estimated grade level for readability)
}

Calculate the Flesch Kincaid grade level using standard formula or estimate based on sentence complexity. If no improvements are needed, return empty suggestions array with current score and readability grade.`
        },
        {
          role: 'user',
          content: `Please analyze this sentence: "${sentence}"`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ GrammarCheck API: Analysis completed in ${duration}ms`);

    // Parse the response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from GPT-4o mini');
    }

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ GrammarCheck API: Failed to parse GPT response:', parseError);
      throw new Error('Invalid response format from GPT-4o mini');
    }

    // Validate response structure
    if (!analysis.suggestions || !Array.isArray(analysis.suggestions)) {
      console.error('❌ GrammarCheck API: Invalid analysis structure');
      throw new Error('Invalid analysis structure');
    }

    // Calculate cost estimate (approximate)
    const inputTokens = Math.ceil(sentence.length / 4); // rough estimation
    const outputTokens = Math.ceil(responseText.length / 4);
    const estimatedCost = (inputTokens * 0.000150 + outputTokens * 0.000600) / 1000; // GPT-4o mini pricing

    console.log(`💰 GrammarCheck API: Estimated cost: $${estimatedCost.toFixed(6)}`);
    console.log(`📊 GrammarCheck API: Found ${analysis.suggestions.length} suggestions`);

    return NextResponse.json({
      suggestions: analysis.suggestions,
      score: analysis.score || 0,
      improved_score: analysis.improved_score || 0,
      flesch_kincaid_grade: analysis.flesch_kincaid_grade || null,
      metadata: {
        duration,
        estimatedCost,
        inputTokens,
        outputTokens,
        sentenceLength: sentence.length
      }
    });

  } catch (error) {
    console.error('❌ GrammarCheck API: Error processing request:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze text. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export runtime config for Edge
export const runtime = 'edge';

console.log('✅ GrammarCheck API: Route exported');