/**
 * One-time migration: songs.seed.json v1 (minSkillLevel) → v2 (arrangement/parts/fallbacks).
 * Run: npx tsx scripts/migrate-seed-v1-to-v2.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  SeedSong,
  SongArrangement,
  SongFallbacks,
  SongParts,
  SongSeedFile,
} from '../src/types/seedSong.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '../data/songs.seed.json');

interface LegacySong {
  id: string;
  title: string;
  artist: string;
  style: string;
  styles?: string[];
  bpm?: number;
  notes?: string;
  minSkillLevel?: Record<string, number>;
  arrangement?: SongArrangement;
  parts?: SongParts;
  fallbacks?: SongFallbacks;
}

interface LegacyFile {
  version: number;
  generatedAt?: string;
  description?: string;
  songs: LegacySong[];
}

type PartialSeedSong = Pick<SeedSong, 'arrangement' | 'parts' | 'fallbacks'>;

/** Hand-curated overrides — refine auto-migration for known songs. */
const OVERRIDES: Record<string, PartialSeedSong> = {
  'song-003': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'none',
      drums: 'optional',
      keyboard: 'none',
    },
    parts: { vocals: { minLevel: 2 }, rhythmGuitar: { minLevel: 2 }, drums: { minLevel: 2 } },
    fallbacks: {
      missingBass: 'omit',
      missingDrums: 'omit',
      missingKeyboard: 'not_applicable',
      missingLeadGuitar: 'not_applicable',
    },
  },
  'song-005': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'none', rhythm: 'required' },
      bass: 'none',
      drums: 'optional',
      keyboard: 'none',
    },
    parts: { vocals: { minLevel: 2 }, rhythmGuitar: { minLevel: 2 }, drums: { minLevel: 1 } },
    fallbacks: {
      missingBass: 'omit',
      missingDrums: 'omit',
      missingKeyboard: 'not_applicable',
      missingLeadGuitar: 'not_applicable',
    },
  },
  'song-020': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'optional',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
    },
    fallbacks: {
      missingLeadGuitar: 'program_lead',
      missingKeyboard: 'not_applicable',
      missingDrums: 'program_drums',
    },
  },
  'song-021': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'none',
    },
    parts: {
      vocals: { minLevel: 4 },
      rhythmGuitar: { minLevel: 3 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
    },
    fallbacks: {
      missingLeadGuitar: 'program_lead',
      missingKeyboard: 'not_applicable',
    },
  },
  'song-025': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'optional', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'important',
    },
    parts: {
      vocals: { minLevel: 2 },
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      drums: { minLevel: 2 },
      keyboard: { minLevel: 3 },
    },
    fallbacks: {
      missingKeyboard: 'program_pad',
      missingLeadGuitar: 'combine_into_rhythm',
    },
  },
  'song-040': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'optional', rhythm: 'required' },
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
    fallbacks: { missingKeyboard: 'program_pad', missingLeadGuitar: 'combine_into_rhythm' },
  },
  'song-051': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'optional', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 4 },
      bass: { minLevel: 5 },
      drums: { minLevel: 4 },
      keyboard: { minLevel: 3 },
    },
    fallbacks: { missingKeyboard: 'program_pad', missingLeadGuitar: 'combine_into_rhythm' },
  },
  'song-056': {
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 0, lead: 'none', rhythm: 'none' },
      bass: 'required',
      drums: 'required',
      keyboard: 'important',
    },
    parts: {
      bass: { minLevel: 4 },
      drums: { minLevel: 4 },
      keyboard: { minLevel: 4 },
    },
    fallbacks: {
      missingVocals: 'instrumental_ok',
      missingLeadGuitar: 'not_applicable',
      missingRhythmGuitar: 'not_applicable',
      missingKeyboard: 'program_pad',
    },
  },
  'song-057': {
    arrangement: {
      vocals: 'instrumental_ok',
      guitars: { count: 1, lead: 'none', rhythm: 'optional' },
      bass: 'optional',
      drums: 'none',
      keyboard: 'optional_pad',
    },
    parts: {
      rhythmGuitar: { minLevel: 2 },
      bass: { minLevel: 2 },
      keyboard: { minLevel: 2 },
    },
    fallbacks: {
      missingVocals: 'instrumental_ok',
      missingDrums: 'omit',
      missingLeadGuitar: 'not_applicable',
      missingKeyboard: 'program_pad',
    },
  },
  'song-063': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 0, lead: 'none', rhythm: 'none' },
      bass: 'none',
      drums: 'program_ok',
      keyboard: 'optional_pad',
    },
    parts: { vocals: { minLevel: 4 }, drums: { minLevel: 2 }, keyboard: { minLevel: 2 } },
    fallbacks: {
      missingRhythmGuitar: 'not_applicable',
      missingLeadGuitar: 'not_applicable',
      missingBass: 'program_bass',
      missingDrums: 'program_drums',
      missingKeyboard: 'program_pad',
    },
  },
  'song-064': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 2, lead: 'required', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'optional_pad',
    },
    parts: {
      vocals: { minLevel: 3 },
      rhythmGuitar: { minLevel: 4 },
      leadGuitar: { minLevel: 5 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
      keyboard: { minLevel: 3 },
    },
    fallbacks: { missingLeadGuitar: 'program_lead', missingKeyboard: 'program_pad' },
  },
  'song-065': {
    arrangement: {
      vocals: 'required',
      guitars: { count: 1, lead: 'optional', rhythm: 'required' },
      bass: 'required',
      drums: 'required',
      keyboard: 'required',
    },
    parts: {
      vocals: { minLevel: 5 },
      rhythmGuitar: { minLevel: 4 },
      leadGuitar: { minLevel: 4 },
      bass: { minLevel: 3 },
      drums: { minLevel: 3 },
      keyboard: { minLevel: 4 },
    },
    fallbacks: { missingLeadGuitar: 'program_lead', missingKeyboard: 'program_pad' },
  },
};

