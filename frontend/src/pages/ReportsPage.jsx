import {
  BarChart3,
  Download,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  Users,
  AlertTriangle,
} from 'lucide-react';
import Badge from '../components/StatusBadge.jsx';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { reportService } from '../services/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

function BarChart({ items = [] }) {
  const max = Math.max(...items.map(i => Number(i.count || i.value || 0)), 1);
  const gradients = [
    'from-primary-500 to-violet-500',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-pink-400',
    'from-cyan-500 to-blue-400',
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const val = Number(item.count || item.value || 0);
        const lbl = item.status || item.category || item.label || item.month || `Item ${i + 1}`;
        return (
          <div key={i}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium capitalize text-slate-600 dark:text-slate-300">
                {lbl}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{val}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${gradients[i % gradients.length]}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max((val / max) * 100, 3)}%` }}
                transition={{ duration: 0.65, delay: i * 0.05, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data =
        user.role === 'admin'
          ? await reportService.platform()
          : user.role === 'volunteer'
            ? await reportService.volunteer()
            : await reportService.organization();
      setReport(data);
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Could not load reports');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.role]);

  // Calculations for Admin platform reports
  const adminTotalHours =
    report?.monthly_hours?.reduce((sum, h) => sum + Number(h.hours || 0), 0) || 0;
  const adminTotalApps =
    report?.monthly_applications?.reduce((sum, a) => sum + Number(a.applications || 0), 0) || 0;
  const adminTopOrg = report?.top_organizations?.[0];
  const adminTopOrgText = adminTopOrg
    ? `${adminTopOrg.name} (${Number(adminTopOrg.hours || 0).toFixed(0)} hrs)`
    : 'N/A';

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Reports & Insights"
        description="Detailed analytics on volunteer activity, application trends, and platform health."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Export / Print
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 space-y-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load reports"
          description={`Reason: ${errorMsg}`}
          action={
            <Button onClick={load} variant="primary">
              Retry
            </Button>
          }
        />
      ) : !report ? (
        <EmptyState
          icon={BarChart3}
          title="No report data"
          description="Data will appear once there is platform activity."
        />
      ) : (
        <div className="space-y-6">
          {/* Volunteer Reports Dashboard View */}
          {user.role === 'volunteer' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={CheckCircle2}
                  label="Completed Tasks"
                  value={report.completed_tasks ?? 0}
                  tone="emerald"
                  index={0}
                />
                <StatCard
                  icon={Clock}
                  label="Remaining Tasks"
                  value={report.remaining_tasks ?? 0}
                  tone="amber"
                  index={1}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Hours Contributed"
                  value={`${Number(report.total_hours || 0).toFixed(1)} hrs`}
                  tone="violet"
                  index={2}
                />
                <StatCard
                  icon={Sparkles}
                  label="Certificates Earned"
                  value={report.certificates_count ?? 0}
                  tone="blue"
                  index={3}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {report.hours_by_month?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Monthly Hours Breakdown
                    </h3>
                    <BarChart
                      items={report.hours_by_month.map(h => ({
                        month: new Date(h.month).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        }),
                        value: h.hours,
                      }))}
                    />
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                    Task Progress Overview
                  </h3>
                  <BarChart
                    items={[
                      { label: 'Completed Tasks', value: report.completed_tasks ?? 0 },
                      { label: 'Remaining Tasks', value: report.remaining_tasks ?? 0 },
                    ]}
                  />
                </div>

                {report.recent_activity?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {report.recent_activity.map((act, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/5 p-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {act.event_title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {act.start_at ? new Date(act.start_at).toLocaleDateString() : ''}{' '}
                              &middot; {act.organization_name}
                            </p>
                          </div>
                          <Badge status={act.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* Admin / Platform Reports Dashboard View */}
          {user.role === 'admin' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={TrendingUp}
                  label="Total Hours Contributed"
                  value={`${adminTotalHours.toFixed(1)} hrs`}
                  tone="violet"
                  index={0}
                />
                <StatCard
                  icon={BarChart3}
                  label="Total Applications"
                  value={adminTotalApps}
                  tone="amber"
                  index={1}
                />
                <StatCard
                  icon={Building2}
                  label="Top Organization"
                  value={adminTopOrgText}
                  tone="emerald"
                  index={2}
                />
                <StatCard
                  icon={Users}
                  label="Active Organizations"
                  value={report.top_organizations?.length || 0}
                  tone="blue"
                  index={3}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {report.monthly_hours?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Monthly Hours Contributed
                    </h3>
                    <BarChart
                      items={report.monthly_hours.map(h => ({
                        month: new Date(h.month).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        }),
                        value: h.hours,
                      }))}
                    />
                  </div>
                ) : null}

                {report.monthly_applications?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Monthly Application Volume
                    </h3>
                    <BarChart
                      items={report.monthly_applications.map(a => ({
                        month: new Date(a.month).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        }),
                        value: a.applications,
                      }))}
                    />
                  </div>
                ) : null}

                {report.top_organizations?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80 lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Top Organizations by Volunteer Service
                    </h3>
                    <BarChart
                      items={report.top_organizations.map(o => ({
                        label: o.name,
                        value: o.hours,
                      }))}
                    />
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* Organization Reports Dashboard View */}
          {user.role === 'organization' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={TrendingUp}
                  label="Total Events"
                  value={report.summary?.events || 0}
                  tone="blue"
                  index={0}
                />
                <StatCard
                  icon={BarChart3}
                  label="Opportunities"
                  value={report.summary?.opportunities || 0}
                  tone="emerald"
                  index={1}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Applications Received"
                  value={report.summary?.applications || 0}
                  tone="amber"
                  index={2}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Hours Contributed"
                  value={`${Number(report.hours?.hours_completed || 0).toFixed(0)} hrs`}
                  tone="violet"
                  index={3}
                />
              </div>

              {report.tasks && (
                <>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                    Task Overview
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      icon={CheckCircle2}
                      label="Completed Tasks"
                      value={report.tasks.completed || 0}
                      tone="emerald"
                      index={0}
                    />
                    <StatCard
                      icon={Clock}
                      label="Remaining Tasks"
                      value={report.tasks.remaining || 0}
                      tone="amber"
                      index={1}
                    />
                  </div>
                </>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                {report.application_statuses?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Application Status Breakdown
                    </h3>
                    <BarChart items={report.application_statuses} />
                  </div>
                ) : null}
                {report.event_statuses?.length ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-white/5 dark:bg-slate-900/80">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Event Status Breakdown
                    </h3>
                    <BarChart items={report.event_statuses} />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
