import { ArrowRight, CalendarDays, Clock, MapPin, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

const formatDate = value =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Flexible';

const categoryColors = {
  Community: 'from-emerald-500 to-teal-400',
  Education: 'from-blue-500 to-indigo-400',
  Health: 'from-rose-500 to-pink-400',
  Environment: 'from-green-500 to-emerald-400',
  Technology: 'from-violet-500 to-purple-400',
  Arts: 'from-amber-500 to-orange-400',
  Sports: 'from-cyan-500 to-blue-400',
  default: 'from-primary-500 to-violet-500',
};

const urgencyConfig = {
  critical: {
    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    label: '🔴 Critical',
  },
  high: {
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    label: '🟠 High',
  },
  normal: {
    cls: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    label: '🔵 Normal',
  },
  low: {
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    label: '⚪ Low',
  },
};

export default function OpportunityCard({ opportunity, action, index = 0 }) {
  const gradientClass = categoryColors[opportunity.category] || categoryColors.default;
  const urgency = urgencyConfig[opportunity.urgency_level];

  return (
    <motion.article
      className="flex h-full flex-col overflow-hidden rounded-[32px] border border-line/20 bg-white-card shadow-sm hover:shadow-md transition-all duration-300"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
    >
      {/* Gradient header strip */}
      <div className={`h-1.5 bg-gradient-to-r ${gradientClass}`} />

      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${gradientClass} text-white`}
              >
                {opportunity.category || 'General'}
              </span>
              {urgency && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${urgency.cls}`}
                >
                  {urgency.label}
                </span>
              )}
            </div>
            <Link
              to={`/opportunities/${opportunity.id}`}
              className="line-clamp-2 block text-base font-bold leading-snug text-text transition-colors hover:text-black"
            >
              {opportunity.title}
            </Link>
            <p className="mt-1 truncate text-xs text-muted">{opportunity.organization_name}</p>
          </div>
          <StatusBadge status={opportunity.status} />
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
          {opportunity.description}
        </p>

        {/* Meta */}
        <div className="mt-4 grid gap-1.5 text-xs text-muted">
          <span className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
            {opportunity.is_remote ? (
              <span className="font-semibold text-emerald-600">🌐 Remote</span>
            ) : (
              opportunity.location || 'Location TBD'
            )}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted" />
            {formatDate(opportunity.start_date)}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted" />
            {opportunity.approved_count || 0} / {opportunity.capacity || '∞'} enrolled
          </span>
          {opportunity.hours_estimate ? (
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted" />
              {opportunity.hours_estimate} hours
            </span>
          ) : null}
          {opportunity.distance_km !== undefined && (
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 shrink-0 text-text" />
              <span className="font-semibold text-text">{opportunity.distance_km} km away</span>
            </span>
          )}
        </div>

        {/* Skills */}
        {opportunity.required_skills?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opportunity.required_skills.slice(0, 3).map(skill => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full bg-soft-card-2 border border-line/20 px-2.5 py-0.5 text-[10px] font-bold text-text"
              >
                {skill}
              </span>
            ))}
            {opportunity.required_skills.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-soft-card-2 border border-line/20 px-2.5 py-0.5 text-[10px] font-bold text-text">
                +{opportunity.required_skills.length - 3}
              </span>
            )}
          </div>
        ) : null}

        {/* Action */}
        <div className="mt-auto pt-5">
          {action ? (
            action
          ) : (
            <Link
              to={`/opportunities/${opportunity.id}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-white-card px-4 py-2.5 text-xs font-bold text-text hover:bg-soft-card-2 transition-all w-full group/btn"
            >
              View Details
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
