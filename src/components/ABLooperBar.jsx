import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, RotateCcw, Check, X } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const ABLooperBar = ({
  isOpen,
  onClose,
  currentTime,
  loopA,
  loopB,
  onSetA,
  onSetB,
  onClearLoop
}) => {
  if (!isOpen) return null;

  const formatTime = (sec) => {
    if (sec === null || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLoopActive = loopA !== null && loopB !== null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="px-4 py-2.5 rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/20 text-white shadow-2xl flex items-center justify-between gap-2 max-w-sm mx-auto mb-2 pointer-events-auto"
      >
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-xl ${isLoopActive ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/10 text-slate-300'}`}>
            <Repeat size={16} className={isLoopActive ? 'animate-spin-slow' : ''} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase block">
              A-B Scene Loop
            </span>
            <span className="text-xs font-mono font-black text-white">
              {formatTime(loopA)} ➔ {formatTime(loopB)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Set Point A */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              triggerHaptic('selection');
              onSetA(currentTime);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-black border transition-all ${
              loopA !== null
                ? 'bg-blue-600/40 border-blue-400 text-blue-200'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
            }`}
          >
            {loopA !== null ? `A: ${formatTime(loopA)}` : 'Set [A]'}
          </motion.button>

          {/* Set Point B */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              triggerHaptic('selection');
              if (loopA !== null && currentTime > loopA) {
                onSetB(currentTime);
              } else {
                onSetB(currentTime);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-black border transition-all ${
              loopB !== null
                ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
            }`}
          >
            {loopB !== null ? `B: ${formatTime(loopB)}` : 'Set [B]'}
          </motion.button>

          {/* Clear Loop */}
          {(loopA !== null || loopB !== null) && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic('light');
                onClearLoop();
              }}
              className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
            >
              <RotateCcw size={14} />
            </motion.button>
          )}

          {/* Close Bar */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
