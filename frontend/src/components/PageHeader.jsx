import { motion } from 'framer-motion';

export default function PageHeader({ eyebrow, title, description, actions, badge }) {
  return (
    <motion.div
      className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2.5">
            <div className="h-0.5 w-6 bg-black" />
            <p className="font-label text-[10px] uppercase tracking-widest text-muted">{eyebrow}</p>
            {badge && <div className="ml-1">{badge}</div>}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-text md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
