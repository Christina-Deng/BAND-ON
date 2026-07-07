import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { useLocale } from '../hooks/useLocale';

const GEAR_ITEMS = [
  { id: 'strings', nameKey: 'community.gear.strings', priceKey: 'community.gear.stringsPrice', tierKey: 'community.gear.stringsTier', icon: '🎸' },
  { id: 'picks', nameKey: 'community.gear.picks', priceKey: 'community.gear.picksPrice', tierKey: 'community.gear.picksTier', icon: '🎵' },
  { id: 'sticks', nameKey: 'community.gear.sticks', priceKey: 'community.gear.sticksPrice', tierKey: 'community.gear.sticksTier', icon: '🥁' },
  { id: 'pad', nameKey: 'community.gear.pad', priceKey: 'community.gear.padPrice', tierKey: 'community.gear.padTier', icon: '🔇' },
  { id: 'cables', nameKey: 'community.gear.cables', priceKey: 'community.gear.cablesPrice', tierKey: 'community.gear.cablesTier', icon: '🔌' },
  { id: 'tuner', nameKey: 'community.gear.tuner', priceKey: 'community.gear.tunerPrice', tierKey: 'community.gear.tunerTier', icon: '🎼' },
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
      <p className="text-xs text-slate-500">{t('community.gear.priceReference')}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GEAR_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-xl border border-slate-700 bg-slate-900 p-4"
          >
            <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-slate-800 text-4xl">
              {item.icon}
            </div>
            <h3 className="font-semibold text-emphasis">{t(item.nameKey)}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t(item.tierKey)}</p>
            <p className="mt-2 text-sm font-medium text-accent-400">{t(item.priceKey)}</p>
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
