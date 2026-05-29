import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldAlert, Users, Activity, ArrowRightLeft, ShieldCheck, Trash2, CheckCircle2, Image as ImageIcon, Upload, Edit2, Home, Wrench, Construction, Search } from 'lucide-react';
import VerifiedTick from '../components/VerifiedTick';

interface UserData {
  accountID: string;
  nickname: string;
  balance: number;
  tickType?: string;
  username: string;
  email?: string;
  passport?: string;
  phone?: string;
  profilePic?: string;
  isBanned?: boolean;
}

interface Complaint {
  _id: string;
  code: string;
  userId: string;
  username: string;
  location: string;
  phone: string;
  cause: string;
  status: string;
  date: string;
}

interface MaintenanceStatus {
  page: string;
  isEnabled: boolean;
}

const PAGES = [
  { id: 'domain', name: 'My Domain' },
  { id: 'jp-police', name: 'JP Police' },
];

export default function OfficerDashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'clients' | 'complaints' | 'ticks' | 'create' | 'edit' | 'maintenance'>('clients');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [type, setType] = useState<'reward' | 'fine'>('reward');
  const [actionLoading, setActionLoading] = useState(false);
  const handleToggleBan = async (u: UserData) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await fetch(`/api/officer/users/${u.accountID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBanned: !u.isBanned }),
      });

      if (res.ok) {
        setSuccess(`Account ${!u.isBanned ? 'banned' : 'unbanned'} successfully`);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update ban status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Account Creation/Edit State
  const [accountForm, setAccountForm] = useState({
    nickname: '',
    username: '',
    phone: '+81',
    email: '',
    profilePic: '',
    passport: '',
    password: '',
    transactionPin: '',
    balance: 0,
    tickType: '',
    isBanned: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'clients' || activeTab === 'ticks') {
        const res = await fetch('/api/officer/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } else if (activeTab === 'complaints') {
        const res = await fetch('/api/officer/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data);
        }
      } else if (activeTab === 'maintenance') {
        const res = await fetch('/api/maintenance');
        if (res.ok) {
          const data = await res.json();
          setMaintenance(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const res = await fetch('/api/officer/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account creation failed');

      setSuccess(`Account created successfully for @${data.username}`);
      setAccountForm({
        nickname: '',
        username: '',
        phone: '+81',
        email: '',
        profilePic: '',
        passport: '',
        password: '',
        transactionPin: '',
        balance: 0,
        tickType: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const res = await fetch(`/api/officer/users/${editingUser.accountID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account update failed');

      setSuccess(`Account updated successfully for @${accountForm.username}`);
      fetchData();
      setTimeout(() => setActiveTab('clients'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = (u: UserData) => {
    setEditingUser(u);
    setAccountForm({
      nickname: u.nickname,
      username: u.username,
      phone: u.phone || '',
      email: u.email || '',
      profilePic: u.profilePic || '',
      passport: u.passport || '',
      password: '', // Don't pre-fill for security
      transactionPin: '', // Don't pre-fill for security
      balance: u.balance,
      tickType: u.tickType || '',
      isBanned: u.isBanned || false
    });
    setActiveTab('edit');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccountForm({ ...accountForm, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const res = await fetch('/api/officer/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetID: selectedUser.accountID,
          amount: Number(amount),
          type,
          remark,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');

      setSuccess(`Successfully applied ${type} of ¥${amount} to ${selectedUser.nickname}.`);
      setAmount('');
      setRemark('');
      fetchData();
      setTimeout(() => {
        setSelectedUser(null);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTick = async (targetID: string, tickType: string) => {
    try {
      const res = await fetch('/api/officer/update-tick', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetID, tickType })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update tick', err);
    }
  };

  const toggleMaintenance = async (pageId: string, currentState: boolean) => {
    try {
      const res = await fetch('/api/officer/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ page: pageId, isEnabled: !currentState })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle maintenance', err);
    }
  };

  const handleUpdateComplaintStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/officer/complaints/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDeleteUser = async (accountID: string) => {
    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await fetch(`/api/officer/users/${accountID}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Account deleted successfully');
        setDeletingUserId(null);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteComplaint = async (codeValue: string) => {
    if (!codeValue) {
      alert('Error: Complaint code is missing! Cannot delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      const res = await fetch(`/api/delete/${codeValue}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Done');
        window.location.reload();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Unknown error'));
        if (data.stack) console.error('Backend Stack Trace:', data.stack);
      }
    } catch (err) {
      alert('Error: Database connected nahi hai');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      case 'Take down': return 'bg-gray-100 text-gray-500';
      case 'Ignored': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.accountID.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 px-6 pt-12 pb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldAlert className="w-32 h-32 text-white" />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[#FFD700] text-sm font-medium tracking-wider uppercase mb-1">Central Officer</p>
            <div className="flex items-center space-x-3 mt-1">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
                alt="Japan Bank Logo"
                className="h-10 w-auto brightness-110 drop-shadow-md"
              />
              <div className="h-8 w-px bg-white/20 mx-2" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                HQ Panel
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 relative z-10">
            <button onClick={() => navigate('/')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Home">
              <Home className="w-5 h-5 text-white" />
            </button>
            <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Logout">
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex items-center overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center space-x-1 min-w-full">
            <button 
              onClick={() => setActiveTab('clients')}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'clients' ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Clients
            </button>
            <button 
              onClick={() => setActiveTab('complaints')}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'complaints' ? 'bg-[#B22222] text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              JP Police
            </button>
            <button 
              onClick={() => setActiveTab('ticks')}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'ticks' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Tick
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'create' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Create
            </button>
            <button 
              onClick={() => setActiveTab('maintenance')}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'maintenance' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Maintenance
            </button>
            <button 
              onClick={() => navigate('/history')}
              className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
            >
              Ledger
            </button>
            <button 
              onClick={() => navigate('/nuke')}
              className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all whitespace-nowrap flex-shrink-0 border border-red-100"
            >
              Nuke Room
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 flex-1 pb-12">
        {activeTab === 'clients' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Client Directory</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-xs font-semibold"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map(u => (
                  <div key={u.accountID} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start gap-3">
                    <div className="w-full flex justify-between items-start">
                      <div className="shrink-0">
                        <div className="flex items-center space-x-1">
                          <p className="font-semibold text-gray-800 font-mono text-sm">@{u.username}</p>
                          <VerifiedTick type={u.tickType} size={14} />
                        </div>
                        <p className="text-xs text-gray-500">{u.nickname}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button 
                          onClick={() => startEditing(u)}
                          className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleToggleBan(u)}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${u.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                          {u.isBanned ? 'Unban' : 'Temp Ban'}
                        </button>
                        <button 
                          onClick={() => setSelectedUser(u)}
                          className="text-[10px] text-[#B22222] font-black uppercase tracking-wider hover:underline px-2 py-1"
                        >
                          Adjust Balance
                        </button>
                        <button 
                          onClick={() => setDeletingUserId(u.accountID)}
                          className="p-1.5 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {deletingUserId === u.accountID && (
                      <div className="w-full bg-red-50 p-3 rounded-xl border border-red-100 mt-1">
                        <p className="text-xs text-red-700 font-bold mb-2 uppercase tracking-wider">Confirm Account Deletion?</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDeleteUser(u.accountID)}
                            disabled={actionLoading}
                            className="flex-1 bg-red-600 text-white text-[10px] font-bold py-2 rounded-lg uppercase tracking-widest hover:bg-red-700 disabled:bg-gray-400"
                          >
                            {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button 
                            onClick={() => setDeletingUserId(null)}
                            className="flex-1 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold py-2 rounded-lg uppercase tracking-widest hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="w-full text-left bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Current Balance</p>
                      <p className="font-bold text-gray-900 text-xl break-all whitespace-normal">¥ {u.balance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'ticks' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Tick Manager</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-xs font-semibold"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map(u => (
                  <div key={u.accountID} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <p className="font-semibold text-gray-800 font-mono text-sm">@{u.username}</p>
                        <VerifiedTick type={u.tickType} size={18} />
                      </div>
                      <p className="text-xs text-gray-400">{u.nickname}</p>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => handleUpdateTick(u.accountID, '')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${!u.tickType ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        None
                      </button>
                      <button 
                        onClick={() => handleUpdateTick(u.accountID, 'golden')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center space-x-1 ${u.tickType === 'golden' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-100 text-gray-400 hover:border-yellow-100'}`}
                      >
                        <VerifiedTick type="golden" size={12} />
                        <span>Golden</span>
                      </button>
                      <button 
                        onClick={() => handleUpdateTick(u.accountID, 'blue')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center space-x-1 ${u.tickType === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-100'}`}
                      >
                        <VerifiedTick type="blue" size={12} />
                        <span>Blue</span>
                      </button>
                      <button 
                        onClick={() => handleUpdateTick(u.accountID, 'brown')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center space-x-1 ${u.tickType === 'brown' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-100'}`}
                      >
                        <VerifiedTick type="brown" size={12} />
                        <span>Brown</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'create' || activeTab === 'edit' ? (
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {activeTab === 'create' ? 'JPBank Account Creation' : 'Edit User Account'}
            </h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">{success}</div>}
              
              <form onSubmit={activeTab === 'create' ? handleCreateAccount : handleUpdateAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (Max 8)</label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                      value={accountForm.nickname}
                      onChange={(e) => setAccountForm({...accountForm, nickname: e.target.value})}
                      placeholder="Nickname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username (Max 8)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                        value={accountForm.username}
                        onChange={(e) => setAccountForm({...accountForm, username: e.target.value})}
                        placeholder="Username"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (+81 or +91)</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({...accountForm, phone: e.target.value})}
                    placeholder="+81XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                    value={accountForm.passport}
                    onChange={(e) => setAccountForm({...accountForm, passport: e.target.value})}
                    placeholder="Passport Number"
                  />
                </div>

                {activeTab === 'edit' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Balance (¥)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                        value={accountForm.balance}
                        onChange={(e) => setAccountForm({...accountForm, balance: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tick Type</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-gray-900"
                        value={accountForm.tickType}
                        onChange={(e) => setAccountForm({...accountForm, tickType: e.target.value})}
                      >
                        <option value="">None</option>
                        <option value="blue">Blue</option>
                        <option value="golden">Golden</option>
                        <option value="brown">Brown</option>
                      </select>
                    </div>
                  </div>
                )}

                {(activeTab === 'create' || activeTab === 'edit') && (
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <input 
                      type="checkbox" 
                      id="isBanned"
                      className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      checked={accountForm.isBanned}
                      onChange={(e) => setAccountForm({...accountForm, isBanned: e.target.checked})}
                    />
                    <label htmlFor="isBanned" className="text-sm font-black text-slate-700 uppercase tracking-widest cursor-pointer">
                      Account Locked (Banned)
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {accountForm.profilePic ? (
                          <img src={accountForm.profilePic} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                        value={accountForm.profilePic}
                        onChange={(e) => setAccountForm({...accountForm, profilePic: e.target.value})}
                        placeholder="Or paste image URL here..."
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Upload from gallery or provide a direct link</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'create' ? 'Login Password' : 'New Login Password'}
                    </label>
                    <input
                      type="password"
                      required={activeTab === 'create'}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                      value={accountForm.password}
                      onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                      placeholder="For login only"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === 'create' ? 'Transaction PIN (4 digits)' : 'New Transaction PIN'}
                    </label>
                    <input
                      type="password"
                      required={activeTab === 'create'}
                      maxLength={4}
                      pattern="\d{4}"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                      value={accountForm.transactionPin}
                      onChange={(e) => setAccountForm({...accountForm, transactionPin: e.target.value.replace(/\D/g, '')})}
                      placeholder="4-digit PIN"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  {activeTab === 'edit' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('clients')}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`flex-1 ${activeTab === 'create' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center`}
                  >
                    {actionLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      activeTab === 'create' ? 'Create Account' : 'Update Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTab === 'maintenance' ? (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight flex items-center">
              <Construction className="w-5 h-5 mr-2 text-orange-500" />
              Page Maintenance Mode
            </h2>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {PAGES.map((p) => {
                  const status = maintenance.find(m => m.page === p.id);
                  const isEnabled = status?.isEnabled || false;
                  
                  return (
                    <div key={p.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-0.5">
                          {isEnabled ? 'Under Construction' : 'Active'}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => toggleMaintenance(p.id, isEnabled)}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${isEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-7' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start space-x-3">
              <Wrench className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-900 leading-tight">Professional Notice</p>
                <p className="text-xs text-orange-700/80 mt-1 leading-relaxed">
                  Enabling maintenance mode will instantly restrict user access to the selected page and display the official "Under Construction" portal.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">JP Police Complaints</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#B22222] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No complaints to review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map(complaint => (
                  <div key={complaint._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">Code: {complaint.code}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(complaint.date).toLocaleString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-700"><span className="font-semibold">User:</span> {complaint.username} ({complaint.userId})</p>
                      <p className="text-sm text-gray-700"><span className="font-semibold">Phone:</span> {complaint.phone}</p>
                      <p className="text-sm text-gray-700"><span className="font-semibold">Location:</span> {complaint.location}</p>
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-700 font-semibold mb-1">Cause:</p>
                        <p className="text-sm text-gray-600">{complaint.cause}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                      <select 
                        value={complaint.status}
                        onChange={(e) => handleUpdateComplaintStatus(complaint._id, e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#B22222] focus:border-[#B22222] block w-full p-2.5"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolve</option>
                        <option value="Ignored">Ignore</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <button 
                        onClick={() => deleteComplaint(complaint.code)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {activeTab === 'complaints' && (
        <div className="pt-16 pb-32 bg-[#050505] relative overflow-hidden flex flex-col justify-center items-center w-full mt-auto">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-40 bg-gradient-to-t from-red-600/40 via-purple-900/20 to-transparent blur-3xl" />
          <ShieldCheck className="w-12 h-12 relative z-10 mb-2 text-white opacity-80" />
          <p className="relative text-gray-400/80 font-bold tracking-wide text-xl z-10">
            Powered by JP Police
          </p>
        </div>
      )}

      {/* Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Bank Adjustment</h3>
              <button onClick={() => { setSelectedUser(null); setError(''); setSuccess(''); }} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 text-center">
                <p className="text-sm text-gray-500">Target Account</p>
                <p className="text-xl font-bold text-gray-900">{selectedUser.nickname}</p>
                <p className="text-xs font-mono text-gray-500">@{selectedUser.username}</p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">{success}</div>}

              <form onSubmit={handleAdjustment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('reward')}
                    className={`py-3 rounded-xl font-semibold border-2 transition-colors ${type === 'reward' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Credit Reward
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('fine')}
                    className={`py-3 rounded-xl font-semibold border-2 transition-colors ${type === 'fine' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Debit Fine
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (¥)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none text-lg font-semibold"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Remark</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none text-sm font-medium"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Briefly explain the adjustment..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-semibold py-4 rounded-xl shadow-md transition-colors duration-200 mt-4 flex justify-center items-center"
                >
                  {actionLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Execute Adjustment'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
