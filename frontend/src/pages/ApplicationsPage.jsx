import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { applicationService } from '../services/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data =
          user.role === 'volunteer'
            ? await applicationService.mine()
            : await applicationService.list({ limit: 100 });
        setApplications(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load applications'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.role]);

  const handleSetStatus = async (id, status) => {
    try {
      await applicationService.setStatus(id, { status });
      toast.success(`Application ${status}`);
      setApplications(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update status'));
    }
  };

  const statuses = ['pending', 'approved', 'rejected', 'waitlisted'];
  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const stats = statuses.map(s => ({
    status: s,
    count: applications.filter(a => a.status === s).length,
  }));

  const volunteerColumns = [
    { key: 'opportunity_title', label: 'Opportunity' },
    { key: 'organization_name', label: 'Organization' },
    {
      key: 'created_at',
      label: 'Applied',
      render: row =>
        new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
  ];

  const orgColumns = [
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'applicant_email', label: 'Email' },
    { key: 'opportunity_title', label: 'Opportunity' },
    {
      key: 'created_at',
      label: 'Applied',
      render: row =>
        new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
    { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: row =>
        row.status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              variant="subtle"
              size="xs"
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 border-0"
              onClick={() => handleSetStatus(row.id, 'approved')}
            >
              Approve
            </Button>
            <Button
              variant="subtle"
              size="xs"
              className="bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 border-0"
              onClick={() => handleSetStatus(row.id, 'rejected')}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Application Tracker"
        description="Monitor and manage volunteer applications across all opportunities."
      />

      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { id: 'all', label: 'All', count: applications.length },
          ...stats.map(s => ({ id: s.status, label: s.status, count: s.count })),
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${filter === id ? 'border-primary-400/50 bg-primary-50 shadow-glow-sm dark:border-primary-500/30 dark:bg-primary-900/20' : 'border-slate-200 bg-white shadow-card hover:border-slate-300 dark:border-white/5 dark:bg-slate-900/80'}`}
          >
            <p className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p
              className={`mt-1 text-2xl font-black ${filter === id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-white'}`}
            >
              {count}
            </p>
          </button>
        ))}
      </div>

      <DataTable
        columns={user.role === 'volunteer' ? volunteerColumns : orgColumns}
        rows={filtered}
        loading={loading}
        emptyTitle="No applications found"
        emptyDescription={
          filter !== 'all'
            ? `No ${filter} applications.`
            : 'Applications will appear here once submitted.'
        }
      />
    </>
  );
}
