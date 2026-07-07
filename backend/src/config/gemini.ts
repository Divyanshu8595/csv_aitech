import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    'FATAL: GEMINI_API_KEY is not set. Create a .env file with GEMINI_API_KEY=your_key'
  );
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

export const MODEL_NAME = 'gemini-3.5-flash';

export { Type };

/**
 * Calls Gemini with a prompt and a structured JSON response schema.
 * Returns the parsed JSON object from the model's response.
 */
export async function generateContent<T>(
  prompt: string,
  responseSchema: Record<string, unknown>
): Promise<T> {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  const parsed: T = JSON.parse(text);
  return parsed;
}

export default ai;
