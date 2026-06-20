const dotStyles = {
  active: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  open: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  approved: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  attended: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  completed: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  scheduled: {
    dot: 'bg-primary-500',
    pill: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300',
  },
  assigned: {
    dot: 'bg-primary-500',
    pill: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300',
  },
  pending: {
    dot: 'bg-amber-500',
    pill: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  },
  waitlisted: {
    dot: 'bg-amber-500',
    pill: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  },
  draft: {
    dot: 'bg-slate-400',
    pill: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  rejected: {
    dot: 'bg-rose-500',
    pill: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  },
  suspended: {
    dot: 'bg-rose-500',
    pill: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  },
  cancelled: {
    dot: 'bg-rose-500',
    pill: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  },
  no_show: {
    dot: 'bg-rose-500',
    pill: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  },
  admin: {
    dot: 'bg-violet-500',
    pill: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  },
  organization: {
    dot: 'bg-cyan-500',
    pill: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300',
  },
  volunteer: {
    dot: 'bg-primary-500',
    pill: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300',
  },
};

const defaultStyle = {
  dot: 'bg-slate-400',
  pill: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const labelMap = {
  no_show: 'No Show',
  ngo_developer: 'NGO Dev',
  ngo_staff: 'NGO Staff',
};

export default function StatusBadge({ status, showDot = true }) {
  const key = (status || 'unknown').toLowerCase();
  const { dot, pill } = dotStyles[key] || defaultStyle;
  const label = labelMap[key] || key.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${pill}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dot} shrink-0`} />}
      {label}
    </span>
  );
}
