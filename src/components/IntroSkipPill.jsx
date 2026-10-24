import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward, Settings2, X, Check, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

const OP_PRESETS = [
  { label: '45s (Short Intro)', value: 45 },
  { label: '60s (Standard)', value: 60 },
  { label: '75s (TV Show)', value: 75 },
  { label: '85s (Anime OP Standard)', value: 85 },
  { label: '90s (Full Opening)', value: 90 }
];

export const IntroSkipPill = ({
  skipDuration = 85,
  onUpdateDuration,
  onSkipForward
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customVal, setCustomVal] = useState(skipDuration.toString());
  const longPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  // Handle Touch Start: Start 400ms timer for long-press detection
  const handleTouchStart = () => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      triggerHaptic('heavy');
      setIsConfigOpen(true);
    }, 420);
  };

  // Handle Touch End: If not long-pressed, treat as standard skip tap
  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isLongPressTriggeredRef.current) {
      triggerHaptic('medium');
      onSkipForward(skipDuration);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    const parsed = parseInt(customVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      triggerHaptic('success');
      onUpdateDuration(parsed);
      setIsConfigOpen(false);
    }
  };

  return (
    <>
      {/* Floating Frosted Skip Pill */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-blue-600/35 hover:bg-blue-600/50 backdrop-blur-xl border border-blue-400/40 text-white shadow-xl shadow-blue-600/20 flex items-center space-x-1.5 select-none transition-all"
      >
        <FastForward size={14} className="text-blue-300" />
        <span className="text-xs font-mono font-black tracking-tight">
          +{skipDuration}s OP Skip
        </span>
      </motion.button>

      {/* Long-Press Customizer Bottom Drawer */}
      {isConfigOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-md"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative z-10 w-full max-w-sm mx-auto bg-slate-900/95 backdrop-blur-3xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl text-left"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Anime OP Skip Config
                  </h3>
                </div>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Tap to quickly jump past show intros. Choose a standard preset or enter custom seconds:
              </p>

              {/* Presets List */}
              <div className="space-y-2 mb-5">
                {OP_PRESETS.map((p) => {
                  const isSelected = skipDuration === p.value;
                  return (
                    <motion.button
                      key={p.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        triggerHaptic('selection');
                        onUpdateDuration(p.value);
                        setCustomVal(p.value.toString());
                        setIsConfigOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30'
                          : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs">{p.label}</span>
                      {isSelected && <Check size={16} className="text-white" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom Seconds Input Form */}
              <form onSubmit={handleApplyCustom} className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  placeholder="Custom (e.g. 85)"
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-blue-500 font-bold"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Save
                </button>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
