import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ShieldAlert, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import VerifiedTick from '../components/VerifiedTick';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface Transaction {
  _id: string;
  sender: string;
  senderUsername: string;
  senderProfilePic: string;
  senderTickType: string;
  senderNickname: string;
  senderEmail: string;
  senderPhone: string;
  receiver: string;
  receiverUsername: string;
  receiverProfilePic: string;
  receiverTickType: string;
  receiverNickname: string;
  receiverEmail: string;
  receiverPhone: string;
  amount: number;
  type: string;
  date: string;
  remark: string;
}

export default function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullEmail, setShowFullEmail] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid transaction ID. Please check the history again.');
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      try {
        if (!token) {
          setError('Session missing. Please login again.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/transaction/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const contentType = res.headers.get("content-type");
        const isJson = contentType && contentType.indexOf("application/json") !== -1;

        if (isJson) {
          const data = await res.json();
          if (res.ok) {
            setTransaction(data);
          } else {
            if (res.status === 401 || res.status === 403) {
              setError(`Security: ${data.error || 'Your session has expired. Please logout and login again.'}`);
            } else {
              setError(data.error || `Error ${res.status}: Failed to fetch details.`);
            }
          }
        } else {
          const text = await res.text();
          console.error('Invalid response format:', text.substring(0, 200));
          if (res.status === 403) {
            setError(`Security Access Blocked (403). Possible session conflict. Please try logging out and logging in again.`);
          } else {
            setError(`Server Error (${res.status}): Invalid response format.`);
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Connection error or server timeout.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#B22222] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Error Occurred</h1>
        <p className="text-gray-500 font-bold mb-6">{error || 'Transaction not found'}</p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentUserAccountID = currentUser?.accountID || '';
  const isSender = transaction.sender === currentUserAccountID;
  const isOfficerAdjustment = transaction.sender === 'CENTRAL_OFFICER';

  const getDetails = () => {
    if (isOfficerAdjustment) {
      return {
        profilePic: '',
        tickType: '',
        icon: <ShieldAlert className="w-10 h-10 text-purple-600" />,
        title: 'Officer Adjustment',
        desc: transaction.type === 'reward' ? 'Credit Reward' : 'Debit Fine',
        amount: transaction.type === 'reward' ? `+¥${transaction.amount.toLocaleString()}` : `-¥${transaction.amount.toLocaleString()}`,
        color: transaction.type === 'reward' ? 'text-green-600' : 'text-red-600',
        bg: 'bg-purple-50',
        label: transaction.type === 'reward' ? 'Received From' : 'Paid From',
        nickname: 'Finance Officer',
        email: 'finance@jpbank.com',
        phone: 'CENTRAL'
      };
    }

    if (isSender) {
      return {
        profilePic: transaction.receiverProfilePic,
        tickType: transaction.receiverTickType,
        icon: <ArrowUpRight className="w-10 h-10 text-red-600" />,
        title: 'Money Sent',
        desc: transaction.receiverUsername,
        amount: `-¥${transaction.amount.toLocaleString()}`,
        color: 'text-red-600',
        bg: 'bg-red-50',
        label: 'Paid To',
        nickname: transaction.receiverNickname,
        email: transaction.receiverEmail,
        phone: transaction.receiverPhone
      };
    }

    return {
      profilePic: transaction.senderProfilePic,
      tickType: transaction.senderTickType,
      icon: <ArrowDownLeft className="w-10 h-10 text-green-600" />,
      title: 'Money Received',
      desc: transaction.senderUsername,
      amount: `+¥${transaction.amount.toLocaleString()}`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Received From',
      nickname: transaction.senderNickname,
      email: transaction.senderEmail,
      phone: transaction.senderPhone
    };
  };

  const details = getDetails();
  const date = new Date(transaction.date);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Header */}
      <div className="bg-[#B22222] pt-14 pb-8 px-6 sticky top-0 z-20 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white/15 hover:bg-white/20 transition-colors rounded-full text-white backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-black text-white/90 uppercase tracking-[0.3em]">Record Details</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 -mt-6 relative z-30 max-w-md mx-auto"
      >
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          {/* Status Header */}
          <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Protocol</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Verified</span>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {/* Main Amount Section - Fixed Overlapping */}
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Digital Asset Value</p>
              <div className="overflow-hidden">
                <h2 className={`text-4xl sm:text-5xl font-black ${details.color} tracking-tighter break-words leading-tight px-2`}>
                  {details.amount}
                </h2>
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className={`relative w-28 h-28 rounded-[2rem] flex items-center justify-center ${details.bg} border-8 border-slate-50 shadow-inner group overflow-hidden`}>
                {details.profilePic ? (
                  <img src={details.profilePic} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="User" />
                ) : details.icon ? (
                  <div className="scale-125">{details.icon}</div>
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-black text-slate-800 tracking-tight">@{details.desc}</p>
                  {details.tickType && details.tickType !== 'none' && (
                    <VerifiedTick type={details.tickType} size={22} />
                  )}
                </div>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{details.nickname || 'Certified Party'}</p>
              </div>
            </div>

            {/* Verification Metadata */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Email</span>
                <div className="flex flex-col items-end gap-1 text-right overflow-hidden">
                  <span className={`text-xs font-bold text-slate-600 ${!showFullEmail ? 'truncate max-w-[140px]' : 'break-all'}`}>
                    {details.email || 'N/A'}
                  </span>
                  {details.email && details.email.length > 20 && (
                    <button 
                      onClick={() => setShowFullEmail(!showFullEmail)}
                      className="text-[8px] font-black text-[#B22222] uppercase tracking-widest hover:underline"
                    >
                      {showFullEmail ? 'Show Less' : 'Show Full'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Phone Number</span>
                <span className="text-xs font-bold text-slate-600">{details.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Date</span>
                <span className="text-xs font-bold text-slate-600">{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Time</span>
                <span className="text-xs font-bold text-slate-600">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              </div>
            </div>

            {/* Remark Section */}
            {isSender && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-[2px] grow bg-slate-100" />
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Transaction Remark</p>
                  <div className="h-[2px] grow bg-slate-100" />
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-100/80">
                  <p className="text-sm font-bold text-slate-500 italic text-center leading-relaxed">
                    "{transaction.remark || 'No remark record found for this transaction sequence.'}"
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Branding */}
          <div className="bg-slate-900 p-6 flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 opacity-50">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Centralized Ledger Verification system</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
