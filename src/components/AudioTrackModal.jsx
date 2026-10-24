import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Check } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const AudioTrackModal = ({
  isOpen,
  onClose,
  tracks = [],
  activeTrackIndex = 0,
  onSelectTrack
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm mx-auto bg-white/95 backdrop-blur-3xl border-t border-white/90 rounded-t-[36px] p-6 pb-10 shadow-2xl text-left"
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Volume2 size={20} className="text-blue-600" />
              <h3 className="text-base font-black text-slate-900">Audio Stream Tracks</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tracks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                <p className="text-xs font-bold text-slate-800">Default Audio Stream</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Single primary audio track playing through hardware decoder.
                </p>
              </div>
            ) : (
              tracks.map((track, idx) => {
                const isSelected = activeTrackIndex === idx;
                const label = track.label || track.language || `Audio Track ${idx + 1}`;

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectTrack(idx);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/25 border border-blue-600'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-medium">{label}</span>
                    {isSelected && <Check size={16} className="text-white" />}
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
