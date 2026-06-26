import { prisma } from '../lib/prisma.js';

export interface PersonalPracticeStats {
  streakDays: number;
  weekMinutes: number;
  weekCheckInDays: number;
  monthMinutes: number;
  monthCheckInDays: number;
}

export interface BandPracticeStats {
  teamToday: {
    checkedIn: number;
    total: number;
    totalMinutes: number;
    allCheckedIn: boolean;
  };
  weekMinutes: number;
  weekCheckInCount: number;
  weekMostActive: { displayName: string; checkInDays: number } | null;
}

export interface PracticeStats {
  personal: PersonalPracticeStats;
  band: BandPracticeStats;
}

function localDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d);
  next.setDate(next.getDate() + delta);
  return localDateString(next);
}

function logDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfLocalWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  return localDateString(date);
}

function startOfLocalMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

/** Consecutive practice days ending today, or yesterday if not yet checked in today. */
export function computeStreak(uniqueDatesDesc: string[], todayStr: string): number {
  if (uniqueDatesDesc.length === 0) return 0;

  const dateSet = new Set(uniqueDatesDesc);
  let anchor = todayStr;
  if (!dateSet.has(anchor)) {
    anchor = addDays(todayStr, -1);
    if (!dateSet.has(anchor)) return 0;
  }

  let streak = 0;
  let cursor = anchor;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function getPracticeStats(input: {
  userId: string;
  bandId: string;
}): Promise<PracticeStats> {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  const todayStr = localDateString();
  const weekStart = startOfLocalWeek(todayStr);
  const monthStart = startOfLocalMonth(todayStr);

  const [personalLogs, bandLogs, members] = await Promise.all([
    prisma.practiceLog.findMany({
      where: { userId: input.userId },
      select: { date: true, durationMinutes: true },
    }),
    prisma.practiceLog.findMany({
      where: {
        bandId: input.bandId,
        date: { gte: new Date(`${weekStart}T00:00:00.000Z`) },
      },
      select: { userId: true, date: true, durationMinutes: true, user: { select: { displayName: true } } },
    }),
    prisma.bandMember.findMany({
      where: { bandId: input.bandId },
      select: { userId: true },
    }),
  ]);

  const personalDaily = new Map<string, number>();
  for (const log of personalLogs) {
    const key = logDateString(log.date);
    personalDaily.set(key, (personalDaily.get(key) ?? 0) + log.durationMinutes);
  }

  const uniquePersonalDates = [...personalDaily.keys()].sort((a, b) => b.localeCompare(a));
  const streakDays = computeStreak(uniquePersonalDates, todayStr);

  let weekMinutes = 0;
  let weekCheckInDays = 0;
  let monthMinutes = 0;
  let monthCheckInDays = 0;

  for (const [date, minutes] of personalDaily) {
    if (date >= weekStart && date <= todayStr) {
      weekMinutes += minutes;
      weekCheckInDays += 1;
    }
    if (date >= monthStart && date <= todayStr) {
      monthMinutes += minutes;
      monthCheckInDays += 1;
    }
  }

  const personal: PersonalPracticeStats = {
    streakDays,
    weekMinutes,
    weekCheckInDays,
    monthMinutes,
    monthCheckInDays,
  };

  const todayLogs = bandLogs.filter((log) => logDateString(log.date) === todayStr);
  const checkedInUserIds = new Set(todayLogs.map((log) => log.userId));
  const totalMembers = members.length;
  const teamTodayMinutes = todayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

  let weekBandMinutes = 0;
  const weekMemberDays = new Map<string, { displayName: string; days: Set<string> }>();

  for (const log of bandLogs) {
    const date = logDateString(log.date);
    if (date > todayStr) continue;
    weekBandMinutes += log.durationMinutes;

    const entry = weekMemberDays.get(log.userId) ?? {
      displayName: log.user.displayName,
      days: new Set<string>(),
    };
    entry.days.add(date);
    weekMemberDays.set(log.userId, entry);
  }

  let weekMostActive: BandPracticeStats['weekMostActive'] = null;
  for (const entry of weekMemberDays.values()) {
    const checkInDays = entry.days.size;
    if (!weekMostActive || checkInDays > weekMostActive.checkInDays) {
      weekMostActive = { displayName: entry.displayName, checkInDays };
    }
  }

  const weekCheckInCount = [...weekMemberDays.values()].reduce((sum, entry) => sum + entry.days.size, 0);

  const band: BandPracticeStats = {
    teamToday: {
      checkedIn: checkedInUserIds.size,
      total: totalMembers,
      totalMinutes: teamTodayMinutes,
      allCheckedIn: totalMembers > 0 && checkedInUserIds.size === totalMembers,
    },
    weekMinutes: weekBandMinutes,
    weekCheckInCount,
    weekMostActive,
  };

  return { personal, band };
}
