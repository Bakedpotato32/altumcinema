import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, Play, FileText } from 'lucide-react';
import { searchSubtitles } from '../services/subtitles';
import { triggerHaptic } from '../services/haptics';

export const SubtitleSearchModal = ({
  isOpen,
  onClose,
  subtitles = [],
  onSeekToTime
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen || typeof document === 'undefined') return null;

  const matches = searchSubtitles(subtitles, query);

  const formatTime = (seconds) => {
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const remS = s % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${remS < 10 ? '0' : ''}${remS}`;
    }
    return `${m}:${remS < 10 ? '0' : ''}${remS}`;
  };

  const handleSelectLine = (time) => {
    triggerHaptic('medium');
    onSeekToTime(time);
    onClose();
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
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg mx-auto bg-slate-900/95 backdrop-blur-3xl border-t border-white/15 rounded-t-[32px] p-6 pb-10 shadow-2xl max-h-[85vh] flex flex-col"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Search size={18} className="text-blue-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Dialogue Scene Jump
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dialogue phrase or word..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
            {query.trim() === '' ? (
              <div className="text-center py-12 text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30 text-blue-400" />
                <p className="text-xs font-semibold">Type a dialogue line</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Search across all {subtitles.length} lines in this video
                </p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xs">No matching dialogue found for "{query}"</p>
              </div>
            ) : (
              matches.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectLine(item.startTime)}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="pr-3 min-w-0">
                    <p className="text-xs font-medium text-slate-100 whitespace-pre-line leading-relaxed">
                      {item.text}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-blue-600/30 text-blue-300 font-mono text-[10px] font-bold shrink-0 border border-blue-500/30">
                    <Clock size={11} />
                    <span>{formatTime(item.startTime)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
