import { describe, expect, it } from 'vitest';
import {
  addPracticeDays,
  computeStreak,
  endOfPracticeWeek,
  parsePracticeDate,
  practiceDateString,
  startOfPracticeWeek,
} from './practiceDates.js';

const SHANGHAI = 'Asia/Shanghai';

describe('practiceDates', () => {
  it('uses timezone calendar date for practiceDateString', () => {
    const date = new Date('2026-07-05T18:30:00.000Z');
    expect(practiceDateString(date, 'UTC')).toBe('2026-07-05');
    expect(practiceDateString(date, SHANGHAI)).toBe('2026-07-06');
  });

  it('round-trips parsePracticeDate and practiceDateString in UTC', () => {
    const dateStr = '2026-06-25';
    expect(practiceDateString(parsePracticeDate(dateStr), 'UTC')).toBe(dateStr);
  });

  it('addPracticeDays moves across month boundaries in UTC', () => {
    expect(addPracticeDays('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('startOfPracticeWeek returns Monday in Asia/Shanghai', () => {
    expect(startOfPracticeWeek('2026-06-25', SHANGHAI)).toBe('2026-06-22');
    expect(startOfPracticeWeek('2026-07-06', SHANGHAI)).toBe('2026-07-06');
  });

  it('endOfPracticeWeek returns Sunday of the same week', () => {
    expect(endOfPracticeWeek('2026-07-06', SHANGHAI)).toBe('2026-07-12');
  });

  it('excludes prior-week days from the week containing Monday July 6', () => {
    const weekStart = startOfPracticeWeek('2026-07-06', SHANGHAI);
    const priorDays = ['2026-07-02', '2026-07-03', '2026-07-05'];
    for (const day of priorDays) {
      expect(day >= weekStart).toBe(false);
    }
  });
});

describe('computeStreak', () => {
  const today = '2026-06-25';

  it('returns 0 when no practice days', () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it('counts consecutive days including today', () => {
    expect(computeStreak(['2026-06-25', '2026-06-24', '2026-06-23'], today)).toBe(3);
  });

  it('uses yesterday as anchor when today is missing', () => {
    expect(computeStreak(['2026-06-24', '2026-06-23'], today)).toBe(2);
  });

  it('returns 0 when gap before today/yesterday', () => {
    expect(computeStreak(['2026-06-22'], today)).toBe(0);
  });
});
