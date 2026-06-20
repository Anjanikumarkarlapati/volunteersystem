import { Compass, Loader2, MapPin, Navigation, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import OpportunityCard from '../components/OpportunityCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getApiErrorMessage } from '../services/api.js';
import { opportunityService } from '../services/resources.js';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';

const CATEGORIES = [
  '',
  'Community',
  'Education',
  'Health',
  'Environment',
  'Technology',
  'Arts',
  'Sports',
];
const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

export default function DiscoverPage() {
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(5);
  const [category, setCategory] = useState('');
  const [maxHours, setMaxHours] = useState('');
  const [error, setError] = useState(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        toast.success('📍 Location detected!');
      },
      err => {
        setGeoLoading(false);
        setError('Location permission denied. Please allow location access.');
        toast.error('Location permission denied');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, []);

  const fetchNearby = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const result = await opportunityService.nearby({
        lat: coords.lat,
        lng: coords.lng,
        radius_km: radius,
        category: category || undefined,
        max_hours: maxHours || undefined,
      });
      setOpportunities(result.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not load nearby opportunities'));
    } finally {
      setLoading(false);
    }
  }, [coords, radius, category, maxHours]);

  useEffect(() => {
    if (coords) fetchNearby();
  }, [coords, radius, category, maxHours]);

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Hyperlocal Opportunities"
        description="Find volunteer opportunities within your chosen radius. Sorted by proximity, urgency, and cause category."
      />

      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-violet-700 p-6 shadow-glow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-5 w-5 text-primary-200" />
              <p className="text-sm font-bold text-primary-100">Your Location</p>
            </div>
            {coords ? (
              <p className="text-white font-semibold text-sm">
                📍 {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
              </p>
            ) : (
              <p className="text-primary-200 text-sm">
                Enable location to see opportunities near you
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            className="h-11 px-5 font-bold shrink-0 bg-white text-primary-700 hover:bg-primary-50"
            loading={geoLoading}
            onClick={locate}
          >
            <Navigation className="h-4 w-4" />
            {geoLoading ? 'Detecting…' : coords ? 'Update Location' : 'Enable Location'}
          </Button>
        </div>
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=white fill-rule=evenodd%3E%3Ccircle cx=5 cy=5 r=2/%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      {coords && (
        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card dark:border-white/5 dark:bg-slate-900/80">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Radius</p>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${radius === r ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow-glow-sm' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Category
            </p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat || 'all'}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${category === cat ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow-glow-sm' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Max Hours
            </p>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 h-9 w-24 text-xs"
              type="number"
              placeholder="Any"
              value={maxHours}
              onChange={e => setMaxHours(e.target.value)}
              min={0}
            />
          </div>
        </div>
      )}

      {!coords && !geoLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-slate-200/80 bg-white/50 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20">
            <Compass className="h-8 w-8 text-primary-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Enable your location
          </h3>
          <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Click "Enable Location" above to discover volunteer opportunities within {radius} km of
            you.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['🌿 Environment', '📚 Education', '🏥 Health', '💻 Technology'].map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {geoLoading && <LoadingSpinner text="Detecting your location…" />}

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {coords && !loading && (
        <>
          {opportunities.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {opportunities.length} opportunities within {radius} km
              </p>
            </div>
          )}
          {opportunities.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((opp, i) => (
                <OpportunityCard key={opp.id} opportunity={opp} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title="No opportunities found nearby"
              description={`No open opportunities within ${radius} km${category ? ` in ${category}` : ''}. Try increasing your search radius.`}
            />
          )}
        </>
      )}
    </>
  );
}
