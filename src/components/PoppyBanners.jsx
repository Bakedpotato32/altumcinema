import React from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, Shield, PlusCircle, CheckCircle } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const PoppyBanners = ({ onScanClick, onSafeClick }) => {
  return (
    <div className="grid grid-cols-2 gap-3.5 px-5 mb-5">
      {/* 🌊 Electric Sky Blue Banner */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic('light');
          onScanClick();
        }}
        className="p-4 rounded-3xl bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 text-white text-left shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between h-34 focus:outline-none"
      >
        <div className="flex items-center justify-between w-full">
          <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-blue-50">
            Storage Scan
          </span>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
            <PlusCircle size={16} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-white leading-tight">
            Add Videos
          </h4>
          <p className="text-[10px] text-blue-100/90 font-medium mt-0.5">
            Import local folders
          </p>
        </div>

        <div className="w-full py-1.5 px-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center text-[10px] font-bold text-white flex items-center justify-center gap-1">
          <FolderPlus size={12} />
          <span>+ Scan Files</span>
        </div>
      </motion.button>

      {/* 🍓 Coral Tangerine Banner */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic('light');
          onSafeClick();
        }}
        className="p-4 rounded-3xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 text-white text-left shadow-lg shadow-rose-500/20 relative overflow-hidden flex flex-col justify-between h-34 focus:outline-none"
      >
        <div className="flex items-center justify-between w-full">
          <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-rose-50">
            Protected
          </span>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
            <CheckCircle size={16} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-white leading-tight">
            Private Vault
          </h4>
          <p className="text-[10px] text-rose-100/90 font-medium mt-0.5">
            PIN locked storage
          </p>
        </div>

        <div className="w-full py-1.5 px-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center text-[10px] font-bold text-white flex items-center justify-center gap-1">
          <Shield size={12} />
          <span>✓ Open Safe</span>
        </div>
      </motion.button>
    </div>
  );
};
