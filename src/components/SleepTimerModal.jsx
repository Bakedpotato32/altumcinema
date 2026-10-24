import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Clock, StopCircle } from 'lucide-react';
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
  activeTimerRemaining,
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
              <Moon size={20} className="text-indigo-600" />
              <h3 className="text-base font-black text-slate-900">Sleep Timer</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {activeTimerRemaining !== null && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/70 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-indigo-600 animate-pulse" />
                <span className="text-xs font-mono font-bold text-indigo-900">
                  Turns off in: {formatRemaining(activeTimerRemaining)}
                </span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  onCancelTimer();
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-600 text-[10px] font-bold border border-rose-200 flex items-center gap-1"
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
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  triggerHaptic('selection');
                  onSetTimer(preset.minutes);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-bold transition-all"
              >
                <span>{preset.label}</span>
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
