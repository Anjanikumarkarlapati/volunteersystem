import { useMemo } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const getColor = count => {
  if (!count) return 'bg-slate-100 dark:bg-slate-800/80';
  if (count === 1) return 'bg-primary-200 dark:bg-primary-900';
  if (count === 2) return 'bg-primary-400 dark:bg-primary-700';
  if (count === 3) return 'bg-primary-500 dark:bg-primary-600';
  return 'bg-primary-600 dark:bg-primary-500';
};

function buildGrid(weekly = []) {
  const today = new Date();
  const grid = [];
  const weekMap = {};

  for (const week of weekly) {
    weekMap[week.week_start] = week;
  }

  const start = new Date(today);
  start.setDate(start.getDate() - 52 * 7);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay() || 7;
  start.setDate(start.getDate() - dayOfWeek + 1);

  const current = new Date(start);
  while (current <= today) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const weekStart = `${year}-${month}-${day}`;
    grid.push(weekMap[weekStart] || { week_start: weekStart, events_count: 0, hours_total: 0 });
    current.setDate(current.getDate() + 7);
  }

  return grid;
}

function getMonthLabels(grid) {
  const labels = [];
  let prevMonth = null;
  grid.forEach((week, index) => {
    const date = new Date(week.week_start);
    const month = date.getMonth();
    if (month !== prevMonth) {
      labels.push({ index, label: MONTHS[month] });
      prevMonth = month;
    }
  });
  return labels;
}

export default function HeatmapChart({
  weekly = [],
  monthly = [],
  churnRisk = 'low',
  daysSinceLast = null,
}) {
  const grid = useMemo(() => buildGrid(weekly), [weekly]);
  const monthLabels = useMemo(() => getMonthLabels(grid), [grid]);
  const insights = useMemo(() => {
    const activeWeeks = grid.filter(week => Number(week.events_count || 0) > 0).length;
    const quietWeeks = grid.length - activeWeeks;
    const totalHours = grid.reduce((sum, week) => sum + Number(week.hours_total || 0), 0);
    let longestGap = 0;
    let currentGap = 0;

    grid.forEach(week => {
      if (Number(week.events_count || 0) === 0) {
        currentGap += 1;
        longestGap = Math.max(longestGap, currentGap);
      } else {
        currentGap = 0;
      }
    });

    const peakMonth = [...monthly].sort(
      (a, b) => Number(b.hours_total || 0) - Number(a.hours_total || 0)
    )[0];

    return {
      activeWeeks,
      quietWeeks,
      longestGap,
      totalHours,
      peakMonth: peakMonth?.month || 'No peak yet',
      peakHours: Number(peakMonth?.hours_total || 0),
    };
  }, [grid, monthly]);

  const churnColors = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };

  const churnLabels = {
    low: 'Active - steady participation',
    medium: 'Moderate - re-engage soon',
    high: 'At risk - coordinator follow-up suggested',
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active weeks', value: insights.activeWeeks },
          { label: 'Longest gap', value: `${insights.longestGap} wk` },
          {
            label: 'Peak season',
            value: insights.peakMonth,
            sub: insights.peakHours
              ? `${insights.peakHours.toFixed(1)} hrs`
              : 'Waiting for activity',
          },
          { label: 'Hours shown', value: insights.totalHours.toFixed(1) },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 truncate text-lg font-black text-slate-900 dark:text-white">
              {item.value}
            </p>
            {item.sub && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/80">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${churnColors[churnRisk] || churnColors.low}`}
        >
          {churnLabels[churnRisk] || churnLabels.low}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {daysSinceLast === null
            ? 'No completed events yet'
            : `Last completed event: ${daysSinceLast === 0 ? 'today' : `${daysSinceLast} days ago`}`}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {insights.quietWeeks} quiet weeks in the last year
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: grid.length * 14 + 24 }}>
          <div className="relative mb-1 ml-6 flex">
            {monthLabels.map(({ index, label }) => (
              <span
                key={label + index}
                className="absolute text-[10px] font-semibold text-slate-400 dark:text-slate-500"
                style={{ left: index * 14 }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="mr-1 flex flex-col gap-0.5">
              {DAYS.map((day, index) => (
                <span
                  key={index}
                  className="h-3 text-[9px] leading-3 text-slate-400 dark:text-slate-600"
                >
                  {day}
                </span>
              ))}
            </div>

            {grid.map(week => {
              const date = new Date(week.week_start);
              return (
                <div key={week.week_start} className="flex flex-col gap-0.5">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                    const dayDate = new Date(date);
                    dayDate.setDate(date.getDate() + dayOffset);
                    const isToday = dayDate.toDateString() === new Date().toDateString();
                    const isFuture = dayDate > new Date();
                    return (
                      <div
                        key={dayOffset}
                        title={
                          isFuture
                            ? ''
                            : `${dayDate.toLocaleDateString()} - ${week.events_count} event(s), ${Number(week.hours_total).toFixed(1)} hrs`
                        }
                        className={`h-3 w-3 cursor-default rounded-sm transition-transform hover:scale-125
                          ${isFuture ? 'bg-transparent' : getColor(Number(week.events_count || 0))}
                          ${isToday ? 'ring-1 ring-primary-500' : ''}
                        `}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-2 ml-6 flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Less</span>
            {[0, 1, 2, 3, 4].map(count => (
              <div key={count} className={`h-3 w-3 rounded-sm ${getColor(count)}`} />
            ))}
            <span className="text-[10px] text-slate-400">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
