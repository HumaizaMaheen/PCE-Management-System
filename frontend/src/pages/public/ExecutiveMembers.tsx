import React from 'react';

interface BoardMember {
  name: string;
  role: string;
  district: string;
  qualification: string;
  institute: string;
}

export const ExecutiveMembers: React.FC = () => {
  const members: BoardMember[] = [
    {
      name: 'Prof. Dr. Muhammad Asif Ghafoor',
      role: 'Division Chairman',
      district: 'Bahawalpur',
      qualification: 'PhD in Education',
      institute: 'Central Secretariat'
    },
    {
      name: 'Mian Sajid Majeed',
      role: 'Division President',
      district: 'Bahawalpur',
      qualification: 'M.Phil English Literature',
      institute: 'Beaconhouse System (BWP)'
    },
    {
      name: 'Chaudhry Nisar Ahmed',
      role: 'Vice President',
      district: 'Rahim Yar Khan',
      qualification: 'M.Sc Physics',
      institute: 'RYK Science Academy'
    },
    {
      name: 'Rana Muhammad Tanveer',
      role: 'General Secretary',
      district: 'Bahawalnagar',
      qualification: 'MA Education',
      institute: 'Chishtian Public School'
    },
    {
      name: 'Syed Ali Raza Shah',
      role: 'Finance Secretary',
      district: 'Bahawalpur',
      qualification: 'MBA Finance',
      institute: 'Quaid-e-Azam College BWP'
    },
    {
      name: 'Mrs. Farzana Kausar',
      role: 'Joint Secretary (Female Wing)',
      district: 'Bahawalpur',
      qualification: 'M.Sc Zoology',
      institute: 'Bahawalpur Girls High School'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333]">
          Executive Committee
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          PCE Division Bahawalpur Leadership Board &bull; Fiscal Year 2026-27
        </p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Intro */}
      <div className="bg-white border border-gray-100 p-8 rounded-card shadow-sm max-w-3xl mx-auto text-center">
        <p className="text-gray-500 text-sm leading-relaxed">
          [PLACEHOLDER TEXT] The executive body of the Pakistan Chamber of Education (Division Bahawalpur) consists of experienced educational administrators, consultants, and leaders elected by member institutions. The board handles strategic policy approvals, government interactions, and supervises the regional district desks.
        </p>
      </div>

      {/* Grid of Board Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {members.map((member, idx) => (
          <div 
            key={idx} 
            className="bg-white border border-gray-100 p-6 rounded-card shadow-card hover:shadow-cardHover transition duration-200 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Soft Avatar representation */}
              <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                <span className="material-icons text-3xl">account_circle</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm font-poppins text-[#333333]">{member.name}</h3>
                <p className="text-xs text-primary font-semibold font-poppins">{member.role}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase font-poppins tracking-wide">
                  District: {member.district}
                </p>
              </div>
              <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-50">
                <p><strong>Qualification:</strong> {member.qualification}</p>
                <p><strong>Affiliation:</strong> {member.institute}</p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between items-center text-[10px] font-semibold text-gray-400 font-poppins uppercase">
              <span>Chamber Officer</span>
              <span className="text-success">&bull; Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
