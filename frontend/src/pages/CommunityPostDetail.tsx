import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  cancelCommunityResponse,
  deleteCommunityPost,
  getCommunityPost,
  respondToCommunityPost,
} from '../api/community';
import { PageHeader } from '../components/layout/PageHeader';
import { useLocale } from '../hooks/useLocale';
import { getApiErrorMessage } from '../api/client';
import type { CommunityPostDetail } from '../types/community';

const TYPE_KEYS = {
  ANNOUNCEMENT: 'community.types.announcement',
  RECRUITMENT: 'community.types.recruitment',
  GIG_REQUEST: 'community.types.gigRequest',
} as const;

export function CommunityPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadPost() {
    if (!id) return;
    setStatus('loading');
    try {
      const data = await getCommunityPost(id);
      setPost(data);
      setStatus('ok');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setStatus('error');
    }
  }

  useEffect(() => {
    void loadPost();
  }, [id]);

  async function handleRespond() {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await respondToCommunityPost(id, message || undefined);
      setMessage('');
      await loadPost();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelResponse() {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await cancelCommunityResponse(id);
      await loadPost();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm(t('community.deleteConfirm'))) return;
    setActionLoading(true);
    try {
      await deleteCommunityPost(id);
      navigate('/community');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setActionLoading(false);
    }
  }

  if (status === 'loading') {
    return <p className="text-slate-400">{t('common.loading')}</p>;
  }

  if (status === 'error' || !post) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {error || t('community.notFound')}
        </p>
        <Link to="/community" className="text-accent-500 hover:underline">
          {t('community.backToFeed')}
        </Link>
      </div>
    );
  }

  const eventLabel =
    post.eventAt != null
      ? new Date(post.eventAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={post.title}
        lead={
          <span className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span className="rounded-full bg-accent-600/15 px-2 py-0.5 text-accent-400">
              {t(TYPE_KEYS[post.type])}
            </span>
            <span>{post.author.displayName}</span>
          </span>
        }
      />

      <article className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
        <p className="whitespace-pre-wrap text-slate-300">{post.body}</p>
        {(eventLabel || post.location || post.budgetNote) && (
          <dl className="space-y-1 border-t border-slate-700 pt-4 text-sm">
            {eventLabel && (
              <div>
                <dt className="text-slate-500">{t('community.form.eventAt')}</dt>
                <dd className="text-slate-300">{eventLabel}</dd>
              </div>
            )}
            {post.location && (
              <div>
                <dt className="text-slate-500">{t('community.form.location')}</dt>
                <dd className="text-slate-300">{post.location}</dd>
              </div>
            )}
            {post.budgetNote && (
              <div>
                <dt className="text-slate-500">{t('community.form.budgetNote')}</dt>
                <dd className="text-slate-300">{post.budgetNote}</dd>
              </div>
            )}
          </dl>
        )}
      </article>

      {error && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {post.isAuthor ? (
        <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h3 className="font-semibold text-emphasis">{t('community.responsesTitle')}</h3>
          {post.responses && post.responses.length > 0 ? (
            <ul className="space-y-2">
              {post.responses.map((response) => (
                <li
                  key={response.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-emphasis">{response.user.displayName}</p>
                  {response.message && <p className="text-slate-400">{response.message}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{t('community.noResponses')}</p>
          )}
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleDelete()}
            className="rounded-lg border border-accent-600 px-4 py-2 text-sm text-accent-400 hover:bg-accent-600/10 disabled:opacity-50"
          >
            {t('community.deletePost')}
          </button>
        </section>
      ) : (
        <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-5">
          {post.hasResponded ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-300">{t('community.alreadyResponded')}</p>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleCancelResponse()}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {t('community.cancelResponse')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="text-slate-400">{t('community.responseMessage')}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
                  placeholder={t('community.responsePlaceholder')}
                />
              </label>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleRespond()}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
              >
                {actionLoading ? t('common.submitting') : t('community.respond')}
              </button>
            </div>
          )}
        </section>
      )}

      <Link to="/community" className="inline-block text-sm text-accent-500 hover:underline">
        {t('community.backToFeed')}
      </Link>
    </div>
  );
}
