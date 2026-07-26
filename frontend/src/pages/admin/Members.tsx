import React, { useState, useEffect } from 'react';
import { getMembers, getMemberById, updateMemberStatus, deleteMember, MemberData } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function Members() {
  const { user } = useAuth();
  const canManage = user?.role === 'Super Admin' || user?.role === 'Membership Officer';

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Data state
  const [members, setMembers] = useState<MemberData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected single member detail state
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Fetch members directory
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (selectedStatus !== 'All') {
        params.status = selectedStatus;
      }
      if (selectedDistrict) {
        params.district = selectedDistrict;
      }
      if (search) {
        params.search = search;
      }

      const res = await getMembers(params);
      if (res.success) {
        setMembers(res.data);
        setTotalCount(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch members directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedStatus, selectedDistrict, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  // View member details
  const handleViewDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setIsModalOpen(true);
      
      const data = await getMemberById(id);
      setSelectedMember(data);
    } catch (err: any) {
      setDetailError(err.response?.data?.message || err.message || 'Failed to fetch member profile details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Helper: Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Suspended':
        return 'bg-danger/10 text-danger border border-danger/20';
      case 'Inactive':
        return 'bg-gray-100 text-gray-600 border border-gray-200';
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
            Members Directory
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Directory of activated members of the Pakistan Chamber of Education (Bahawalpur Division).
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg font-poppins">
          Total Registered Members: <strong className="text-gray-700 font-bold">{totalCount}</strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap -mb-px text-xs font-semibold font-poppins gap-1">
          {['All', 'Active', 'Suspended', 'Inactive'].map((status) => (
            <button
              key={status}
              onClick={() => { setSelectedStatus(status); setPage(1); }}
              className={`px-4 py-2.5 border-b-2 transition-all ${
                selectedStatus === status
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              {status} Members
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 material-icons text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search by Membership ID (PCE-BWP-...), Name, CNIC, or Mobile..."
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

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg text-xs font-semibold">
          {error}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FAFBFB] rounded-card border border-dashed border-gray-200">
          <span className="material-icons text-4xl text-gray-300 mb-2">people_outline</span>
          <h3 className="text-sm font-bold font-poppins text-gray-600">No active members found</h3>
          <p className="text-[11px] text-gray-400 font-inter mt-1 max-w-xs">
            Member records are created automatically once payment receipts are verified by a Finance Officer.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-100 rounded-card bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins font-semibold">
                  <th className="px-5 py-3">Membership ID</th>
                  <th className="px-5 py-3">Member Details</th>
                  <th className="px-5 py-3">CNIC</th>
                  <th className="px-5 py-3">District</th>
                  <th className="px-5 py-3">Occupation / School</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-inter text-gray-600">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAFBFB] transition-colors">
                    <td className="px-5 py-3 font-bold font-mono text-primary">
                      {m.membership_id}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-semibold text-gray-800">{m.full_name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{m.email} • {m.mobile_no}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-600">
                      {m.cnic}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-700">
                      {m.district} ({m.tehsil})
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <p className="font-semibold">{m.occupation_designation}</p>
                      <p className="text-[10px] text-gray-400">{m.organization_school_name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold font-poppins ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(m.id)}
                          className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold font-poppins transition flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-icons text-sm">badge</span>
                          View Profile
                        </button>

                        <button
                          disabled={statusUpdating}
                          onClick={async () => {
                            if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently DELETE member ${m.membership_id} (${m.full_name})?\n\nThis will purge all associated login credentials, application data, payment records, and documents!`)) return;
                            try {
                              setStatusUpdating(true);
                              const res = await deleteMember(m.id);
                              if (res.success) {
                                alert(`Member ${m.membership_id} and all login credentials have been permanently deleted.`);
                                setMembers(prev => prev.filter(item => item.id !== m.id));
                                setTotalCount(prev => Math.max(0, prev - 1));
                              }
                            } catch (err: any) {
                              alert(err.response?.data?.message || 'Failed to delete member.');
                            } finally {
                              setStatusUpdating(false);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold font-poppins transition flex items-center gap-1 cursor-pointer border border-red-200"
                          title="Delete Member & Purge Credentials"
                        >
                          <span className="material-icons text-sm">delete_forever</span>
                          Delete
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

      {/* ========================================== */}
      {/* MODAL: Member Detailed Profile Drawer      */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-2xl max-w-3xl w-full p-6 space-y-6 animate-fadeIn border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-poppins">Member Profile</span>
                <h3 className="text-lg font-bold font-poppins text-[#333333] flex items-center gap-2">
                  {selectedMember?.full_name}
                  {selectedMember && (
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {selectedMember.membership_id}
                    </span>
                  )}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : detailError ? (
              <div className="bg-danger/10 text-danger p-4 rounded-lg text-xs font-semibold">
                {detailError}
              </div>
            ) : selectedMember ? (
              <div className="space-y-6 text-xs font-inter text-gray-700">
                {/* 1. Basic & Personal Details Grid */}
                <div>
                  <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider mb-3">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#FAFBFB] p-4 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Father/Husband Name:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.father_husband_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">CNIC:</span>
                      <span className="font-mono font-semibold text-gray-800">{selectedMember.cnic}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Date of Birth & Gender:</span>
                      <span className="font-semibold text-gray-800">{new Date(selectedMember.dob).toLocaleDateString()} ({selectedMember.gender})</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Mobile Number:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.mobile_no}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">WhatsApp Number:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.whatsapp_no}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Email Address:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.email}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Qualification & Employment */}
                <div>
                  <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider mb-3">
                    Educational & Professional Profile
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#FAFBFB] p-4 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Qualification:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.qualification}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Institute & Passing Year:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.institute} ({selectedMember.passing_year})</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Occupation / Designation:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.occupation_designation}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 text-[10px] block">Organization / School Name:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.organization_school_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">District & Tehsil:</span>
                      <span className="font-semibold text-gray-800">{selectedMember.district} ({selectedMember.tehsil})</span>
                    </div>
                  </div>
                </div>

                {/* 3. Address details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FAFBFB] p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-400 text-[10px] block">Office Address:</span>
                    <p className="font-medium text-gray-800 mt-1">{selectedMember.office_address}</p>
                  </div>
                  <div className="bg-[#FAFBFB] p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-400 text-[10px] block">Residential Address:</span>
                    <p className="font-medium text-gray-800 mt-1">{selectedMember.residential_address}</p>
                  </div>
                </div>

                {/* 4. Documents Vault */}
                <div>
                  <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider mb-2">
                    Attached Documents & Credentials
                  </h4>
                  {selectedMember.documents && selectedMember.documents.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedMember.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={`http://localhost:5000${doc.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#FAFBFB] hover:bg-gray-100 border border-gray-200 p-2.5 rounded-lg flex items-center gap-2 transition"
                        >
                          <span className="material-icons text-primary text-lg">description</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[11px] text-gray-700 truncate">{doc.document_type}</p>
                            <p className="text-[9px] text-gray-400 truncate">{doc.file_name}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">No documents attached.</p>
                  )}
                </div>

                {/* 5. Payments & Challans History */}
                <div>
                  <h4 className="font-bold font-poppins text-primary text-xs uppercase tracking-wider mb-2">
                    Payment & Dues History
                  </h4>
                  {selectedMember.challans && selectedMember.challans.length > 0 ? (
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left bg-white">
                        <thead className="bg-[#FAFBFB] border-b border-gray-100 text-gray-500 font-poppins">
                          <tr>
                            <th className="p-2.5">Challan No</th>
                            <th className="p-2.5">Amount</th>
                            <th className="p-2.5">Due Date</th>
                            <th className="p-2.5">TRID</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-mono">
                          {selectedMember.challans.map((ch) => (
                            <tr key={ch.id}>
                              <td className="p-2.5 font-bold">{ch.challan_number}</td>
                              <td className="p-2.5 text-primary font-bold">PKR {parseFloat(ch.total_amount as any).toLocaleString()}</td>
                              <td className="p-2.5 font-sans">{new Date(ch.due_date).toLocaleDateString()}</td>
                              <td className="p-2.5">{ch.transaction_ref || '—'}</td>
                              <td className="p-2.5 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ch.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                                }`}>
                                  {ch.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">No previous invoice history.</p>
                  )}
                </div>

                {/* 6. Admin Actions: Status Management / Suspend / Deactivate */}
                {canManage && (
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 font-poppins">
                    <span className="text-[11px] text-gray-400">
                      Current Status: <strong className="text-gray-800 font-bold">{selectedMember.status}</strong>
                    </span>

                    <div className="flex gap-2">
                      {selectedMember.status !== 'Active' && (
                        <button
                          disabled={statusUpdating}
                          onClick={async () => {
                            try {
                              setStatusUpdating(true);
                              const res = await updateMemberStatus(selectedMember.id, { status: 'Active' });
                              if (res.success) {
                                setSelectedMember(prev => prev ? { ...prev, status: 'Active' } : null);
                                fetchMembers();
                              }
                            } finally { setStatusUpdating(false); }
                          }}
                          className="bg-primary hover:bg-[#00523C] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-icons text-sm">check_circle</span>
                          Reactivate Member
                        </button>
                      )}

                      {selectedMember.status === 'Active' && (
                        <button
                          disabled={statusUpdating}
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to suspend member ${selectedMember.membership_id}?`)) return;
                            try {
                              setStatusUpdating(true);
                              const res = await updateMemberStatus(selectedMember.id, { status: 'Suspended' });
                              if (res.success) {
                                setSelectedMember(prev => prev ? { ...prev, status: 'Suspended' } : null);
                                fetchMembers();
                              }
                            } finally { setStatusUpdating(false); }
                          }}
                          className="bg-accent/10 hover:bg-accent text-accent hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-icons text-sm">pause_circle</span>
                          Suspend Member
                        </button>
                      )}

                      {selectedMember.status !== 'Inactive' && (
                        <button
                          disabled={statusUpdating}
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to deactivate/remove portal access for member ${selectedMember.membership_id}?`)) return;
                            try {
                              setStatusUpdating(true);
                              const res = await updateMemberStatus(selectedMember.id, { status: 'Inactive' });
                              if (res.success) {
                                setSelectedMember(prev => prev ? { ...prev, status: 'Inactive' } : null);
                                fetchMembers();
                              }
                            } finally { setStatusUpdating(false); }
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-icons text-sm">block</span>
                          Deactivate Access
                        </button>
                      )}

                      <button
                        disabled={statusUpdating}
                        onClick={async () => {
                          if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently DELETE member ${selectedMember.membership_id} (${selectedMember.full_name})?\n\nThis will permanently purge all associated login credentials, password, application data, payment records, and documents!`)) return;
                          try {
                            setStatusUpdating(true);
                            const memberId = selectedMember.id;
                            const res = await deleteMember(memberId);
                            if (res.success) {
                              alert(`Member ${selectedMember.membership_id} and all login credentials have been permanently deleted.`);
                              setIsModalOpen(false);
                              setMembers(prev => prev.filter(item => item.id !== memberId));
                              setTotalCount(prev => Math.max(0, prev - 1));
                            }
                          } catch (err: any) {
                            alert(err.response?.data?.message || 'Failed to delete member.');
                          } finally { setStatusUpdating(false); }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className="material-icons text-sm">delete_forever</span>
                        Delete Member & Purge Credentials
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}
