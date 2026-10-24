import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Clock, Check, StopCircle } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

const SLEEP_PRESETS = [
  { label: '15 Minutes', minutes: 15 },
  { label: '30 Minutes', minutes: 30 },
  { label: '45 Minutes', minutes: 45 },
  { label: '60 Minutes', minutes: 60 },
  { label: 'At End of Current Video', minutes: -1 }
];

export const SleepTimerModal = ({
  isOpen,
  onClose,
  activeTimerRemaining, // in seconds, or null
  onSetTimer,
  onCancelTimer
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const formatRemaining = (seconds) => {
    if (seconds === null) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

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
          className="relative z-10 w-full max-w-sm mx-auto bg-slate-900/95 backdrop-blur-3xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Moon size={20} className="text-indigo-400" />
              <h3 className="text-base font-bold text-white">Sleep Timer</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {activeTimerRemaining !== null && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-indigo-300 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white">
                  Shuts off in: {formatRemaining(activeTimerRemaining)}
                </span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onCancelTimer();
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1"
              >
                <StopCircle size={12} />
                <span>Turn Off</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {SLEEP_PRESETS.map((preset) => (
              <motion.button
                key={preset.minutes}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  triggerHaptic('selection');
                  onSetTimer(preset.minutes);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all"
              >
                <span className="text-xs font-medium">{preset.label}</span>
                <Clock size={15} className="text-slate-400" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
