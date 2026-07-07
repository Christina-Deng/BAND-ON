import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCommunityPost } from '../api/community';
import { PageHeader } from '../components/layout/PageHeader';
import { useLocale } from '../hooks/useLocale';
import { getApiErrorMessage } from '../api/client';
import type { CommunityPostType } from '../types/community';

const TYPE_OPTIONS: Array<{ value: CommunityPostType; labelKey: string }> = [
  { value: 'ANNOUNCEMENT', labelKey: 'community.types.announcement' },
  { value: 'RECRUITMENT', labelKey: 'community.types.recruitment' },
  { value: 'GIG_REQUEST', labelKey: 'community.types.gigRequest' },
];

export function CommunityPostNewPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [type, setType] = useState<CommunityPostType>('RECRUITMENT');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventAt, setEventAt] = useState('');
  const [location, setLocation] = useState('');
  const [budgetNote, setBudgetNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const post = await createCommunityPost({
        type,
        title,
        body,
        eventAt: eventAt ? new Date(eventAt).toISOString() : null,
        location: location || null,
        budgetNote: type === 'GIG_REQUEST' ? budgetNote || null : null,
      });
      navigate(`/community/${post.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t('community.newPostTitle')} lead={t('community.newPostLead')} />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">{t('community.form.type')}</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CommunityPostType)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">{t('community.form.title')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">{t('community.form.body')}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={5}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">{t('community.form.eventAt')}</span>
            <input
              type="datetime-local"
              value={eventAt}
              onChange={(e) => setEventAt(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">{t('community.form.location')}</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
        </div>

        {type === 'GIG_REQUEST' && (
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">{t('community.form.budgetNote')}</span>
            <input
              value={budgetNote}
              onChange={(e) => setBudgetNote(e.target.value)}
              placeholder={t('community.form.budgetPlaceholder')}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            />
          </label>
        )}

        {error && (
          <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {submitting ? t('common.submitting') : t('common.submit')}
          </button>
          <Link
            to="/community"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}
