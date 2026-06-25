import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api, getApiErrorMessage } from '../services/api.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#faf9f5]">
        <div className="w-full max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="mb-6 text-on-surface-variant">
            The password reset link is invalid or missing.
          </p>
          <Link to="/forgot-password" className="text-blue-600 hover:underline font-semibold">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#faf9f5]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-outline-variant">
        <h2 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">
          Create New Password
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Your new password must be at least 8 characters long.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface mb-2">
              New Password
            </label>
            <div className="flex rounded-xl border border-outline-variant bg-white transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <input
                className="w-full rounded-l-xl bg-transparent px-4 py-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
              <button
                type="button"
                className="grid w-12 place-items-center rounded-r-xl text-on-surface-variant transition hover:text-on-surface"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b1c1a] px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all disabled:opacity-60 uppercase tracking-widest"
          >
            {loading ? 'Resetting...' : 'Reset Password'} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
