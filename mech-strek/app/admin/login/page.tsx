'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, setAuthToken } from '@/lib/api';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in query parameters (redirect from Google Callback)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (token) {
      setAuthToken(token);
      router.push('/admin');
    } else if (err) {
      if (err === 'not_registered') {
        setDenied(true);
      } else {
        setError('Google Sign-In failed.');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminLogin(email, password);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  if (denied) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111]/80 backdrop-blur-xl border border-red-500/20 shadow-2xl relative z-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-red-400">Admin Access Denied</h1>
          <p className="text-sm text-neutral-300 mt-4 leading-relaxed">
            Your Google Account is not registered or allowed to access the MechOS Admin Panel.
          </p>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            Only authorized administrator emails or domains (`@mechstrek.in`) can sign in here.
          </p>
          <div className="mt-8 space-y-3">
            <button
              onClick={() => {
                setDenied(false);
                setError(null);
                router.replace('/admin/login');
              }}
              className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              Back to Login
            </button>
            <a
              href="mailto:support@mechstrek.in"
              className="block w-full bg-[#181818] border border-white/10 hover:bg-[#222] text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              Contact IT Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#111] border border-[rgba(255,255,255,0.08)] shadow-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MechOS Portal Admin</h1>
          <p className="text-xs text-neutral-400 mt-1">Sign in to manage lead inquiries and studio CMS</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Sample Admin Credentials Box */}
        <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-2">
          <div className="font-semibold flex items-center justify-between">
            <span>🛡️ Sample Admin Test Account</span>
            <button
              type="button"
              onClick={() => { setEmail('admin@mechstrek.in'); setPassword('AdminPassword123!'); }}
              className="text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              Auto-Fill Test Account
            </button>
          </div>
          <div className="text-[11px] text-neutral-300 space-y-0.5 font-mono">
            <div>Email: <span className="text-white">admin@mechstrek.in</span></div>
            <div>Operator: <span className="text-neutral-400">MechStrek Founder</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mechstrek.in"
                className="w-full bg-[#181818] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#181818] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-white text-black hover:bg-neutral-200 font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!loading && <ArrowRight size={16} />}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-mono">
              <span className="bg-[#111] px-2.5 text-neutral-500">Or Access With</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
              window.location.href = `${apiBase}/auth/google/login?state=admin`;
            }}
            className="w-full bg-[#181818] border border-white/10 hover:bg-[#222] text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
