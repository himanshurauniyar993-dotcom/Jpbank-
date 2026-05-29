import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('jp_remember_me') !== 'false';
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  React.useEffect(() => {
    const savedUser = localStorage.getItem('jp_remembered_username');
    if (savedUser) {
      setUsername(savedUser);
    }
  }, []);

  const handleUsernameChange = (val: string) => {
    // If empty, just show @
    if (val === '' || val === '@') {
      setUsername('@');
      return;
    }
    
    // Ensure it starts with @
    if (!val.startsWith('@')) {
      setUsername('@' + val.replace(/^@+/, ''));
    } else {
      // Prevent multiple @ at the start and keep the rest as is
      setUsername('@' + val.slice(1).replace(/^@+/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Authentication failed');
        }

        if (rememberMe) {
          localStorage.setItem('jp_remembered_username', username);
          localStorage.setItem('jp_remember_me', 'true');
        } else {
          localStorage.removeItem('jp_remembered_username');
          localStorage.setItem('jp_remember_me', 'false');
        }

        login(data.token, { 
          accountID: data.accountID, 
          username: data.username,
          nickname: data.nickname, 
          balance: data.balance || 0, 
          role: data.role 
        });
        navigate('/');
      } else {
        const text = await res.text();
        console.error('Login error response:', text);
        if (res.status === 403) {
          throw new Error('ACCOUNT IS LOCKED');
        }
        throw new Error(`Server Error (${res.status})`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col relative overflow-x-hidden selection:bg-red-100 selection:text-red-900">
      {/* Top Section with Wave */}
      <div className="bg-[#B22222] min-h-[320px] h-[40vh] flex flex-col items-center justify-center relative z-10 shadow-[0_10px_30px_rgba(178,34,34,0.2)] overflow-hidden">
        {/* Background Temple Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&q=80&w=1920")',
            mixBlendMode: 'luminosity'
          }}
        />
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-4"
        >
          <div className="px-4 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">Official Network</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center relative z-10"
        >
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDUwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNjUiIGZpbGw9IiMxQjQzMzIiIHN0cm9rZT0iI0M1QTA1OSIgc3Ryb2tlLXdpZHRoPSIzIiAvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCA2MCkgc2NhbGUoMC44KSIgZmlsbD0iIzJENkE0RiI+PHBhdGggZD0iTTAsLTI1IEM1LC0xNSAxNSwtMTUgMjAsLTIwIEMxNSwtMTAgMTUsMCAyNSwwIEMxNSwwIDE1LDEwIDIwLDIwIEMxNSwxNSA1LDE1IDAsMjUgQy01LDE1IC0xNSwxNSAtMjAsMjAgQy0xNSwxMCAtMTUsMCAtMjUsMCBDLTE1LDAgLTE1LC0xMCAtMjAsLTIwIEMtMTUsLTE1IC01LC0xNSAwLC0yNSBaIiAvPjwvZz48dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iJ1RpbWVzIE5ldyBSb21hbicsIHNlcmlmIiBmb250LXNpemU9IjM2IiBmaWxsPSIjQzVBMDU5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+SlA8L3RleHQ+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYwLCAwKSI+PHRleHQgeT0iNjUiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiNDNUEwNTkiIGZvbnQtd2VpZ2h0PSJib2xkIj5KQVBBTiBCQU5LPC90ZXh0Pjx0ZXh0IHk9IjExMCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI0M1QTA1OSI+44K444Oj44OR44Oz6YqA6KGMPC90ZXh0PjwvZz48L3N2Zz4=" 
            alt="Japan Bank Logo"
            style={{ width: '280px', height: 'auto', display: 'block', margin: '10px auto' }}
          />
        </motion.div>

        {/* Wave SVG - Adjusted for better spacing */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform translate-y-[99%] pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] sm:h-[80px] fill-[#B22222] drop-shadow-[0_15px_15px_rgba(0,0,0,0.05)]">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col items-center pt-20 sm:pt-24 px-8 pb-12 relative z-20 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm space-y-6"
        >
          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 border-2 border-red-100 text-red-600 px-5 py-4 rounded-2xl text-xs font-black text-center shadow-sm flex items-center justify-center space-x-2"
            >
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex items-center px-6 py-5 border border-transparent transition-all focus-within:shadow-[0_15px_50px_-12px_rgba(178,34,34,0.15)] focus-within:border-red-50 group">
              <User className="text-gray-300 group-focus-within:text-[#B22222] transition-colors" size={20} />
              <input
                type="text"
                required
                className="flex-1 ml-4 outline-none text-gray-800 font-bold placeholder:text-gray-300 placeholder:font-bold text-sm tracking-widest bg-transparent"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onFocus={() => { if (!username) setUsername('@'); }}
                placeholder="@Username"
                autoComplete="username"
              />
            </div>

            {/* Password Input */}
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex items-center px-6 py-5 border border-transparent transition-all focus-within:shadow-[0_15px_50px_-12px_rgba(178,34,34,0.15)] focus-within:border-red-50 group">
              <Lock className="text-gray-300 group-focus-within:text-[#B22222] transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="flex-1 ml-4 outline-none text-gray-800 font-black placeholder:text-gray-300 placeholder:font-bold text-sm tracking-[0.2em] bg-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Login Password"
                autoComplete="current-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-300 hover:text-[#B22222] transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between py-3 px-1">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Remember</span>
              <button 
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-12 h-6.5 rounded-full relative transition-all duration-300 shadow-inner ${rememberMe ? 'bg-green-500 shadow-green-200' : 'bg-gray-200'}`}
              >
                <motion.div 
                  animate={{ x: rememberMe ? 24 : 2 }}
                  className="absolute top-1 w-4.5 h-4.5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-[#B22222] to-[#8B0000] hover:from-[#8B0000] hover:to-[#700000] text-white font-black py-5 rounded-2xl shadow-[0_15px_30px_-5px_rgba(178,34,34,0.3)] active:scale-[0.98] transition-all duration-200 text-sm uppercase tracking-[0.2em] mt-6 border border-white/10"
            >
              Secure Login
            </button>
          </form>
        </motion.div>
        
        <div className="mt-auto pt-12 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] leading-relaxed">
            Official JP Government<br/>Financial Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
