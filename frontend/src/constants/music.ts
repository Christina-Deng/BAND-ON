import type { Locale } from '../lib/i18n/locale';
import type { Instrument } from '../types/band';

/** Curated genres for band / rehearsal contexts (CN + international). */
export const MUSIC_STYLES = [
  { id: 'rock', label: '摇滚', labelEn: 'Rock' },
  { id: 'pop', label: '流行', labelEn: 'Pop' },
  { id: 'indie', label: '独立', labelEn: 'Indie' },
  { id: 'folk', label: '民谣', labelEn: 'Folk' },
  { id: 'punk', label: '朋克', labelEn: 'Punk' },
  { id: 'postpunk', label: '后朋', labelEn: 'Post-punk' },
  { id: 'hardcore', label: '硬核', labelEn: 'Hardcore' },
  { id: 'emo', label: 'Emo', labelEn: 'Emo' },
  { id: 'grunge', label: 'Grunge', labelEn: 'Grunge' },
  { id: 'mathrock', label: '数摇', labelEn: 'Math rock' },
  { id: 'postrock', label: '后摇', labelEn: 'Post-rock' },
  { id: 'prog', label: '前卫摇滚', labelEn: 'Progressive rock' },
  { id: 'shoegaze', label: '自赏', labelEn: 'Shoegaze' },
  { id: 'metal', label: '金属', labelEn: 'Metal' },
  { id: 'deathcore', label: '死旋 / 死核', labelEn: 'Deathcore / death metal' },
  { id: 'blues', label: '蓝调', labelEn: 'Blues' },
  { id: 'funk', label: '放克', labelEn: 'Funk' },
  { id: 'jazz', label: '爵士', labelEn: 'Jazz' },
  { id: 'rnb', label: 'R&B / Soul', labelEn: 'R&B / Soul' },
  { id: 'reggae', label: '雷鬼', labelEn: 'Reggae' },
  { id: 'acg', label: 'ACG（动漫/游戏）', labelEn: 'ACG (anime / games)' },
  { id: 'electronic', label: '电子', labelEn: 'Electronic' },
  { id: 'country', label: '乡村', labelEn: 'Country' },
  { id: 'classical', label: '古典 / 融合', labelEn: 'Classical / fusion' },
  { id: 'world', label: '世界音乐', labelEn: 'World' },
] as const;

export type MusicStyleId = (typeof MUSIC_STYLES)[number]['id'];

const LEGACY_STYLE_LABELS: Record<string, { zh: string; en: string }> = {
  hiphop: { zh: '嘻哈 / 说唱', en: 'Hip-hop / rap' },
};

export function getStyleLabel(id: string, locale: Locale = 'zh'): string {
  const style = MUSIC_STYLES.find((s) => s.id === id);
  if (style) return locale === 'en' ? style.labelEn : style.label;
  const legacy = LEGACY_STYLE_LABELS[id];
  if (legacy) return locale === 'en' ? legacy.en : legacy.zh;
  return id;
}

export function formatStylePreferences(
  ids: string[] | null | undefined,
  locale: Locale = 'zh',
): string {
  if (!ids?.length) return '';
  const sep = locale === 'en' ? ', ' : '、';
  return ids.map((id) => getStyleLabel(id, locale)).join(sep);
}

const INSTRUMENT_LABELS_ZH: Record<Instrument, string> = {
  GUITAR: '吉他',
  BASS: '贝斯',
  DRUMS: '鼓',
  VOCALS: '主唱',
  KEYBOARD: '键盘',
  OTHER: '其他',
};

const INSTRUMENT_LABELS_EN: Record<Instrument, string> = {
  GUITAR: 'Guitar',
  BASS: 'Bass',
  DRUMS: 'Drums',
  VOCALS: 'Vocals',
  KEYBOARD: 'Keyboard',
  OTHER: 'Other',
};

export function getInstrumentLabel(instrument: Instrument, locale: Locale = 'zh'): string {
  return locale === 'en' ? INSTRUMENT_LABELS_EN[instrument] : INSTRUMENT_LABELS_ZH[instrument];
}

export const INSTRUMENT_LABELS = INSTRUMENT_LABELS_ZH;

