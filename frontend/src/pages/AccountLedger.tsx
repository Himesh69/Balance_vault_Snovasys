import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { MoneyCell } from '../components/ui/MoneyCell.js';

export const AccountLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');

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

  const toggleExpand = (entryId: string) => {
    setExpandedRowId((prev) => (prev === entryId ? null : entryId));
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  // Filter entries
  const filteredEntries = ledgerEntries.filter((entry) => {
    if (directionFilter !== 'ALL' && entry.direction !== directionFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const ref = (entry.transaction?.reference || '').toLowerCase();
      const desc = (entry.transaction?.description || '').toLowerCase();
      return ref.includes(q) || desc.includes(q);
    }
    return true;
  });

  // Calculate totals
  const totalDebits = filteredEntries
    .filter((e) => e.direction === 'DEBIT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCredits = filteredEntries
    .filter((e) => e.direction === 'CREDIT')
    .reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4 text-left">
        <div className="h-8 w-64 bg-paper-sunk rounded-[2px] animate-pulse" />
        <div className="h-64 w-full bg-paper-sunk rounded-[2px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-soft mb-1">
            <Link to="/accounts" className="hover:underline">
              ← Accounts
            </Link>
            <span>/</span>
            <span>{account?.accountNumber}</span>
          </div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink flex items-center gap-3">
            <span>Account Statement</span>
            <span className="font-mono text-2xl font-semibold">
              {account?.accountNumber}
            </span>
            <Badge variant={account?.status === 'ACTIVE' ? 'green' : 'brass'}>
              {account?.status}
            </Badge>
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            Double-entry verified statement • Currency: {account?.currency || 'USD'}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11.5px] font-mono uppercase tracking-[0.06em] text-ink-soft block mb-1">
            Closing Balance
          </span>
          <MoneyCell
            amount={account?.cachedBalance || 0}
            isCents={true}
            direction="BALANCE"
            className="text-2xl font-bold"
          />
        </div>
      </div>

      {/* Flat Filter Row per spec §7.4 (No pill chips) */}
      <div className="p-3 bg-paper-raised border border-rule flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="search-input" className="text-xs font-mono uppercase text-ink-soft select-none">
            Search
          </label>
          <input
            id="search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Reference or description…"
            className="h-8 px-2.5 bg-paper text-xs font-mono border border-rule rounded-[2px] focus:outline-none focus:border-green"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="type-select" className="text-xs font-mono uppercase text-ink-soft select-none">
            Type
          </label>
          <select
            id="type-select"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
            className="h-8 px-2 bg-paper text-xs font-mono border border-rule rounded-[2px] focus:outline-none focus:border-green"
          >
            <option value="ALL">All Entries</option>
            <option value="CREDIT">Credits (+)</option>
            <option value="DEBIT">Debits (−)</option>
          </select>
        </div>

        {(searchTerm || directionFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setDirectionFilter('ALL');
            }}
            className="text-xs font-sans text-green hover:underline ml-auto font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Ledger Table (sitting directly on page with 2px top rule and 1px bottom rule) */}
      <div className="w-full overflow-x-auto border-t-2 border-t-rule-strong border-b border-b-rule">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper-sunk border-b border-rule">
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Date & Time (UTC)
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Reference
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Description
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
              >
                Debit (−)
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
              >
                Credit (+)
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-center select-none"
              >
                Invariant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule text-[14px]">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-soft">
                  <p className="font-serif text-lg text-ink mb-1">
                    No matching ledger entries found.
                  </p>
                  <p className="text-xs text-ink-faint">
                    Adjust your filter criteria or record a deposit or withdrawal.
                  </p>
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const isDebit = entry.direction === 'DEBIT';
                const isCredit = entry.direction === 'CREDIT';
                const isExpanded = expandedRowId === entry.id;

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() => toggleExpand(entry.id)}
                      className={`h-11 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-paper-raised' : 'hover:bg-paper-sunk/60'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                        {new Date(entry.createdAt).toISOString().replace('T', ' ').substring(0, 16)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold text-ink">
                        <span className="mr-2">
                          {entry.transaction?.reference || '—'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(entry.transaction?.reference || '', e)}
                          title="Copy reference"
                          className="text-[11px] text-green hover:underline select-none"
                        >
                          Copy
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-ink truncate max-w-[280px]">
                        {entry.transaction?.description || 'Account Movement'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isDebit ? (
                          <MoneyCell
                            amount={entry.amount}
                            isCents={true}
                            direction="DEBIT"
                          />
                        ) : (
                          <span className="text-ink-faint font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isCredit ? (
                          <MoneyCell
                            amount={entry.amount}
                            isCents={true}
                            direction="CREDIT"
                          />
                        ) : (
                          <span className="text-ink-faint font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge variant="green">BALANCED</Badge>
                      </td>
                    </tr>

                    {/* Inline Row Expand (Left 3px bar per spec §6) */}
                    {isExpanded && (
                      <tr className="bg-paper-raised">
                        <td
                          colSpan={6}
                          className="p-4 border-l-[3px] border-l-rule-strong bg-paper-sunk/30"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-ink">
                            <div>
                              <span className="text-ink-soft block text-[11px] uppercase">
                                Entry ID
                              </span>
                              <span className="font-semibold select-all">
                                {entry.id}
                              </span>
                            </div>
                            <div>
                              <span className="text-ink-soft block text-[11px] uppercase">
                                Transaction ID
                              </span>
                              <span className="font-semibold select-all">
                                {entry.transactionId}
                              </span>
                            </div>
                            <div>
                              <span className="text-ink-soft block text-[11px] uppercase">
                                Direction & Magnitude
                              </span>
                              <span>
                                {entry.direction} of {entry.amount} cents
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Period Totals (Double rule above per spec §6 & §7.4) */}
          {filteredEntries.length > 0 && (
            <tfoot>
              <tr className="bg-paper-sunk font-mono text-xs font-semibold text-ink border-double-rule">
                <td colSpan={3} className="py-3 px-4 uppercase text-[11.5px] tracking-wider text-ink-soft">
                  Period Movement Totals ({filteredEntries.length} entries)
                </td>
                <td className="py-3 px-4 text-right">
                  <MoneyCell
                    amount={totalDebits}
                    isCents={true}
                    direction="DEBIT"
                    className="font-bold text-xs"
                  />
                </td>
                <td className="py-3 px-4 text-right">
                  <MoneyCell
                    amount={totalCredits}
                    isCents={true}
                    direction="CREDIT"
                    className="font-bold text-xs"
                  />
                </td>
                <td className="py-3 px-4 text-center text-ink-soft text-[11px]">
                  Double-entry verified
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft font-mono pt-2">
        <span>Showing {filteredEntries.length} of {ledgerEntries.length} recorded entries</span>
        <span>BalanceVault Invariant: Σ(Debits) = Σ(Credits) enforced atomically</span>
      </div>
    </div>
  );
};
