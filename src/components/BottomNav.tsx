import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, QrCode, HelpCircle, Menu } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/scan') {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 h-16 flex justify-around items-center px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)] transition-colors duration-200">
      <button onClick={() => navigate('/')} className={`flex flex-col items-center justify-center w-16 h-full ${isActive('/') ? 'text-[#B22222] dark:text-red-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
        <Home className="w-6 h-6" />
      </button>

      <button onClick={() => navigate('/history')} className={`flex flex-col items-center justify-center w-16 h-full ${isActive('/history') ? 'text-[#B22222] dark:text-red-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
        <FileText className="w-6 h-6" />
      </button>

      {/* Center Floating Button */}
      <div className="relative w-16 h-full flex justify-center">
        <div className="absolute -top-7 w-[72px] h-[72px] bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center shadow-[inset_0_4px_6px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)] transition-colors duration-200">
          <button 
            onClick={() => navigate('/scan')}
            className="w-14 h-14 bg-gradient-to-br from-[#B22222] to-[#8B0000] rounded-full flex items-center justify-center shadow-lg text-white hover:scale-105 transition-transform"
          >
            <QrCode className="w-7 h-7" />
          </button>
        </div>
      </div>

      <button onClick={() => navigate('/about')} className={`flex flex-col items-center justify-center w-16 h-full ${isActive('/about') ? 'text-[#B22222] dark:text-red-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
        <HelpCircle className="w-6 h-6" />
      </button>

      <button onClick={() => navigate('/profile')} className={`flex flex-col items-center justify-center w-16 h-full ${isActive('/profile') ? 'text-[#B22222] dark:text-red-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
        <Menu className="w-6 h-6" />
      </button>
    </div>
  );
}
