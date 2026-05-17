import React, { useState } from 'react';
import { Settings, X, Globe, Save, MessageCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBaseUrl, setBaseUrl, refreshApiBaseUrl, sendWhatsAppMessage } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(getBaseUrl());
  const [saved, setSaved] = useState(false);
  
  const [waNumber, setWaNumber] = useState('');
  const [waText, setWaText] = useState('Tes Terkoneksi Hidis Gateway...');
  const [testingWa, setTestingWa] = useState(false);
  const [waStatus, setWaStatus] = useState<string | null>(null);

  const normalizePhone = (phone: string) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    } else if (clean.startsWith("8")) {
      clean = "62" + clean;
    }
    return clean;
  };

  const handleTestWa = async () => {
    if (!waNumber) {
      setWaStatus('Masukkan nomor!');
      return;
    }
    setTestingWa(true);
    setWaStatus(null);
    try {
      const number = normalizePhone(waNumber);
      const result = await sendWhatsAppMessage(number, waText);
      // More lenient check since we added success: true in the server wrapper
      if (result.success || result.key || result.status === 'sukses' || result.status === 'success' || result.messageId) {
        setWaStatus('SUCCESS');
      } else {
        setWaStatus('FAILED');
        console.error('WA Test Failed:', result);
      }
    } catch (err) {
      setWaStatus('ERROR');
      console.error(err);
    } finally {
      setTestingWa(false);
    }
  };

  const handleSave = () => {
    setBaseUrl(url);
    refreshApiBaseUrl();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 px-6">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Connection Setup</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Base API URL
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-mono transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="https://api.hidis.id"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Protocol</label>
                  <div className="text-[10px] px-3 py-2 bg-slate-100 rounded text-slate-600 font-bold border border-slate-200/50">REST / HTTPS</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Auth Hook</label>
                  <div className="text-[10px] px-3 py-2 bg-slate-100 rounded text-slate-600 font-bold border border-slate-200/50">/api/jbsuser</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-green-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">WhatsApp Test</h3>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-mono focus:border-green-500 focus:bg-white focus:outline-none"
                    placeholder="Nomor WA (62...)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={waText}
                      onChange={(e) => setWaText(e.target.value)}
                      className="flex-1 rounded-md border border-slate-200 bg-slate-50 py-2 px-3 text-[10px] font-medium focus:border-green-500 focus:bg-white focus:outline-none"
                      placeholder="Pesan test..."
                    />
                    <button
                      onClick={handleTestWa}
                      disabled={testingWa}
                      className="px-3 bg-green-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
                    >
                      {testingWa ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Kirim"}
                    </button>
                  </div>
                  {waStatus && (
                    <p className={`text-[8px] font-black uppercase italic ${waStatus === 'SUCCESS' ? 'text-green-600' : 'text-red-500'}`}>
                      STATUS: {waStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 bg-slate-50/50 p-4 px-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saved}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  saved 
                    ? 'bg-green-600 text-white shadow-green-900/20' 
                    : 'bg-indigo-600 text-white shadow-indigo-900/20 hover:bg-indigo-700 shadow-md'
                } active:scale-95`}
              >
                {saved ? (
                  <>STATUS: UPDATED</>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    UPDATE CONFIGURATION
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
