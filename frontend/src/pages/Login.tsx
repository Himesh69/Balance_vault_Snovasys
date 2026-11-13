import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../lib/api.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Panel } from '../components/ui/Panel.js';
import { Banner } from '../components/ui/Banner.js';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Rate-limit countdown timer if 429 occurs
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitSeconds && rateLimitSeconds > 0) return;

    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.token, data.user);
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Check for rate limit response
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setRateLimitSeconds(60);
      }
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@balancevault.com');
    setPassword('Admin@123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-start px-6 pt-[14vh] pb-12 items-center sm:items-start sm:pl-[12vw]">
      <div className="w-full max-w-[440px]">
        {/* Document Header Wordmark & Tagline */}
        <div className="mb-6 select-none text-left">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-ink flex-shrink-0"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="2" width="16" height="16" rx="1" />
              <line x1="2" y1="7.5" x2="18" y2="7.5" />
              <line x1="2" y1="13" x2="18" y2="13" />
            </svg>
            <span className="font-serif text-2xl font-semibold tracking-tight text-ink">
              BalanceVault
            </span>
          </div>
          <p className="font-serif italic text-base text-ink-soft">
            Money movement with a ledger you can prove.
          </p>
        </div>

        {/* Form Panel */}
        <Panel hasDocumentHeader className="shadow-none">
          <h1 className="font-serif text-xl font-medium text-ink mb-1">
            Sign In
          </h1>
          <p className="text-[13px] text-ink-soft mb-6">
            Enter your credentials to access your account ledger.
          </p>

          {/* Rate-limit Live Countdown Banner */}
          {rateLimitSeconds !== null && rateLimitSeconds > 0 && (
            <div className="mb-5">
              <Banner
                type="warning"
                title="Rate Limit Exceeded"
                message={
                  <span>
                    Too many attempts. Try again in{' '}
                    <span className="font-mono font-semibold">
                      {rateLimitSeconds}s
                    </span>
                    .
                  </span>
                }
              />
            </div>
          )}

          {/* General Error Banner */}
          {error && !rateLimitSeconds && (
            <div className="mb-5">
              <Banner
                type="error"
                message={error}
                onClose={() => setError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading || (rateLimitSeconds !== null && rateLimitSeconds > 0)}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading || (rateLimitSeconds !== null && rateLimitSeconds > 0)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={rateLimitSeconds !== null && rateLimitSeconds > 0}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-4 border-t border-rule text-left">
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-ink-faint block mb-2">
              Demo Access
            </span>
            <button
              type="button"
              onClick={fillAdmin}
              className="text-xs font-mono text-ink-soft hover:text-green underline select-none"
            >
              Fill Admin: admin@balancevault.com
            </button>
          </div>
        </Panel>

        {/* Footer Link */}
        <div className="mt-4 text-left text-sm text-ink-soft">
          No account?{' '}
          <Link to="/register" className="text-green hover:underline font-semibold">
            Open one.
          </Link>
        </div>
      </div>
    </div>
  );
};
