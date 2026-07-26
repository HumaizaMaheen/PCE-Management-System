import React, { useState, useEffect } from 'react';
import { getApplications, getApplicationById, reviewApplication, deleteApplication, ApplicationData } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function Applications() {
  const { user } = useAuth();
  
  // Checking permissions
  const canReview = user?.role === 'Super Admin' || user?.role === 'Membership Officer';

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  
  // Data state
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected single application detail state
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Review Form state
  const [remarks, setRemarks] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch applications list
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit,
      };
      if (selectedStatus !== 'All') {
        params.status = selectedStatus;
      }
      if (search) {
        params.search = search;
      }
      if (selectedDistrict) {
        params.district = selectedDistrict;
      }

      const res = await getApplications(params);
      if (res && res.success && Array.isArray(res.data)) {
        setApplications(res.data);
        setTotalCount(res.pagination?.total ?? res.data.length);
        setTotalPages(res.pagination?.totalPages ?? 1);
      }
    } catch (err: any) {
      if (!err.message?.includes('403')) {
        setError(err.response?.data?.message || err.message || 'Failed to load applications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, selectedDistrict, page]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  // View application details
  const handleViewDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setIsModalOpen(true);
      setReviewMessage(null);
      setRemarks('');
      
      const appDetail = await getApplicationById(id);
      setSelectedApp(appDetail);
    } catch (err: any) {
      setDetailError(err.response?.data?.message || err.message || 'Failed to fetch application details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Submit Officer Review
  const handleReviewAction = async (status: 'Approved - Awaiting Payment' | 'Rejected' | 'Needs More Information') => {
    if (!selectedApp) return;

    if (!remarks || remarks.trim() === '') {
      setReviewMessage({ type: 'error', text: 'Officer review remarks are mandatory before making a decision.' });
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewMessage(null);

      const res = await reviewApplication(selectedApp.id, { status, remarks });
      if (res.success) {
        setReviewMessage({ 
          type: 'success', 
          text: `Application has been successfully marked as: ${status}. ${res.challanNumber ? 'Challan created: ' + res.challanNumber : ''}` 
        });
        
        // Refresh detail view
        const appDetail = await getApplicationById(selectedApp.id);
        setSelectedApp(appDetail);
        
        // Refresh list
        fetchApplications();
      }
    } catch (err: any) {
      setReviewMessage({ 
        type: 'error', 
        text: err.response?.data?.message || err.message || 'Failed to save review action' 
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteApplication = async (id: number, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete application #${id} (${name}) and all its uploaded files?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await deleteApplication(id);
      if (res.success) {
        setIsModalOpen(false);
        setApplications(prev => prev.filter(app => app.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete application.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Status color classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-accent/10 text-accent border border-accent/20';
      case 'Approved - Awaiting Payment':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Rejected':
        return 'bg-danger/10 text-danger border border-danger/20';
      case 'Needs More Information':
        return 'bg-warning/10 text-[#856404] border border-warning/20';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">Membership Applications</h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Review and manage public membership submissions for the Bahawalpur Division.
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg font-poppins">
          Total Applications: <strong className="text-gray-700 font-bold">{totalCount}</strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap -mb-px text-xs font-semibold font-poppins gap-1">
          {['All', 'Pending', 'Approved - Awaiting Payment', 'Rejected', 'Needs More Information'].map((status) => (
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

      {/* Search & filters bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 material-icons text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search by Applicant Name, CNIC, Email or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F4F6F5] pl-10 pr-4 py-2 border border-transparent rounded-lg text-xs font-inter focus:outline-none focus:bg-white focus:border-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
            className="bg-[#F4F6F5] px-3 py-2 border border-transparent rounded-lg text-xs font-poppins font-medium text-gray-500 focus:outline-none focus:bg-white focus:border-primary/20"
          >
            <option value="">All Districts</option>
            <option value="Bahawalpur">Bahawalpur</option>
            <option value="Bahawalnagar">Bahawalnagar</option>
            <option value="Rahim Yar Khan">Rahim Yar Khan</option>
          </select>
          <button
            type="submit"
            className="bg-primary hover:bg-[#00523C] text-white px-5 py-2 rounded-lg text-xs font-bold font-poppins flex items-center gap-2 shadow-sm transition"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Applications Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold font-poppins">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">assignment_late</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No applications found</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1 max-w-xs">
            There are no submissions matching your active filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card">
            <table className="w-full text-xs text-left border-collapse bg-white">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">Applicant details</th>
                  <th className="px-5 py-3">CNIC</th>
                  <th className="px-5 py-3">District</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {applications.map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-[#FAFBFB] transition-colors cursor-pointer"
                    onDoubleClick={() => handleViewDetails(app.id)}
                  >
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      <div>
                        <p>{app.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-normal mt-0.5">{app.email} | {app.mobile_no}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-700">{app.cnic}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-semibold">{app.district}</p>
                        <p className="text-[10px] text-gray-400">{app.tehsil}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p>{app.occupation_designation}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{app.organization_school_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-[6px] text-[10px] font-semibold font-poppins ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleViewDetails(app.id)}
                        className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 px-3 py-1.5 rounded-lg text-[10px] font-semibold font-poppins transition"
                      >
                        Review Profile
                      </button>
                      {canReview && (
                        <button
                          onClick={(e) => handleDeleteApplication(app.id, app.full_name, e)}
                          title="Delete Application"
                          className="bg-danger/10 hover:bg-danger text-danger hover:text-white p-1.5 rounded-lg text-xs transition"
                        >
                          <span className="material-icons text-sm block">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

      {/* Review & Detail Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div 
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-gray-500/75 transition-opacity" 
              aria-hidden="true"
            ></div>

            {/* Modal Body */}
            <div className="inline-block align-bottom bg-white rounded-[12px] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              
              {/* Header */}
              <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-base font-bold font-poppins">Application Dossier Review</h3>
                  <p className="text-[10px] opacity-80 uppercase tracking-wider mt-0.5">
                    Reference: PCE-APP-{new Date().getFullYear()}-{selectedApp ? String(selectedApp.id).padStart(6, '0') : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white focus:outline-none"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {detailLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : detailError ? (
                  <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
                    {detailError}
                  </div>
                ) : selectedApp ? (
                  <div className="space-y-6">
                    {/* Status Alert Banner */}
                    <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-400 font-medium font-poppins uppercase tracking-wide">Current Status: </span>
                        <strong className="text-gray-700 font-bold ml-1 font-poppins">{selectedApp.status}</strong>
                      </div>
                      <div className="text-[10px] text-gray-400 font-inter">
                        Submitted: {new Date(selectedApp.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Information Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Profile Info */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold font-poppins text-primary uppercase border-b border-gray-100 pb-1.5">
                          Personal & Contact Information
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-inter">
                          <div>
                            <p className="text-gray-400 text-[10px]">Full Name</p>
                            <p className="font-semibold text-gray-800">{selectedApp.full_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Father/Husband Name</p>
                            <p className="font-semibold text-gray-800">{selectedApp.father_husband_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">CNIC Number</p>
                            <p className="font-semibold text-gray-800 font-mono">{selectedApp.cnic}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Date of Birth</p>
                            <p className="font-semibold text-gray-800">{new Date(selectedApp.dob).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Gender</p>
                            <p className="font-semibold text-gray-800">{selectedApp.gender}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Email Address</p>
                            <p className="font-semibold text-gray-800 break-all">{selectedApp.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Mobile Phone</p>
                            <p className="font-semibold text-gray-800">{selectedApp.mobile_no}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">WhatsApp No</p>
                            <p className="font-semibold text-gray-800">{selectedApp.whatsapp_no}</p>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold font-poppins text-primary uppercase border-b border-gray-100 pb-1.5 pt-2">
                          Education & Institution Details
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-inter">
                          <div>
                            <p className="text-gray-400 text-[10px]">Highest Qualification</p>
                            <p className="font-semibold text-gray-800">{selectedApp.qualification}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Passing Year</p>
                            <p className="font-semibold text-gray-800">{selectedApp.passing_year}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-400 text-[10px]">Institution</p>
                            <p className="font-semibold text-gray-800">{selectedApp.institute}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Designation / Occupation</p>
                            <p className="font-semibold text-gray-800">{selectedApp.occupation_designation}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Organization School</p>
                            <p className="font-semibold text-gray-800">{selectedApp.organization_school_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Address & Documents */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold font-poppins text-primary uppercase border-b border-gray-100 pb-1.5">
                          Address Details
                        </h4>
                        <div className="space-y-3 text-xs font-inter">
                          <div>
                            <p className="text-gray-400 text-[10px]">District & Tehsil</p>
                            <p className="font-semibold text-gray-800">{selectedApp.district} — {selectedApp.tehsil}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Office Address</p>
                            <p className="font-semibold text-gray-700 leading-relaxed">{selectedApp.office_address}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px]">Residential Address</p>
                            <p className="font-semibold text-gray-700 leading-relaxed">{selectedApp.residential_address}</p>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold font-poppins text-primary uppercase border-b border-gray-100 pb-1.5 pt-2">
                          Uploaded Verification Documents
                        </h4>
                        
                        <div className="space-y-2">
                          {selectedApp.documents && selectedApp.documents.length > 0 ? (
                            selectedApp.documents.map((doc) => (
                              <div 
                                key={doc.id}
                                className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-[#FAFBFB] rounded-lg border border-gray-100 text-xs font-poppins"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="material-icons text-primary text-base">
                                    {doc.document_type === 'Photo' ? 'portrait' : 'description'}
                                  </span>
                                  <div>
                                    <p className="font-semibold text-gray-700">{doc.document_type}</p>
                                    <p className="text-[9px] text-gray-400 font-inter">{(doc.file_size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <a 
                                  href={
                                    doc.file_path && doc.file_path.startsWith('http') 
                                      ? doc.file_path 
                                      : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80'
                                  } 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 px-2.5 py-1 rounded text-[10px] font-bold font-poppins transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-icons text-[10px]">open_in_new</span>
                                  View Document
                                </a>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">No files uploaded.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Historical remarks or notes */}
                    {selectedApp.officer_remarks && (
                      <div className="bg-[#FFFDF5] border-l-4 border-warning p-4 rounded-r-lg">
                        <h4 className="text-xs font-bold font-poppins text-[#856404] uppercase">Prior Review Remarks</h4>
                        <p className="text-xs text-[#856404] font-inter mt-1 leading-relaxed">
                          {selectedApp.officer_remarks}
                        </p>
                        {selectedApp.reviewed_at && (
                          <span className="text-[9px] text-gray-400 block mt-2 font-inter">
                            Reviewed on: {new Date(selectedApp.reviewed_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Officer Action Panel */}
                    {canReview && selectedApp.status !== 'Approved - Awaiting Payment' && (
                      <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-5 space-y-4">
                        <h4 className="text-xs font-bold font-poppins text-gray-700 uppercase flex items-center gap-1.5">
                          <span className="material-icons text-primary text-base">gavel</span>
                          Review Decision Board
                        </h4>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wide font-poppins block">
                            Officer Review Remarks / Notes (Mandatory)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Type evaluation notes, rejection reasons, or details of missing information requested..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs font-inter focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all"
                          />
                        </div>

                        {/* Review alert messages */}
                        {reviewMessage && (
                          <div className={`p-3 rounded-lg text-xs font-poppins font-semibold flex items-center gap-2 border ${
                            reviewMessage.type === 'success'
                              ? 'bg-primary/5 text-primary border-primary/10'
                              : 'bg-danger/5 text-danger border-danger/10'
                          }`}>
                            <span className="material-icons text-sm">
                              {reviewMessage.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            <span>{reviewMessage.text}</span>
                          </div>
                        )}

                        {/* Decision Buttons */}
                        <div className="flex flex-wrap gap-2.5 pt-1.5">
                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={() => handleReviewAction('Approved - Awaiting Payment')}
                            className="bg-primary hover:bg-[#00523C] text-white px-5 py-2.5 rounded-lg text-xs font-bold font-poppins flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                          >
                            <span className="material-icons text-sm">check</span>
                            Approve & Bill
                          </button>
                          
                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={() => handleReviewAction('Needs More Information')}
                            className="bg-warning hover:bg-[#E0A800] text-white px-5 py-2.5 rounded-lg text-xs font-bold font-poppins flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                          >
                            <span className="material-icons text-sm">help_outline</span>
                            Request More Info
                          </button>

                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={() => handleReviewAction('Rejected')}
                            className="bg-danger hover:bg-[#C53030] text-white px-5 py-2.5 rounded-lg text-xs font-bold font-poppins flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                          >
                            <span className="material-icons text-sm">close</span>
                            Reject Submission
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3.5 flex justify-between items-center border-t border-gray-100">
                {canReview && selectedApp ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteApplication(selectedApp.id, selectedApp.full_name)}
                    className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-4 py-2 rounded-lg text-xs font-bold font-poppins transition flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-icons text-sm">delete_forever</span>
                    Delete Application
                  </button>
                ) : <div />}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 px-4 py-2 rounded-lg text-xs font-bold font-poppins transition"
                >
                  Close Dossier
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
