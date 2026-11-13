import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from './ui/Badge.js';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Generate plain breadcrumb based on current pathname
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.startsWith('/admin/users')) return 'Administration / Users';
    if (p.startsWith('/admin/onboarding')) return 'Administration / Onboarding Queue';
    if (p.startsWith('/admin/audit')) return 'Administration / Audit Trail';
    if (p.startsWith('/admin/accounts')) return 'Administration / Accounts';
    if (p.startsWith('/admin')) return 'Administration / Overview';
    if (p.startsWith('/accounts/') && p.includes('/ledger')) return 'Accounts / Statement Ledger';
    if (p.startsWith('/accounts')) return 'Account / Accounts & Movement';
    if (p.startsWith('/onboarding')) return 'Account / Onboarding Verification';
    return 'Account / Overview Statement';
  };

  const navContent = (
    <div className="flex flex-col h-full bg-paper-sunk text-ink select-none">
      {/* Top Wordmark with 2-line ruled square SVG mark */}
      <div className="h-14 px-4 flex items-center border-b border-rule">
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 text-ink hover:opacity-90 transition-opacity"
        >
          {/* 2-line ruled square mark (SVG 20px) per spec §5 */}
          <svg
            className="w-5 h-5 flex-shrink-0 text-ink"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="2" width="16" height="16" rx="1" />
            <line x1="2" y1="7.5" x2="18" y2="7.5" />
            <line x1="2" y1="13" x2="18" y2="13" />
          </svg>
          <span className="font-serif text-[20px] font-semibold tracking-tight text-ink">
            BalanceVault
          </span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Account Group */}
        <div className="mb-6">
          <div className="px-4 mb-2 text-[11px] font-mono font-semibold tracking-[0.06em] text-ink-soft uppercase">
            Account
          </div>
          <nav className="flex flex-col">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                isActive('/dashboard') && !location.pathname.startsWith('/admin')
                  ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                  : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
              }`}
            >
              Statement Overview
            </Link>
            <Link
              to="/accounts"
              onClick={() => setMobileMenuOpen(false)}
              className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                isActive('/accounts') && !location.pathname.startsWith('/admin')
                  ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                  : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
              }`}
            >
              Ledger & Movements
            </Link>
            <Link
              to="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                isActive('/onboarding')
                  ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                  : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
              }`}
            >
              Onboarding
            </Link>
          </nav>
        </div>

        {/* Administration Group (Admin only) */}
        {isAdmin && (
          <div className="mb-6">
            <div className="px-4 mb-2 text-[11px] font-mono font-semibold tracking-[0.06em] text-ink-soft uppercase">
              Administration
            </div>
            <nav className="flex flex-col">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                    : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
                }`}
              >
                Admin Overview
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                    : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
                }`}
              >
                Users & Roles
              </Link>
              <Link
                to="/admin/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                  isActive('/admin/onboarding')
                    ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                    : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
                }`}
              >
                Onboarding Queue
              </Link>
              <Link
                to="/admin/audit"
                onClick={() => setMobileMenuOpen(false)}
                className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                  isActive('/admin/audit')
                    ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                    : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
                }`}
              >
                Audit Log Trail
              </Link>
              <Link
                to="/admin/accounts"
                onClick={() => setMobileMenuOpen(false)}
                className={`h-10 px-4 flex items-center text-[14px] font-sans transition-colors ${
                  isActive('/admin/accounts')
                    ? 'bg-paper-raised font-semibold text-ink border-l-[3px] border-l-green'
                    : 'text-ink-soft hover:bg-paper-raised/60 hover:text-ink border-l-[3px] border-l-transparent'
                }`}
              >
                All Accounts
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* User Information & Sign Out */}
      <div className="p-4 border-t border-rule bg-paper-sunk">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink truncate">
              {user?.fullName}
            </div>
            <div className="text-xs font-mono text-ink-soft truncate">
              {user?.email}
            </div>
          </div>
          <Badge variant={isAdmin ? 'slate-blue' : 'neutral'}>
            {user?.role === 'ADMIN' ? 'ADMIN' : 'HOLDER'}
          </Badge>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-sans font-medium text-ink-soft hover:text-oxblood underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row text-ink">
      {/* Desktop Fixed Left Rail (232px wide, flush to edge) */}
      <aside className="hidden md:block w-[232px] flex-shrink-0 h-screen sticky top-0 border-r border-rule z-20">
        {navContent}
      </aside>

      {/* Mobile Top Header (<900px) */}
      <header className="md:hidden h-14 bg-paper-sunk border-b border-rule flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-ink"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="2" width="16" height="16" rx="1" />
            <line x1="2" y1="7.5" x2="18" y2="7.5" />
            <line x1="2" y1="13" x2="18" y2="13" />
          </svg>
          <span className="font-serif text-lg font-semibold text-ink">
            BalanceVault
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-sm font-sans font-semibold text-ink px-2.5 py-1 border border-rule bg-paper-raised rounded-[2px]"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 flex"
          style={{ backgroundColor: 'rgba(28, 33, 30, 0.45)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[260px] h-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Strip (56px, plain breadcrumbs, no floating decoration) */}
        <div className="h-14 bg-paper border-b border-rule px-6 md:px-8 flex items-center justify-between text-sm select-none">
          <div className="font-mono text-xs text-ink-soft">
            {getBreadcrumb()}
          </div>
          <div className="text-xs font-mono text-ink-faint hidden sm:block">
            {new Date().toISOString().split('T')[0]} UTC
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-[1120px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

