import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Info,
  AlertCircle,
  CalendarCheck,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { notificationService } from '../services/resources.js';
import { SkeletonLine } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';

function groupByDate(notifications) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  notifications.forEach(n => {
    const d = new Date(n.created_at).toDateString();
    if (d === today) groups.Today.push(n);
    else if (d === yesterday) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
}

function getNotifIcon(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('event') || m.includes('attend')) return CalendarCheck;
  if (m.includes('approv') || m.includes('verif') || m.includes('user')) return UserCheck;
  if (m.includes('warn') || m.includes('reject') || m.includes('error')) return AlertCircle;
  return Info;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationService.list();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load notifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async id => {
    try {
      await notificationService.read(id);
      setNotifications(prev => {
        const updated = prev.map(n => (n.id === id ? { ...n, is_read: true } : n));
        const newCount = updated.filter(n => !n.is_read).length;
        window.dispatchEvent(new CustomEvent('notif-read', { detail: { count: newCount } }));
        return updated;
      });
    } catch (error) {
      console.error('Could not mark notification as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new CustomEvent('notif-read', { detail: { count: 0 } }));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not mark all as read'));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const groups = groupByDate(notifications);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Stay up to date with your volunteer activity and platform updates."
        badge={
          unreadCount > 0 ? (
            <span className="inline-flex items-center justify-center h-6 min-w-6 rounded-full bg-primary text-on-primary text-[11px] font-bold px-2">
              {unreadCount}
            </span>
          ) : null
        }
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="white-card p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-2xl bg-surface-container animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded-full bg-surface-container animate-pulse" />
                <div className="h-3 w-1/3 rounded-full bg-surface-container animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="All caught up!"
          description="You have no notifications right now."
        />
      ) : (
        <div className="space-y-8">
          <AnimatePresence>
            {Object.entries(groups).map(([group, items]) => {
              if (!items.length) return null;
              return (
                <section key={group}>
                  {/* Group header */}
                  <div className="mb-3 flex items-center gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {group}
                    </p>
                    <div className="flex-1 h-px bg-outline-variant" />
                    <p className="text-[10px] font-semibold text-on-surface-variant">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  {/* Notification cards */}
                  <div className="space-y-2">
                    {items.map((n, i) => {
                      const Icon = getNotifIcon(n.message || n.title);
                      return (
                        <motion.div
                          key={n.id}
                          className={`group relative flex items-start gap-4 rounded-[20px] border p-4 transition-all duration-200 cursor-default ${
                            n.is_read
                              ? 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                              : 'border-primary/30 bg-surface-container-low hover:bg-surface-container'
                          }`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                        >
                          {/* Unread indicator */}
                          {!n.is_read && (
                            <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-primary" />
                          )}

                          {/* Icon */}
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              n.is_read ? 'bg-surface-container' : 'bg-primary'
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${n.is_read ? 'text-on-surface-variant' : 'text-on-primary'}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pl-2">
                            <p
                              className={`text-sm leading-snug ${n.is_read ? 'font-medium text-on-surface-variant' : 'font-semibold text-on-surface'}`}
                            >
                              {n.message || n.title || 'Notification'}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {new Date(n.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Mark read button */}
                          {!n.is_read && (
                            <button
                              className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary opacity-0 group-hover:opacity-100 transition-all duration-200"
                              onClick={() => markRead(n.id)}
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
