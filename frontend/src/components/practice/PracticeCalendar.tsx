import { useLocale } from '../../hooks/useLocale';
import type { PracticeLog } from '../../types/practice';

interface Props {
  month: string;
  practices: PracticeLog[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onMonthChange: (month: string) => void;
}

function daysInMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** Monday-first offset for the 1st of the month (0 = Monday). */
function mondayOffset(year: number, month: number) {
  const weekday = new Date(year, month - 1, 1).getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function PracticeCalendar({
  month,
  practices,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: Props) {
  const { t } = useLocale();
  const days = daysInMonth(month);
  const [year, mon] = month.split('-').map(Number);
  const leadingBlanks = mondayOffset(year, mon);
  const activeDates = new Set(practices.map((p) => p.date.slice(0, 10)));
  const weekdayLabels = t('practice.calendarWeekdays').split(',');

  function shiftMonth(delta: number) {
    const d = new Date(year, mon - 1 + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(next);
    onSelectDate(null);
  }

  return (
    <div className="poster-card rounded-xl p-4">
      <p className="rock-kicker">TOUR DATES</p>
      <div className="mb-3 mt-1 flex items-center justify-between">
        <button type="button" onClick={() => shiftMonth(-1)} className="px-2 text-slate-400 hover:text-emphasis">
          ←
        </button>
        <span className="font-display text-lg tracking-wide text-emphasis">{month}</span>
        <button type="button" onClick={() => shiftMonth(1)} className="px-2 text-slate-400 hover:text-emphasis">
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {label}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden className="py-2" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const dateStr = `${month}-${String(day).padStart(2, '0')}`;
          const hasLog = activeDates.has(dateStr);
          const selected = selectedDate === dateStr;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(selected ? null : dateStr)}
              className={`rounded-lg py-2 transition-colors ${
                selected
                  ? 'rock-cal-day-active text-white'
                  : hasLog
                    ? 'rock-cal-day-has-log'
                    : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
