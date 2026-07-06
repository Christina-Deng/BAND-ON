/** Practice logs use calendar dates (YYYY-MM-DD at 00:00:00.000Z) in the user's timezone. */

import { resolvePracticeTimezone } from './practiceTimezone.js';

export function formatPracticeDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function practiceDateString(
  date: Date = new Date(),
  timeZone: string = resolvePracticeTimezone(),
): string {
  return formatPracticeDateInTimezone(date, timeZone);
}

export function parsePracticeDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function addPracticeDays(dateStr: string, delta: number): string {
  const date = parsePracticeDate(dateStr);
  date.setUTCDate(date.getUTCDate() + delta);
  return practiceDateString(date, 'UTC');
}

export function practiceWeekday(dateStr: string, timeZone: string): number {
  const date = parsePracticeDate(dateStr);
  date.setUTCHours(12, 0, 0, 0);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const value = map[weekday];
  if (value === undefined) {
    throw new Error(`Unknown weekday label: ${weekday}`);
  }
  return value;
}

/** Monday-start week in the given timezone. */
export function startOfPracticeWeek(
  dateStr: string,
  timeZone: string = resolvePracticeTimezone(),
): string {
  const weekday = practiceWeekday(dateStr, timeZone);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addPracticeDays(dateStr, diff);
}

export function endOfPracticeWeek(
  dateStr: string,
  timeZone: string = resolvePracticeTimezone(),
): string {
  return addPracticeDays(startOfPracticeWeek(dateStr, timeZone), 6);
}

export function startOfPracticeMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

/** Consecutive practice days ending today, or yesterday if not yet checked in today. */
export function computeStreak(uniqueDatesDesc: string[], todayStr: string): number {
  if (uniqueDatesDesc.length === 0) return 0;

  const dateSet = new Set(uniqueDatesDesc);
  let anchor = todayStr;
  if (!dateSet.has(anchor)) {
    anchor = addPracticeDays(todayStr, -1);
    if (!dateSet.has(anchor)) return 0;
  }

  let streak = 0;
  let cursor = anchor;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addPracticeDays(cursor, -1);
  }
  return streak;
}
