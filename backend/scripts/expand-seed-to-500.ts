/**
 * Expand songs.seed.json from 327 → 500 (song-329 … song-501).
 * Run: npx tsx scripts/expand-seed-to-500.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MusicStyleId, SeedSong, SongSeedFile } from '../src/types/seedSong.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '../data/songs.seed.json');

type ProfileId =
  | 'beginner_pop'
  | 'standard_rock'
  | 'dual_guitar_rock'
  | 'acoustic_folk'
  | 'punk_fast'
  | 'metal_heavy'
  | 'jazz_combo'
  | 'postrock_build'
  | 'electronic_synth'
  | 'classical_inst'
  | 'acg_anime'
  | 'reggae_groove'
  | 'rnb_soul'
  | 'shoegaze_dual'
  | 'prog_complex'
  | 'math_tight'
  | 'country_band'
  | 'world_fusion'
  | 'grunge_90s'
  | 'emo_mid'
  | 'hardcore_fast'
  | 'postpunk_dark'
  | 'deathcore_brutal'
  | 'indie_dream'
  | 'folk_trad'
  | 'funk_groove';

type RawEntry = {
  title: string;
  artist: string;
  style: MusicStyleId;
  styles?: MusicStyleId[];
  bpm?: number;
  profile?: ProfileId;
  notes?: string;
};

const DEFAULT_PROFILE: Record<MusicStyleId, ProfileId> = {
  pop: 'beginner_pop',
  rock: 'standard_rock',
  folk: 'acoustic_folk',
  metal: 'metal_heavy',
  punk: 'punk_fast',
  indie: 'indie_dream',
  jazz: 'jazz_combo',
  blues: 'standard_rock',
  funk: 'funk_groove',
  rnb: 'rnb_soul',
  acg: 'acg_anime',
  electronic: 'electronic_synth',
  postrock: 'postrock_build',
  postpunk: 'postpunk_dark',
  hardcore: 'hardcore_fast',
  emo: 'emo_mid',
  grunge: 'grunge_90s',
  mathrock: 'math_tight',
  prog: 'prog_complex',
  shoegaze: 'shoegaze_dual',
  deathcore: 'deathcore_brutal',
  reggae: 'reggae_groove',
  country: 'country_band',
  classical: 'classical_inst',
  world: 'world_fusion',
};

const STANDARD_FALLBACKS: SeedSong['fallbacks'] = {
  missingLeadGuitar: 'not_applicable',
  missingRhythmGuitar: 'program_rhythm',
  missingBass: 'omit',
  missingDrums: 'program_drums',
  missingKeyboard: 'program_pad',
  missingVocals: 'not_applicable',
};

function buildSong(id: string, raw: RawEntry): SeedSong {
  const profile = raw.profile ?? DEFAULT_PROFILE[raw.style];
  const base = PROFILES[profile];
  return {
    id,
    title: raw.title,
    artist: raw.artist,
    style: raw.style,
    styles: raw.styles,
    bpm: raw.bpm ?? base.defaultBpm,
    notes: raw.notes ?? base.notes,
    arrangement: structuredClone(base.arrangement),
    parts: structuredClone(base.parts),
    fallbacks: { ...STANDARD_FALLBACKS, ...base.fallbackOverrides },
  };
}

const PROFILE_META: Record<
  ProfileId,
  {
    defaultBpm: number;
    notes: string;
    arrangement: SeedSong['arrangement'];
    parts: SeedSong['parts'];
    fallbackOverrides?: Partial<SeedSong['fallbacks']>;
  }
> = {
  beginner_pop: {
    defaultBpm: 100,
    notes: '新手友好 · 小编制',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'optional' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 1 },
      rhythmGuitar: { minLevel: 1 },
      bass: { minLevel: 1 },
      drums: { minLevel: 1 },
    },
  },
  standard_rock: {
    defaultBpm: 120,
    notes: '乐队常备 · 四件编制',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
  },
  dual_guitar_rock: {
    defaultBpm: 128,
    notes: '双吉他摇滚',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
    },
    fallbackOverrides: {
      missingLeadGuitar: 'program_lead',
      missingBass: 'program_bass',
    },
  },
  acoustic_folk: {
    defaultBpm: 80,
    notes: '民谣 · 扫弦/指弹',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 1 },
      rhythmGuitar: { minLevel: 1 },
      bass: { minLevel: 1 },
    },
  },
  punk_fast: {
    defaultBpm: 160,
    notes: '朋克 · 高速 power chord',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
  },
  metal_heavy: {
    defaultBpm: 140,
    notes: '金属 · 高增益',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 3 },
      drums: { minLevel: 4 },
    },
    fallbackOverrides: { missingLeadGuitar: 'program_lead' },
  },
  jazz_combo: {
    defaultBpm: 110,
    notes: '爵士 · combo 编制',
    arrangement: {
      vocals: 'optional',
      guitars: { count: 1, lead: 'none', rhythm: 'optional' },
      bass: 'required',
      drums: 'required',
      keyboard: 'important',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
      keyboard: { minLevel: 3 },
    },
    fallbackOverrides: { missingVocals: 'instrumental_ok' },
  },
  postrock_build: {
    defaultBpm: 90,
    notes: '后摇 · 渐强动态',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 2, lead: 'optional', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'optional_pad',
    },
    parts: {
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
      keyboard: { minLevel: 2 },
    },
    fallbackOverrides: { missingVocals: 'instrumental_ok', missingLeadGuitar: 'program_lead' },
  },
  electronic_synth: {
    defaultBpm: 120,
    notes: '电子 · 合成器/鼓机',
    arrangement: {
      vocals: 'optional',
      guitars: { count: 0, lead: 'none', rhythm: 'none' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'required',
    },
    parts: {
      keyboard: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
    fallbackOverrides: {
      missingRhythmGuitar: 'not_applicable',
      missingLeadGuitar: 'not_applicable',
      missingVocals: 'instrumental_ok',
    },
  },
  classical_inst: {
    defaultBpm: 72,
    notes: '古典 · 器乐小编制',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 1, lead: 'none', rhythm: 'optional' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'important',
    },
    parts: {
      rhythmGuitar: { minLevel: 2 },
      keyboard: { minLevel: 2 },
      bass: { minLevel: 2 },
    },
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingDrums: 'omit',
    },
  },
  acg_anime: {
    defaultBpm: 130,
    notes: 'ACG · 动漫/游戏',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
      keyboard: { minLevel: 2 },
    },
  },
  reggae_groove: {
    defaultBpm: 78,
    notes: '雷鬼 · 反拍 groove',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 3 },
      drums: { minLevel: 2 },
    },
  },
  rnb_soul: {
    defaultBpm: 92,
    notes: 'R&B · Soul groove',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'optional' },
      bass: 'required',
      drums: 'required',
      keyboard: 'important',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
      keyboard: { minLevel: 2 },
    },
  },
  shoegaze_dual: {
    defaultBpm: 100,
    notes: '自赏 · 墙式失真',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
    },
    fallbackOverrides: { missingLeadGuitar: 'program_lead' },
  },
  prog_complex: {
    defaultBpm: 118,
    notes: '前卫 ·  odd meter',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'important',
    },
    parts: {
      vocals: { minLevel: 4 },
      rhythmGuitar: { minLevel: 4 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 4 },
      drums: { minLevel: 4 },
      keyboard: { minLevel: 3 },
    },
    fallbackOverrides: { missingLeadGuitar: 'program_lead' },
  },
  math_tight: {
    defaultBpm: 132,
    notes: '数摇 · 切分密集',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      rhythmGuitar: { minLevel: 4 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 4 },
      drums: { minLevel: 4 },
    },
    fallbackOverrides: { missingVocals: 'instrumental_ok', missingLeadGuitar: 'program_lead' },
  },
  country_band: {
    defaultBpm: 108,
    notes: '乡村 ·  twang',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
  },
  world_fusion: {
    defaultBpm: 96,
    notes: '世界音乐 · 融合',
    arrangement: {
      vocals: 'optional',
      guitars: { count: 1, lead: 'none', rhythm: 'optional' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'important',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      keyboard: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
    fallbackOverrides: { missingVocals: 'instrumental_ok' },
  },
  grunge_90s: {
    defaultBpm: 112,
    notes: 'Grunge · 90s',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'optional', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
    },
    fallbackOverrides: { missingLeadGuitar: 'combine_into_rhythm' },
  },
  emo_mid: {
    defaultBpm: 140,
    notes: 'Emo · midwest',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 3 },
      bass: { minLevel: 2 },
      drums: { minLevel: 3 },
    },
    fallbackOverrides: { missingLeadGuitar: 'program_lead' },
  },
  hardcore_fast: {
    defaultBpm: 180,
    notes: '硬核 · 极速',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 4 },
    },
  },
  postpunk_dark: {
    defaultBpm: 124,
    notes: '后朋 · 冷调',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
      keyboard: { minLevel: 2 },
    },
  },
  deathcore_brutal: {
    defaultBpm: 150,
    notes: '死核 · breakdown',
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 4 },
      rhythmGuitar: { minLevel: 4 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 4 },
      drums: { minLevel: 5 },
    },
    fallbackOverrides: { missingLeadGuitar: 'program_lead' },
  },
  indie_dream: {
    defaultBpm: 104,
    notes: '独立 · dream pop/indie',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
  },
  folk_trad: {
    defaultBpm: 88,
    notes: '民谣 · 传统/中文',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 1 },
      rhythmGuitar: { minLevel: 1 },
    },
  },
  funk_groove: {
    defaultBpm: 102,
    notes: '放克 · slap bass',
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'important',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 3 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
      keyboard: { minLevel: 2 },
    },
  },
};

const PROFILES = PROFILE_META;

/** 173 new entries — ~75% foreign / ~25% CN */
const NEW_ENTRIES: RawEntry[] = [
  // pop +14
  { title: 'Shallow', artist: 'Lady Gaga & Bradley Cooper', style: 'pop', styles: ['rock'], bpm: 96 },
  { title: 'Shape of You', artist: 'Ed Sheeran', style: 'pop', styles: ['rnb'], bpm: 96 },
  { title: 'Someone Like You', artist: 'Adele', style: 'pop', bpm: 67 },
  { title: 'Counting Stars', artist: 'OneRepublic', style: 'pop', styles: ['rock'], bpm: 122 },
  { title: 'Apologize', artist: 'OneRepublic', style: 'pop', bpm: 118 },
  { title: 'Viva La Vida', artist: 'Coldplay', style: 'pop', styles: ['rock'], bpm: 138 },
  { title: 'Fix You', artist: 'Coldplay', style: 'pop', styles: ['rock'], bpm: 138 },
  { title: '告白气球', artist: '周杰伦', style: 'pop', styles: ['rnb'], bpm: 84, profile: 'beginner_pop' },
  { title: '晴天', artist: '周杰伦', style: 'pop', styles: ['rnb'], bpm: 69, profile: 'beginner_pop' },
  { title: '后来', artist: '刘若英', style: 'pop', styles: ['folk'], bpm: 76, profile: 'beginner_pop' },
  { title: '小酒窝', artist: '林俊杰 & 蔡卓妍', style: 'pop', bpm: 118, profile: 'beginner_pop' },
  { title: 'Price Tag', artist: 'Jessie J', style: 'pop', styles: ['rnb'], bpm: 84 },
  { title: 'Roar', artist: 'Katy Perry', style: 'pop', styles: ['rock'], bpm: 90 },
  { title: 'Firework', artist: 'Katy Perry', style: 'pop', bpm: 124 },
  // rock +14
  { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', style: 'rock', profile: 'dual_guitar_rock', bpm: 125 },
  { title: 'Back in Black', artist: 'AC/DC', style: 'rock', bpm: 93 },
  { title: 'Highway to Hell', artist: 'AC/DC', style: 'rock', bpm: 116 },
  { title: 'Zombie', artist: 'The Cranberries', style: 'rock', styles: ['indie'], bpm: 84 },
  { title: 'Californication', artist: 'Red Hot Chili Peppers', style: 'rock', styles: ['funk'], bpm: 96 },
  { title: 'Under the Bridge', artist: 'Red Hot Chili Peppers', style: 'rock', bpm: 84 },
  { title: 'Creep', artist: 'Radiohead', style: 'rock', styles: ['indie'], bpm: 92 },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', style: 'rock', styles: ['grunge'], profile: 'grunge_90s', bpm: 117 },
  { title: '无地自容', artist: '黑豹', style: 'rock', bpm: 120 },
  { title: '海阔天空', artist: 'Beyond', style: 'rock', styles: ['pop'], bpm: 76 },
  { title: '新长征路上的摇滚', artist: '崔健', style: 'rock', styles: ['folk'], bpm: 112 },
  { title: 'Boulevard of Broken Dreams', artist: 'Green Day', style: 'rock', styles: ['punk'], bpm: 83 },
  { title: 'American Idiot', artist: 'Green Day', style: 'rock', styles: ['punk'], bpm: 189 },
  { title: 'Mr. Brightside', artist: 'The Killers', style: 'rock', styles: ['indie'], bpm: 148 },
  // indie +12
  { title: 'Ho Hey', artist: 'The Lumineers', style: 'indie', styles: ['folk'], bpm: 80, profile: 'acoustic_folk' },
  { title: 'Skinny Love', artist: 'Bon Iver', style: 'indie', styles: ['folk'], bpm: 76 },
  { title: 'Dog Days Are Over', artist: 'Florence + The Machine', style: 'indie', styles: ['pop'], bpm: 150 },
  { title: 'Take Me Out', artist: 'Franz Ferdinand', style: 'indie', styles: ['rock'], bpm: 104 },
  { title: 'Pompeii', artist: 'Bastille', style: 'indie', styles: ['pop'], bpm: 127 },
  { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', style: 'indie', styles: ['rock'], bpm: 85 },
  { title: '荧光', artist: '逃跑计划', style: 'indie', styles: ['rock'], bpm: 120 },
  { title: '董小姐', artist: '宋冬野', style: 'indie', styles: ['folk'], bpm: 62, profile: 'acoustic_folk' },
  { title: '理想', artist: '赵雷', style: 'indie', styles: ['folk'], bpm: 72, profile: 'acoustic_folk' },
  { title: 'Last Nite', artist: 'The Strokes', style: 'indie', styles: ['rock'], bpm: 204 },
  { title: '1901', artist: 'Phoenix', style: 'indie', styles: ['electronic'], bpm: 144 },
  { title: 'Electric Feel', artist: 'MGMT', style: 'indie', styles: ['electronic'], bpm: 103 },
  // folk +7
  { title: 'Blowin\' in the Wind', artist: 'Bob Dylan', style: 'folk', bpm: 84, profile: 'acoustic_folk' },
  { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', style: 'folk', styles: ['pop'], bpm: 92 },
  { title: 'Hallelujah', artist: 'Leonard Cohen', style: 'folk', styles: ['pop'], bpm: 118 },
  { title: '消愁', artist: '毛不易', style: 'folk', styles: ['pop'], bpm: 72, profile: 'folk_trad' },
  { title: '像我这样的人', artist: '毛不易', style: 'folk', bpm: 68, profile: 'folk_trad' },
  { title: '同桌的你', artist: '老狼', style: 'folk', styles: ['pop'], bpm: 88, profile: 'folk_trad' },
  { title: '那些花儿', artist: '朴树', style: 'folk', styles: ['pop'], bpm: 76, profile: 'folk_trad' },
];

// 21 genres × 6 each = 126
function genreBatch(
  style: MusicStyleId,
  songs: Omit<RawEntry, 'style'>[],
): RawEntry[] {
  return songs.map((s) => ({ ...s, style }));
}

const GENRE_BATCHES: RawEntry[] = [
  ...genreBatch('punk', [
    { title: 'Anarchy in the UK', artist: 'Sex Pistols', profile: 'punk_fast', bpm: 160 },
    { title: 'London Calling', artist: 'The Clash', profile: 'punk_fast', bpm: 136 },
    { title: 'I Wanna Be Sedated', artist: 'Ramones', profile: 'punk_fast', bpm: 180 },
    { title: 'Basket Case', artist: 'Green Day', profile: 'punk_fast', bpm: 168 },
    { title: 'American Jesus', artist: 'Bad Religion', profile: 'punk_fast', bpm: 172 },
    { title: '毛贼', artist: '反光镜', style: 'punk' as MusicStyleId, profile: 'punk_fast', bpm: 165 },
  ]),
  ...genreBatch('metal', [
    { title: 'Master of Puppets', artist: 'Metallica', profile: 'metal_heavy', bpm: 212 },
    { title: 'Enter Sandman', artist: 'Metallica', profile: 'metal_heavy', bpm: 123 },
    { title: 'Paranoid', artist: 'Black Sabbath', profile: 'metal_heavy', bpm: 163 },
    { title: 'Iron Man', artist: 'Black Sabbath', profile: 'metal_heavy', bpm: 106 },
    { title: 'The Trooper', artist: 'Iron Maiden', profile: 'dual_guitar_rock', bpm: 160 },
    { title: '唐朝', artist: '唐朝乐队', profile: 'metal_heavy', bpm: 120 },
  ]),
  ...genreBatch('acg', [
    { title: '残酷な天使のテーゼ', artist: '高桥洋子', profile: 'acg_anime', bpm: 128 },
    { title: '红莲', artist: 'LiSA', profile: 'acg_anime', bpm: 132 },
    { title: 'unravel', artist: 'TK from Ling tosite sigure', profile: 'acg_anime', bpm: 135 },
    { title: 'Only My Railgun', artist: 'fripSide', profile: 'acg_anime', bpm: 150 },
    { title: '打上花火', artist: 'DAOKO × 米津玄师', profile: 'acg_anime', bpm: 78 },
    { title: '光るなら', artist: 'Goose house', profile: 'acg_anime', bpm: 120 },
  ]),
  ...genreBatch('postrock', [
    { title: 'The Birth and Death of the Day', artist: 'Explosions in the Sky', profile: 'postrock_build', bpm: 88 },
    { title: 'Your Hand in Mine', artist: 'Explosions in the Sky', profile: 'postrock_build', bpm: 92 },
    { title: 'Storm', artist: 'God Is an Astronaut', profile: 'postrock_build', bpm: 84 },
    { title: 'Auto Rock', artist: 'Mogwai', profile: 'postrock_build', bpm: 96 },
    { title: 'Take Me Somewhere Nice', artist: 'Mogwai', profile: 'postrock_build', bpm: 78 },
    { title: '醉忘川', artist: '惘闻', profile: 'postrock_build', bpm: 84 },
  ]),
  ...genreBatch('funk', [
    { title: 'Superstition', artist: 'Stevie Wonder', profile: 'funk_groove', bpm: 100 },
    { title: 'Give Up the Funk', artist: 'Parliament', profile: 'funk_groove', bpm: 102 },
    { title: 'Flash Light', artist: 'Parliament', profile: 'funk_groove', bpm: 104 },
    { title: 'Pick Up the Pieces', artist: 'Average White Band', profile: 'funk_groove', bpm: 108 },
    { title: 'Play That Funky Music', artist: 'Wild Cherry', profile: 'funk_groove', bpm: 112 },
    { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', profile: 'funk_groove', bpm: 115 },
  ]),
  ...genreBatch('reggae', [
    { title: 'No Woman No Cry', artist: 'Bob Marley', profile: 'reggae_groove', bpm: 80 },
    { title: 'Three Little Birds', artist: 'Bob Marley', profile: 'reggae_groove', bpm: 76 },
    { title: 'Redemption Song', artist: 'Bob Marley', profile: 'reggae_groove', bpm: 72 },
    { title: 'Is This Love', artist: 'Bob Marley', profile: 'reggae_groove', bpm: 78 },
    { title: 'Buffalo Soldier', artist: 'Bob Marley', profile: 'reggae_groove', bpm: 84 },
    { title: 'One Love', artist: 'Bob Marley', profile: 'reggae_groove', bpm: 80 },
  ]),
  ...genreBatch('country', [
    { title: 'Wagon Wheel', artist: 'Old Crow Medicine Show', profile: 'country_band', bpm: 104 },
    { title: 'Take Me Home Country Roads', artist: 'John Denver', profile: 'country_band', bpm: 84 },
    { title: 'Ring of Fire', artist: 'Johnny Cash', profile: 'country_band', bpm: 104 },
    { title: 'Jolene', artist: 'Dolly Parton', profile: 'country_band', bpm: 112 },
    { title: 'Friends in Low Places', artist: 'Garth Brooks', profile: 'country_band', bpm: 96 },
    { title: 'Before He Cheats', artist: 'Carrie Underwood', profile: 'country_band', bpm: 96 },
  ]),
  ...genreBatch('jazz', [
    { title: 'Autumn Leaves', artist: 'Joseph Kosma', profile: 'jazz_combo', bpm: 88 },
    { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', profile: 'jazz_combo', bpm: 120 },
    { title: 'All of Me', artist: 'Frank Sinatra', profile: 'jazz_combo', bpm: 126 },
    { title: 'So What', artist: 'Miles Davis', profile: 'jazz_combo', bpm: 132 },
    { title: 'Take Five', artist: 'Dave Brubeck', profile: 'jazz_combo', bpm: 176 },
    { title: '夜来香', artist: '李香兰', profile: 'jazz_combo', bpm: 96 },
  ]),
  ...genreBatch('blues', [
    { title: 'The Thrill Is Gone', artist: 'B.B. King', profile: 'standard_rock', bpm: 84 },
    { title: 'Hoochie Coochie Man', artist: 'Muddy Waters', profile: 'standard_rock', bpm: 92 },
    { title: 'Born Under a Bad Sign', artist: 'Albert King', profile: 'standard_rock', bpm: 96 },
    { title: 'Red House', artist: 'Jimi Hendrix', profile: 'standard_rock', bpm: 72 },
    { title: 'Pride and Joy', artist: 'Stevie Ray Vaughan', profile: 'standard_rock', bpm: 112 },
    { title: 'Crossroads', artist: 'Cream', profile: 'dual_guitar_rock', bpm: 108 },
  ]),
  ...genreBatch('classical', [
    { title: 'Für Elise', artist: 'Beethoven', profile: 'classical_inst', bpm: 72 },
    { title: 'Clair de Lune', artist: 'Debussy', profile: 'classical_inst', bpm: 60 },
    { title: 'Swan Lake', artist: 'Tchaikovsky', profile: 'classical_inst', bpm: 76 },
    { title: 'Canon in D Major', artist: 'Pachelbel', profile: 'classical_inst', bpm: 64 },
    { title: 'Spring', artist: 'Vivaldi', profile: 'classical_inst', bpm: 132 },
    { title: '梁祝', artist: '何占豪 / 陈钢', profile: 'classical_inst', bpm: 72 },
  ]),
  ...genreBatch('postpunk', [
    { title: 'Love Will Tear Us Apart', artist: 'Joy Division', profile: 'postpunk_dark', bpm: 120 },
    { title: 'This Charming Man', artist: 'The Smiths', profile: 'postpunk_dark', bpm: 124 },
    { title: 'Heart of Glass', artist: 'Blondie', profile: 'postpunk_dark', bpm: 140 },
    { title: 'Once in a Lifetime', artist: 'Talking Heads', profile: 'postpunk_dark', bpm: 116 },
    { title: 'Psycho Killer', artist: 'Talking Heads', profile: 'postpunk_dark', bpm: 124 },
    { title: 'Shadowplay', artist: 'Joy Division', profile: 'postpunk_dark', bpm: 112 },
  ]),
  ...genreBatch('hardcore', [
    { title: 'Straight Edge', artist: 'Minor Threat', profile: 'hardcore_fast', bpm: 200 },
    { title: 'Salad Days', artist: 'Minor Threat', profile: 'hardcore_fast', bpm: 188 },
    { title: 'Waiting Room', artist: 'Fugazi', profile: 'hardcore_fast', bpm: 168 },
    { title: 'New Noise', artist: 'Refused', profile: 'hardcore_fast', bpm: 176 },
    { title: 'Loud and Clear', artist: 'Have Heart', profile: 'hardcore_fast', bpm: 184 },
    { title: 'Outnumbered', artist: 'Turnstile', profile: 'hardcore_fast', bpm: 172 },
  ]),
  ...genreBatch('emo', [
    { title: 'Welcome to the Black Parade', artist: 'My Chemical Romance', profile: 'emo_mid', bpm: 148 },
    { title: 'I\'m Not Okay', artist: 'My Chemical Romance', profile: 'emo_mid', bpm: 120 },
    { title: 'Sugar We\'re Goin Down', artist: 'Fall Out Boy', profile: 'emo_mid', bpm: 162 },
    { title: 'The Middle', artist: 'Jimmy Eat World', profile: 'emo_mid', bpm: 156 },
    { title: 'Ocean Avenue', artist: 'Yellowcard', profile: 'emo_mid', bpm: 172 },
    { title: 'Helena', artist: 'My Chemical Romance', profile: 'emo_mid', bpm: 104 },
  ]),
  ...genreBatch('grunge', [
    { title: 'Black Hole Sun', artist: 'Soundgarden', profile: 'grunge_90s', bpm: 104 },
    { title: 'Man in the Box', artist: 'Alice in Chains', profile: 'grunge_90s', bpm: 96 },
    { title: 'Alive', artist: 'Pearl Jam', profile: 'grunge_90s', bpm: 76 },
    { title: 'Even Flow', artist: 'Pearl Jam', profile: 'grunge_90s', bpm: 104 },
    { title: 'Would?', artist: 'Alice in Chains', profile: 'grunge_90s', bpm: 92 },
    { title: 'Outshined', artist: 'Soundgarden', profile: 'grunge_90s', bpm: 108 },
  ]),
  ...genreBatch('mathrock', [
    { title: 'Loro', artist: 'Pinback', profile: 'math_tight', bpm: 128 },
    { title: 'Tonto', artist: 'Battles', profile: 'math_tight', bpm: 132 },
    { title: 'Atlas', artist: 'Battles', profile: 'math_tight', bpm: 140 },
    { title: 'Futura', artist: 'Mutemath', profile: 'math_tight', bpm: 124 },
    { title: 'Bloodstreams', artist: 'CAN', profile: 'math_tight', bpm: 118 },
    { title: '40 Rods to the Hog\'s Head', artist: 'Tera Melos', profile: 'math_tight', bpm: 136 },
  ]),
  ...genreBatch('prog', [
    { title: 'Time', artist: 'Pink Floyd', profile: 'prog_complex', bpm: 120 },
    { title: 'Money', artist: 'Pink Floyd', profile: 'prog_complex', bpm: 126 },
    { title: 'Roundabout', artist: 'Yes', profile: 'prog_complex', bpm: 130 },
    { title: 'Schism', artist: 'Tool', profile: 'prog_complex', bpm: 128 },
    { title: 'Tom Sawyer', artist: 'Rush', profile: 'prog_complex', bpm: 176 },
    { title: '2112 Overture', artist: 'Rush', profile: 'prog_complex', bpm: 140 },
  ]),
  ...genreBatch('shoegaze', [
    { title: 'When You Sleep', artist: 'my bloody valentine', profile: 'shoegaze_dual', bpm: 104 },
    { title: 'Only Shallow', artist: 'my bloody valentine', profile: 'shoegaze_dual', bpm: 112 },
    { title: 'Sometimes', artist: 'my bloody valentine', profile: 'shoegaze_dual', bpm: 96 },
    { title: 'Star Sail', artist: 'The Verve', profile: 'shoegaze_dual', bpm: 88 },
    { title: 'Souvlaki Space Station', artist: 'Slowdive', profile: 'shoegaze_dual', bpm: 92 },
    { title: 'Alison', artist: 'Slowdive', profile: 'shoegaze_dual', bpm: 96 },
  ]),
  ...genreBatch('deathcore', [
    { title: 'Bleed', artist: 'Meshuggah', profile: 'deathcore_brutal', bpm: 132 },
    { title: 'Duality', artist: 'Slipknot', profile: 'deathcore_brutal', bpm: 148 },
    { title: 'Before I Forget', artist: 'Slipknot', profile: 'deathcore_brutal', bpm: 132 },
    { title: 'Holy Wars', artist: 'Megadeth', profile: 'deathcore_brutal', bpm: 168 },
    { title: 'Raining Blood', artist: 'Slayer', profile: 'deathcore_brutal', bpm: 196 },
    { title: 'Choke', artist: 'Whitechapel', profile: 'deathcore_brutal', bpm: 140 },
  ]),
  ...genreBatch('rnb', [
    { title: 'Superstition', artist: 'Stevie Wonder', profile: 'rnb_soul', bpm: 100 },
    { title: 'Ain\'t No Sunshine', artist: 'Bill Withers', profile: 'rnb_soul', bpm: 72 },
    { title: 'Let\'s Stay Together', artist: 'Al Green', profile: 'rnb_soul', bpm: 96 },
    { title: 'Redbone', artist: 'Childish Gambino', profile: 'rnb_soul', bpm: 81 },
    { title: 'No Diggity', artist: 'Blackstreet', profile: 'rnb_soul', bpm: 89 },
    { title: '红豆', artist: '王菲', profile: 'rnb_soul', bpm: 68 },
  ]),
  ...genreBatch('electronic', [
    { title: 'Midnight City', artist: 'M83', profile: 'electronic_synth', bpm: 104 },
    { title: 'Strobe', artist: 'deadmau5', profile: 'electronic_synth', bpm: 128 },
    { title: 'One More Time', artist: 'Daft Punk', profile: 'electronic_synth', bpm: 123 },
    { title: 'Teardrop', artist: 'Massive Attack', profile: 'electronic_synth', bpm: 96 },
    { title: 'Glory Box', artist: 'Portishead', profile: 'electronic_synth', bpm: 92 },
    { title: 'Sandstorm', artist: 'Darude', profile: 'electronic_synth', bpm: 136 },
  ]),
  ...genreBatch('world', [
    { title: 'Bamboleo', artist: 'Gipsy Kings', profile: 'world_fusion', bpm: 112 },
    { title: 'Volare', artist: 'Domenico Modugno', profile: 'world_fusion', bpm: 104 },
    { title: 'Chan Chan', artist: 'Buena Vista Social Club', profile: 'world_fusion', bpm: 96 },
    { title: 'Guantanamera', artist: 'Traditional', profile: 'world_fusion', bpm: 108 },
    { title: 'Despacito', artist: 'Luis Fonsi', profile: 'world_fusion', bpm: 89 },
    { title: '茉莉花', artist: '民歌', profile: 'world_fusion', bpm: 88 },
  ]),
];

NEW_ENTRIES.push(...GENRE_BATCHES);

/** Second batch — titles verified absent from pre-500 seed */
const SUPPLEMENTAL_ENTRIES: RawEntry[] = [
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran', style: 'pop', bpm: 79 },
  { title: 'Photograph', artist: 'Ed Sheeran', style: 'pop', bpm: 108 },
  { title: 'Chasing Cars', artist: 'Snow Patrol', style: 'pop', styles: ['rock'], bpm: 104 },
  { title: 'Chandelier', artist: 'Sia', style: 'pop', bpm: 117 },
  { title: 'Set Fire to the Rain', artist: 'Adele', style: 'pop', bpm: 108 },
  { title: 'Hello', artist: 'Adele', style: 'pop', bpm: 79 },
  { title: 'Bad Guy', artist: 'Billie Eilish', style: 'pop', bpm: 135 },
  { title: 'Drivers License', artist: 'Olivia Rodrigo', style: 'pop', bpm: 144 },
  { title: 'Save Your Tears', artist: 'The Weeknd', style: 'pop', styles: ['rnb'], bpm: 118 },
  { title: 'Starboy', artist: 'The Weeknd', style: 'pop', styles: ['rnb'], bpm: 106 },
  { title: 'Uptown Girl', artist: 'Billy Joel', style: 'pop', bpm: 129 },
  { title: 'Piano Man', artist: 'Billy Joel', style: 'pop', bpm: 176 },
  { title: 'Just the Way You Are', artist: 'Bruno Mars', style: 'pop', styles: ['rnb'], bpm: 109 },
  { title: 'Treasure', artist: 'Bruno Mars', style: 'pop', styles: ['funk'], bpm: 116 },
  { title: 'Don\'t Stop Believin\'', artist: 'Journey', style: 'rock', bpm: 119 },
  { title: 'More Than a Feeling', artist: 'Boston', style: 'rock', bpm: 109 },
  { title: 'Dream On', artist: 'Aerosmith', style: 'rock', bpm: 78 },
  { title: 'Layla', artist: 'Derek and the Dominos', style: 'rock', profile: 'dual_guitar_rock', bpm: 112 },
  { title: 'Tears in Heaven', artist: 'Eric Clapton', style: 'rock', bpm: 76 },
  { title: 'Wish You Were Here', artist: 'Pink Floyd', style: 'rock', profile: 'prog_complex', bpm: 63 },
  { title: 'Comfortably Numb', artist: 'Pink Floyd', style: 'rock', profile: 'dual_guitar_rock', bpm: 127 },
  { title: 'Another Brick in the Wall', artist: 'Pink Floyd', style: 'rock', bpm: 104 },
  { title: 'About a Girl', artist: 'Nirvana', style: 'rock', styles: ['grunge'], bpm: 120 },
  { title: 'Everlong', artist: 'Foo Fighters', style: 'rock', bpm: 158 },
  { title: 'Best of You', artist: 'Foo Fighters', style: 'rock', bpm: 136 },
  { title: 'The Pretender', artist: 'Foo Fighters', style: 'rock', bpm: 172 },
  { title: 'Learn to Fly', artist: 'Foo Fighters', style: 'rock', bpm: 136 },
  { title: 'Clocks', artist: 'Coldplay', style: 'pop', styles: ['rock'], bpm: 131 },
  { title: 'In My Place', artist: 'Coldplay', style: 'pop', styles: ['rock'], bpm: 144 },
  { title: 'Paradise', artist: 'Coldplay', style: 'pop', bpm: 140 },
  { title: 'Radioactive', artist: 'Imagine Dragons', style: 'rock', styles: ['electronic'], bpm: 136 },
  { title: 'Demons', artist: 'Imagine Dragons', style: 'rock', bpm: 90 },
  { title: 'Believer', artist: 'Imagine Dragons', style: 'rock', bpm: 125 },
  { title: 'Thunder', artist: 'Imagine Dragons', style: 'rock', bpm: 168 },
  { title: 'Shake It Off', artist: 'Taylor Swift', style: 'pop', bpm: 160 },
  { title: 'Blank Space', artist: 'Taylor Swift', style: 'pop', bpm: 96 },
  { title: 'Love Story', artist: 'Taylor Swift', style: 'pop', bpm: 119 },
  { title: 'Anti-Hero', artist: 'Taylor Swift', style: 'pop', bpm: 97 },
  { title: 'Billie Jean', artist: 'Michael Jackson', style: 'pop', styles: ['funk'], bpm: 117 },
  { title: 'Beat It', artist: 'Michael Jackson', style: 'rock', styles: ['pop'], bpm: 139 },
  { title: 'Smooth Criminal', artist: 'Michael Jackson', style: 'pop', bpm: 118 },
  { title: 'Like a Rolling Stone', artist: 'Bob Dylan', style: 'folk', bpm: 104 },
  { title: '七里香', artist: '周杰伦', style: 'pop', profile: 'beginner_pop', bpm: 72 },
  { title: '简单爱', artist: '周杰伦', style: 'pop', profile: 'beginner_pop', bpm: 88 },
  { title: '安静', artist: '周杰伦', style: 'pop', bpm: 72 },
  { title: '听妈妈的话', artist: '周杰伦', style: 'pop', profile: 'beginner_pop', bpm: 92 },
  { title: '发如雪', artist: '周杰伦', style: 'pop', styles: ['classical'], bpm: 76 },
  { title: '传奇', artist: '李健', style: 'pop', styles: ['folk'], bpm: 68, profile: 'beginner_pop' },
  { title: '体面', artist: '于文文', style: 'pop', bpm: 64, profile: 'beginner_pop' },
  { title: '光年之外', artist: 'G.E.M. 邓紫棋', style: 'pop', bpm: 128 },
  { title: '泡沫', artist: 'G.E.M. 邓紫棋', style: 'pop', bpm: 120 },
  { title: '画心', artist: '张靓颖', style: 'pop', bpm: 68 },
  { title: '曾经的你', artist: '许巍', style: 'rock', styles: ['folk'], bpm: 92 },
  { title: '故乡', artist: '许巍', style: 'rock', styles: ['folk'], bpm: 88 },
  { title: '生如夏花', artist: '朴树', style: 'folk', styles: ['pop'], bpm: 96, profile: 'folk_trad' },
  { title: '白桦林', artist: '朴树', style: 'folk', bpm: 88, profile: 'folk_trad' },
  { title: 'Feel Good Inc', artist: 'Gorillaz', style: 'electronic', styles: ['funk'], bpm: 139, profile: 'electronic_synth' },
  { title: 'Kids', artist: 'MGMT', style: 'indie', styles: ['electronic'], bpm: 117 },
  { title: 'Pumped Up Kicks', artist: 'Foster the People', style: 'indie', styles: ['pop'], bpm: 128 },
  { title: 'Safe and Sound', artist: 'Capital Cities', style: 'indie', styles: ['electronic'], bpm: 118 },
  { title: 'Take on Me', artist: 'a-ha', style: 'pop', styles: ['electronic'], bpm: 169 },
  { title: 'Africa', artist: 'Toto', style: 'pop', styles: ['rock'], bpm: 93 },
  { title: 'Every Breath You Take', artist: 'The Police', style: 'rock', styles: ['reggae'], bpm: 117 },
  { title: 'Roxanne', artist: 'The Police', style: 'rock', styles: ['reggae'], bpm: 132 },
  { title: 'With or Without You', artist: 'U2', style: 'rock', bpm: 111 },
  { title: 'Beautiful Day', artist: 'U2', style: 'rock', bpm: 136 },
  { title: 'Losing My Religion', artist: 'R.E.M.', style: 'rock', styles: ['indie'], bpm: 126 },
  { title: 'Everybody Hurts', artist: 'R.E.M.', style: 'rock', bpm: 94 },
  { title: 'Crazy', artist: 'Gnarls Barkley', style: 'rnb', styles: ['pop'], bpm: 112 },
  { title: 'Shut Up and Dance', artist: 'Walk the Moon', style: 'pop', bpm: 128 },
  { title: 'Hey There Delilah', artist: 'Plain White T\'s', style: 'pop', profile: 'beginner_pop', bpm: 104 },
  { title: 'I\'m Yours', artist: 'Jason Mraz', style: 'pop', profile: 'beginner_pop', bpm: 151 },
  { title: 'Watermelon Sugar', artist: 'Harry Styles', style: 'pop', bpm: 95 },
  { title: 'As It Was', artist: 'Harry Styles', style: 'pop', bpm: 174 },
  { title: 'Heat Waves', artist: 'Glass Animals', style: 'indie', styles: ['electronic'], bpm: 81 },
  { title: 'Levitating', artist: 'Dua Lipa', style: 'pop', bpm: 103 },
  { title: 'Don\'t Start Now', artist: 'Dua Lipa', style: 'pop', bpm: 124 },
  { title: 'Sunflower', artist: 'Post Malone', style: 'pop', bpm: 90 },
  { title: 'Circles', artist: 'Post Malone', style: 'pop', bpm: 120 },
  { title: 'Float On', artist: 'Modest Mouse', style: 'indie', bpm: 104 },
  { title: 'Fast Car', artist: 'Tracy Chapman', style: 'folk', profile: 'acoustic_folk', bpm: 104 },
  { title: 'Fast Car', artist: 'Luke Combs', style: 'country', bpm: 104, profile: 'country_band' },
  { title: 'Anarchy in the UK', artist: 'Sex Pistols', style: 'punk', profile: 'punk_fast', bpm: 160 },
  { title: 'Iron Man', artist: 'Black Sabbath', style: 'metal', profile: 'metal_heavy', bpm: 106 },
  { title: '残酷な天使のテーゼ', artist: 'Yoko Takahashi', style: 'acg', profile: 'acg_anime', bpm: 128 },
  { title: 'unravel', artist: 'TK', style: 'acg', profile: 'acg_anime', bpm: 135 },
  { title: 'The Birth and Death of the Day', artist: 'Explosions in the Sky', style: 'postrock', profile: 'postrock_build', bpm: 88 },
  { title: 'Auto Rock', artist: 'Mogwai', style: 'postrock', profile: 'postrock_build', bpm: 96 },
  { title: 'Play That Funky Music', artist: 'Wild Cherry', style: 'funk', profile: 'funk_groove', bpm: 112 },
  { title: 'No Woman No Cry', artist: 'Bob Marley & The Wailers', style: 'reggae', profile: 'reggae_groove', bpm: 80 },
  { title: 'Take Me Home Country Roads', artist: 'John Denver', style: 'country', profile: 'country_band', bpm: 84 },
  { title: 'All of Me', artist: 'Frank Sinatra', style: 'jazz', profile: 'jazz_combo', bpm: 126 },
  { title: 'Ain\'t No Sunshine', artist: 'Bill Withers', style: 'rnb', profile: 'rnb_soul', bpm: 72 },
  { title: 'No Diggity', artist: 'Blackstreet', style: 'rnb', profile: 'rnb_soul', bpm: 89 },
  { title: 'Swan Lake', artist: 'Tchaikovsky', style: 'classical', profile: 'classical_inst', bpm: 76 },
  { title: 'This Charming Man', artist: 'The Smiths', style: 'postpunk', profile: 'postpunk_dark', bpm: 124 },
  { title: 'Heart of Glass', artist: 'Blondie', style: 'postpunk', profile: 'postpunk_dark', bpm: 140 },
  { title: 'Salad Days', artist: 'Minor Threat', style: 'hardcore', profile: 'hardcore_fast', bpm: 188 },
  { title: 'New Noise', artist: 'Refused', style: 'hardcore', profile: 'hardcore_fast', bpm: 176 },
  { title: 'I\'m Not Okay', artist: 'My Chemical Romance', style: 'emo', profile: 'emo_mid', bpm: 120 },
  { title: 'Sugar We\'re Goin Down', artist: 'Fall Out Boy', style: 'emo', profile: 'emo_mid', bpm: 162 },
  { title: 'Ocean Avenue', artist: 'Yellowcard', style: 'emo', profile: 'emo_mid', bpm: 172 },
  { title: 'Outshined', artist: 'Soundgarden', style: 'grunge', profile: 'grunge_90s', bpm: 108 },
  { title: 'Loro', artist: 'Pinback', style: 'mathrock', profile: 'math_tight', bpm: 128 },
  { title: 'Futura', artist: 'Mutemath', style: 'mathrock', profile: 'math_tight', bpm: 124 },
  { title: 'Time', artist: 'Pink Floyd', style: 'prog', profile: 'prog_complex', bpm: 120 },
  { title: 'Money', artist: 'Pink Floyd', style: 'prog', profile: 'prog_complex', bpm: 126 },
  { title: '2112 Overture', artist: 'Rush', style: 'prog', profile: 'prog_complex', bpm: 140 },
  { title: 'Holy Wars', artist: 'Megadeth', style: 'deathcore', profile: 'deathcore_brutal', bpm: 168 },
  { title: 'Choke', artist: 'Whitechapel', style: 'deathcore', profile: 'deathcore_brutal', bpm: 140 },
  { title: 'Glory Box', artist: 'Portishead', style: 'electronic', profile: 'electronic_synth', bpm: 92 },
  { title: 'Sandstorm', artist: 'Darude', style: 'electronic', profile: 'electronic_synth', bpm: 136 },
  { title: 'Chan Chan', artist: 'Buena Vista Social Club', style: 'world', profile: 'world_fusion', bpm: 96 },
  { title: 'Guantanamera', artist: 'Traditional', style: 'world', profile: 'world_fusion', bpm: 108 },
  { title: '像我这样的人', artist: '毛不易', style: 'folk', profile: 'folk_trad', bpm: 68 },
  { title: '那些花儿', artist: '朴树', style: 'folk', profile: 'folk_trad', bpm: 76 },
  { title: '毛贼', artist: '反光镜', style: 'punk', profile: 'punk_fast', bpm: 165 },
  { title: '唐朝', artist: '唐朝乐队', style: 'metal', profile: 'metal_heavy', bpm: 120 },
  { title: '红莲', artist: 'LiSA', style: 'acg', profile: 'acg_anime', bpm: 132 },
  { title: '打上花火', artist: 'DAOKO × 米津玄师', style: 'acg', profile: 'acg_anime', bpm: 78 },
  { title: '光るなら', artist: 'Goose house', style: 'acg', profile: 'acg_anime', bpm: 120 },
  { title: 'Take Me Somewhere Nice', artist: 'Mogwai', style: 'postrock', profile: 'postrock_build', bpm: 78 },
  { title: 'American Jesus', artist: 'Bad Religion', style: 'punk', profile: 'punk_fast', bpm: 172 },
  { title: 'Under the Bridge', artist: 'Red Hot Chili Peppers', style: 'rock', bpm: 84 },
  { title: 'Apologize', artist: 'OneRepublic', style: 'pop', bpm: 118 },
  { title: 'Firework', artist: 'Katy Perry', style: 'pop', bpm: 124 },
  { title: 'Skinny Love', artist: 'Bon Iver', style: 'indie', bpm: 76 },
  { title: 'Dog Days Are Over', artist: 'Florence + The Machine', style: 'indie', bpm: 150 },
  { title: 'Take Me Out', artist: 'Franz Ferdinand', style: 'indie', bpm: 104 },
  { title: '1901', artist: 'Phoenix', style: 'indie', styles: ['electronic'], bpm: 144 },
  { title: 'Electric Feel', artist: 'MGMT', style: 'indie', styles: ['electronic'], bpm: 103 },
  { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', style: 'folk', bpm: 92 },
  { title: 'You Give Love a Bad Name', artist: 'Bon Jovi', style: 'rock', bpm: 123 },
  { title: 'Livin\' on a Prayer', artist: 'Bon Jovi', style: 'rock', bpm: 123 },
  { title: 'Lithium', artist: 'Nirvana', style: 'grunge', profile: 'grunge_90s', bpm: 124 },
  { title: 'Heart-Shaped Box', artist: 'Nirvana', style: 'grunge', profile: 'grunge_90s', bpm: 98 },
  { title: 'Natural', artist: 'Imagine Dragons', style: 'rock', bpm: 95 },
  { title: 'Maps', artist: 'Maroon 5', style: 'pop', bpm: 105 },
  { title: 'Memories', artist: 'Maroon 5', style: 'pop', bpm: 104 },
  { title: 'Sugar', artist: 'Maroon 5', style: 'pop', bpm: 120 },
  { title: 'Seven Nation Army', artist: 'The White Stripes', style: 'rock', bpm: 124 },
  { title: 'Smoke on the Water', artist: 'Deep Purple', style: 'rock', bpm: 112 },
  { title: 'Sunshine of Your Love', artist: 'Cream', style: 'rock', profile: 'dual_guitar_rock', bpm: 112 },
  { title: 'Whole Lotta Love', artist: 'Led Zeppelin', style: 'rock', profile: 'dual_guitar_rock', bpm: 92 },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin', style: 'rock', profile: 'dual_guitar_rock', bpm: 82 },
  { title: 'Nothing Else Matters', artist: 'Metallica', style: 'metal', bpm: 92 },
  { title: 'Fade to Black', artist: 'Metallica', style: 'metal', profile: 'metal_heavy', bpm: 116 },
  { title: 'Californication', artist: 'Red Hot Chili Peppers', style: 'rock', styles: ['funk'], bpm: 96 },
  { title: 'Champagne Supernova', artist: 'Oasis', style: 'rock', profile: 'standard_rock', bpm: 74 },
  { title: 'Live Forever', artist: 'Oasis', style: 'rock', profile: 'standard_rock', bpm: 104 },
  { title: 'Song 2', artist: 'Blur', style: 'rock', profile: 'standard_rock', bpm: 130 },
  { title: 'There Is a Light That Never Goes Out', artist: 'The Smiths', style: 'indie', profile: 'indie_dream', bpm: 92 },
  { title: 'Bitter Sweet Symphony', artist: 'The Verve', style: 'rock', profile: 'standard_rock', bpm: 85 },
  { title: 'Country House', artist: 'Blur', style: 'rock', profile: 'standard_rock', bpm: 120 },
  { title: 'Common People', artist: 'Pulp', style: 'indie', profile: 'indie_dream', bpm: 134 },
  { title: 'Dancing Queen', artist: 'ABBA', style: 'pop', profile: 'beginner_pop', bpm: 101 },
  { title: 'Mamma Mia', artist: 'ABBA', style: 'pop', profile: 'beginner_pop', bpm: 138 },
  { title: 'Gimme Gimme Gimme', artist: 'ABBA', style: 'pop', profile: 'beginner_pop', bpm: 120 },
  { title: 'Super Trouper', artist: 'ABBA', style: 'pop', profile: 'beginner_pop', bpm: 118 },
  { title: 'Take It Easy', artist: 'Eagles', style: 'rock', profile: 'standard_rock', bpm: 116 },
  { title: 'Desperado', artist: 'Eagles', style: 'rock', profile: 'standard_rock', bpm: 72 },
];

const ALL_ENTRIES = [...NEW_ENTRIES, ...SUPPLEMENTAL_ENTRIES];

function main() {
  const file = JSON.parse(readFileSync(seedPath, 'utf-8')) as SongSeedFile;
  const existingTitles = new Set(file.songs.map((s) => `${s.title}::${s.artist}`.toLowerCase()));
  const existingIds = new Set(file.songs.map((s) => s.id));

  const toAdd: SeedSong[] = [];
  let nextNum =
    Math.max(...file.songs.map((s) => Number.parseInt(s.id.replace('song-', ''), 10))) + 1;

  for (const raw of ALL_ENTRIES) {
    const key = `${raw.title}::${raw.artist}`.toLowerCase();
    if (existingTitles.has(key)) {
      console.warn(`Skip duplicate: ${raw.title} — ${raw.artist}`);
      continue;
    }
    while (existingIds.has(`song-${String(nextNum).padStart(3, '0')}`)) nextNum++;
    const id = `song-${String(nextNum).padStart(3, '0')}`;
    nextNum++;
    toAdd.push(buildSong(id, raw));
    existingTitles.add(key);
  }

  const targetNew = 500 - file.songs.length;
  const added = toAdd.slice(0, targetNew);
  if (added.length < targetNew) {
    console.warn(`Only ${added.length} unique entries available; need ${targetNew}`);
  }

  file.songs.push(...added);

  let repaired = 0;
  for (const song of file.songs) {
    if (
      song.arrangement.guitars.count === 2 &&
      song.fallbacks.missingLeadGuitar === 'not_applicable'
    ) {
      song.fallbacks.missingLeadGuitar =
        song.arrangement.guitars.lead === 'optional' ? 'combine_into_rhythm' : 'program_lead';
      repaired++;
    }
  }
  if (repaired > 0) {
    console.log(`Repaired missingLeadGuitar fallback on ${repaired} dual-guitar songs`);
  }

  file.generatedAt = new Date().toISOString().slice(0, 10);
  file.description =
    'Phase 2 曲库 seed v2：编制 (arrangement)、分声部难度 (parts)、缺人方案 (fallbacks)。500 首。';

  writeFileSync(seedPath, `${JSON.stringify(file, null, 2)}\n`, 'utf-8');
  console.log(`Added ${added.length} songs → total ${file.songs.length}`);
}

main();
