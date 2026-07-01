import { useLocale } from '../../hooks/useLocale';
import type { PersonalPracticeStats } from '../../types/practice';

export function PersonalStatsPanel({ stats }: { stats: PersonalPracticeStats }) {
  const { t } = useLocale();

  return (
    <div className="poster-card poster-card-accent rounded-xl p-5">
      <p className="rock-kicker">MY STATS</p>
      <h3 className="section-title mt-1">{t('practice.stats.myPractice')}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatBlock
          label={t('practice.stats.streak')}
          kicker="STREAK"
          number={stats.streakDays > 0 ? String(stats.streakDays) : '—'}
          unit={stats.streakDays > 0 ? t('common.days') : t('practice.stats.streakNotStarted')}
          highlight={stats.streakDays >= 3}
          showFire={stats.streakDays > 0}
        />
        <StatBlock
          label={t('practice.stats.thisWeek')}
          kicker="WEEK"
          number={String(stats.weekMinutes)}
          unit={t('common.minutes')}
          sub={`${t('practice.stats.checkInDays')} ${stats.weekCheckInDays}`}
        />
        <StatBlock
          label={t('practice.stats.thisMonth')}
          kicker="MONTH"
          number={String(stats.monthMinutes)}
          unit={t('common.minutes')}
          sub={`${t('practice.stats.checkInDays')} ${stats.monthCheckInDays}`}
        />
      </div>
      {stats.streakDays === 0 && stats.weekCheckInDays === 0 && (
        <p className="mt-3 text-xs text-slate-500">{t('practice.stats.encouragement')}</p>
      )}
    </div>
  );
}

function StatBlock({
  label,
  kicker,
  number,
  unit,
  sub,
  highlight,
  showFire,
}: {
  label: string;
  kicker: string;
  number: string;
  unit: string;
  sub?: string;
  highlight?: boolean;
  showFire?: boolean;
}) {
  return (
    <div className={`stat-cell rounded-lg px-3 py-3 ${highlight ? 'stat-cell-hot' : ''}`}>
      <p className="rock-label">{kicker}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
      <p className="mt-1">
        {showFire && <span className="mr-1 text-base">🔥</span>}
        <span className="stat-number">{number}</span>
        <span className="stat-unit">{unit}</span>
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
