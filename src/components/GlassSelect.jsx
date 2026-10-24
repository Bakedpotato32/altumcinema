import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const GlassSelect = ({ isOpen, onClose, title, options, selectedValue, onSelect }) => {
  useEffect(() => {
    if (isOpen) triggerHaptic('light');
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 w-full max-w-lg mx-auto bg-slate-900/90 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl p-6 pb-10 shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  triggerHaptic('selection');
                  onClose();
                }}
                className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {options.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelect(opt.value);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600/40 via-indigo-600/40 to-violet-600/30 border border-blue-400/40 text-white font-semibold'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    {isSelected && <Check size={18} className="text-blue-400" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
