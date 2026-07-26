import React, { useState } from 'react';

interface GalleryAlbum {
  id: number;
  title: string;
  category: string;
  date: string;
  imageCount: number;
  description: string;
  colorClass: string; // Tailored gradient color for premium feel
}

export const Gallery: React.FC = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

  const albums: GalleryAlbum[] = [
    {
      id: 1,
      title: 'Teacher Training Workshop 2026',
      category: 'Workshops',
      date: 'July 20, 2026',
      imageCount: 15,
      description: '[PLACEHOLDER TEXT] Professional faculty training on modern science pedagogy and digital interactive instruction methods, held at Bahawalpur Central Secretariat.',
      colorClass: 'from-[#006A4E] to-[#008F6A]'
    },
    {
      id: 2,
      title: 'Chamber Board Consultative Session',
      category: 'Meetings',
      date: 'July 15, 2026',
      imageCount: 8,
      description: '[PLACEHOLDER TEXT] Consultative meeting between PCE executive body members and BISE Board controllers regarding licensing rules in District Bahawalnagar.',
      colorClass: 'from-[#AA8A30] to-[#C8A951]'
    },
    {
      id: 3,
      title: 'South Punjab Educational Summit',
      category: 'Seminars',
      date: 'June 28, 2026',
      imageCount: 22,
      description: '[PLACEHOLDER TEXT] Regional academic conference on ECE implementation, early childhood psychology, and institutional funding, held in Rahim Yar Khan.',
      colorClass: 'from-[#1A5276] to-[#2980B9]'
    },
    {
      id: 4,
      title: 'Digital Systems Training Session',
      category: 'Internal',
      date: 'June 14, 2026',
      imageCount: 6,
      description: '[PLACEHOLDER TEXT] Administrative training session for Chamber Finance Officers on running the new online dues generation and payment validation systems.',
      colorClass: 'from-[#7D3C98] to-[#9B59B6]'
    },
    {
      id: 5,
      title: 'Chamber Inauguration Ceremony',
      category: 'Events',
      date: 'March 05, 2026',
      imageCount: 18,
      description: '[PLACEHOLDER TEXT] Grand opening ceremony of the new Division Secretariat office in Bahawalpur, attended by senior government officers and school principals.',
      colorClass: 'from-[#A04000] to-[#D35400]'
    },
    {
      id: 6,
      title: 'Acreage Affiliation Inspections',
      category: 'Inspections',
      date: 'May 12, 2026',
      imageCount: 12,
      description: '[PLACEHOLDER TEXT] Educational inspection tours conducted by Membership Officers to certify secondary school affiliations in tehsil desks.',
      colorClass: 'from-[#117A65] to-[#16A085]'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333]">
          Photo Gallery
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Visual glimpses of events, training modules, and administrative summits
        </p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Grid of Albums */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {albums.map((album) => (
          <div 
            key={album.id}
            className="bg-white border border-gray-100 rounded-card shadow-card hover:shadow-cardHover overflow-hidden transition duration-200 flex flex-col justify-between"
          >
            {/* Visual Header representing photo cover */}
            <div className={`h-40 bg-gradient-to-br ${album.colorClass} flex flex-col justify-between p-5 text-white relative`}>
              <span className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold font-poppins tracking-wider uppercase self-start">
                {album.category}
              </span>
              <div className="flex justify-between items-center">
                <span className="text-[10px] opacity-75 font-semibold font-poppins">{album.date}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold font-poppins">
                  <span className="material-icons text-xs">photo_library</span>
                  {album.imageCount} Photos
                </span>
              </div>
            </div>

            {/* Content info */}
            <div className="p-6 space-y-3 flex-grow">
              <h3 className="font-bold text-sm font-poppins text-[#333333]">{album.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{album.description}</p>
            </div>

            <div className="px-6 py-4.5 border-t border-gray-50 bg-[#FAFBFB] text-left">
              <button 
                onClick={() => setSelectedAlbum(album)}
                className="text-primary hover:text-[#004C38] font-poppins font-bold text-xs inline-flex items-center gap-1"
              >
                Browse Photos
                <span className="material-icons text-xs">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Album Photos Lightbox Modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white rounded-card shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar relative">
            <button 
              onClick={() => setSelectedAlbum(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <span className="material-icons">close</span>
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase font-poppins tracking-wider">
                Album: {selectedAlbum.category}
              </span>
              <h2 className="text-xl font-bold font-poppins text-[#333333]">{selectedAlbum.title}</h2>
              <p className="text-xs text-gray-400">{selectedAlbum.date} &bull; {selectedAlbum.imageCount} Pictures</p>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed">
              {selectedAlbum.description}
            </p>

            {/* Photo Grid Placeholder */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {Array.from({ length: Math.min(6, selectedAlbum.imageCount) }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-28 bg-gradient-to-br ${selectedAlbum.colorClass} opacity-60 hover:opacity-80 rounded-lg flex items-center justify-center text-white text-[10px] font-bold select-none cursor-pointer transition`}
                  onClick={() => alert(`Photo ${i + 1} will be displayed here in full resolution.`)}
                >
                  <span className="flex flex-col items-center gap-1">
                    <span className="material-icons text-lg">image</span>
                    Photo {i + 1}
                  </span>
                </div>
              ))}
            </div>

            {selectedAlbum.imageCount > 6 && (
              <p className="text-center text-[10px] text-gray-400 font-medium pt-2">
                + {selectedAlbum.imageCount - 6} more pictures in this album
              </p>
            )}

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedAlbum(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-poppins font-semibold text-xs px-4.5 py-2.5 rounded-lg transition"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
