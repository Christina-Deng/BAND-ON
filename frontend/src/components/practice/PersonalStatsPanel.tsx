import type { PersonalPracticeStats } from '../../types/practice';

export function PersonalStatsPanel({ stats }: { stats: PersonalPracticeStats }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold text-emphasis">我的练习</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatBlock
          label="连续打卡"
          value={stats.streakDays > 0 ? `${stats.streakDays} 天` : '尚未开始'}
          highlight={stats.streakDays >= 3}
          emoji={stats.streakDays > 0 ? '🔥' : '✨'}
        />
        <StatBlock
          label="本周"
          value={`${stats.weekMinutes} 分钟`}
          sub={`打卡 ${stats.weekCheckInDays} 天`}
        />
        <StatBlock
          label="本月"
          value={`${stats.monthMinutes} 分钟`}
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
  value,
  sub,
  highlight,
  emoji,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  emoji?: string;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight ? 'border-accent-500/50 bg-accent-500/10' : 'border-slate-800 bg-slate-950/50'
      }`}
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-display-heavy text-lg text-emphasis">
        {emoji && <span className="mr-1">{emoji}</span>}
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
