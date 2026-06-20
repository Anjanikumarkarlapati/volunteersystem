import {
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  GraduationCap,
  HeartHandshake,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../services/api.js';
import LocationPicker from '../components/LocationPicker.jsx';

const VOLUNTEER_TYPES = [
  {
    value: 'student',
    label: 'Student',
    Icon: GraduationCap,
    color: 'from-violet-500 to-purple-400',
    desc: 'Undergraduate / Graduate',
  },
  {
    value: 'professor',
    label: 'Educator',
    Icon: BookOpen,
    color: 'from-blue-500 to-indigo-400',
    desc: 'Professor / Teacher',
  },
  {
    value: 'ngo_developer',
    label: 'NGO Developer',
    Icon: Code2,
    color: 'from-emerald-500 to-teal-400',
    desc: 'Tech for nonprofits',
  },
  {
    value: 'ngo_staff',
    label: 'NGO Staff',
    Icon: Users,
    color: 'from-amber-500 to-orange-400',
    desc: 'Nonprofit worker',
  },
  {
    value: 'professional',
    label: 'Professional',
    Icon: Briefcase,
    color: 'from-rose-500 to-pink-400',
    desc: 'Corporate volunteer',
  },
  {
    value: 'other',
    label: 'Other',
    Icon: User,
    color: 'from-slate-500 to-slate-400',
    desc: 'General volunteer',
  },
];

const STEPS = ['Role', 'Details', 'Credentials'];

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('volunteer');
  const [volunteerType, setVolunteerType] = useState('');
  const [form, setForm] = useState({
    name: '',
    organizationName: '',
    email: '',
    password: '',
    location: '',
    city: '',
    state: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role, volunteer_type: volunteerType || undefined });
      setDone(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-page-bg font-sans text-text antialiased">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-text">Account created!</h1>
          <p className="mt-3 text-muted text-sm">
            Welcome to Volunteer Hub. Redirecting you to dashboard…
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1.5 w-24 rounded-full bg-line/40 overflow-hidden">
              <motion.div
                className="h-full bg-black rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
              />
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-page-bg font-sans text-text antialiased relative overflow-hidden">
      <div className="relative w-full max-w-xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white shadow-sm">
            <HeartHandshake className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">Create your account</h1>
            <p className="text-xs text-muted">Join the Volunteer Hub community</p>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${i < step ? 'bg-black text-page-bg' : i === step ? 'bg-black/10 text-black ring-1 ring-black/20' : 'bg-soft-card text-muted'}`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-black font-bold' : 'text-muted'}`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${i < step ? 'bg-black' : 'bg-line/40'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-[40px] border border-line/20 bg-white-card shadow-xl">
          <form onSubmit={submit}>
            <div className="p-6 sm:p-8 min-h-[360px]">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-bold text-text">I want to join as…</h2>
                      <p className="text-xs text-muted mt-1">
                        Select your primary role on Volunteer Hub
                      </p>
                    </div>
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
                      <div className="pt-2">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                          Volunteer type (optional)
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {VOLUNTEER_TYPES.map(({ value, label, Icon, color }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setVolunteerType(v => (v === value ? '' : value))}
                              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all duration-200 hover:scale-[1.03] ${volunteerType === value ? 'border-black bg-white-card shadow-sm' : 'border-line/30 bg-soft-card-2'}`}
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span
                                className={`text-[11px] font-bold ${volunteerType === value ? 'text-text' : 'text-muted'}`}
                              >
                                {label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold text-text">Your details</h2>
                      <p className="text-xs text-muted mt-1">Tell us a bit about yourself</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                        {role === 'organization' ? 'Contact Name' : 'Full Name'} *
                      </label>
                      <input
                        id="register-name"
                        className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                        placeholder={role === 'organization' ? 'Jane Doe' : 'John Doe'}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    {role === 'organization' ? (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Organization Name *
                        </label>
                        <input
                          id="register-orgname"
                          className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                          placeholder="Green Future Org"
                          value={form.organizationName}
                          onChange={e => setForm({ ...form, organizationName: e.target.value })}
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                          Location
                        </label>
                        <LocationPicker
                          value={form.location}
                          onChange={v => setForm({ ...form, location: v })}
                          placeholder="Select state & district…"
                        />
                      </div>
                    )}
                    {role === 'organization' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                            City
                          </label>
                          <input
                            id="register-city"
                            className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                            placeholder="Mumbai"
                            value={form.city}
                            onChange={e => setForm({ ...form, city: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                            State
                          </label>
                          <input
                            id="register-state"
                            className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                            placeholder="Maharashtra"
                            value={form.state}
                            onChange={e => setForm({ ...form, state: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold text-text">Account credentials</h2>
                      <p className="text-xs text-muted mt-1">Set up your login details</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                        Email address *
                      </label>
                      <input
                        id="register-email"
                        className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                        Password *
                      </label>
                      <input
                        id="register-password"
                        className="w-full rounded-2xl border border-line/40 bg-soft-card-2 px-4 py-2.5 text-sm text-text outline-none transition placeholder:text-muted-light focus:border-black focus:ring-4 focus:ring-black/5"
                        type="password"
                        placeholder="Min. 8 characters"
                        minLength={8}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="rounded-2xl bg-soft-card-2 border border-line/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                        Account summary
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted">Role:</span>
                          <span className="font-semibold text-text capitalize">{role}</span>
                        </div>
                        {form.name && (
                          <div className="flex justify-between">
                            <span className="text-muted">Name:</span>
                            <span className="font-semibold text-text">{form.name}</span>
                          </div>
                        )}
                        {volunteerType && (
                          <div className="flex justify-between">
                            <span className="text-muted">Type:</span>
                            <span className="font-semibold text-text capitalize">
                              {volunteerType.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="border-t border-line/20 p-5 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-text hover:bg-soft-card-2 transition-all"
                  onClick={() => setStep(s => Math.max(s - 1, 0))}
                >
                  ← Back
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-page-bg hover:bg-black/90 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setStep(s => Math.min(s + 1, 2))}
                  disabled={step === 1 && !form.name}
                >
                  Continue →
                </button>
              ) : (
                <button
                  id="register-submit"
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-bold text-page-bg hover:bg-black/90 transition-all disabled:cursor-not-allowed disabled:opacity-60 h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{' '}
                      Creating account…
                    </span>
                  ) : (
                    '🎉 Create account'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-text underline underline-offset-4 hover:text-black transition-colors"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}
