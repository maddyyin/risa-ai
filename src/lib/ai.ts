import OpenAI from 'openai';

// Centralized list of OpenRouter models in order of priority (Primary -> Fallbacks)
const MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

const openRouterKey = process.env.OPENROUTER_API_KEY;

// Create a single instance of the OpenAI client pointing to OpenRouter
const openai = openRouterKey
  ? new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://risa-habits.app', // Required by OpenRouter
        'X-Title': 'RISA Habit Coach', // Required by OpenRouter
      },
      timeout: 6000, // 6 seconds default timeout for the client
    })
  : null;

interface GenerateParams {
  prompt: string;
  systemPrompt?: string;
  isJson?: boolean;
}

/**
 * Centrally manages generating completions with cascading model fallbacks
 */
export async function generateAIResponse({
  prompt,
  systemPrompt = 'You are RISA, a calm, supportive, and emotionally intelligent behavioral consistency coach.',
  isJson = false,
}: GenerateParams): Promise<string> {
  if (!openai) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  let lastError: any = null;

  // Try each model in priority order
  for (const model of MODELS) {
    try {
      console.log(`[AI Layer] Attempting completion using model: ${model}`);

      // We set a 6-second timeout per model attempt to avoid blocking
      const response = await openai.chat.completions.create(
        {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          response_format: isJson ? { type: 'json_object' } : undefined,
          temperature: 0.7,
        },
        { timeout: 6000 }
      );

      const text = response.choices[0]?.message?.content;
      if (text) {
        console.log(`[AI Layer] Success with model: ${model}`);
        return text;
      }
      throw new Error(`Model ${model} returned empty content`);
    } catch (error: any) {
      console.warn(`[AI Layer] Error with model ${model}:`, error.message || error);
      lastError = error;

      // If the error is 401 (Unauthorized), 402 (Payment Required/Insufficient Balance), or 429 (Rate Limit),
      // we abort the cascade immediately to fail-fast and allow the application to use local fallbacks.
      if (error.status === 401 || error.status === 402 || error.status === 429) {
        console.error(`[AI Layer] Critical error status ${error.status} received. Aborting model cascade.`);
        throw error;
      }
    }
  }

  // If all models fail, throw the last error
  throw lastError || new Error('All model attempts failed');
}
