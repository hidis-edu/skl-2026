/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { SettingsModal } from './components/SettingsModal';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Check for existing session in a real app
    // For now, just clear the splash screen
    const timer = setTimeout(() => setIsInitialLoad(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isInitialLoad) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-12 w-12 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative flex min-h-screen items-center justify-center bg-slate-50 p-6"
          >
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-100/50 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-slate-200/50 blur-[120px]" />
            </div>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="absolute right-8 top-8 rounded-full bg-white p-3 shadow-lg shadow-slate-200/50 transition-all hover:scale-110 hover:shadow-xl active:scale-95 group border border-slate-100"
            >
              <Settings className="h-6 w-6 text-slate-500 group-hover:rotate-90 transition-transform duration-500" />
            </button>

            <LoginView onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <DashboardView user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
