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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm mx-auto bg-slate-900/95 backdrop-blur-2xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Volume2 size={20} className="text-blue-400" />
              <h3 className="text-base font-bold text-white">Audio Stream Tracks</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-xs font-bold text-white">Default Audio Stream</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
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
                        ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30'
                        : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs">{label}</span>
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
