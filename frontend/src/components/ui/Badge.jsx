const variants = {
  active:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  approved:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  attended:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  completed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  scheduled:
    'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20',
  assigned:
    'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20',
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  waitlisted:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  draft:
    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  rejected:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  suspended:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  cancelled:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  no_show:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  admin:
    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
  organization:
    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
  volunteer:
    'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20',
};

const dotColors = {
  active: 'bg-emerald-500',
  open: 'bg-emerald-500',
  approved: 'bg-emerald-500',
  attended: 'bg-emerald-500',
  completed: 'bg-emerald-500',
  scheduled: 'bg-primary-500',
  assigned: 'bg-primary-500',
  pending: 'bg-amber-500',
  waitlisted: 'bg-amber-500',
  draft: 'bg-slate-400',
  rejected: 'bg-rose-500',
  suspended: 'bg-rose-500',
  cancelled: 'bg-rose-500',
  no_show: 'bg-rose-500',
  admin: 'bg-violet-500',
  organization: 'bg-cyan-500',
  volunteer: 'bg-primary-500',
};

const labelMap = {
  no_show: 'No Show',
  ngo_developer: 'NGO Dev',
  ngo_staff: 'NGO Staff',
};

export default function Badge({ status, dot = true, className = '' }) {
  const key = (status || 'unknown').toLowerCase();
  const variant =
    variants[key] ||
    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  const dotColor = dotColors[key] || 'bg-slate-400';
  const label = labelMap[key] || key.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${variant} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />}
      {label}
    </span>
  );
}
