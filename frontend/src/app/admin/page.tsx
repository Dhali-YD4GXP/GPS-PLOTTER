"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function AdminDashboard() {
  const [tokens, setTokens] = useState<any>({});
  
  // Form state
  const [tokenCode, setTokenCode] = useState('');
  const [researchTitle, setResearchTitle] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [menteeName, setMenteeName] = useState('');
  const [months, setMonths] = useState(1);
  
  const router = useRouter();

  const fetchTokens = async () => {
    try {
      const res = await axios.get('https://bengkelinovasi-gpsplotter.my.id/api/admin/tokens', {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      setTokens(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
         router.push('/login');
      }
    }
  };

  useEffect(() => {
    if (Cookies.get('role') !== 'admin') {
      router.push('/login');
      return;
    }
    fetchTokens();
  }, [router]);

  const generateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('https://bengkelinovasi-gpsplotter.my.id/api/admin/tokens', { 
        token_code: tokenCode,
        research_title: researchTitle,
        school_name: schoolName,
        mentee_name: menteeName,
        duration_months: Number(months) 
      }, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      
      // Reset form
      setTokenCode('');
      setResearchTitle('');
      setSchoolName('');
      setMenteeName('');
      setMonths(1);
      
      fetchTokens();
      alert("Token berhasil dibuat!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal generate token");
    }
  };

  const deactivateToken = async (tokenId: string) => {
    if (!confirm(`Yakin ingin menonaktifkan token ${tokenId}?`)) return;
    try {
      await axios.post('https://bengkelinovasi-gpsplotter.my.id/api/admin/tokens/deactivate', { token: tokenId }, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` }
      });
      fetchTokens();
    } catch (err) {
      alert("Gagal menonaktifkan token");
    }
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('role');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-blue-900">Admin Panel (Token Management)</h1>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md font-medium transition shadow-sm hover:shadow-md">Logout</button>
        </div>

        <div className="mb-10 p-8 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
          <div className="mb-6 border-b border-blue-200 pb-4">
            <h2 className="text-xl font-bold text-blue-800 mb-1">Registrasi Mentee Baru</h2>
            <p className="text-sm text-blue-600">Tentukan kode token kustom beserta detail identitas mentee.</p>
          </div>
          
          <form onSubmit={generateToken} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-blue-900">Kode Token (Kustom)</label>
              <input type="text" placeholder="Misal: ALDI-GPS-2024" value={tokenCode} onChange={e => setTokenCode(e.target.value)} className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-blue-900">Nama Lengkap Mentee / Anak</label>
              <input type="text" placeholder="Misal: Aldi Taher" value={menteeName} onChange={e => setMenteeName(e.target.value)} className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-blue-900">Asal Sekolah</label>
              <input type="text" placeholder="Misal: SMAN 1 Jakarta" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-blue-900">Judul Penelitian</label>
              <input type="text" placeholder="Misal: Akurasi GPS M8N" value={researchTitle} onChange={e => setResearchTitle(e.target.value)} className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-blue-900">Masa Aktif Token</label>
              <select value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                <option value={1}>1 Bulan</option>
                <option value={2}>2 Bulan</option>
                <option value={3}>3 Bulan</option>
                <option value={4}>4 Bulan</option>
                <option value={5}>5 Bulan</option>
                <option value={12}>1 Tahun</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                Buat Token Mentee
              </button>
            </div>
          </form>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">Daftar Mentee Terdaftar</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse bg-white whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-700">Kode Token</th>
                <th className="p-4 font-bold text-slate-700">Identitas</th>
                <th className="p-4 font-bold text-slate-700">Penelitian</th>
                <th className="p-4 font-bold text-slate-700">Masa Aktif</th>
                <th className="p-4 font-bold text-slate-700 text-center">Status</th>
                <th className="p-4 font-bold text-slate-700 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(tokens).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((tk: any) => (
                <tr key={tk.token} className="border-b hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-blue-600 font-bold bg-blue-50/30">{tk.token}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{tk.mentee_name || '-'}</p>
                    <p className="text-xs text-slate-500">{tk.school_name || '-'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-slate-700 max-w-xs truncate" title={tk.research_title}>{tk.research_title || '-'}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    S/D: {new Date(tk.expires_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    {!tk.is_active ? (
                      <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Nonaktif</span>
                    ) : new Date(tk.expires_at) < new Date() ? (
                      <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Expired</span>
                    ) : (
                      <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Aktif</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {tk.is_active && (
                      <button 
                        onClick={() => deactivateToken(tk.token)}
                        className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Nonaktifkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {Object.keys(tokens).length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Belum ada token mentee yang didaftarkan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
