import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (actionFilter) query.append('action', actionFilter);
      if (resourceTypeFilter) query.append('resourceType', resourceTypeFilter);
      query.append('limit', '50');

      const data = await apiRequest(`/admin/audit-logs?${query.toString()}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceTypeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const copyPayload = (payload: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
              Audit Log Trail
            </h1>
            <Badge variant="slate-blue">IMMUTABLE</Badge>
          </div>
          <p className="text-[13px] text-ink-soft mt-1">
            System-wide append-only ledger of authorization, identity, and fund movement events.
          </p>
        </div>
        <div className="text-xs font-mono text-ink-soft">
          Total Recorded Events: <span className="font-bold text-ink">{total}</span>
        </div>
      </div>

      {/* Flat Filter Row (§7.4/7.8) */}
      <div className="p-3 bg-paper-raised border border-rule flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="action-filter" className="text-xs font-mono uppercase text-ink-soft select-none">
            Action Code
          </label>
          <input
            id="action-filter"
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="e.g. USER, LEDGER, ONBOARDING…"
            className="h-8 px-2.5 bg-paper text-xs font-mono border border-rule rounded-[2px] focus:outline-none focus:border-green"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="resource-filter" className="text-xs font-mono uppercase text-ink-soft select-none">
            Resource
          </label>
          <select
            id="resource-filter"
            value={resourceTypeFilter}
            onChange={(e) => setResourceTypeFilter(e.target.value)}
            className="h-8 px-2 bg-paper text-xs font-mono border border-rule rounded-[2px] focus:outline-none focus:border-green"
          >
            <option value="">All Resource Types</option>
            <option value="USER">USER</option>
            <option value="ONBOARDING">ONBOARDING</option>
            <option value="ACCOUNT">ACCOUNT</option>
            <option value="LEDGER_TRANSACTION">LEDGER_TRANSACTION</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {(actionFilter || resourceTypeFilter) && (
            <button
              type="button"
              onClick={() => {
                setActionFilter('');
                setResourceTypeFilter('');
              }}
              className="text-xs font-sans text-green hover:underline font-medium mr-2"
            >
              Reset
            </button>
          )}
          <Button variant="secondary" onClick={fetchLogs} className="h-8 text-xs px-3">
            Refresh
          </Button>
        </div>
      </div>

      {/* Ledger Table (2px top rule, 1px bottom rule, sitting directly on page per spec §6 & §7.8) */}
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
                Resource Target
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft select-none"
              >
                IP Address
              </th>
              <th
                scope="col"
                className="py-2.5 px-4 text-[11.5px] font-mono uppercase tracking-[0.06em] font-semibold text-ink-soft text-right select-none"
              >
                Payload
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule text-[14px]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-soft">
                  <p className="font-mono text-xs">Loading immutable audit trail…</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-soft">
                  <p className="font-serif text-lg text-ink mb-1">
                    No audit entries matching filter criteria.
                  </p>
                  <p className="text-xs text-ink-faint">
                    Events are recorded synchronously inside each database transaction.
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleExpand(log.id)}
                      className={`h-11 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-paper-raised' : 'hover:bg-paper-sunk/60'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-soft whitespace-nowrap">
                        {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-mono text-ink truncate max-w-[180px]">
                        {log.user?.email || log.actorId || 'SYSTEM'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold text-ink">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-soft">
                        <span className="text-ink font-medium">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="text-ink-faint ml-1">
                            ({log.resourceId.substring(0, 8)}…)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink-faint">
                        {log.ip || '127.0.0.1'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(log.id);
                          }}
                          className="text-xs font-mono text-green hover:underline select-none"
                        >
                          {isExpanded ? 'Hide' : 'Inspect'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable JSON Payload in mono <pre> on --paper-sunk (§7.8) */}
                    {isExpanded && (
                      <tr className="bg-paper-raised">
                        <td
                          colSpan={6}
                          className="p-4 border-l-[3px] border-l-rule-strong bg-paper-sunk/40"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono uppercase text-ink-soft font-semibold">
                              Metadata Payload ({log.action})
                            </span>
                            <button
                              type="button"
                              onClick={(e) => copyPayload(log.metadata, e)}
                              className="text-xs font-mono text-green hover:underline select-none"
                            >
                              Copy JSON
                            </button>
                          </div>
                          <pre className="p-3 bg-paper-sunk border border-rule text-xs font-mono text-ink overflow-x-auto rounded-[2px] leading-relaxed max-h-64">
                            {JSON.stringify(
                              {
                                id: log.id,
                                actorId: log.actorId,
                                action: log.action,
                                resourceType: log.resourceType,
                                resourceId: log.resourceId,
                                ip: log.ip,
                                userAgent: log.userAgent,
                                metadata: log.metadata,
                                recordedAt: log.createdAt,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Note per spec §7.8 */}
      <div className="pt-2 flex items-center justify-between text-[12.5px] text-ink-soft font-sans">
        <span>Audit entries are append-only.</span>
        <span className="font-mono text-xs text-ink-faint">
          Enforced by database permissions & immutability constraints.
        </span>
      </div>
    </div>
  );
};
