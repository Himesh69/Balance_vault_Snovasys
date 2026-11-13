import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../lib/api.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Panel } from '../components/ui/Panel.js';
import { Banner } from '../components/ui/Banner.js';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password checklist rules per §7.1
  const isLenMet = password.length >= 8;
  const hasUpperOrNum = /[0-9A-Z]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLenMet) {
      setError('Password must meet minimum length requirement.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
      });

      login(data.token, data.user);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-start px-6 pt-[12vh] pb-12 items-center sm:items-start sm:pl-[12vw]">
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
            Open an Account
          </h1>
          <p className="text-[13px] text-ink-soft mb-6">
            Register to initiate verified onboarding and ledger provisioning.
          </p>

          {error && (
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
              label="Full Legal Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane M. Doe"
              disabled={loading}
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            {/* Password checklist with plain text status per spec §7.1 */}
            <div className="p-3 bg-paper-sunk border border-rule text-xs font-sans text-left space-y-1">
              <span className="font-semibold text-ink-soft block mb-1">
                Password Requirements:
              </span>
              <div className="flex items-center justify-between font-mono">
                <span className={isLenMet ? 'text-ink font-medium' : 'text-ink-soft'}>
                  At least 8 characters
                </span>
                <span className={isLenMet ? 'text-green font-bold' : 'text-ink-faint'}>
                  {isLenMet ? 'MET' : 'NOT YET MET'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className={hasUpperOrNum ? 'text-ink font-medium' : 'text-ink-soft'}>
                  Contains uppercase or number
                </span>
                <span className={hasUpperOrNum ? 'text-green font-bold' : 'text-ink-faint'}>
                  {hasUpperOrNum ? 'MET' : 'OPTIONAL'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </form>
        </Panel>

        {/* Footer Link */}
        <div className="mt-4 text-left text-sm text-ink-soft">
          Already registered?{' '}
          <Link to="/login" className="text-green hover:underline font-semibold">
            Sign in.
          </Link>
        </div>
      </div>
    </div>
  );
};
