import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Eye,
  FileText,
  Filter,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  TrendingUp,
  UserCheck,
  UserSearch,
  Users,
  X,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../components/DataTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { adminService, eventService } from '../services/resources.js';
import Button from '../components/ui/Button.jsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'profiles', label: 'Profiles', Icon: UserCheck },
  { id: 'attendance', label: 'Attendance', Icon: ClipboardList },
  { id: 'volunteer-search', label: 'Volunteer Search', Icon: UserSearch },
  { id: 'monitoring', label: 'Monitoring', Icon: Activity },
];

const roleColors = {
  admin: 'bg-gradient-to-r from-rose-500 to-orange-400 text-white',
  organization: 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white',
  volunteer: 'bg-gradient-to-r from-primary-500 to-violet-500 text-white',
};

function VolunteerDetailModal({ detail, onClose }) {
  if (!detail) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] bg-white-card shadow-xl border border-line/20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.22 }}
      >
        <div className="flex items-center justify-between border-b border-line/20 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text">
              {detail.volunteer?.name || 'Volunteer Detail'}
            </h2>
            <p className="text-xs text-muted">Complete task history & profile</p>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-soft-card-2 hover:text-text transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-soft-card-2 p-3 text-center">
              <p className="text-xl font-black text-text">{detail.attendance?.length || 0}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mt-0.5">
                Events
              </p>
            </div>
            <div className="rounded-[20px] bg-soft-card-2 p-3 text-center">
              <p className="text-xl font-black text-text">
                {Number(detail.volunteer?.total_hours || 0).toFixed(1)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mt-0.5">
                Hours
              </p>
            </div>
            <div className="rounded-[20px] bg-soft-card-2 p-3 text-center">
              <p className="text-xl font-black text-text">
                {detail.attendance?.filter(a => a.status === 'attended').length || 0}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mt-0.5">
                Completed
              </p>
            </div>
          </div>
          {detail.attendance?.length ? (
            <div>
              <h3 className="text-sm font-bold text-text mb-3">Task History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detail.attendance.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-line/20 p-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-text">{att.event_title || 'Event'}</p>
                      <p className="text-[10px] text-muted">
                        {att.start_at ? new Date(att.start_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-text">
                        {Number(att.hours || 0).toFixed(1)} hrs
                      </span>
                      <Badge status={att.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No task history"
              description="This volunteer has no attendance records."
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BarChart({ items = [] }) {
  const max = Math.max(...items.map(i => Number(i.count || i.value || 0)), 1);
  const gradients = [
    'from-black to-muted',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-pink-400',
    'from-cyan-500 to-blue-400',
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const val = Number(item.count || item.value || 0);
        const lbl = item.status || item.category || item.label || `Item ${i + 1}`;
        return (
          <div key={i}>
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="capitalize text-muted">{lbl}</span>
              <span className="font-bold text-text">{val}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-soft-card">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${gradients[i % gradients.length]}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max((val / max) * 100, 3)}%` }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [monitoringLogs, setMonitoringLogs] = useState([]);
  const [detailVolunteer, setDetailVolunteer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Volunteer Search state
  const [vsQuery, setVsQuery] = useState('');
  const [vsSuggestions, setVsSuggestions] = useState([]);
  const [vsSearching, setVsSearching] = useState(false);
  const [vsReport, setVsReport] = useState(null);
  const [vsReportLoading, setVsReportLoading] = useState(false);
  const [vsReportTab, setVsReportTab] = useState('attendance');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await adminService.dashboard());
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadUsers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminService.users({ limit: 50, ...params });
      setUsers(res.data || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadProfiles = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminService.volunteerProfiles({ limit: 50, ...params });
      setProfiles(res.data || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to load profiles'));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadAttendance = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await adminService.allAttendance({ limit: 50, ...params });
      setAttendance(res.data || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to load attendance'));
    } finally {
      setLoading(false);
    }
  }, []);
  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.monitoring();
      setMonitoringLogs(res.recent_activity || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to load monitoring'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'users') loadUsers({ search, role: roleFilter, status: statusFilter });
    if (tab === 'profiles') loadProfiles({ search });
    if (tab === 'attendance') loadAttendance({ status: statusFilter });
    if (tab === 'monitoring') loadMonitoring();
    setDetailVolunteer(null);
  }, [tab]);

  const setUserStatus = async (userId, status) => {
    try {
      await adminService.setUserStatus(userId, status);
      toast.success(`User ${status}`);
      loadUsers({ search, role: roleFilter, status: statusFilter });
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Status update failed'));
    }
  };

  const applySearch = () => {
    if (tab === 'users') loadUsers({ search, role: roleFilter, status: statusFilter });
    if (tab === 'profiles') loadProfiles({ search });
    if (tab === 'attendance') loadAttendance({ status: statusFilter });
  };

  const markAttendance = async (attendanceId, status) => {
    try {
      await eventService.updateAttendance(attendanceId, { status });
      toast.success(status === 'attended' ? '✅ Marked completed' : '❌ Marked absent');
      loadAttendance({ status: statusFilter });
      loadDashboard();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Attendance update failed'));
    }
  };

  const openVolunteerDetail = async volunteerId => {
    try {
      const detail = await adminService.volunteerTasks(volunteerId);
      setDetailVolunteer(detail);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load volunteer details'));
    }
  };

  // Volunteer Search handlers
  const handleVsSearch = async () => {
    if (!vsQuery.trim()) return;
    setVsSearching(true);
    setVsSuggestions([]);
    setVsReport(null);
    try {
      const res = await adminService.searchVolunteers(vsQuery.trim());
      setVsSuggestions(res.data || []);
      if ((res.data || []).length === 0) toast('No volunteers found', { icon: '🔍' });
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Search failed'));
    } finally {
      setVsSearching(false);
    }
  };

  const loadVsReport = async volunteerId => {
    setVsReportLoading(true);
    setVsReport(null);
    setVsReportTab('attendance');
    try {
      const report = await adminService.volunteerReport(volunteerId);
      setVsReport(report);
      setVsSuggestions([]);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load report'));
    } finally {
      setVsReportLoading(false);
    }
  };

  function getInitials(name = '') {
    return (
      name
        .split(' ')
        .map(p => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'VH'
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Admin Portal"
        description="Manage users, verify volunteer profiles, track attendance, and monitor platform activity."
      />

      <div className="mb-6 flex gap-1 overflow-x-auto scrollbar-hide rounded-full bg-soft-card p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            id={`admin-tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full py-2.5 px-4 text-xs font-semibold transition-all duration-200 ${tab === id ? 'bg-white-card text-text shadow' : 'text-muted hover:text-text'}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {overview ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    icon={Users}
                    label="Total Volunteers"
                    value={overview.total_volunteers || 0}
                    tone="blue"
                    index={0}
                  />
                  <StatCard
                    icon={Clock}
                    label="Volunteer Hours"
                    value={`${Number(overview.volunteer_hours_completed || 0).toFixed(1)}`}
                    tone="emerald"
                    index={1}
                  />
                  <StatCard
                    icon={Calendar}
                    label="Pending Applications"
                    value={overview.pending_applications || 0}
                    tone="amber"
                    index={2}
                  />
                  <StatCard
                    icon={Award}
                    label="Certificates Issued"
                    value={overview.certificates_issued || 0}
                    tone="rose"
                    index={3}
                  />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[32px] border border-line/20 bg-white-card p-6 shadow-sm">
                    <h3 className="text-base font-bold text-text mb-5">Applications by Status</h3>
                    <BarChart items={overview.application_stats || []} />
                  </div>
                  <div className="rounded-[32px] border border-line/20 bg-white-card p-6 shadow-sm">
                    <h3 className="text-base font-bold text-text mb-5">
                      Opportunities by Category
                    </h3>
                    <BarChart
                      items={(overview.opportunity_categories || [])
                        .slice(0, 6)
                        .map(c => ({ label: c.category || 'Other', count: c.count }))}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted">
                {loading ? 'Loading dashboard…' : 'No data available'}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'users' && (
          <motion.div
            key="users"
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="rounded-[32px] border border-line/20 bg-white-card p-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    className="w-full rounded-xl border border-line/40 bg-soft-card-2 px-4 py-2.5 pl-9 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applySearch()}
                  />
                </div>
                <select
                  className="rounded-xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition focus:border-black w-36"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="">All roles</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="organization">Organization</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  className="rounded-xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition focus:border-black w-36"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                <Button variant="primary" onClick={applySearch}>
                  <Filter className="h-4 w-4" />
                  Apply
                </Button>
              </div>
            </div>
            <DataTable
              loading={loading}
              rows={users}
              emptyTitle="No users found"
              emptyDescription="Try adjusting your filters."
              columns={[
                {
                  key: 'name',
                  label: 'User',
                  render: row => (
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${roleColors[row.role] || roleColors.volunteer}`}
                      >
                        {getInitials(row.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-text">{row.name}</p>
                        <p className="text-xs text-muted">{row.email}</p>
                      </div>
                    </div>
                  ),
                },
                { key: 'role', label: 'Role', render: row => <Badge status={row.role} /> },
                {
                  key: 'status',
                  label: 'Status',
                  render: row => <Badge status={row.status || 'pending'} />,
                },
                {
                  key: 'created_at',
                  label: 'Joined',
                  render: row =>
                    row.created_at
                      ? new Date(row.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—',
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: row => (
                    <div className="flex gap-1.5">
                      <button
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${row.status === 'active' ? 'bg-green-500/10 text-green-700' : 'bg-soft-card-2 text-muted hover:bg-green-500/10 hover:text-green-700'}`}
                        onClick={() => setUserStatus(row.id, 'active')}
                        title="Set active"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Active
                      </button>
                      <button
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${row.status === 'suspended' ? 'bg-rose-500/10 text-rose-700' : 'bg-soft-card-2 text-muted hover:bg-rose-500/10 hover:text-rose-700'}`}
                        onClick={() => setUserStatus(row.id, 'suspended')}
                        title="Suspend"
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> Suspend
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </motion.div>
        )}

        {tab === 'profiles' && (
          <motion.div
            key="profiles"
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="w-full rounded-xl border border-line/40 bg-soft-card-2 px-4 py-2.5 pl-9 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black"
                  placeholder="Search volunteers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applySearch()}
                />
              </div>
              <Button variant="primary" onClick={applySearch}>
                Search
              </Button>
            </div>
            <DataTable
              loading={loading}
              rows={profiles}
              emptyTitle="No volunteer profiles found"
              columns={[
                {
                  key: 'name',
                  label: 'Volunteer',
                  render: row => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-500 text-xs font-bold text-white">
                        {getInitials(row.name || row.user_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-text">{row.name || row.user_name}</p>
                        <p className="text-xs text-muted">{row.email || row.user_email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'volunteer_type',
                  label: 'Type',
                  render: row => (
                    <span className="inline-flex items-center rounded-full border border-line/20 bg-soft-card-2 px-2.5 py-1 text-xs font-semibold text-text capitalize">
                      {row.volunteer_type?.replace('_', ' ') || '—'}
                    </span>
                  ),
                },
                {
                  key: 'total_hours',
                  label: 'Hours',
                  render: row => (
                    <span className="font-bold text-text">
                      {Number(row.total_hours || 0).toFixed(1)} hrs
                    </span>
                  ),
                },
                {
                  key: 'verified',
                  label: 'Verified',
                  render: row => (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${row.verified ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'}`}
                    >
                      {row.verified ? (
                        <>
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </>
                      ) : (
                        <>⏳ Pending</>
                      )}
                    </span>
                  ),
                },
                {
                  key: 'volunteer_id',
                  label: 'Volunteer ID',
                  render: row =>
                    row.volunteer_id ? (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full bg-soft-card-2 px-3 py-1 font-mono text-[10px] text-text hover:bg-soft-card transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(row.volunteer_id);
                          toast.success('ID copied');
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        {row.volunteer_id.slice(0, 8)}…
                      </button>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'detail',
                  label: 'Tasks',
                  render: row =>
                    row.volunteer_id ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => openVolunteerDetail(row.volunteer_id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    ) : null,
                },
              ]}
            />
          </motion.div>
        )}

        {tab === 'attendance' && (
          <motion.div
            key="attendance"
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex gap-3">
              <select
                className="rounded-xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition focus:border-black w-40"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="assigned">Assigned</option>
                <option value="attended">Attended</option>
                <option value="no_show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button variant="primary" onClick={applySearch}>
                Apply
              </Button>
            </div>
            <DataTable
              loading={loading}
              rows={attendance}
              emptyTitle="No attendance records"
              columns={[
                { key: 'volunteer_name', label: 'Volunteer' },
                { key: 'event_title', label: 'Event' },
                { key: 'organization_name', label: 'Organization' },
                { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
                {
                  key: 'hours',
                  label: 'Hours',
                  render: row => (
                    <span className="font-bold text-text">
                      {Number(row.hours || 0).toFixed(1)} hrs
                    </span>
                  ),
                },
                {
                  key: 'start_at',
                  label: 'Event Date',
                  render: row =>
                    row.start_at
                      ? new Date(row.start_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—',
                },
                {
                  key: 'actions',
                  label: 'Mark',
                  render: row => (
                    <div className="flex gap-1.5">
                      <Button
                        variant="subtle"
                        size="xs"
                        className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-0 rounded-full"
                        onClick={() => markAttendance(row.id, 'attended')}
                      >
                        ✅ Present
                      </Button>
                      <Button
                        variant="subtle"
                        size="xs"
                        className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-0 rounded-full"
                        onClick={() => markAttendance(row.id, 'no_show')}
                      >
                        ❌ Absent
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </motion.div>
        )}

        {tab === 'monitoring' && (
          <motion.div
            key="monitoring"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {monitoringLogs.length ? (
              <div className="space-y-2">
                {monitoringLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-2xl border border-line/20 bg-white-card p-4 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-card-2">
                      <Activity className="h-4 w-4 text-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text capitalize">
                        {log.action?.replace(/_/g, ' ') || 'Platform activity'}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {log.entity_type} • {log.user_name || log.user_email || 'System'} •{' '}
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </p>
                    </div>
                    <Badge
                      status={log.action?.includes('delete') ? 'rejected' : 'active'}
                      dot={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No monitoring logs"
                description="Platform activity events will appear here."
              />
            )}
          </motion.div>
        )}

        {tab === 'volunteer-search' && (
          <motion.div
            key="volunteer-search"
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {/* Hero Search Panel */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
              {/* Background decorations */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
              </div>
              <div className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <UserSearch className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                    Admin Tool
                  </span>
                </div>
                <h2 className="mb-1 text-2xl font-black text-white">Volunteer Search</h2>
                <p className="mb-6 text-sm text-white/70">
                  Search by Volunteer ID, name, or email to get a comprehensive activity report.
                </p>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      id="vs-search-input"
                      className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3.5 pl-11 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-white/50 focus:bg-white/15"
                      placeholder="Enter Volunteer ID, name, or email…"
                      value={vsQuery}
                      onChange={e => setVsQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleVsSearch()}
                    />
                  </div>
                  <button
                    id="vs-search-btn"
                    onClick={handleVsSearch}
                    disabled={vsSearching || !vsQuery.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-violet-700 shadow-lg transition hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100"
                  >
                    {vsSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestions list */}
            <AnimatePresence>
              {vsSuggestions.length > 0 && !vsReport && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-[24px] border border-line/20 bg-white-card shadow-sm overflow-hidden"
                >
                  <div className="border-b border-line/10 px-5 py-3.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      {vsSuggestions.length} result{vsSuggestions.length !== 1 ? 's' : ''} found —
                      select to view full report
                    </p>
                  </div>
                  <div className="divide-y divide-line/10">
                    {vsSuggestions.map((vol, i) => (
                      <motion.button
                        key={vol.volunteer_id}
                        id={`vs-suggestion-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => loadVsReport(vol.volunteer_id)}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-soft-card-2 group"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-sm">
                          {(vol.name || 'V')
                            .split(' ')
                            .map(p => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text truncate">{vol.name}</p>
                          <p className="text-xs text-muted truncate">{vol.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-[10px] text-muted">
                            {vol.volunteer_id?.slice(0, 12)}…
                          </p>
                          <p className="text-[10px] text-muted capitalize">
                            {vol.volunteer_type?.replace('_', ' ') || 'volunteer'}
                          </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 transition group-hover:bg-violet-500 group-hover:text-white">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading skeleton */}
            {vsReportLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-soft-card-2" />
                  ))}
                </div>
                <div className="h-64 animate-pulse rounded-[32px] bg-soft-card-2" />
              </div>
            )}

            {/* Full Report */}
            <AnimatePresence>
              {vsReport && !vsReportLoading && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-6"
                >
                  {/* Profile Header */}
                  <div className="relative overflow-hidden rounded-[32px] border border-line/20 bg-white-card p-6 shadow-sm">
                    <div className="flex items-start gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-black text-white shadow-lg">
                        {(vsReport.volunteer?.name || 'V')
                          .split(' ')
                          .map(p => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-xl font-black text-text">
                            {vsReport.volunteer?.name}
                          </h2>
                          <Badge status={vsReport.volunteer?.account_status || 'active'} />
                          {vsReport.volunteer?.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                          {vsReport.volunteer?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {vsReport.volunteer.email}
                            </span>
                          )}
                          {vsReport.volunteer?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {vsReport.volunteer.phone}
                            </span>
                          )}
                          {vsReport.volunteer?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {vsReport.volunteer.location}
                            </span>
                          )}
                          {vsReport.volunteer?.joined_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Joined{' '}
                              {new Date(vsReport.volunteer.joined_at).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {vsReport.volunteer?.bio && (
                          <p className="mt-2 text-xs text-muted line-clamp-2">
                            {vsReport.volunteer.bio}
                          </p>
                        )}
                        {vsReport.volunteer?.skills?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(Array.isArray(vsReport.volunteer.skills)
                              ? vsReport.volunteer.skills
                              : []
                            )
                              .slice(0, 6)
                              .map((s, i) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700"
                                >
                                  {s}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                          Volunteer ID
                        </p>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl bg-soft-card-2 px-3 py-1.5 font-mono text-[11px] text-text hover:bg-soft-card transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(vsReport.volunteer?.id || '');
                            toast.success('ID copied!');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          {(vsReport.volunteer?.id || '').slice(0, 12)}…
                        </button>
                        <button
                          onClick={() => {
                            setVsReport(null);
                            setVsSuggestions([]);
                          }}
                          className="mt-2 flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-muted hover:text-text hover:bg-soft-card-2 transition-colors"
                        >
                          <X className="h-3 w-3" /> Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      {
                        label: 'Total Events',
                        value: vsReport.stats?.total_events || 0,
                        icon: Calendar,
                        color: 'from-blue-500 to-cyan-400',
                      },
                      {
                        label: 'Completed',
                        value: vsReport.stats?.completed_events || 0,
                        icon: CheckCircle2,
                        color: 'from-emerald-500 to-teal-400',
                      },
                      {
                        label: 'Hours',
                        value: Number(vsReport.stats?.total_hours || 0).toFixed(1),
                        icon: Clock,
                        color: 'from-violet-500 to-purple-400',
                      },
                      {
                        label: 'Applications',
                        value: vsReport.stats?.total_applications || 0,
                        icon: FileText,
                        color: 'from-amber-500 to-orange-400',
                      },
                      {
                        label: 'Approved',
                        value: vsReport.stats?.approved_applications || 0,
                        icon: ShieldCheck,
                        color: 'from-green-500 to-emerald-400',
                      },
                      {
                        label: 'Certificates',
                        value: vsReport.stats?.certificates_earned || 0,
                        icon: Award,
                        color: 'from-rose-500 to-pink-400',
                      },
                    ].map(({ label, value, icon: Icon, color }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-2xl border border-line/20 bg-white-card p-4 text-center shadow-sm"
                      >
                        <div
                          className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-xl font-black text-text">{value}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          {label}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Detail Tabs */}
                  <div className="rounded-[32px] border border-line/20 bg-white-card shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex gap-1 border-b border-line/10 bg-soft-card p-1.5">
                      {[
                        { id: 'attendance', label: 'Task History', icon: ClipboardList },
                        { id: 'applications', label: 'Applications', icon: FileText },
                        { id: 'certificates', label: 'Certificates', icon: Award },
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          id={`vs-report-tab-${id}`}
                          onClick={() => setVsReportTab(id)}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
                            vsReportTab === id
                              ? 'bg-white-card text-text shadow-sm'
                              : 'text-muted hover:text-text'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Task History */}
                    {vsReportTab === 'attendance' && (
                      <div className="p-5">
                        {vsReport.attendance?.length ? (
                          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                            {vsReport.attendance.map((att, i) => (
                              <motion.div
                                key={att.id || i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-4 rounded-2xl border border-line/20 p-3.5 hover:bg-soft-card-2 transition-all"
                              >
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                    att.status === 'attended'
                                      ? 'bg-emerald-500/10'
                                      : att.status === 'no_show'
                                        ? 'bg-rose-500/10'
                                        : 'bg-amber-500/10'
                                  }`}
                                >
                                  <ClipboardList
                                    className={`h-4 w-4 ${
                                      att.status === 'attended'
                                        ? 'text-emerald-600'
                                        : att.status === 'no_show'
                                          ? 'text-rose-600'
                                          : 'text-amber-600'
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-text truncate">
                                    {att.event_title || 'Event'}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-muted">
                                    <span>{att.organization_name}</span>
                                    {att.event_location && (
                                      <span className="flex items-center gap-0.5">
                                        <MapPin className="h-2.5 w-2.5" />
                                        {att.event_location}
                                      </span>
                                    )}
                                    {att.start_at && (
                                      <span>
                                        {new Date(att.start_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-bold text-text">
                                    {Number(att.hours || 0).toFixed(1)} hrs
                                  </span>
                                  <Badge status={att.status} />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No task history"
                            description="This volunteer has no event attendance records."
                          />
                        )}
                      </div>
                    )}

                    {/* Applications */}
                    {vsReportTab === 'applications' && (
                      <div className="p-5">
                        {vsReport.applications?.length ? (
                          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                            {vsReport.applications.map((app, i) => (
                              <motion.div
                                key={app.id || i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-4 rounded-2xl border border-line/20 p-3.5 hover:bg-soft-card-2 transition-all"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                                  <FileText className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-text truncate">
                                    {app.opportunity_title || 'Opportunity'}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-muted">
                                    <span>{app.organization_name}</span>
                                    {app.category && (
                                      <span className="capitalize">{app.category}</span>
                                    )}
                                    {app.applied_at && (
                                      <span>
                                        Applied{' '}
                                        {new Date(app.applied_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Badge status={app.status} />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No applications"
                            description="This volunteer has not applied to any opportunities."
                          />
                        )}
                      </div>
                    )}

                    {/* Certificates */}
                    {vsReportTab === 'certificates' && (
                      <div className="p-5">
                        {vsReport.certificates?.length ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {vsReport.certificates.map((cert, i) => (
                              <motion.div
                                key={cert.id || i}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
                              >
                                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10" />
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                                    <Award className="h-5 w-5 text-amber-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-text truncate">
                                      {cert.event_title || 'Volunteer Certificate'}
                                    </p>
                                    <p className="text-xs text-muted mt-0.5">
                                      Issued{' '}
                                      {cert.issued_at
                                        ? new Date(cert.issued_at).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })
                                        : '—'}
                                    </p>
                                    {cert.certificate_number && (
                                      <p className="text-[10px] font-mono text-amber-700 mt-1">
                                        #{cert.certificate_number}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No certificates"
                            description="This volunteer has not earned any certificates yet."
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Extra info: institution, bio */}
                  {(vsReport.volunteer?.institution ||
                    vsReport.volunteer?.field_of_study ||
                    vsReport.volunteer?.linkedin_url) && (
                    <div className="rounded-[24px] border border-line/20 bg-white-card p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted" /> Additional Info
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs">
                        {vsReport.volunteer?.institution && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
                              Institution
                            </p>
                            <p className="font-semibold text-text">
                              {vsReport.volunteer.institution}
                            </p>
                          </div>
                        )}
                        {vsReport.volunteer?.field_of_study && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
                              Field of Study
                            </p>
                            <p className="font-semibold text-text">
                              {vsReport.volunteer.field_of_study}
                            </p>
                          </div>
                        )}
                        {vsReport.volunteer?.volunteer_type && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
                              Volunteer Type
                            </p>
                            <p className="font-semibold text-text capitalize">
                              {vsReport.volunteer.volunteer_type?.replace('_', ' ')}
                            </p>
                          </div>
                        )}
                        {vsReport.volunteer?.linkedin_url && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-0.5">
                              LinkedIn
                            </p>
                            <a
                              href={vsReport.volunteer.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-blue-600 hover:underline truncate block"
                            >
                              {vsReport.volunteer.linkedin_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state: no query, no results, no report */}
            {!vsReport && !vsReportLoading && vsSuggestions.length === 0 && !vsSearching && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
                  <UserSearch className="h-9 w-9 text-violet-500" />
                </div>
                <h3 className="text-base font-bold text-text">Search for a Volunteer</h3>
                <p className="mt-1 text-sm text-muted max-w-sm">
                  Enter a volunteer ID (full UUID or partial), name, or email address to pull up
                  their complete activity report.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailVolunteer && (
          <VolunteerDetailModal detail={detailVolunteer} onClose={() => setDetailVolunteer(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
