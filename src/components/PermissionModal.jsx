import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, HardDrive, Film, Sparkles, AlertCircle } from 'lucide-react';
import { requestDeviceStoragePermissions } from '../services/permissions';
import { triggerHaptic } from '../services/haptics';

export const PermissionModal = ({ isOpen, onGranted }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleGrant = async () => {
    triggerHaptic('medium');
    setIsRequesting(true);
    setErrorMessage('');

    const granted = await requestDeviceStoragePermissions();
    setIsRequesting(false);

    if (granted) {
      triggerHaptic('success');
      onGranted();
    } else {
      triggerHaptic('error');
      setErrorMessage(
        'Storage permission is required for AltumCinema to discover video folders automatically.'
      );
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md"
        />

        {/* Bottom Sheet Card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg mx-auto bg-white/95 backdrop-blur-3xl border-t border-white/90 rounded-t-[36px] p-6 pb-10 shadow-2xl text-left"
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/25 mb-4">
            <HardDrive size={30} />
          </div>

          <div className="text-center px-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-amber-500" />
              Device Storage Setup
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Grant Storage Access
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              To automatically display your videos, movie downloads, and WhatsApp clips like MX Player, Android requires you to grant storage access.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Film size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Auto Directory Discovery</h4>
                <p className="text-[11px] text-slate-500">Auto-scans Camera, WhatsApp, Downloads, and Movies.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Offline & Private</h4>
                <p className="text-[11px] text-slate-500">All scanning remains local. No files are uploaded.</p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGrant}
            disabled={isRequesting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 border border-blue-400/30 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            <span>{isRequesting ? 'Requesting Permission...' : 'Allow & Start Scanning'}</span>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
