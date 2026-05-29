import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, AlertTriangle, Lock, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Nuke() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const confirmationSteps = [
    "Are you sure you want to clear all transaction history?",
    "This action is IRREVERSIBLE. Do you want to proceed?",
    "All records of transfers, rewards, and fines will be DELETED. Continue?",
    "Think about the consequences. This will affect ledger visibility for everyone.",
    "Data once deleted cannot be recovered. Really proceed?",
    "This is step 6 of 10. You can still go back.",
    "Final warnings ahead. Are you absolutely certain?",
    "System data integrity will be modified. Confirm?",
    "Almost there. Last check before password verification.",
    "This is the FINAL step before the point of no return."
  ];

  const handleNuke = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/officer/nuke-transactions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          navigate('/officer');
        }, 3000);
      } else {
        setError(data.error || 'Failed to nuke transactions');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'officer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Unauthorized</h1>
          <p className="text-gray-500">Only officers can access the nuke room.</p>
          <button onClick={() => navigate('/')} className="text-[#B22222] font-black uppercase tracking-widest text-[11px] mt-4">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col p-6">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[11px] font-black tracking-[0.3em] text-red-600 uppercase">OFFICIAL JP GOVERNMENT NUKE ROOM</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center space-y-8">
        {success ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
              <ShieldAlert className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-green-500">PURGED</h2>
              <p className="text-slate-400 font-medium">{success}</p>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest pt-4">Redirecting to headquarters...</p>
          </div>
        ) : (
          <>
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center relative mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse relative z-10" />
              <div className="absolute inset-0 border-4 border-red-500/50 rounded-full animate-ping opacity-20" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">EMERGENCY PROTOCOL</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-1 bg-red-600 rounded-full animate-pulse" />
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">CRITICAL SYSTEM CLEARANCE</p>
                <div className="h-1 w-1 bg-red-600 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 w-full backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              
              <div className="mb-8">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Step {step + 1} of 10</p>
                <p className="text-xl font-bold leading-tight">
                  {confirmationSteps[step]}
                </p>
              </div>

              {step < 9 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/40 active:scale-[0.98]"
                >
                  CONFIRM & DEEPEN
                </button>
              ) : (
                <form onSubmit={handleNuke} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">MASTER AUTHENTICATION KEY</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ENTER PASSWORD"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all font-mono tracking-widest text-center"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-wider">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/40 flex items-center justify-center space-x-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>WIPE RECORDS</span>
                      </>
                    )}
                  </button>
                </form>
              )}
              
              {!loading && (
                <button
                  onClick={() => step === 0 ? navigate(-1) : setStep(0)}
                  className="mt-6 text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                >
                  ABORT PROTOCOL
                </button>
              )}
            </div>
            
            <p className="text-[8px] text-slate-700 leading-relaxed max-w-[200px] uppercase tracking-widest">
              CAUTION: Execution will wipe all historical evidence of financial movement from the central ledger.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
