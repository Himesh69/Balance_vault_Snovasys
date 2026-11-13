import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Banner } from '../../components/ui/Banner.js';
import { DefinitionList } from '../../components/ui/DefinitionList.js';
import { Panel } from '../../components/ui/Panel.js';

export const AdminOnboarding: React.FC = () => {
  const [onboardings, setOnboardings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [loading, setLoading] = useState(true);

  // Selected dossier for inline / detail review view (§7.7)
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
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
    setSubmitting(true);
    try {
      await apiRequest(`/admin/onboarding/${onboardingId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: reviewNotes.trim() || 'Approved by administrator' }),
      });
      setFeedback({
        type: 'success',
        text: 'Application APPROVED. Primary user account provisioned successfully.',
      });
      setSelectedRecord(null);
      setReviewNotes('');
      fetchQueue();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Approval failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    if (!reviewNotes.trim()) {
      setFeedback({ type: 'error', text: 'A rejection reason is required per audit protocol.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await apiRequest(`/admin/onboarding/${selectedRecord.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: reviewNotes.trim() }),
      });
      setFeedback({
        type: 'success',
        text: 'Application REJECTED. Applicant requested to revise and resubmit.',
      });
      setSelectedRecord(null);
      setRejecting(false);
      setReviewNotes('');
      fetchQueue();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
            Onboarding Queue
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            Review applicant regulatory dossiers, evaluate credentials, approve or reject applications.
          </p>
        </div>
      </div>

      {feedback && (
        <Banner
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Underline Tabs (§7.7 & §6) */}
      <div className="border-b border-rule flex items-center gap-6 text-sm font-sans select-none">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('SUBMITTED');
            setSelectedRecord(null);
          }}
          className={`pb-2.5 font-medium transition-colors ${
            statusFilter === 'SUBMITTED'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Pending Review
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter('APPROVED');
            setSelectedRecord(null);
          }}
          className={`pb-2.5 font-medium transition-colors ${
            statusFilter === 'APPROVED'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter('REJECTED');
            setSelectedRecord(null);
          }}
          className={`pb-2.5 font-medium transition-colors ${
            statusFilter === 'REJECTED'
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          Rejected
        </button>
        <button
          type="button"
          onClick={() => {
            setStatusFilter('');
            setSelectedRecord(null);
          }}
          className={`pb-2.5 font-medium transition-colors ${
            statusFilter === ''
              ? 'border-b-2 border-b-green font-semibold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          All Dossiers
        </button>
      </div>

      {/* Detail Review View (if selected record exists per spec §7.7) */}
      {selectedRecord ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-rule">
            <div>
              <span className="text-xs font-mono uppercase text-ink-soft">
                Application Review
              </span>
              <h2 className="font-serif text-2xl font-medium text-ink flex items-center gap-3">
                <span>{selectedRecord.legalName || selectedRecord.user?.fullName}</span>
                <Badge variant={selectedRecord.status === 'APPROVED' ? 'green' : selectedRecord.status === 'REJECTED' ? 'oxblood' : 'brass'}>
                  {selectedRecord.status}
                </Badge>
              </h2>
            </div>
            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
              ← Back to Queue
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left column: submitted data as a ruled definition list (§7.7) */}
            <div className="md:col-span-7">
              <Panel hasDocumentHeader title="Applicant Dossier">
                <DefinitionList
                  items={[
                    { label: 'Reference ID', value: selectedRecord.id, isMono: true },
                    { label: 'Applicant User ID', value: selectedRecord.userId, isMono: true },
                    { label: 'Registered Email', value: selectedRecord.user?.email, isMono: true },
                    { label: 'Legal Full Name', value: selectedRecord.legalName },
                    { label: 'Date of Birth', value: selectedRecord.dateOfBirth, isMono: true },
                    { label: 'Phone Number', value: selectedRecord.phoneNumber, isMono: true },
                    { label: 'Residential Address', value: `${selectedRecord.streetAddress || ''}, ${selectedRecord.city || ''}, ${selectedRecord.country || ''}` },
                    { label: 'Identification Type', value: selectedRecord.idType, isMono: true },
                    { label: 'Identification Number', value: selectedRecord.idNumber, isMono: true },
                    { label: 'Occupation', value: selectedRecord.occupation },
                    { label: 'Source of Funds', value: selectedRecord.sourceOfFunds },
                    { label: 'Submission Timestamp', value: selectedRecord.submittedAt ? new Date(selectedRecord.submittedAt).toISOString().replace('T', ' ').substring(0, 19) : '—', isMono: true },
                  ]}
                />
              </Panel>
            </div>

            {/* Right column: Decision Panel & Mini Timeline (§7.7) */}
            <div className="md:col-span-5 space-y-6">
              {/* Decision Panel */}
              {selectedRecord.status === 'SUBMITTED' ? (
                <Panel hasDocumentHeader title="Adjudication">
                  <p className="text-xs text-ink-soft mb-4">
                    Approve to automatically provision the user's primary clearing account, or reject with a documented rationale.
                  </p>

                  <div className="space-y-3 mb-5">
                    <label className="block text-[13px] font-semibold text-ink select-none">
                      Decision Notes (Required for rejection)
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Identity documents verified against official registry…"
                      className="w-full p-2.5 bg-paper text-sm border border-rule rounded-[2px] focus:outline-none focus:border-green font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-rule">
                    <Button
                      type="button"
                      variant="destructive-outline"
                      onClick={handleReject}
                      loading={submitting}
                    >
                      Reject Application
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleApprove(selectedRecord.id)}
                      loading={submitting}
                    >
                      Approve Dossier
                    </Button>
                  </div>
                </Panel>
              ) : (
                <Panel hasDocumentHeader title="Adjudication Record">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs font-mono uppercase text-ink-soft block">
                        Final Decision
                      </span>
                      <Badge variant={selectedRecord.status === 'APPROVED' ? 'green' : 'oxblood'}>
                        {selectedRecord.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs font-mono uppercase text-ink-soft block">
                        Reviewer Rationale
                      </span>
                      <p className="text-ink mt-0.5 italic">
                        "{selectedRecord.reviewNotes || 'No notes recorded.'}"
                      </p>
                    </div>
                  </div>
                </Panel>
              )}

              {/* Mini Decision Timeline (§7.7 - vertical 1px rule with square markers) */}
              <div className="p-4 bg-paper-raised border border-rule rounded-[2px]">
                <span className="text-[11.5px] font-mono uppercase text-ink-soft font-semibold block mb-3">
                  Decision Audit Timeline
                </span>
                <div className="border-l border-rule ml-2 pl-4 space-y-4 text-xs font-mono text-ink">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-green border border-rule-strong select-none" />
                    <span className="text-ink-soft block text-[11px]">
                      {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toISOString().split('T')[0] : '—'}
                    </span>
                    <span className="font-semibold">Dossier Created</span>
                  </div>

                  {selectedRecord.submittedAt && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-brass border border-rule-strong select-none" />
                      <span className="text-ink-soft block text-[11px]">
                        {new Date(selectedRecord.submittedAt).toISOString().split('T')[0]}
                      </span>
                      <span className="font-semibold">Submitted by Applicant</span>
                    </div>
                  )}

                  {selectedRecord.reviewedAt && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-ink border border-rule-strong select-none" />
                      <span className="text-ink-soft block text-[11px]">
                        {new Date(selectedRecord.reviewedAt).toISOString().split('T')[0]}
                      </span>
                      <span className="font-semibold">
                        Adjudicated: {selectedRecord.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Queue Table (§7.7) */
        <div className="w-full overflow-x-auto border-t-2 border-t-rule-strong border-b border-b-rule">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper-sunk border-b border-rule">
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Reference ID
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Applicant
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Submitted (UTC)
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-[14px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft font-mono text-xs">
                    Loading queue dossiers…
                  </td>
                </tr>
              ) : onboardings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-soft">
                    <p className="font-serif text-lg text-ink mb-1">
                      No dossiers in queue matching this filter.
                    </p>
                    <p className="text-xs text-ink-faint">
                      New applicant submissions will appear here for verification.
                    </p>
                  </td>
                </tr>
              ) : (
                onboardings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="h-11 cursor-pointer hover:bg-paper-sunk/60 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-xs text-ink font-semibold">
                      {item.id.substring(0, 13)}…
                    </td>
                    <td className="py-2.5 px-4 text-ink">
                      <div className="font-semibold text-sm">
                        {item.legalName || item.user?.fullName || 'Anonymous'}
                      </div>
                      <div className="font-mono text-xs text-ink-soft">
                        {item.user?.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                      {item.submittedAt ? new Date(item.submittedAt).toISOString().replace('T', ' ').substring(0, 16) : 'Draft (Not submitted)'}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'oxblood' : 'brass'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(item);
                        }}
                        className="text-xs font-semibold text-green hover:underline select-none"
                      >
                        Inspect Dossier →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
