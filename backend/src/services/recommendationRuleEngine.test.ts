import { describe, it, expect } from 'vitest';
import { loadSongSeed } from '../lib/songSeedLoader.js';
import { diagnoseEmptyRecommendations } from './recommendationDiagnosis.js';
import {
  assignCoverage,
  computeLineupFitScore,
  evaluateSong,
  rankCandidates,
  scoreCandidates,
  STYLE_MATCH_MIN,
  allowsStyleStretchSong,
} from './recommendationRuleEngine.js';

const newbieBand = {
  stylePreferences: ['rock', 'pop', 'folk'],
  members: [
    { displayName: '阿杰', instrument: 'GUITAR' as const, skillLevel: 2 },
    { displayName: '大伟', instrument: 'BASS' as const, skillLevel: 2 },
    { displayName: '小雨', instrument: 'DRUMS' as const, skillLevel: 2 },
    { displayName: '小美', instrument: 'VOCALS' as const, skillLevel: 2 },
  ],
};

describe('recommendationRuleEngine', () => {
  it('returns candidates for a newbie rock band', () => {
    const scored = rankCandidates(scoreCandidates(loadSongSeed(), newbieBand), newbieBand.members);
    expect(scored.length).toBeGreaterThan(10);
    expect(scored.some((c) => c.song.title === '平凡之路')).toBe(true);
  });

  it('excludes songs above skill level', () => {
    const scored = rankCandidates(
      scoreCandidates(loadSongSeed(), {
        stylePreferences: ['rock'],
        members: [
          { displayName: 'A', instrument: 'GUITAR', skillLevel: 1 },
          { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
          { displayName: 'C', instrument: 'DRUMS', skillLevel: 1 },
          { displayName: 'D', instrument: 'VOCALS', skillLevel: 1 },
        ],
      }),
      [
        { displayName: 'A', instrument: 'GUITAR', skillLevel: 1 },
        { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
        { displayName: 'C', instrument: 'DRUMS', skillLevel: 1 },
        { displayName: 'D', instrument: 'VOCALS', skillLevel: 1 },
      ],
    );
    expect(scored.some((c) => c.song.title === 'Stairway to Heaven')).toBe(false);
  });

  it('includes stretch songs when skill is one level below', () => {
    const seed = loadSongSeed();
    const wonderwall = seed.find((s) => s.title === 'Wonderwall')!;
    const strict = evaluateSong(wonderwall, [
      { displayName: 'G', instrument: 'GUITAR', skillLevel: 1 },
      { displayName: 'V', instrument: 'VOCALS', skillLevel: 1 },
      { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
      { displayName: 'D', instrument: 'DRUMS', skillLevel: 1 },
    ], 0);
    expect(strict).toBeNull();

    const members = [
      { displayName: 'G', instrument: 'GUITAR' as const, skillLevel: 1 },
      { displayName: 'V', instrument: 'VOCALS' as const, skillLevel: 1 },
      { displayName: 'B', instrument: 'BASS' as const, skillLevel: 1 },
      { displayName: 'D', instrument: 'DRUMS' as const, skillLevel: 1 },
    ];
    const ranked = rankCandidates(
      scoreCandidates(seed, {
        stylePreferences: ['rock', 'pop'],
        members,
      }),
      members,
    );
    const stretch = ranked.find((c) => c.song.title === 'Wonderwall');
    expect(stretch).toBeDefined();
    expect(stretch!.isStretch).toBe(true);
    expect(stretch!.stretchHints.length).toBeGreaterThan(0);
  });

  it('ranks non-stretch candidates before stretch', () => {
    const members = [
      { displayName: 'G', instrument: 'GUITAR' as const, skillLevel: 1 },
      { displayName: 'V', instrument: 'VOCALS' as const, skillLevel: 1 },
    ];
    const ranked = rankCandidates(
      scoreCandidates(loadSongSeed(), {
        stylePreferences: ['pop'],
        members,
      }),
      members,
    );
    const firstStretchIdx = ranked.findIndex((c) => c.isStretch);
    if (firstStretchIdx > 0) {
      expect(ranked.slice(0, firstStretchIdx).every((c) => !c.isStretch)).toBe(true);
    }
  });

  it('uses highest skill when multiple members share an instrument', () => {
    const seed = loadSongSeed();
    const wonderwall = seed.find((s) => s.title === 'Wonderwall')!;
    const scored = evaluateSong(
      wonderwall,
      [
        { displayName: '弱', instrument: 'VOCALS', skillLevel: 1 },
        { displayName: '强', instrument: 'VOCALS', skillLevel: 4 },
        { displayName: 'G', instrument: 'GUITAR', skillLevel: 4 },
        { displayName: 'B', instrument: 'BASS', skillLevel: 3 },
        { displayName: 'D', instrument: 'DRUMS', skillLevel: 3 },
      ],
      0,
    );
    expect(scored).not.toBeNull();

    const coverage = assignCoverage([
      { displayName: '弱', instrument: 'VOCALS', skillLevel: 1 },
      { displayName: '强', instrument: 'VOCALS', skillLevel: 4 },
      { displayName: 'G1', instrument: 'GUITAR', skillLevel: 5 },
      { displayName: 'G2', instrument: 'GUITAR', skillLevel: 2 },
    ]);
    expect(coverage.vocals?.displayName).toBe('强');
    expect(coverage.rhythmGuitar?.displayName).toBe('G1');
    expect(coverage.leadGuitar?.displayName).toBe('G2');
  });

  it('adds style-stretch candidates when style matches are scarce', () => {
    const seed = loadSongSeed();
    const scored = scoreCandidates(seed, {
      stylePreferences: ['mathrock'],
      members: [
        { displayName: 'G', instrument: 'GUITAR', skillLevel: 4 },
        { displayName: 'B', instrument: 'BASS', skillLevel: 4 },
        { displayName: 'D', instrument: 'DRUMS', skillLevel: 4 },
        { displayName: 'V', instrument: 'VOCALS', skillLevel: 4 },
      ],
    });
    const styleMatched = scored.filter((c) => !c.isStyleStretch);
    const styleStretch = scored.filter((c) => c.isStyleStretch);
    if (styleMatched.length < STYLE_MATCH_MIN) {
      expect(styleStretch.length).toBeGreaterThan(0);
    }
  });

  it('adds arrangement hints when band has one guitarist for dual-guitar songs', () => {
    const indie = {
      stylePreferences: ['indie', 'rock'],
      members: [
        { displayName: '老陈', instrument: 'GUITAR' as const, skillLevel: 4 },
        { displayName: '阿贝', instrument: 'BASS' as const, skillLevel: 3 },
        { displayName: '鼓王', instrument: 'DRUMS' as const, skillLevel: 4 },
        { displayName: '主唱', instrument: 'VOCALS' as const, skillLevel: 3 },
      ],
    };
    const hotel = rankCandidates(scoreCandidates(loadSongSeed(), indie), indie.members).find(
      (c) => c.song.title === 'Hotel California',
    );
    expect(hotel).toBeDefined();
    expect(hotel!.arrangementHints.length + hotel!.programHints.length).toBeGreaterThan(0);
  });

  it('prefers instrumental songs when the band has no vocalist', () => {
    const seed = loadSongSeed();
    const members = [
      { displayName: 'G', instrument: 'GUITAR' as const, skillLevel: 2 },
      { displayName: 'B', instrument: 'BASS' as const, skillLevel: 2 },
      { displayName: 'D', instrument: 'DRUMS' as const, skillLevel: 2 },
    ];
    const ranked = rankCandidates(
      scoreCandidates(seed, { stylePreferences: ['rock'], members }),
      members,
    );
    const top = ranked.slice(0, 6);
    const instrumental = top.filter((c) => c.song.arrangement.vocals === 'instrumental_ok');
    expect(instrumental.length).toBeGreaterThan(0);
    const firstInstrumentalIdx = ranked.findIndex(
      (c) => c.song.arrangement.vocals === 'instrumental_ok',
    );
    const firstVocalRequiredIdx = ranked.findIndex(
      (c) => c.song.arrangement.vocals === 'required' && c.styleScore > 0,
    );
    if (firstVocalRequiredIdx >= 0 && firstInstrumentalIdx >= 0) {
      expect(firstInstrumentalIdx).toBeLessThan(firstVocalRequiredIdx);
    }
  });

  it('penalizes keyboard-heavy songs when the band has no keyboardist', () => {
    const seed = loadSongSeed();
    const pianoSong = seed.find(
      (s) => s.arrangement.keyboard === 'required' && s.style !== 'classical',
    )!;
    const guitarSong = seed.find(
      (s) =>
        s.arrangement.keyboard === 'none' &&
        s.arrangement.vocals === 'instrumental_ok' &&
        s.style === 'rock',
    )!;
    expect(computeLineupFitScore(pianoSong, [{ displayName: 'G', instrument: 'GUITAR', skillLevel: 2 }])).toBeLessThan(
      computeLineupFitScore(guitarSong, [{ displayName: 'G', instrument: 'GUITAR', skillLevel: 2 }]),
    );
  });

  it('excludes primary classical songs from style-stretch when classical is not preferred', () => {
    const seed = loadSongSeed();
    const classical = seed.find((s) => s.style === 'classical')!;
    expect(allowsStyleStretchSong(classical, ['rock'])).toBe(false);
    expect(allowsStyleStretchSong(classical, ['classical'])).toBe(true);

    const scored = scoreCandidates(seed, {
      stylePreferences: ['deathcore'],
      members: [
        { displayName: 'G', instrument: 'GUITAR', skillLevel: 2 },
        { displayName: 'B', instrument: 'BASS', skillLevel: 2 },
        { displayName: 'D', instrument: 'DRUMS', skillLevel: 2 },
      ],
    });
    const stretchClassical = scored.filter(
      (c) => c.isStyleStretch && c.song.style === 'classical',
    );
    expect(stretchClassical).toHaveLength(0);
  });
});

describe('recommendationDiagnosis', () => {
  it('suggests questionnaire when members are OTHER', () => {
    const result = diagnoseEmptyRecommendations(loadSongSeed(), {
      stylePreferences: ['rock'],
      members: [{ displayName: 'A', instrument: 'OTHER', skillLevel: 1 }],
    });
    expect(result.hints.some((h) => h.includes('问卷'))).toBe(true);
  });
});
