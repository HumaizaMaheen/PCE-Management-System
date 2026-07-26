import React, { useState, useEffect } from 'react';
import { getAuditLogs, AuditLogData } from '../../services/adminService';

export default function AuditLogs() {
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Log JSON View Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (actionFilter) params.action = actionFilter;
      if (search) params.search = search;

      const res = await getAuditLogs(params);
      if (res && res.success && Array.isArray(res.data)) {
        setLogs(res.data);
        setTotalCount(res.pagination?.total ?? res.data.length);
        setTotalPages(res.pagination?.totalPages ?? 1);
      }
    } catch (err: any) {
      if (!err.message?.includes('403')) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch system audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">
            System Audit Trail Logs {totalCount > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({totalCount})</span>}
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Immutable log of all user actions, security decisions, record mutations, and IP signatures.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 material-icons text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search by Action, Entity, User Name, or IP Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F4F6F5] pl-10 pr-4 py-2 border border-transparent rounded-lg text-xs font-inter focus:outline-none focus:bg-white focus:border-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-[#F4F6F5] px-3 py-2 border border-transparent rounded-lg text-xs font-poppins font-medium text-gray-700 outline-none"
          >
            <option value="">All Action Events</option>
            <option value="APPROVE_FIRST_PAYMENT_CREATE_MEMBER">Approve & Activate Member</option>
            <option value="APPROVE_RECURRING_PAYMENT">Approve Recurring Payment</option>
            <option value="REJECT_PAYMENT">Reject Payment</option>
            <option value="UPLOAD_PAYMENT_RECEIPT">Upload Receipt</option>
            <option value="CREATE_MANUAL_TRANSACTION">Manual Ledger Entry</option>
            <option value="UPDATE_SYSTEM_SETTINGS">Update System Settings</option>
          </select>
          <button
            type="submit"
            className="bg-primary hover:bg-[#00523C] text-white px-5 py-2 rounded-lg text-xs font-bold font-poppins shadow-sm transition"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Audit Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">fingerprint</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No audit log entries found</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1">
            System actions such as approvals, payment verifications, and settings edits will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User / Actor</th>
                  <th className="px-5 py-3">Action Event</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAFBFB] transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-gray-500">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{l.user_name || 'System / Automated'}</p>
                      <p className="text-[10px] text-gray-400">{l.user_email || 'System Account'}</p>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-primary text-[11px]">
                      {l.action}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      <span className="font-semibold">{l.entity_name}</span>
                      {l.entity_id ? <span className="text-gray-400 font-mono ml-1">#{l.entity_id}</span> : null}
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-500 text-[11px]">
                      {l.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-[11px] font-mono font-bold transition"
                      >
                        {'{ } Payloads'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 font-poppins">
              <span className="text-[11px] text-gray-400">
                Page <strong className="text-gray-700 font-bold">{page}</strong> of <strong className="text-gray-700 font-bold">{totalPages}</strong>
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-xl w-full p-6 space-y-4 animate-fadeIn border border-gray-100 font-inter">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold font-poppins text-[#333333] flex items-center gap-2">
                <span className="material-icons text-primary">code</span>
                Audit Event Payload Details (#{selectedLog.id})
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAFBFB] p-3 rounded border border-gray-100 grid grid-cols-2 gap-2 font-poppins">
                <div>
                  <span className="text-gray-400 text-[10px] block">Action Event:</span>
                  <span className="font-bold text-primary">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">User Agent:</span>
                  <span className="text-[10px] text-gray-600 truncate block">{selectedLog.user_agent || 'N/A'}</span>
                </div>
              </div>

              {selectedLog.new_values && (
                <div>
                  <span className="font-bold font-poppins text-gray-700 block mb-1">New Values Payload:</span>
                  <pre className="bg-[#1E293B] text-green-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 custom-scrollbar">
                    {JSON.stringify(typeof selectedLog.new_values === 'string' ? JSON.parse(selectedLog.new_values) : selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <span className="font-bold font-poppins text-gray-700 block mb-1">Old Values (Previous State):</span>
                  <pre className="bg-[#1E293B] text-red-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-40 custom-scrollbar">
                    {JSON.stringify(typeof selectedLog.old_values === 'string' ? JSON.parse(selectedLog.old_values) : selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-primary text-white rounded text-xs font-bold font-poppins"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
