import { describe, it, expect } from 'vitest';
import { pickRecommendationsWithAi } from './recommendationAiService.js';

describe('pickRecommendationsWithAi', () => {
  it('returns null when DEEPSEEK_API_KEY is unset', async () => {
    const prev = process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const result = await pickRecommendationsWithAi({
      bandName: '测试乐队',
      stylePreferences: ['rock'],
      members: [{ displayName: 'A', instrument: 'GUITAR', skillLevel: 2 }],
      candidates: [],
      pickCount: 3,
    });

    expect(result).toBeNull();

    if (prev !== undefined) process.env.DEEPSEEK_API_KEY = prev;
  });
});
