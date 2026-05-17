import React, { useState } from 'react';
import { UserCircle, Key, LogIn, ShieldCheck, GraduationCap, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { loginSiswa, loginPegawai } from '../services/api';
import { UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<UserRole>('siswa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [nis, setNis] = useState('');
  const [pin, setPin] = useState('');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userData;
      if (role === 'siswa') {
        userData = await loginSiswa('siswa', nis, pin);
      } else {
        userData = await loginPegawai('pegawai', nip, password);
      }
      
      onLoginSuccess({
        id: userData.replid || userData.id || userData.nip || userData.nis,
        name: userData.nama || userData.name,
        role: role,
        nis: userData.nis,
        nip: userData.nip,
        nisn: userData.nisn,
        foto: userData.foto,
        idkelas: userData.idkelas,
      });
    } catch (err: any) {
      setError(err.message || 'Verification failed. Input data correctly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col min-h-[600px] justify-center px-4">
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200"
        >
          <ShieldCheck className="h-8 w-8" />
        </motion.div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Hidis <span className="text-indigo-600">v7</span></h1>
        <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">Secure Access Protocol</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[40px] p-8 shadow-2xl shadow-indigo-100/50">
        <div className="mb-8 flex gap-1 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setRole('siswa')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
              role === 'siswa' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            SISWA
          </button>
          <button
            onClick={() => setRole('pegawai')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
              role === 'pegawai' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-400'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            PEGAWAI
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {role === 'siswa' ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">NIS ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <UserCircle className="h-4 w-4 text-indigo-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300"
                    placeholder="NIS Anda"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Key className="h-4 w-4 text-indigo-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300"
                    placeholder="••••••"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">NIP Access</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <UserCircle className="h-4 w-4 text-indigo-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300"
                    placeholder="NIP Pegawai"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Key className="h-4 w-4 text-indigo-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] font-black uppercase text-red-500 tracking-tight"
            >
              Err: {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-xs font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] mt-2"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Akses Dashboard
                <LogIn className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="text-center mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 HIDIS Education Systems</p>
    </div>
  );
};
