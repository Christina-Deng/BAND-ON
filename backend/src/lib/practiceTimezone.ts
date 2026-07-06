const DEFAULT_PRACTICE_TIMEZONE = 'Asia/Shanghai';

export function resolvePracticeTimezone(value?: string): string {
  const timezone = value?.trim();
  if (!timezone) return DEFAULT_PRACTICE_TIMEZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return DEFAULT_PRACTICE_TIMEZONE;
  }
}

export function readPracticeTimezoneHeader(
  header: string | string[] | undefined,
): string {
  if (Array.isArray(header)) return resolvePracticeTimezone(header[0]);
  return resolvePracticeTimezone(header);
}
