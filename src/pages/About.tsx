import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Info } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <div className="bg-[#B22222] text-white p-4 flex items-center shadow-md relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">About</h1>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
          <Info className="w-12 h-12 text-[#B22222]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">JPbank by Jtech</h2>
        <p className="text-gray-500">A secure network protocol for digital transactions and identity verification.</p>
        
        <div className="w-full max-w-md space-y-4 mt-8">
          <button onClick={() => window.location.href = 'mailto:jpingovernment@gmail.com'} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#B22222]" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">Email Us</p>
              <p className="text-xs text-gray-500">jpingovernment@gmail.com</p>
            </div>
          </button>

          <div className="pt-8 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-12 bg-slate-200" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Version Info</p>
              <div className="h-[1px] w-12 bg-slate-200" />
            </div>
            <p className="text-sm font-black text-slate-800 tracking-widest">VERSION 2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
