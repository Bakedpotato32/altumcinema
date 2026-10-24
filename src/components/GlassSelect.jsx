import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const GlassSelect = ({
  isOpen,
  onClose,
  title = 'Options',
  options = [],
  selectedValue,
  onSelect
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Light Neo-Glass Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg mx-auto bg-white/95 backdrop-blur-3xl border-t border-white/90 rounded-t-[36px] p-6 pb-10 shadow-2xl text-left max-h-[82vh] flex flex-col"
        >
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onClose();
              }}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Options List */}
          <div className="space-y-2 overflow-y-auto pr-1">
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelect(opt.value);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500'
                      : 'bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200/70'
                  }`}
                >
                  <span className="text-left font-medium">{opt.label}</span>
                  {isSelected && <Check size={16} className="text-white shrink-0 ml-2" />}
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
