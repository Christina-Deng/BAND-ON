import { useEffect, useMemo, useState } from 'react';
import {
  getInstrumentLabel,
  getInstrumentSkillQuestions,
  getPlayingExperienceOptions,
  resolveStylePreferenceIds,
} from '../../constants/music';
import { useLocale } from '../../hooks/useLocale';
import type { Instrument, PlayingExperience, QuestionnaireAnswers } from '../../types/band';
import { StyleMultiSelect } from './StyleMultiSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (answers: QuestionnaireAnswers, instrument: Instrument) => Promise<void>;
  initial?: {
    instrument: Instrument;
    questionnaireAnswers: QuestionnaireAnswers;
  } | null;
}

export function SkillQuestionnaire({ open, onClose, onSubmit, initial = null }: Props) {
  const { locale, t } = useLocale();
  const [instrument, setInstrument] = useState<Instrument>('GUITAR');
  const [playingExperience, setPlayingExperience] = useState<PlayingExperience>('1-3');
  const [stylePreferences, setStylePreferences] = useState<string[]>([]);
  const [skills, setSkills] = useState<boolean[]>([false, false, false, false, false]);
  const [loading, setLoading] = useState(false);

  const questions = useMemo(
    () => getInstrumentSkillQuestions(instrument, locale),
    [instrument, locale],
  );
  const experienceOptions = useMemo(() => getPlayingExperienceOptions(locale), [locale]);
  const instruments = useMemo(
    () =>
      (['GUITAR', 'BASS', 'DRUMS', 'VOCALS', 'KEYBOARD', 'OTHER'] as Instrument[]).map((value) => ({
        value,
        label: getInstrumentLabel(value, locale),
      })),
    [locale],
  );

  useEffect(() => {
    if (!open) return;

    if (!initial) {
      setInstrument('GUITAR');
      setPlayingExperience('1-3');
      setStylePreferences([]);
      setSkills([false, false, false, false, false]);
      return;
    }

    const { instrument: initialInstrument, questionnaireAnswers: answers } = initial;
    setInstrument(initialInstrument);
    setPlayingExperience(answers.playingExperience ?? answers.weeklyPracticeHours ?? '1-3');
    setStylePreferences(resolveStylePreferenceIds(answers));
    const questionCount = getInstrumentSkillQuestions(initialInstrument, locale).length;
    const saved = answers.instrumentSkills ?? [];
    setSkills(Array.from({ length: questionCount }, (_, index) => saved[index] ?? false));
  }, [open, initial, locale]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(
        { playingExperience, stylePreferences, instrumentSkills: skills },
        instrument,
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
      >
        <h2 className="text-lg font-semibold">
          {initial ? t('band.profile.titleEdit') : t('band.profile.titleComplete')}
        </h2>
        <p className="mt-1 text-xs text-slate-400">{t('band.profile.perBandHint')}</p>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-emphasis">{t('band.profile.instrument')}</h3>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={instrument}
            onChange={(e) => {
              setInstrument(e.target.value as Instrument);
              setSkills([false, false, false, false, false]);
            }}
          >
            {instruments.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-emphasis">{t('band.profile.experience')}</h3>
          <p className="text-xs text-slate-400">{t('band.profile.experienceHint')}</p>
          {experienceOptions.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="experience"
                checked={playingExperience === value}
                onChange={() => setPlayingExperience(value as PlayingExperience)}
              />
              {label}
            </label>
          ))}
        </section>

        <div className="mt-4">
          <StyleMultiSelect
            label={t('band.profile.personalStyles')}
            hint={t('band.profile.personalStylesHint')}
            selected={stylePreferences}
            onChange={setStylePreferences}
          />
        </div>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-emphasis">{t('band.profile.skills')}</h3>
          <p className="text-xs text-slate-400">{t('band.profile.skillsHint')}</p>
          {questions.map((label, index) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skills[index] ?? false}
                onChange={(e) => {
                  const next = [...skills];
                  next[index] = e.target.checked;
                  setSkills(next);
                }}
              />
              {t('band.profile.skillMastered', { label })}
            </label>
          ))}
        </section>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 hover:bg-slate-800">
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent-600 px-4 py-2 hover:bg-accent-500 disabled:opacity-50"
          >
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
