/**
 * Phase 2 preview: v2 seed + rule engine + mock recommendation cards.
 *
 * Usage:
 *   npm run preview:recommendations
 *   npm run preview:recommendations -- band-newbie-rock
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FALLBACK_LABELS,
  KEYBOARD_REQUIREMENT_LABELS,
  type SeedSong,
  type SongPartId,
  type SongSeedFile,
} from '../src/types/seedSong.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');

type Instrument = 'GUITAR' | 'BASS' | 'DRUMS' | 'VOCALS' | 'KEYBOARD' | 'OTHER';

interface BandMember {
  displayName: string;
  instrument: Instrument;
  skillLevel: number;
  playingExperience?: string;
}

interface BandProfile {
  id: string;
  bandName: string;
  stylePreferences: string[];
  members: BandMember[];
  scenario?: string;
}

interface BandCoverage {
  vocals?: BandMember;
  rhythmGuitar?: BandMember;
  leadGuitar?: BandMember;
  bass?: BandMember;
  drums?: BandMember;
  keyboard?: BandMember;
}

interface ScoredSong {
  song: SeedSong;
  styleScore: number;
  headroom: number;
  gaps: string[];
  programHints: string[];
}

const PART_LABELS: Record<SongPartId, string> = {
  vocals: '主唱',
  rhythmGuitar: '节奏吉他',
  leadGuitar: '主音吉他',
  bass: '贝斯',
  drums: '鼓',
  keyboard: '键盘',
};

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8')) as T;
}

function songStyles(song: SeedSong): string[] {
  return [song.style, ...(song.styles ?? [])];
}

function styleScore(song: SeedSong, preferences: string[]): number {
  const styles = songStyles(song);
  const hits = preferences.filter((p) => styles.includes(p)).length;
  return hits > 0 ? hits : preferences.length > 0 ? 0 : 1;
}

/** Map band members to song parts (first guitarist = rhythm, second = lead). */
function assignCoverage(members: BandMember[]): BandCoverage {
  const coverage: BandCoverage = {};
  const guitarists = members.filter((m) => m.instrument === 'GUITAR');

  for (const m of members) {
    if (m.instrument === 'VOCALS') coverage.vocals = m;
    if (m.instrument === 'BASS') coverage.bass = m;
    if (m.instrument === 'DRUMS') coverage.drums = m;
    if (m.instrument === 'KEYBOARD') coverage.keyboard = m;
  }
  if (guitarists[0]) coverage.rhythmGuitar = guitarists[0];
  if (guitarists[1]) coverage.leadGuitar = guitarists[1];

  return coverage;
}

function partRequired(song: SeedSong, part: SongPartId): boolean {
  const { arrangement, parts } = song;
  if (!parts[part]) return false;

  switch (part) {
    case 'vocals':
      return arrangement.vocals === 'required';
    case 'rhythmGuitar':
      return arrangement.guitars.rhythm === 'required';
    case 'leadGuitar':
      return arrangement.guitars.lead === 'required';
    case 'bass':
      return arrangement.bass === 'required';
    case 'drums':
      return arrangement.drums === 'required';
    case 'keyboard':
      return arrangement.keyboard === 'required';
    default:
      return false;
  }
}

function fallbackKeyForPart(part: SongPartId): keyof SeedSong['fallbacks'] {
  const map: Record<SongPartId, keyof SeedSong['fallbacks']> = {
    vocals: 'missingVocals',
    rhythmGuitar: 'missingRhythmGuitar',
    leadGuitar: 'missingLeadGuitar',
    bass: 'missingBass',
    drums: 'missingDrums',
    keyboard: 'missingKeyboard',
  };
  return map[part];
}

function evaluateSong(song: SeedSong, members: BandMember[]): ScoredSong | null {
  const coverage = assignCoverage(members);
  const gaps: string[] = [];
  const programHints: string[] = [];
  let headroom = 0;

  const partIds = Object.keys(song.parts) as SongPartId[];

  for (const part of partIds) {
    const minLevel = song.parts[part]!.minLevel;
    const player = coverage[part];
    const required = partRequired(song, part);
    const hasPartInSong = !!song.parts[part];

    if (!hasPartInSong) continue;

    if (player) {
      const gap = player.skillLevel - minLevel;
      if (gap < 0) return null;
      headroom += gap;
      continue;
    }

    const fbKey = fallbackKeyForPart(part);
    const fallback = song.fallbacks[fbKey];
    const fbLabel = fallback ? FALLBACK_LABELS[fallback] : undefined;

    if (required) {
      if (!fallback || fallback === 'omit' || fallback === 'not_applicable') {
        return null;
      }
      gaps.push(`缺${PART_LABELS[part]} → ${fbLabel ?? fallback}`);
      if (fallback.startsWith('program') || fallback === 'cajon' || fallback === 'keyboard_bass') {
        programHints.push(`${PART_LABELS[part]}：${fbLabel}`);
      }
    } else if (fallback && fallback !== 'not_applicable' && fallback !== 'omit') {
      gaps.push(`可选${PART_LABELS[part]} → ${fbLabel ?? fallback}`);
    }
  }

  return {
    song,
    styleScore: 0,
    headroom,
    gaps,
    programHints,
  };
}

