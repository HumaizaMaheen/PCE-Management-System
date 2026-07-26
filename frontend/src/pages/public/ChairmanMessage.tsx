import React from 'react';

export const ChairmanMessage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-accent pb-3 inline-block">
          Chairman's Message
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Prof. Dr. Muhammad Asif Ghafoor &bull; Division Bahawalpur
        </p>
      </div>

      {/* Profile Card / Accent Box */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-white border border-gray-100 p-6 rounded-card shadow-sm">
        <div className="w-28 h-28 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
          <span className="material-icons text-primary text-6xl">account_circle</span>
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="font-bold text-base font-poppins text-[#333333]">Prof. Dr. Muhammad Asif Ghafoor</h2>
          <p className="text-xs text-primary font-semibold font-poppins">Chairman, Pakistan Chamber of Education (Division Bahawalpur)</p>
          <p className="text-[10px] text-gray-400 font-medium">PhD in Education | Senior Academic Consultant & Reformist</p>
        </div>
      </div>

      {/* Complete Message */}
      <section className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>
          Dear Members, Academicians, and Partners,
        </p>
        <p>
          [PLACEHOLDER TEXT] It is my distinct privilege to welcome you to the official portal of the Pakistan Chamber of Education (PCE), Division Bahawalpur. Education represents the cornerstone of national progress, and private and public academic entities in South Punjab play a key role in making education accessible to all children in our communities.
        </p>
        <p>
          [PLACEHOLDER TEXT] Operating an educational institution in today's regulatory environment involves numerous administrative challenges. From maintaining database directories and tracking recurring subscription fee challans to resolving administrative disputes, school administrators require a supportive, unified platform. PCE provides this collective voice.
        </p>
        <p>
          [PLACEHOLDER TEXT] This management ERP is part of our commitment to transparency, digital transformation, and ease of governance. Our newly launched system automates membership application tracking, challan delivery, payment receipt verification, and financial ledger accounting. By digitizing our operations, we ensure that every single rupee contributed towards the Chamber is audited and utilized correctly.
        </p>
        <p>
          [PLACEHOLDER TEXT] I encourage all non-affiliated schools, colleges, and training academies in Bahawalpur, Bahawalnagar, and Rahim Yar Khan to join our chamber. Together, we can elevate learning pedagogical standards, protect academic rights, and build a resilient educational system in Punjab.
        </p>
        <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
          <div>
            <p className="font-bold text-[#333333] font-poppins text-xs">Prof. Dr. Muhammad Asif Ghafoor</p>
            <p className="text-[10px] text-gray-400 font-medium">Chairman, PCE Bahawalpur Division</p>
          </div>
          <div className="text-right">
            <span className="font-signature text-gray-300 select-none text-2xl italic font-serif">Asif Ghafoor</span>
          </div>
        </div>
      </section>
    </div>
  );
};
