import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from './EmptyState.jsx';
import { Skeleton } from './ui/Skeleton.jsx';

function SkeletonRow({ cols }) {
  return (
    <tr className="border-b border-line/20">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className="h-4" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

function TableSkeleton({ columns }) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-line/20 bg-white-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-line/20 bg-panel-bg">
              {columns.map(col => (
                <th key={col.key} className="px-5 py-3.5 text-left">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(row => (
              <SkeletonRow key={row} cols={Math.min(columns.length, 6)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DataTable({ columns, rows = [], loading, emptyTitle, emptyDescription }) {
  if (loading) return <TableSkeleton columns={columns} />;

  if (!rows.length) {
    return <EmptyState title={emptyTitle || 'No records found'} description={emptyDescription} />;
  }

  return (
    <motion.div
      className="overflow-hidden rounded-[32px] border border-line/20 bg-white-card shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-line/20 bg-panel-bg">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-5 py-3.5 text-left font-label text-[10px] uppercase tracking-widest text-muted"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/20">
            <AnimatePresence initial={false}>
              {rows.map((row, index) => (
                <motion.tr
                  key={row.id || `row-${index}`}
                  className="group transition-colors hover:bg-soft-card-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.025, 0.15) }}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-5 py-4 text-xs text-text align-middle">
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="border-t border-line/20 px-5 py-3">
          <p className="text-xs text-muted">
            Showing {rows.length} {rows.length === 1 ? 'record' : 'records'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
