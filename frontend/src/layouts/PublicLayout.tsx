import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FA] text-[#333333] font-inter">
      {/* Top Banner (Optional but adds a premium look) */}
      <div className="bg-[#004C38] text-white text-[11px] py-2 px-6 flex justify-between items-center font-medium font-poppins">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="material-icons text-xs text-accent">email</span>
            info@pce.org.pk
          </span>
          <span className="flex items-center gap-1 hidden sm:inline-flex">
            <span className="material-icons text-xs text-accent">call</span>
            +92 62 1234567
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#DCC37E] font-bold">Division: Bahawalpur</span>
          <span className="text-white/40">|</span>
          <Link to="/portal" className="hover:text-accent transition duration-150">Track Application</Link>
          <span className="text-white/40">|</span>
          <Link to="/login" className="hover:text-accent transition duration-150">Portal Login</Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-100 py-3.5 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo brand */}
          <Link to="/" onClick={closeAllMenus} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold font-poppins text-lg shadow-sm">
              PCE
            </div>
            <div>
              <h1 className="text-base font-bold font-poppins leading-tight text-primary">Pakistan Chamber of Education</h1>
              <p className="text-[10px] text-accent font-semibold tracking-wider uppercase font-poppins">Division Bahawalpur</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-poppins font-medium">
            <Link 
              to="/" 
              onClick={closeAllMenus}
              className={`px-3 py-2 rounded-lg transition ${isActive('/') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}
            >
              Home
            </Link>

            {/* About Dropdown */}
            <div className="relative group">
              <button 
                className="px-3 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 flex items-center gap-0.5"
                onClick={() => toggleDropdown('about')}
              >
                About Us
                <span className="material-icons text-base transition-transform duration-200 group-hover:rotate-180">expand_more</span>
              </button>
              
              <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-100 rounded-card shadow-card py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/about" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">About the Chamber</Link>
                <Link to="/vision-mission" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">Vision & Mission</Link>
                <Link to="/chairman-message" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">Chairman's Message</Link>
                <Link to="/executive-members" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">Executive Board</Link>
              </div>
            </div>

            <Link 
              to="/benefits" 
              onClick={closeAllMenus}
              className={`px-3 py-2 rounded-lg transition ${isActive('/benefits') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}
            >
              Benefits
            </Link>

            {/* Media Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 flex items-center gap-0.5">
                Media Center
                <span className="material-icons text-base transition-transform duration-200 group-hover:rotate-180">expand_more</span>
              </button>
              <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-100 rounded-card shadow-card py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/news" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">News & Announcements</Link>
                <Link to="/gallery" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">Photo Gallery</Link>
              </div>
            </div>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 flex items-center gap-0.5">
                Resources
                <span className="material-icons text-base transition-transform duration-200 group-hover:rotate-180">expand_more</span>
              </button>
              <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-100 rounded-card shadow-card py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/downloads" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">Document Downloads</Link>
                <Link to="/faq" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary font-medium">FAQs</Link>
              </div>
            </div>

            <Link 
              to="/contact" 
              onClick={closeAllMenus}
              className={`px-3 py-2 rounded-lg transition ${isActive('/contact') ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-primary hover:text-[#004C38] border border-primary/20 hover:border-primary/40 font-poppins font-medium text-xs px-4 py-2 rounded-lg transition"
            >
              Portal Login
            </Link>
            <Link 
              to="/apply" 
              className="bg-accent hover:bg-accent-dark text-white font-poppins font-medium text-xs px-4.5 py-2.5 rounded-lg shadow-sm transition inline-block text-center"
            >
              Become a Member
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-600 hover:text-primary focus:outline-none"
          >
            <span className="material-icons text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 top-[96px] bg-white border-t border-gray-100 flex flex-col p-6 animate-fadeIn">
          <div className="flex-1 space-y-4 overflow-y-auto">
            <Link 
              to="/" 
              onClick={closeAllMenus}
              className={`block py-2 border-b border-gray-50 text-sm font-semibold font-poppins ${isActive('/') ? 'text-primary' : 'text-gray-700'}`}
            >
              Home
            </Link>

            {/* Mobile About Dropdown */}
            <div>
              <button 
                onClick={() => toggleDropdown('about-mob')}
                className="w-full flex justify-between items-center py-2 border-b border-gray-50 text-sm font-semibold font-poppins text-gray-700"
              >
                <span>About Us</span>
                <span className="material-icons">{activeDropdown === 'about-mob' ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeDropdown === 'about-mob' && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-primary/20 bg-gray-50 py-2 rounded-r-lg">
                  <Link to="/about" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">About the Chamber</Link>
                  <Link to="/vision-mission" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">Vision & Mission</Link>
                  <Link to="/chairman-message" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">Chairman's Message</Link>
                  <Link to="/executive-members" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">Executive Board</Link>
                </div>
              )}
            </div>

            <Link 
              to="/benefits" 
              onClick={closeAllMenus}
              className={`block py-2 border-b border-gray-50 text-sm font-semibold font-poppins ${isActive('/benefits') ? 'text-primary' : 'text-gray-700'}`}
            >
              Benefits
            </Link>

            {/* Mobile Media Dropdown */}
            <div>
              <button 
                onClick={() => toggleDropdown('media-mob')}
                className="w-full flex justify-between items-center py-2 border-b border-gray-50 text-sm font-semibold font-poppins text-gray-700"
              >
                <span>Media Center</span>
                <span className="material-icons">{activeDropdown === 'media-mob' ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeDropdown === 'media-mob' && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-primary/20 bg-gray-50 py-2 rounded-r-lg">
                  <Link to="/news" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">News & Announcements</Link>
                  <Link to="/gallery" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">Photo Gallery</Link>
                </div>
              )}
            </div>

            {/* Mobile Resources Dropdown */}
            <div>
              <button 
                onClick={() => toggleDropdown('res-mob')}
                className="w-full flex justify-between items-center py-2 border-b border-gray-50 text-sm font-semibold font-poppins text-gray-700"
              >
                <span>Resources</span>
                <span className="material-icons">{activeDropdown === 'res-mob' ? 'expand_less' : 'expand_more'}</span>
              </button>
              {activeDropdown === 'res-mob' && (
                <div className="pl-4 mt-2 space-y-2 border-l-2 border-primary/20 bg-gray-50 py-2 rounded-r-lg">
                  <Link to="/downloads" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">Document Downloads</Link>
                  <Link to="/faq" onClick={closeAllMenus} className="block py-1.5 text-xs text-gray-600 font-medium">FAQs</Link>
                </div>
              )}
            </div>

            <Link 
              to="/contact" 
              onClick={closeAllMenus}
              className={`block py-2 border-b border-gray-50 text-sm font-semibold font-poppins ${isActive('/contact') ? 'text-primary' : 'text-gray-700'}`}
            >
              Contact Us
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-gray-100">
            <Link 
              to="/portal" 
              onClick={closeAllMenus}
              className="text-center text-gray-600 border border-gray-200 font-poppins font-medium text-sm py-2.5 rounded-lg transition hover:bg-gray-50"
            >
              Track Application
            </Link>
            <Link 
              to="/login" 
              onClick={closeAllMenus}
              className="text-center text-primary border border-primary/20 font-poppins font-medium text-sm py-2.5 rounded-lg transition hover:bg-primary/5"
            >
              Portal Login
            </Link>
            <Link 
              to="/apply" 
              onClick={closeAllMenus}
              className="bg-primary hover:bg-primary-light text-white font-poppins font-medium text-sm py-2.5 rounded-lg shadow-sm transition block text-center"
            >
              Become a Member
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-6 font-inter text-gray-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About PCE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold font-poppins text-base">
                PCE
              </div>
              <h2 className="text-sm font-bold font-poppins text-primary">Pakistan Chamber of Education</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              We represent, support, and safeguard private and public academic institutions in the Bahawalpur Division. Elevating standards, training educators, and advocating policies for modern education.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-[#E5F0ED] text-primary flex items-center justify-center hover:bg-primary hover:text-white transition duration-200">
                <span className="material-icons text-base">facebook</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#E5F0ED] text-primary flex items-center justify-center hover:bg-primary hover:text-white transition duration-200">
                <span className="material-icons text-base">language</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#E5F0ED] text-primary flex items-center justify-center hover:bg-primary hover:text-white transition duration-200">
                <span className="material-icons text-base">mail</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Quicklinks */}
          <div>
            <h3 className="text-xs font-bold text-[#333333] uppercase tracking-wider font-poppins mb-4">Quick Links</h3>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/about" className="hover:text-primary hover:underline transition duration-150">About the Chamber</Link></li>
              <li><Link to="/vision-mission" className="hover:text-primary hover:underline transition duration-150">Vision & Mission</Link></li>
              <li><Link to="/chairman-message" className="hover:text-primary hover:underline transition duration-150">Chairman's Message</Link></li>
              <li><Link to="/executive-members" className="hover:text-primary hover:underline transition duration-150">Executive Board</Link></li>
              <li><Link to="/benefits" className="hover:text-primary hover:underline transition duration-150">Membership Benefits</Link></li>
            </ul>
          </div>

          {/* Col 3: Media & Resources */}
          <div>
            <h3 className="text-xs font-bold text-[#333333] uppercase tracking-wider font-poppins mb-4">Resources</h3>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/news" className="hover:text-primary hover:underline transition duration-150">News & Announcements</Link></li>
              <li><Link to="/gallery" className="hover:text-primary hover:underline transition duration-150">Photo Gallery</Link></li>
              <li><Link to="/downloads" className="hover:text-primary hover:underline transition duration-150">Downloads & Forms</Link></li>
              <li><Link to="/faq" className="hover:text-primary hover:underline transition duration-150">Frequently Asked Questions</Link></li>
              <li><Link to="/privacy" className="hover:text-primary hover:underline transition duration-150">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary hover:underline transition duration-150">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact info */}
          <div className="space-y-3 text-xs">
            <h3 className="text-xs font-bold text-[#333333] uppercase tracking-wider font-poppins mb-4">Contact PCE</h3>
            <p className="flex items-start gap-2 text-gray-500 leading-relaxed">
              <span className="material-icons text-primary text-sm mt-0.5">location_on</span>
              <span>PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan</span>
            </p>
            <p className="flex items-center gap-2 text-gray-500">
              <span className="material-icons text-primary text-sm">call</span>
              <span>+92 62 1234567</span>
            </p>
            <p className="flex items-center gap-2 text-gray-500">
              <span className="material-icons text-primary text-sm">email</span>
              <span>info@pce.org.pk</span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-400 font-medium font-poppins">
          <span>&copy; {new Date().getFullYear()} Pakistan Chamber of Education (PCE). All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/terms" className="hover:text-primary">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
