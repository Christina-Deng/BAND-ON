import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveMediaUrl } from '../api/client';
import {
  getMonthPractices,
  getPracticeStats,
  getTodayStatus,
  submitPractice,
} from '../api/practices';
import { BandPicker } from '../components/band/BandPicker';
import { PageHeader } from '../components/layout/PageHeader';
import { CheckInForm, type CheckInResult } from '../components/practice/CheckInForm';
import { PersonalStatsPanel } from '../components/practice/PersonalStatsPanel';
import { PracticeCalendar } from '../components/practice/PracticeCalendar';
import { TeamStatsPanel } from '../components/practice/TeamStatsPanel';
import { TeamStatusPanel } from '../components/practice/TeamStatusPanel';
import { PracticeToolsLayout } from '../components/practice/tools/PracticeToolsLayout';
import { NoBandsEmptyState } from '../components/shared/NoBandsEmptyState';
import { createToast, ToastStack, type ToastMessage } from '../components/shared/ToastStack';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';
import { useLocale } from '../hooks/useLocale';
import { celebrateCheckIn, celebrateTeamComplete } from '../lib/celebration';
import type { PracticeLog, PracticeStats, TodayMemberStatus } from '../types/practice';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function PracticePage() {
  const { user } = useAuth();
  const { bands, loading } = useBand();
  const { t } = useLocale();
  const [viewBandId, setViewBandId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [todayMembers, setTodayMembers] = useState<TodayMemberStatus[]>([]);
  const [checkedInBandIds, setCheckedInBandIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stats, setStats] = useState<PracticeStats | null>(null);

  useEffect(() => {
    if (bands.length === 0) {
      setViewBandId('');
      return;
    }
    if (!bands.some((b) => b.id === viewBandId)) {
      setViewBandId(bands[0].id);
    }
  }, [bands, viewBandId]);

  const viewBand = bands.find((b) => b.id === viewBandId);

  const refreshCheckInStatus = useCallback(async () => {
    if (!user || bands.length === 0) {
      setCheckedInBandIds([]);
      return;
    }

    const results = await Promise.all(
      bands.map(async (band) => {
        const members = await getTodayStatus(band.id);
        const me = members.find((member) => member.userId === user.id);
        return me?.checkedIn ? band.id : null;
      }),
    );
    setCheckedInBandIds(results.filter((id): id is string => id !== null));
  }, [bands, user]);

  const refresh = useCallback(async () => {
    if (!viewBandId) return;
    const [monthData, todayData] = await Promise.all([
      getMonthPractices(viewBandId, month),
      getTodayStatus(viewBandId),
      getPracticeStats(viewBandId).then(setStats),
    ]);
    setPractices(monthData);
    setTodayMembers(todayData);
  }, [viewBandId, month]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), refreshCheckInStatus()]);
  }, [refresh, refreshCheckInStatus]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const selectedDayLogs = useMemo(() => {
    if (!selectedDate) return [];
    return practices.filter((p) => p.date.slice(0, 10) === selectedDate);
  }, [practices, selectedDate]);

  if (loading) return <p className="text-slate-400">{t('common.loading')}</p>;

  if (bands.length === 0) {
    return <NoBandsEmptyState description={t('practice.emptyDescription')} />;
  }

  async function handleCheckIn(input: {
    bandIds: string[];
    durationMinutes: number;
    note?: string;
    audio?: File;
  }): Promise<CheckInResult> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const succeededBandIds: string[] = [];
    const failedBandIds: string[] = [];
    for (const bandId of input.bandIds) {
      const formData = new FormData();
      formData.append('bandId', bandId);
      formData.append('durationMinutes', String(input.durationMinutes));
      if (input.note) formData.append('note', input.note);
      if (input.audio) formData.append('audio', input.audio);
      try {
        await submitPractice(formData);
        const bandName = bands.find((b) => b.id === bandId)?.name ?? t('common.unknownBand');
        succeeded.push(bandName);
        succeededBandIds.push(bandId);
      } catch {
        const bandName = bands.find((b) => b.id === bandId)?.name ?? t('common.unknownBand');
        failed.push(bandName);
        failedBandIds.push(bandId);
      }
    }
    if (succeeded.length > 0) {
      await refreshAll();
    }
    return { succeeded, failed, succeededBandIds, failedBandIds };
  }

  async function handleCheckInSuccess(result: CheckInResult, durationMinutes: number) {
    celebrateCheckIn();

    const listSep = t('common.listSep');
    const bandText =
      result.succeeded.length === 1 ? result.succeeded[0] : result.succeeded.join(listSep);

    let personalStats = stats?.personal;
    if (viewBandId) {
      try {
        const latest = await getPracticeStats(viewBandId);
        setStats(latest);
        personalStats = latest.personal;
      } catch {
        /* keep existing stats */
      }
    }

    let toastText = t('practice.toast.success', { bands: bandText, minutes: durationMinutes });
    const newToasts: ToastMessage[] = [createToast(toastText)];

    if (personalStats) {
      if (personalStats.streakDays > 0) {
        newToasts.push(createToast(t('practice.toast.streak', { days: personalStats.streakDays })));
      }
      newToasts.push(createToast(t('practice.toast.weekMinutes', { minutes: personalStats.weekMinutes })));
    }

    setToasts((prev) => [...prev, ...newToasts]);

    for (const bandId of result.succeededBandIds) {
      try {
        const bandStats = await getPracticeStats(bandId);
        if (bandStats.band.teamToday.allCheckedIn) {
          const bandName = bands.find((b) => b.id === bandId)?.name ?? t('common.bandFallback');
          celebrateTeamComplete();
          setToasts((prev) => [
            ...prev,
            createToast(t('practice.toast.allMembers', { band: bandName })),
          ]);
        }
      } catch {
        /* ignore stats errors */
      }
    }

    if (result.failed.length > 0) {
      setToasts((prev) => [
        ...prev,
        createToast(t('practice.toast.partialFail', { names: result.failed.join(listSep) }), 'warning'),
      ]);
    }
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  return (
    <PracticeToolsLayout>
      <div className="space-y-6">
        <ToastStack toasts={toasts} onDismiss={dismissToast} />

        <PageHeader
          title={t('practice.title')}
          lead={
            bands.length > 1 ? t('practice.leadMulti') : viewBand?.name
          }
        />

        {stats && <PersonalStatsPanel stats={stats.personal} />}

        <div className="grid gap-6 lg:grid-cols-2">
          <CheckInForm
            bands={bands}
            checkedInBandIds={checkedInBandIds}
            onSubmit={handleCheckIn}
            onSuccess={(result, minutes) => void handleCheckInSuccess(result, minutes)}
          />

          <div className="space-y-3">
            <BandPicker
              bands={bands}
              selectedIds={viewBandId ? [viewBandId] : []}
              onChange={(ids) => setViewBandId(ids[0] ?? '')}
              label={t('practice.viewTeam')}
              hint={t('practice.viewTeamHint')}
            />
            {stats && viewBand && <TeamStatsPanel stats={stats.band} bandName={viewBand.name} />}
            <TeamStatusPanel members={todayMembers} currentUserId={user?.id} />
          </div>
        </div>

        <div className="space-y-3">
          <BandPicker
            bands={bands}
            selectedIds={viewBandId ? [viewBandId] : []}
            onChange={(ids) => setViewBandId(ids[0] ?? '')}
            label={t('practice.calendar')}
            hint={t('practice.calendarHint')}
          />
          <PracticeCalendar
            month={month}
            practices={practices}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMonthChange={setMonth}
          />
        </div>

        {selectedDate && (
          <div className="poster-card rounded-xl p-4">
            <p className="rock-kicker">SESSION LOG</p>
            <h3 className="section-title mt-1">
              {viewBand?.name} · {selectedDate}
            </h3>
            {selectedDayLogs.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{t('practice.noLogsToday')}</p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {selectedDayLogs.map((log) => {
                  const audioSrc = resolveMediaUrl(log.audioUrl);
                  return (
                    <li
                      key={log.id}
                      className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-2"
                    >
                      <p>
                        {t('practice.logEntry', {
                          name: log.user.displayName,
                          minutes: log.durationMinutes,
                        })}
                        {log.note ? ` · ${log.note}` : ''}
                      </p>
                      {audioSrc && (
                        <audio controls preload="metadata" className="mt-2 w-full max-w-md" src={audioSrc}>
                          {t('practice.audioUnsupported')}
                        </audio>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="poster-card rounded-xl border-dashed p-4 text-sm text-slate-500 space-y-2">
          <p>
            <span className="text-slate-400">{t('practice.toolsLabel')}</span>
            {t('practice.toolsHint')}
          </p>
        </div>
      </div>
    </PracticeToolsLayout>
  );
}
