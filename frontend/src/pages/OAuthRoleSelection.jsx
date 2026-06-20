import { HeartHandshake } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import LocationPicker from '../components/LocationPicker.jsx';

export default function OAuthRoleSelection() {
  const { user, completeGoogleRegistration } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tempToken = searchParams.get('token');

  const [role, setRole] = useState('volunteer');
  const [orgName, setOrgName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  if (!tempToken) return <Navigate to="/login" replace />;

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      const extra = role === 'organization' ? { organizationName: orgName } : { location };
      await completeGoogleRegistration(tempToken, role, extra);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-page-bg font-sans text-text antialiased">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white shadow-sm">
            <HeartHandshake className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">Complete your account</h1>
            <p className="text-xs text-muted">Choose how you want to use Volunteer Hub</p>
          </div>
        </div>

        <div className="rounded-[40px] border border-line/20 bg-white-card shadow-xl">
          <form onSubmit={submit}>
            <div className="p-6 sm:p-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-bold text-text">I want to join as…</h2>
                <p className="text-xs text-muted mt-1">Select your primary role</p>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                {['volunteer', 'organization'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`flex flex-col items-center gap-2 rounded-[28px] border-2 p-5 text-center transition-all duration-200 hover:scale-[1.02] ${role === option ? 'border-black bg-white-card shadow-sm' : 'border-line/30 bg-soft-card-2'}`}
                  >
                    <span className="text-3xl">{option === 'volunteer' ? '🙋' : '🏢'}</span>
                    <span
                      className={`text-sm font-bold capitalize ${role === option ? 'text-text' : 'text-muted'}`}
                    >
                      {option}
                    </span>
                    <span className="text-[11px] text-muted leading-tight">
                      {option === 'volunteer'
                        ? 'Find & join opportunities'
                        : 'Post & manage opportunities'}
                    </span>
                  </button>
                ))}
              </div>

              {role === 'volunteer' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Location
                  </label>
                  <LocationPicker
                    value={location}
                    onChange={setLocation}
                    placeholder="Select state & district…"
                  />
                </div>
              )}

              {role === 'organization' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Organization Name *
                  </label>
                  <input
                    className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                    placeholder="Green Future Org"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="border-t border-line/20 p-5">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-page-bg hover:bg-black/90 transition-all disabled:cursor-not-allowed disabled:opacity-60 h-11"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{' '}
                    Creating account…
                  </span>
                ) : (
                  '🎉 Complete registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
