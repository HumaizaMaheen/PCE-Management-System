import React from 'react';

export const Benefits: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-primary pb-3 inline-block">
          Membership Benefits
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Rights, privileges, and support channels for affiliated institutions
        </p>
      </div>

      {/* Intro */}
      <div className="bg-white border border-gray-100 p-8 rounded-card shadow-sm text-center">
        <p className="text-gray-500 text-sm leading-relaxed">
          [PLACEHOLDER TEXT] Affiliation with the Pakistan Chamber of Education grants your academic institution official accreditation, policy support, and structural tools to excel. We support school administrators, early childhood institutes, and private academies throughout the Bahawalpur Division.
        </p>
      </div>

      {/* Detailed List */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4 hover:shadow-cardHover transition duration-200">
          <div className="flex items-center gap-3">
            <span className="material-icons text-primary bg-primary/5 p-2 rounded-lg">shield</span>
            <h2 className="text-base font-bold font-poppins text-primary">1. Policy Representation & Advocacy</h2>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            [PLACEHOLDER TEXT] Chamber officers actively lobby on behalf of private educational institutes in meetings with BISE boards, the Punjab Education Foundation (PEF), and provincial ministries. We advocate for rationalized taxes, simplified registration renewals, and progressive zoning regulations.
          </p>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4 hover:shadow-cardHover transition duration-200">
          <div className="flex items-center gap-3">
            <span className="material-icons text-accent bg-accent/5 p-2 rounded-lg">school</span>
            <h2 className="text-base font-bold font-poppins text-accent">2. Professional Educator Training</h2>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            [PLACEHOLDER TEXT] Members receive priority reservations and discounted entry for their faculty in PCE-organized Teacher Training Workshops. Topics cover digital teaching tools, modern STEM education, children mental wellness, and syllabus alignments.
          </p>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4 hover:shadow-cardHover transition duration-200">
          <div className="flex items-center gap-3">
            <span className="material-icons text-success bg-success/5 p-2 rounded-lg">description</span>
            <h2 className="text-base font-bold font-poppins text-success">3. Administrative Resource Vault</h2>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            [PLACEHOLDER TEXT] Access templates and legal boilerplate structures for your daily operations. This includes teacher employment contracts, school bylaws, parent-teacher association structures, fee registers, and standardized school health policies.
          </p>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4 hover:shadow-cardHover transition duration-200">
          <div className="flex items-center gap-3">
            <span className="material-icons text-danger bg-danger/5 p-2 rounded-lg">gavel</span>
            <h2 className="text-base font-bold font-poppins text-danger">4. Legal & Compliance Help Desk</h2>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            [PLACEHOLDER TEXT] Free primary consultation with the Chamber's legal panel to resolve property disputes, labor disagreements, BISE compliance warnings, or taxation questions.
          </p>
        </div>
      </div>

      {/* Pricing / Contribution call out */}
      <div className="bg-primary text-white p-8 rounded-card text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <h2 className="text-xl font-bold font-poppins text-accent">Membership Dues Details</h2>
        <p className="text-white/80 text-xs max-w-xl mx-auto leading-relaxed">
          [PLACEHOLDER TEXT] Affiliation is open to all schools and colleges. To maintain Chamber operations, legal panels, and support secretariats, members contribute standard monthly dues of **PKR 2,000** (subject to configuration in settings).
        </p>
        <div className="pt-2">
          <button 
            onClick={() => alert("Membership Application system is arriving in Phase 3!")}
            className="bg-accent hover:bg-accent-dark text-white font-poppins font-medium text-xs px-6 py-3 rounded-lg shadow-md transition"
          >
            Submit Affiliation Form
          </button>
        </div>
      </div>
    </div>
  );
};
