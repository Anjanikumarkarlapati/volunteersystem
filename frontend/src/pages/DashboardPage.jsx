import {
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import AIReportCard from '../components/dashboard/AIReportCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  adminService,
  applicationService,
  certificateService,
  eventService,
  profileService,
  reportService,
} from '../services/resources.js';
import { getApiErrorMessage } from '../services/api.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function AnalyticsBars({ title, items = [] }) {
  const total = items.reduce((sum, i) => sum + Number(i.count || i.value || 0), 1);

  const barConfig = [
    { colorBar: '#1b1c1a', colorBg: '#f0efeb', label: 'bg' },
    { colorBar: '#747878', colorBg: '#ededea', label: 'bg2' },
    { colorBar: '#444748', colorBg: '#e9e8e4', label: 'bg3' },
    { colorBar: '#9ca3af', colorBg: '#f3f4f6', label: 'bg4' },
    { colorBar: '#c4c7c7', colorBg: '#fafafa', label: 'bg5' },
  ];

  return (
    <div className="white-card p-8 flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-on-surface">{title}</h4>
          <p className="text-sm text-on-surface-variant mt-0.5">Live distribution overview</p>
        </div>
        <div className="p-2.5 bg-surface-container rounded-2xl">
          <TrendingUp className="h-5 w-5 text-on-surface-variant" />
        </div>
      </div>

      {items.length ? (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {items.map((i, index) => {
            const value = Number(i.count || i.value || 0);
            const label = i.status || i.category || i.name || i.label || '';
            const pct = Math.round((value / total) * 100);
            const cfg = barConfig[index % barConfig.length];
            return (
              <div key={`${label}-${index}`} className="group">
                {/* Label row */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-on-surface capitalize">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">{value}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.colorBg, color: cfg.colorBar }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
                {/* Bar track */}
                <div
                  className="h-3 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: cfg.colorBg }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.colorBar }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 3)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Total
            </span>
            <span className="text-lg font-black text-on-surface">{total}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No data yet"
            description="Activity will appear here once you start engaging."
            compact
          />
        </div>
      )}
    </div>
  );
}

function UpcomingEvents({ events = [] }) {
  const upcoming = events
    .filter(e => new Date(e.start_at) >= new Date() || e.attendance_status === 'assigned')
    .slice(0, 5);
  return (
    <div className="soft-card-2 p-8 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-on-surface">Upcoming Events</h4>
          <p className="text-sm text-on-surface-variant mt-0.5">Next scheduled work</p>
        </div>
        <CalendarDays className="h-5 w-5 text-on-surface-variant" />
      </div>
      {upcoming.length ? (
        <div className="space-y-0 flex-1">
          {upcoming.map((event, idx) => (
            <div
              key={event.id || event.attendance_id}
              className={`flex gap-4 group ${idx < upcoming.length - 1 ? 'pb-5 mb-5 border-b border-outline-variant' : ''}`}
            >
              <div className="flex flex-col items-center gap-1 mt-1">
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ring-4 ring-white ${
                    event.attendance_status === 'attended'
                      ? 'bg-green-500'
                      : event.attendance_status === 'assigned'
                        ? 'bg-primary'
                        : 'bg-outline-variant'
                  }`}
                />
                {idx < upcoming.length - 1 && (
                  <div className="w-px flex-1 bg-outline-variant min-h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-on-surface truncate">{event.title}</p>
                  <Badge status={event.attendance_status || event.status} dot={false} />
                </div>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {event.organization_name || event.opportunity_title || 'Volunteer Hub'}
                </p>
                <p className="mt-1 text-xs font-bold text-on-surface">
                  {new Date(event.start_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No upcoming events"
          description="Scheduled events will appear here."
          compact
        />
      )}

      {/* Lumio Insight card at bottom */}
      <div className="mt-6 p-4 bg-primary rounded-2xl flex items-center gap-4 text-on-primary">
        <Sparkles className="h-7 w-7 shrink-0" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Insight</p>
          <p className="text-sm opacity-90 mt-0.5">
            {upcoming.length > 0
              ? `${upcoming.length} event${upcoming.length > 1 ? 's' : ''} scheduled ahead.`
              : 'No upcoming events. Browse opportunities to get started.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickActions({ role }) {
  const actions = {
    volunteer: [
      {
        label: 'Browse Opportunities',
        href: '/opportunities',
        icon: ClipboardList,
        desc: 'Find meaningful work',
      },
      { label: 'Discover Near Me', href: '/discover', icon: Zap, desc: 'Local opportunities' },
      {
        label: 'Build your squad',
        href: '/squads',
        icon: Users,
        desc: 'Create a team, invite volunteers with their IDs, and track collective hours here.',
      },
    ],
    organization: [
      {
        label: 'Post Opportunity',
        href: '/opportunities',
        icon: ClipboardList,
        desc: 'Create new listing',
      },
      { label: 'Schedule Event', href: '/events', icon: CalendarDays, desc: 'Plan activities' },
      { label: 'View Reports', href: '/reports', icon: TrendingUp, desc: 'Track impact' },
    ],
    admin: [
      { label: 'Manage Users', href: '/admin/users', icon: Users, desc: 'User administration' },
      {
        label: 'Organizations',
        href: '/admin/organizations',
        icon: CheckCircle2,
        desc: 'Verify orgs',
      },
      { label: 'Platform Reports', href: '/reports', icon: TrendingUp, desc: 'Analytics' },
    ],
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {(actions[role] || actions.volunteer).map(({ label, href, icon: Icon, desc }) => (
        <Link
          key={label}
          to={href}
          className="soft-card-2 p-6 flex items-center gap-5 hover:bg-surface-container-highest transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-on-surface">{label}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-on-surface-variant ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </Link>
      ))}
    </div>
  );
}

function WelcomeBanner({ user, summary, loading }) {
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2
          className="text-[32px] font-bold text-on-surface tracking-tight leading-tight"
          style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
        >
          {greeting}, {user.name?.split(' ')[0]}
        </h2>
        <p className="text-lg text-on-surface-variant mt-1">
          {loading ? (
            <span className="inline-block h-5 w-56 rounded bg-surface-container-high animate-pulse" />
          ) : user.role === 'admin' ? (
            `Managing ${summary?.total_volunteers || 0} volunteers across the platform`
          ) : user.role === 'organization' ? (
            `${summary?.active_opportunities || 0} active opportunities posted`
          ) : (
            `${Number(summary?.volunteer_hours_completed || 0).toFixed(1)} volunteer hours contributed`
          )}
        </p>
      </div>
      <div className="flex gap-3 shrink-0">
        <Link
          to="/reports"
          className="flex items-center gap-2 bg-surface-container-highest text-on-surface border border-outline-variant font-semibold px-5 py-2.5 rounded-xl hover:bg-surface-dim transition-colors text-sm"
        >
          <TrendingUp className="h-4 w-4" />
          View Reports
        </Link>
        <Link
          to="/events"
          className="flex items-center gap-2 bg-primary text-on-primary font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          <CalendarDays className="h-4 w-4" />
          Manage Events
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (user.role === 'admin') {
          const [data, eventData] = await Promise.all([
            adminService.dashboard(),
            eventService.list({ limit: 8 }),
          ]);
          if (!mounted) return;
          setSummary(data);
          setRows(data.application_stats || []);
          setAnalytics(data.opportunity_categories || []);
          setEvents(eventData.data || []);
        } else if (user.role === 'organization') {
          const [data, eventData] = await Promise.all([
            reportService.organization(),
            eventService.list({ limit: 8 }),
          ]);
          if (!mounted) return;
          setSummary({
            active_opportunities: data.summary?.opportunities,
            pending_applications:
              data.application_statuses?.find(i => i.status === 'pending')?.count || 0,
            upcoming_events: data.summary?.events,
            volunteer_hours_completed: data.hours?.hours_completed,
          });
          setRows(data.application_statuses || []);
          setAnalytics(data.application_statuses || []);
          setEvents(eventData.data || []);
        } else {
          const [hours, applications, assignedEvents, certificates] = await Promise.all([
            profileService.hours(),
            applicationService.mine(),
            eventService.assigned(),
            certificateService.mine(),
          ]);
          if (!mounted) return;
          setSummary({
            volunteer_hours_completed: hours?.total_hours,
            completed_events: hours?.completed_events,
            pending_applications: applications.filter(i => i.status === 'pending').length,
            upcoming_events: assignedEvents.filter(e => new Date(e.start_at) >= new Date()).length,
            certificates_issued: certificates.length,
          });
          setRows(applications.slice(0, 5));
          setAnalytics([
            { label: 'Completed', value: hours?.completed_events || 0 },
            { label: 'Pending', value: applications.filter(i => i.status === 'pending').length },
          ]);
          setEvents(assignedEvents);
        }
      } catch (requestError) {
        if (mounted) setError(getApiErrorMessage(requestError));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user.role]);

  const columns = useMemo(
    () =>
      user.role === 'volunteer'
        ? [
            { key: 'opportunity_title', label: 'Opportunity' },
            { key: 'organization_name', label: 'Organization' },
            { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
          ]
        : [
            {
              key: 'status',
              label: 'Application Status',
              render: row => <Badge status={row.status} />,
            },
            { key: 'count', label: 'Count' },
          ],
    [user.role]
  );

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <WelcomeBanner user={user} summary={summary} loading={loading} />

      {error && (
        <div className="rounded-[32px] border border-error bg-error-container p-4 text-sm font-medium text-on-error-container">
          {error}
        </div>
      )}

      {/* Stat grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="white-card p-6">
              <div className="h-10 w-10 rounded-2xl bg-surface-container animate-pulse mb-4" />
              <div className="h-3 w-24 rounded bg-surface-container animate-pulse mb-2" />
              <div className="h-9 w-20 rounded bg-surface-container animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <StatCard
            icon={Users}
            label={user.role === 'volunteer' ? 'Events Completed' : 'Total Volunteers'}
            value={summary?.total_volunteers || summary?.completed_events || 0}
            tone="blue"
            index={0}
          />
          <StatCard
            icon={ClipboardList}
            label="Active Opportunities"
            value={summary?.active_opportunities || 0}
            tone="emerald"
            index={1}
          />
          <StatCard
            icon={Clock}
            label="Volunteer Hours"
            value={Number(summary?.volunteer_hours_completed || 0).toFixed(1)}
            tone="violet"
            index={2}
          />
        </motion.div>
      )}

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon={CalendarDays}
            label="Upcoming Events"
            value={summary?.upcoming_events || 0}
            tone="amber"
            index={3}
          />
          {user.role === 'volunteer' && (
            <>
              <StatCard
                icon={CheckCircle2}
                label="Pending Tasks"
                value={summary?.upcoming_events || 0}
                tone="amber"
                index={4}
              />
            </>
          )}
          {user.role !== 'volunteer' && (
            <StatCard
              icon={CheckCircle2}
              label="Pending Applications"
              value={summary?.pending_applications || 0}
              tone="cyan"
              index={4}
            />
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-on-surface-variant" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Quick Actions
          </h2>
        </div>
        <QuickActions role={user.role} />
      </div>

      {/* Chart + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AnalyticsBars
          title={user.role === 'admin' ? 'Opportunity Categories' : 'Activity Overview'}
          items={analytics}
        />
        <UpcomingEvents events={events} />
      </div>

      {/* Recent records table */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-on-surface">
            {user.role === 'volunteer' ? 'Recent Applications' : 'Application Statistics'}
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">Latest workflow signals</p>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyTitle="No dashboard records yet"
          emptyDescription="Activity will appear here as you engage with the platform."
        />
      </section>

      {/* AI Summary Card for Admins */}
      {user.role === 'admin' && <AIReportCard />}
    </div>
  );
}
