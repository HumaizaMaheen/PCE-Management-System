import React, { useState } from 'react';

interface NewsItem {
  date: string;
  category: 'Announcement' | 'Workshop' | 'Notification';
  title: string;
  desc: string;
}

export const News: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Announcement' | 'Workshop' | 'Notification'>('All');

  const newsData: NewsItem[] = [
    {
      date: 'July 20, 2026',
      category: 'Workshop',
      title: 'Annual Teacher Training Workshop Bahawalpur 2026',
      desc: '[PLACEHOLDER TEXT] Organizing the annual training workshop for primary school educators. Focus on modern STEM pedagogical techniques, child-centered teaching methodologies, and active classroom management systems.'
    },
    {
      date: 'July 15, 2026',
      category: 'Announcement',
      title: 'Bylaw Consultation Meeting with BISE Board Officials',
      desc: '[PLACEHOLDER TEXT] General meeting scheduled with the Board of Intermediate and Secondary Education (BISE) regarding private school registration simplifications, tax exemptions, and syllabus alignments.'
    },
    {
      date: 'July 08, 2026',
      category: 'Notification',
      title: 'Chamber Fee Structure Configured for Fiscal Year 2026-27',
      desc: '[PLACEHOLDER TEXT] The executive body has finalized the membership fee schedules for affiliated educational institutions. Monthly dues are set at default PKR 2000, and admission fees at PKR 5000.'
    },
    {
      date: 'June 28, 2026',
      category: 'Workshop',
      title: 'Early Childhood Education (ECE) Seminar in Rahim Yar Khan',
      desc: '[PLACEHOLDER TEXT] Educator training conference centered on early child psychology, sensory learning development, and preschool administrative planning. Conducted by international guest speakers.'
    },
    {
      date: 'June 14, 2026',
      category: 'Announcement',
      title: 'Launch of Online Dues & Challan Portal System',
      desc: '[PLACEHOLDER TEXT] We are proud to launch our automated ERP billing and membership management portal for Division Bahawalpur. Members can now retrieve invoices, download PDF challans, and check payment approvals.'
    },
    {
      date: 'June 02, 2026',
      category: 'Notification',
      title: 'Notification Regarding Summer Vacation Schedules 2026',
      desc: '[PLACEHOLDER TEXT] Official communication sent to all affiliated private institutions regarding compliance with the School Education Department (SED) summer vacations guidelines and calendar.'
    }
  ];

  const filteredNews = filter === 'All' ? newsData : newsData.filter(item => item.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333]">
          News & Announcements
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Recent releases, notifications, and events from Bahawalpur Division
        </p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {['All', 'Announcement', 'Workshop', 'Notification'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            className={`font-poppins font-medium text-xs px-4 py-2 rounded-full border transition duration-200 ${filter === cat ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
          >
            {cat === 'All' ? 'All Updates' : `${cat}s`}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredNews.map((item, idx) => (
          <article 
            key={idx} 
            className="bg-white border border-gray-100 rounded-card shadow-card hover:shadow-cardHover transition duration-200 flex flex-col justify-between overflow-hidden"
          >
            <div className="p-6 space-y-3 flex-grow">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-wider font-poppins">
                <span className="text-gray-400">{item.date}</span>
                <span className={`px-2.5 py-0.5 rounded-full uppercase ${item.category === 'Announcement' ? 'bg-[#E5F0ED] text-primary' : item.category === 'Workshop' ? 'bg-accent/10 text-accent-dark' : 'bg-blue-50 text-blue-600'}`}>{item.category}</span>
              </div>
              <h3 className="font-bold text-sm font-poppins text-[#333333] hover:text-primary transition line-clamp-2">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">{item.desc}</p>
            </div>
            <div className="px-6 py-4.5 border-t border-gray-50 bg-[#FAFBFB] text-left">
              <button 
                onClick={() => alert(`Full detail for "${item.title}" is coming in a future update.`)}
                className="text-primary hover:text-[#004C38] font-poppins font-bold text-xs inline-flex items-center gap-1"
              >
                Read Full Details
                <span className="material-icons text-xs">arrow_forward</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-xs">
          No announcements found in this category.
        </div>
      )}
    </div>
  );
};
