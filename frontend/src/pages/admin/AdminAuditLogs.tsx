import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import {
  History,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Calendar,
  User,
  X,
  Code
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Immutable Audit Trail</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Append-Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Cryptographically guaranteed record of 100% of critical transactions, role changes, and onboarding decisions.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl">
          Total Recorded Events: {total}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by Action (e.g. LEDGER, ONBOARDING, USER)..."
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <select
          value={resourceTypeFilter}
          onChange={(e) => setResourceTypeFilter(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">All Resource Types</option>
          <option value="USER">USER</option>
          <option value="ONBOARDING">ONBOARDING</option>
          <option value="ACCOUNT">ACCOUNT</option>
          <option value="LEDGER_TRANSACTION">LEDGER_TRANSACTION</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading audit events...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No audit logs matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Resource</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {log.user?.fullName || (log.actorId === 'SYSTEM' ? 'SYSTEM' : log.actorId)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {log.user?.email || log.actorId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{log.resourceType}</span>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                        {log.resourceId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {log.ip || 'internal'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  Audit Snapshot: {selectedLog.action}
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
                <div><span className="font-semibold text-slate-400 uppercase">Log ID:</span> <span className="font-mono">{selectedLog.id}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">Timestamp:</span> <span>{new Date(selectedLog.createdAt).toISOString()}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">Actor:</span> <span>{selectedLog.user?.email || selectedLog.actorId}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">Resource:</span> <span>{selectedLog.resourceType} ({selectedLog.resourceId})</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">Client IP:</span> <span className="font-mono">{selectedLog.ip || 'N/A'}</span></div>
                <div><span className="font-semibold text-slate-400 uppercase">User Agent:</span> <span className="truncate block font-mono">{selectedLog.userAgent || 'N/A'}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Metadata Snapshot (JSON)
                </label>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

