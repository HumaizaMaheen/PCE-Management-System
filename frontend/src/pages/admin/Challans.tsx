import { useState, useEffect } from 'react';
import { getChallans, generateMonthlyDues, sendChallanEmail, ChallanData } from '../../services/adminService';
import api from '../../services/api';

export default function Challans() {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [challans, setChallans] = useState<ChallanData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dues generation modal state
  const [isDuesModalOpen, setIsDuesModalOpen] = useState<boolean>(false);
  const [duesPeriod, setDuesPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [genMessage, setGenMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email status states
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ [id: number]: { type: 'success' | 'error'; text: string } }>({});

  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { page, limit };
      if (selectedStatus !== 'All') {
        params.status = selectedStatus;
      }
      if (search) {
        params.search = search;
      }

      const res = await getChallans(params);
      if (res.success) {
        setChallans(res.data);
        setTotalCount(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [selectedStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchChallans();
  };

  // Download authenticated PDF blob
  const handleDownloadPDF = async (id: number, challanNumber: string) => {
    try {
      const response = await api.get(`/challans/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${challanNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download PDF challan. Please try again.');
    }
  };

  // Generate WhatsApp Share Link
  const handleShareWhatsApp = (challan: ChallanData) => {
    const isMember = challan.member_id !== null;
    const name = isMember ? challan.member_name : challan.applicant_name;
    const refText = isMember 
      ? `Membership ID: ${challan.membership_id}` 
      : `Application Ref ID: ${challan.application_id_ref}`;

    const text = `Dear ${name}, your Pakistan Chamber of Education dues challan is ready.\n\n` +
      `Challan No: ${challan.challan_number}\n` +
      `${refText}\n` +
      `Total Payable: PKR ${challan.total_amount}\n` +
      `Due Date: ${new Date(challan.due_date).toLocaleDateString()}\n\n` +
      `Download your Challan PDF here: http://localhost:5000/api/challans/public/${challan.challan_number}/pdf\n\n` +
      `Please deposit the dues and WhatsApp back the bank receipt. Thank you!`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  // Trigger Challan Email Sending
  const handleSendEmail = async (id: number) => {
    try {
      setEmailSendingId(id);
      setEmailStatus(prev => ({ ...prev, [id]: { type: 'success', text: '' } }));
      
      const res = await sendChallanEmail(id);
      if (res.success) {
        setEmailStatus(prev => ({ 
          ...prev, 
          [id]: { type: 'success', text: 'Email dispatched successfully!' } 
        }));
      }
    } catch (err: any) {
      setEmailStatus(prev => ({ 
        ...prev, 
        [id]: { type: 'error', text: err.response?.data?.message || err.message || 'Failed to send email' } 
      }));
    } finally {
      setEmailSendingId(null);
    }
  };

  // Execute recurring monthly dues generation
  const handleGenerateDuesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenLoading(true);
      setGenMessage(null);
      
      const res = await generateMonthlyDues(duesPeriod);
      if (res.success) {
        setGenMessage({ type: 'success', text: res.message });
        fetchChallans();
        setTimeout(() => {
          setIsDuesModalOpen(false);
          setGenMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      setGenMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Failed to generate monthly dues' 
      });
    } finally {
      setGenLoading(false);
    }
  };

  // Helpers: Badge designs
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Unpaid':
        return 'bg-accent/10 text-accent border border-accent/20';
      case 'Paid':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Expired':
        return 'bg-danger/10 text-danger border border-danger/20';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">
            Challan Management {totalCount > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({totalCount})</span>}
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Generate recurring subscription dues, view invoices, download PDFs, and dispatch challans to members.
          </p>
        </div>
        <button
          onClick={() => setIsDuesModalOpen(true)}
          className="bg-primary hover:bg-[#00523C] text-white px-4 py-2.5 rounded-lg text-xs font-bold font-poppins flex items-center gap-1.5 shadow-sm transition self-start md:self-auto"
        >
          <span className="material-icons text-sm">schedule_send</span>
          Generate Monthly Dues
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap -mb-px text-xs font-semibold font-poppins gap-1">
          {['All', 'Unpaid', 'Paid', 'Expired', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => { setSelectedStatus(status); setPage(1); }}
              className={`px-4 py-2.5 border-b-2 transition-all ${
                selectedStatus === status
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {status}
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
            placeholder="Search by Challan Number, Member/Applicant Name, or Membership ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F4F6F5] pl-10 pr-4 py-2 border border-transparent rounded-lg text-xs font-inter focus:outline-none focus:bg-white focus:border-primary/20 transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-[#00523C] text-white px-5 py-2 rounded-lg text-xs font-bold font-poppins transition shadow-sm"
        >
          Search
        </button>
      </form>

      {/* Challan Invoices Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
          {error}
        </div>
      ) : challans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">receipt</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No invoices generated</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1 max-w-xs">
            There are no dues records matching this criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">Challan No</th>
                  <th className="px-5 py-3">Payer Details</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {challans.map((challan) => {
                  const isMember = challan.member_id !== null;
                  const name = isMember ? challan.member_name : challan.applicant_name;
                  const refLabel = isMember 
                    ? `Member ID: ${challan.membership_id}` 
                    : `Applicant Reference`;

                  return (
                    <tr key={challan.id} className="hover:bg-[#FAFBFB] transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-800 font-mono">
                        {challan.challan_number}
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-semibold text-gray-700">{name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{refLabel}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold text-primary">
                        PKR {parseFloat(challan.total_amount as any).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(challan.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold font-poppins ${getStatusBadge(challan.status)}`}>
                          {challan.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* Download */}
                          <button
                            title="Download PDF"
                            onClick={() => handleDownloadPDF(challan.id, challan.challan_number)}
                            className="bg-[#F4F6F5] hover:bg-primary/10 hover:text-primary text-gray-500 p-2 rounded-lg transition"
                          >
                            <span className="material-icons text-sm block">download</span>
                          </button>

                          {/* Email */}
                          <button
                            title="Send via Email"
                            disabled={emailSendingId === challan.id}
                            onClick={() => handleSendEmail(challan.id)}
                            className="bg-[#F4F6F5] hover:bg-primary/10 hover:text-primary text-gray-500 p-2 rounded-lg transition disabled:opacity-55"
                          >
                            <span className="material-icons text-sm block">
                              {emailSendingId === challan.id ? 'sync' : 'email'}
                            </span>
                          </button>

                          {/* WhatsApp */}
                          <button
                            title="Share via WhatsApp"
                            onClick={() => handleShareWhatsApp(challan)}
                            className="bg-[#F4F6F5] hover:bg-accent/15 hover:text-accent text-gray-500 p-2 rounded-lg transition"
                          >
                            <span className="material-icons text-sm block">share</span>
                          </button>
                        </div>

                        {/* Email status feedback */}
                        {emailStatus[challan.id] && emailStatus[challan.id].text && (
                          <span className={`block text-[9px] mt-1 font-semibold ${
                            emailStatus[challan.id].type === 'success' ? 'text-primary' : 'text-danger'
                          }`}>
                            {emailStatus[challan.id].text}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 font-poppins">
              <span className="text-[11px] text-gray-400">
                Page <strong className="text-gray-700 font-bold">{page}</strong> of <strong className="text-gray-700 font-bold">{totalPages}</strong>
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Dues Dialog Modal */}
      {isDuesModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              onClick={() => setIsDuesModalOpen(false)}
              className="fixed inset-0 bg-gray-500/75 transition-opacity" 
              aria-hidden="true"
            ></div>

            {/* Modal Body */}
            <div className="inline-block align-bottom bg-white rounded-[12px] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              
              {/* Header */}
              <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-base font-bold font-poppins">Generate Monthly Dues</h3>
                  <p className="text-[10px] opacity-80 uppercase tracking-wider mt-0.5">Recurring billing engine</p>
                </div>
                <button 
                  onClick={() => setIsDuesModalOpen(false)}
                  className="text-white/80 hover:text-white focus:outline-none"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleGenerateDuesSubmit}>
                <div className="p-6 space-y-4 text-xs font-inter">
                  <p className="text-gray-500 leading-relaxed">
                    This will check all <strong>Active Members</strong> in the system and automatically generate a monthly subscription challan of <strong>PKR 2,000</strong> (or configured settings amount) for the selected period. Any outstanding dues from prior months will be bundled.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wide font-poppins block">
                      Target Billing Period (Month)
                    </label>
                    <input
                      type="month"
                      value={duesPeriod}
                      onChange={(e) => setDuesPeriod(e.target.value)}
                      className="w-full bg-[#F4F6F5] px-3.5 py-2.5 border border-transparent rounded-lg font-poppins focus:outline-none focus:bg-white focus:border-primary/20 transition"
                      required
                    />
                  </div>

                  {genMessage && (
                    <div className={`p-3 rounded-lg font-semibold flex items-center gap-2 border ${
                      genMessage.type === 'success'
                        ? 'bg-primary/5 text-primary border-primary/10'
                        : 'bg-danger/5 text-danger border-danger/10'
                    }`}>
                      <span className="material-icons text-sm">
                        {genMessage.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      <span>{genMessage.text}</span>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="bg-gray-50 px-6 py-3.5 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsDuesModalOpen(false)}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 px-4 py-2 rounded-lg font-bold font-poppins transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={genLoading}
                    className="bg-primary hover:bg-[#00523C] text-white px-5 py-2 rounded-lg font-bold font-poppins flex items-center gap-1.5 shadow-sm transition disabled:opacity-55"
                  >
                    {genLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Start Billing Engine
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
