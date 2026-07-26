import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Stats {
  stat_total_members: string;
  stat_provinces_covered: string;
  stat_institutions: string;
  stat_years_of_service: string;
}

export const Home: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    stat_total_members: '1,200+',
    stat_provinces_covered: '4',
    stat_institutions: '350+',
    stat_years_of_service: '10+'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/settings')
      .then((res) => {
        if (res.data && res.data.settings) {
          const s = res.data.settings;
          setStats({
            stat_total_members: s.stat_total_members || '1,250+',
            stat_provinces_covered: s.stat_provinces_covered || '4',
            stat_institutions: s.stat_institutions || '380+',
            stat_years_of_service: s.stat_years_of_service || '12+'
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load public statistics:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col bg-[#F7F9FA] animate-fadeIn">
      {/* 1. Hero Section */}
      <section className="relative bg-[#006A4E] text-white overflow-hidden py-20 lg:py-28 px-6">
        {/* Background decorative overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-primary-dark to-primary-dark pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-[#FAFBFB]/10 backdrop-blur-md text-accent border border-accent/20 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-poppins">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping"></span>
              Division Bahawalpur Chapter
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold font-poppins leading-tight tracking-tight">
              Empowering Institutions,<br />
              <span className="text-[#DCC37E]">Elevating Education.</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-xl font-inter leading-relaxed">
              [PLACEHOLDER TEXT] The Pakistan Chamber of Education (PCE) is the apex regulatory body representing private and public academic entities in the Bahawalpur Division. We strive to advocate for policy reforms, deliver educator training workshops, and facilitate institutional governance.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => alert("Membership Application system is arriving in Phase 3!")}
                className="bg-accent hover:bg-accent-dark text-white font-poppins font-medium text-xs px-6 py-3 rounded-lg shadow-md transition duration-200"
              >
                Apply for Membership
              </button>
              <Link 
                to="/about"
                className="bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-poppins font-medium text-xs px-6 py-3 rounded-lg transition duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-card shadow-xl space-y-5 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div>
              <h2 className="text-lg font-bold font-poppins text-accent flex items-center gap-2">
                <span className="material-icons text-xl">gavel</span>
                Key Chamber Focus
              </h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="material-icons text-accent text-lg mt-0.5">verified_user</span>
                  <p className="text-xs text-white/85 leading-normal">
                    <strong>Policy Representation:</strong> Voicing member concerns to regulatory boards.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="material-icons text-accent text-lg mt-0.5">school</span>
                  <p className="text-xs text-white/85 leading-normal">
                    <strong>Capacity Building:</strong> Organizing teacher training courses and conferences.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="material-icons text-accent text-lg mt-0.5">account_balance</span>
                  <p className="text-xs text-white/85 leading-normal">
                    <strong>Legal Support:</strong> Free consulting desk for school operations & compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="bg-white border-b border-gray-100 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse space-y-2 py-4">
                  <div className="h-8 bg-gray-100 rounded-full w-24 mx-auto"></div>
                  <div className="h-4 bg-gray-100 rounded-full w-32 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-x-0 sm:divide-x divide-gray-100 text-center">
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold font-poppins text-primary">{stats.stat_total_members}</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total Members</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold font-poppins text-accent">{stats.stat_provinces_covered}</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Provinces Covered</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold font-poppins text-primary">{stats.stat_institutions}</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Institutions Affiliated</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold font-poppins text-accent">{stats.stat_years_of_service}</h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Years of Service</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Membership Benefits Preview */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#333333]">Why Join PCE?</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            [PLACEHOLDER TEXT] Unlock premium privileges and join thousands of educational leaders driving academic excellence across Pakistan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card hover:shadow-cardHover transition duration-200 text-left space-y-4">
            <span className="material-icons text-primary bg-primary/5 p-3 rounded-lg">shield</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Legal Defense</h3>
            <p className="text-xs text-gray-500 leading-relaxed">[PLACEHOLDER TEXT] Representation in legal and administrative disputes related to institutional operations.</p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card hover:shadow-cardHover transition duration-200 text-left space-y-4">
            <span className="material-icons text-accent bg-accent/5 p-3 rounded-lg">trending_up</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Growth Seminars</h3>
            <p className="text-xs text-gray-500 leading-relaxed">[PLACEHOLDER TEXT] Exclusive access to teacher training modules, leadership programs, and accreditation advice.</p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card hover:shadow-cardHover transition duration-200 text-left space-y-4">
            <span className="material-icons text-[#28A745] bg-[#28A745]/5 p-3 rounded-lg">description</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Admin Toolkits</h3>
            <p className="text-xs text-gray-500 leading-relaxed">[PLACEHOLDER TEXT] Downloadable templates for school bylaws, contract layouts, fee structures, and syllabus outlines.</p>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card hover:shadow-cardHover transition duration-200 text-left space-y-4">
            <span className="material-icons text-[#DC3545] bg-[#DC3545]/5 p-3 rounded-lg">group</span>
            <h3 className="font-bold text-sm font-poppins text-[#333333]">Advocacy Network</h3>
            <p className="text-xs text-gray-500 leading-relaxed">[PLACEHOLDER TEXT] Become part of a collective voice negotiating with boards and education departments.</p>
          </div>
        </div>
        <div className="pt-4">
          <Link to="/benefits" className="text-primary hover:text-[#004C38] font-poppins font-semibold text-xs inline-flex items-center gap-1">
            View All Membership Privileges
            <span className="material-icons text-xs">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* 4. Leadership Focus */}
      <section className="bg-white py-20 px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="w-48 h-48 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center relative overflow-hidden flex-shrink-0">
            {/* Soft avatar representation */}
            <span className="material-icons text-gray-300 text-8xl">account_circle</span>
            <div className="absolute bottom-0 inset-x-0 bg-primary/80 py-1 text-center">
              <span className="text-[10px] text-white font-bold font-poppins">Chairman</span>
            </div>
          </div>
          
          <div className="space-y-4 text-left">
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-[#333333]">Message from the Chairman</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-poppins">Prof. Dr. Muhammad Asif Ghafoor</p>
            <p className="text-gray-500 text-sm leading-relaxed italic">
              "[PLACEHOLDER TEXT] Welcome to the Pakistan Chamber of Education. Our division in Bahawalpur is dedicated to establishing an exemplary benchmark in education. By coordinating private efforts, training faculty, and engaging in policy development, we aim to shape a brighter future for educational development in Pakistan."
            </p>
            <div className="pt-2">
              <Link to="/chairman-message" className="bg-[#FAFBFB] hover:bg-gray-100 border border-gray-200 text-xs font-poppins font-medium text-gray-700 px-4.5 py-2.5 rounded-lg inline-flex items-center gap-1 transition">
                Read Message in Full
                <span className="material-icons text-xs">arrow_right_alt</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Latest News & Announcements */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#333333]">News & Events</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            [PLACEHOLDER TEXT] Stay updated with recent announcements, meetings, workshops, and notifications from the Chamber.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              date: 'July 20, 2026',
              tag: 'Seminar',
              title: 'Annual Teacher Training Workshop Bahawalpur 2026',
              desc: '[PLACEHOLDER TEXT] Organizing the annual training workshop for primary school educators. Focus on modern STEM pedagogical techniques and child-centered teaching methodologies.'
            },
            {
              date: 'July 15, 2026',
              tag: 'Regulatory',
              title: 'Bylaw Consultation Meeting with Board Officials',
              desc: '[PLACEHOLDER TEXT] General meeting scheduled with the Board of Intermediate and Secondary Education (BISE) regarding private school registrations and tax models.'
            },
            {
              date: 'July 08, 2026',
              tag: 'Notification',
              title: 'Chamber Fee Structure Configured for Fiscal Year 2026-27',
              desc: '[PLACEHOLDER TEXT] The executive body has finalized the membership fee schedules for affiliated educational institutions. Monthly dues are set at default PKR 2000.'
            }
          ].map((item, idx) => (
            <article key={idx} className="bg-white border border-gray-100 rounded-card shadow-card hover:shadow-cardHover transition duration-200 flex flex-col justify-between overflow-hidden">
              <div className="p-6 space-y-3 flex-grow">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-wider font-poppins">
                  <span className="text-gray-400">{item.date}</span>
                  <span className="bg-[#E5F0ED] text-primary px-2.5 py-0.5 rounded-full uppercase">{item.tag}</span>
                </div>
                <h3 className="font-bold text-sm font-poppins text-[#333333] hover:text-primary transition line-clamp-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.desc}</p>
              </div>
              <div className="px-6 py-4 border-t border-gray-50 bg-[#FAFBFB] text-left">
                <Link to="/news" className="text-primary hover:text-[#004C38] font-poppins font-bold text-xs inline-flex items-center gap-1">
                  Read Article
                  <span className="material-icons text-xs">arrow_forward</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
