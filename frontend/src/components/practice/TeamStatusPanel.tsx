import { useLocale } from '../../hooks/useLocale';
import type { TodayMemberStatus } from '../../types/practice';

export function TeamStatusPanel({
  members,
  currentUserId,
}: {
  members: TodayMemberStatus[];
  currentUserId?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="poster-card rounded-xl p-4">
      <p className="rock-kicker">LINEUP</p>
      <h3 className="section-title mt-1">{t('practice.team.todayTeam')}</h3>
      <ul className="mt-3 space-y-2">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          return (
            <li
              key={member.userId}
              className={`flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-2 ${
                isSelf ? 'self-member-highlight' : ''
              }`}
            >
              <span className="font-medium text-emphasis">{member.displayName}</span>
              {member.checkedIn ? (
                <span className="text-sm font-medium text-accent-600">
                  {t('practice.team.memberPracticed', { minutes: member.durationMinutes ?? 0 })}
                </span>
              ) : (
                <span className="rock-tag">WAIT</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
