import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import {
  Users,
  UserCheck,
  History,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    usersCount: 0,
    pendingOnboardingCount: 0,
    auditLogsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, onbRes, auditRes] = await Promise.all([
          apiRequest('/admin/users?limit=1'),
          apiRequest('/admin/onboarding?status=SUBMITTED&limit=1'),
          apiRequest('/admin/audit-logs?limit=1'),
        ]);

        setMetrics({
          usersCount: usersRes.total || 0,
          pendingOnboardingCount: onbRes.total || 0,
          auditLogsCount: auditRes.total || 0,
        });
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/80 text-purple-200 border border-purple-700 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-400" />
            Administrative Operator Console
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Administration</h1>
          <p className="text-slate-400 text-sm mt-1">
            Least-Privilege RBAC • User Lifecycle Management • Immutable Audit Trail
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-2">
            <span>Total Registered Users</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics.usersCount}
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-3"
          >
            Manage users <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-2">
            <span>Pending Onboardings</span>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics.pendingOnboardingCount}
          </div>
          <Link
            to="/admin/onboarding"
            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 mt-3"
          >
            Review applications <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-2">
            <span>Total Audit Trail Events</span>
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {metrics.auditLogsCount}
          </div>
          <Link
            to="/admin/audit"
            className="inline-flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700 mt-3"
          >
            Inspect audit logs <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/onboarding"
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 transition group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Onboarding Review Queue</h3>
              <p className="text-xs text-slate-500">Approve or reject applicant submissions with full dossier inspection.</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/audit"
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 transition group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-500">Inspect 100% of state changes with before/after snapshots and actor IP.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

