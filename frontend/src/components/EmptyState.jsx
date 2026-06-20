import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import Button from './ui/Button.jsx';

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Records will appear here once activity begins.',
  action,
  actionLabel,
  onAction,
  icon: CustomIcon,
  compact = false,
}) {
  const Icon = CustomIcon || Inbox;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-4' : 'py-16 px-6'} rounded-2xl border border-slate-200/60 bg-white/50 shadow-sm dark:border-white/5 dark:bg-slate-900/40`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20">
          <Icon className="h-6 w-6 text-primary-400 dark:text-primary-500" />
        </div>
        <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-gradient-to-br from-primary-400 to-violet-400 opacity-60 blur-[2px]" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {(action || onAction) && (
        <Button variant="primary" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel || 'Get started'}
        </Button>
      )}
    </motion.div>
  );
}
