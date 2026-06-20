import { CheckCircle2, ClipboardList, MessageSquareDiff, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackModal from '../components/FeedbackModal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { feedbackService } from '../services/resources.js';
import { SkeletonLine } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';

const STAR_COLORS = {
  1: 'text-rose-400',
  2: 'text-orange-400',
  3: 'text-amber-400',
  4: 'text-lime-500',
  5: 'text-emerald-500',
};

const StarDisplay = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        className={`h-4 w-4 ${n <= rating ? STAR_COLORS[Math.round(rating)] : 'text-slate-200 dark:text-slate-700'}`}
        fill={n <= rating ? 'currentColor' : 'none'}
      />
    ))}
    <span className="ml-1 text-sm font-bold text-slate-900 dark:text-white">{rating}</span>
  </div>
);

export default function FeedbackPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [done, setDone] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackService.pending();
      setPending(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load pending feedback'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitted = attendanceId => {
    setDone(prev => [...prev, attendanceId]);
    setPending(prev => prev.filter(p => p.attendance_id !== attendanceId));
    toast.success('🌟 Feedback submitted!');
  };

  const isVol = user.role === 'volunteer';

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Two-way feedback" title="My Feedback Queue" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card dark:border-white/5 dark:bg-slate-900/80"
            >
              <SkeletonLine />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Two-way Feedback"
        title="My Feedback Queue"
        description={
          isVol
            ? 'Rate the events you attended. Your feedback helps organizers improve the experience.'
            : 'Rate the volunteers who showed up. Scores are private — only aggregates are shown.'
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 mx-auto mb-2">
            <ClipboardList className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{pending.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pending Reviews</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 mx-auto mb-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{done.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Done This Session</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 mx-auto mb-2">
            <Star className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {isVol ? 'Event' : 'Volunteer'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Feedback Type</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={MessageSquareDiff}
          title={done.length > 0 ? '🎉 All caught up!' : 'No pending feedback'}
          description={
            done.length > 0
              ? `You submitted ${done.length} ${done.length === 1 ? 'review' : 'reviews'} this session. Thank you!`
              : isVol
                ? 'Attend events to unlock feedback forms. Your reviews help build community trust.'
                : 'All attended volunteers have been reviewed. New forms appear after each event.'
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {pending.length} {pending.length === 1 ? 'item' : 'items'} awaiting your review
          </p>
          <AnimatePresence>
            {pending.map((item, i) => (
              <motion.div
                key={item.attendance_id}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-white/5 dark:bg-slate-900/80"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="h-[3px] bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white font-black text-lg">
                    ⭐
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {isVol ? item.event_title : item.volunteer_name || 'Volunteer'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isVol ? item.organization_name : item.event_title}
                      {item.end_at &&
                        ` · ${new Date(item.end_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setActiveItem(item)}>
                    Rate
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {activeItem && (
          <FeedbackModal
            item={activeItem}
            feedbackType={activeItem.feedback_type}
            onClose={() => setActiveItem(null)}
            onSubmitted={handleSubmitted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
