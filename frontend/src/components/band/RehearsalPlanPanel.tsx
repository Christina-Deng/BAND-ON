import { useEffect, useMemo, useState } from 'react';
import { createRehearsalPlan, listRehearsalPlans } from '../../api/rehearsalPlans';
import { useLocale } from '../../hooks/useLocale';
import { getApiErrorMessage } from '../../api/client';
import type { RehearsalPlan } from '../../types/community';

interface Props {
  bandId: string;
}

interface SongDraft {
  songTitle: string;
}

export function RehearsalPlanPanel({ bandId }: Props) {
  const { t, locale } = useLocale();
  const [plans, setPlans] = useState<RehearsalPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');
  const [songs, setSongs] = useState<SongDraft[]>([{ songTitle: '' }]);
  const [submitting, setSubmitting] = useState(false);

  async function loadPlans() {
    setLoading(true);
    setError('');
    try {
      const items = await listRehearsalPlans(bandId);
      setPlans(items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, [bandId]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return plans
      .filter((plan) => new Date(plan.scheduledAt).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [plans]);

  const past = useMemo(() => {
    const now = Date.now();
    return plans.filter((plan) => new Date(plan.scheduledAt).getTime() < now);
  }, [plans]);

  function formatWhen(iso: string) {
    return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function resetForm() {
    setScheduledAt('');
    setNote('');
    setSongs([{ songTitle: '' }]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const filteredSongs = songs.filter((song) => song.songTitle.trim());
      await createRehearsalPlan(bandId, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: note || null,
        songs: filteredSongs,
      });
      resetForm();
      setShowForm(false);
      await loadPlans();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function renderPlan(plan: RehearsalPlan) {
    return (
      <div key={plan.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
        <p className="font-medium text-emphasis">{formatWhen(plan.scheduledAt)}</p>
        {plan.note && <p className="mt-1 text-sm text-slate-400">{plan.note}</p>}
        {plan.songs.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
            {plan.songs.map((song) => (
              <li key={song.id}>{song.songTitle}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-700/80 bg-slate-800/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t('rehearsalPlan.title')}
        </h3>
        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          className="rounded-lg border border-accent-500 px-3 py-1.5 text-xs font-medium text-accent-400 hover:bg-accent-500/10"
        >
          {showForm ? t('common.cancel') : t('rehearsalPlan.newPlan')}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">{t('common.loading')}</p>}
      {error && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{t('rehearsalPlan.upcoming')}</p>
          {upcoming.map(renderPlan)}
        </div>
      )}

      {!loading && upcoming.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">{t('rehearsalPlan.empty')}</p>
      )}

      {showForm && (
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 border-t border-slate-700 pt-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">{t('rehearsalPlan.scheduledAt')}</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">{t('rehearsalPlan.note')}</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
          <div className="space-y-2">
            <span className="text-sm text-slate-400">{t('rehearsalPlan.songs')}</span>
            {songs.map((song, index) => (
              <input
                key={index}
                value={song.songTitle}
                onChange={(e) => {
                  const next = [...songs];
                  next[index] = { songTitle: e.target.value };
                  setSongs(next);
                }}
                placeholder={t('rehearsalPlan.songPlaceholder')}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
              />
            ))}
            <button
              type="button"
              onClick={() => setSongs((rows) => [...rows, { songTitle: '' }])}
              className="text-xs text-accent-500 hover:underline"
            >
              {t('rehearsalPlan.addSong')}
            </button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {submitting ? t('common.creating') : t('rehearsalPlan.create')}
          </button>
        </form>
      )}

      {!loading && past.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-500">{t('rehearsalPlan.past')}</summary>
          <div className="mt-2 space-y-2">{past.map(renderPlan)}</div>
        </details>
      )}
    </section>
  );
}
