import React, { useState } from 'react';
import { UserCircle, Key, LogIn, ShieldCheck, GraduationCap, Briefcase, MessageCircle, RefreshCw, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginSiswa, loginPegawai, searchStudentByPhone, sendWhatsAppMessage } from '../services/api';
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

  // Forgot credentials states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone) return;

    setForgotLoading(true);
    setForgotStatus(null);

    try {
      // 1. Search student by phone (use raw input for DB search as suggested by user example)
      const res = await searchStudentByPhone(forgotPhone);
      
      if ((res.status === 'sukses' || res.success) && res.data) {
        // Normalize data to array if it is a single object
        const students = Array.isArray(res.data) ? res.data : [res.data];
        
        if (students.length === 0) {
          setForgotStatus({ type: 'error', message: 'Nomor HP tidak terdaftar.' });
          return;
        }

        // 2. Format message using correct fields (pinsiswa)
        let message = `*INFO LOGIN HIDIS*\n\nBerikut adalah data login siswa yang ditemukan:\n\n`;
        students.forEach((s: any, idx: number) => {
          const studentPin = s.pinsiswa || s.pin || 'Tidak diset';
          message += `${idx + 1}. *${s.nama}*\n   NIS: \`${s.nis}\`\n   PIN: \`${studentPin}\`\n\n`;
        });
        message += `_Gunakan data di atas untuk login ke aplikasi Hidis._`;

        // 3. Send via WA (Normalization required for Gateway)
        const normalizePhone = (phone: string) => {
          let clean = phone.replace(/\D/g, "");
          if (clean.startsWith("0")) {
            clean = "62" + clean.substring(1);
          } else if (clean.startsWith("8")) {
            clean = "62" + clean;
          }
          return clean;
        };

        const waRes = await sendWhatsAppMessage(normalizePhone(forgotPhone), message);
        
        if (waRes.success || waRes.key || waRes.messageId || waRes.status === 'sukses' || waRes.status === 'success') {
          setForgotStatus({ type: 'success', message: 'Data NIS/PIN telah dikirim ke WhatsApp Anda!' });
        } else {
          throw new Error('Gagal mengirim WhatsApp. Cek koneksi gateway.');
        }
      } else {
        setForgotStatus({ type: 'error', message: 'Nomor HP tidak terdaftar atau tidak ditemukan.' });
      }
    } catch (err: any) {
      setForgotStatus({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setForgotLoading(false);
    }
  };

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

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                >
                  Lupa NIS/PIN?
                </button>
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

      {/* Forgot Credentials Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <MessageCircle className="h-6 w-6 text-indigo-600" />
                </div>
                <button 
                  onClick={() => setShowForgotModal(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-800 leading-tight">Lupa NIS/PIN?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6">Masukkan Nomor HP Orang Tua yang terdaftar</p>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp Number</p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-0 pointer-events-none">
                      <Smartphone className="h-3 w-3 text-indigo-400" />
                    </div>
                    <input 
                      type="text"
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-black text-slate-700 pl-6 p-0"
                      placeholder="628123xxx"
                    />
                  </div>
                </div>

                {forgotStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-[9px] font-black uppercase text-center ${
                      forgotStatus.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}
                  >
                    {forgotStatus.message}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <MessageCircle className="h-3 w-3" />
                  )}
                  {forgotLoading ? 'Mencari...' : 'Terima Data via WA'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
