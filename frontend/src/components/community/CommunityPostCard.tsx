import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';
import type { CommunityPostSummary } from '../../types/community';

const TYPE_KEYS = {
  ANNOUNCEMENT: 'community.types.announcement',
  RECRUITMENT: 'community.types.recruitment',
  GIG_REQUEST: 'community.types.gigRequest',
} as const;

interface Props {
  post: CommunityPostSummary;
}

export function CommunityPostCard({ post }: Props) {
  const { t, locale } = useLocale();

  const eventLabel =
    post.eventAt != null
      ? new Date(post.eventAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

  return (
    <Link
      to={`/community/${post.id}`}
      className="block rounded-xl border border-slate-700 bg-slate-900 p-4 transition hover:border-accent-500/50 hover:bg-slate-800/80"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-accent-600/15 px-2 py-0.5 font-medium text-accent-400">
          {t(TYPE_KEYS[post.type])}
        </span>
        <span className="text-slate-500">{post.author.displayName}</span>
        {post.responseCount > 0 && (
          <span className="text-slate-500">
            {t('community.responseCount', { count: post.responseCount })}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-emphasis">{post.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-400">{post.bodyPreview}</p>
      {(eventLabel || post.location) && (
        <p className="mt-2 text-xs text-slate-500">
          {[eventLabel, post.location].filter(Boolean).join(' · ')}
        </p>
      )}
    </Link>
  );
}
