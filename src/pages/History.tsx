import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ShieldAlert, History as HistoryIcon, Search, Filter, User, X } from 'lucide-react';
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

export default function History() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/transaction/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const filteredTransactions = transactions.filter((t) => {
    const isOfficerAdjustment = t.sender === 'CENTRAL_OFFICER';
    const isOfficer = user?.role === 'officer';
    
    // Hide officer adjustments for normal users
    if (isOfficerAdjustment && !isOfficer) return false;

    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      (t.senderUsername?.toLowerCase() || '').includes(query) ||
      (t.receiverUsername?.toLowerCase() || '').includes(query) ||
      (t.senderNickname?.toLowerCase() || '').includes(query) ||
      (t.receiverNickname?.toLowerCase() || '').includes(query) ||
      t.amount.toString().includes(query);

    if (!matchesQuery) return false;

    const isSender = t.sender === user?.accountID;

    if (filterType === 'sent') return isSender && !isOfficerAdjustment;
    if (filterType === 'received') return !isSender && !isOfficerAdjustment;
    if (filterType === 'adjustment') return isOfficerAdjustment;
    
    return true; // 'all'
  });

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <div className="bg-[#B22222] text-white p-4 flex items-center shadow-md relative z-10">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Transaction Ledger</h1>
      </div>

      <div className="p-4 pb-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by sender, receiver, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#B22222] focus:border-transparent transition-all outline-none bg-white shadow-sm text-gray-800 font-medium"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-full pl-4 pr-10 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#B22222] focus:border-transparent transition-all outline-none bg-white shadow-sm text-gray-800 font-medium appearance-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              {user?.role === 'officer' && (
                <option value="adjustment">Adjustments</option>
              )}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-[#B22222] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <HistoryIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>No authorized transactions found.</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((t) => {
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
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
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
        )}
      </div>
    </div>
  );
}
