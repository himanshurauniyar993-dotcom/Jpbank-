import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Building2, ShieldCheck, Lock, Landmark, Coins, CreditCard, Fingerprint, Wallet, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import VerifiedTick from '../components/VerifiedTick';

export default function ShowQR() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!user) return null;

  const handleSave = async () => {
    if (qrRef.current === null) return;
    
    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, backgroundColor: '#F8FAFC' });
      const link = document.createElement('a');
      link.download = `JPBANK_QR_${user.username}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save QR code:', err);
    }
  };

  const handleShare = async () => {
    if (qrRef.current === null) return;

    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, backgroundColor: '#F8FAFC' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `JPBANK_QR_${user.username}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My JP Bank QR Code',
          text: `Scan this QR to transfer funds to ${user.nickname} (@${user.username})`,
        });
      } else {
        // Fallback: Copy Username to clipboard
        await navigator.clipboard.writeText(`@${user.username}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to share QR code:', err);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col relative overflow-hidden selection:bg-red-100 selection:text-red-900">
      {/* Professional Bank/Gov Pattern Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0 bg-[radial-gradient(#B22222_1px,transparent_1px)] [background-size:40px_40px]"></div>
        <div className="absolute inset-0 flex flex-wrap justify-around items-center p-10 gap-20">
          <Building2 size={120} className="rotate-12" />
          <ShieldCheck size={100} className="-rotate-12" />
          <Landmark size={140} className="rotate-45" />
          <Lock size={80} className="-rotate-45" />
          <Coins size={110} className="rotate-12" />
          <CreditCard size={130} className="-rotate-12" />
          <Fingerprint size={90} className="rotate-90" />
          <Wallet size={120} className="-rotate-90" />
          <Building2 size={140} className="rotate-45" />
          <ShieldCheck size={110} className="-rotate-45" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#B22222] text-white p-6 flex items-center shadow-[0_4px_20px_rgba(178,34,34,0.15)] relative z-30">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90 mr-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Receive Funds</h1>
          <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">JP Government Portal</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* QR Card to be captured */}
          <div 
            ref={qrRef}
            className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden border border-slate-100 p-8 flex flex-col items-center relative"
          >
            {/* Top Accent */}
            <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-[#B22222] via-[#FFD700] to-[#B22222]" />
            
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
                  alt="Japan Bank Logo"
                  className="h-10 w-auto brightness-110 drop-shadow-sm"
                />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personal QR</h2>
              <p className="text-slate-400 text-xs font-bold mt-1">Scan to initiate secure transfer</p>
            </div>

            {/* QR Code Container */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#B22222]/5 to-transparent rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
                <QRCodeSVG 
                  value={user.username} 
                  size={200} 
                  level="H"
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB4PSI1IiB5PSI1IiB3aWR0aD0iOTAiIGhlaWdodD0iOTAiIHJ4PSIxMCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0IyMjIyMiIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHRleHQgeD0iNTAiIHk9IjQ1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjM1IiBmaWxsPSIjQjIyMjIyIj5KUDwvdGV4dD48dGV4dCB4PSI1MCIgeT0iODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc2l6ZT0iMjIiIGZpbGw9IiNCMjIyMjIiPmJhbms8L3RleHQ+PC9zdmc+",
                    height: 44,
                    width: 44,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <div className="mt-10 w-full space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Username</p>
                <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl">
                  <span className="text-xl font-mono font-black text-[#B22222] tracking-widest">@{user.username}</span>
                  <VerifiedTick type={user.tickType} size={20} />
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-lg font-black text-slate-800 tracking-tight">{user.nickname}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Account Holder</p>
              </div>
            </div>

            {/* Bottom Branding */}
            <div className="mt-10 pt-6 border-t border-slate-50 w-full flex justify-center items-center space-x-2 opacity-40">
              <Building2 size={14} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">JP Bank Infrastructure</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col space-y-4">
            <div className="flex space-x-4">
              <button 
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-3 px-6 py-4.5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] active:scale-95 border border-slate-100"
              >
                <Download className="w-5 h-5 text-[#B22222]" />
                <span>Save Image</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex-1 flex items-center justify-center space-x-3 px-6 py-4.5 bg-[#B22222] hover:bg-[#8B0000] text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_15px_30px_-5px_rgba(178,34,34,0.25)] active:scale-95 border border-white/10"
              >
                <Share2 className="w-5 h-5" />
                <span>Share QR</span>
              </button>
            </div>
            
            <AnimatePresence>
              {copied && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-green-500 text-white py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
                >
                  <CheckCircle2 size={16} />
                  <span>Username Copied!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="pb-10 text-center relative z-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Secure Peer-to-Peer Transfer System
        </p>
      </div>
    </div>
  );
}
