import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Dialog } from '../../components/ui/Dialog.js';
import { Banner } from '../../components/ui/Banner.js';
import { MoneyCell } from '../../components/ui/MoneyCell.js';

export const AdminAccounts: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [statusDialog, setStatusDialog] = useState<{ account: any; newStatus: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
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

  const confirmStatusChange = async () => {
    if (!statusDialog) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await apiRequest(`/admin/accounts/${statusDialog.account.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusDialog.newStatus }),
      });
      setFeedback({
        type: 'success',
        text: `Account ${statusDialog.account.accountNumber} status updated to ${statusDialog.newStatus}.`,
      });
      setStatusDialog(null);
      fetchAccounts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Status change failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(true);
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
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
            All Accounts
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            System overview of provisioned accounts across all holders.
          </p>
        </div>
        <div className="text-xs font-mono text-ink-soft">
          Total Accounts: <span className="font-bold text-ink">{allAccounts.length}</span>
        </div>
      </div>

      {feedback && (
        <Banner
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Dense Ledger-Style Table (2px top rule, 1px bottom rule) */}
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
                Holder
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
                Cached Balance
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
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-ink-soft font-mono text-xs">
                  Loading accounts ledger…
                </td>
              </tr>
            ) : allAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-ink-soft">
                  <p className="font-serif text-lg text-ink mb-1">No accounts found.</p>
                  <p className="text-xs text-ink-faint">Accounts are provisioned upon approved onboarding.</p>
                </td>
              </tr>
            ) : (
              allAccounts.map((acc) => {
                const isActive = acc.status === 'ACTIVE';
                return (
                  <tr key={acc.id} className="h-11 hover:bg-paper-sunk/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold text-ink">
                      {acc.accountNumber}
                    </td>
                    <td className="py-2.5 px-4 text-ink">
                      <div className="font-medium text-sm">{acc.userFullName}</div>
                      <div className="font-mono text-xs text-ink-soft">{acc.userEmail}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={isActive ? 'green' : 'oxblood'}>
                        {acc.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <MoneyCell
                        amount={acc.cachedBalance || 0}
                        isCents={true}
                        direction="BALANCE"
                        className="text-sm font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/accounts/${acc.id}/ledger`}
                          className="text-xs font-semibold text-green hover:underline select-none"
                        >
                          Ledger
                        </Link>
                        <span className="text-rule text-xs select-none">|</span>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => setStatusDialog({ account: acc, newStatus: 'SUSPENDED' })}
                            className="text-xs font-semibold text-oxblood hover:underline select-none"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStatusDialog({ account: acc, newStatus: 'ACTIVE' })}
                            className="text-xs font-semibold text-ink hover:underline select-none"
                          >
                            Activate
                          </button>
                        )}
                        <span className="text-rule text-xs select-none">|</span>
                        <button
                          type="button"
                          onClick={() => setDeleteModal(acc)}
                          className="text-xs font-semibold text-oxblood hover:underline select-none"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Status Change Dialog (§6) */}
      <Dialog
        isOpen={statusDialog !== null}
        onClose={() => setStatusDialog(null)}
        title={statusDialog?.newStatus === 'SUSPENDED' ? 'Suspend Account' : 'Activate Account'}
        confirmLabel={statusDialog?.newStatus === 'SUSPENDED' ? 'Suspend Account' : 'Activate Account'}
        confirmVariant={statusDialog?.newStatus === 'SUSPENDED' ? 'destructive' : 'primary'}
        onConfirm={confirmStatusChange}
        loading={actionLoading}
      >
        <p>
          Change status of account{' '}
          <strong className="font-mono text-ink font-bold">
            {statusDialog?.account.accountNumber}
          </strong>{' '}
          to <strong className="font-mono">{statusDialog?.newStatus}</strong>?
        </p>
      </Dialog>

      {/* Delete Account Dialog (§6) */}
      <Dialog
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        title="Confirm Hard Deletion"
        confirmLabel="Hard Delete Account"
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        loading={actionLoading}
      >
        <p>
          Permanently delete account{' '}
          <strong className="font-mono text-ink font-bold">
            {deleteModal?.accountNumber}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          Balance must be zero ($0.00). Deletion will remove all associated ledger entries.
        </p>
      </Dialog>
    </div>
  );
};
