import { Eye, EyeOff, HeartHandshake, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import Modal from '../components/ui/Modal.jsx';

const MOCK_OPPORTUNITIES = [
  {
    title: 'Community Food Drive Coordinator',
    org: 'HopeWorks',
    desc: 'Help organize food donations and distribute packages to families in need.',
    hours: '4 hrs/week',
    location: 'Community Center',
  },
  {
    title: 'Urban Forestry Tree Planting',
    org: 'GreenFuture',
    desc: 'Join us for our weekend greening project planting native trees across the park systems.',
    hours: '6 hrs (Sat)',
    location: 'Central Park',
  },
  {
    title: 'Digital Literacy Tutor',
    org: 'SkillShare',
    desc: 'Teach senior citizens basic computer skills, emails, and how to stay safe online.',
    hours: '2 hrs/week',
    location: 'Local Library',
  },
];

const MOCK_EVENTS = [
  {
    title: 'Summer Park Clean-up Day',
    time: 'Saturday, July 11 at 9:00 AM',
    location: 'Oakwood Nature Reserve',
    squads: '3 squads attending',
  },
  {
    title: 'Homeless Shelter Soup Kitchen Prep',
    time: 'Wednesday, July 15 at 4:30 PM',
    location: 'Downtown Shelter',
    squads: '2 squads attending',
  },
  {
    title: 'Youth Mentorship Kick-off Meetup',
    time: 'Friday, July 17 at 6:00 PM',
    location: 'Youth Community Center',
    squads: '1 squad attending',
  },
];

const STATS = [
  { value: '2.4k+', label: 'Volunteer hours' },
  { value: '128', label: 'Active events' },
  { value: '34', label: 'Partner NGOs' },
];

export default function LoginPage() {
  const { login, user, googleLogin, completeGoogleRegistration, linkGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [demoType, setDemoType] = useState(null);
  const [linkData, setLinkData] = useState(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async credentialResponse => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      if (data.needsLinking) {
        setLinkData({ idToken: credentialResponse.credential, email: data.email });
        return;
      }
      if (data.needsRoleSelection) {
        navigate(`/oauth/role-selection?token=${data.tempToken}`, { replace: true });
        return;
      }
      toast.success('Welcome back!');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Google sign-in failed'));
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in failed. Please try again.');
  };

  const handleLinkAccount = async () => {
    if (!linkPassword) {
      toast.error('Please enter your password');
      return;
    }
    setLinkLoading(true);
    try {
      await linkGoogle(linkData.idToken, linkData.email, linkPassword);
      setLinkData(null);
      setLinkPassword('');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to link account'));
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{ backgroundColor: '#faf9f5', color: '#1b1c1a' }}
    >
      {/* Subtle ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-surface-container rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
        <div
          className="absolute bottom-[10%] right-[15%] w-96 h-96 bg-surface-container-high rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Top nav bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 border-b border-outline-variant backdrop-blur-md"
        style={{ backgroundColor: 'rgba(250,249,245,0.95)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1b1c1a] rounded-xl flex items-center justify-center">
            <HeartHandshake className="h-5 w-5 text-white" />
          </div>
          <span
            className="font-bold text-on-surface tracking-tight"
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '18px' }}
          >
            Volunteer Hub
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {['Opportunities', 'Events', 'About'].map(item => (
            <a
              key={item}
              href="#signin"
              onClick={e => {
                if (item === 'Opportunities') {
                  e.preventDefault();
                  setDemoType('opportunities');
                }
                if (item === 'Events') {
                  e.preventDefault();
                  setDemoType('events');
                }
              }}
              className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>
        <a
          href="#signin"
          className="flex items-center gap-1.5 bg-[#1b1c1a] text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-all"
        >
          Sign In <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </header>

      <main className="pt-16">
        {/* Hero section */}
        <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto flex max-w-4xl flex-col items-center text-center"
          >
            <h1
              className="max-w-4xl font-black leading-tight tracking-tighter text-on-surface text-balance"
              style={{
                fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                fontSize: 'clamp(42px, 8vw, 82px)',
                letterSpacing: '-0.02em',
              }}
            >
              The platform for modern volunteer work
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-on-surface-variant leading-relaxed">
              Connect with organizations that need you. Track your impact with a platform built for
              real change.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#signin"
                className="flex items-center gap-2 bg-[#1b1c1a] text-white text-sm font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all shadow-sm hover:shadow-md"
              >
                Find Opportunities <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#signin"
                className="flex items-center gap-2 bg-surface-container text-on-surface border border-outline-variant text-sm font-semibold px-8 py-4 rounded-full hover:bg-surface-container-high transition-all shadow-sm"
              >
                Sign In
              </a>
            </div>
          </motion.div>

          {/* Dark banner */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="relative mt-14 overflow-hidden rounded-[40px] px-6 py-24 text-center shadow-2xl sm:py-32"
            style={{ background: '#1b1c1a' }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='5' cy='5' r='2'/%3E%3Ccircle cx='25' cy='25' r='2'/%3E%3Ccircle cx='45' cy='45' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative mx-auto flex min-h-[120px] items-center justify-center">
              <p
                className="font-black leading-tight tracking-tighter text-white"
                style={{
                  fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                  fontSize: 'clamp(42px, 8vw, 82px)',
                  letterSpacing: '-0.02em',
                }}
              >
                Volunteer Hub
              </p>
            </div>
          </motion.div>
        </section>

        {/* Sign-in section */}
        <section id="signin" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-12 border-t border-outline-variant pt-14 lg:grid-cols-[1fr_440px] lg:items-start">
            {/* Left: social proof */}
            <div>
              <div className="grid gap-4 sm:grid-cols-3">
                {STATS.map(stat => (
                  <div key={stat.label} className="white-card p-6">
                    <p className="text-3xl font-black tracking-tight text-on-surface">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: login form */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="rounded-[32px] border border-outline-variant bg-surface-container-lowest p-8 shadow-elevated sm:p-10"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                Account Access
              </p>
              <h2
                className="mt-3 font-bold tracking-tight text-on-surface"
                style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', fontSize: '28px' }}
              >
                Sign in
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
                Use your account or select a demo profile to enter the volunteer portal.
              </p>

              <form className="mt-8 space-y-5" onSubmit={submit}>
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface">
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20"
                    type="email"
                    value={form.email}
                    onChange={event => setForm({ ...form, email: event.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-bold tracking-wide text-on-surface-variant hover:text-[#1b1c1a] transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="flex rounded-xl border border-outline-variant bg-surface-container-low transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <input
                      className="w-full rounded-l-xl bg-transparent px-4 py-3.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={event => setForm({ ...form, password: event.target.value })}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="grid w-12 place-items-center rounded-r-xl text-on-surface-variant transition hover:text-on-surface"
                      onClick={() => setShowPass(value => !value)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b1c1a] px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 tracking-widest uppercase"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign In <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Google sign-in */}
              <div className="mt-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              {/* Register link */}
              <p className="mt-8 text-center text-sm text-on-surface-variant">
                New here?{' '}
                <Link
                  className="font-bold text-on-surface underline underline-offset-4 hover:text-primary transition-colors"
                  to="/register"
                >
                  Create an account
                </Link>
              </p>

              {/* Linking modal */}
              {linkData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-sm rounded-[32px] border border-outline-variant bg-surface-container-lowest p-6 shadow-elevated">
                    <h3 className="text-lg font-bold text-on-surface">Link Google account?</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      An account with <strong>{linkData.email}</strong> already exists. Enter your
                      password to link this Google account.
                    </p>
                    <input
                      className="mt-4 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20"
                      type="password"
                      placeholder="Enter your password"
                      value={linkPassword}
                      onChange={e => setLinkPassword(e.target.value)}
                    />
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          setLinkData(null);
                          setLinkPassword('');
                        }}
                        className="flex-1 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLinkAccount}
                        disabled={linkLoading}
                        className="flex-1 rounded-xl bg-[#1b1c1a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
                      >
                        {linkLoading ? 'Linking...' : 'Link & Sign In'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="mt-16 pt-20 pb-12 px-6 rounded-t-[64px] relative z-20 sm:px-12"
        style={{ backgroundColor: '#1b1c1a' }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
              <HeartHandshake className="h-6 w-6 text-white" />
            </div>
            <h2
              className="mt-6 font-black tracking-tighter uppercase text-white"
              style={{
                fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                fontSize: 'clamp(28px, 5vw, 48px)',
              }}
            >
              Volunteer Hub
            </h2>
            <p className="mt-4 text-white/50 max-w-sm text-sm">
              Connecting volunteers with the causes that matter. Empowering focus through
              intelligent management.
            </p>
          </div>

          <div className="mt-16 border-t border-white/10 pt-16 flex flex-col items-center">
            {[['Platform', 'Opportunities', 'Events']].map(([heading, ...links]) => (
              <div key={heading} className="text-center">
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4 font-semibold">
                  {heading}
                </h3>
                <ul className="flex flex-wrap gap-x-8 gap-y-2 justify-center">
                  {links.map(link => (
                    <li key={link}>
                      <a
                        href="#signin"
                        onClick={e => {
                          if (link === 'Opportunities') {
                            e.preventDefault();
                            setDemoType('opportunities');
                          }
                          if (link === 'Events') {
                            e.preventDefault();
                            setDemoType('events');
                          }
                        }}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 Volunteer Hub. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                aria-hidden="true"
              />
              All Systems Operational
            </p>
          </div>
        </div>
      </footer>

      <Modal
        open={!!demoType}
        onClose={() => setDemoType(null)}
        title={
          demoType === 'opportunities' ? 'Demo Volunteer Opportunities' : 'Demo Upcoming Events'
        }
        subtitle={`Preview of active ${demoType} in the portal. Sign in to view details and apply.`}
      >
        <div className="space-y-4">
          {demoType === 'opportunities' ? (
            <div className="space-y-3.5">
              {MOCK_OPPORTUNITIES.map(opp => (
                <div
                  key={opp.title}
                  className="p-4 rounded-2xl border border-outline-variant bg-surface-container-low"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-on-surface text-sm">{opp.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant shrink-0">
                      {opp.hours}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-primary mt-1">{opp.org}</p>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{opp.desc}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-on-surface-variant/80">
                      📍 {opp.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {MOCK_EVENTS.map(event => (
                <div
                  key={event.title}
                  className="p-4 rounded-2xl border border-outline-variant bg-surface-container-low"
                >
                  <h4 className="font-bold text-on-surface text-sm">{event.title}</h4>
                  <p className="text-xs font-bold text-primary mt-1">🗓️ {event.time}</p>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>📍 {event.location}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant">
                      👥 {event.squads}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 border-t border-outline-variant pt-4">
            <button
              onClick={() => setDemoType(null)}
              className="px-5 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low text-xs font-semibold text-on-surface transition-all"
            >
              Close
            </button>
            <a
              href="#signin"
              onClick={() => {
                setDemoType(null);
                const el = document.getElementById('signin');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-[#1b1c1a] text-white hover:opacity-90 text-xs font-semibold uppercase tracking-wider transition-all text-center"
            >
              Sign In to Access
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
