import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Folder, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../services/haptics';

export const HeroRecentCard = ({ recentVideo, onResumePlay }) => {
  if (!recentVideo) return null;

  const duration = recentVideo.duration || 100;
  const current = recentVideo.currentTime || 0;
  const progressPercent = Math.min(100, Math.max(0, (current / duration) * 100));

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingSec = Math.max(0, duration - current);

  return (
    <div className="px-5 mb-5">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-[32px] p-5 text-white shadow-xl shadow-indigo-600/25 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider text-blue-100">
            <Sparkles size={11} className="text-amber-300" />
            Continue Watching
          </span>
          <span className="text-[11px] font-bold text-blue-100/80 flex items-center gap-1">
            <Folder size={12} /> {recentVideo.folder || 'Downloads'}
          </span>
        </div>

        {/* Main Content Row: Thumbnail + Info */}
        <div className="flex items-center space-x-3.5 relative z-10">
          {/* YouTube-Style Video Thumbnail with Bottom Red Progress Bar */}
          <div className="relative w-32 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-white/20 shrink-0 shadow-lg">
            {recentVideo.thumbnail ? (
              <img
                src={recentVideo.thumbnail}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800">
                <Play size={24} className="text-white/60 fill-white/40" />
              </div>
            )}

            {/* Timestamp Badge */}
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-[9px] font-mono font-bold text-white tracking-tight">
              {formatTime(duration)}
            </span>

            {/* YouTube Red Bottom Progress Bar */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/30">
              <div
                className="h-full bg-rose-500 shadow-sm shadow-rose-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Title & Time Remaining Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-white truncate leading-snug">
              {recentVideo.name}
            </h3>
            <p className="text-[11px] text-blue-100/90 font-medium mt-1">
              {formatTime(remainingSec)} left • {Math.round(progressPercent)}% completed
            </p>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                triggerHaptic('medium');
                onResumePlay(recentVideo);
              }}
              className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md shadow-black/10 inline-flex items-center gap-1.5 hover:bg-blue-50 transition-colors"
            >
              <Play size={12} className="fill-slate-900" />
              <span>Resume</span>
              <ArrowUpRight size={13} className="text-slate-500" />
            </motion.button>
          </div>
        </div>

        {/* Mini Stats Footer Strip */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100/70 font-semibold relative z-10">
          <span>Active Session Resume</span>
          <span className="text-white font-mono font-bold">
            {formatTime(current)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
