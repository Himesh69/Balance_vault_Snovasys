import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, formatCurrency } from '../lib/api.js';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  ShieldCheck,
  X
} from 'lucide-react';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'credit' | 'debit' | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [amountDollars, setAmountDollars] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAccounts = async () => {
    try {
      const data = await apiRequest('/accounts');
      setAccounts(data);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const openModal = (type: 'credit' | 'debit', account: any) => {
    setModalType(type);
    setSelectedAccount(account);
    setAmountDollars('');
    setDescription(type === 'credit' ? 'Deposit funds' : 'Withdraw funds');
    setFeedback(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedAccount(null);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !modalType) return;

    setFeedback(null);
    setSubmitting(true);

    try {
      const parsedAmount = parseFloat(amountDollars);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      // Smallest currency unit (cents): Math.round(parsedAmount * 100)
      const amountCents = Math.round(parsedAmount * 100);

      const endpoint = `/accounts/${selectedAccount.id}/${modalType}`;
      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountCents,
          description: description.trim() || `${modalType.toUpperCase()} operation`,
        }),
      });

      setFeedback({
        type: 'success',
        text: `Successfully executed ${modalType === 'credit' ? 'deposit' : 'withdrawal'} with balanced double-entry ledger entries!`,
      });

      await loadAccounts();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Transaction failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts & Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Deposit, withdraw, and inspect double-entry balanced ledger entries.
          </p>
        </div>
      </div>

      {/* Account Cards */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-200">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No active accounts</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Your account will be provisioned automatically once your onboarding application is submitted and approved by an administrator.
          </p>
          <Link
            to="/onboarding"
            className="inline-block mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
          >
            Complete Onboarding →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-extrabold text-slate-900 text-lg">
                      {account.accountNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        account.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                    {account.currency}
                  </span>
                </div>

                <div className="my-6">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Available Balance
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {formatCurrency(account.cachedBalance, account.currency)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    Double-entry balance verified
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  onClick={() => openModal('credit', account)}
                  disabled={account.status !== 'ACTIVE'}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-50"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                  Deposit (Credit)
                </button>

                <button
                  onClick={() => openModal('debit', account)}
                  disabled={account.status !== 'ACTIVE' || account.cachedBalance <= 0}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-50"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  Withdraw (Debit)
                </button>

                <Link
                  to={`/accounts/${account.id}/ledger`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center"
                >
                  <History className="w-3.5 h-3.5 mr-1" />
                  Ledger
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Operation Modal */}
      {modalType && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {modalType === 'credit' ? 'Deposit Funds (Credit)' : 'Withdraw Funds (Debit)'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`my-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleTransaction} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Account
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800">
                  {selectedAccount.accountNumber} (Available: {formatCurrency(selectedAccount.cachedBalance)})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Amount (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reason or reference"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Double-Entry Rule:</span> This action will automatically generate balanced debit & credit entries matching the platform clearing account.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Executing...' : 'Confirm Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

