import React, { useState, useEffect } from 'react';
import { 
  getPaymentQueue, 
  uploadPaymentReceipt, 
  verifyPayment, 
  deletePayment,
  getChallans, 
  getStoredApplications,
  PaymentData, 
  ChallanData,
  ApplicationData 
} from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function Payments() {
  const { user } = useAuth();
  const canVerify = user?.role === 'Super Admin' || user?.role === 'Finance Officer';

  // Queue state
  const [selectedStatus, setSelectedStatus] = useState<string>('Submitted'); // Default to Pending Queue
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Document Lightbox Modal State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('Payment Receipt Image');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [unpaidChallans, setUnpaidChallans] = useState<ChallanData[]>([]);
  const [selectedChallan, setSelectedChallan] = useState<ChallanData | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verification Review Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [verifySubmitting, setVerifySubmitting] = useState<boolean>(false);
  const [verifyMessage, setVerifyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Success WhatsApp Credentials Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [approvedMemberInfo, setApprovedMemberInfo] = useState<{
    memberName: string;
    membershipId: string;
    email: string;
    whatsappNo: string;
    generatedPassword: string;
  } | null>(null);

  // Fetch payment queue
  const fetchPaymentQueue = async () => {
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

      const res = await getPaymentQueue(params);
      if (res && res.success && Array.isArray(res.data)) {
        setPayments(res.data);
        setTotalCount(res.pagination?.total ?? res.data.length);
        setTotalPages(res.pagination?.totalPages ?? 1);
      }
    } catch (err: any) {
      if (!err.message?.includes('403')) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch payment verification queue');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentQueue();
  }, [selectedStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPaymentQueue();
  };

  // Open Upload Modal & Fetch Unpaid Challans & Approved Applications
  const handleOpenUploadModal = async () => {
    setIsUploadModalOpen(true);
    setUploadMessage(null);
    setSelectedChallan(null);
    setTransactionRef('');
    setAmountPaid('');
    setReceiptFile(null);
    
    try {
      const res = await getChallans({ status: 'Unpaid', limit: 50 });
      let list: ChallanData[] = res && res.success && Array.isArray(res.data) ? [...res.data] : [];

      // Combine with Approved Applications that need payment
      const apps = getStoredApplications().filter((a: ApplicationData) => a.status === 'Approved - Awaiting Payment');
      apps.forEach((a: ApplicationData) => {
        if (!list.some(c => c.application_id === a.id)) {
          list.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            challan_number: 'CHN-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
            application_id: a.id,
            member_id: null,
            total_amount: 7000,
            due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            status: 'Unpaid',
            pdf_file_path: null,
            created_at: new Date().toISOString(),
            applicant_name: a.full_name
          });
        }
      });

      setUnpaidChallans(list);
    } catch (err: any) {
      console.error('Failed to fetch unpaid challans:', err);
    }
  };

  // Select Challan in Upload Form
  const handleSelectChallan = (challan: ChallanData) => {
    setSelectedChallan(challan);
    setAmountPaid(String(challan.total_amount));
  };

  // Submit Receipt Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallan || !receiptFile || !transactionRef || !amountPaid) {
      setUploadMessage({ type: 'error', text: 'Please fill in all fields and select a receipt file.' });
      return;
    }

    try {
      setUploadLoading(true);
      setUploadMessage(null);

      const formData = new FormData();
      formData.append('challan_id', String(selectedChallan.id));
      formData.append('challan_number', selectedChallan.challan_number);
      formData.append('applicant_name', selectedChallan.applicant_name || selectedChallan.member_name || 'Chamber Applicant');
      formData.append('payment_method', paymentMethod);
      formData.append('transaction_ref', transactionRef.trim());
      formData.append('amount_paid', amountPaid);
      formData.append('payment_date', paymentDate);
      formData.append('receipt_file', receiptFile);

      const res = await uploadPaymentReceipt(formData);
      if (res.success) {
        setUploadMessage({ type: 'success', text: res.message });
        fetchPaymentQueue();
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setUploadMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Failed to upload payment receipt.' 
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Open Verify Modal
  const handleOpenVerifyModal = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setIsVerifyModalOpen(true);
    setRejectionReason('');
    setVerifyMessage(null);
  };

  const handleDeletePayment = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete payment receipt record #${id}?`)) return;

    try {
      setLoading(true);
      const res = await deletePayment(id);
      if (res.success) {
        setIsVerifyModalOpen(false);
        setPayments(prev => prev.filter(p => p.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete payment receipt.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Verification Action (Approve / Reject)
  const handleVerifySubmit = async (action: 'Approved' | 'Rejected') => {
    if (!selectedPayment) return;
    const finalReason = action === 'Rejected' 
      ? (rejectionReason && rejectionReason.trim() !== '' ? rejectionReason : 'Payment receipt verification failed or image unreadable.')
      : undefined;

    try {
      setVerifySubmitting(true);
      setVerifyMessage(null);

      const res = await verifyPayment(selectedPayment.id, {
        verification_status: action,
        rejection_reason: finalReason
      });

      if (res.success) {
        setVerifyMessage({ type: 'success', text: res.message });
        
        // Remove from current queue if filtering by specific status
        setPayments(prev => {
          if (selectedStatus !== 'All') {
            return prev.filter(p => p.id !== selectedPayment.id);
          }
          return prev.map(p => p.id === selectedPayment.id ? { ...p, verification_status: action, rejection_reason: finalReason || p.rejection_reason } : p);
        });

        if (action === 'Approved' && res.membershipId) {
          setApprovedMemberInfo({
            memberName: res.memberName || selectedPayment.applicant_name || selectedPayment.member_name || 'Member',
            membershipId: res.membershipId,
            email: res.email || selectedPayment.email || '',
            whatsappNo: res.whatsappNo || selectedPayment.whatsapp_no || '',
            generatedPassword: res.generatedPassword || 'PCE@2026'
          });
          setIsVerifyModalOpen(false);
          setIsSuccessModalOpen(true);
        } else {
          setTimeout(() => {
            setIsVerifyModalOpen(false);
            setVerifyMessage(null);
          }, 1200);
        }
      }
    } catch (err: any) {
      setVerifyMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Failed to complete verification decision.' 
      });
    } finally {
      setVerifySubmitting(false);
    }
  };

  // Helper: Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'bg-accent/10 text-accent border border-accent/20';
      case 'Approved':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Rejected':
        return 'bg-danger/10 text-danger border border-danger/20';
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
            Payments & Receipts Verification {totalCount > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({totalCount})</span>}
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Manually upload bank deposit receipts received via WhatsApp and verify payment submissions to activate member accounts.
          </p>
        </div>
        {canVerify && (
          <button
            onClick={handleOpenUploadModal}
            className="bg-primary hover:bg-[#00523C] text-white px-4 py-2.5 rounded-lg text-xs font-bold font-poppins flex items-center gap-1.5 shadow-sm transition self-start md:self-auto"
          >
            <span className="material-icons text-sm">cloud_upload</span>
            Upload Receipt from WhatsApp
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap -mb-px text-xs font-semibold font-poppins gap-1">
          {['Submitted', 'Approved', 'Rejected', 'All'].map((status) => (
            <button
              key={status}
              onClick={() => { setSelectedStatus(status); setPage(1); }}
              className={`px-4 py-2.5 border-b-2 transition-all ${
                selectedStatus === status
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {status === 'Submitted' ? 'Pending Queue' : status}
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
            placeholder="Search by Transaction Ref (TRID), Challan Number, or Payer Name..."
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

      {/* Payment Queue Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">payments</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No payment receipts in queue</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1 max-w-xs">
            There are no receipt verification records matching your selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">Transaction Ref</th>
                  <th className="px-5 py-3">Payer Details</th>
                  <th className="px-5 py-3">Challan No</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount Paid</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {payments.map((p) => {
                  const isMember = p.membership_id !== null && p.membership_id !== undefined;
                  const name = isMember ? p.member_name : p.applicant_name;
                  const refLabel = isMember ? `Member ID: ${p.membership_id}` : `Applicant`;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAFBFB] transition-colors">
                      <td className="px-5 py-3 font-semibold font-mono text-gray-800">
                        {p.transaction_ref}
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{refLabel}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-600">
                        {p.challan_number}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-600">
                        {p.payment_method}
                      </td>
                      <td className="px-5 py-3 font-bold text-primary">
                        PKR {parseFloat(p.amount_paid as any).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold font-poppins ${getStatusBadge(p.verification_status)}`}>
                          {p.verification_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenVerifyModal(p)}
                          className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold font-poppins transition flex items-center gap-1"
                        >
                          <span className="material-icons text-sm">visibility</span>
                          Review & Verify
                        </button>
                        {canVerify && (
                          <button
                            onClick={(e) => handleDeletePayment(p.id, e)}
                            title="Delete Payment Record"
                            className="bg-danger/10 hover:bg-danger text-danger hover:text-white p-1.5 rounded-lg text-xs transition"
                          >
                            <span className="material-icons text-sm block">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* ========================================== */}
      {/* MODAL 1: Upload Receipt Modal              */}
      {/* ========================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fadeIn border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold font-poppins text-[#333333] flex items-center gap-2">
                <span className="material-icons text-primary">cloud_upload</span>
                Upload Payment Receipt (WhatsApp)
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {uploadMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                uploadMessage.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
              }`}>
                {uploadMessage.text}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-inter">
              {/* Select Challan */}
              <div>
                <label className="block font-semibold text-gray-700 font-poppins mb-1">
                  1. Select Unpaid Challan / Invoice
                </label>
                <select
                  required
                  value={selectedChallan ? selectedChallan.id : ''}
                  onChange={(e) => {
                    const found = unpaidChallans.find(c => c.id === parseInt(e.target.value, 10));
                    if (found) handleSelectChallan(found);
                  }}
                  className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-poppins focus:bg-white focus:border-primary outline-none"
                >
                  <option value="">-- Choose Challan --</option>
                  {unpaidChallans.map((c) => {
                    const isM = c.member_id !== null;
                    const name = isM ? c.member_name : c.applicant_name;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.challan_number} — {name} (PKR {c.total_amount})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Payment Method & Transaction Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 font-poppins mb-1">
                    2. Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-poppins focus:bg-white focus:border-primary outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer (HBL)</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Direct Deposit">Direct Deposit</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Other">Other Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 font-poppins mb-1">
                    3. Transaction Ref / TRID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRX987654321"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-mono focus:bg-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 font-poppins mb-1">
                    4. Amount Paid (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="5000.00"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-primary focus:bg-white focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 font-poppins mb-1">
                    5. Deposit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg text-xs font-poppins focus:bg-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block font-semibold text-gray-700 font-poppins mb-1">
                  6. Receipt Screenshot / Photo (from WhatsApp)
                </label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setReceiptFile(e.target.files[0]);
                    }
                  }}
                  className="w-full bg-[#F4F6F5] p-2 border border-dashed border-gray-300 rounded-lg text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-[#00523C]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Accepted formats: JPG, PNG, PDF (Max 5MB)</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition font-poppins"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 bg-primary hover:bg-[#00523C] text-white rounded-lg text-xs font-bold font-poppins shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadLoading ? 'Uploading...' : 'Save & Submit to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: Review & Verify Modal             */}
      {/* ========================================== */}
      {isVerifyModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-fadeIn border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-poppins text-[#333333] flex items-center gap-2">
                  <span className="material-icons text-primary">verified_user</span>
                  Review & Verify Payment Receipt
                </h3>
                <p className="text-[11px] text-gray-400 font-inter mt-0.5">
                  Transaction Ref: <strong className="font-mono text-gray-700">{selectedPayment.transaction_ref}</strong>
                </p>
              </div>
              <button 
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {verifyMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                verifyMessage.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
              }`}>
                {verifyMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-inter text-xs">
              {/* Left Column: Details */}
              <div className="space-y-3 bg-[#FAFBFB] p-4 rounded-lg border border-gray-100">
                <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider">
                  Payment Details
                </h4>

                <div>
                  <span className="text-gray-400 text-[10px] block">Payer Name:</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {selectedPayment.member_name || selectedPayment.applicant_name}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] block">Entity Type:</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPayment.membership_id 
                      ? `Existing Member (${selectedPayment.membership_id})` 
                      : `Approved Applicant (Case A First Payment)`}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] block">Challan Number:</span>
                  <span className="font-mono font-semibold text-gray-700">{selectedPayment.challan_number}</span>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] block">Amount Paid vs Invoice:</span>
                  <span className="font-bold text-primary text-sm">
                    PKR {parseFloat(selectedPayment.amount_paid as any).toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-[10px] ml-1">
                    (Invoice: PKR {parseFloat(selectedPayment.challan_total_amount as any).toLocaleString()})
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] block">Payment Method & Date:</span>
                  <span className="font-medium text-gray-700">
                    {selectedPayment.payment_method} on {new Date(selectedPayment.payment_date).toLocaleDateString()}
                  </span>
                </div>

                {selectedPayment.verification_status !== 'Submitted' && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-400 text-[10px] block">Verified By:</span>
                    <span className="font-semibold text-gray-700">{selectedPayment.verifier_name || 'System Officer'}</span>
                    {selectedPayment.rejection_reason && (
                      <div className="mt-1 bg-danger/5 p-2 rounded text-danger text-[11px]">
                        <strong>Rejection Reason:</strong> {selectedPayment.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Receipt Image / Preview */}
              <div className="space-y-3 flex flex-col justify-between">
                <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider">
                  Uploaded Receipt Screenshot
                </h4>
                
                <div className="bg-gray-100 rounded-lg p-3 flex flex-col items-center justify-center border border-gray-200 min-h-[180px]">
                  <img 
                    src={
                      selectedPayment.receipt_file_path && (selectedPayment.receipt_file_path.startsWith('http') || selectedPayment.receipt_file_path.startsWith('data:'))
                        ? selectedPayment.receipt_file_path
                        : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80'
                    } 
                    alt="Payment Receipt" 
                    onClick={() => {
                      setPreviewTitle(`Payment Receipt - ${selectedPayment.transaction_ref}`);
                      setPreviewImageUrl(
                        selectedPayment.receipt_file_path && (selectedPayment.receipt_file_path.startsWith('http') || selectedPayment.receipt_file_path.startsWith('data:'))
                          ? selectedPayment.receipt_file_path
                          : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80'
                      );
                    }}
                    className="max-h-52 object-contain rounded shadow-sm border border-gray-200 cursor-pointer hover:opacity-90 transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTitle(`Payment Receipt - ${selectedPayment.transaction_ref}`);
                      setPreviewImageUrl(
                        selectedPayment.receipt_file_path && (selectedPayment.receipt_file_path.startsWith('http') || selectedPayment.receipt_file_path.startsWith('data:'))
                          ? selectedPayment.receipt_file_path
                          : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80'
                      );
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-xs font-bold font-poppins cursor-pointer"
                  >
                    <span className="material-icons text-sm">zoom_in</span>
                    Click to View Fullsize Picture
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons (Approve / Reject) */}
            {canVerify && selectedPayment.verification_status === 'Submitted' && (
              <div className="space-y-3 pt-3 border-t border-gray-100 font-poppins">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rejection Notes (Mandatory ONLY if rejecting):
                  </label>
                  <input
                    type="text"
                    placeholder="Provide clear reason if rejecting payment..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-[#F4F6F5] p-2 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-danger"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-gray-400">
                    * Approving a Case A payment auto-creates the Member Record & Membership ID.
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={verifySubmitting}
                      onClick={() => handleVerifySubmit('Rejected')}
                      className="px-4 py-2 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <span className="material-icons text-sm">cancel</span>
                      Reject Payment
                    </button>

                    <button
                      type="button"
                      disabled={verifySubmitting}
                      onClick={() => handleVerifySubmit('Approved')}
                      className="px-5 py-2 bg-primary hover:bg-[#00523C] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-icons text-sm">check_circle</span>
                      {verifySubmitting ? 'Verifying & Activating...' : 'Approve & Activate Member'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: WhatsApp Credentials Dispatch     */}
      {/* ========================================== */}
      {isSuccessModalOpen && approvedMemberInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fadeIn border border-gray-100 font-inter">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <span className="material-icons text-3xl">verified</span>
              </div>
              <h3 className="text-lg font-bold font-poppins text-gray-800">
                Member Profile Created & Activated! 🎉
              </h3>
              <p className="text-xs text-gray-500 font-inter">
                Payment verified. The member account has been registered in the database and initial login credentials generated.
              </p>
            </div>

            {/* Credentials Card Box */}
            <div className="bg-[#FAFBFB] p-4 rounded-xl border border-gray-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-400 font-semibold uppercase text-[10px]">Member Name</span>
                <span className="font-bold text-gray-800">{approvedMemberInfo.memberName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-400 font-semibold uppercase text-[10px]">Official Membership ID</span>
                <span className="font-mono font-bold text-primary text-sm">{approvedMemberInfo.membershipId}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-400 font-semibold uppercase text-[10px]">Portal Login Email</span>
                <span className="font-mono text-gray-800 font-semibold">{approvedMemberInfo.email}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold uppercase text-[10px]">Generated Password</span>
                <span className="font-mono font-bold text-accent text-sm bg-accent/10 px-2 py-0.5 rounded">
                  {approvedMemberInfo.generatedPassword}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 font-poppins">
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = approvedMemberInfo.whatsappNo.replace(/[^0-9]/g, '');
                  const phone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
                  const text = `*PAKISTAN CHAMBER OF EDUCATION (DIVISION BAHAWALPUR)*
*Welcome to PCE! Official Membership Confirmation*

Dear *${approvedMemberInfo.memberName}*,

Your payment has been verified, and your official Chamber Membership is now *ACTIVE*!

🆔 *Membership ID:* ${approvedMemberInfo.membershipId}
🌐 *Member Portal:* http://localhost:5173/login
📧 *Username / Email:* ${approvedMemberInfo.email}
🔑 *Initial Password:* ${approvedMemberInfo.generatedPassword}

Please sign in to view your digital membership card and profile.

Regards,
*Pakistan Chamber of Education*
_Bahawalpur Division, Punjab_`;

                  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white py-3 rounded-lg text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-icons text-base">chat</span>
                Send Login Credentials via WhatsApp
              </button>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Membership ID: ${approvedMemberInfo.membershipId}\nEmail: ${approvedMemberInfo.email}\nPassword: ${approvedMemberInfo.generatedPassword}\nPortal: http://localhost:5173/login`;
                    navigator.clipboard.writeText(text);
                    alert('Member credentials copied to clipboard!');
                  }}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-bold transition"
                >
                  Copy Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-gray-100 relative">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-poppins font-bold text-base text-gray-800 flex items-center gap-2">
                <span className="material-icons text-primary">image</span>
                {previewTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <span className="material-icons text-xl">close</span>
              </button>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-center min-h-[350px]">
              <img
                src={previewImageUrl}
                alt="Document Full View"
                className="max-h-[60vh] max-w-full object-contain rounded shadow-lg"
              />
            </div>

            <div className="flex justify-between items-center pt-2 font-inter text-xs">
              <span className="text-gray-500 font-medium flex items-center gap-1">
                <span className="material-icons text-sm text-primary">verified</span>
                Official Payment Receipt Document Record
              </span>
              <div className="flex gap-2">
                <a
                  href={previewImageUrl}
                  download="chamber_payment_receipt.png"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary hover:bg-[#004C38] text-white px-4 py-2 rounded-lg text-xs font-bold font-poppins shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-icons text-sm">download</span>
                  Download Picture
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold font-poppins transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

