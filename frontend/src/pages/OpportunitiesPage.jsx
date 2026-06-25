import { ChevronDown, Filter, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader.jsx';
import OpportunityCard from '../components/OpportunityCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { getApiErrorMessage } from '../services/api.js';
import { opportunityService } from '../services/resources.js';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import LocationPicker from '../components/LocationPicker.jsx';

const CATEGORIES = [
  'Community',
  'Education',
  'Health',
  'Environment',
  'Technology',
  'Arts',
  'Sports',
];
const initialForm = {
  title: '',
  description: '',
  category: 'Community',
  location: '',
  is_remote: false,
  start_date: '',
  end_date: '',
  capacity: '',
  hours_estimate: '',
  required_skills: '',
};

function CreateModal({ onClose, onSave }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        hours_estimate: form.hours_estimate ? Number(form.hours_estimate) : 0,
        end_date: form.end_date || null,
        required_skills: form.required_skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create Opportunity"
      subtitle="Fill in the details below"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Title *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              placeholder="Opportunity title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category *
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
              Start Date *
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              End Date
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="date"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Capacity
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="number"
              placeholder="Max participants"
              value={form.capacity}
              onChange={e => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hours Estimate
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              type="number"
              placeholder="Expected hours"
              value={form.hours_estimate}
              onChange={e => setForm({ ...form, hours_estimate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Required Skills
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              placeholder="React, Teaching, First Aid..."
              value={form.required_skills}
              onChange={e => setForm({ ...form, required_skills: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description *
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 min-h-28 resize-none"
            placeholder="Describe the opportunity..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_remote}
              onChange={e => setForm({ ...form, is_remote: e.target.checked })}
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors duration-200 ${form.is_remote ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            />
            <div
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_remote ? 'translate-x-4' : ''}`}
            />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Remote opportunity
          </span>
        </label>
        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" loading={submitting}>
            Create Opportunity
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    search: initialSearch,
    category: '',
    location: '',
    remote: '',
  });

  // Keep filters in sync if URL search param changes
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== filters.search) {
      setFilters(c => ({ ...c, search: s }));
    }
  }, [searchParams]);
  const debouncedSearch = useDebounce(filters.search);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: filters.category || undefined,
      location: filters.location || undefined,
      remote: filters.remote || undefined,
      limit: 24,
    }),
    [debouncedSearch, filters.category, filters.location, filters.remote]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await opportunityService.list(params);
      setOpportunities(response.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load opportunities'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const createOpportunity = async data => {
    try {
      await opportunityService.create(data);
      toast.success('Opportunity created!');
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create opportunity'));
      throw error;
    }
  };

  const apply = async id => {
    try {
      await opportunityService.apply(id, {
        message: 'I am interested in helping with this opportunity.',
      });
      toast.success('Application submitted!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not apply'));
    }
  };

  const activeFilters = [filters.category, filters.location, filters.remote].filter(Boolean).length;

  return (
    <>
      <PageHeader
        eyebrow="Opportunity Management"
        title="Volunteer Opportunities"
        description="Discover and apply for meaningful volunteer work. Filter by location, category, and time commitment."
        actions={
          ['organization', 'admin'].includes(user.role) ? (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Opportunity
            </Button>
          ) : null
        }
      />

      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card dark:border-white/5 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
              placeholder="Search opportunities..."
              value={filters.search}
              onChange={e => setFilters(c => ({ ...c, search: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {['', ...CATEGORIES.slice(0, 4)].map(cat => (
              <button
                key={cat || 'all'}
                onClick={() => setFilters(c => ({ ...c, category: cat }))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${filters.category === cat ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow-glow-sm' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {cat || 'All'}
              </button>
            ))}
            <div className="w-48">
              <LocationPicker
                value={filters.location}
                onChange={v => setFilters(c => ({ ...c, location: v }))}
                placeholder="Any location..."
                className="[&>button]:h-8 [&>button]:py-1.5 [&>button]:rounded-xl [&>button]:border-slate-200 dark:[&>button]:border-slate-700/60 dark:[&>button]:bg-slate-800/80 [&>button]:shadow-sm"
              />
            </div>
            <select
              className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm hover:border-slate-300 focus:border-primary-500 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 h-8 w-auto min-w-24"
              value={filters.remote}
              onChange={e => setFilters(c => ({ ...c, remote: e.target.value }))}
            >
              <option value="">Any format</option>
              <option value="false">On-site</option>
              <option value="true">Remote</option>
            </select>
          </div>
        </div>
        {activeFilters > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
            </span>
            <button
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
              onClick={() =>
                setFilters({ search: filters.search, category: '', location: '', remote: '' })
              }
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : opportunities.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opp, i) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              index={i}
              action={
                user.role === 'volunteer' ? (
                  <Button variant="primary" className="w-full" onClick={() => apply(opp.id)}>
                    Apply Now
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching opportunities"
          description="Try adjusting your filters or create a new opportunity."
        />
      )}

      <AnimatePresence>
        {showForm && <CreateModal onClose={() => setShowForm(false)} onSave={createOpportunity} />}
      </AnimatePresence>
    </>
  );
}
