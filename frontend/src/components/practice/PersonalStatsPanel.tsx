import type { PersonalPracticeStats } from '../../types/practice';

export function PersonalStatsPanel({ stats }: { stats: PersonalPracticeStats }) {
  return (
    <div className="poster-card poster-card-accent rounded-xl p-5">
      <p className="rock-kicker">MY STATS</p>
      <h3 className="section-title mt-1">我的练习</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatBlock
          label="连续打卡"
          kicker="STREAK"
          number={stats.streakDays > 0 ? String(stats.streakDays) : '—'}
          unit={stats.streakDays > 0 ? '天' : '尚未开始'}
          highlight={stats.streakDays >= 3}
          showFire={stats.streakDays > 0}
        />
        <StatBlock
          label="本周"
          kicker="WEEK"
          number={String(stats.weekMinutes)}
          unit="分钟"
          sub={`打卡 ${stats.weekCheckInDays} 天`}
        />
        <StatBlock
          label="本月"
          kicker="MONTH"
          number={String(stats.monthMinutes)}
          unit="分钟"
          sub={`打卡 ${stats.monthCheckInDays} 天`}
        />
      </div>
      {stats.streakDays === 0 && stats.weekCheckInDays === 0 && (
        <p className="mt-3 text-xs text-slate-500">今天练 15 分钟也很棒，先完成第一次打卡吧。</p>
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
      <p className="mt-0.5 text-[0.6875rem] text-slate-500">{label}</p>
      <p className="mt-1">
        {showFire && <span className="mr-1 text-base">🔥</span>}
        <span className="stat-number">{number}</span>
        <span className="stat-unit">{unit}</span>
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
