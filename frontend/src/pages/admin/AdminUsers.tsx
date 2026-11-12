import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import {
  Users,
  Search,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModal, setUserModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);
      query.append('limit', '50');

      const data = await apiRequest(`/admin/users?${query.toString()}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setActionFeedback(null);
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setActionFeedback({ type: 'success', text: `User status changed to ${newStatus}` });
      fetchUsers();
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Status change failed.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setActionFeedback(null);
    try {
      await apiRequest(`/admin/users/${deleteModal.id}`, {
        method: 'DELETE',
      });
      setActionFeedback({ type: 'success', text: `User ${deleteModal.email} hard-deleted.` });
      setDeleteModal(null);
      fetchUsers();
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message || 'Deletion failed.' });
    }
  };

  const viewUserDossier = async (userId: string) => {
    try {
      const detail = await apiRequest(`/admin/users/${userId}`);
      setSelectedUser(detail);
      setUserModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load user details.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user lifecycle, inspect onboarding dossiers, update statuses, or execute hard deletes.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl">
          Total Users: {total}
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-sm ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          Search
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Onboarding</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                      <div className="text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${
                          u.onboarding?.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.onboarding?.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : u.onboarding?.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.onboarding?.status || 'NO DATA'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.status}
                        onChange={(e) => handleStatusChange(u.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => viewUserDossier(u.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                      >
                        Dossier
                      </button>
                      <button
                        onClick={() => setDeleteModal(u)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hard Delete User"
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

      {/* User Dossier Modal */}
      {userModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">User Dossier & Profile</h3>
              <button onClick={() => setUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Full Name</span>
                  <p className="font-bold text-slate-800">{selectedUser.fullName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Email</span>
                  <p className="font-mono text-slate-800">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Role</span>
                  <p className="font-bold text-slate-800">{selectedUser.role}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">User Status</span>
                  <p className="font-bold text-emerald-600">{selectedUser.status}</p>
                </div>
              </div>

              {selectedUser.onboarding && (
                <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Onboarding Verification Data ({selectedUser.onboarding.status})
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Address: {selectedUser.onboarding.streetAddress}, {selectedUser.onboarding.city}, {selectedUser.onboarding.country}</div>
                    <div>Phone: {selectedUser.onboarding.phoneNumber || 'N/A'}</div>
                    <div>ID: {selectedUser.onboarding.idType} - {selectedUser.onboarding.idNumber}</div>
                    <div>Occupation: {selectedUser.onboarding.occupation || 'N/A'}</div>
                    <div>Source of Funds: {selectedUser.onboarding.sourceOfFunds || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setUserModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Confirm Hard Delete</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete user <span className="font-bold text-slate-900">{deleteModal.email}</span>?
            </p>
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl mt-3 font-medium">
              Note: Hard deletes permanently remove the record and all associated onboarding and empty accounts from the database. Non-zero balance accounts cannot be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

