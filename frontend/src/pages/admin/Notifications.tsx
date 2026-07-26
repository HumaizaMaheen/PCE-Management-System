import React, { useState, useEffect } from 'react';
import { getNotificationsLog, deleteNotificationLog, NotificationLogData } from '../../services/adminService';

export default function Notifications() {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [notifications, setNotifications] = useState<NotificationLogData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Selected Notification Preview Modal
  const [selectedNotif, setSelectedNotif] = useState<NotificationLogData | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (search) params.search = search;

      const res = await getNotificationsLog(params);
      if (res.success) {
        setNotifications(res.data);
        setTotalCount(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedStatus, page]);

  const handleDelete = async (id: number | string) => {
    if (!window.confirm(id === 'all' ? 'Are you sure you want to CLEAR ALL notification logs?' : 'Are you sure you want to delete this notification log?')) return;
    try {
      setDeleting(true);
      const res = await deleteNotificationLog(id);
      if (res.success) {
        if (id === 'all') {
          setNotifications([]);
          setTotalCount(0);
        } else {
          setNotifications(prev => prev.filter(n => n.id !== id));
          setTotalCount(prev => Math.max(0, prev - 1));
        }
        if (selectedNotif && selectedNotif.id === id) {
          setSelectedNotif(null);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete notification.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-accent/10 text-accent border border-accent/20';
      case 'Sent':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Failed':
        return 'bg-danger/10 text-danger border border-danger/20';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">
            Notifications & Messaging Log {totalCount > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({totalCount})</span>}
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Dispatch history of outgoing email notifications, portal alerts, and WhatsApp message logs.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            disabled={deleting}
            onClick={() => handleDelete('all')}
            className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold font-poppins transition border border-red-200 flex items-center gap-1 self-start md:self-auto cursor-pointer"
          >
            <span className="material-icons text-sm">delete_sweep</span>
            Clear All Notifications
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap -mb-px text-xs font-semibold font-poppins gap-1">
          {['All', 'Pending', 'Sent', 'Failed'].map((status) => (
            <button
              key={status}
              onClick={() => { setSelectedStatus(status); setPage(1); }}
              className={`px-4 py-2.5 border-b-2 transition-all ${
                selectedStatus === status
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {status} Dispatches
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 material-icons text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search by Recipient Email, Subject, Message Body, or Member Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F4F6F5] pl-10 pr-4 py-2 border border-transparent rounded-lg text-xs font-inter focus:outline-none focus:bg-white focus:border-primary/20 transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-[#00523C] text-white px-5 py-2 rounded-lg text-xs font-bold font-poppins shadow-sm transition"
        >
          Search
        </button>
      </form>

      {/* Notifications Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">email</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No notification logs found</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1 max-w-xs">
            Outgoing email notifications for application updates, payment receipts, and member activations will be listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Subject / Title</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created At</th>
                  <th className="px-5 py-3 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-[#FAFBFB] transition-colors">
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold font-poppins text-[10px] text-gray-700">
                        {n.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{n.recipient}</p>
                      <p className="text-[10px] text-gray-400">{n.member_name || n.applicant_name || 'System Recipient'}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-700 max-w-xs truncate">
                      {n.subject || 'Notification Dispatch'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold font-poppins ${getStatusBadge(n.status)}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-gray-500">
                      {new Date(n.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedNotif(n)}
                          className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1 rounded text-[11px] font-bold font-poppins transition cursor-pointer"
                        >
                          View Content
                        </button>
                        <button
                          disabled={deleting}
                          onClick={() => handleDelete(n.id)}
                          className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white p-1.5 rounded transition cursor-pointer border border-red-200"
                          title="Delete Notification Log"
                        >
                          <span className="material-icons text-xs block">delete</span>
                        </button>
                      </div>
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

      {/* Message Preview Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn border border-gray-100 font-inter">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold font-poppins text-[#333333] flex items-center gap-2">
                <span className="material-icons text-primary">mark_email_read</span>
                Notification Dispatch Content
              </h3>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FAFBFB] p-3 rounded border border-gray-100 space-y-1">
                <p><strong>To:</strong> {selectedNotif.recipient}</p>
                <p><strong>Subject:</strong> {selectedNotif.subject}</p>
                <p><strong>Channel:</strong> {selectedNotif.channel} | <strong>Status:</strong> {selectedNotif.status}</p>
              </div>

              <div>
                <span className="font-bold font-poppins text-gray-700 block mb-1">Message Body:</span>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-800 font-sans text-xs leading-relaxed max-h-52 overflow-y-auto">
                  {selectedNotif.body}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedNotif(null)}
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
