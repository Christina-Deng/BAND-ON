/**
 * Expand songs.seed.json with small-lineup / instrumental-friendly entries.
 * Run: npx tsx scripts/expand-seed-small-lineup.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MusicStyleId, SeedSong, SongSeedFile } from '../src/types/seedSong.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '../data/songs.seed.json');

type ProfileId =
  | 'instrumental_rock'
  | 'instrumental_rock_lead'
  | 'instrumental_blues'
  | 'small_acoustic'
  | 'classical_guitar'
  | 'acg_school_band'
  | 'grunge_90s'
  | 'indie_dream'
  | 'math_tight'
  | 'standard_rock'
  | 'world_fusion';

type RawEntry = {
  title: string;
  artist: string;
  style: MusicStyleId;
  styles?: MusicStyleId[];
  bpm?: number;
  profile: ProfileId;
  notes?: string;
};

const STANDARD_FALLBACKS: SeedSong['fallbacks'] = {
  missingLeadGuitar: 'not_applicable',
  missingRhythmGuitar: 'program_rhythm',
  missingBass: 'omit',
  missingDrums: 'program_drums',
  missingKeyboard: 'not_applicable',
  missingVocals: 'not_applicable',
};

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
  instrumental_rock: {
    defaultBpm: 120,
    notes: '器乐摇滚 · 小编制友好',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingBass: 'omit',
      missingDrums: 'program_drums',
    },
  },
  instrumental_rock_lead: {
    defaultBpm: 128,
    notes: '器乐摇滚 · 主音吉他',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 2, lead: 'optional', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      rhythmGuitar: { minLevel: 2 },
      leadGuitar: { minLevel: 3 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingLeadGuitar: 'combine_into_rhythm',
      missingBass: 'omit',
      missingDrums: 'program_drums',
    },
  },
  instrumental_blues: {
    defaultBpm: 88,
    notes: '蓝调器乐 · 小编制',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
    },
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingBass: 'omit',
      missingDrums: 'program_drums',
    },
  },
  small_acoustic: {
    defaultBpm: 96,
    notes: '小编制 · 主唱可选/可器乐',
    arrangement: {
      vocals: 'optional',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 1 },
      rhythmGuitar: { minLevel: 1 },
      bass: { minLevel: 1 },
      drums: { minLevel: 1 },
    },
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingBass: 'omit',
      missingDrums: 'program_drums',
    },
  },
  classical_guitar: {
    defaultBpm: 72,
    notes: '古典吉他 · 乐队可改编',
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'optional',
      drums: 'program_ok',
      keyboard: 'optional_pad',
    },
    parts: {
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      keyboard: { minLevel: 2 },
    },
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingDrums: 'omit',
      missingKeyboard: 'program_pad',
    },
  },
  acg_school_band: {
    defaultBpm: 130,
    notes: 'ACG · 校园乐队编制',
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
    fallbackOverrides: {
      missingDrums: 'program_drums',
      missingBass: 'omit',
      missingKeyboard: 'program_pad',
    },
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
    fallbackOverrides: {
      missingLeadGuitar: 'combine_into_rhythm',
      missingDrums: 'program_drums',
    },
  },
  indie_dream: {
    defaultBpm: 104,
    notes: '独立 · Britpop/indie',
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
    fallbackOverrides: {
      missingDrums: 'program_drums',
      missingBass: 'omit',
    },
  },
  math_tight: {
    defaultBpm: 132,
    notes: '数摇 · 器乐编制',
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
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingLeadGuitar: 'program_lead',
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
    fallbackOverrides: {
      missingDrums: 'program_drums',
      missingBass: 'omit',
      missingVocals: 'instrumental_ok',
    },
  },
  world_fusion: {
    defaultBpm: 96,
    notes: '世界音乐 · 融合小编制',
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
    fallbackOverrides: {
      missingVocals: 'instrumental_ok',
      missingDrums: 'program_drums',
      missingKeyboard: 'program_pad',
    },
  },
};

function buildSong(id: string, raw: RawEntry): SeedSong {
  const base = PROFILE_META[raw.profile];
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

const NEW_ENTRIES: RawEntry[] = [
  // —— 器乐摇滚（小编制 / 无主唱）——
  { title: 'Walk Don\'t Run', artist: 'The Ventures', style: 'rock', styles: ['pop', 'indie'], bpm: 165, profile: 'instrumental_rock' },
  { title: 'Wipe Out', artist: 'The Surfaris', style: 'rock', styles: ['punk', 'indie'], bpm: 165, profile: 'instrumental_rock' },
  { title: 'Rumble', artist: 'Link Wray', style: 'rock', styles: ['blues', 'punk'], bpm: 158, profile: 'instrumental_rock' },
  { title: 'Misirlou', artist: 'Dick Dale', style: 'rock', styles: ['world'], bpm: 162, profile: 'instrumental_rock' },
  { title: 'Pipeline', artist: 'The Ventures', style: 'rock', styles: ['pop', 'indie'], bpm: 176, profile: 'instrumental_rock' },
  { title: 'Apache', artist: 'The Shadows', style: 'rock', styles: ['pop', 'indie'], bpm: 138, profile: 'instrumental_rock' },
  { title: 'Sleepwalk', artist: 'Santo & Johnny', style: 'rock', styles: ['pop'], bpm: 120, profile: 'instrumental_rock' },
  { title: 'Peter Gunn', artist: 'Henry Mancini', style: 'rock', styles: ['jazz', 'blues'], bpm: 124, profile: 'instrumental_rock' },
  { title: 'Rebel Rouser', artist: 'Duane Eddy', style: 'rock', styles: ['country'], bpm: 140, profile: 'instrumental_rock' },
  { title: 'Cannonball', artist: 'Duane Eddy', style: 'rock', styles: ['country'], bpm: 132, profile: 'instrumental_rock' },
  { title: 'Telstar', artist: 'The Tornados', style: 'rock', styles: ['electronic', 'pop'], bpm: 150, profile: 'instrumental_rock' },
  { title: 'Black Magic Woman', artist: 'Santana', style: 'rock', styles: ['blues', 'world'], bpm: 120, profile: 'instrumental_rock_lead' },
  { title: 'Europa', artist: 'Santana', style: 'rock', styles: ['jazz', 'world'], bpm: 70, profile: 'instrumental_rock_lead' },
  { title: 'Jessica', artist: 'The Allman Brothers Band', style: 'rock', styles: ['blues', 'country'], bpm: 104, profile: 'instrumental_rock_lead' },
  { title: 'YYZ', artist: 'Rush', style: 'rock', styles: ['prog', 'metal'], bpm: 136, profile: 'instrumental_rock_lead', notes: '器乐摇滚 · 前卫 riff' },
  { title: 'Eruption', artist: 'Van Halen', style: 'rock', styles: ['metal'], bpm: 103, profile: 'instrumental_rock_lead', notes: '主音吉他 showcase' },
  { title: 'Cliffs of Dover', artist: 'Eric Johnson', style: 'rock', styles: ['blues', 'prog'], bpm: 138, profile: 'instrumental_rock_lead' },
  { title: 'Ain\'t Talkin\' \'Bout Love', artist: 'Van Halen', style: 'rock', styles: ['metal', 'punk'], bpm: 136, profile: 'instrumental_rock' },
  { title: 'The Lonely Bull', artist: 'Herb Alpert & The Tijuana Brass', style: 'rock', styles: ['jazz', 'world'], bpm: 120, profile: 'instrumental_rock' },
  { title: 'Riptide', artist: 'Vance Joy', style: 'indie', styles: ['folk', 'pop'], bpm: 100, profile: 'small_acoustic', notes: '小编制 · 扫弦友好' },

  // —— 蓝调器乐 ——
  { title: 'Green Onions', artist: 'Booker T. & the M.G.\'s', style: 'blues', styles: ['funk', 'rock'], bpm: 168, profile: 'instrumental_blues' },
  { title: 'Hideaway', artist: 'Freddie King', style: 'blues', styles: ['rock'], bpm: 120, profile: 'instrumental_blues' },
  { title: 'The Stumble', artist: 'Freddie King', style: 'blues', styles: ['rock'], bpm: 112, profile: 'instrumental_blues' },
  { title: 'Red House', artist: 'Jimi Hendrix', style: 'blues', styles: ['rock'], bpm: 68, profile: 'instrumental_blues' },
  { title: 'Crossroads', artist: 'Cream', style: 'blues', styles: ['rock'], bpm: 128, profile: 'instrumental_rock_lead' },
  { title: 'Honky Tonk', artist: 'Bill Doggett', style: 'blues', styles: ['funk', 'rock'], bpm: 120, profile: 'instrumental_blues' },
  { title: 'Sweet Home Chicago', artist: 'Robert Johnson', style: 'blues', styles: ['folk'], bpm: 96, profile: 'small_acoustic' },
  { title: 'Stormy Monday', artist: 'T-Bone Walker', style: 'blues', styles: ['jazz'], bpm: 72, profile: 'small_acoustic' },

  // —— 流行 / 独立小编制 ——
  { title: 'Banana Pancakes', artist: 'Jack Johnson', style: 'pop', styles: ['folk', 'indie'], bpm: 92, profile: 'small_acoustic' },
  { title: 'Better Together', artist: 'Jack Johnson', style: 'pop', styles: ['folk'], bpm: 100, profile: 'small_acoustic' },
  { title: 'Heartbeats', artist: 'José González', style: 'indie', styles: ['folk', 'acg'], bpm: 100, profile: 'small_acoustic' },
  { title: 'Landslide', artist: 'Fleetwood Mac', style: 'folk', styles: ['pop', 'rock'], bpm: 79, profile: 'small_acoustic' },
  { title: 'Wild World', artist: 'Cat Stevens', style: 'folk', styles: ['pop'], bpm: 76, profile: 'small_acoustic' },
  { title: 'Bubbly', artist: 'Colbie Caillat', style: 'pop', styles: ['folk', 'indie'], bpm: 96, profile: 'small_acoustic' },
  { title: 'Bad Day', artist: 'Daniel Powter', style: 'pop', styles: ['rock'], bpm: 76, profile: 'small_acoustic' },
  { title: 'Skinny Love', artist: 'Bon Iver', style: 'indie', styles: ['folk'], bpm: 120, profile: 'small_acoustic' },
  { title: 'Holocene', artist: 'Bon Iver', style: 'indie', styles: ['folk', 'postrock'], bpm: 92, profile: 'small_acoustic' },
  { title: 'Such Great Heights', artist: 'The Postal Service', style: 'indie', styles: ['electronic', 'pop'], bpm: 112, profile: 'small_acoustic' },
  { title: '1234', artist: 'Feist', style: 'indie', styles: ['folk', 'pop'], bpm: 96, profile: 'small_acoustic' },
  { title: 'Budapest', artist: 'George Ezra', style: 'indie', styles: ['folk', 'pop'], bpm: 128, profile: 'small_acoustic' },

  // —— 中文民谣小编制 ——
  { title: '米店', artist: '张玮玮', style: 'folk', styles: ['indie'], bpm: 88, profile: 'small_acoustic' },
  { title: '关于郑州的记忆', artist: '李志', style: 'folk', styles: ['indie', 'rock'], bpm: 72, profile: 'small_acoustic' },
  { title: '小屋', artist: '赵雷', style: 'folk', styles: ['indie'], bpm: 68, profile: 'small_acoustic' },
  { title: '再见杰克', artist: '痛仰', style: 'rock', styles: ['folk', 'reggae'], bpm: 104, profile: 'standard_rock' },
  { title: '安和桥', artist: '宋冬野', style: 'folk', styles: ['indie'], bpm: 63, profile: 'small_acoustic' },
  { title: '天空之城', artist: '久石让', style: 'acg', styles: ['classical', 'folk'], bpm: 72, profile: 'classical_guitar' },
  { title: '城南花已开', artist: '三亩地', style: 'acg', styles: ['postrock', 'indie'], bpm: 80, profile: 'small_acoustic' },

  // —— 私心曲目（各 1–2 首）——
  { title: 'Animal Nitrate', artist: 'Suede', style: 'indie', styles: ['rock', 'postpunk'], bpm: 116, profile: 'indie_dream' },
  { title: '1979', artist: 'The Smashing Pumpkins', style: 'grunge', styles: ['rock', 'indie'], bpm: 126, profile: 'grunge_90s' },
  { title: 'Playing God', artist: 'Polyphia', style: 'mathrock', styles: ['prog', 'metal'], bpm: 120, profile: 'math_tight' },
  { title: 'ふわふわ時間', artist: '放課後ティータイム', style: 'acg', styles: ['rock', 'pop'], bpm: 138, profile: 'acg_school_band' },
  { title: 'Utauyo☆MIRACLE', artist: '放課後ティータイム', style: 'acg', styles: ['rock', 'pop'], bpm: 168, profile: 'acg_school_band', notes: 'Don\'t say "lazy"' },

  // —— 古典 / 吉他改编（乐队可练，非钢琴独奏）——
  { title: 'Asturias (Leyenda)', artist: 'Isaac Albéniz', style: 'classical', styles: ['rock', 'world'], bpm: 96, profile: 'classical_guitar' },
  { title: 'Romance Anónimo', artist: 'Traditional', style: 'classical', styles: ['folk', 'world'], bpm: 72, profile: 'classical_guitar' },
  { title: 'Greensleeves', artist: 'Traditional', style: 'classical', styles: ['folk'], bpm: 68, profile: 'classical_guitar' },
  { title: 'Scarborough Fair', artist: 'Traditional', style: 'folk', styles: ['classical'], bpm: 80, profile: 'small_acoustic' },
  { title: 'Malagueña', artist: 'Ernesto Lecuona', style: 'classical', styles: ['world', 'folk'], bpm: 120, profile: 'classical_guitar' },
  { title: 'Study in E minor', artist: 'Francisco Tárrega', style: 'classical', styles: ['folk'], bpm: 88, profile: 'classical_guitar' },

  // —— 其他小编制补充 ——
  { title: 'Bull in the Heather', artist: 'Sonic Youth', style: 'grunge', styles: ['indie', 'punk'], bpm: 116, profile: 'grunge_90s' },
  { title: 'Where Is My Mind?', artist: 'Pixies', style: 'indie', styles: ['grunge', 'punk'], bpm: 84, profile: 'indie_dream' },
  { title: 'Debaser', artist: 'Pixies', style: 'indie', styles: ['punk', 'grunge'], bpm: 168, profile: 'indie_dream' },
  { title: 'There She Goes', artist: 'The La\'s', style: 'indie', styles: ['rock', 'pop'], bpm: 104, profile: 'indie_dream' },
  { title: 'Just Like Honey', artist: 'The Jesus and Mary Chain', style: 'shoegaze', styles: ['indie', 'rock'], bpm: 116, profile: 'indie_dream' },
  { title: 'Wave of Mutilation', artist: 'Pixies', style: 'indie', styles: ['punk'], bpm: 168, profile: 'indie_dream' },
  { title: 'Three Little Birds', artist: 'Bob Marley & The Wailers', style: 'reggae', styles: ['folk', 'pop'], bpm: 148, profile: 'small_acoustic' },
  { title: 'No Woman, No Cry', artist: 'Bob Marley & The Wailers', style: 'reggae', styles: ['folk'], bpm: 80, profile: 'small_acoustic' },
  { title: 'Redemption Song', artist: 'Bob Marley & The Wailers', style: 'reggae', styles: ['folk'], bpm: 60, profile: 'small_acoustic' },
  { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', style: 'jazz', styles: ['pop'], bpm: 136, profile: 'small_acoustic' },
  { title: 'Autumn Leaves', artist: 'Joseph Kosma', style: 'jazz', styles: ['folk', 'classical'], bpm: 88, profile: 'small_acoustic' },
  { title: 'Take Five', artist: 'Dave Brubeck', style: 'jazz', styles: ['world'], bpm: 176, profile: 'instrumental_rock', notes: '爵士 · 器乐小编制' },
  { title: 'Bésame Mucho', artist: 'Consuelo Velázquez', style: 'world', styles: ['jazz', 'folk'], bpm: 72, profile: 'world_fusion' },
  { title: 'Guantanamera', artist: 'Traditional', style: 'world', styles: ['folk'], bpm: 120, profile: 'small_acoustic' },
  { title: 'Despacito', artist: 'Luis Fonsi', style: 'pop', styles: ['world', 'reggae'], bpm: 89, profile: 'small_acoustic' },
  { title: 'Zombie', artist: 'The Cranberries', style: 'rock', styles: ['indie', 'grunge'], bpm: 82, profile: 'standard_rock' },
  { title: 'Linger', artist: 'The Cranberries', style: 'rock', styles: ['indie', 'folk'], bpm: 92, profile: 'standard_rock' },
  { title: 'Dreams', artist: 'Fleetwood Mac', style: 'rock', styles: ['pop', 'folk'], bpm: 120, profile: 'standard_rock' },
  { title: 'Under the Bridge', artist: 'Red Hot Chili Peppers', style: 'rock', styles: ['funk', 'indie'], bpm: 84, profile: 'standard_rock' },
  { title: 'Californication', artist: 'Red Hot Chili Peppers', style: 'rock', styles: ['funk', 'indie'], bpm: 96, profile: 'standard_rock' },
];

function repairExisting(file: SongSeedFile): string[] {
  const log: string[] = [];

  const before = file.songs.length;
  file.songs = file.songs.filter((song) => {
    if (song.id === 'song-321' && song.title === 'Let It Be') {
      log.push('Removed duplicate Let It Be (song-321)');
      return false;
    }
    return true;
  });
  if (file.songs.length < before) {
    log.push(`Song count ${before} → ${file.songs.length}`);
  }

  for (const song of file.songs) {
    if (song.title === 'Bohemian Rhapsody' && song.styles?.includes('classical')) {
      song.styles = song.styles.filter((s) => s !== 'classical');
      log.push('Removed classical tag from Bohemian Rhapsody');
    }
    if (song.title === 'Let It Be' && song.styles?.includes('classical')) {
      song.styles = song.styles.filter((s) => s !== 'classical');
      log.push('Removed classical tag from Let It Be');
    }
    if (
      song.arrangement.guitars.count === 2 &&
      song.fallbacks.missingLeadGuitar === 'not_applicable'
    ) {
      song.fallbacks.missingLeadGuitar =
        song.arrangement.guitars.lead === 'optional' ? 'combine_into_rhythm' : 'program_lead';
    }
  }

  return log;
}

function main(): void {
  const file = JSON.parse(readFileSync(seedPath, 'utf-8')) as SongSeedFile;
  const repairs = repairExisting(file);
  for (const line of repairs) console.log(`Repair: ${line}`);

  const existingIds = new Set(file.songs.map((s) => s.id));
  const existingTitles = new Set(
    file.songs.map((s) => `${s.title}::${s.artist}`.toLowerCase()),
  );

  let nextNum =
    Math.max(...file.songs.map((s) => Number.parseInt(s.id.replace('song-', ''), 10))) + 1;

  const toAdd: SeedSong[] = [];
  for (const raw of NEW_ENTRIES) {
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
    existingIds.add(id);
  }

  file.songs.push(...toAdd);
  file.generatedAt = new Date().toISOString().slice(0, 10);
  file.description =
    'Phase 2 曲库 seed v2：编制 (arrangement)、分声部难度 (parts)、缺人方案 (fallbacks)。含小编制/器乐友好扩充。';

  writeFileSync(seedPath, `${JSON.stringify(file, null, 2)}\n`, 'utf-8');
  console.log(`Added ${toAdd.length} songs → total ${file.songs.length}`);
}

main();
