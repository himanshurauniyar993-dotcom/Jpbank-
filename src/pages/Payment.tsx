import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, ShieldCheck, Banknote, ArrowRight, User, Lock, Delete, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VerifiedTick from '../components/VerifiedTick';

interface RecipientDetails {
  nickname: string;
  username: string;
  tickType: string;
  profilePic: string;
}

export default function Payment() {
  const { receiverID } = useParams();
  const navigate = useNavigate();
  const { token, refreshUser, user } = useAuth();
  const [step, setStep] = useState(1);
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [txnDate, setTxnDate] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!receiverID) return;
      try {
        const res = await fetch(`/api/user/lookup/${encodeURIComponent(receiverID)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setRecipientDetails(data);
        } else {
          setError(data.error || 'Recipient not found');
        }
      } catch (err) {
        setError('Failed to load recipient details');
      }
    };

    if (token && receiverID) {
      fetchRecipient();
    }
  }, [token, receiverID]);

  const handleKeyPress = (key: string) => {
    if (transactionPin.length < 4) {
      setTransactionPin(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setTransactionPin(prev => prev.slice(0, -1));
  };

  const handleAmountKeyPress = (key: string) => {
    if (amount.length < 15) {
      if (amount === '0') {
        setAmount(key);
      } else {
        setAmount(prev => prev + key);
      }
    }
  };

  const handleAmountDelete = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '');
  };

  const handleProceedToConfirm = () => {
    if (Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (Number(amount) > (user?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleTransferSubmit = async () => {
    if (transactionPin.length !== 4) return;
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/transaction/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverID,
          amount: Number(amount),
          transactionPin,
          remark: remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transaction failed');

      setTxnId(data.transactionId || Math.floor(Math.random() * 10000000000).toString());
      setTxnDate(new Date().toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }));
      
      // Play success sound
      const audio = new Audio('https://files.catbox.moe/zjzvr7.mp3');
      audio.play().catch(e => console.error('Audio play failed:', e));

      setSuccess(true);
      refreshUser();
    } catch (err: any) {
      setError(err.message);
      setTransactionPin(''); // Clear PIN on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionPin.length === 4 && step === 3) {
      handleTransferSubmit();
    }
  }, [transactionPin, step]);

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Success Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="w-10" /> {/* Spacer */}
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
            alt="Logo"
            className="h-10 w-auto"
          />
          <div className="w-10" /> {/* Spacer to keep logo centered */}
        </div>

        <div className="flex-1 flex flex-col items-center pt-12 px-6">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="mb-6 relative"
          >
            <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 blur-xl animate-pulse" />
            <div className="relative bg-green-500 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-gray-900 mb-8"
          >
            ¥ {Number(amount).toLocaleString()}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-1 mb-10"
          >
            <p className="text-gray-400 font-bold text-sm">Paid Successfully to</p>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">{recipientDetails?.nickname}</h3>
            <p className="text-gray-400 font-medium text-xs">@{recipientDetails?.username}</p>
          </motion.div>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gray-100 mb-8" />

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-4"
          >
            {remarks && (
              <div className="space-y-1">
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Remarks</p>
                <p className="text-gray-600 font-black text-xs">{remarks}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Transaction Time</p>
              <p className="text-gray-600 font-black text-xs">{txnDate}</p>
            </div>
          </motion.div>
        </div>

        <div className="p-6 h-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <div className="bg-[#B22222] text-white p-4 flex items-center shadow-md relative z-10">
        <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Secure Payment</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B22222]/5 to-transparent z-0 pointer-events-none" />
        
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-gray-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#B22222] to-[#FFD700]" />
          
          {/* Step Indicator */}
          <div className="flex justify-center space-x-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-[#B22222]' : 'w-4 bg-gray-200'}`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          {!recipientDetails && !error && (
            <div className="flex flex-col items-center py-12">
              <div className="w-12 h-12 border-4 border-[#B22222] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Verifying Recipient...</p>
            </div>
          )}

          {step === 1 && recipientDetails && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 z-[1000] bg-white flex flex-col"
            >
              {/* Custom Header for Amount Entry */}
              <div className="bg-[#B22222] text-white p-4 flex items-center shadow-md flex-shrink-0">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold tracking-tight">Enter Amount</h1>
              </div>

              {/* Header - Balance Area */}
              <div className="bg-white px-6 py-3 flex flex-col space-y-3 flex-shrink-0 border-b border-gray-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0">
                      <Banknote className="w-4 h-4 text-[#B22222]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">JP Balance</p>
                      <h4 className="text-sm font-black text-gray-900 tracking-tight truncate">¥ {user?.balance.toLocaleString()}</h4>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#B22222] opacity-10 flex-shrink-0" />
                </div>

                {/* Recipient Card */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-8 h-8 rounded-full border border-white overflow-hidden bg-white shadow-sm flex-shrink-0">
                      {recipientDetails.profilePic ? (
                        <img src={recipientDetails.profilePic} alt="Recipient" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-red-50">
                          <User className="w-4 h-4 text-[#B22222]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="font-black text-gray-800 text-xs truncate">{recipientDetails.nickname}</span>
                        <VerifiedTick type={recipientDetails.tickType} size={12} />
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 truncate">@{recipientDetails.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Amount Area */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#f8f9fa] overflow-hidden min-h-[140px]">
                <div className="text-center w-full max-w-xs space-y-3 flex flex-col items-center">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-[#B22222]/5 rounded-full border border-[#B22222]/10 flex-shrink-0">
                    <span className="text-[9px] font-black text-[#B22222] uppercase tracking-[0.2em]">Enter Amount</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2 border-b border-gray-200 pb-1 w-full max-w-[240px] overflow-hidden">
                    <span className="text-xl font-black text-[#B22222] flex-shrink-0">¥</span>
                    <div className="text-3xl xs:text-4xl font-black text-gray-900 tracking-tight min-h-[3rem] flex items-center overflow-x-auto whitespace-nowrap no-scrollbar px-1">
                      {amount || "0"}
                      <motion.div 
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-0.5 h-6 bg-[#B22222] ml-1 flex-shrink-0"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-[9px] font-black uppercase tracking-widest break-words max-w-full px-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Keypad */}
              <motion.div 
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="bg-[#f0f2f5] p-2 flex-shrink-0 pb-36 relative"
              >
                <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key) => {
                    const isNum = typeof key === 'number';
                    const isDel = key === 'del';
                    const isEmpty = key === '';

                    return (
                      <motion.button
                        key={key.toString()}
                        whileTap={isEmpty ? {} : { scale: 0.95 }}
                        disabled={isEmpty}
                        onClick={() => {
                          if (isNum) handleAmountKeyPress(key.toString());
                          if (isDel) handleAmountDelete();
                        }}
                        className={`${isEmpty ? 'opacity-0 cursor-default' : 'bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100'} py-3.5 flex items-center justify-center text-[#B22222] transition-all rounded-xl shadow-sm`}
                      >
                        {isNum ? (
                          <span className="text-lg font-bold">{key}</span>
                        ) : isDel ? (
                          <Delete className="w-5 h-5" />
                        ) : null}
                      </motion.button>
                    );
                  })}
                </div>
                
                <div className="mt-2 flex px-1">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceedToConfirm}
                    disabled={!amount || Number(amount) <= 0}
                    className={`w-full py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg ${
                      !amount || Number(amount) <= 0 
                        ? 'bg-gray-200 text-gray-400 shadow-none' 
                        : 'bg-[#B22222] text-white shadow-red-100'
                    }`}
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 2 && recipientDetails && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-[#B22222] rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-red-100 overflow-hidden">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest truncate">Available Balance</p>
                    <p className="text-base font-black tracking-tight break-all leading-tight">¥ {user?.balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-2 bg-white/10 rounded-full flex-shrink-0 ml-2">
                  <CheckCircle2 className="w-5 h-5 text-[#FFD700]" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
                <div className="p-2 bg-amber-100 rounded-full mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Security Notice</h4>
                  <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                    Please send money to only trusted contacts. Do not send money on request from social networking sites.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Send fund to</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm flex-shrink-0">
                        {recipientDetails.profilePic ? (
                          <img src={recipientDetails.profilePic} alt="Recipient" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-red-50">
                            <User className="w-6 h-6 text-[#B22222]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-gray-900 text-lg truncate">{recipientDetails.nickname}</span>
                          <div className="flex-shrink-0">
                            <VerifiedTick type={recipientDetails.tickType} size={18} />
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">@{recipientDetails.username}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0 pt-6 sm:pt-0">
                    <p className="text-xl font-black text-[#B22222] break-all leading-none">¥ {Number(amount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Purpose</p>
                    <p className="text-xs font-bold text-gray-800">Personal Transfer</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remarks <span className="text-red-500">*</span></p>
                    <input 
                      type="text"
                      required
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                      className="w-full text-xs font-bold text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B22222] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Service Charge</span>
                    <span>¥ 0.00</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total Paying Amount</span>
                    <span className="text-sm font-black text-[#B22222]">¥ {Number(amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!remarks.trim()}
                className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex justify-center items-center uppercase tracking-[0.2em] text-sm ${
                  !remarks.trim() 
                  ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed' 
                  : 'bg-gradient-to-br from-[#B22222] to-[#8B0000] hover:from-[#8B0000] hover:to-[#700000] text-white shadow-red-100'
                }`}
              >
                Confirm Transfer
              </button>
            </motion.div>
          )}

          {step === 3 && recipientDetails && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 z-[1000] bg-white flex flex-col"
            >
              {/* Custom Header for PIN Entry */}
              <div className="bg-[#B22222] text-white p-4 flex items-center shadow-md flex-shrink-0">
                <button onClick={() => setStep(2)} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold tracking-tight">Security PIN</h1>
              </div>

              {/* White Area - Improved Spacing */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0"
              >
                <div className="flex items-center space-x-2">
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
                    alt="Logo"
                    className="h-6 w-auto brightness-110"
                  />
                </div>
              </motion.div>

              {/* Central Area - PIN Display */}
              <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fa] p-4 overflow-hidden min-h-[140px]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-xs bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 flex flex-col items-center space-y-6"
                >
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Enter Transaction PIN</p>
                    <button 
                      onClick={() => setShowPin(!showPin)}
                      className="inline-flex items-center space-x-2 text-[#B22222] font-bold text-[9px] uppercase tracking-widest"
                    >
                      {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span className="text-[#D4AF37]">{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>

                  <div className="flex justify-center space-x-3">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div 
                        key={i}
                        animate={transactionPin.length > i ? { scale: [1, 1.2, 1] } : {}}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                          transactionPin.length > i 
                            ? (showPin ? 'bg-transparent' : 'bg-[#B22222]') 
                            : 'bg-gray-200'
                        } flex items-center justify-center overflow-hidden border ${transactionPin.length > i && showPin ? 'border-[#B22222]' : 'border-transparent'}`}
                      >
                        {showPin && transactionPin.length > i && (
                          <span className="text-xs font-black text-[#B22222]">{transactionPin[i]}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-[9px] font-bold uppercase tracking-widest text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Keypad area */}
              <motion.div 
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.4 }}
                className="bg-[#f0f2f5] p-2 pt-20 flex-shrink-0 pb-36"
              >
                <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9, 'del', 0, 'ok'] as const).map((key) => {
                    const isNum = typeof key === 'number';
                    const isDel = key === 'del';
                    const isOk = key === 'ok';

                    return (
                      <motion.button
                        key={key.toString()}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (isNum) handleKeyPress(key.toString());
                          if (isDel) handleDelete();
                          if (isOk) handleTransferSubmit();
                        }}
                        className={`py-3.5 flex items-center justify-center transition-colors rounded-xl shadow-sm ${
                          isOk 
                            ? (transactionPin.length === 4 && !loading ? 'bg-[#B22222] text-white shadow-lg shadow-red-100' : 'bg-white opacity-50 text-[#B22222]') 
                            : 'bg-white hover:bg-gray-50 active:bg-gray-100 text-[#B22222]'
                        }`}
                      >
                        {isNum ? (
                          <span className="text-xl font-bold">{key}</span>
                        ) : isDel ? (
                          <Delete className="w-6 h-6 text-[#B22222]" />
                        ) : (
                          <CheckCircle2 className="w-8 h-8" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

