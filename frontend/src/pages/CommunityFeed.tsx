import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCommunityPosts } from '../api/community';
import { CommunityPostCard } from '../components/community/CommunityPostCard';
import { PageHeader } from '../components/layout/PageHeader';
import { useLocale } from '../hooks/useLocale';
import { getApiErrorMessage } from '../api/client';
import type { CommunityPostSummary, CommunityPostType } from '../types/community';
import type { CommunitySort } from '../api/community';

const FILTERS: Array<{ value: CommunityPostType | 'ALL'; labelKey: string }> = [
  { value: 'ALL', labelKey: 'community.filters.all' },
  { value: 'ANNOUNCEMENT', labelKey: 'community.types.announcement' },
  { value: 'RECRUITMENT', labelKey: 'community.types.recruitment' },
  { value: 'GIG_REQUEST', labelKey: 'community.types.gigRequest' },
];

const SORTS: Array<{ value: CommunitySort; labelKey: string }> = [
  { value: 'upcoming', labelKey: 'community.sort.upcoming' },
  { value: 'latest', labelKey: 'community.sort.latest' },
];

export function CommunityFeedPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<CommunityPostType | 'ALL'>('ALL');
  const [sort, setSort] = useState<CommunitySort>('upcoming');
  const [mineOnly, setMineOnly] = useState(false);
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus('loading');
    void listCommunityPosts({
      type: filter === 'ALL' ? undefined : filter,
      sort,
      mine: mineOnly,
    })
      .then((items) => {
        setPosts(items);
        setStatus('ok');
      })
      .catch((err) => {
        setError(getApiErrorMessage(err));
        setStatus('error');
      });
  }, [filter, sort, mineOnly]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('community.title')}
        lead={t('community.lead')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/community/gear"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:bg-slate-800"
            >
              {t('community.gearLink')}
            </Link>
            <Link
              to="/community/new"
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500"
            >
              {t('community.newPost')}
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === item.value
                ? 'bg-accent-600 text-white'
                : 'border border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMineOnly((v) => !v)}
          className={`rounded-full px-3 py-1 text-sm ${
            mineOnly
              ? 'bg-accent-600 text-white'
              : 'border border-slate-600 text-slate-400 hover:border-slate-500'
          }`}
        >
          {t('community.filters.mine')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">{t('community.sort.label')}</span>
        {SORTS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSort(item.value)}
            className={`rounded-full px-3 py-1 ${
              sort === item.value
                ? 'bg-slate-700 text-emphasis'
                : 'border border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="text-slate-400">{t('common.loading')}</p>}
      {status === 'error' && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {status === 'ok' && posts.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-8 text-center text-slate-400">
          {t('community.empty')}
        </p>
      )}
      {status === 'ok' && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
