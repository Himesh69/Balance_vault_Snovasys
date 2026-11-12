import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, UserCheck, LogOut, FileText, Wallet, Users, History, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                BalanceVault
              </span>
            </Link>
            <span className="text-xs text-slate-400 hidden md:inline border-l border-slate-700 pl-3">
              Money Movement with a Ledger You Can Prove
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/admin') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-1" />
                  Overview
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/admin/users') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Users
                </Link>
                <Link
                  to="/admin/onboarding"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/admin/onboarding') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  Onboarding Queue
                </Link>
                <Link
                  to="/admin/audit"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/admin/audit') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <History className="w-4 h-4 inline mr-1" />
                  Audit Trail
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/dashboard') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/onboarding"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/onboarding') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  Onboarding
                </Link>
                <Link
                  to="/accounts"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/accounts') ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="w-4 h-4 inline mr-1" />
                  Accounts & Ledger
                </Link>
              </>
            )}
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-right">
              <span className="text-sm font-medium text-slate-200 hidden sm:inline">
                {user?.fullName}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  isAdmin ? 'bg-purple-900/80 text-purple-200 border border-purple-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

