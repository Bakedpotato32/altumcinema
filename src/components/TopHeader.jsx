import React from 'react';
import { motion } from 'framer-motion';
import { FolderPlus } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const TopHeader = ({ onScanClick }) => {
  return (
    <header className="relative z-10 px-5 pt-8 pb-3 flex items-center justify-between">
      {/* Left Avatar & Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25 border border-white/60">
          A
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-base font-black tracking-tight text-slate-900">
              ALTUMCINEMA
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Local Storage Vault
          </p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center space-x-2">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            triggerHaptic('light');
            onScanClick();
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold text-xs shadow-md shadow-rose-500/20"
        >
          <FolderPlus size={14} />
          <span>+ Scan</span>
        </motion.button>

        <span className="px-2.5 py-1.5 rounded-xl border border-slate-200/90 bg-white/70 text-[11px] font-bold text-slate-700 shadow-sm">
          HD
        </span>
      </div>
    </header>
  );
};