function filterAndRank(songs: SeedSong[], profile: BandProfile): ScoredSong[] {
  return songs
    .map((song) => {
      const scored = evaluateSong(song, profile.members);
      if (!scored) return null;
      scored.styleScore = styleScore(song, profile.stylePreferences);
      return scored;
    })
    .filter((s): s is ScoredSong => s !== null && s.styleScore > 0)
    .sort((a, b) => {
      if (b.styleScore !== a.styleScore) return b.styleScore - a.styleScore;
      if (b.headroom !== a.headroom) return b.headroom - a.headroom;
      return (a.song.bpm ?? 999) - (b.song.bpm ?? 999);
    });
}

function formatArrangement(song: SeedSong): string {
  const a = song.arrangement;
  const bits: string[] = [];

  if (a.vocals === 'instrumental_ok') bits.push('可纯器乐');
  else if (a.vocals === 'required') bits.push('需要主唱');

  if (a.guitars.count === 2) bits.push('双吉他');
  else if (a.guitars.count === 1) bits.push('单吉他');
  else bits.push('无吉他');

  if (a.bass === 'required') bits.push('要贝斯');
  else if (a.bass === 'optional') bits.push('贝斯可选');
  if (a.drums === 'required') bits.push('要鼓');
  else if (a.drums === 'program_ok') bits.push('鼓可用 program');
  bits.push(KEYBOARD_REQUIREMENT_LABELS[a.keyboard]);

  return bits.join(' · ');
}

function formatParts(song: SeedSong): string {
  return (Object.entries(song.parts) as [SongPartId, { minLevel: number }][])
    .map(([part, { minLevel }]) => `${PART_LABELS[part]}${minLevel}`)
    .join(' ');
}

function neteaseSearchUrl(title: string, artist: string): string {
  return `https://music.163.com/#/search/m/?s=${encodeURIComponent(`${title} ${artist}`)}&type=1`;
}

function printRecommendationCard(index: number, scored: ScoredSong, profile: BandProfile): void {
  const { song, gaps, programHints } = scored;
  const weakest = [...profile.members].sort((a, b) => a.skillLevel - b.skillLevel)[0];

  console.log(`  ┌─ 推荐 ${index + 1} ─────────────────────────────────`);
  console.log(`  │ ${song.title} — ${song.artist}`);
  console.log(`  │ 编制：${formatArrangement(song)}`);
  console.log(`  │ 难度：${formatParts(song)} · ${song.bpm ?? '?'} BPM`);
  console.log(`  │ 💬 适合 ${profile.bandName}：风格匹配；${weakest.displayName}（${weakest.instrument} Lv${weakest.skillLevel}）可胜任`);
  if (gaps.length > 0) {
    console.log(`  │ ⚠️  编制提示：${gaps.join('；')}`);
  }
  if (programHints.length > 0) {
    console.log(`  │ 🎹 Program 建议：${programHints.join('；')}`);
  }
  console.log(`  │ 🔗 ${neteaseSearchUrl(song.title, song.artist)}`);
  console.log(`  └${'─'.repeat(42)}`);
  console.log();
}

function printProfile(profile: BandProfile): void {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`乐队：${profile.bandName} (${profile.id})`);
  if (profile.scenario) console.log(`场景：${profile.scenario}`);
  console.log(`风格偏好：${profile.stylePreferences.join(', ')}`);
  console.log('成员：');
  for (const m of profile.members) {
    const label =
      m.instrument === 'GUITAR'
        ? profile.members.filter((x) => x.instrument === 'GUITAR').length > 1
          ? assignCoverage(profile.members).leadGuitar === m
            ? '主音吉他'
            : '节奏吉他'
          : '吉他'
        : PART_LABELS[m.instrument === 'VOCALS' ? 'vocals' : (m.instrument.toLowerCase() as SongPartId)] ??
          m.instrument;
    console.log(`  · ${m.displayName} · ${label} · Lv${m.skillLevel}`);
  }
}

function previewProfile(profile: BandProfile, songs: SeedSong[]): void {
  printProfile(profile);
  const ranked = filterAndRank(songs, profile);

  console.log(`\n📊 规则引擎（v2 编制模型）`);
  console.log(`  风格+skill+编制：${ranked.length} 首候选 → AI 写推荐语`);

  if (ranked.length === 0) {
    console.log('  ⚠️  无候选 — 检查曲库或乐队编制');
    return;
  }

  console.log('\n  📋 候选 Top 8\n');
  for (const [i, scored] of ranked.slice(0, 8).entries()) {
    const tag = scored.programHints.length ? ' [program]' : '';
    console.log(
      `  ${String(i + 1).padStart(2)}. ${scored.song.title} — ${scored.song.artist}${tag}`,
    );
  }

  console.log('\n  🎴 推荐卡片预览（AI 将补充个性化文案）\n');
  for (const [i, scored] of ranked.slice(0, 3).entries()) {
    printRecommendationCard(i, scored, profile);
  }
}

function main(): void {
  const seed = loadJson<SongSeedFile>('songs.seed.json');
  const { profiles } = loadJson<{ profiles: BandProfile[] }>('band-profiles.sample.json');
  const arg = process.argv[2];

  console.log(`BandMate Phase 2 — seed v${seed.version} 推荐预览`);
  console.log(`${seed.songs.length} 首 · arrangement / parts / fallbacks`);

  if (arg === '--all' || !arg) {
    for (const profile of profiles) previewProfile(profile, seed.songs);
    return;
  }

  const profile = profiles.find((p) => p.id === arg);
  if (!profile) {
    console.error(`\n未知 id: ${arg}`);
    console.error('可选:', profiles.map((p) => p.id).join(', '));
    process.exit(1);
  }
  previewProfile(profile, seed.songs);
}

main();
