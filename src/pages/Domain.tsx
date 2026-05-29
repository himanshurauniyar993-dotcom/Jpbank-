import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, CheckCircle2, AlertCircle, Settings, Plus, Trash2, Edit2, X, RefreshCw, Copy, ExternalLink, Info, HelpCircle, ChevronRight, Languages, ShieldAlert, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CustomRecord {
  _id: string;
  type: string;
  subname: string;
  value: string;
  ttl?: number;
}

interface DomainData {
  _id: string;
  subdomain: string;
  recordType: string;
  targetValue: string;
  status: string;
  customRecords: CustomRecord[];
}

export default function Domain() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [view, setView] = useState<'list' | 'register'>('list');
  const [selectedDomain, setSelectedDomain] = useState<DomainData | null>(null);
  const [termsLang, setTermsLang] = useState<'ja' | 'en' | 'hi' | 'hindlish'>('ja');

  const hasDomain = domains.length > 0;

  const TERMS_CONTENT = {
    ja: {
      title: "利用規約",
      items: [
        "このドメインを違法行為に使用しないでください！",
        "あなたの仕事のためにこれを使用してください。",
        "見知らぬ人と共有しないでください。",
        "ドメインの支払いや未払金の清算を忘れないでください。メールやJP Bankアプリで通知をお送りします。",
        "会社で使用する場合は、ゴールデンティック（推奨）を使用してください。"
      ]
    },
    en: {
      title: "Terms and Services",
      items: [
        "Do not use this domain for illegal activities!",
        "Use this domain for your professional or personal work.",
        "Do not share your domain credentials with any unknown persons.",
        "Ensure timely payment of your domain dues; notifications will be sent via email and the JP Bank app.",
        "For corporate or company domains, using a Golden Tick is highly recommended."
      ]
    },
    hi: {
      title: "नियम और शर्तें",
      items: [
        "इस डोमेन का उपयोग अवैध गतिविधियों के लिए न करें!",
        "इसका उपयोग अपने कार्यों के लिए करें।",
        "किसी भी अज्ञात व्यक्ति के साथ साझा न करें।",
        "डोमेन के लिए अपने बकाया का भुगतान करना न भूलें; हम आपको ईमेल और जेपी बैंक ऐप में सूचना भेजेंगे।",
        "यदि डोमेन कंपनी के उपयोग के लिए है, तो गोल्डन टिक (सुझाया गया) का उपयोग करें।"
      ]
    },
    hindlish: {
      title: "Terms and Services",
      items: [
        "Is domain ka use illegal activities ke liye na karein!",
        "Iska use apne kaam ke liye karein.",
        "Kisi bhi unknown person ke saath share na karein.",
        "Domain ke dues pay karna na bhoolein, hum aapko email aur JP Bank app mein notification bhejenge.",
        "Agar domain company use ke liye hai, toh Golden Tick (suggested) ka use karein."
      ]
    }
  };
  
  // Registration State
  const [subdomain, setSubdomain] = useState('');
  const [recordType, setRecordType] = useState('CNAME');
  const [targetValue, setTargetValue] = useState('');
  
  // Edit State
  const [editTarget, setEditTarget] = useState('');
  
  // Custom Record State
  const [customType, setCustomType] = useState('TXT');
  const [customSubname, setCustomSubname] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDomains();
    const interval = setInterval(() => {
      fetchDomains();
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const desecDomain = import.meta.env.VITE_DESEC_DOMAIN || 'jpgov.dedyn.io';

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/my-domains', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Parse customRecords if they are strings (to fix CastError workaround)
        const parsedData = data.map((domain: any) => ({
          ...domain,
          customRecords: (domain.customRecords || []).map((record: any) => {
            if (typeof record === 'string') {
              try {
                return JSON.parse(record);
              } catch (e) {
                console.error('Failed to parse record string', record);
                return { _id: Math.random().toString(), type: 'ERR', subname: 'ERR', value: record };
              }
            }
            return record;
          })
        }));
        setDomains(parsedData);
        
        // If a domain is selected, update its data too
        if (selectedDomain) {
          const updatedSelected = parsedData.find((d: DomainData) => d._id === selectedDomain._id);
          if (updatedSelected) {
            setSelectedDomain(updatedSelected);
          } else {
            // It was deleted
            setSelectedDomain(null);
            setView('list');
          }
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch domains');
      }
    } catch (err) {
      console.error('Failed to fetch domains', err);
      setError('Network error: Could not reach the server to fetch domains.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    await fetchDomains();
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch('/api/register-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subdomain, recordType, targetValue })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Domain registered successfully!');
        setSubdomain(''); setTargetValue('');
        fetchDomains();
        setTimeout(() => { setView('list'); setSuccess(''); }, 1500);
      } else {
        setError(data.error || 'Failed to register domain');
      }
    } catch (err: any) {
      setError('Network error occurred while registering domain');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch(`/api/domains/${selectedDomain._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetValue: editTarget })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Target updated successfully!');
        fetchDomains();
        setSelectedDomain({ ...selectedDomain, targetValue: editTarget, status: 'ACTIVE' });
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'Failed to update domain');
      }
    } catch (err: any) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!selectedDomain || !window.confirm('Are you sure you want to delete this domain?')) return;
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch(`/api/domains/${selectedDomain._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setDomains(prev => prev.filter(d => d._id !== selectedDomain._id));
        setSelectedDomain(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete domain');
      }
    } catch (err: any) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch(`/api/domains/${selectedDomain._id}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: customType, subname: customSubname, value: customValue })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Record added successfully!');
        setCustomSubname(''); setCustomValue('');
        const updatedDomain = { ...selectedDomain, customRecords: [...(selectedDomain.customRecords || []), data.record] };
        setSelectedDomain(updatedDomain);
        fetchDomains();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'Failed to add record');
      }
    } catch (err: any) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomRecord = async (recordId: string) => {
    if (!selectedDomain || !window.confirm('Delete this record?')) return;
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch(`/api/domains/${selectedDomain._id}/records/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const updatedDomain = { 
          ...selectedDomain, 
          customRecords: selectedDomain.customRecords.filter(r => r._id !== recordId) 
        };
        setSelectedDomain(updatedDomain);
        fetchDomains();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete record');
      }
    } catch (err: any) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !editingRecordId) return;
    setLoading(true); setError(''); setSuccess('');

    try {
      const res = await fetch(`/api/domains/${selectedDomain._id}/records/${editingRecordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value: customValue })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Record updated successfully!');
        setEditingRecordId(null);
        setCustomSubname(''); setCustomValue('');
        const updatedDomain = { 
          ...selectedDomain, 
          customRecords: selectedDomain.customRecords.map(r => r._id === editingRecordId ? data.record : r) 
        };
        setSelectedDomain(updatedDomain);
        fetchDomains();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.error || 'Failed to update record');
      }
    } catch (err: any) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startEditRecord = (record: CustomRecord) => {
    setEditingRecordId(record._id);
    setCustomType(record.type);
    setCustomSubname(record.subname);
    setCustomValue(record.value);
  };

  const cancelEditRecord = () => {
    setEditingRecordId(null);
    setCustomSubname('');
    setCustomValue('');
  };

  const openConfig = (domain: DomainData) => {
    setSelectedDomain(domain);
    setEditTarget(domain.targetValue);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-[#B22222] to-[#8B0000] px-6 pt-12 pb-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Globe className="w-40 h-40 text-white" />
        </div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={() => {
            if (selectedDomain) setSelectedDomain(null);
            else if (view === 'register') setView('list');
            else navigate(-1);
          }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Domain</h1>
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest mt-1">Manage your digital identity</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20">
        {selectedDomain ? (
          // --- CONFIGURATION MODAL / VIEW ---
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-[#B22222]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">{selectedDomain.subdomain}.{desecDomain}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <div className="flex items-center space-x-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedDomain.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDomain.status === 'ACTIVE' ? 'text-green-700' : 'text-yellow-700'}`}>
                        {selectedDomain.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-gray-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">{selectedDomain.recordType}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDomain(null)} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center space-x-3 animate-in zoom-in-95">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-green-800 font-bold">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3 animate-in zoom-in-95">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-sm text-red-800 font-bold">{error}</p>
              </div>
            )}

            {/* Edit Target */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                  <Edit2 className="w-3 h-3 mr-2" /> Primary Target
                </h3>
                <button onClick={() => copyToClipboard(selectedDomain.targetValue)} className="text-[10px] font-bold text-[#B22222] hover:underline flex items-center self-start sm:self-auto">
                  <Copy className="w-3 h-3 mr-1" /> Copy Current
                </button>
              </div>
              <form onSubmit={handleUpdateTarget} className="flex flex-col space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#B22222]/5 focus:border-[#B22222] text-sm text-gray-900 font-mono shadow-sm transition-all"
                    placeholder={`e.g. ${user?.nickname?.toLowerCase() || 'minato'}.dkkdk.lk`}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-sm transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-gray-900/10">
                  {loading ? 'Updating...' : 'Save Target Configuration'}
                </button>
              </form>
            </div>

            {/* Custom Records */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                  <Settings className="w-3 h-3 mr-2" /> Advanced Records
                </h3>
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full self-start sm:self-auto">
                  {(selectedDomain.customRecords || []).length}/1 Active
                </span>
              </div>
              
              {(selectedDomain.customRecords || []).length > 0 && (
                <div className="space-y-3 mb-6">
                  {selectedDomain.customRecords.map((record) => (
                    <div key={record._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-[#B22222]/30 transition-all shadow-sm gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-[9px] font-black bg-[#B22222] text-white px-2 py-0.5 rounded uppercase tracking-wider shrink-0">{record.type}</span>
                          <span className="text-sm font-bold text-gray-900 truncate">{record.subname || '@'}</span>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-gray-100 text-[11px] text-gray-600 font-mono break-all leading-relaxed overflow-hidden">
                          {record.value}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 shrink-0">
                        <button onClick={() => startEditRecord(record)} className="flex-1 sm:flex-none p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm bg-white border border-gray-50 flex items-center justify-center">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCustomRecord(record._id)} className="flex-1 sm:flex-none p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white border border-gray-50 flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-5">
                <div className="flex items-center space-x-2 mb-1">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {editingRecordId ? 'Modify Existing Record' : 'Add New Verification Record'}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/3">
                    <div className="relative">
                      <select 
                        disabled={!!editingRecordId} 
                        value={customType} 
                        onChange={(e) => setCustomType(e.target.value)} 
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B22222]/10 focus:border-[#B22222] disabled:opacity-50 appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="TXT">TXT</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <input 
                      disabled={!!editingRecordId} 
                      type="text" 
                      placeholder="Host (e.g. _verify)" 
                      value={customSubname} 
                      onChange={(e) => setCustomSubname(e.target.value)} 
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B22222]/10 focus:border-[#B22222] disabled:opacity-50 shadow-sm font-medium" 
                    />
                  </div>
                </div>
                
                <textarea 
                  placeholder="Value / Content (e.g. google-site-verification=...)" 
                  value={customValue} 
                  onChange={(e) => setCustomValue(e.target.value)} 
                  required 
                  rows={3}
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#B22222]/10 focus:border-[#B22222] resize-none font-mono shadow-sm" 
                />
                
                {editingRecordId ? (
                  <div className="flex space-x-3">
                    <button type="button" onClick={handleUpdateCustomRecord} disabled={loading} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-900/10">
                      Update Record
                    </button>
                    <button type="button" onClick={cancelEditRecord} disabled={loading} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 font-black rounded-2xl text-sm transition-all active:scale-[0.98]">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleAddCustomRecord}
                    disabled={loading || (selectedDomain.customRecords || []).length >= 1} 
                    className="w-full py-4 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-gray-900/10"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Record
                  </button>
                )}
              </div>
            </div>

            {/* Delete Domain */}
            <div className="pt-8 border-t border-gray-100">
              <button onClick={handleDeleteDomain} disabled={loading} className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center border border-red-100">
                <Trash2 className="w-4 h-4 mr-2" /> Terminate Domain Reservation
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3 font-medium uppercase tracking-widest">This action is permanent and cannot be undone</p>
            </div>
          </div>
        ) : view === 'list' ? (
          // --- DASHBOARD LIST VIEW ---
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Reserved Domains</h2>
                  <p className="text-xs text-gray-500 font-medium">Active subdomains in Jp Bank / Jp Gov network</p>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button onClick={handleManualSync} disabled={loading} className="flex-1 sm:flex-none p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100 flex items-center justify-center">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  {!loading && !hasDomain && (
                    <button 
                      onClick={() => setView('register')} 
                      className="flex-[2] sm:flex-none px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center bg-[#B22222] text-white hover:bg-[#8B0000] shadow-md shadow-red-900/20"
                    >
                      <Plus className="w-4 h-4 mr-1" /> New
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-16 text-center flex flex-col items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-gray-300 animate-spin mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing with Jp Gov Network...</p>
                </div>
              ) : domains.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Globe className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold">No domains registered yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Reserve your custom subdomain to point to your website or server.</p>

                </div>
              ) : (
                <div className="space-y-4">
                  {domains.map(domain => (
                    <div key={domain._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                      <div className="p-4 sm:p-5 flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">{domain.subdomain}.{desecDomain}</h3>
                            <button onClick={() => copyToClipboard(`${domain.subdomain}.${desecDomain}`)} className="p-1 text-gray-400 hover:text-[#B22222] transition-colors shrink-0">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="text-[9px] sm:text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">{domain.recordType}</span>
                              <span className="text-[11px] sm:text-xs text-gray-500 font-mono truncate max-w-[100px] sm:max-w-[150px]">{domain.targetValue}</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center space-x-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${domain.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${domain.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {domain.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => openConfig(domain)}
                          className="p-2.5 bg-gray-50 text-gray-400 group-hover:text-[#B22222] group-hover:bg-red-50 rounded-xl transition-all shrink-0"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-50 flex justify-between items-center">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Managed by Jp Gov</p>
                        <a href={`https://${domain.subdomain}.${desecDomain}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#B22222] flex items-center hover:underline">
                          Visit Site <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Information Section (FAQ Removed) */}
            <div className="grid grid-cols-1 gap-6">
            </div>
          </div>
        ) : (
          // --- REGISTRATION VIEW ---
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-[#B22222]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">Reserve Domain</h2>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">Secure your identity</p>
                </div>
              </div>
              <button onClick={() => setView('list')} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3 animate-in zoom-in-95">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-sm text-red-800 font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Subdomain Name</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center group gap-0 sm:gap-0">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. minato"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl focus:outline-none focus:ring-4 focus:ring-[#B22222]/5 focus:border-[#B22222] transition-all text-gray-900 font-bold text-lg placeholder:text-gray-300"
                    required
                  />
                  <div className="px-5 py-4 bg-gray-100 border border-t-0 sm:border-t sm:border-l-0 border-gray-200 rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl text-gray-500 font-black text-sm tracking-tight flex items-center justify-center sm:justify-start">
                    .{desecDomain}
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-gray-400 font-medium ml-1">Only lowercase letters, numbers, and hyphens allowed.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Record Configuration</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRecordType('CNAME')}
                    className={`py-4 px-4 rounded-2xl border-2 text-xs font-black transition-all flex flex-row sm:flex-col items-center justify-center sm:space-y-2 space-x-3 sm:space-x-0 ${
                      recordType === 'CNAME' 
                        ? 'bg-red-50 border-[#B22222] text-[#B22222] shadow-md shadow-red-900/5' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-lg">CNAME</span>
                    <span className="opacity-60 font-bold text-[10px] sm:text-xs">URL Forwarding</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('A')}
                    className={`py-4 px-4 rounded-2xl border-2 text-xs font-black transition-all flex flex-row sm:flex-col items-center justify-center sm:space-y-2 space-x-3 sm:space-x-0 ${
                      recordType === 'A' 
                        ? 'bg-red-50 border-[#B22222] text-[#B22222] shadow-md shadow-red-900/5' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-lg">A RECORD</span>
                    <span className="opacity-60 font-bold text-[10px] sm:text-xs">IP Direct Point</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  {recordType === 'CNAME' ? 'Target Destination URL' : 'Target IPv4 Address'}
                </label>
                <input
                  type="text"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={recordType === 'CNAME' ? `e.g. ${user?.nickname?.toLowerCase() || 'minato'}.github.io` : 'e.g. 192.168.1.1'}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#B22222]/5 focus:border-[#B22222] transition-all text-gray-900 font-mono text-sm shadow-sm"
                  required
                />
                <p className="mt-2 text-[10px] text-gray-400 font-medium ml-1">
                  {recordType === 'CNAME' ? 'Point this domain to an existing website URL.' : 'Point this domain directly to a server IP address.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || hasDomain}
                className="w-full py-5 bg-[#B22222] hover:bg-[#8B0000] text-white font-black rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-base tracking-tight"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : hasDomain ? (
                  <span>Domain Limit Reached</span>
                ) : (
                  <span>Confirm Reservation</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- TERMS AND SERVICES SECTION --- */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-[#B22222]" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {TERMS_CONTENT[termsLang].title}
              </h3>
            </div>
            
            {/* Language Selector Bar */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <div className="flex items-center px-2 mr-1 border-r border-gray-100">
                <Languages className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex space-x-1">
                {[
                  { id: 'ja', label: '日本語' },
                  { id: 'en', label: 'EN' },
                  { id: 'hi', label: 'हिंदी' },
                  { id: 'hindlish', label: 'Hindlish' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setTermsLang(lang.id as any)}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      termsLang === lang.id
                        ? 'bg-[#B22222] text-white shadow-md shadow-red-900/20'
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <ul className="space-y-4">
              {TERMS_CONTENT[termsLang].items.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-4 group">
                  <div className="mt-1 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-[#B22222] transition-colors">
                    <CheckCircle className="w-3 h-3 text-[#B22222] group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 font-bold leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                © 2026 Jp Bank / Jp Gov Network • Compliance Division
              </p>
            </div>
          </div>
        </div>

        {/* --- HOW IT WORKS SECTION (Moved to Last) --- */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">How it works</h3>
          </div>
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-black text-gray-600 shadow-inner">1</div>
              <div>
                <p className="text-base font-black text-gray-900">Reserve Subdomain</p>
                <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">Choose a unique name under <span className="font-mono text-[#B22222] font-bold">{desecDomain}</span>. This is your official digital address in the network.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-black text-gray-600 shadow-inner">2</div>
              <div>
                <p className="text-base font-black text-gray-900">Set Record Type</p>
                <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">
                  <span className="font-bold text-gray-700">CNAME</span> points to another URL (like a GitHub page), while 
                  <span className="font-bold text-gray-700 ml-1">A Record</span> points to a direct IP address of your server.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                © 2026 Jp Bank / Jp Gov Network • Technical Division
              </p>
            </div>
          </div>
        </div>

        {/* --- FREQUENTLY ASKED QUESTIONS SECTION (Moved to Last) --- */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Frequently Asked Questions</h3>
          </div>
          
          <div className="p-6 sm:p-8 space-y-3">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <span className="text-xs font-bold text-gray-700">Can I have more than one domain?</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="text-[11px] text-gray-500 p-3 leading-relaxed">
                Currently, each Jp Gov account is limited to 1 primary subdomain to ensure fair resource allocation across the network.
              </p>
            </details>
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <span className="text-xs font-bold text-gray-700">What is a TXT record?</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="text-[11px] text-gray-500 p-3 leading-relaxed">
                TXT records are used for verification (like Google Search Console) or security (like SPF/DKIM). You can add one custom TXT record to your domain.
              </p>
            </details>
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <span className="text-xs font-bold text-gray-700">Is this service free?</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="text-[11px] text-gray-500 p-3 leading-relaxed">
                Yes! Domain reservation is a complimentary service for all authorized Jp Gov account holders.
              </p>
            </details>
            
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                © 2026 Jp Bank / Jp Gov Network • Support Division
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
