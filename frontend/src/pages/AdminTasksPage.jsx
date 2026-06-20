import { Calendar, MapPin, Search, UserPlus } from 'lucide-react';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { adminService } from '../services/resources.js';

export default function AdminTasksPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({ location: '', start_date: '', end_date: '' });
  const [volunteerId, setVolunteerId] = useState('');

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.searchEvents(searchParams);
      setEvents(data.data || []);
      if (data.data?.length === 0) toast('No tasks found matching criteria', { icon: 'ℹ️' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not search tasks'));
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleAssign = async eventId => {
    if (!volunteerId.trim()) {
      toast.error('Please enter a Volunteer ID first');
      return;
    }
    try {
      await adminService.assignTask({ volunteer_id: volunteerId.trim(), event_id: eventId });
      toast.success('Volunteer successfully assigned to task!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not assign volunteer'));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Assign Tasks"
        description="Search for tasks by location, date, or time and assign volunteers using their ID."
      />

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <div className="md:col-span-4 white-card p-4 flex flex-col md:flex-row gap-4 items-end bg-primary-50/50 border-primary-100">
          <Input
            label="Volunteer ID to Assign"
            placeholder="e.g. 123e4567-e89b..."
            value={volunteerId}
            onChange={e => setVolunteerId(e.target.value)}
            className="flex-1"
            required
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Location
          </label>
          <LocationPicker
            value={searchParams.location}
            onChange={v => setSearchParams(p => ({ ...p, location: v }))}
            placeholder="Filter by state & district…"
          />
        </div>
        <div className="md:col-span-1">
          <Input
            type="date"
            label="Start Date"
            icon={Calendar}
            value={searchParams.start_date}
            onChange={e => setSearchParams(p => ({ ...p, start_date: e.target.value }))}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            type="date"
            label="End Date"
            icon={Calendar}
            value={searchParams.end_date}
            onChange={e => setSearchParams(p => ({ ...p, end_date: e.target.value }))}
          />
        </div>
        <div className="md:col-span-1 pb-1 flex items-end">
          <Button onClick={search} disabled={loading} className="w-full">
            <Search className="mr-2 h-4 w-4" /> Search Tasks
          </Button>
        </div>
      </div>

      <DataTable
        rows={events}
        loading={loading}
        emptyTitle="No tasks found"
        columns={[
          {
            key: 'title',
            label: 'Task / Event',
            render: row => (
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Org: {row.organization_name}
                </p>
              </div>
            ),
          },
          {
            key: 'location',
            label: 'Location',
            render: row =>
              row.location ? (
                <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {row.location}
                </span>
              ) : (
                'Remote'
              ),
          },
          {
            key: 'date',
            label: 'Date',
            render: row => (
              <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {new Date(row.start_at).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: row => (
              <Button size="sm" onClick={() => handleAssign(row.id)}>
                <UserPlus className="mr-2 h-3.5 w-3.5" /> Assign Here
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
