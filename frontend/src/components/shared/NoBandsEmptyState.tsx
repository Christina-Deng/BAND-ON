import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';

interface Props {
  title?: string;
  description?: string;
}

export function NoBandsEmptyState({ title, description }: Props) {
  const { t } = useLocale();

  return (
    <div className="empty-state-panel rounded-xl p-8 text-center">
      <p className="text-lg text-slate-300">{title ?? t('band.empty.title')}</p>
      <p className="mt-2 text-sm text-slate-500">{description ?? t('band.empty.description')}</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg border border-accent-600 bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500"
      >
        {t('band.empty.cta')}
      </Link>
    </div>
  );
}
