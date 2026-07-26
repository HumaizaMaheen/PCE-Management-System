import React from 'react';

export const VisionMission: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-16 text-left animate-fadeIn">
      {/* Page Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333]">
          Vision & Mission
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Defining our direction, commitments, and core strategy
        </p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vision Card */}
        <div className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4 flex flex-col justify-between hover:shadow-cardHover transition duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-icons text-primary bg-primary/5 p-2 rounded-lg text-2xl">visibility</span>
              <h2 className="text-xl font-bold font-poppins text-primary">Our Vision</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              [PLACEHOLDER TEXT] To champion a progressive, inclusive, and standardized educational landscape in Pakistan. We envision an environment where private and public institutions operate harmoniously, teachers are constantly empowered with modern pedagogical standards, and every student in the Bahawalpur Division has access to globally-competitive learning environments.
            </p>
          </div>
          <div className="pt-2 text-[10px] text-accent font-bold uppercase tracking-wider font-poppins">
            Future-Oriented Academic Excellence
          </div>
        </div>

        {/* Mission Card */}
        <div className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4 flex flex-col justify-between hover:shadow-cardHover transition duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-icons text-accent bg-accent/5 p-2 rounded-lg text-2xl">rocket_launch</span>
              <h2 className="text-xl font-bold font-poppins text-accent">Our Mission</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              [PLACEHOLDER TEXT] To represent and protect the rights of educational institutions, owners, and educators by active policy advocacy. We fulfill this by offering institutional certifications, organizing professional teacher development certifications, extending free legal/compliance consulting desk assistance, and maintaining a transparent, clean general ledger model for operational efficiency.
            </p>
          </div>
          <div className="pt-2 text-[10px] text-primary font-bold uppercase tracking-wider font-poppins">
            Active Advocacy & Practical Support
          </div>
        </div>
      </div>

      {/* Strategic Pillars */}
      <section className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6">
        <h2 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-50 pb-3">Strategic Pillars for 2026-2030</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs font-poppins flex-shrink-0">1</span>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Empowerment of Educators</h3>
              <p className="text-xs text-gray-500 leading-normal">[PLACEHOLDER TEXT] Continuous teacher certification, curriculum alignment meetings, and early childhood instruction support.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-accent/5 text-accent flex items-center justify-center font-bold text-xs font-poppins flex-shrink-0">2</span>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Regulatory Reform & Advocacy</h3>
              <p className="text-xs text-gray-500 leading-normal">[PLACEHOLDER TEXT] Working alongside provincial government ministries to simplify tax registrations and institutional approvals.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs font-poppins flex-shrink-0">3</span>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Digital Transformation</h3>
              <p className="text-xs text-gray-500 leading-normal">[PLACEHOLDER TEXT] Supporting the transition of member institutions to digital attendance, online billing portals, and database management systems.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
