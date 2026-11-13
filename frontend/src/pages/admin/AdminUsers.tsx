import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Dialog } from '../../components/ui/Dialog.js';
import { Banner } from '../../components/ui/Banner.js';
import { DefinitionList } from '../../components/ui/DefinitionList.js';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'HOLDERS' | 'ADMINS' | 'SUSPENDED'>('ALL');
  const [loading, setLoading] = useState(true);

  // User detail modal state
  const [detailUser, setDetailUser] = useState<any | null>(null);

  // Action dialog states
  const [statusDialog, setStatusDialog] = useState<{ user: any; newStatus: 'ACTIVE' | 'SUSPENDED' } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);

      if (activeTab === 'SUSPENDED') {
        query.append('status', 'SUSPENDED');
      }

      query.append('limit', '50');

      const data = await apiRequest(`/admin/users?${query.toString()}`);
      let userList = data.users || [];

      // Filter by role tab on client if needed
      if (activeTab === 'HOLDERS') {
        userList = userList.filter((u: any) => u.role === 'ACCOUNT_HOLDER');
      } else if (activeTab === 'ADMINS') {
        userList = userList.filter((u: any) => u.role === 'ADMIN');
      }

      setUsers(userList);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const openStatusChange = (user: any, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setStatusDialog({ user, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!statusDialog) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      await apiRequest(`/admin/users/${statusDialog.user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusDialog.newStatus }),
      });
      setActionFeedback({
        type: 'success',
        text: `User ${statusDialog.user.email} status changed to ${statusDialog.newStatus}.`,
      });
      setStatusDialog(null);
      fetchUsers();
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Status change failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      await apiRequest(`/admin/users/${deleteDialog.id}`, {
        method: 'DELETE',
      });
      setActionFeedback({
        type: 'success',
        text: `User ${deleteDialog.email} hard-deleted permanently.`,
      });
      setDeleteDialog(null);
      fetchUsers();
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Hard delete failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const viewUserDossier = async (userId: string) => {
    try {
      const detail = await apiRequest(`/admin/users/${userId}`);
      setDetailUser(detail);
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Failed to load user details.' });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
            Users
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            Directory of account holders and system administrators.
          </p>
        </div>
        <div className="text-xs font-mono text-ink-soft">
          Total Users: <span className="font-bold text-ink">{total}</span>
        </div>
      </div>

      {actionFeedback && (
        <Banner
          type={actionFeedback.type}
          message={actionFeedback.text}
          onClose={() => setActionFeedback(null)}
        />
      )}

      {/* Underline Tabs (§7.6 & §6) */}
      <div className="border-b border-rule flex items-center gap-6 text-sm font-sans select-none">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`pb-2.5 font-medium transition-colors ${
            activeTab === 'ALL'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          All Users
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('HOLDERS')}
          className={`pb-2.5 font-medium transition-colors ${
            activeTab === 'HOLDERS'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Account Holders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ADMINS')}
          className={`pb-2.5 font-medium transition-colors ${
            activeTab === 'ADMINS'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Administrators
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SUSPENDED')}
          className={`pb-2.5 font-medium transition-colors ${
            activeTab === 'SUSPENDED'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Suspended
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3 bg-paper-raised border border-rule flex items-center gap-3 text-sm">
        <label htmlFor="user-search" className="text-xs font-mono uppercase text-ink-soft select-none">
          Search
        </label>
        <input
          id="user-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or email…"
          className="h-8 px-2.5 bg-paper text-xs font-mono border border-rule rounded-[2px] focus:outline-none focus:border-green flex-1 max-w-sm"
        />
        <Button type="submit" variant="secondary" className="h-8 text-xs px-3">
          Filter
        </Button>
      </form>

      {/* Dense Ledger-Style Table (2px top rule, 1px bottom rule per §6 & §7.6) */}
      <div className="w-full overflow-x-auto border-t-2 border-t-rule-strong border-b border-b-rule">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-paper-sunk border-b border-rule">
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Name
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Email
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Role
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Status
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                Created (UTC)
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
                <td colSpan={6} className="py-12 text-center text-ink-soft font-mono text-xs">
                  Loading users directory…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-soft">
                  <p className="font-serif text-lg text-ink mb-1">No users found.</p>
                  <p className="text-xs text-ink-faint">Try adjusting your filter search criteria.</p>
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSuspended = u.status === 'SUSPENDED';
                return (
                  <tr key={u.id} className="h-11 hover:bg-paper-sunk/60 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-ink">
                      {u.fullName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-ink-soft">
                      {u.email}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={u.role === 'ADMIN' ? 'slate-blue' : 'neutral'}>
                        {u.role === 'ADMIN' ? 'ADMIN' : 'HOLDER'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={u.status === 'ACTIVE' ? 'green' : 'oxblood'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                      {new Date(u.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => viewUserDossier(u.id)}
                          className="text-xs font-semibold text-green hover:underline select-none"
                        >
                          View
                        </button>
                        <span className="text-rule text-xs select-none">|</span>
                        {isSuspended ? (
                          <button
                            type="button"
                            onClick={() => openStatusChange(u, 'ACTIVE')}
                            className="text-xs font-semibold text-ink hover:underline select-none"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openStatusChange(u, 'SUSPENDED')}
                            className="text-xs font-semibold text-oxblood hover:underline select-none"
                          >
                            Suspend
                          </button>
                        )}
                        <span className="text-rule text-xs select-none">|</span>
                        <button
                          type="button"
                          onClick={() => setDeleteDialog(u)}
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

      {/* User Detail View: Two-column layout per spec §7.6 */}
      {detailUser && (
        <div className="p-6 bg-paper-raised border border-rule rounded-[2px] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-rule">
            <div>
              <span className="text-xs font-mono uppercase text-ink-soft">User Dossier</span>
              <h2 className="font-serif text-2xl font-medium text-ink">
                {detailUser.fullName}
              </h2>
            </div>
            <Button variant="secondary" onClick={() => setDetailUser(null)}>
              Close Dossier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Ruled Definition List */}
            <div className="md:col-span-6 space-y-3">
              <span className="text-[11.5px] font-mono uppercase text-ink-soft font-semibold block">
                Account Attributes
              </span>
              <DefinitionList
                items={[
                  { label: 'User ID', value: detailUser.id, isMono: true },
                  { label: 'Email', value: detailUser.email, isMono: true },
                  { label: 'System Role', value: detailUser.role, isMono: true },
                  { label: 'Account Status', value: detailUser.status, isMono: true },
                  { label: 'Onboarding Status', value: detailUser.onboarding?.status || 'NONE', isMono: true },
                  { label: 'Accounts Count', value: detailUser.accounts?.length || 0, isMono: true },
                ]}
              />
            </div>

            {/* Right: Recent Activity Mini Audit Table */}
            <div className="md:col-span-6 space-y-3">
              <span className="text-[11.5px] font-mono uppercase text-ink-soft font-semibold block">
                Recent Activity Trail
              </span>
              <div className="border border-rule rounded-[2px] overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-paper-sunk border-b border-rule text-ink-soft uppercase text-[10.5px]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule bg-paper">
                    {(!detailUser.auditLogs || detailUser.auditLogs.length === 0) ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-ink-faint">
                          No audit entries recorded.
                        </td>
                      </tr>
                    ) : (
                      detailUser.auditLogs.slice(0, 5).map((log: any) => (
                        <tr key={log.id} className="h-8">
                          <td className="py-1.5 px-3 text-ink-soft whitespace-nowrap">
                            {new Date(log.createdAt).toISOString().split('T')[0]}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-ink">
                            {log.action}
                          </td>
                          <td className="py-1.5 px-3 text-ink-faint">
                            {log.ip || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Activate Confirm Dialog (§6 & §7.6) */}
      <Dialog
        isOpen={statusDialog !== null}
        onClose={() => setStatusDialog(null)}
        title={statusDialog?.newStatus === 'SUSPENDED' ? 'Confirm User Suspension' : 'Confirm User Activation'}
        confirmLabel={statusDialog?.newStatus === 'SUSPENDED' ? 'Suspend User' : 'Activate User'}
        confirmVariant={statusDialog?.newStatus === 'SUSPENDED' ? 'destructive' : 'primary'}
        onConfirm={confirmStatusChange}
        loading={actionLoading}
      >
        <p>
          Are you sure you want to change the status of user{' '}
          <strong className="font-mono text-ink font-semibold">
            {statusDialog?.user.email}
          </strong>{' '}
          to <strong className="font-mono">{statusDialog?.newStatus}</strong>?
        </p>
        {statusDialog?.newStatus === 'SUSPENDED' && (
          <p className="mt-2 text-xs text-oxblood font-semibold">
            Warning: Suspended users are immediately blocked from logging in and executing ledger transactions.
          </p>
        )}
      </Dialog>

      {/* Delete User Confirm Dialog (§6 & §7.6 - restates email in mono) */}
      <Dialog
        isOpen={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        title="Confirm Hard Deletion"
        confirmLabel="Hard Delete User"
        confirmVariant="destructive"
        onConfirm={confirmDelete}
        loading={actionLoading}
      >
        <p>
          Are you sure you want to permanently delete user{' '}
          <strong className="font-mono text-ink font-bold">
            {deleteDialog?.email}
          </strong>
          ?
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          Per PRD requirements, hard deletion permanently removes the user and associated records. Deletion is rejected by the system if the user holds an account with non-zero balance.
        </p>
      </Dialog>
    </div>
  );
};
