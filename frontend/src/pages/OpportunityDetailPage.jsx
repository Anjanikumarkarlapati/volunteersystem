import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { opportunityService } from '../services/resources.js';

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await opportunityService.get(id);
        setOpportunity(data);
        if (['organization', 'admin'].includes(user.role))
          setApplications(await opportunityService.applications(id));
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load opportunity'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user.role]);

  const apply = async event => {
    event.preventDefault();
    try {
      await opportunityService.apply(id, { message });
      toast.success('Application submitted');
      setMessage('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not apply'));
    }
  };

  if (loading)
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
        <LoadingSpinner />
      </div>
    );
  if (!opportunity) return null;

  return (
    <>
      <Link
        to="/opportunities"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to opportunities
      </Link>
      <PageHeader
        eyebrow={opportunity.category}
        title={opportunity.title}
        description={opportunity.organization_name}
        actions={<Badge status={opportunity.status} />}
      />

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-white/5 dark:bg-slate-900/80">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
            {opportunity.description}
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              {opportunity.is_remote ? 'Remote' : opportunity.location || 'Location pending'}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {new Date(opportunity.start_date).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              {opportunity.approved_count}/{opportunity.capacity || '∞'} approved
            </span>
          </div>
        </div>

        {user.role === 'volunteer' ? (
          <form
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80"
            onSubmit={apply}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Apply</h3>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 min-h-32 resize-none"
              placeholder="Add a note for the organization"
              value={message}
              onChange={event => setMessage(event.target.value)}
            />
            <Button variant="primary" className="w-full mt-4">
              Submit application
            </Button>
          </form>
        ) : (
          <div>
            <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
              Applications
            </h3>
            <DataTable
              rows={applications}
              columns={[
                { key: 'volunteer_name', label: 'Volunteer' },
                { key: 'volunteer_email', label: 'Email' },
                { key: 'status', label: 'Status', render: row => <Badge status={row.status} /> },
              ]}
              emptyTitle="No applications yet"
            />
          </div>
        )}
      </section>
    </>
  );
}
