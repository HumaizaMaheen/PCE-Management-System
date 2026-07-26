import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Full specification menu list
  const menuItems = [
    { name: 'Dashboard Overview', icon: 'dashboard', path: '/admin/dashboard', roles: ['Super Admin', 'Finance Officer', 'Membership Officer', 'Viewer'] },
    { name: 'Membership Applications', icon: 'assignment', path: '/admin/applications', roles: ['Super Admin', 'Membership Officer', 'Viewer'] },
    { name: 'Members Directory', icon: 'people', path: '/admin/members', roles: ['Super Admin', 'Finance Officer', 'Membership Officer', 'Viewer'] },
    { name: 'Document Vault', icon: 'folder', path: '/admin/documents', roles: ['Super Admin', 'Membership Officer', 'Viewer'] },
    { name: 'Dues & Contributions', icon: 'account_balance_wallet', path: '/admin/dues', roles: ['Super Admin', 'Finance Officer', 'Viewer'] },
    { name: 'Challan Management', icon: 'receipt', path: '/admin/challans', roles: ['Super Admin', 'Finance Officer', 'Viewer'] },
    { name: 'Payments & Receipts', icon: 'payments', path: '/admin/payments', roles: ['Super Admin', 'Finance Officer', 'Viewer'] },
    { name: 'General Ledger Accounting', icon: 'analytics', path: '/admin/accounting', roles: ['Super Admin', 'Finance Officer', 'Viewer'] },
    { name: 'Notification Logs', icon: 'notifications_active', path: '/admin/notifications', roles: ['Super Admin', 'Viewer'] },
    { name: 'System Audit Logs', icon: 'history', path: '/admin/audit-logs', roles: ['Super Admin', 'Viewer'] },
    { name: 'System Settings', icon: 'settings', path: '/admin/settings', roles: ['Super Admin', 'Viewer'] },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Filter menu items by user's role to test RBAC in Sidebar
  const filteredMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-background font-inter">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-100 flex flex-col justify-between transform lg:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          {/* Logo Brand area */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100 bg-[#FAFBFB]">
            <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-bold font-poppins text-base">
              PCE
            </div>
            <div>
              <h1 className="text-xs font-bold font-poppins text-primary leading-tight">Pakistan Chamber</h1>
              <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Bahawalpur Division</p>
            </div>
            {/* Mobile close sidebar */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400 hover:text-gray-600">
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-poppins font-medium transition-all duration-150 ${active ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-[#F4F6F5] hover:text-gray-900'}`}
                >
                  <span className={`material-icons text-lg ${active ? 'text-white' : 'text-gray-400'}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-gray-100 bg-[#FAFBFB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {user?.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-700 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-accent font-semibold truncate font-poppins">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-100 px-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="material-icons">menu</span>
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center relative w-72">
              <span className="absolute left-3.5 material-icons text-gray-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="w-full bg-[#F4F6F5] pl-10 pr-4 py-1.5 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 border border-transparent focus:border-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            
            {/* Notification Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center relative text-gray-500 hover:text-gray-700 transition"
              >
                <span className="material-icons text-lg">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-white"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-card shadow-card py-2 text-xs">
                  <div className="px-4 py-2 border-b border-gray-100 font-bold font-poppins text-gray-700 flex justify-between items-center">
                    <span>Notifications</span>
                    <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer">
                      <p className="font-semibold text-gray-700">New Payment Receipt Submitted</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">Applicant CNIC: 31202-1234567-1. Waiting for review.</p>
                      <span className="text-[9px] text-gray-400 block mt-1">2 mins ago</span>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                      <p className="font-semibold text-gray-700">Welcome to PCE System</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">Your profile login credentials have been set up.</p>
                      <span className="text-[9px] text-gray-400 block mt-1">1 hour ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {user?.full_name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-gray-700 leading-none">{user?.full_name}</p>
                  <p className="text-[9px] text-gray-400 mt-1 font-medium font-poppins leading-none">{user?.role}</p>
                </div>
                <span className="material-icons text-gray-400 text-sm">expand_more</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-card shadow-card py-1.5 text-xs text-gray-700">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-bold truncate">{user?.full_name}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => alert("Profile edits coming in future phase")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="material-icons text-sm text-gray-400">person</span>
                    My Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-danger flex items-center gap-2 border-t border-gray-50"
                  >
                    <span className="material-icons text-sm">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 flex-grow overflow-x-hidden custom-scrollbar">
          <div className="bg-white border border-gray-100 rounded-card shadow-card p-6 min-h-[70vh]">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};
