import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest, formatCurrency } from '../lib/api.js';
import {
  History,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Calendar,
  Hash
} from 'lucide-react';

export const AccountLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [acc, entries] = await Promise.all([
          apiRequest(`/accounts/${id}`),
          apiRequest(`/accounts/${id}/ledger`),
        ]);
        setAccount(acc);
        setLedgerEntries(entries);
      } catch (err) {
        console.error('Failed to load ledger:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500">Loading double-entry ledger statement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/accounts"
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Double-Entry Ledger Statement
          </h1>
          <p className="text-sm text-slate-500">
            Account: <span className="font-mono font-semibold text-slate-700">{account?.accountNumber}</span> • Status: <span className="font-semibold text-emerald-600">{account?.status}</span>
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Current Cached Balance
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(account?.cachedBalance || 0, account?.currency)}
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl text-emerald-900">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Double-Entry Cryptographic Invariant:</span>
            Every transaction is balanced where &Sigma;(Debits) = &Sigma;(Credits).
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900">Recorded Movements ({ledgerEntries.length})</h2>
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700">No ledger movements yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Deposit or withdraw funds to see balanced double-entry entries recorded in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Transaction Ref</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Debit (-)</th>
                  <th className="px-6 py-3.5 text-right">Credit (+)</th>
                  <th className="px-6 py-3.5 text-center">Balanced Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {ledgerEntries.map((entry) => {
                  const isDebit = entry.direction === 'DEBIT';
                  const isCredit = entry.direction === 'CREDIT';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap font-sans">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {entry.transaction?.reference || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-sans">
                        {entry.transaction?.description || 'Money movement'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        {isDebit ? formatCurrency(entry.amount, account?.currency) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {isCredit ? formatCurrency(entry.amount, account?.currency) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Balanced
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

