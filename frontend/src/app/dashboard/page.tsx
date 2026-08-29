"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [latRef, setLatRef] = useState('-7.800500'); // Default demo
  const [lonRef, setLonRef] = useState('110.352600');
  const [title, setTitle] = useState('Evaluasi Akurasi Sensor GPS');
  
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    if (Cookies.get('role') !== 'user' && Cookies.get('role') !== 'admin') {
      router.push('/login');
    }
  }, [router]);

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('role');
    router.push('/login');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Pilih file terlebih dahulu!");

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lat_ref', latRef);
    formData.append('lon_ref', lonRef);

    try {
      const res = await axios.post('http://localhost:8081/api/gps/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      setPlotData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || "Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
    }
  };

  let circleData: any[] = [];
  if (plotData) {
    for (let i = 0; i <= 360; i += 2) {
      const rad = (i * Math.PI) / 180;
      circleData.push({
        x: plotData.mean_distance * Math.cos(rad),
        y: plotData.mean_distance * Math.sin(rad)
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-800 flex flex-col font-sans">
      <header className="bg-white/70 backdrop-blur-md shadow-sm border-b border-slate-200/50 p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-lg shadow-blue-500/20 border border-slate-100 overflow-hidden flex-shrink-0 relative">
            <img src="/logo.jpg" alt="Company Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-indigo-600">Mentee Workspace</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">GPS Analyzer Pro</p>
          </div>
        </div>
        <button onClick={logout} className="bg-white text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm">
          Logout
        </button>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 p-4 lg:p-6 gap-6 max-w-[1600px] w-full mx-auto">
        {/* Left Column - Form */}
        <div className="w-full lg:w-1/3 bg-white/80 backdrop-blur-xl p-6 lg:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white flex flex-col h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
          
          <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Parameter Uji
          </h2>
          
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-start"><span className="mr-2">⚠️</span>{error}</div>}

          <form onSubmit={handleUpload} className="space-y-5 relative z-10">
            <div className="group">
              <label className="block text-sm font-semibold mb-1.5 text-slate-600">File Data (.xlsx / .txt)</label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 rounded-2xl p-4 transition-colors duration-300">
                <input type="file" accept=".xlsx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-all cursor-pointer" required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-600">Latitude Acuan</label>
                <input type="text" value={latRef} onChange={e => setLatRef(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-600">Longitude Acuan</label>
                <input type="text" value={lonRef} onChange={e => setLonRef(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-600">Judul Plot Grafik</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 transition-all duration-300 mt-6 flex justify-center items-center">
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Memproses Data...</>
              ) : 'Visualisasikan Data'}
            </button>
          </form>
        </div>

        {/* Right Column - Chart */}
        <div className="w-full lg:w-2/3 bg-white p-4 lg:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col min-h-[500px] lg:min-h-[600px] relative overflow-hidden">
          {plotData ? (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="mb-4 lg:mb-6 text-center">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2">{title}</h2>
                <div className="inline-flex items-center space-x-2 bg-slate-100 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-xs lg:text-sm text-slate-600 font-medium truncate max-w-[200px] sm:max-w-md">Ref: {plotData.lat_ref}, {plotData.lon_ref}</p>
                </div>
              </div>
              
              <div className="flex-1 w-full relative flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 p-2 lg:p-4">
                <div className="absolute top-2 right-2 lg:top-6 lg:right-6 bg-white/90 backdrop-blur-md p-3 lg:p-4 rounded-2xl shadow-lg shadow-amber-500/10 border border-amber-100 z-10 transform transition hover:scale-105">
                  <p className="text-[10px] lg:text-xs text-amber-600 uppercase font-bold tracking-widest mb-1 flex items-center">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Akurasi
                  </p>
                  <p className="text-lg lg:text-2xl font-black text-amber-500">{plotData.mean_distance.toFixed(3)} <span className="text-xs lg:text-sm font-semibold text-amber-400">m</span></p>
                </div>

                <div className="w-full max-w-full aspect-square flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" aspect={1}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                      <XAxis type="number" dataKey="x" name="Longitude (m)" tickCount={8} domain={['auto', 'auto']} tick={{fill: '#64748b', fontSize: 12}} axisLine={{stroke: '#cbd5e1'}} />
                      <YAxis type="number" dataKey="y" name="Latitude (m)" tickCount={8} domain={['auto', 'auto']} tick={{fill: '#64748b', fontSize: 12}} axisLine={{stroke: '#cbd5e1'}} />
                      <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} formatter={(value: any) => Number(value).toFixed(3) + ' m'} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                      
                      <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                      <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                      
                      <Scatter name="Titik GPS" data={plotData.points} fill="#ef4444" shape="circle" />
                      <Scatter name="Koordinat Pembanding" data={[{x: 0, y: 0}]} fill="#ef4444" shape="cross" />
                      
                      <Scatter 
                        name="Lingkaran Rata-rata" 
                        data={circleData} 
                        fill="transparent" 
                        stroke="#d97706" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        line 
                        shape={<g></g>}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400 relative overflow-hidden min-h-[300px]">
              <div className="absolute w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10 flex flex-col items-center p-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 lg:mb-5 rotate-3 border border-slate-100">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <p className="text-base lg:text-lg font-semibold text-slate-600">Belum Ada Data</p>
                <p className="text-xs lg:text-sm text-slate-500 mt-1 max-w-[250px] lg:max-w-xs text-center">Silakan sesuaikan parameter dan upload file untuk memvisualisasikan grafik.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
