import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  X
} from 'lucide-react';

export const AdminOnboarding: React.FC = () => {
  const [onboardings, setOnboardings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [loading, setLoading] = useState(true);
  const [inspectModal, setInspectModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const data = await apiRequest(`/admin/onboarding${query}`);
      setOnboardings(data.onboardings || []);
    } catch (err: any) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleApprove = async (onboardingId: string) => {
    setFeedback(null);
    try {
      await apiRequest(`/admin/onboarding/${onboardingId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: 'Approved by administrator' }),
      });
      setFeedback({
        type: 'success',
        text: 'Application APPROVED! Primary account successfully provisioned for user.',
      });
      setInspectModal(null);
      fetchQueue();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Approval failed.' });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await apiRequest(`/admin/onboarding/${rejectModal.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: reviewNotes.trim() || 'Requirements not met' }),
      });
      setFeedback({
        type: 'success',
        text: 'Application REJECTED. User has been requested to revise and re-submit.',
      });
      setRejectModal(null);
      setInspectModal(null);
      setReviewNotes('');
      fetchQueue();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review identity submissions, inspect proof of identity, approve accounts or request changes.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['SUBMITTED', 'APPROVED', 'REJECTED', ''].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st || 'ALL'}
            </button>
          ))}
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

      {/* Applications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading applications...</p>
          </div>
        ) : onboardings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No applications matching filter ({statusFilter || 'ALL'}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Applicant</th>
                  <th className="px-6 py-3.5">ID Info</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submitted At</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {onboardings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.legalName || item.user?.fullName}
                      </div>
                      <div className="text-slate-500 font-mono">{item.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.idType || '—'}</div>
                      <div className="text-slate-400 font-mono">{item.idNumber || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Not submitted'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setInspectModal(item)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                      >
                        Inspect Dossier
                      </button>

                      {item.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(item)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Dossier Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                Application Dossier: {inspectModal.legalName || inspectModal.user?.fullName}
              </h3>
              <button onClick={() => setInspectModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
                <div><span className="font-semibold text-slate-400 uppercase">Legal Name:</span> <span className="font-bold text-slate-900">{inspectModal.legalName}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">DOB:</span> <span className="font-bold text-slate-900">{inspectModal.dateOfBirth}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">Phone:</span> <span className="font-bold text-slate-900">{inspectModal.phoneNumber}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">Email:</span> <span className="font-mono text-slate-900">{inspectModal.user?.email}</span></div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 uppercase">Address & Location</div>
                <div>Street: {inspectModal.streetAddress}</div>
                <div>City/State/Zip: {inspectModal.city}, {inspectModal.state} {inspectModal.postalCode}</div>
                <div>Country: {inspectModal.country}</div>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 uppercase">Identity & Source of Funds</div>
                <div>ID Type: {inspectModal.idType} • Number: <span className="font-mono font-bold">{inspectModal.idNumber}</span></div>
                <div>Occupation: {inspectModal.occupation}</div>
                <div>Source of Funds: {inspectModal.sourceOfFunds}</div>
              </div>

              {inspectModal.reviewNotes && (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl">
                  <span className="font-bold">Prior Reviewer Notes:</span> {inspectModal.reviewNotes}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>

              {inspectModal.status === 'SUBMITTED' && (
                <>
                  <button
                    onClick={() => handleApprove(inspectModal.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => {
                      setRejectModal(inspectModal);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    Reject Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-2">Reject Onboarding Application</h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify the reason for rejection. The applicant will be able to view this reason, correct their details, and re-submit.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Reason / Revision Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Government ID number does not match format, or address is incomplete."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

