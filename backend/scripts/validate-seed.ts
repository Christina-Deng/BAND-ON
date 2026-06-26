/**
 * Validate songs.seed.json against v2 invariants.
 * Run: npm run validate:seed
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeedSong, SongSeedFile } from '../src/types/seedSong.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = join(__dirname, '../data/songs.seed.json');

const PART_IDS = [
  'vocals',
  'rhythmGuitar',
  'leadGuitar',
  'bass',
  'drums',
  'keyboard',
] as const;

function validateSong(song: SeedSong, errors: string[]): void {
  if (!/^song-[0-9]{3}$/.test(song.id)) {
    errors.push(`${song.id}: id must match song-NNN`);
  }

  const { arrangement, parts, fallbacks } = song;

  if (arrangement.guitars.count === 0 && (parts.rhythmGuitar || parts.leadGuitar)) {
    errors.push(`${song.id}: guitars.count=0 but guitar parts defined`);
  }
  if (arrangement.guitars.lead === 'none' && parts.leadGuitar) {
    errors.push(`${song.id}: lead=none but leadGuitar part present`);
  }
  if (arrangement.keyboard === 'none' && parts.keyboard) {
    errors.push(`${song.id}: keyboard=none but keyboard part present`);
  }
  if (arrangement.bass === 'none' && parts.bass) {
    errors.push(`${song.id}: bass=none but bass part present`);
  }

  for (const part of PART_IDS) {
    const skill = parts[part];
    if (skill && (skill.minLevel < 1 || skill.minLevel > 5)) {
      errors.push(`${song.id}: parts.${part}.minLevel must be 1–5`);
    }
  }

  if (arrangement.guitars.count === 2 && fallbacks.missingLeadGuitar === 'not_applicable') {
    errors.push(`${song.id}: dual-guitar song should define missingLeadGuitar fallback`);
  }
  if (arrangement.keyboard !== 'none' && !fallbacks.missingKeyboard) {
    errors.push(`${song.id}: keyboard expected but missingKeyboard fallback missing`);
  }
}

function main(): void {
  const data = JSON.parse(readFileSync(seedPath, 'utf-8')) as SongSeedFile;
  const errors: string[] = [];

  if (data.version !== 2) {
    errors.push(`Expected version 2, got ${data.version}`);
  }

  const ids = new Set<string>();
  for (const song of data.songs) {
    if (ids.has(song.id)) errors.push(`Duplicate id ${song.id}`);
    ids.add(song.id);
    validateSong(song, errors);
  }

  if (errors.length > 0) {
    console.error('Seed validation failed:\n');
    for (const e of errors) console.error(`  · ${e}`);
    process.exit(1);
  }

  console.log(`OK — ${data.songs.length} songs, schema v${data.version}`);
}

main();
