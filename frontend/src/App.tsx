import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { VisionMission } from './pages/public/VisionMission';
import { ChairmanMessage } from './pages/public/ChairmanMessage';
import { ExecutiveMembers } from './pages/public/ExecutiveMembers';
import { Benefits } from './pages/public/Benefits';
import { News } from './pages/public/News';
import { Gallery } from './pages/public/Gallery';
import { Downloads } from './pages/public/Downloads';
import { Contact } from './pages/public/Contact';
import { FAQ } from './pages/public/FAQ';
import { PrivacyPolicy, TermsConditions } from './pages/public/LegalPages';
import { BecomeMember } from './pages/public/BecomeMember';
import { ApplicantPortal } from './pages/public/ApplicantPortal';
import Dashboard from './pages/admin/Dashboard';
import Applications from './pages/admin/Applications';
import Challans from './pages/admin/Challans';
import Payments from './pages/admin/Payments';
import Members from './pages/admin/Members';
import Accounting from './pages/admin/Accounting';
import AuditLogs from './pages/admin/AuditLogs';
import Notifications from './pages/admin/Notifications';
import Settings from './pages/admin/Settings';
import {
  DocumentsPlaceholder,
  DuesPlaceholder,
} from './pages/Placeholders';

// Protected Route wrapper with RBAC role checks
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium font-poppins">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <span className="material-icons text-5xl text-danger mb-4">gpp_bad</span>
        <h2 className="text-2xl font-bold font-poppins text-[#333333] mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md mb-4 text-xs">
          Your account role ({user.role}) does not have permission to view this section.
        </p>
        <Link to="/admin/dashboard" className="text-primary hover:underline font-semibold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

// Helper for Return Link inside error views
import { Link } from 'react-router-dom';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="vision-mission" element={<VisionMission />} />
        <Route path="chairman-message" element={<ChairmanMessage />} />
        <Route path="executive-members" element={<ExecutiveMembers />} />
        <Route path="benefits" element={<Benefits />} />
        <Route path="news" element={<News />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<TermsConditions />} />
        <Route path="apply" element={<BecomeMember />} />
        <Route path="portal" element={<ApplicantPortal />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Administrative Routes (Protected & RBAC Enforced) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route 
          path="dashboard" 
          element={<Dashboard />} 
        />
        
        <Route 
          path="applications" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Membership Officer', 'Viewer']}>
              <Applications />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="members" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Finance Officer', 'Membership Officer', 'Viewer']}>
              <Members />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="documents" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Membership Officer', 'Viewer']}>
              <DocumentsPlaceholder />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="dues" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Finance Officer', 'Viewer']}>
              <DuesPlaceholder />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="challans" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Finance Officer', 'Viewer']}>
              <Challans />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="payments" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Finance Officer', 'Viewer']}>
              <Payments />
            </ProtectedRoute>
          } 
        />

        
        <Route 
          path="accounting" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Finance Officer', 'Viewer']}>
              <Accounting />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="notifications" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Viewer']}>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Viewer']}>
              <AuditLogs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="settings" 
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Viewer']}>
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