function level(legacy: LegacySong, key: string, fallback = 2): number {
  return legacy.minSkillLevel?.[key] ?? fallback;
}

function inferKeyboardRequirement(legacy: LegacySong): SongArrangement['keyboard'] {
  const kb = level(legacy, 'KEYBOARD', 1);
  if (kb <= 1) return 'none';
  if (kb === 2) return 'optional_pad';
  if (kb === 3) return 'important';
  return 'required';
}

function inferDualGuitar(legacy: LegacySong): boolean {
  const notes = legacy.notes ?? '';
  const title = legacy.title;
  if (/双吉他|solo|主音|尾奏| riff/i.test(notes)) return true;
  if (/Hotel California|Sweet Child|Stairway|Bohemian/i.test(title)) return true;
  const g = level(legacy, 'GUITAR');
  return g >= 4 && legacy.style === 'rock';
}

function autoMigrate(legacy: LegacySong): PartialSeedSong {
  const dual = inferDualGuitar(legacy);
  const kbReq = inferKeyboardRequirement(legacy);
  const drumsLevel = level(legacy, 'DRUMS');
  const bassLevel = level(legacy, 'BASS');
  const vocalLevel = level(legacy, 'VOCALS');
  const guitarLevel = level(legacy, 'GUITAR');
  const kbLevel = level(legacy, 'KEYBOARD', 1);

  const arrangement: SongArrangement = {
    vocals: vocalLevel <= 1 ? 'instrumental_ok' : 'required',
    guitars: dual
      ? { count: 2, lead: 'required', rhythm: 'required' }
      : { count: 1, lead: guitarLevel >= 3 ? 'optional' : 'none', rhythm: 'required' },
    bass: bassLevel <= 1 ? 'none' : bassLevel === 2 ? 'optional' : 'required',
    drums:
      drumsLevel <= 1 ? 'optional' : drumsLevel >= 4 ? 'required' : 'program_ok',
    keyboard: kbReq,
  };

  const parts: SongParts = {};

  if (arrangement.vocals !== 'instrumental_ok') {
    parts.vocals = { minLevel: vocalLevel };
  }
  if (arrangement.guitars.rhythm !== 'none') {
    parts.rhythmGuitar = { minLevel: guitarLevel };
  }
  if (arrangement.guitars.lead !== 'none') {
    parts.leadGuitar = { minLevel: Math.min(5, guitarLevel + (dual ? 1 : 0)) };
  }
  if (arrangement.bass !== 'none') {
    parts.bass = { minLevel: bassLevel };
  }
  if (arrangement.drums !== 'optional' || drumsLevel > 1) {
    parts.drums = { minLevel: Math.max(1, drumsLevel) };
  }
  if (arrangement.keyboard !== 'none') {
    parts.keyboard = { minLevel: Math.max(2, kbLevel) };
  }

  const fallbacks: SongFallbacks = {
    missingLeadGuitar:
      arrangement.guitars.lead === 'none'
        ? 'not_applicable'
        : arrangement.guitars.count === 2
          ? 'program_lead'
          : 'combine_into_rhythm',
    missingRhythmGuitar: 'program_rhythm',
    missingBass:
      arrangement.bass === 'none' ? 'omit' : arrangement.bass === 'optional' ? 'omit' : 'program_bass',
    missingDrums:
      arrangement.drums === 'optional'
        ? 'omit'
        : arrangement.drums === 'program_ok'
          ? 'program_drums'
          : 'program_drums',
    missingKeyboard:
      arrangement.keyboard === 'none'
        ? 'not_applicable'
        : arrangement.keyboard === 'optional_pad'
          ? 'omit'
          : 'program_pad',
    missingVocals:
      arrangement.vocals === 'instrumental_ok' ? 'instrumental_ok' : 'not_applicable',
  };

  return { arrangement, parts, fallbacks };
}

function mergeSong(legacy: LegacySong): SeedSong {
  if (legacy.arrangement && legacy.parts && legacy.fallbacks) {
    return legacy as SeedSong;
  }

  const auto = autoMigrate(legacy);
  const override = OVERRIDES[legacy.id];
  const merged: PartialSeedSong = override
    ? {
        arrangement: { ...auto.arrangement, ...override.arrangement },
        parts: { ...auto.parts, ...override.parts },
        fallbacks: { ...auto.fallbacks, ...override.fallbacks },
      }
    : auto;

  return {
    id: legacy.id,
    title: legacy.title,
    artist: legacy.artist,
    style: legacy.style,
    styles: legacy.styles,
    bpm: legacy.bpm,
    notes: legacy.notes,
    arrangement: merged.arrangement!,
    parts: merged.parts!,
    fallbacks: merged.fallbacks!,
  };
}

function main(): void {
  const raw = JSON.parse(readFileSync(seedPath, 'utf-8')) as LegacyFile;
  const out: SongSeedFile = {
    version: 2,
    generatedAt: new Date().toISOString().slice(0, 10),
    description:
      'Phase 2 曲库 seed v2：编制 (arrangement)、分声部难度 (parts)、缺人方案 (fallbacks)。AI 写推荐语，规则引擎筛候选。',
    songs: raw.songs.map(mergeSong),
  };

  writeFileSync(seedPath, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');
  console.log(`Migrated ${out.songs.length} songs → v2 at ${seedPath}`);
}

main();
