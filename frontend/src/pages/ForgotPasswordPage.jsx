import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Reset link sent!');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#faf9f5]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-outline-variant">
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-semibold text-on-surface-variant hover:text-[#1b1c1a] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
        </Link>
        <h2 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Forgot Password?</h2>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mt-6">
            <p className="text-sm">
              If an account exists with <strong>{email}</strong>, we have generated a reset link for
              it. (Check the backend server console for the link in this demo environment).
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant mb-6">
              Enter the email address associated with your account and we'll send you a link to
              reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b1c1a] px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all disabled:opacity-60 uppercase tracking-widest"
              >
                {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
