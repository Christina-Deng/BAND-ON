import type { BandPracticeStats } from '../../types/practice';

export function TeamStatsPanel({ stats, bandName }: { stats: BandPracticeStats; bandName: string }) {
  const { teamToday, weekMinutes, weekMostActive } = stats;
  const progress =
    teamToday.total > 0 ? Math.round((teamToday.checkedIn / teamToday.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-emphasis">{bandName} · 团队练习</h3>

      <div className="mt-3 space-y-3">
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-slate-300">
              今日 {teamToday.checkedIn}/{teamToday.total} 人已练
            </span>
            <span className="text-slate-400">合计 {teamToday.totalMinutes} 分钟</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                teamToday.allCheckedIn ? 'bg-accent-500' : 'bg-accent-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {teamToday.allCheckedIn && teamToday.total > 0 && (
            <p className="mt-2 text-xs text-accent-400">🎉 今日全员到齐！</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm">
          <p className="text-slate-300">本周乐队共练习 {weekMinutes} 分钟</p>
          {weekMostActive && weekMostActive.checkInDays > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              本周最勤：{weekMostActive.displayName}（打卡 {weekMostActive.checkInDays} 天）
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">本周还没有打卡记录</p>
          )}
        </div>
      </div>
    </div>
  );
}
