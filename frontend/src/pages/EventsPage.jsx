import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  LogIn,
  MapPin,
  UserPlus,
  X,
  XCircle,
  Search,
  User,
  Mail,
  Phone,
  Award,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DataTable from '../components/DataTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { attendanceService, eventService, profileService } from '../services/resources.js';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

const initialEvent = {
  title: '',
  location: '',
  start_at: '',
  end_at: '',
  capacity: '',
  description: '',
};

function CreateEventModal({ onClose, onCreate }) {
  const [form, setForm] = useState(initialEvent);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ ...form, capacity: form.capacity ? Number(form.capacity) : null });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Schedule New Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Event Title *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              placeholder="Event name"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Location
            </label>
            <LocationPicker
              value={form.location}
              onChange={v => setForm({ ...form, location: v })}
              placeholder="Select State & District"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Capacity
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="number"
              placeholder="Max attendees"
              value={form.capacity}
              onChange={e => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Start Date & Time *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="datetime-local"
              value={form.start_at}
              onChange={e => setForm({ ...form, start_at: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              End Date & Time *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="datetime-local"
              value={form.end_at}
              onChange={e => setForm({ ...form, end_at: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 min-h-20 resize-none"
              placeholder="What happens at this event..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" loading={loading}>
            Create Event
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [volunteerId, setVolunteerId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);
  const [volunteerFilter, setVolunteerFilter] = useState('all');
  const [searchedVolunteer, setSearchedVolunteer] = useState(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        user.role === 'volunteer'
          ? await eventService.assigned()
          : await eventService.list({ limit: 100 });
      setEvents(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load events'));
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    load();
  }, [load]);

  const completedTasks = useMemo(
    () => events.filter(e => e.attendance_status === 'attended'),
    [events]
  );
  const assignedTasks = useMemo(
    () => events.filter(e => e.attendance_status !== 'attended'),
    [events]
  );
  const visibleRows = useMemo(() => {
    if (volunteerFilter === 'completed') return completedTasks;
    if (volunteerFilter === 'assigned') return assignedTasks;
    return events;
  }, [events, completedTasks, assignedTasks, volunteerFilter]);

  const createEvent = async data => {
    try {
      await eventService.create(data);
      toast.success('Event created!');
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create event'));
      throw error;
    }
  };

  const loadAttendance = async eventRow => {
    setSelectedEvent(eventRow);
    try {
      setAttendance(await eventService.attendance(eventRow.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load attendance'));
    }
  };

  const assignVolunteer = async vid => {
    if (!selectedEvent) return;
    try {
      await eventService.assign(selectedEvent.id, { volunteerId: vid });
      toast.success('Volunteer assigned!');
      setVolunteerId('');
      setSearchedVolunteer(null);
      loadAttendance(selectedEvent);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not assign volunteer'));
    }
  };

  const markAttendance = async (row, status) => {
    try {
      await eventService.updateAttendance(row.id, { status });
      toast.success(status === 'attended' ? '✅ Marked completed' : '❌ Marked absent');
      setSearchedVolunteer(null);
      loadAttendance(selectedEvent);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update attendance'));
    }
  };

  const handleLookupVolunteer = async e => {
    e.preventDefault();
    if (!volunteerId) return;
    setSearching(true);
    try {
      const vol = await profileService.getVolunteer(volunteerId);
      setSearchedVolunteer(vol);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Volunteer not found'));
      setSearchedVolunteer(null);
    } finally {
      setSearching(false);
    }
  };

  const handleVerifyAttendance = async (row, action) => {
    try {
      await attendanceService.verifyAttendance(row.id, { action });
      toast.success(action === 'verify' ? '✅ Attendance Verified' : '❌ Attendance Rejected');
      loadAttendance(selectedEvent);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not verify attendance'));
    }
  };

  const handleSelfCheckIn = async attendanceId => {
    setCheckingIn(attendanceId);
    try {
      await attendanceService.checkIn(attendanceId);
      toast.success('✅ Checked in!');
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Check-in failed'));
    } finally {
      setCheckingIn(null);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Tasks', count: events.length },
    { id: 'assigned', label: 'Assigned', count: assignedTasks.length },
    { id: 'completed', label: 'Completed', count: completedTasks.length },
  ];

  const volunteerColumns = [
    {
      key: 'title',
      label: 'Task',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
          {row.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3" />
              {row.location}
            </p>
          )}
        </div>
      ),
    },
    { key: 'organization_name', label: 'Organization' },
    {
      key: 'start_at',
      label: 'Date & Time',
      render: row => (
        <div className="text-sm">
          <p className="font-medium text-slate-900 dark:text-white">
            {new Date(row.start_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
            <Clock className="h-3 w-3" />
            {new Date(row.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'attendance_status',
      label: 'Status',
      render: row => <Badge status={row.attendance_status} />,
    },
    {
      key: 'hours',
      label: 'Hours',
      render: row => (
        <span className="font-bold text-primary-600 dark:text-primary-400">
          {Number(row.hours || 0).toFixed(1)} hrs
        </span>
      ),
    },
    {
      key: 'checkin',
      label: 'Check-in',
      render: row =>
        row.attendance_status === 'assigned' ? (
          <Button
            variant="primary"
            size="xs"
            loading={checkingIn === row.attendance_id}
            onClick={() => handleSelfCheckIn(row.attendance_id)}
          >
            <LogIn className="h-3.5 w-3.5" />
            {checkingIn === row.attendance_id ? 'Checking...' : 'Check In'}
          </Button>
        ) : (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Done</span>
        ),
    },
  ];

  const orgColumns = [
    { key: 'title', label: 'Event' },
    { key: 'organization_name', label: 'Organization' },
    {
      key: 'start_at',
      label: 'Starts',
      render: row =>
        new Date(row.start_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
    {
      key: 'actions',
      label: 'Attendance',
      render: row => (
        <Button variant="secondary" size="xs" onClick={() => loadAttendance(row)}>
          Track
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Event Management"
        title="Events"
        description={
          user.role === 'volunteer'
            ? 'See assigned tasks, check in, and track your volunteer hours.'
            : 'Schedule events, assign volunteers, and mark attendance records.'
        }
        actions={
          user.role !== 'volunteer' ? (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <CalendarPlus className="h-4 w-4" />
              New Event
            </Button>
          ) : null
        }
      />

      {user.role === 'volunteer' && (
        <div className="mb-5 flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setVolunteerFilter(tab.id)}
              className={`relative rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${volunteerFilter === tab.id ? 'border-primary-500/50 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-900/20 dark:text-primary-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300'}`}
            >
              {tab.label}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-bold ${volunteerFilter === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}
              >
                {tab.count}
              </span>
              {volunteerFilter === tab.id && (
                <motion.div
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-violet-500"
                  layoutId="event-tab-underline"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={user.role === 'volunteer' ? volunteerColumns : orgColumns}
        rows={user.role === 'volunteer' ? visibleRows : events}
        loading={loading}
        emptyTitle={
          user.role === 'volunteer' && volunteerFilter === 'completed'
            ? 'No completed tasks yet'
            : 'No events found'
        }
        emptyDescription={
          user.role === 'volunteer'
            ? 'Apply for opportunities to get assigned to events.'
            : 'Create your first event to get started.'
        }
      />

      {user.role !== 'volunteer' && selectedEvent && (
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Attendance: ${selectedEvent.title}`}
          subtitle="Assign and mark attendance."
          size="xl"
        >
          {user.role === 'admin' && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <form className="flex gap-2 w-full" onSubmit={handleLookupVolunteer}>
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                  placeholder="Volunteer ID (UUID)"
                  value={volunteerId}
                  onChange={e => setVolunteerId(e.target.value)}
                  required
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-6"
                  type="submit"
                  loading={searching}
                >
                  <Search className="h-4 w-4" />
                  Lookup
                </Button>
              </form>
            </div>
          )}

          {searchedVolunteer && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 font-bold text-lg">
                  {searchedVolunteer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    {searchedVolunteer.name}
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {searchedVolunteer.email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {(() => {
                  const existingRecord = attendance.find(
                    a => a.volunteer_id === searchedVolunteer.id
                  );
                  if (existingRecord) {
                    if (existingRecord.status === 'attended') {
                      return (
                        <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1 px-4 py-2">
                          <CheckCircle2 className="h-4 w-4" /> Already Marked Present
                        </span>
                      );
                    } else if (existingRecord.status === 'no_show') {
                      return (
                        <span className="text-rose-600 font-semibold text-sm flex items-center gap-1 px-4 py-2">
                          <XCircle className="h-4 w-4" /> Marked Absent
                        </span>
                      );
                    }
                    return (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => markAttendance(existingRecord, 'attended')}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Present
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => markAttendance(existingRecord, 'no_show')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 text-rose-600" /> Absent
                        </Button>
                      </>
                    );
                  }
                  return (
                    <Button
                      variant="primary"
                      onClick={() => assignVolunteer(searchedVolunteer.id)}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign to Event
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}

          {attendance.length ? (
            <DataTable
              rows={attendance}
              columns={[
                {
                  key: 'volunteer_id',
                  label: 'Volunteer ID',
                  render: row => (
                    <button
                      className="inline-flex max-w-36 items-center gap-1.5 truncate rounded-lg bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(row.volunteer_id);
                        toast.success('Volunteer ID copied');
                      }}
                      title={row.volunteer_id}
                    >
                      <Copy className="h-3 w-3 shrink-0" />
                      <span className="truncate">{row.volunteer_id?.slice(0, 8)}…</span>
                    </button>
                  ),
                },
                { key: 'volunteer_name', label: 'Volunteer' },
                { key: 'volunteer_email', label: 'Email' },
                {
                  key: 'status',
                  label: 'Status',
                  render: row => (
                    <div className="flex flex-col gap-1">
                      <Badge status={row.status} />
                      {row.notes?.includes('5 days') && (
                        <span className="text-[10px] font-medium text-slate-500">
                          {row.completed_days}/5 days verified
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'hours',
                  label: 'Hours',
                  render: row => `${Number(row.hours || 0).toFixed(1)} hrs`,
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: row => (
                    <div className="flex gap-2">
                      {row.status !== 'attended' && row.status !== 'no_show' && (
                        <>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            onClick={() => markAttendance(row, 'attended')}
                            title="Mark completed"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </button>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            onClick={() => markAttendance(row, 'no_show')}
                            title="Mark absent"
                          >
                            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          </button>
                        </>
                      )}
                      {row.status === 'attended' && row.verification_status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleVerifyAttendance(row, 'verify')}
                          >
                            Verify
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleVerifyAttendance(row, 'reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {row.verification_status === 'verified' && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No assigned volunteers"
              description="Assign a volunteer by their ID to begin tracking attendance."
            />
          )}
        </Modal>
      )}

      <AnimatePresence>
        {showForm && <CreateEventModal onClose={() => setShowForm(false)} onCreate={createEvent} />}
      </AnimatePresence>
    </>
  );
}
