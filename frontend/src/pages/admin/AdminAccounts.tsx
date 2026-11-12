import React, { useState, useEffect } from 'react';
import { apiRequest, formatCurrency } from '../../lib/api.js';
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  Trash2,
  ShieldAlert,
  Search,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAccounts: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/users?limit=100');
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const allAccounts = users.flatMap((u) =>
    (u.accounts || []).map((acc: any) => ({
      ...acc,
      userFullName: u.fullName,
      userEmail: u.email,
    }))
  );

  const handleStatusChange = async (accountId: string, newStatus: string) => {
    setFeedback(null);
    try {
      await apiRequest(`/admin/accounts/${accountId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setFeedback({ type: 'success', text: `Account status updated to ${newStatus}` });
      fetchAccounts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Status change failed.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setFeedback(null);
    try {
      await apiRequest(`/admin/accounts/${deleteModal.id}`, {
        method: 'DELETE',
      });
      setFeedback({
        type: 'success',
        text: `Account ${deleteModal.accountNumber} hard-deleted successfully.`,
      });
      setDeleteModal(null);
      fetchAccounts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Account deletion failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administrative controls for user accounts: activate, suspend, or hard delete empty accounts.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl">
          Total Accounts: {allAccounts.length}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading accounts...</p>
          </div>
        ) : allAccounts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Account Number</th>
                  <th className="px-6 py-3.5">Account Holder</th>
                  <th className="px-6 py-3.5">Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {allAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {acc.accountNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{acc.userFullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{acc.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      {formatCurrency(acc.cachedBalance, acc.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={acc.status}
                        onChange={(e) => handleStatusChange(acc.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/accounts/${acc.id}/ledger`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition inline-flex items-center"
                      >
                        <History className="w-3 h-3 mr-1" />
                        Ledger
                      </Link>
                      <button
                        onClick={() => setDeleteModal(acc)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hard Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Confirm Account Hard Delete</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete account{' '}
              <span className="font-bold font-mono text-slate-900">{deleteModal.accountNumber}</span>?
            </p>
            {deleteModal.cachedBalance !== 0 ? (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                Cannot delete: Account balance is {formatCurrency(deleteModal.cachedBalance)}. Balance must be zero before deletion.
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl mt-3">
                This will permanently remove the account record and any historic ledger entries.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteModal.cachedBalance !== 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

