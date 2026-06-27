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

function buildGrid(daily = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayMap = {};
  for (const day of daily) {
    dayMap[day.day_date] = day;
  }

  // Go back ~52 weeks (364 days)
  const start = new Date(today);
  start.setDate(today.getDate() - 364);
  start.setHours(0, 0, 0, 0);

  // Back up to the nearest Sunday
  const startDayOfWeek = start.getDay();
  start.setDate(start.getDate() - startDayOfWeek);

  const grid = [];
  let currentWeek = [];

  const current = new Date(start);
  while (current <= today) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${d}`;

    currentWeek.push(
      dayMap[dateStr] || {
        day_date: dateStr,
        events_count: 0,
        hours_total: 0,
        _date: new Date(current),
      }
    );

    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    // Pad the remaining days of the current week with nulls
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    grid.push(currentWeek);
  }

  return grid;
}

function getMonthLabels(grid) {
  const labels = [];
  let prevMonth = null;
  grid.forEach((week, index) => {
    // Find the first valid day in the week to check its month
    const validDay = week.find(d => d !== null);
    if (!validDay) return;

    const date = validDay._date;
    const month = date.getMonth();
    if (month !== prevMonth) {
      labels.push({ index, label: MONTHS[month] });
      prevMonth = month;
    }
  });
  return labels;
}

export default function HeatmapChart({
  daily = [],
  monthly = [],
  churnRisk = 'low',
  daysSinceLast = null,
}) {
  const grid = useMemo(() => buildGrid(daily), [daily]);
  const monthLabels = useMemo(() => getMonthLabels(grid), [grid]);

  const insights = useMemo(() => {
    let activeDays = 0;
    let totalDays = 0;
    let totalHours = 0;
    let longestGap = 0;
    let currentGap = 0;

    // Flatten grid to process days sequentially
    const days = grid.flat().filter(d => d !== null);

    days.forEach(day => {
      totalDays++;
      if (Number(day.events_count || 0) === 0) {
        currentGap += 1;
        longestGap = Math.max(longestGap, currentGap);
      } else {
        activeDays++;
        currentGap = 0;
        totalHours += Number(day.hours_total || 0);
      }
    });

    const quietDays = totalDays - activeDays;

    const peakMonth = [...monthly].sort(
      (a, b) => Number(b.hours_total || 0) - Number(a.hours_total || 0)
    )[0];

    return {
      activeDays,
      quietDays,
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
          { label: 'Active Days', value: insights.activeDays },
          { label: 'Longest Gap', value: `${insights.longestGap} days` },
          {
            label: 'Peak Season',
            value: insights.peakMonth,
            sub: insights.peakHours
              ? `${insights.peakHours.toFixed(1)} hrs`
              : 'Waiting for activity',
          },
          { label: 'Total Hours', value: insights.totalHours.toFixed(1) },
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

            {grid.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-0.5">
                {week.map((day, dIndex) => {
                  if (!day) return <div key={dIndex} className="h-3 w-3 bg-transparent" />;

                  const isFuture = day._date > new Date();
                  const isToday = day._date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dIndex}
                      title={
                        isFuture
                          ? ''
                          : `${day._date.toLocaleDateString()} - ${day.events_count} event(s), ${Number(day.hours_total).toFixed(1)} hrs`
                      }
                      className={`h-3 w-3 cursor-default rounded-sm transition-transform hover:scale-125
                        ${isFuture ? 'bg-transparent' : getColor(Number(day.events_count || 0))}
                        ${isToday ? 'ring-1 ring-primary-500' : ''}
                      `}
                    />
                  );
                })}
              </div>
            ))}
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