const INSTRUMENT_SKILL_QUESTIONS_ZH: Record<Instrument, string[]> = {
  GUITAR: [
    '开放和弦与稳定扫弦/分解',
    '横按和弦与流畅转换',
    '五声音阶或主音 solo 即兴',
    '推弦、闷音、滑音等 articulation',
    '视谱或准确跟 Tab/谱',
  ],
  BASS: [
    '根音跟弹与基本 groove',
    '音阶把位与跨弦移动',
    '切分、加花与 ghost note',
    '指弹与拨片技法',
    '视谱或准确跟谱',
  ],
  DRUMS: [
    '基本四拍 / 常见 rock-pop 节奏型',
    '军鼓技法与滚奏控制',
    '手脚分离（踩镲 + 底鼓独立）',
    '复合拍与切分节奏',
    '动态控制与段落 fill',
  ],
  VOCALS: [
    '音准稳定、少跑调',
    '气息支撑与长句控制',
    '真假声 / 混声转换',
    '和声叠唱与双声部',
    '话筒技巧与舞台表现',
  ],
  KEYBOARD: [
    '三和弦及基本分解伴奏',
    '左右手独立与常见 comping 型',
    '大小调音阶与简单即兴',
    '延音踏板与触键力度控制',
    '视谱或准确跟谱',
  ],
  OTHER: [
    '基本音色与正确演奏姿势',
    '节奏稳定、能跟 band',
    '完整演奏简单曲目',
    '本乐器基础技法',
    '视谱或跟谱',
  ],
};

const INSTRUMENT_SKILL_QUESTIONS_EN: Record<Instrument, string[]> = {
  GUITAR: [
    'Open chords with steady strumming / picking',
    'Barre chords and smooth changes',
    'Pentatonic or lead solo improvisation',
    'Bends, muting, slides, and articulation',
    'Read notation or follow tabs accurately',
  ],
  BASS: [
    'Root notes with basic groove',
    'Scale positions and cross-string movement',
    'Syncopation, fills, and ghost notes',
    'Fingerstyle and pick technique',
    'Read notation or follow charts',
  ],
  DRUMS: [
    'Basic 4/4 and common rock-pop grooves',
    'Snare technique and roll control',
    'Limb independence (hi-hat + kick)',
    'Odd meters and syncopated patterns',
    'Dynamics and section fills',
  ],
  VOCALS: [
    'Stable pitch',
    'Breath support and long phrases',
    'Chest / head / mixed voice transitions',
    'Harmonies and two-part backing',
    'Mic technique and stage presence',
  ],
  KEYBOARD: [
    'Triads and basic broken chords',
    'Hand independence and comping patterns',
    'Major / minor scales and simple improv',
    'Sustain pedal and touch dynamics',
    'Read notation or follow charts',
  ],
  OTHER: [
    'Basic tone and posture',
    'Steady time with the band',
    'Play simple songs end-to-end',
    'Core technique on your instrument',
    'Read notation or follow charts',
  ],
};

export const INSTRUMENT_SKILL_QUESTIONS = INSTRUMENT_SKILL_QUESTIONS_ZH;

export function getInstrumentSkillQuestions(
  instrument: Instrument,
  locale: Locale = 'zh',
): string[] {
  return locale === 'en'
    ? INSTRUMENT_SKILL_QUESTIONS_EN[instrument]
    : INSTRUMENT_SKILL_QUESTIONS_ZH[instrument];
}

const PLAYING_EXPERIENCE_ZH: Record<string, string> = {
  '<1': '新手（不到 1 年）',
  '1-3': '1–3 年',
  '3-5': '3–5 年',
  '5+': '5 年以上',
};

const PLAYING_EXPERIENCE_EN: Record<string, string> = {
  '<1': 'Beginner (< 1 year)',
  '1-3': '1–3 years',
  '3-5': '3–5 years',
  '5+': '5+ years',
};

export const PLAYING_EXPERIENCE_OPTIONS = [
  ['<1', PLAYING_EXPERIENCE_ZH['<1']],
  ['1-3', PLAYING_EXPERIENCE_ZH['1-3']],
  ['3-5', PLAYING_EXPERIENCE_ZH['3-5']],
  ['5+', PLAYING_EXPERIENCE_ZH['5+']],
] as const;

export function getPlayingExperienceOptions(locale: Locale = 'zh') {
  const labels = locale === 'en' ? PLAYING_EXPERIENCE_EN : PLAYING_EXPERIENCE_ZH;
  return (Object.keys(labels) as Array<keyof typeof labels>).map((id) => [id, labels[id]] as const);
}

export function formatPlayingExperience(
  experience: string | undefined,
  locale: Locale = 'zh',
): string | null {
  if (!experience) return null;
  const labels = locale === 'en' ? PLAYING_EXPERIENCE_EN : PLAYING_EXPERIENCE_ZH;
  return labels[experience] ?? experience;
}

export function resolveStylePreferenceIds(answers: {
  stylePreferences?: string[];
  stylePreference?: string;
}): string[] {
  if (answers.stylePreferences?.length) return answers.stylePreferences;
  if (answers.stylePreference && answers.stylePreference !== 'any') {
    return [answers.stylePreference];
  }
  return [];
}

export function getMusicStyleOptions(locale: Locale = 'zh') {
  return MUSIC_STYLES.map((s) => ({
    id: s.id,
    label: locale === 'en' ? s.labelEn : s.label,
  }));
}
