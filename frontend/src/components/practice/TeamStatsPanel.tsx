import type { BandPracticeStats } from '../../types/practice';

export function TeamStatsPanel({ stats, bandName }: { stats: BandPracticeStats; bandName: string }) {
  const { teamToday, weekMinutes, weekMostActive } = stats;
  const progress =
    teamToday.total > 0 ? Math.round((teamToday.checkedIn / teamToday.total) * 100) : 0;

  return (
    <div className="poster-card rounded-xl p-5">
      <p className="rock-kicker">CREW STATUS</p>
      <h3 className="section-title mt-1">{bandName}</h3>
      <p className="page-lead mt-0.5 text-xs">团队练习</p>

      <div className="mt-4 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="rock-label">TODAY</p>
            <p className="mt-1 text-[0.6875rem] text-slate-500">今日到练</p>
            <p className="mt-1">
              <span className="stat-number">{teamToday.checkedIn}</span>
              <span className="stat-number text-slate-500">/{teamToday.total}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="rock-label">MINS</p>
            <p className="mt-1">
              <span className="font-display text-2xl tracking-wide text-emphasis">{teamToday.totalMinutes}</span>
              <span className="stat-unit">分钟</span>
            </p>
          </div>
        </div>

        <div>
          <div className="rock-progress-track">
            <div className="rock-progress-fill transition-all" style={{ width: `${progress}%` }} />
          </div>
          {teamToday.allCheckedIn && teamToday.total > 0 && (
            <p className="mt-2 flex items-center gap-2 text-xs text-accent-400">
              <span className="rock-tag">FULL CREW</span>
              今日全员到齐
            </p>
          )}
        </div>

        <div className="stat-cell rounded-lg px-3 py-3">
          <p className="rock-label">THIS WEEK</p>
          <p className="mt-1">
            <span className="stat-number">{weekMinutes}</span>
            <span className="stat-unit">分钟</span>
          </p>
          {weekMostActive && weekMostActive.checkInDays > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              最勤 {weekMostActive.displayName} · {weekMostActive.checkInDays} 天
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">本周还没有打卡记录</p>
          )}
        </div>
      </div>
    </div>
  );
}
