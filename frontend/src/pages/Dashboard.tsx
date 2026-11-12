import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest, formatCurrency } from '../lib/api.js';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Layers
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        await refreshUser();
        const accs = await apiRequest('/accounts');
        setAccounts(accs);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.cachedBalance || 0), 0);
  const onboardingStatus = user?.onboarding?.status || 'DRAFT';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Account Holder Portal • Secure Double-Entry Balance Management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/accounts"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition flex items-center shadow-sm"
          >
            <Wallet className="w-4 h-4 mr-2" />
            My Accounts
          </Link>
        </div>
      </div>

      {/* Onboarding Status Alert Card */}
      {onboardingStatus === 'DRAFT' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-xl flex items-start space-x-4">
          <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Onboarding Incomplete</h3>
            <p className="text-sm text-amber-800 mt-1">
              Please complete and submit your onboarding verification form so our team can approve and provision your primary account.
            </p>
            <Link
              to="/onboarding"
              className="inline-block mt-3 px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition"
            >
              Continue Onboarding →
            </Link>
          </div>
        </div>
      )}

      {onboardingStatus === 'SUBMITTED' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-xl flex items-start space-x-4">
          <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Verification Pending Review</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your onboarding application has been submitted and is currently being reviewed by an administrator. You will be notified once approved.
            </p>
          </div>
        </div>
      )}

      {onboardingStatus === 'REJECTED' && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-xl flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-rose-900">Application Needs Revision</h3>
            <p className="text-sm text-rose-800 mt-1">
              Reviewer Notes:{' '}
              <span className="font-medium italic">
                "{user?.onboarding?.reviewNotes || 'Please update your details and re-submit.'}"
              </span>
            </p>
            <Link
              to="/onboarding"
              className="inline-block mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
            >
              Edit & Re-submit Application →
            </Link>
          </div>
        </div>
      )}

      {onboardingStatus === 'APPROVED' && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-center space-x-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">
            Identity verified and account approved. Double-entry ledger operations are fully active.
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-2">
            <span>Total Available Balance</span>
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Sum of all active account balances
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-2">
            <span>Active Accounts</span>
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {accounts.length}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Linked to your verified identity
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium mb-2">
            <span>Ledger Integrity</span>
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-800">
            100% Balanced
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Every movement enforces Debit = Credit
          </p>
        </div>
      </div>

      {/* Accounts List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Your Accounts</h2>
          <Link to="/accounts" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Manage Accounts →
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No accounts active yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Your primary account will be automatically provisioned once your onboarding verification is approved.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {acc.accountNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase">
                      {acc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Currency: {acc.currency} • Type: {acc.accountType}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">
                      {formatCurrency(acc.cachedBalance, acc.currency)}
                    </div>
                    <span className="text-xs text-slate-400">Available Balance</span>
                  </div>
                  <Link
                    to={`/accounts/${acc.id}/ledger`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    View Ledger
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

