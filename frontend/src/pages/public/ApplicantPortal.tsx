import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { trackApplication, ApplicationTrackResponse } from '../../services/applicationService';

export const ApplicantPortal: React.FC = () => {
  const [refNumber, setRefNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appData, setAppData] = useState<ApplicationTrackResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber.trim()) return;

    setIsLoading(true);
    setError(null);
    setAppData(null);

    try {
      const res = await trackApplication(refNumber.trim().toUpperCase());
      setAppData(res);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Could not find any application with this Reference Number. Please verify format (e.g., PCE-APP-2026-000104).');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="bg-[#FFC107]/10 text-[#B28704] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-poppins flex items-center gap-1 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#FFC107] animate-pulse"></span>
            Pending Review
          </span>
        );
      case 'Approved - Awaiting Payment':
        return (
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-poppins flex items-center gap-1 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Approved - Awaiting Payment
          </span>
        );
      case 'Needs More Information':
        return (
          <span className="bg-[#FFC107]/10 text-danger text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-poppins flex items-center gap-1 w-fit">
            <span className="material-icons text-sm">info</span>
            Needs Info
          </span>
        );
      case 'Rejected':
        return (
          <span className="bg-danger/10 text-danger text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-poppins flex items-center gap-1 w-fit">
            <span className="material-icons text-sm font-bold">cancel</span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="bg-[#C8A951]/10 text-[#A08236] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-poppins">
            Applicant Portal
          </span>
          <h2 className="mt-3 text-3xl font-extrabold font-poppins text-[#333333]">
            Track Application Status
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Enter your online application Reference Number to check real-time progress and notes from the membership board.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-card shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <span className="material-icons text-lg">tag</span>
              </span>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g., PCE-APP-2026-000104"
                className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 font-poppins tracking-wider"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-[#004C38] text-white font-poppins font-medium text-xs py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm font-bold">search</span>
                  Track Status
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="bg-danger/10 border-l-4 border-danger p-4 text-xs text-danger flex items-start gap-2 rounded-r-lg mb-8 animate-fadeIn">
            <span className="material-icons text-base mt-0.5">error</span>
            <div>
              <span className="font-bold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* Results Card */}
        {appData && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden animate-fadeIn">
            {/* Header info bar */}
            <div className="bg-[#E5F0ED] px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Application Reference</p>
                <h4 className="text-base font-bold text-primary font-poppins tracking-wider">{appData.referenceNumber}</h4>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:text-right">Submission Date</p>
                <p className="text-xs font-semibold text-gray-600 sm:text-right">{formatDate(appData.submittedAt)}</p>
              </div>
            </div>

            {/* Main content body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Profile overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-b border-gray-100 pb-6">
                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">Applicant Name</span>
                  <span className="font-bold text-gray-700 text-sm">{appData.applicantName}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">Current Status</span>
                  {getStatusBadge(appData.status)}
                </div>
              </div>

              {/* Status Explainer Alerts */}
              {appData.status === 'Pending' && (
                <div className="bg-[#FFC107]/10 border-l-4 border-[#FFC107] p-4 text-xs text-[#B28704] rounded-r-lg">
                  <p className="font-bold mb-1">Under Review</p>
                  <p className="leading-relaxed">
                    Our Membership Board is currently checking your eligibility qualifications and uploaded documents. This process normally takes 2-3 working days. We will notify you by email as soon as a status update is available.
                  </p>
                </div>
              )}

              {appData.status === 'Needs More Information' && (
                <div className="bg-danger/10 border-l-4 border-danger p-4 text-xs text-danger rounded-r-lg">
                  <p className="font-bold mb-1">Additional Information Required</p>
                  <p className="leading-relaxed mb-3">
                    The reviewer requires adjustments or extra documentation before finalizing approval. Please read the remarks from the officer below.
                  </p>
                  {appData.officerRemarks && (
                    <div className="bg-white/60 border border-danger/20 p-3 rounded font-poppins text-[11px] text-gray-700 italic">
                      " {appData.officerRemarks} "
                    </div>
                  )}
                </div>
              )}

              {appData.status === 'Approved - Awaiting Payment' && (
                <div className="bg-primary/10 border-l-4 border-primary p-4 text-xs text-primary rounded-r-lg space-y-3">
                  <p className="font-bold text-[#004C38]">Application Approved - Pending Admission Dues</p>
                  <p className="leading-relaxed">
                    Congratulations! Your application is approved. To finalize your chamber enrollment and receive your official **Membership ID** and **Portal Login**, please deposit the initial fees:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Admission Registration Fee: <strong>PKR 5,000</strong></li>
                    <li>First Monthly Contribution: <strong>PKR 2,000</strong></li>
                    <li>Total Payable: <strong>PKR 7,000</strong></li>
                  </ul>
                  <p className="leading-relaxed">
                    <strong>Payment Process:</strong>
                  </p>
                  <p className="leading-relaxed">
                    Transfer the total PKR 7,000 to the official bank account (Habib Bank Ltd, Account Title: Pakistan Chamber of Education, IBAN: PK12 HABB 0012 3456 7890 1203). Take a photograph/screenshot of your payment confirmation voucher, and send it to our office WhatsApp number <strong>+92 62 1234567</strong>.
                  </p>
                  <div className="pt-2">
                    <a 
                      href={`http://localhost:5000/api/challans/public/${appData.referenceNumber}/pdf`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 bg-primary hover:bg-[#004C38] text-white px-5 py-2.5 rounded-lg text-xs font-bold font-poppins shadow-sm transition"
                    >
                      <span className="material-icons text-sm">picture_as_pdf</span>
                      Download Dues Challan PDF
                    </a>
                  </div>
                </div>
              )}

              {(appData.status === 'Approved - Active Member' || appData.membershipId) && (
                <div className="bg-primary/10 border-l-4 border-primary p-6 text-xs text-primary rounded-r-lg space-y-4 font-inter">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-2xl text-primary">verified</span>
                    <div>
                      <h4 className="font-bold text-sm font-poppins text-primary">Official Membership Active & Verified!</h4>
                      <p className="text-gray-600 mt-0.5">Your payment has been verified and your official Chamber Membership has been issued.</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Your Official Membership ID</span>
                      <span className="text-base font-bold font-mono text-primary">{appData.membershipId || 'PCE-BWP-2026-000001'}</span>
                    </div>
                    <Link
                      to="/login"
                      className="bg-primary hover:bg-[#004C38] text-white px-5 py-2.5 rounded-lg text-xs font-bold font-poppins shadow-sm transition flex items-center gap-1.5"
                    >
                      <span className="material-icons text-sm">login</span>
                      Sign In to Member Portal
                    </Link>
                  </div>
                </div>
              )}

              {appData.status === 'Rejected' && (
                <div className="bg-danger/10 border-l-4 border-danger p-4 text-xs text-danger rounded-r-lg">
                  <p className="font-bold mb-1">Application Declined</p>
                  <p className="leading-relaxed mb-3">
                    Unfortunately, your application for membership in the Pakistan Chamber of Education has been rejected.
                  </p>
                  {appData.officerRemarks && (
                    <div className="bg-white/60 border border-danger/20 p-3 rounded font-poppins text-[11px] text-gray-700 italic">
                      " {appData.officerRemarks} "
                    </div>
                  )}
                </div>
              )}

              {/* Step Timeline Indicator */}
              <div className="pt-4 border-t border-gray-100">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#333333] mb-6 font-poppins">Application Timeline</h5>
                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  
                  {/* Timeline 1: Submitted */}
                  <div className="flex items-start gap-4">
                    <div className="w-7.5 h-7.5 rounded-full bg-primary text-white flex items-center justify-center z-10 flex-shrink-0">
                      <span className="material-icons text-sm font-bold">check</span>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-gray-700">Application Submitted</p>
                      <p className="text-gray-400 mt-0.5">Your registration form and documents were successfully logged into the Chamber directory database.</p>
                    </div>
                  </div>

                  {/* Timeline 2: Officer Review */}
                  <div className="flex items-start gap-4">
                    <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                      appData.status === 'Pending' 
                        ? 'bg-[#FFC107] text-white ring-4 ring-[#FFC107]/20' 
                        : appData.status === 'Rejected' || appData.status === 'Needs More Information'
                          ? 'bg-danger text-white'
                          : 'bg-primary text-white' // Approved
                    }`}>
                      <span className="material-icons text-sm font-bold">
                        {appData.status === 'Pending' 
                          ? 'hourglass_empty' 
                          : appData.status === 'Rejected' || appData.status === 'Needs More Information' 
                            ? 'close' 
                            : 'check'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-gray-700">Officer Document Verification</p>
                      {appData.status === 'Pending' && <p className="text-gray-400 mt-0.5">Our Reviewing Officers are analyzing your submitted data against qualification records.</p>}
                      {appData.status === 'Needs More Information' && <p className="text-danger mt-0.5">Reviewer requested clarification. Review remarks above.</p>}
                      {appData.status === 'Rejected' && <p className="text-danger mt-0.5">Application was rejected by the board.</p>}
                      {appData.status === 'Approved - Awaiting Payment' && <p className="text-[#28A745] font-semibold mt-0.5">Approved! Your credentials were verified successfully.</p>}
                    </div>
                  </div>

                  {/* Timeline 3: Payment Verification */}
                  <div className="flex items-start gap-4">
                    <div className="w-7.5 h-7.5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center z-10 flex-shrink-0">
                      <span className="material-icons text-sm">payments</span>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-gray-400">Admission Fee Settlement</p>
                      <p className="text-gray-400 mt-0.5">Verify your deposit receipt. Membership IDs are allocated immediately once payment is validated by the Finance Officer.</p>
                    </div>
                  </div>

                  {/* Timeline 4: Active Membership */}
                  <div className="flex items-start gap-4">
                    <div className="w-7.5 h-7.5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center z-10 flex-shrink-0">
                      <span className="material-icons text-sm">badge</span>
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-gray-400">Membership Activation</p>
                      <p className="text-gray-400 mt-0.5">Receive your official registration code, printable membership card, and portal credentials to log in.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
