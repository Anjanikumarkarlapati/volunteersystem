import { TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Icon background tones — using neutral warm palette from Lumio VMS
const toneConfig = {
  blue: { iconBg: 'bg-secondary-container', trendUp: 'text-green-600 bg-green-50' },
  emerald: { iconBg: 'bg-secondary-container', trendUp: 'text-green-600 bg-green-50' },
  amber: { iconBg: 'bg-surface-container-high', trendUp: 'text-amber-600 bg-amber-50' },
  rose: { iconBg: 'bg-surface-container-high', trendUp: 'text-rose-600 bg-rose-50' },
  violet: { iconBg: 'bg-secondary-container', trendUp: 'text-green-600 bg-green-50' },
  cyan: { iconBg: 'bg-surface-container-high', trendUp: 'text-cyan-600 bg-cyan-50' },
};

function AnimatedCounter({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const startTime = useRef(null);
  const frameRef = useRef(null);
  const numericTarget = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;
  const suffix = String(target).replace(/[0-9.]/g, '');

  useEffect(() => {
    if (numericTarget === 0) {
      setCount(0);
      return;
    }
    startTime.current = null;
    const animate = timestamp => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(eased * numericTarget);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [numericTarget, duration]);

  const display = numericTarget % 1 !== 0 ? count.toFixed(1) : Math.round(count).toLocaleString();
  return (
    <>
      {display}
      {suffix}
    </>
  );
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
  helper,
  trend,
  trendDir = 'up',
  index = 0,
  onClick,
  className = '',
}) {
  const cfg = toneConfig[tone] || toneConfig.blue;

  return (
    <motion.div
      className={`white-card p-6 flex flex-col justify-between group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      onClick={onClick}
    >
      {/* Top row: icon + trend */}
      <div className="flex justify-between items-start mb-4">
        {Icon && (
          <div className={`p-3 ${cfg.iconBg} rounded-2xl`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${trendDir === 'down' ? 'text-rose-600 bg-rose-50' : cfg.trendUp}`}
          >
            {trendDir === 'down' ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {trend}
          </span>
        )}
        {!trend && helper && (
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
            {helper}
          </span>
        )}
      </div>

      {/* Bottom: label + value + progress */}
      <div>
        <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mb-1">
          {label}
        </p>
        <h3 className="text-4xl font-bold text-on-surface tracking-tight font-display">
          <AnimatedCounter target={value ?? 0} />
        </h3>
        {/* Progress bar decoration */}
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-4">
          <motion.div
            className="bg-primary h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '70%' }}
            transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
          />
        </div>
        {helper && trend && <p className="text-xs text-on-surface-variant mt-2">{helper}</p>}
      </div>
    </motion.div>
  );
}
