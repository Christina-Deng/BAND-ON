const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type DetectedNote = {
  name: string;
  cents: number;
  frequency: number;
};

export function frequencyToNote(frequency: number): DetectedNote {
  const noteNumber = 12 * (Math.log2(frequency / 440)) + 69;
  const rounded = Math.round(noteNumber);
  const cents = Math.round((noteNumber - rounded) * 100);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { name: `${name}${octave}`, cents, frequency };
}

/** Autocorrelation pitch detection (returns Hz, or -1 if silent). */
export function detectPitch(samples: Float32Array<ArrayBufferLike>, sampleRate: number): number {
  const buf = samples;

  let sum = 0;
  for (let i = 0; i < buf.length; i += 1) {
    sum += buf[i] * buf[i];
  }
  const rms = Math.sqrt(sum / buf.length);
  if (rms < 0.01) return -1;

  let start = 0;
  let end = buf.length - 1;
  const threshold = 0.2;
  for (let i = 0; i < buf.length / 2; i += 1) {
    if (Math.abs(buf[i]) < threshold) {
      start = i;
      break;
    }
  }
  for (let i = 1; i < buf.length / 2; i += 1) {
    if (Math.abs(buf[buf.length - i]) < threshold) {
      end = buf.length - i;
      break;
    }
  }

  const trimmed = buf.subarray(start, end);
  const size = trimmed.length;
  const correlation = new Float32Array(size);

  for (let lag = 0; lag < size; lag += 1) {
    let value = 0;
    for (let i = 0; i < size - lag; i += 1) {
      value += trimmed[i] * trimmed[i + lag];
    }
    correlation[lag] = value;
  }

  let peak = 1;
  while (peak < size - 1 && correlation[peak] > correlation[peak + 1]) {
    peak += 1;
  }

  let maxLag = peak;
  let maxValue = correlation[peak];
  for (let lag = peak; lag < size; lag += 1) {
    if (correlation[lag] > maxValue) {
      maxValue = correlation[lag];
      maxLag = lag;
    }
  }

  if (maxLag <= 0) return -1;

  const y1 = correlation[maxLag - 1] ?? correlation[maxLag];
  const y2 = correlation[maxLag];
  const y3 = correlation[maxLag + 1] ?? correlation[maxLag];
  const refinedLag = maxLag + (y3 - y1) / (2 * (2 * y2 - y1 - y3));

  const frequency = sampleRate / refinedLag;
  if (frequency < 35 || frequency > 2000) return -1;
  return frequency;
}

export const GUITAR_STRINGS = [
  { label: 'E₂', frequency: 82.41, instrument: 'guitar' as const },
  { label: 'A₂', frequency: 110.0, instrument: 'guitar' as const },
  { label: 'D₃', frequency: 146.83, instrument: 'guitar' as const },
  { label: 'G₃', frequency: 196.0, instrument: 'guitar' as const },
  { label: 'B₃', frequency: 246.94, instrument: 'guitar' as const },
  { label: 'E₄', frequency: 329.63, instrument: 'guitar' as const },
] as const;

export const BASS_STRINGS = [
  { label: 'E₁', frequency: 41.2, instrument: 'bass' as const },
  { label: 'A₁', frequency: 55.0, instrument: 'bass' as const },
  { label: 'D₂', frequency: 73.42, instrument: 'bass' as const },
  { label: 'G₂', frequency: 98.0, instrument: 'bass' as const },
] as const;

export type TuningString = (typeof GUITAR_STRINGS)[number] | (typeof BASS_STRINGS)[number];

export const ALL_TUNING_STRINGS: readonly TuningString[] = [...GUITAR_STRINGS, ...BASS_STRINGS];

export function nearestTuningString(frequency: number): {
  string: TuningString;
  diffHz: number;
} | null {
  if (frequency <= 0) return null;

  let best = ALL_TUNING_STRINGS[0];
  let bestDiff = Math.abs(frequency - best.frequency);

  for (const candidate of ALL_TUNING_STRINGS) {
    const diff = Math.abs(frequency - candidate.frequency);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }

  return { string: best, diffHz: frequency - best.frequency };
}
