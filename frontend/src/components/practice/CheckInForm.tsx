import { useEffect, useMemo, useState } from 'react';
import type { Band } from '../../types/band';
import { useLocale } from '../../hooks/useLocale';
import { BandPicker } from '../band/BandPicker';

export type CheckInResult = {
  succeeded: string[];
  failed: string[];
  succeededBandIds: string[];
  failedBandIds: string[];
};

interface Props {
  bands: Band[];
  checkedInBandIds: string[];
  onSubmit: (input: {
    bandIds: string[];
    durationMinutes: number;
    note?: string;
    audio?: File;
  }) => Promise<CheckInResult>;
  onSuccess?: (result: CheckInResult, durationMinutes: number) => void;
}

export function CheckInForm({ bands, checkedInBandIds, onSubmit, onSuccess }: Props) {
  const { t } = useLocale();
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [note, setNote] = useState('');
  const [audio, setAudio] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkedInBandNames = useMemo(
    () =>
      bands.filter((band) => checkedInBandIds.includes(band.id)).map((band) => band.name),
    [bands, checkedInBandIds],
  );

  const allCheckedIn = bands.length > 0 && checkedInBandIds.length === bands.length;
  const listSep = t('common.listSep');

  useEffect(() => {
    setSelectedBandIds((prev) => prev.filter((id) => !checkedInBandIds.includes(id)));
  }, [checkedInBandIds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBandIds.length === 0) {
      setError(allCheckedIn ? t('practice.checkIn.errorAllDone') : t('practice.checkIn.errorSelectBand'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await onSubmit({
        bandIds: selectedBandIds,
        durationMinutes,
        note: note || undefined,
        audio,
      });

      if (result.succeeded.length === 0) {
        setError(t('practice.checkIn.errorDuplicate'));
        return;
      }

      onSuccess?.(result, durationMinutes);
      setNote('');
      setAudio(undefined);
      setSelectedBandIds([]);

      if (result.failed.length > 0) {
        setError(
          t('practice.checkIn.errorPartial', {
            succeeded: result.succeeded.join(listSep),
            failed: result.failed.join(listSep),
          }),
        );
      }
    } catch {
      setError(t('practice.checkIn.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="poster-card space-y-4 rounded-xl p-5">
      <div>
        <p className="rock-kicker">CHECK IN</p>
        <h3 className="section-title mt-1">{t('practice.checkIn.title')}</h3>
      </div>

      {checkedInBandNames.length > 0 && (
        <p className="profile-incomplete-banner rounded-lg px-3 py-2 text-sm">
          {t('practice.checkIn.checkedInToday', { names: checkedInBandNames.join(listSep) })}
        </p>
      )}

      <BandPicker
        bands={bands}
        selectedIds={selectedBandIds}
        onChange={setSelectedBandIds}
        disabledIds={checkedInBandIds}
        label={t('practice.checkIn.selectBand')}
        hint={
          allCheckedIn ? t('practice.checkIn.allDoneHint') : t('practice.checkIn.multiHint')
        }
        multiple
      />

      <label className="block text-sm">
        <span className="rock-label">MINUTES</span>
        <span className="mt-1 block text-slate-400">{t('practice.checkIn.duration')}</span>
        <input
          type="number"
          min={1}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          required
          disabled={allCheckedIn}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">{t('practice.checkIn.note')}</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          disabled={allCheckedIn}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">{t('practice.checkIn.recording')}</span>
        <input
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          className="mt-1 block w-full text-sm"
          onChange={(e) => setAudio(e.target.files?.[0])}
          disabled={allCheckedIn}
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || allCheckedIn}
        className="w-full rounded-lg bg-accent-600 px-4 py-2.5 font-medium hover:bg-accent-500 disabled:opacity-50"
      >
        {loading
          ? t('common.submitting')
          : allCheckedIn
            ? t('practice.checkIn.allDoneButton')
            : t('practice.checkIn.submit')}
      </button>
    </form>
  );
}
