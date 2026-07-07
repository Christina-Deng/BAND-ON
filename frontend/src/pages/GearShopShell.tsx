import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { useLocale } from '../hooks/useLocale';

const GEAR_ITEMS = [
  { id: 'strings', nameKey: 'community.gear.strings', price: '¥29 起' },
  { id: 'picks', nameKey: 'community.gear.picks', price: '¥15 起' },
  { id: 'sticks', nameKey: 'community.gear.sticks', price: '¥39 起' },
  { id: 'pad', nameKey: 'community.gear.pad', price: '¥89 起' },
  { id: 'cables', nameKey: 'community.gear.cables', price: '¥49 起' },
  { id: 'tuner', nameKey: 'community.gear.tuner', price: '¥59 起' },
] as const;

export function GearShopShellPage() {
  const { t } = useLocale();

  function handleComingSoon() {
    window.alert(t('community.gear.comingSoon'));
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('community.gear.title')} lead={t('community.gear.lead')} />
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
        {t('community.gear.disclaimer')}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GEAR_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-xl border border-slate-700 bg-slate-900 p-4"
          >
            <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-slate-800 text-3xl">
              🎸
            </div>
            <h3 className="font-semibold text-emphasis">{t(item.nameKey)}</h3>
            <p className="mt-1 text-sm text-slate-400">{item.price}</p>
            <button
              type="button"
              onClick={handleComingSoon}
              className="mt-4 rounded-lg border border-accent-500 px-3 py-2 text-sm text-accent-400 hover:bg-accent-500/10"
            >
              {t('community.gear.cta')}
            </button>
          </div>
        ))}
      </div>
      <Link to="/community" className="inline-block text-sm text-accent-500 hover:underline">
        {t('community.backToFeed')}
      </Link>
    </div>
  );
}
