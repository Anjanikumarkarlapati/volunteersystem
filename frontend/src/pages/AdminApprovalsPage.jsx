import { Building2, Calendar, CheckCircle2, Clock, XCircle, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { adminService } from '../services/resources.js';

export default function AdminApprovalsPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await adminService.pendingOpportunities();
      setOpportunities(data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to fetch pending opportunities'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleStatusChange = async (id, status) => {
    setProcessingId(id);
    try {
      await adminService.changeOpportunityStatus(id, status);
      toast.success(`Opportunity ${status === 'open' ? 'approved' : 'rejected'}`);
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update opportunity status'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin Actions"
        title="Pending Approvals"
        description="Review and approve volunteer opportunities created by organizations before they go live."
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : opportunities.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-12 text-center dark:border-white/5 dark:bg-slate-900/50">
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              There are no pending opportunities requiring approval.
            </p>
          </div>
        ) : (
          opportunities.map(opp => (
            <div
              key={opp.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {opp.title}
                    </h3>
                    <Badge variant="warning">Pending Review</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {opp.organization_name}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(opp.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {opp.is_remote ? 'Remote' : opp.location || 'TBD'}
                    </span>
                    {opp.hours_estimate > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {opp.hours_estimate} hrs est.
                      </span>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                    <span className="font-semibold block mb-1">Description:</span>
                    <p className="line-clamp-3">{opp.description}</p>
                  </div>

                  {opp.required_skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {opp.required_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col gap-2 pt-2 sm:pt-0 shrink-0">
                  <Button
                    variant="primary"
                    className="flex-1 sm:w-full justify-center"
                    loading={processingId === opp.id}
                    onClick={() => handleStatusChange(opp.id, 'open')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 sm:w-full justify-center"
                    loading={processingId === opp.id}
                    disabled={processingId === opp.id}
                    onClick={() => handleStatusChange(opp.id, 'cancelled')}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
