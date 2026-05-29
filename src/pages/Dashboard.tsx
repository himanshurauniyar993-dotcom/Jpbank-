import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scan, QrCode, History, LogOut, ShieldCheck, ArrowRightLeft, ArrowDownLeft, ArrowUpRight, ShieldAlert, User, Globe, Banknote, X } from 'lucide-react';
import VerifiedTick from '../components/VerifiedTick';
import { motion, AnimatePresence } from 'motion/react';

interface Transaction {
  _id: string;
  sender: string;
  receiver: string;
  senderUsername: string;
  senderProfilePic: string;
  senderTickType: string;
  senderNickname: string;
  senderEmail: string;
  senderPhone: string;
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

export default function Dashboard() {
  const { user, logout, refreshUser, token } = useAuth();
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/transaction/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const isOfficer = user?.role === 'officer';
          const filtered = data.filter((t: Transaction) => {
            const isOfficerAdjustment = t.sender === 'CENTRAL_OFFICER';
            if (isOfficerAdjustment && !isOfficer) return false;
            return true;
          });
          setRecentTransactions(filtered.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    }
  }, [token, user?.role]);

  const getTransactionDetails = (t: Transaction) => {
    const isSender = t.sender === user?.accountID;
    const isOfficerAdjustment = t.sender === 'CENTRAL_OFFICER';

    if (isOfficerAdjustment) {
      return {
        profilePic: '',
        tickType: '',
        icon: <ShieldAlert className="w-5 h-5 text-purple-600" />,
        title: 'Officer Adjustment',
        desc: t.type === 'reward' ? 'Credit Reward' : 'Debit Fine',
        amount: t.type === 'reward' ? `+¥${t.amount.toLocaleString()}` : `-¥${t.amount.toLocaleString()}`,
        color: t.type === 'reward' ? 'text-green-600' : 'text-red-600',
        bg: 'bg-purple-50',
        label: t.type === 'reward' ? 'Received From' : 'Paid From',
        nickname: 'Finance Officer',
        email: 'finance@jpbank.com',
        phone: 'CENTRAL'
      };
    }

    if (isSender) {
      return {
        profilePic: t.receiverProfilePic,
        tickType: t.receiverTickType,
        icon: null,
        title: 'Money Sent',
        desc: t.receiverUsername,
        amount: `-¥${t.amount.toLocaleString()}`,
        color: 'text-red-600',
        bg: 'bg-red-50',
        label: 'Paid To',
        nickname: t.receiverNickname,
        email: t.receiverEmail,
        phone: t.receiverPhone
      };
    }

    return {
      profilePic: t.senderProfilePic,
      tickType: t.senderTickType,
      icon: null,
      title: 'Money Received',
      desc: t.senderUsername,
      amount: `+¥${t.amount.toLocaleString()}`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Received From',
      nickname: t.senderNickname,
      email: t.senderEmail,
      phone: t.senderPhone
    };
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 overflow-x-hidden">
      {/* Header / Wallet Card */}
      <div className="bg-gradient-to-br from-[#B22222] to-[#8B0000] px-6 pt-8 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        {/* Background Temple Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&q=80&w=1920")',
            mixBlendMode: 'luminosity'
          }}
        />

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="w-10" /> {/* Spacer to balance the logout button */}
          <div className="flex flex-col items-center w-full mt-[10px]">
            <div className="px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm mb-4">
              <span className="text-[9px] font-bold tracking-[0.2em] text-white uppercase">Official Network</span>
            </div>
            <div 
              className="flex justify-center items-center" 
              style={{ 
                width: '100%', 
                overflow: 'visible',
              }}
            >
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
                alt="Japan Bank Logo"
                style={{ width: '280px', height: 'auto', display: 'block', margin: '10px auto' }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user.role === 'officer' && (
              <button 
                onClick={() => navigate('/officer')} 
                className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10 flex items-center space-x-2"
                title="Control Panel"
              >
                <ShieldCheck className="w-5 h-5 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider hidden sm:inline">Officer</span>
              </button>
            )}
            <button onClick={logout} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10" title="Logout">
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Identity Box */}
        <div 
          onClick={() => navigate('/profile')}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 mb-8 relative z-10 cursor-pointer hover:bg-white/15 transition-all group shadow-2xl"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center group-hover:border-[#FFD700]/50 transition-colors shadow-inner">
                {user.profilePic ? (
                  <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white/80" />
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold">Account Holder</p>
                <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-[9px] text-white/80 font-bold uppercase tracking-tighter">Verified</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-white font-bold text-xl tracking-tight">@{user.username}</h2>
                <VerifiedTick type={user.tickType} size={20} />
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-black/20 px-3 py-1 rounded-lg border border-white/5 flex items-center space-x-2">
                  <span className="text-[#FFD700]/60 text-[9px] font-bold uppercase tracking-widest">Nickname</span>
                  <span className="text-[#FFD700] font-mono font-bold text-sm tracking-widest">{user.nickname}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <div className="relative z-10 px-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70 text-xs font-bold uppercase tracking-[0.15em]">Available Reserves</p>
          </div>
          <div className="flex items-baseline space-x-2 overflow-hidden">
            <span className="text-[#FFD700] text-xl sm:text-2xl font-bold shrink-0">¥</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-2xl truncate">
              {user.balance.toLocaleString()}
            </h1>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6 relative z-20">
        <div className="bg-white rounded-[20px] border-2 border-[#FF0000] shadow-[0_4px_10px_rgba(255,0,0,0.2)] p-6 grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/send-yen')}
            className="flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-[#B22222] transition-colors duration-300">
              <Banknote className="w-6 h-6 text-[#B22222] group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Send Yen</span>
          </button>

          <button 
            onClick={() => navigate('/qr')}
            className="flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-[#B22222] transition-colors duration-300">
              <QrCode className="w-6 h-6 text-[#B22222] group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-xs font-semibold text-gray-700">My QR</span>
          </button>

          <button 
            onClick={() => navigate('/history')}
            className="flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-[#B22222] transition-colors duration-300">
              <History className="w-6 h-6 text-[#B22222] group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-xs font-semibold text-gray-700">History</span>
          </button>
        </div>
      </div>

      {/* Technical and Commercial */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Technical and Commercial</h2>
        <div className="bg-white rounded-2xl shadow-md p-6 grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/domain')}
            className="flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-[#B22222] transition-colors duration-300">
              <Globe className="w-6 h-6 text-[#B22222] group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-xs font-semibold text-gray-700">My Domain</span>
          </button>
        </div>
      </div>

      {/* Government Service */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Government Service</h2>
        <div className="bg-white rounded-2xl shadow-md p-6 grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/jp-police')}
            className="flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-[#B22222] transition-colors duration-300">
              <ShieldAlert className="w-6 h-6 text-[#B22222] group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">JP Police</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
          <button 
            onClick={() => navigate('/history')} 
            className="text-sm text-[#B22222] font-semibold hover:underline"
          >
            View All
          </button>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-[#B22222] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {recentTransactions.map((t) => {
              const details = getTransactionDetails(t);
              const date = new Date(t.date);
              return (
                <div key={t._id || t.date} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col space-y-4 overflow-hidden relative group">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 shrink-0">{details.label}</p>
                    <p className={`text-lg font-black ${details.color} text-right break-all leading-none min-w-0 pt-0.5`}>{details.amount}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${details.bg} border-4 border-white shadow-sm shadow-gray-200/50 shrink-0 overflow-hidden`}>
                      {details.profilePic ? (
                        <img src={details.profilePic} className="w-full h-full object-cover" alt="User" />
                      ) : details.icon ? (
                         details.icon
                      ) : (
                        <User className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="font-black text-gray-800 text-sm truncate tracking-tight">@{details.desc}</span>
                        {details.tickType && details.tickType !== 'none' && (
                          <VerifiedTick type={details.tickType} size={14} />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate(`/transaction/${t._id}`)}
                      className="shrink-0 bg-gray-50 hover:bg-gray-100 text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-lg border border-gray-100 transition-colors text-gray-400"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Access your full transaction ledger to view authorized transfers and adjustments.</p>
            <button 
              onClick={() => navigate('/history')}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full text-sm transition-colors"
            >
              Open Ledger
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
