import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gauge, Check } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

export const PlaybackSpeedModal = ({
  isOpen,
  onClose,
  currentSpeed,
  onSelectSpeed
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

        {/* Drawer Card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg mx-auto bg-slate-900/95 backdrop-blur-3xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2">
              <Gauge size={20} className="text-blue-400" />
              <h3 className="text-base font-bold text-white">Playback Speed</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {SPEED_OPTIONS.map((spd) => {
              const isSelected = currentSpeed === spd;
              return (
                <motion.button
                  key={spd}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectSpeed(spd);
                    onClose();
                  }}
                  className={`py-3 px-3 rounded-2xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span>{spd === 1.0 ? '1.0x (Normal)' : `${spd}x`}</span>
                  {isSelected && <Check size={14} className="text-blue-200" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
