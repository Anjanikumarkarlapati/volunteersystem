import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  gradient,
  ...props
}) {
  return (
    <motion.div
      className={`rounded-[32px] border border-line/20 bg-white-card shadow-sm ${padding ? 'p-6' : ''} ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-md' : ''} ${gradient ? `bg-gradient-to-br ${gradient}` : ''} ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-5 flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
