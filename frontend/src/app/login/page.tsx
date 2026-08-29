"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function Login() {
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'admin') {
        const res = await axios.post('https://bengkelinovasi-gpsplotter.my.id/api/admin/login', { username, password });
        Cookies.set('token', res.data.token);
        Cookies.set('role', 'admin');
        router.push('/admin');
      } else {
        const res = await axios.post('https://bengkelinovasi-gpsplotter.my.id/api/auth/login', { token });
        Cookies.set('token', res.data.token);
        Cookies.set('role', 'user');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/50 to-blue-100 text-slate-800 font-sans relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full p-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-900/10 border border-white/50 relative z-10">
        
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-xl shadow-indigo-500/20 border border-white overflow-hidden relative">
            <img src="/logo.jpg" alt="Company Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <h2 className="text-3xl font-black mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
          Login {mode === 'admin' ? 'Admin' : 'Mentee'}
        </h2>
        
        <div className="flex justify-center mb-8 p-1 bg-slate-100 rounded-xl">
          <button onClick={() => setMode('user')} className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-300 ${mode === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mentee</button>
          <button onClick={() => setMode('admin')} className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-300 ${mode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {mode === 'admin' ? (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-600">Username</label>
                <input type="text" placeholder="Masukkan username" className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-600">Password</label>
                <input type="password" placeholder="••••••••" className="w-full border border-slate-200 p-3.5 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-600">Access Token</label>
              <input type="text" placeholder="MENTEE-XXXXXX" className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-center font-mono text-lg tracking-widest text-blue-700 font-bold" value={token} onChange={e => setToken(e.target.value.toUpperCase())} required />
              <p className="text-xs text-center text-slate-400 mt-2">Dapatkan token khusus dari administrator Anda.</p>
            </div>
          )}
          
          <button type="submit" className={`w-full text-white p-4 rounded-xl font-bold transition-all duration-300 shadow-lg mt-4 ${mode === 'admin' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/30'} hover:-translate-y-0.5`}>
            Masuk ke Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
