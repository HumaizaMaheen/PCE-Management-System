import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Page Title */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-primary pb-3 inline-block">
          About the Chamber
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Pakistan Chamber of Education (PCE) — Division Bahawalpur
        </p>
      </div>

      {/* History and Overview */}
      <section className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-4">
        <h2 className="text-lg font-bold font-poppins text-primary">Our History & Mandate</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          [PLACEHOLDER TEXT] The Pakistan Chamber of Education (PCE) was established as a united consortium to represent the collective voice of academic institutions in Pakistan. Since its inception, the Division Bahawalpur Chapter has served as a dedicated advocate for private and public schools, academies, colleges, and early childhood centers. 
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          [PLACEHOLDER TEXT] Our mandate is built on facilitating dialogue between school owners and state educational departments, simplifying licensing and regulatory approvals, safeguarding student and teacher rights, and raising the quality of learning in South Punjab. We are committed to fostering academic standards, regulatory compliance, and administrative transparency.
        </p>
      </section>

      {/* Core Values Grid */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold font-poppins text-[#333333] text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card text-center space-y-3">
            <span className="material-icons text-primary text-3xl">gavel</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Integrity & Advocacy</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              [PLACEHOLDER TEXT] Representing our members with absolute honesty, ethics, and transparency in every regulatory meeting.
            </p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card text-center space-y-3">
            <span className="material-icons text-accent text-3xl">workspace_premium</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Academic Quality</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              [PLACEHOLDER TEXT] Equipping educators with modern skills, digital tools, and child safety knowledge to elevate learning.
            </p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card text-center space-y-3">
            <span className="material-icons text-[#28A745] text-3xl">diversity_3</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Unity & Collaboration</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              [PLACEHOLDER TEXT] Uniting diverse private and public educational entities to coordinate collective goals and rights.
            </p>
          </div>
        </div>
      </section>

      {/* Division Jurisdiction */}
      <section className="bg-[#006A4E]/5 border border-primary/10 p-8 rounded-card text-left space-y-4">
        <h2 className="text-lg font-bold font-poppins text-primary">Division Jurisdiction</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          [PLACEHOLDER TEXT] The PCE Division Bahawalpur has jurisdiction over three key districts of South Punjab, Pakistan. Our regional desk provides customized resources and support channels for schools situated in:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white border border-gray-100 p-4.5 rounded-lg text-center shadow-sm">
            <h3 className="font-bold text-xs text-primary font-poppins uppercase">District Bahawalpur</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Headquarters & Central Secretariat</p>
          </div>
          <div className="bg-white border border-gray-100 p-4.5 rounded-lg text-center shadow-sm">
            <h3 className="font-bold text-xs text-accent font-poppins uppercase">District Bahawalnagar</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">District Desk & Educator Support Hub</p>
          </div>
          <div className="bg-white border border-gray-100 p-4.5 rounded-lg text-center shadow-sm">
            <h3 className="font-bold text-xs text-primary font-poppins uppercase">District Rahim Yar Khan</h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">District Office & Legal Desk</p>
          </div>
        </div>
      </section>
    </div>
  );
};
