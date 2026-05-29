import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Plus, CheckCircle2, AlertCircle, X, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VerifiedTick from '../components/VerifiedTick';

interface Complaint {
  _id: string;
  code: string;
  location: string;
  phone: string;
  cause: string;
  status: string;
  date: string;
}

export default function JpPolice() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  
  // Form State
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [cause, setCause] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [token]);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/police/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch('/api/police/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ location, phone, cause })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Complaint filed successfully! Code: ${data.data.code}`);
        setLocation(''); setPhone(''); setCause('');
        fetchComplaints();
        setTimeout(() => { setView('list'); setSuccess(''); }, 2000);
      } else {
        setError(data.error || 'Failed to file complaint');
      }
    } catch (err: any) {
      setError('Network error occurred while filing complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeDownComplaint = async (id: string) => {
    if (!window.confirm('Are you sure you want to take down this complaint?')) return;
    try {
      const res = await fetch(`/api/police/complaints/${id}/takedown`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      if (res.ok) {
        alert('Complaint taken down successfully.');
        fetchComplaints();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to take down complaint');
      }
    } catch (err: any) {
      console.error('Failed to take down complaint', err);
      alert(`Network error: ${err.message}`);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-br from-[#B22222] to-[#8B0000] px-6 pt-16 pb-12 shadow-2xl relative overflow-hidden">
        {/* Police Watermark */}
        <div className="absolute -right-10 -top-10 opacity-10 rotate-12 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
        <div className="absolute -left-20 -bottom-20 opacity-5 pointer-events-none">
          <ShieldCheck className="w-80 h-80 text-white" />
        </div>

        <div className="flex flex-col space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => {
              if (view === 'create') setView('list');
              else navigate(-1);
            }} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em]">Official Network</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">JP POLICE</h1>
            <p className="text-[#FFD700] font-bold text-xs uppercase tracking-[0.4em] opacity-90">Digital Identity</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 flex-1 pb-12 relative z-20">
        {view === 'list' ? (
          // --- COMPLAINTS LIST VIEW ---
          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <div className="flex flex-col space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Complaints</h2>
                  <p className="text-sm text-gray-500 font-medium">Manage your reports with JP Gov network</p>
                </div>
                
                <button 
                  onClick={() => setView('create')} 
                  className="w-full sm:w-auto px-8 py-4 bg-[#B22222] text-white text-lg font-black rounded-full hover:bg-[#8B0000] transition-all shadow-[0_10px_25px_-5px_rgba(178,34,34,0.4)] active:scale-[0.98] flex items-center justify-center space-x-2 group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  <span>New</span>
                </button>
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No complaints filed yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map(complaint => (
                  <div key={complaint._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-[#B22222] animate-pulse" />
                          <h3 className="font-black text-gray-900 text-lg tracking-tight">#{complaint.code}</h3>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(complaint.date).toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                          <p className="text-sm text-gray-800 font-bold">{complaint.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cause</p>
                          <p className="text-sm text-gray-800 font-medium leading-relaxed">{complaint.cause}</p>
                        </div>
                      </div>
                    </div>

                    {complaint.status === 'Pending' && (
                      <button 
                        onClick={() => handleTakeDownComplaint(complaint._id)}
                        className="w-full py-3 text-xs text-gray-400 font-black uppercase tracking-[0.2em] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-dashed border-gray-200 hover:border-red-200"
                      >
                        Take down report
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // --- FILE COMPLAINT VIEW ---
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-[#B22222]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">File a Complaint</h2>
                  <p className="text-xs text-gray-500">Submit details to JP Police</p>
                </div>
              </div>
              <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-800 font-medium">Cancel</button>
            </div>

            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Examples of valid causes:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>Theft at the central market</li>
                  <li>Lost ID card near the station</li>
                  <li>Suspicious activity in the neighborhood</li>
                </ul>
              </div>
            </div>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 font-medium">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Username</label>
                  <VerifiedTick type={user?.tickType} size={16} />
                </div>
                <input
                  type="text"
                  value={user?.username ? `@${user.username}` : ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where did this happen?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B22222]/20 focus:border-[#B22222] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your contact number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B22222]/20 focus:border-[#B22222] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cause (What is the issue?)</label>
                <textarea
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B22222]/20 focus:border-[#B22222] transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#B22222] hover:bg-[#8B0000] text-white font-bold rounded-xl shadow-md shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Submit Complaint</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-16 pb-32 bg-[#050505] relative overflow-hidden flex flex-col justify-center items-center w-full mt-auto">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-40 bg-gradient-to-t from-red-600/40 via-purple-900/20 to-transparent blur-3xl" />
        <ShieldCheck className="w-12 h-12 relative z-10 mb-2 text-white opacity-80" />
        <p className="relative text-gray-400/80 font-bold tracking-wide text-xl z-10">
          Powered by JP Police
        </p>
      </div>
    </div>
  );
}
