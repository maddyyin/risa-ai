import OpenAI from 'openai';

// Centralized configuration for Groq API
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const MAIN_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = 8000; // 8 seconds timeout to prevent application hanging

const groqApiKey = process.env.GROQ_API_KEY;

// Create a single instance of the OpenAI client pointing to Groq
const openai = groqApiKey
  ? new OpenAI({
      baseURL: GROQ_BASE_URL,
      apiKey: groqApiKey,
      timeout: DEFAULT_TIMEOUT_MS,
    })
  : null;

interface GenerateParams {
  prompt: string;
  systemPrompt?: string;
  isJson?: boolean;
  fallbackType?: 'chat' | 'insights';
}

/**
 * Centrally manages generating completions using Groq API.
 * Recovers gracefully from timeouts or API errors by returning supportive fallback responses.
 */
export async function generateAIResponse({
  prompt,
  systemPrompt = 'You are RISA, a calm, supportive, and emotionally intelligent behavioral consistency coach.',
  isJson = false,
  fallbackType = 'chat',
}: GenerateParams): Promise<string> {
  if (!openai) {
    console.warn('[AI Layer] GROQ_API_KEY is not configured. Utilizing local fallback.');
    return getFallbackResponse(fallbackType, isJson);
  }

  try {
    console.log(`[AI Layer] Attempting completion using Groq model: ${MAIN_MODEL}`);

    const response = await openai.chat.completions.create(
      {
        model: MAIN_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: isJson ? { type: 'json_object' } : undefined,
        temperature: 0.7,
      },
      {
        // Enforce request-level timeout
        timeout: DEFAULT_TIMEOUT_MS,
      }
    );

    const text = response.choices[0]?.message?.content;
    if (text) {
      console.log(`[AI Layer] Success with Groq model: ${MAIN_MODEL}`);
      return text;
    }
    throw new Error(`Groq model ${MAIN_MODEL} returned empty content`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AI Layer] Error with Groq model ${MAIN_MODEL}:`, errorMsg);
    
    // Return friendly, supportive fallbacks instead of crashing
    return getFallbackResponse(fallbackType, isJson);
  }
}

/**
 * Generates highly structured, supportive, and emotionally intelligent fallback responses.
 */
function getFallbackResponse(type: 'chat' | 'insights', isJson: boolean): string {
  if (type === 'insights') {
    const insightsFallback = {
      insights: [
        {
          type: 'tip',
          message: 'Establish a fixed, quiet time block for your most challenging habits to reduce friction.',
        },
        {
          type: 'encouragement',
          message: 'Every small effort is a building block for long-term consistency. Keep moving forward.',
        }
      ],
      weeklyReflection: 'Your journey is unique. When routines feel heavy, gently reduce the resistance by taking the smallest action possible.',
      focusScore: 70,
    };
    return isJson ? JSON.stringify(insightsFallback) : 'Focus on your key routines today.';
  }

  // Default Chat Fallback (Calm, emotionally intelligent, mentor-like, supportive)
  const chatFallback = {
    content: "Let's take a deep breath and look at your habits. What is presenting the greatest challenge to your flow today?",
  };
  return isJson ? JSON.stringify(chatFallback) : chatFallback.content;
}
