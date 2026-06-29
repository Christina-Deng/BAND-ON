/** DeepSeek (OpenAI-compatible) — set DEEPSEEK_API_KEY in backend/.env */
export function isAiRecommendationAvailable(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

export const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com';

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
