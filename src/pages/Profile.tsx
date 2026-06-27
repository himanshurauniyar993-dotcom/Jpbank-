import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Camera, User, Phone, Save, Loader2, Moon, Sun } from 'lucide-react';
import VerifiedTick from '../components/VerifiedTick';

export default function Profile() {
  const { user, token, refreshUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync with user data once it's loaded
  React.useEffect(() => {
    if (user && !nickname) setNickname(user.nickname || '');
    if (user && !profilePic) setProfilePic(user.profilePic || '');
  }, [user]);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    setPinMessage('');

    try {
      const res = await fetch('/api/user/change-pin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPin, newPin })
      });

      const data = await res.json();
      if (res.ok) {
        setPinMessage('PIN updated successfully!');
        setCurrentPin('');
        setNewPin('');
      } else {
        setPinMessage(data.error || 'Failed to update PIN');
      }
    } catch (error) {
      setPinMessage('An error occurred');
    } finally {
      setPinLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nickname, profilePic })
      });

      if (res.ok) {
        await refreshUser();
        setMessage('Profile updated successfully!');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-24 transition-colors duration-200">
      <div className="bg-[#B22222] dark:bg-[#8B0000] text-white p-4 flex items-center justify-between shadow-md relative z-10 transition-colors duration-200">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">My Profile</h1>
        </div>
        <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Toggle dark mode">
          {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex-1 p-6">
        <form onSubmit={handleSave} className="max-w-md mx-auto space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-colors duration-200">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800 hover:bg-yellow-400 transition-colors"
              >
                <Camera className="w-5 h-5 text-[#8B0000]" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">Tap camera to change photo</p>
          </div>

          {/* Form Fields */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors duration-200">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">🏷️ Nickname</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">@</span>
                <input
                  type="text"
                  value={nickname}
                  maxLength={18}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#B22222] focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Nickname (max 18 chars)"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">👤 Username</label>
                <VerifiedTick type={user.tickType} size={16} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">@</span>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Username cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📧 Email ID</label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📱 Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={user.phone}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Phone number cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🛂 Passport</label>
              <div className="relative">
                <input
                  type="text"
                  value={user.passport || 'Not Provided'}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Passport cannot be changed.</p>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm font-medium text-center ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B22222] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#8B0000] transition-colors shadow-md flex items-center justify-center disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </button>

          {/* Change PIN Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors duration-200">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#B22222] rounded-full" />
              Security Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Current Transaction PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#B22222] focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Transaction PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#B22222] focus:border-transparent transition-all outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              {pinMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${pinMessage.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {pinMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleChangePin}
                disabled={pinLoading || !currentPin || !newPin}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Transaction PIN'}
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/30"
              >
                Delete My Account
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 space-y-4">
                <p className="text-red-700 dark:text-red-300 font-bold text-center text-sm uppercase tracking-wider">
                  ⚠️ Permanent Account Deletion
                </p>
                <p className="text-red-600 dark:text-red-400 text-xs text-center leading-relaxed">
                  This action cannot be undone. All your data, balance, and records will be permanently removed from JP Bank infrastructure.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-3 rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
