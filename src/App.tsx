/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { ShieldAlert } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanQR from './pages/ScanQR';
import ShowQR from './pages/ShowQR';
import Payment from './pages/Payment';
import OfficerDashboard from './pages/OfficerDashboard';
import History from './pages/History';
import SendYen from './pages/SendYen';
import Profile from './pages/Profile';
import About from './pages/About';
import Domain from './pages/Domain';
import JpPolice from './pages/JpPolice';
import Nuke from './pages/Nuke';
import TransactionDetails from './pages/TransactionDetails';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import MaintenanceGuard from './components/MaintenanceGuard';

const ProtectedRoute = ({ children, requireOfficer = false }: { children: React.ReactNode, requireOfficer?: boolean }) => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  
  if (requireOfficer && user?.role !== 'officer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-[#B22222]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Security Alert</h2>
          <p className="text-gray-600 font-medium">Unauthorized Access: Central Officer Credentials Required</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="mt-6 px-6 py-2 bg-[#B22222] text-white rounded-lg font-medium hover:bg-[#8B0000] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MaintenanceProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
              <Routes>
              <Route path="/login" element={<MaintenanceGuard pageId="login"><Login /></MaintenanceGuard>} />
              <Route path="/" element={<ProtectedRoute><MaintenanceGuard pageId="dashboard"><Dashboard /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/scan" element={<ProtectedRoute><MaintenanceGuard pageId="scan"><ScanQR /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/qr" element={<ProtectedRoute><MaintenanceGuard pageId="qr"><ShowQR /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/send-yen" element={<ProtectedRoute><MaintenanceGuard pageId="send-yen"><SendYen /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/pay/:receiverID" element={<ProtectedRoute><MaintenanceGuard pageId="pay"><Payment /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><MaintenanceGuard pageId="history"><History /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/domain" element={<ProtectedRoute><MaintenanceGuard pageId="domain"><Domain /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/jp-police" element={<ProtectedRoute><MaintenanceGuard pageId="jp-police"><JpPolice /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><MaintenanceGuard pageId="profile"><Profile /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><MaintenanceGuard pageId="support"><About /></MaintenanceGuard></ProtectedRoute>} />
              <Route path="/officer" element={<ProtectedRoute requireOfficer><OfficerDashboard /></ProtectedRoute>} />
              <Route path="/nuke" element={<ProtectedRoute requireOfficer><Nuke /></ProtectedRoute>} />
              <Route path="/transaction/:id" element={<ProtectedRoute><MaintenanceGuard pageId="history"><TransactionDetails /></MaintenanceGuard></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </MaintenanceProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
