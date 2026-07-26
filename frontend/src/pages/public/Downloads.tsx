import React from 'react';

interface DownloadFile {
  title: string;
  category: string;
  fileSize: string;
  format: string;
  description: string;
}

export const Downloads: React.FC = () => {
  const files: DownloadFile[] = [
    {
      title: 'PCE Membership Prospectus & Rules',
      category: 'General Guides',
      fileSize: '2.4 MB',
      format: 'PDF',
      description: '[PLACEHOLDER TEXT] Details eligibility, guidelines, monthly fee carry-forward, and legal desk regulations for Division Bahawalpur.'
    },
    {
      title: 'Physical Membership Application Form',
      category: 'Forms',
      fileSize: '850 KB',
      format: 'PDF',
      description: '[PLACEHOLDER TEXT] Standard paper application form for offline submittals. Required for institutions lacking internet access.'
    },
    {
      title: 'Chamber Bylaws & Constitution 2026',
      category: 'Regulatory',
      fileSize: '4.1 MB',
      format: 'PDF',
      description: '[PLACEHOLDER TEXT] The legal constitution of the Pakistan Chamber of Education detailing operational rights and executive protocols.'
    },
    {
      title: 'Teacher Training Workshop Catalog',
      category: 'Workshops',
      fileSize: '1.2 MB',
      format: 'PDF',
      description: '[PLACEHOLDER TEXT] Comprehensive list of training courses, STEM methodologies, and certification schedules for teachers.'
    },
    {
      title: 'Challan Submission Guide & EasyPaisa Steps',
      category: 'Financial Help',
      fileSize: '950 KB',
      format: 'PDF',
      description: '[PLACEHOLDER TEXT] Explanatory document showing how to pay challans via Bank Deposit, EasyPaisa, or JazzCash, and submit receipts.'
    }
  ];

  const handleDownload = (fileName: string) => {
    alert(`Starting download for: ${fileName}. (Note: This is a placeholder download action)`);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-primary pb-3 inline-block">
          Downloads Portal
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Retrieve official application sheets, booklets, and guidelines
        </p>
      </div>

      {/* Intro */}
      <div className="bg-white border border-gray-100 p-8 rounded-card shadow-sm">
        <p className="text-gray-500 text-sm leading-relaxed">
          [PLACEHOLDER TEXT] Welcome to the Downloads Center. Below are the official publications, registration forms, and instruction kits issued by the Pakistan Chamber of Education (Division Bahawalpur). All downloads are free and updated for the fiscal year 2026-27.
        </p>
      </div>

      {/* Table view */}
      <div className="bg-white border border-gray-100 rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFBFB] text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider">
                <th className="p-4 pl-6 font-poppins">Document Name</th>
                <th className="p-4 font-poppins">Category</th>
                <th className="p-4 font-poppins">Format</th>
                <th className="p-4 font-poppins">Size</th>
                <th className="p-4 pr-6 text-right font-poppins">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {files.map((file, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 pl-6 space-y-1 max-w-sm">
                    <p className="font-bold text-gray-800 text-sm font-poppins">{file.title}</p>
                    <p className="text-gray-400 text-[10px] leading-relaxed font-normal">{file.description}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-[#E5F0ED] text-primary px-2 py-0.5 rounded text-[10px] font-bold font-poppins">
                      {file.category}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-danger">{file.format}</td>
                  <td className="p-4 text-gray-500 font-semibold">{file.fileSize}</td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDownload(file.title)}
                      className="bg-primary hover:bg-[#004C38] text-white text-[11px] font-poppins font-medium px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition shadow-sm"
                    >
                      <span className="material-icons text-sm">download</span>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
