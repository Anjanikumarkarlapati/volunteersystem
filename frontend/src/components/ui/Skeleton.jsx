export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-white/5 dark:bg-slate-900/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-5 py-3.5">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-slate-100 dark:border-white/5">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-5 py-4">
                    <Skeleton className="h-4" style={{ width: `${60 + (c % 3) * 15}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
