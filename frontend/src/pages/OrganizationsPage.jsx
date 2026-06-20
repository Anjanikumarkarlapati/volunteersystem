import { Building2, CheckCircle2, MapPin, ShieldCheck, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { adminService } from '../services/resources.js';
import Button from '../components/ui/Button.jsx';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.organizations({ limit: 100 });
      setOrganizations(data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load organizations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (id, verified) => {
    try {
      await adminService.verifyOrganization(id, verified);
      toast.success(verified ? '✅ Organization verified' : 'Verification removed');
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update organization'));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Manage Organizations"
        description="Review organization profiles, city info, and grant or revoke verification status."
      />
      <DataTable
        rows={organizations}
        loading={loading}
        emptyTitle="No organizations found"
        columns={[
          {
            key: 'name',
            label: 'Organization',
            render: row => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-400 text-xs font-bold text-white">
                  {(row.name || 'O')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-400">ID: {row.id}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'city',
            label: 'Location',
            render: row =>
              row.city ? (
                <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {row.city}
                  {row.state ? `, ${row.state}` : ''}
                </span>
              ) : (
                '—'
              ),
          },
          {
            key: 'opportunity_count',
            label: 'Opportunities',
            render: row => (
              <span className="font-bold text-slate-900 dark:text-white">
                {row.opportunity_count || 0}
              </span>
            ),
          },
          {
            key: 'verified',
            label: 'Status',
            render: row => (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${row.verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}
              >
                {row.verified ? (
                  <>
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </>
                ) : (
                  '⏳ Pending'
                )}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: row => (
              <Button
                variant={row.verified ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => verify(row.id, !row.verified)}
                className={
                  row.verified
                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 border-rose-200'
                    : ''
                }
              >
                {row.verified ? (
                  <>
                    <XCircle className="h-3.5 w-3.5" /> Revoke
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                  </>
                )}
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
