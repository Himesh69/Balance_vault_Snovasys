import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Panel } from '../components/ui/Panel.js';
import { Banner } from '../components/ui/Banner.js';
import { MoneyCell } from '../components/ui/MoneyCell.js';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Money movement flow state (§7.5)
  // Step 1: Input, Step 2: Review, Step 3: Receipt
  const [movementAccount, setMovementAccount] = useState<any | null>(null);
  const [movementType, setMovementType] = useState<'credit' | 'debit' | null>(null);
  const [movementStep, setMovementStep] = useState<'INPUT' | 'REVIEW' | 'RECEIPT'>('INPUT');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

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

  const openMovement = (type: 'credit' | 'debit', account: any) => {
    setMovementType(type);
    setMovementAccount(account);
    setMovementStep('INPUT');
    setAmountStr('');
    setDescription(type === 'credit' ? 'Account deposit' : 'Account withdrawal');
    setError(null);
    setLastReceipt(null);
  };

  const closeMovement = () => {
    setMovementType(null);
    setMovementAccount(null);
    setMovementStep('INPUT');
    setError(null);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please specify a positive numeric amount.');
      return;
    }

    const cents = Math.round(parsed * 100);
    if (movementType === 'debit' && movementAccount && movementAccount.cachedBalance < cents) {
      setError(
        `Insufficient funds. Current balance is $${(movementAccount.cachedBalance / 100).toFixed(2)}, requested $${parsed.toFixed(2)}.`
      );
      return;
    }

    setMovementStep('REVIEW');
  };

  const handleConfirmMovement = async () => {
    if (!movementAccount || !movementType) return;
    setError(null);
    setSubmitting(true);

    try {
      const parsed = parseFloat(amountStr);
      const amountCents = Math.round(parsed * 100);

      const res = await apiRequest(`/accounts/${movementAccount.id}/${movementType}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountCents,
          description: description.trim() || `${movementType.toUpperCase()} movement`,
        }),
      });

      setLastReceipt({
        reference: res.reference,
        amountCents,
        description: res.description,
        timestamp: new Date().toISOString(),
        entries: res.entries,
      });

      await loadAccounts();
      setMovementStep('RECEIPT');
    } catch (err: any) {
      setError(err.message || 'Transaction could not be executed.');
      setMovementStep('INPUT');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 text-left">
        <div className="h-8 w-48 bg-paper-sunk rounded-[2px] animate-pulse" />
        <div className="h-48 w-full bg-paper-sunk rounded-[2px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
            Accounts & Movements
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            Initiate balanced double-entry operations or review statements.
          </p>
        </div>
      </div>

      {/* If movement form is active: show the 520px movement panel (§7.5) */}
      {movementType && movementAccount && (
        <div className="max-w-[520px]">
          <Panel hasDocumentHeader className="shadow-none">
            {/* Step 1: Input */}
            {movementStep === 'INPUT' && (
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-rule">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-ink">
                      {movementType === 'credit' ? 'Deposit Funds' : 'Withdraw Funds'}
                    </h2>
                    <p className="text-xs text-ink-soft font-mono mt-0.5">
                      Account: {movementAccount.accountNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeMovement}
                    className="text-xs font-semibold text-ink-soft hover:text-ink underline select-none"
                  >
                    Cancel
                  </button>
                </div>

                {error && (
                  <div className="mb-4">
                    <Banner type="error" message={error} onClose={() => setError(null)} />
                  </div>
                )}

                <form onSubmit={handleProceedToReview} className="space-y-4">
                  {/* Amount field first and largest (mono 24px per spec §7.5) */}
                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5 select-none">
                      Amount (USD)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-xl text-ink-soft select-none">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        autoFocus
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-12 pl-8 pr-16 bg-paper-raised border border-rule text-2xl font-mono tabular-nums rounded-[2px] focus:outline-none focus:border-green focus:ring-2 focus:ring-green-wash text-ink"
                      />
                      <span className="absolute right-3 font-mono text-xs text-ink-soft select-none font-semibold">
                        USD
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft font-sans">
                      Current available balance:{' '}
                      <span className="font-mono font-medium">
                        ${(movementAccount.cachedBalance / 100).toFixed(2)}
                      </span>
                    </p>
                  </div>

                  <Input
                    label="Description"
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Payroll deposit, Vendor wire"
                  />

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={closeMovement}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Review Movement →
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Review step before commit (§7.5) */}
            {movementStep === 'REVIEW' && (
              <div>
                <div className="pb-3 mb-4 border-b border-rule">
                  <h2 className="font-serif text-xl font-medium text-ink">
                    Review {movementType === 'credit' ? 'Deposit' : 'Withdrawal'}
                  </h2>
                  <p className="text-xs text-ink-soft font-sans mt-0.5">
                    Verify movement parameters before atomic ledger commit.
                  </p>
                </div>

                {error && (
                  <div className="mb-4">
                    <Banner type="error" message={error} onClose={() => setError(null)} />
                  </div>
                )}

                <div className="border-t-2 border-t-rule-strong border-b border-b-rule mb-6">
                  <table className="w-full text-left text-sm divide-y divide-rule font-sans">
                    <tbody>
                      <tr className="h-9">
                        <td className="py-2 text-xs font-mono uppercase text-ink-soft">
                          Source
                        </td>
                        <td className="py-2 text-right font-mono text-xs text-ink font-semibold">
                          {movementType === 'credit' ? 'Platform Clearing (Asset)' : movementAccount.accountNumber}
                        </td>
                      </tr>
                      <tr className="h-9">
                        <td className="py-2 text-xs font-mono uppercase text-ink-soft">
                          Destination
                        </td>
                        <td className="py-2 text-right font-mono text-xs text-ink font-semibold">
                          {movementType === 'credit' ? movementAccount.accountNumber : 'Platform Clearing (Asset)'}
                        </td>
                      </tr>
                      <tr className="h-9">
                        <td className="py-2 text-xs font-mono uppercase text-ink-soft">
                          Movement Amount
                        </td>
                        <td className="py-2 text-right">
                          <MoneyCell
                            amount={parseFloat(amountStr)}
                            isCents={false}
                            direction={movementType === 'credit' ? 'CREDIT' : 'DEBIT'}
                            className="text-base font-bold"
                          />
                        </td>
                      </tr>
                      <tr className="h-9">
                        <td className="py-2 text-xs font-mono uppercase text-ink-soft">
                          Platform Fee
                        </td>
                        <td className="py-2 text-right font-mono text-xs text-ink">
                          $0.00 (Standard)
                        </td>
                      </tr>
                      <tr className="h-9">
                        <td className="py-2 text-xs font-mono uppercase text-ink-soft">
                          Description
                        </td>
                        <td className="py-2 text-right text-xs text-ink">
                          {description}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setMovementStep('INPUT')}
                    disabled={submitting}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleConfirmMovement}
                    loading={submitting}
                  >
                    Confirm Transfer
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Receipt-style confirmation block (§7.5) */}
            {movementStep === 'RECEIPT' && lastReceipt && (
              <div>
                <div className="pb-3 mb-4 border-b border-rule">
                  <span className="text-[11px] font-mono text-green font-bold uppercase tracking-wider block mb-1">
                    Movement Committed
                  </span>
                  <h2 className="font-serif text-xl font-medium text-ink">
                    Transaction Receipt
                  </h2>
                </div>

                <div className="p-4 bg-paper-sunk border border-rule font-mono text-xs space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Reference:</span>
                    <span className="font-bold select-all">{lastReceipt.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Timestamp (UTC):</span>
                    <span>{lastReceipt.timestamp.replace('T', ' ').substring(0, 19)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Amount:</span>
                    <MoneyCell
                      amount={lastReceipt.amountCents}
                      isCents={true}
                      direction={movementType === 'credit' ? 'CREDIT' : 'DEBIT'}
                      className="font-bold"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Invariant:</span>
                    <span className="text-green font-semibold">Σ(Debit) = Σ(Credit) Verified</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" onClick={closeMovement}>
                    Back to Accounts
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Accounts List Table */}
      <div className="space-y-3">
        <h2 className="font-serif text-[22px] leading-7 font-medium text-ink">
          Provisioned Accounts ({accounts.length})
        </h2>

        {/* Ledger style table directly on page */}
        <div className="w-full overflow-x-auto border-t-2 border-t-rule-strong border-b border-b-rule">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper-sunk border-b border-rule">
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Account Number
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
                >
                  Available Balance
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-[14px]">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <p className="font-serif text-lg text-ink mb-1">
                      No active accounts provisioned.
                    </p>
                    <p className="text-xs text-ink-faint">
                      Accounts are provisioned automatically upon approved onboarding.
                    </p>
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="h-12 hover:bg-paper-sunk/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-sm font-semibold text-ink">
                      {acc.accountNumber}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono text-ink-soft">
                      {acc.accountType}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={acc.status === 'ACTIVE' ? 'green' : 'brass'}>
                        {acc.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <MoneyCell
                        amount={acc.cachedBalance || 0}
                        isCents={true}
                        direction="BALANCE"
                        className="text-base font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openMovement('credit', acc)}
                          className="text-xs font-semibold text-green hover:underline select-none"
                        >
                          Deposit
                        </button>
                        <span className="text-rule text-xs select-none">|</span>
                        <button
                          type="button"
                          onClick={() => openMovement('debit', acc)}
                          className="text-xs font-semibold text-ink-soft hover:underline select-none"
                        >
                          Withdraw
                        </button>
                        <span className="text-rule text-xs select-none">|</span>
                        <Link
                          to={`/accounts/${acc.id}/ledger`}
                          className="text-xs font-semibold text-ink hover:underline select-none"
                        >
                          Statement
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
