import {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL,
  isAiRecommendationAvailable,
} from '../config/ai.js';
import {
  formatArrangementSummary,
  formatPartsSummary,
} from './recommendationFormatter.js';
import type { RuleEngineInput, ScoredCandidate } from './recommendationRuleEngine.js';

export interface AiPickInput {
  bandName: string;
  stylePreferences: string[];
  members: RuleEngineInput['members'];
  candidates: ScoredCandidate[];
  pickCount: number;
}

export interface AiPickResult {
  picks: { songId: string; reason: string }[];
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

function buildUserPayload(input: AiPickInput): string {
  return JSON.stringify({
    bandName: input.bandName,
    stylePreferences: input.stylePreferences,
    members: input.members.map((m) => ({
      displayName: m.displayName,
      instrument: m.instrument,
      skillLevel: m.skillLevel,
    })),
    candidates: input.candidates.map(({ song, arrangementHints, programHints }) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      style: song.style,
      arrangementSummary: formatArrangementSummary(song),
      partsSummary: formatPartsSummary(song),
      arrangementHints,
      programHints,
    })),
    pickCount: input.pickCount,
  });
}

function parseAiJson(content: string): AiPickResult | null {
  const trimmed = content.trim();
  const jsonText =
    trimmed.startsWith('```') ?
      trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as AiPickResult;
    if (!Array.isArray(parsed.picks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function pickRecommendationsWithAi(
  input: AiPickInput,
): Promise<AiPickResult | null> {
  if (!isAiRecommendationAvailable()) return null;

  const apiKey = process.env.DEEPSEEK_API_KEY!.trim();
  const candidateIds = new Set(input.candidates.map((c) => c.song.id));

  const systemPrompt = `你是 BandMate 乐队排练顾问。只能从 candidates 列表中选歌，禁止推荐列表外的歌名。
根据乐队编制、各成员 skill level（1-5）、风格偏好，选出 pickCount 首并各写 1-2 句中文推荐理由。
可提及 program 建议或哪位成员是短板。输出纯 JSON，格式：
{"picks":[{"songId":"song-001","reason":"..."}]}`;

  let response: Response;
  try {
    response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: buildUserPayload(input) },
        ],
      }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    return null;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = parseAiJson(content);
  if (!parsed) return null;

  const validPicks = parsed.picks.filter(
    (p) =>
      typeof p.songId === 'string' &&
      candidateIds.has(p.songId) &&
      typeof p.reason === 'string' &&
      p.reason.trim().length > 0,
  );

  if (validPicks.length === 0) return null;

  return { picks: validPicks.slice(0, input.pickCount) };
}
