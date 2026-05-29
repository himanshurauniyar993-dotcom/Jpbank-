import React from 'react';
import { motion } from 'motion/react';
import { Construction, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';

interface MaintenanceGuardProps {
  pageId: string;
  children: React.ReactNode;
}

export default function MaintenanceGuard({ pageId, children }: MaintenanceGuardProps) {
  const { maintenanceData, isReady } = useMaintenance();

  const status = maintenanceData.find(m => m.page === pageId);
  const isEnabled = status?.isEnabled || false;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B22222] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEnabled) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center max-w-sm text-center"
        >
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
            alt="Japan Bank Logo"
            className="w-56 h-auto mb-10 drop-shadow-xl brightness-110"
          />

          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-orange-100/50">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-ping" />
            <Construction className="w-12 h-12 text-orange-600 relative z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight uppercase">
              Page Under<br />Construction
            </h1>
            
            <div className="h-1 w-16 bg-orange-500 mx-auto rounded-full" />
            
            <p className="text-gray-500 text-sm font-medium leading-relaxed px-4">
              Our engineering team is currently upgrading this module to provide you with a superior banking experience.
            </p>
          </div>

          <div className="mt-10 w-full space-y-3">
            <button 
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-gray-200 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer relative z-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Home</span>
            </button>
            
            <div className="flex items-center justify-center space-x-2 py-3">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">JP Bank Systems Online</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
