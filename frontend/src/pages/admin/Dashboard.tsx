import { useState, useEffect } from 'react';
import { getDashboardKPIs, getApplications, getMemberMe, ApplicationData, DashboardKPIs, MemberData } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const isMember = user?.role === 'Viewer';

  // Admin Dashboard State
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentApps, setRecentApps] = useState<ApplicationData[]>([]);

  // Member Dashboard State
  const [memberProfile, setMemberProfile] = useState<MemberData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        if (isMember) {
          try {
            const profile = await getMemberMe();
            setMemberProfile(profile);
          } catch (e) {}
        } else {
          try {
            const kpiData = await getDashboardKPIs();
            setKpis(kpiData);
          } catch (e) {}

          try {
            const appsData = await getApplications({ status: 'Pending', limit: 5 });
            if (appsData && Array.isArray(appsData.data)) {
              setRecentApps(appsData.data);
            }
          } catch (e) {}
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('403')) {
          setError(err.message || 'Failed to fetch dashboard data');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isMember]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !error.includes('403')) {
    return (
      <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg flex items-center gap-3">
        <span className="material-icons">error</span>
        <span className="font-poppins text-xs font-semibold">{error}</span>
      </div>
    );
  }

  // =========================================================================
  // MEMBER DASHBOARD VIEW (Role: Viewer)
  // =========================================================================
  if (isMember) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-poppins text-[#333333] leading-tight flex items-center gap-2">
              Welcome, {memberProfile?.full_name || user?.full_name}! 👋
            </h2>
            <p className="text-xs text-gray-500 font-inter mt-1">
              Official Member Portal — Pakistan Chamber of Education (Division Bahawalpur)
            </p>
          </div>
          <div>
            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-poppins text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {memberProfile?.status || 'Active Member'}
            </span>
          </div>
        </div>

        {/* SECTION 1: DIGITAL MEMBERSHIP CARD (WOW FACTOR) */}
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#00523C] via-[#006A4E] to-[#003828] text-white rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-[#C8A951]/40 space-y-6">
            
            {/* Watermark & Decorative Gold Elements */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#C8A951]/10 pointer-events-none blur-xl"></div>
            <div className="absolute right-6 top-6 opacity-20 pointer-events-none">
              <span className="material-icons text-7xl text-[#C8A951]">account_balance</span>
            </div>

            {/* Card Header */}
            <div className="flex justify-between items-start border-b border-white/15 pb-4 relative z-10">
              <div>
                <span className="text-[10px] font-bold font-poppins text-[#C8A951] uppercase tracking-widest block">Official Membership Identity</span>
                <h3 className="text-sm font-bold font-poppins tracking-wide uppercase text-white mt-0.5">
                  Pakistan Chamber of Education
                </h3>
                <p className="text-[10px] text-gray-300 font-inter">Division Bahawalpur, Punjab, Pakistan</p>
              </div>
              <span className="material-icons text-3xl text-[#C8A951]">verified</span>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center relative z-10">
              {/* Photo Avatar */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-24 h-24 rounded-full border-4 border-[#C8A951] shadow-md bg-white text-primary font-bold text-3xl flex items-center justify-center font-poppins uppercase mb-2">
                  {memberProfile?.full_name ? memberProfile.full_name.charAt(0) : 'P'}
                </div>
                <span className="text-[10px] bg-[#C8A951] text-black font-bold px-2 py-0.5 rounded font-poppins uppercase tracking-wider">
                  VERIFIED MEMBER
                </span>
              </div>

              {/* Member Primary Info */}
              <div className="sm:col-span-2 space-y-3 text-xs font-inter">
                <div>
                  <span className="text-[10px] text-gray-300 uppercase font-semibold block">Member Name</span>
                  <p className="text-base font-bold text-white font-poppins">{memberProfile?.full_name || user?.full_name}</p>
                  <p className="text-[11px] text-[#C8A951] font-medium">{memberProfile?.occupation_designation || 'Educator Member'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-gray-300 uppercase font-semibold block">Membership ID</span>
                    <p className="font-mono font-bold text-[#C8A951] text-xs">{memberProfile?.membership_id || 'PCE-BWP-2026-000001'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-300 uppercase font-semibold block">District</span>
                    <p className="font-semibold text-white text-xs">{memberProfile?.district || 'Bahawalpur'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-300 uppercase font-semibold block">CNIC No</span>
                    <p className="font-mono text-gray-200 text-xs">{memberProfile?.cnic || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-300 uppercase font-semibold block">Institute</span>
                    <p className="font-semibold text-gray-200 text-xs truncate max-w-[120px]">{memberProfile?.organization_school_name || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-white/15 flex justify-between items-center text-[10px] text-gray-300 font-poppins relative z-10">
              <span>Issued by: Executive Committee PCE</span>
              <span className="font-mono text-[#C8A951]">Valid Member 2026-2027</span>
            </div>

          </div>
        </div>

        {/* SECTION 2: MEMBER QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-gray-100 p-5 rounded-card shadow-sm space-y-2">
            <span className="material-icons text-3xl text-primary">badge</span>
            <h4 className="font-bold text-sm font-poppins text-gray-800">Digital Identity Badge</h4>
            <p className="text-xs text-gray-500 font-inter">Your official PCE membership card verified by division headquarters.</p>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-card shadow-sm space-y-2">
            <span className="material-icons text-3xl text-primary">receipt_long</span>
            <h4 className="font-bold text-sm font-poppins text-gray-800">Monthly Dues & Receipts</h4>
            <p className="text-xs text-gray-500 font-inter">View payment records and download bank deposit challans.</p>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-card shadow-sm space-y-2">
            <span className="material-icons text-3xl text-primary">headset_mic</span>
            <h4 className="font-bold text-sm font-poppins text-gray-800">Chamber Secretariat Support</h4>
            <p className="text-xs text-gray-500 font-inter">Contact Bahawalpur division secretariat for official assistance.</p>
          </div>
        </div>

        {/* SECTION 3: INVOICE & CHALLAN HISTORY */}
        <div className="bg-white border border-gray-100 rounded-card p-6 shadow-sm space-y-4 font-inter text-xs">
          <h3 className="text-sm font-bold font-poppins text-[#333333] flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="material-icons text-primary">receipt</span>
            Payment History & Dues Records
          </h3>

          {memberProfile?.challans && memberProfile.challans.length > 0 ? (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFBFB] text-gray-500 font-poppins font-semibold border-b border-gray-100">
                    <th className="p-3">Challan No</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {memberProfile.challans.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-bold text-gray-800">{c.challan_number}</td>
                      <td className="p-3 font-bold text-primary">PKR {parseFloat(c.total_amount as any).toLocaleString()}</td>
                      <td className="p-3 font-sans text-gray-600">{new Date(c.due_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
              <p>Your payment receipts will appear here once verified.</p>
            </div>
          )}
        </div>

      </div>
    );
  }

  // =========================================================================
  // ADMIN DASHBOARD VIEW (Super Admin, Finance, Membership Officers)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">Dashboard Overview</h2>
        <p className="text-xs text-gray-500 font-inter mt-1">
          Welcome to the Pakistan Chamber of Education administrative command center.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Members */}
        <div className="bg-white border border-gray-100 rounded-[12px] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-poppins">Active Members</p>
            <h3 className="text-2xl font-bold font-poppins text-[#333333] mt-1">{kpis?.activeMembers || 0}</h3>
            <p className="text-[10px] text-gray-500 mt-2 font-inter">Verified & active accounts</p>
          </div>
          <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center">
            <span className="material-icons text-2xl">verified_user</span>
          </div>
        </div>

        {/* Pending Applications */}
        <div className="bg-white border border-gray-100 rounded-[12px] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-poppins">Pending Review</p>
            <h3 className="text-2xl font-bold font-poppins text-accent mt-1">{kpis?.pendingApplications || 0}</h3>
            <p className="text-[10px] text-gray-500 mt-2 font-inter">Awaiting officer action</p>
          </div>
          <div className="w-12 h-12 bg-accent/5 text-accent rounded-full flex items-center justify-center">
            <span className="material-icons text-2xl">hourglass_empty</span>
          </div>
        </div>

        {/* Approved - Awaiting Payment */}
        <div className="bg-white border border-gray-100 rounded-[12px] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-poppins">Awaiting Payment</p>
            <h3 className="text-2xl font-bold font-poppins text-primary mt-1">{kpis?.approvedAwaitingPayment || 0}</h3>
            <p className="text-[10px] text-gray-500 mt-2 font-inter">Challans generated</p>
          </div>
          <div className="w-12 h-12 bg-primary/5 text-primary rounded-full flex items-center justify-center">
            <span className="material-icons text-2xl">payments</span>
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="bg-white border border-gray-100 rounded-[12px] shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-poppins">Rejected</p>
            <h3 className="text-2xl font-bold font-poppins text-danger mt-1">{kpis?.rejectedApplications || 0}</h3>
            <p className="text-[10px] text-gray-500 mt-2 font-inter">Declined submissions</p>
          </div>
          <div className="w-12 h-12 bg-danger/5 text-danger rounded-full flex items-center justify-center">
            <span className="material-icons text-2xl">cancel</span>
          </div>
        </div>

      </div>

      {/* Quick Action Banner */}
      <div className="bg-[#FAFBFB] border border-gray-100 rounded-[12px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-icons">rate_review</span>
          </div>
          <div>
            <h4 className="font-bold text-sm font-poppins text-[#333333]">Review Pending Membership Submissions</h4>
            <p className="text-xs text-gray-500 font-inter mt-0.5">
              Inspect applicant CNIC cards, degree documents, and issue payment challans.
            </p>
          </div>
        </div>
        <Link
          to="/admin/applications"
          className="bg-primary hover:bg-[#00523C] text-white px-5 py-2.5 rounded-lg text-xs font-bold font-poppins transition shadow-sm whitespace-nowrap"
        >
          Open Applications Queue
        </Link>
      </div>

      {/* Recent Pending Applications Table */}
      <div className="bg-white border border-gray-100 rounded-[12px] p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm font-poppins text-[#333333]">Recent Applications Pending Action</h3>
          <Link to="/admin/applications" className="text-xs font-bold font-poppins text-primary hover:underline">
            View All →
          </Link>
        </div>

        {recentApps.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-inter">
            No pending applications at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-inter">
              <thead>
                <tr className="bg-[#FAFBFB] text-gray-500 font-poppins font-semibold border-b border-gray-100">
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">CNIC</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {recentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAFBFB] transition">
                    <td className="p-3 font-semibold text-gray-800">{app.full_name}</td>
                    <td className="p-3 font-mono">{app.cnic}</td>
                    <td className="p-3">{app.district}</td>
                    <td className="p-3 font-sans text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <Link
                        to="/admin/applications"
                        className="bg-primary/5 hover:bg-primary/10 text-primary px-3 py-1 rounded text-[10px] font-bold font-poppins transition"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
