import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { DefinitionList } from '../../components/ui/DefinitionList.js';
import { Panel } from '../../components/ui/Panel.js';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    usersCount: 0,
    pendingOnboardingCount: 0,
    auditLogsCount: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, onbRes, auditRes] = await Promise.all([
          apiRequest('/admin/users?limit=1'),
          apiRequest('/admin/onboarding?status=SUBMITTED&limit=1'),
          apiRequest('/admin/audit-logs?limit=5'),
        ]);

        setMetrics({
          usersCount: usersRes.total || 0,
          pendingOnboardingCount: onbRes.total || 0,
          auditLogsCount: auditRes.total || 0,
        });

        setRecentLogs(auditRes.logs || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 text-left">
        <div className="h-8 w-48 bg-paper-sunk rounded-[2px] animate-pulse" />
        <div className="h-44 w-full bg-paper-sunk rounded-[2px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
              System Administration
            </h1>
            <Badge variant="slate-blue">OPERATOR</Badge>
          </div>
          <p className="text-[13px] text-ink-soft mt-1">
            Platform governance, immutable audit monitoring, and queue adjudication.
          </p>
        </div>
      </div>

      {/* System State Statement Panel (§7.3/7.6) */}
      <div className="bg-paper-raised border border-rule rounded-[2px] p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Highlight Queue Statement */}
        <div className="md:col-span-7 space-y-4">
          <div className="text-[11.5px] font-mono uppercase tracking-[0.06em] text-ink-soft font-semibold select-none">
            PENDING ADJUDICATION QUEUE
          </div>

          <div className="font-mono text-[40px] leading-[44px] font-medium text-ink tabular-nums">
            {metrics.pendingOnboardingCount}{' '}
            <span className="text-xl font-sans text-ink-soft font-normal">
              dossiers awaiting review
            </span>
          </div>

          <p className="text-[13.5px] text-ink-soft leading-relaxed">
            Applicant submissions require identity document verification before double-entry accounts can be activated.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to="/admin/onboarding"
              className="text-xs font-sans font-semibold text-green hover:underline"
            >
              Open Onboarding Queue →
            </Link>
            <span className="text-rule select-none">•</span>
            <Link
              to="/admin/users"
              className="text-xs font-sans font-semibold text-ink hover:underline"
            >
              Directory of Users →
            </Link>
            <span className="text-rule select-none">•</span>
            <Link
              to="/admin/audit"
              className="text-xs font-sans font-semibold text-ink hover:underline"
            >
              Audit Trail →
            </Link>
          </div>
        </div>

        {/* Right: Ruled Definition List */}
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-rule pt-6 md:pt-0 md:pl-8">
          <div className="text-[11.5px] font-mono uppercase tracking-[0.06em] text-ink-soft font-semibold mb-3 select-none">
            System Ledger Stats
          </div>
          <DefinitionList
            items={[
              { label: 'Registered Users', value: metrics.usersCount, isMono: true },
              { label: 'Pending Onboardings', value: metrics.pendingOnboardingCount, isMono: true },
              { label: 'Audit Records', value: metrics.auditLogsCount, isMono: true },
              { label: 'Audit Protocol', value: 'APPEND-ONLY', isMono: true },
              { label: 'Platform Invariant', value: '100% Balanced', isMono: true },
            ]}
          />
        </div>
      </div>

      {/* Recent Audit Log Snapshot (§7.8) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[22px] leading-7 font-medium text-ink">
            Latest Audit Log Records
          </h2>
          <Link
            to="/admin/audit"
            className="text-xs font-sans font-semibold text-green hover:underline"
          >
            Inspect full trail →
          </Link>
        </div>

        <div className="w-full overflow-x-auto border-t-2 border-t-rule-strong border-b border-b-rule">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper-sunk border-b border-rule">
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Timestamp (UTC)
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Actor
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Action Code
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
                >
                  Target
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-[14px]">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-soft font-mono text-xs">
                    No recent audit events recorded.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="h-10 hover:bg-paper-sunk/60 transition-colors">
                    <td className="py-2 px-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 16)}
                    </td>
                    <td className="py-2 px-4 font-mono text-xs text-ink truncate max-w-[200px]">
                      {log.user?.email || log.actorId}
                    </td>
                    <td className="py-2 px-4 font-mono text-xs font-semibold text-ink">
                      {log.action}
                    </td>
                    <td className="py-2 px-4 font-mono text-xs text-ink-soft">
                      {log.resourceType}
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
